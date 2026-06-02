const R = 6371; // Earth radius in km

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function inRadiusBand(km: number | null, band: string): boolean {
  if (band === 'all') return true;
  if (km === null) return false;
  if (band === '0-50') return km <= 50;
  if (band === '50-150') return km > 50 && km <= 150;
  if (band === '150-250') return km > 150 && km <= 250;
  return true;
}
