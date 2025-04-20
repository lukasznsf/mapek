export async function simulateTravel(path, speedKmh, updatePosition) {
  const delay = ms => new Promise(res => setTimeout(res, ms));
  const speedMps = speedKmh * 1000 / 3600;
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i], to = path[i + 1];
    const dist = getDistance(from, to);
    const steps = Math.floor(dist / speedMps * 20);
    for (let step = 0; step <= steps; step++) {
      const lat = from.lat + (to.lat - from.lat) * (step / steps);
      const lng = from.lng + (to.lng - from.lng) * (step / steps);
      updatePosition({ lat, lng });
      await delay(50);
    }
  }
  updatePosition(null);
}

function getDistance(a, b) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const aVal = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}
