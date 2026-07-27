# Sistema de Telemetría y Monitoreo de Flotas GPS

Prototipo fullstack: API REST en **Express + PostgreSQL**, panel **React + Leaflet** con actualización en tiempo real vía **SSE** (fallback a polling), y un **simulador** de telemetría independiente.

## Cómo correr en local (3 comandos)

```bash
docker compose up -d
npm run install:all && npm run db:migrate
```

En tres terminales:

```bash
npm run dev:backend
npm run dev:frontend
npm run simulator
```

- API: http://localhost:3001  
- Panel: http://localhost:5173  
- Health: http://localhost:3001/health  

Copia `.env.example` si necesitas ajustar URLs. Postgres local corre en el puerto **5434** (para no chocar con otras instalaciones en 5432). El backend ya incluye `backend/.env` de ejemplo.

## Arquitectura

```
simulator ──POST /gps──► Express API ──► PostgreSQL
                              ▲
React SPA ──GET /vehicles─────┤
         └──GET /events (SSE)─┘
```

**Por qué este stack**

| Elección | Motivo |
|----------|--------|
| Express | API REST clara, fácil de explicar y extender |
| PostgreSQL | Persistencia real, apta para Render y para historial GPS |
| React + Vite | SPA rápida; encaja con el panel de control |
| Leaflet | Mapa gratuito sin API key (requisito) |
| SSE | Push unidireccional al dashboard (bonus); más simple que WebSockets |
| Polling 5s | Fallback si SSE se corta (proxies / free tier) |

### Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Obtiene JWT (rate limit anti-brute-force) |
| GET | `/auth/me` | Bearer | Usuario del token |
| POST | `/gps` | Bearer | Ingesta de coordenada (201 / 400) |
| GET | `/vehicles` | Bearer | Estado actual de todos los vehículos |
| GET | `/vehicles/:id` | Bearer | Un vehículo (404 si no existe) |
| DELETE | `/vehicles/:id` | Bearer | Elimina vehículo y sus puntos (cascada) |
| GET | `/events` | Bearer o `?token=` | Stream SSE (EventSource no soporta headers) |
| GET | `/health` | No | Healthcheck (+ estado DB) |

**Credenciales demo (seed automático):**
- Email: `admin@fleet.local`
- Password: `FleetAdmin123!`

Cámbialas en producción con `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `JWT_SECRET`.

### Lógica de estados

Evaluada con el `timestamp` del payload (no con la hora de recepción del servidor):

1. **Sin señal** — último punto hace más de 2 minutos  
2. **Detenido** — misma lat/lng (igualdad exacta) durante más de 1 minuto, o un solo punto reciente  
3. **En movimiento** — coordenadas distintas en los últimos 60 segundos  

### Simulador

- 3 vehículos (`VH-001`, `VH-002` en movimiento; `VH-003` estático)  
- Envío cada 3–5 s  
- ~10% de requests inválidos a propósito  
- Variable `API_URL` (local o Render)

## Despliegue en Render

Incluye [`render.yaml`](render.yaml) como guía (Blueprint) o crea los servicios a mano:

### Opción A — Blueprint

1. Sube el repo a GitHub.  
2. En Render: **New → Blueprint** → selecciona el repo.  
3. Completa `CORS_ORIGIN` (URL del frontend) y `VITE_API_URL` (URL de la API) cuando Render te las pida / tras el primer deploy.

### Opción B — Manual (recomendada la primera vez)

1. **PostgreSQL** en Render (plan free). Copia la **External Database URL**.  
2. **Web Service** para la API:
   - Root directory: `backend`
   - Build: `npm install`
   - Start: `npm run db:migrate && npm start`
   - Env:
     - `DATABASE_URL` = URL de Postgres (Render)
     - `DATABASE_SSL=true`
     - `CORS_ORIGIN` = `https://TU-FRONTEND.onrender.com`
     - `JWT_SECRET` = string aleatorio ≥ 32 caracteres
     - `ADMIN_EMAIL` / `ADMIN_PASSWORD` = credenciales del admin
     - `NODE_VERSION=20`
     - `NODE_ENV=production`
3. **Static Site** para el panel:
   - Root directory: `frontend`
   - Build: `npm install && npm run build`
   - Publish directory: `dist`
   - Env: `VITE_API_URL=https://TU-API.onrender.com` (sin slash final)
4. Vuelve a desplegar el frontend si cambiaste `VITE_API_URL` (Vite la incrusta en el build).

Para la demo del video, apunta el simulador a producción:

```bash
# Windows PowerShell
$env:API_URL="https://TU-API.onrender.com"; npm run simulator
```

**Nota free tier:** el servicio puede dormir (cold start). El primer request puede tardar ~30–60 s.

### URLs de producción

- API: _pendiente tras deploy_  
- Frontend: _pendiente tras deploy_  

## Video de sustentación

_Enlace YouTube (No listado): pendiente de grabación_

### Guion sugerido (3–7 min)

