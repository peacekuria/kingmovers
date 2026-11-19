// Great-circle distance (km). A 1.35 road factor approximates Nairobi's road network
// until the backend swaps this for Google Distance Matrix results.
export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const roadKm = (a, b) => +(haversineKm(a, b) * 1.35).toFixed(1);

export const inCoverage = (mover, point) =>
  !point || haversineKm(mover.coverage, point) <= mover.coverage.radiusKm;

export function inventoryTotals(inventory) {
  let kg = 0, m3 = 0, count = 0;
  Object.values(inventory?.rooms || {}).forEach((items) =>
    items.forEach((i) => { if (i.checked) { kg += i.kg * (i.qty || 1); m3 += i.m3 * (i.qty || 1); count += i.qty || 1; } })
  );
  return { kg: Math.round(kg), m3: +m3.toFixed(2), count };
}

export const kes = (n) => `KES ${Math.round(n).toLocaleString('en-KE')}`;
