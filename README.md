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
- Envío cada 3–5 s (solo payloads válidos)  
- Variable `API_URL` (local o Render)  
- Los casos de error/validación se demuestran con la colección Postman: [`postman/Fleet-GPS-Telemetry.postman_collection.json`](postman/Fleet-GPS-Telemetry.postman_collection.json)

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

- API: https://fleet-gps-api.onrender.com  
- Frontend: https://fleet-gps-web.onrender.com  
- Health: https://fleet-gps-api.onrender.com/health  

Login demo: `admin@fleet.local` / `FleetAdmin123!` (o el `ADMIN_PASSWORD` configurado en Render).

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

## Colección Postman (errores y casos felices)

Archivo: [`postman/Fleet-GPS-Telemetry.postman_collection.json`](postman/Fleet-GPS-Telemetry.postman_collection.json)

1. Postman → **Import** → selecciona ese JSON  
2. Ajusta `baseUrl` (`http://localhost:3001` o `https://fleet-gps-api.onrender.com`)  
3. Corre primero **Auth → Login** (guarda el JWT solo)  
4. Ejecuta las carpetas de errores: verás 400 / 401 / 404 con mensajes descriptivos  

Cubre: campos faltantes, rangos lat/lng, timestamp inválido, DTO estricto, JSON malformado, sin token, vehículo inexistente, flujo crear→ver→borrar `VH-POSTMAN`, etc.

## Reporte de IA

### 01 — ¿Qué herramientas de IA usaste?

Cursor (agente Composer) como copiloto para scaffolding, estructura del monorepo, validaciones, servicio de estados, panel React/Leaflet, simulador, Docker Compose y borrador del README.

### 02 — ¿Para qué tareas específicas te apoyaste en la IA?

- Armar la estructura Express + Postgres + React de forma ordenada  
- Implementar validaciones HTTP y la máquina de estados de telemetría  
- Integrar SSE con fallback a polling  
- Generar el simulador de telemetría  
- Redactar documentación y checklist de deploy en Render  
- Armar la colección Postman de casos de error  

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

### Autenticación y guardado del token (frontend)

El panel no guarda la contraseña. Solo guarda el **access token JWT** tras un login exitoso.

| Pieza | Archivo | Qué hace |
|-------|---------|----------|
| Almacenamiento | `frontend/src/auth/tokenStorage.js` | Guarda / lee / borra el JWT en `localStorage` bajo la clave `fleet_gps_token`. Si la API responde **401**, limpia el token y dispara el evento `fleet:unauthorized`. |
| Sesión global | `frontend/src/auth/AuthContext.jsx` | Al cargar la app, si hay token llama `GET /auth/me`. Expone `login`, `logout`, `user` e `isAuthenticated`. Escucha el evento de 401 para forzar logout en la UI. |
| Rutas | `frontend/src/auth/ProtectedRoute.jsx` | Sin sesión → redirect a `/login`. Si ya hay sesión, `/login` redirige al dashboard. |
| Cliente HTTP | `frontend/src/api/client.js` | En cada request autenticado agrega `Authorization: Bearer <token>`. Ante 401 limpia sesión. |
| Login API | `frontend/src/api/authApi.js` | `POST /auth/login` → guarda `access_token` con `setToken`. |
| SSE | `frontend/src/api/vehiclesApi.js` | `EventSource` no puede enviar headers; el token va en `GET /events?token=...` (el backend solo lo acepta en esa ruta). |

Flujo resumido:

1. Usuario inicia sesión en `/login`  
2. Backend responde `{ access_token, user, ... }`  
3. Front guarda el token en `localStorage`  
4. Dashboard y polling/SSE usan ese token  
5. “Cerrar sesión” o un **401** borran el token y vuelven al login  

## Seguridad del backend

Capas aplicadas en la API (además de la validación del enunciado):

| Medida | Archivo(s) | Detalle |
|--------|------------|---------|
| **JWT (Bearer)** | `middleware/auth.js`, `services/authService.js`, `routes/auth.js` | Rutas de negocio (`/gps`, `/vehicles`, `/events`) exigen token. Login público. |
| **bcrypt (cost 12)** | `services/authService.js` | La password del admin se guarda hasheada; nunca en texto plano. |
| **Seed admin** | `migrate.js` / startup | Usuario admin creado automáticamente (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). |
| **DTOs estrictos** | `dto/gpsIngest.dto.js`, `dto/login.dto.js`, `dto/vehicleId.dto.js` | Allowlist de campos; rechazan extras, tipos incorrectos y rangos inválidos. |
| **Middleware de validación** | `middleware/validate.js` | El controller usa `req.dto` / `req.vehicleId`, no el body crudo. |
| **SQL parametrizado** | `services/vehicleService.js`, `authService.js`, `db.js` | Consultas con `$1…$n` vía `pg` (anti SQL injection). |
| **Helmet** | `middleware/security.js` | Headers HTTP de seguridad; `x-powered-by` desactivado. |
| **Rate limit** | `middleware/security.js`, `routes/auth.js` | Login 20/15 min; `/gps` 120/min; API general 300/min. |
| **Límite de body** | `app.js` | JSON máx. 100kb; errores 413/400; **sin** filtrar stack traces al cliente. |
| **CORS** | `app.js` | Configurable con `CORS_ORIGIN`; permite header `Authorization`. |
| **Config central** | `config.js` | `JWT_SECRET` obligatorio en production (≥ 32 caracteres). |
| **Logs** | `middleware/security.js` | Morgan (omite spam de `/health`). |
| **Graceful shutdown** | `index.js` | SIGTERM/SIGINT cierran HTTP + pool Postgres. |
| **Health** | `app.js` | Verifica DB (`ok` / `503 degraded`). |
| **SSE token** | `middleware/auth.js`, `routes/events.js` | `?token=` **solo** en `/events` (limitación de EventSource). |
| **DELETE en cascada** | `migrate.js` | Borrar vehículo elimina sus `gps_points` (`ON DELETE CASCADE`). |

Credenciales inválidas siempre responden el mismo mensaje (`Credenciales inválidas`) para no revelar si el email existe.

## Pruebas unitarias

```bash
npm test
# o
npm test --prefix backend
```

Son tests de **funciones puras** (no levantan el server HTTP ni necesitan UI). Ubicación: `backend/tests/`.

| Archivo | Qué cubre |
|---------|-----------|
| `backend/tests/gpsValidator.test.js` | DTO de `POST /gps`: payload válido; `vehicle_id` vacío/inseguro; `lat`/`lng` fuera de rango; timestamp inválido o no ISO; campos extra rechazados. |
| `backend/tests/loginDto.test.js` | DTO de login: email normalizado; password corta; email inválido; campos no permitidos. |
| `backend/tests/statusService.test.js` | Lógica de estados: **Sin señal**, **Detenido**, **En movimiento**, historial vacío. |

Así se garantiza el manejo de errores de validación y la máquina de estados del enunciado de forma automática.

## Docker

```bash
docker compose up -d
```

- Docker Compose: Postgres 16 en puerto **5434**.  
- `backend/Dockerfile` opcional para empaquetar la API.

## Decisiones técnicas adicionales

- **Mapa con datos reales** del API (no mock).  
- **Alta implícita** de vehículo en el primer `POST /gps`.  
- Commits por feature en el historial del repo.  
- Errores HTTP de demo también en la colección Postman (simulador solo envía payloads válidos).  
