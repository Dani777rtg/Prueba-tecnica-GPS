import { useEffect, useState } from 'react';

export default function LastUpdate({ lastUpdatedAt, connectionMode }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  let text = 'Esperando primera actualización…';
  if (lastUpdatedAt) {
    const seconds = Math.max(0, Math.floor((Date.now() - lastUpdatedAt) / 1000));
    text =
      seconds === 0
        ? 'Última actualización: ahora'
        : `Última actualización: hace ${seconds} segundo${seconds === 1 ? '' : 's'}`;
  }

  const modeLabel =
    connectionMode === 'sse'
      ? 'SSE'
      : connectionMode === 'polling'
        ? 'Polling 5s'
        : 'Conectando…';

  return (
    <div className="last-update">
      <span>{text}</span>
      <span className="last-update__mode">{modeLabel}</span>
    </div>
  );
}
