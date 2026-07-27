import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <p className="eyebrow">404</p>
        <h1>Página no encontrada</h1>
        <p className="subtitle">La ruta que buscas no existe en este panel.</p>
        <Link className="btn-primary" to="/" style={{ textAlign: 'center', textDecoration: 'none' }}>
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
