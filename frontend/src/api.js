const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export function getApiUrl() {
  return API_URL;
}

export async function fetchVehicles() {
  const response = await fetch(`${API_URL}/vehicles`);
  if (!response.ok) {
    throw new Error(`GET /vehicles falló (${response.status})`);
  }
  return response.json();
}

export async function deleteVehicle(id) {
  const response = await fetch(`${API_URL}/vehicles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (response.status === 404) {
    throw new Error('Vehículo no encontrado');
  }
  if (!response.ok && response.status !== 204) {
    throw new Error(`DELETE falló (${response.status})`);
  }
}

export function subscribeVehicles(onData, onError) {
  const source = new EventSource(`${API_URL}/events`);

  source.addEventListener('vehicles', (event) => {
    try {
      const data = JSON.parse(event.data);
      onData(data);
    } catch (err) {
      onError?.(err);
    }
  });

  source.onerror = () => {
    onError?.(new Error('SSE desconectado'));
  };

  return () => source.close();
}
