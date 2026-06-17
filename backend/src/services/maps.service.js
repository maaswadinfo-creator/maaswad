import config from '../config/index.js';
import logger from '../utils/logger.js';

// Haversine fallback distance when Google Distance Matrix is not configured.
export function haversineKm([lng1, lat1], [lng2, lat2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
}

export function estimateEtaMinutes(distanceKm, prepMins = 30) {
  const travel = Math.round((distanceKm / 20) * 60); // ~20km/h city avg
  return prepMins + travel;
}

export const mapsConfigured = () => Boolean(config.googleMapsKey);

/**
 * Real driving distance + duration via Google Distance Matrix when a key is set.
 * Returns { distanceKm, durationMins } and silently falls back to haversine.
 */
export async function getDistance(originCoords, destCoords) {
  const haver = haversineKm(originCoords, destCoords);
  if (!mapsConfigured()) return { distanceKm: haver, durationMins: estimateEtaMinutes(haver, 0), source: 'haversine' };
  try {
    const [oLng, oLat] = originCoords; const [dLng, dLat] = destCoords;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${oLat},${oLng}&destinations=${dLat},${dLng}&mode=driving&key=${config.googleMapsKey}`;
    const res = await fetch(url);
    const json = await res.json();
    const el = json.rows?.[0]?.elements?.[0];
    if (el?.status === 'OK') {
      return { distanceKm: +(el.distance.value / 1000).toFixed(2), durationMins: Math.round(el.duration.value / 60), source: 'google' };
    }
    return { distanceKm: haver, durationMins: estimateEtaMinutes(haver, 0), source: 'haversine' };
  } catch (e) { logger.warn(`Distance Matrix failed: ${e.message}`); return { distanceKm: haver, durationMins: estimateEtaMinutes(haver, 0), source: 'haversine' }; }
}

// Geocode an address string -> [lng, lat]
export async function geocode(address) {
  if (!mapsConfigured()) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${config.googleMapsKey}`;
    const json = await (await fetch(url)).json();
    const loc = json.results?.[0]?.geometry?.location;
    return loc ? [loc.lng, loc.lat] : null;
  } catch { return null; }
}