1. Mostrar el dashboard en Render.  
2. Arrancar el simulador y ver `POST /gps` en la terminal.  
3. Señalar estados: movimiento, detenido (VH-003), y sin señal (pausar un vehículo ~2 min o explicar la regla).  
4. Abrir un marcador en el mapa.  
5. Explicar 2 decisiones: Postgres + cálculo de estados; SSE con fallback a polling.  
6. Mencionar el uso de IA con criterio (ver abajo).

## Reflexión — DELETE con Redis + base de datos (03.1 D)

Si existiera un caché (Redis) y una base persistente, al eliminar un vehículo hay que **evitar inconsistencias** entre ambos. Lo que debe garantizarse:

1. **Fuente de verdad:** la base de datos es la autoridad. El borrado debe confirmarse ahí.  
2. **Invalidación de caché:** tras un DELETE exitoso en DB (o en la misma unidad lógica de trabajo), eliminar o invalidar las claves relacionadas en Redis (`vehicle:{id}`, listados cacheados, etc.).  
3. **Orden seguro:** preferible **DB primero, luego caché**. Si fallara el borrado en DB y ya hubieras limpiado Redis, el siguiente GET podría ir a DB y “revivir” datos que creías borrados, o peores escenarios con listados stale.  
4. **Atomicidad práctica:** en sistemas distribuidos no hay transacción única Redis+Postgres; se mitiga con invalidación agresiva, TTLs cortos, o patrones tipo outbox. Lo crítico es no dejar en caché un vehículo que ya no existe en DB.

En este prototipo no hay Redis: el DELETE borra el vehículo y, por `ON DELETE CASCADE`, todos sus `gps_points` en la misma operación de base de datos.

## Tests y Docker

```bash
npm test
docker compose up -d
```

- Tests unitarios: validación GPS + estados.  
- Docker Compose: Postgres 16 en puerto **5434**.  
- `backend/Dockerfile` opcional para empaquetar la API.

## Reporte de IA

### 01 — ¿Qué herramientas de IA usaste?

Cursor (agente Composer) como copiloto para scaffolding, estructura del monorepo, validaciones, servicio de estados, panel React/Leaflet, simulador, Docker Compose y borrador del README.

### 02 — ¿Para qué tareas específicas te apoyaste en la IA?

- Armar la estructura Express + Postgres + React de forma ordenada  
- Implementar validaciones HTTP y la máquina de estados de telemetría  
- Integrar SSE con fallback a polling  
- Generar el simulador con inyección de errores ~10%  
- Redactar documentación y checklist de deploy en Render  

### 03 — ¿Qué error de la IA encontraste y cómo lo corregiste?

Un detalle típico: rutas de `dotenv` / `import.meta.url` en Windows (`pathname` con `/C:/...`) rompían la carga de `.env` en el simulador. Se corrigió usando `fileURLToPath` + `path.join`. También se revisó a mano la prioridad de estados (Sin señal > Detenido > En movimiento) y los iconos por defecto de Leaflet bajo Vite, que suelen romperse sin el fix de `L.Icon.Default`.

## Frontend — estructura y buenas prácticas

```
frontend/src
  api/           # client HTTP + authApi + vehiclesApi
  auth/          # AuthContext, ProtectedRoute, token storage
  pages/         # LoginPage, DashboardPage, NotFoundPage
  components/    # UI reutilizable
  hooks/         # useVehicles (SSE + polling)
  config/        # env centralizado
```

- **React Router**: `/login`, `/` (protegida), `*` 404  
- **AuthContext**: sesión JWT, bootstrap con `/auth/me`  
- **Rutas protegidas / públicas**: redirect automático  
- **Rewrite SPA** en Render (`/* → /index.html`) para deep links  
- **ErrorBoundary** para no dejar la UI en blanco  


| Medida | Detalle |
|--------|---------|
| **JWT (Bearer)** | Rutas de negocio protegidas; login con bcrypt (cost 12) |
| **Seed admin** | Usuario admin creado en migrate/startup (sin passwords en claro en DB) |
| **DTOs estrictos** | GPS + Login: allowlist de campos; rechaza extras |
| **Validación de params** | `/vehicles/:id` valida formato seguro del id |
| **SQL parametrizado** | Consultas con `$1…$n` vía `pg` |
| **Helmet** | Headers HTTP de seguridad; `x-powered-by` desactivado |
| **Rate limit** | Login 20/15min; `/gps` 120/min; API general 300/min |
| **Límite de body** | JSON máx. 100kb; sin filtrar stack traces al cliente |
| **CORS** | Configurable; headers `Authorization` permitidos |
| **Config central** | `JWT_SECRET` obligatorio en production (≥32 chars) |
| **Logs** | Morgan (sin spamear `/health`) |
| **Graceful shutdown** | SIGTERM/SIGINT cierran HTTP + pool Postgres |
| **Health** | Verifica conectividad a la DB (503 si cae) |
| **SSE token** | `?token=` solo en `/events` (limitación de EventSource) |

Credenciales inválidas siempre responden el mismo mensaje (`Credenciales inválidas`) para no filtrar si el email existe.

## Decisiones técnicas adicionales

- **Mapa con datos reales** del API (no mock).  
- **Alta implícita** de vehículo en el primer `POST /gps`.  
- Commits por feature recomendados al subir el repo.  
