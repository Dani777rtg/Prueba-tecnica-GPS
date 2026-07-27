const VEHICLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

/**
 * Validates :id path params used in /vehicles/:id
 * @returns {{ ok: true, id: string } | { ok: false, message: string }}
 */
export function parseVehicleIdParam(rawId) {
  if (typeof rawId !== 'string' || rawId.trim() === '') {
    return { ok: false, message: 'vehicle_id inválido' };
  }

  const id = rawId.trim();
  if (!VEHICLE_ID_PATTERN.test(id)) {
    return { ok: false, message: 'vehicle_id inválido' };
  }

  return { ok: true, id };
}
