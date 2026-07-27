/**
 * Re-exports DTO parser so existing imports/tests keep working.
 * Prefer importing from ../dto/gpsIngest.dto.js in new code.
 */
export { parseGpsIngestDto, validateGpsPayload } from '../dto/gpsIngest.dto.js';
