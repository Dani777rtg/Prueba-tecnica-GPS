import VehicleList from './components/VehicleList.jsx';
import VehicleMap from './components/VehicleMap.jsx';
import LastUpdate from './components/LastUpdate.jsx';
import { useVehicles } from './hooks/useVehicles.js';
import { getApiUrl } from './api.js';

export default function App() {
  const { vehicles, lastUpdatedAt, connectionMode, error } = useVehicles();

  const counts = vehicles.reduce(
    (acc, v) => {
      acc.total += 1;
      if (v.status === 'En movimiento') acc.moving += 1;
      else if (v.status === 'Detenido') acc.stopped += 1;
      else acc.nosignal += 1;
      return acc;
    },
    { total: 0, moving: 0, stopped: 0, nosignal: 0 },
  );

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">Fleet Telemetry</p>
          <h1>Monitoreo de Flotas GPS</h1>
          <p className="subtitle">
            Panel en tiempo real · API {getApiUrl()}
          </p>
        </div>
        <LastUpdate lastUpdatedAt={lastUpdatedAt} connectionMode={connectionMode} />
      </header>

      {error && <div className="banner-error">Error de conexión: {error}</div>}

      <section className="stats" aria-label="Resumen">
        <div className="stat">
          <span className="stat__value">{counts.total}</span>
          <span className="stat__label">Vehículos</span>
        </div>
        <div className="stat">
          <span className="stat__value status-text--moving">{counts.moving}</span>
          <span className="stat__label">En movimiento</span>
        </div>
        <div className="stat">
          <span className="stat__value status-text--stopped">{counts.stopped}</span>
          <span className="stat__label">Detenidos</span>
        </div>
        <div className="stat">
          <span className="stat__value status-text--nosignal">{counts.nosignal}</span>
          <span className="stat__label">Sin señal</span>
        </div>
      </section>

      <main className="layout">
        <section className="panel">
          <h2>Vehículos</h2>
          <VehicleList vehicles={vehicles} />
        </section>
        <section className="panel panel--map">
          <h2>Mapa</h2>
          <VehicleMap vehicles={vehicles} />
        </section>
      </main>
    </div>
  );
}
