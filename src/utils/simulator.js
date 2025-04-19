export async function simulateTravel(points, speedKmH, updateRunnerPosition) {
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const speedMps = speedKmH * 1000 / 3600;

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    const segmentDistance = getDistance(from, to);
    const segmentTime = segmentDistance / speedMps;

    const steps = Math.floor(segmentTime * 20); // 20 fps
    for (let step = 0; step <= steps; step++) {
      const lat = from.lat + ((to.lat - from.lat) * step) / steps;
      const lng = from.lng + ((to.lng - from.lng) * step) / steps;
      updateRunnerPosition({ lat, lng });
      await delay(1000 / 20);
    }
  }

  updateRunnerPosition(null);
}

function getDistance(a, b) {
  const R = 6371000;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lng - a.lng);
  const lat1 = rad(a.lat);
  const lat2 = rad(b.lat);

  const aVal =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return R * c;
}
