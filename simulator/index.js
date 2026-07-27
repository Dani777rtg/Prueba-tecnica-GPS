import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', 'backend', '.env') });
dotenv.config();

const API_URL = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fleet.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'FleetAdmin123!';
const ERROR_RATE = 0.1;

const BOUNDS = {
  latMin: 4.6,
  latMax: 4.75,
  lngMin: -74.2,
  lngMax: -73.95,
};

const vehicles = [
  { id: 'VH-001', lat: 4.65, lng: -74.1, mode: 'moving', label: 'en movimiento' },
  { id: 'VH-002', lat: 4.68, lng: -74.05, mode: 'moving', label: 'en movimiento' },
  { id: 'VH-003', lat: 4.71, lng: -74.07, mode: 'stopped', label: 'detenido (estático)' },
];

let accessToken = null;

function randomIn(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function nextIntervalMs() {
  return 3000 + Math.floor(Math.random() * 2001);
}

function buildValidPayload(vehicle) {
  if (vehicle.mode === 'moving') {
    vehicle.lat = clamp(vehicle.lat + randomIn(-0.0015, 0.0015), BOUNDS.latMin, BOUNDS.latMax);
    vehicle.lng = clamp(vehicle.lng + randomIn(-0.0015, 0.0015), BOUNDS.lngMin, BOUNDS.lngMax);
  }

  return {
    vehicle_id: vehicle.id,
    lat: Number(vehicle.lat.toFixed(6)),
    lng: Number(vehicle.lng.toFixed(6)),
    timestamp: new Date().toISOString(),
  };
}

function buildInvalidPayload(vehicle) {
  const kind = Math.floor(Math.random() * 3);
  if (kind === 0) {
    return { vehicle_id: vehicle.id, lat: 4.71, lng: -74.07 };
  }
  if (kind === 1) {
    return {
      vehicle_id: vehicle.id,
      lat: 120,
      lng: -74.07,
      timestamp: new Date().toISOString(),
    };
  }
  return {
    vehicle_id: vehicle.id,
    lat: 4.71,
    lng: -74.07,
    timestamp: 'fecha-invalida',
  };
}

async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Login falló (${response.status})`);
  }

  accessToken = body.access_token;
  console.log(`JWT obtenido para ${ADMIN_EMAIL}`);
}

async function sendOnce(vehicle) {
  const injectError = Math.random() < ERROR_RATE;
  const payload = injectError ? buildInvalidPayload(vehicle) : buildValidPayload(vehicle);

  try {
    const response = await fetch(`${API_URL}/gps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      console.warn('Token expirado — renovando sesión…');
      await login();
      return;
    }

    const bodyText = await response.text();
    const tag = injectError ? 'INVALID' : 'OK';
    console.log(
      `[${tag}] ${vehicle.id} (${vehicle.label}) → ${response.status} ${bodyText.slice(0, 120)}`,
    );
  } catch (error) {
    console.error(`[ERROR] ${vehicle.id} no pudo conectar a ${API_URL}:`, error.message);
  }
}

function schedule(vehicle) {
  const run = async () => {
    await sendOnce(vehicle);
    setTimeout(run, nextIntervalMs());
  };
  setTimeout(run, Math.floor(Math.random() * 1000));
}

async function main() {
  console.log(`Simulator → ${API_URL}`);
  console.log(`Vehículos: ${vehicles.map((v) => `${v.id} (${v.label})`).join(', ')}`);
  console.log(`~${ERROR_RATE * 100}% de requests inválidos intencionales`);

  await login();
  console.log('Ctrl+C para detener\n');

  for (const vehicle of vehicles) {
    schedule(vehicle);
  }
}

main().catch((error) => {
  console.error('No se pudo iniciar el simulador:', error.message);
  process.exit(1);
});
