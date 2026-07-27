import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config();

const API_URL = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
const ERROR_RATE = 0.1;

/** Bogotá bounding box */
const BOUNDS = {
  latMin: 4.6,
  latMax: 4.75,
  lngMin: -74.2,
  lngMax: -73.95,
};

const vehicles = [
  {
    id: 'VH-001',
    lat: 4.65,
    lng: -74.1,
    mode: 'moving',
    label: 'en movimiento',
  },
  {
    id: 'VH-002',
    lat: 4.68,
    lng: -74.05,
    mode: 'moving',
    label: 'en movimiento',
  },
  {
    id: 'VH-003',
    lat: 4.71,
    lng: -74.07,
    mode: 'stopped',
    label: 'detenido (estático)',
  },
];

function randomIn(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function nextIntervalMs() {
  return 3000 + Math.floor(Math.random() * 2001); // 3–5 s
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
    return { vehicle_id: vehicle.id, lat: 4.71, lng: -74.07 }; // missing timestamp
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

async function sendOnce(vehicle) {
  const injectError = Math.random() < ERROR_RATE;
  const payload = injectError ? buildInvalidPayload(vehicle) : buildValidPayload(vehicle);

  try {
    const response = await fetch(`${API_URL}/gps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

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

console.log(`Simulator → ${API_URL}`);
console.log(`Vehículos: ${vehicles.map((v) => `${v.id} (${v.label})`).join(', ')}`);
console.log(`~${ERROR_RATE * 100}% de requests inválidos intencionales`);
console.log('Ctrl+C para detener\n');

for (const vehicle of vehicles) {
  schedule(vehicle);
}
