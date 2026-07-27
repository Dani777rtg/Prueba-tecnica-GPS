const STATUS_CLASS = {
  'En movimiento': 'status--moving',
  Detenido: 'status--stopped',
  'Sin señal': 'status--nosignal',
};

export default function StatusBadge({ status }) {
  const className = STATUS_CLASS[status] || 'status--unknown';
  return <span className={`status-badge ${className}`}>{status}</span>;
}
