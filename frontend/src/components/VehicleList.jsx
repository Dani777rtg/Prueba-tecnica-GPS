import StatusBadge from './StatusBadge.jsx';
import { deleteVehicle } from '../api.js';

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  } catch {
    return iso;
  }
}

export default function VehicleList({ vehicles, onDeleted }) {
  const handleDelete = async (id) => {
    if (!window.confirm(`¿Eliminar vehículo ${id}?`)) return;
    try {
      await deleteVehicle(id);
      onDeleted?.(id);
    } catch (err) {
      window.alert(err.message);
    }
  };

  if (vehicles.length === 0) {
    return (
      <div className="empty-state">
        No hay vehículos registrados. Ejecuta el simulador para empezar a recibir telemetría.
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="vehicle-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Estado</th>
            <th>Última transmisión</th>
            <th>Posición</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.vehicle_id}>
              <td className="mono">{v.vehicle_id}</td>
              <td>
                <StatusBadge status={v.status} />
              </td>
              <td>{formatTime(v.last_seen)}</td>
              <td className="mono muted">
                {v.last_lat != null
                  ? `${Number(v.last_lat).toFixed(5)}, ${Number(v.last_lng).toFixed(5)}`
                  : '—'}
              </td>
              <td>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => handleDelete(v.vehicle_id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
