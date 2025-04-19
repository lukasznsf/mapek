import React, { useState, useEffect, useRef } from "react";
import Map from "./components/Map";
import { simulateTravel } from "./utils/simulator";
import PlayerSelect from "./components/PlayerSelect";
import Sidebar from "./components/Sidebar";
import * as turf from "@turf/turf";

() {
  const [points, setPoints] = useState([]);
  const [polygonList, setPolygonList] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [runnerPosition, setRunnerPosition] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("territoryData");
    if (saved) {
      const { polygons, color } = JSON.parse(saved);
      setPolygonList(polygons);
      setPlayerColor(color);
    }
  }, []);

  useEffect(() => {
    if (playerColor) {
      const data = {
        polygons: polygonList,
        color: playerColor
      };
      localStorage.setItem("territoryData", JSON.stringify(data));
    }
  }, [polygonList, playerColor]);

  const addPoint = (latlng) => {
    if (isSimulating || !playerColor) return;
    if (points.length > 2) {
      const first = points[0];
      const distanceToStart = getDistance(latlng, first);
      if (distanceToStart < 20) {
        simulate();
        return;
      }
    }
    setPoints([...points, latlng]);
  };

  const undoLastPoint = () => {
    if (points.length > 0 && !isSimulating) {
      setPoints(points.slice(0, -1));
    }
  };

  const resetPath = () => {
    if (!isSimulating) {
      setPoints([]);
      setRunnerPosition(null);
    }
  };

  const simulate = async () => {
    if (points.length < 3) return alert("Potrzebujesz minimum 3 punktów.");
    const looped = [...points, points[0]];
    setIsSimulating(true);
    await simulateTravel(looped, 200, (pos) => setRunnerPosition(pos));

    const newPoly = turf.polygon([[...looped.map(p => [p.lng, p.lat]), [looped[0].lng, looped[0].lat]]]);
    let merged = newPoly;

    const overlapping = polygonList.filter(p => p.color === playerColor && (
      turf.booleanOverlap(turf.polygon([[...p.coords.map(c => [c.lng, c.lat]), [p.coords[0].lng, p.coords[0].lat]]]), newPoly) ||
      turf.booleanContains(newPoly, turf.polygon([[...p.coords.map(c => [c.lng, c.lat]), [p.coords[0].lng, p.coords[0].lat]]])) ||
      turf.booleanContains(turf.polygon([[...p.coords.map(c => [c.lng, c.lat]), [p.coords[0].lng, p.coords[0].lat]]]), newPoly)
    ));

    overlapping.forEach(p => {
      const turfPoly = turf.polygon([[...p.coords.map(c => [c.lng, c.lat]), [p.coords[0].lng, p.coords[0].lat]]]);
      merged = turf.union(merged, turfPoly);
    });

    const coords = turf.getCoords(merged)[0].map(([lng, lat]) => ({ lat, lng }));
    const area = turf.area(merged) / 1e6;

    const updatedList = polygonList.filter(p => !overlapping.includes(p));
    setPolygonList([...updatedList, { coords, color: playerColor, area }]);

    setPoints([]);
    setIsSimulating(false);
    setRunnerPosition(null);
  };

  const getDistance = (a, b) => {
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
  };

  const totalDistance = () => {
    let sum = 0;
    for (let i = 0; i < points.length - 1; i++) {
      sum += getDistance(points[i], points[i + 1]);
    }
    return sum;
  };

  const estimatedTime = () => {
    const speedMps = 200 * 1000 / 3600;
    return totalDistance() / speedMps;
  };

  const totalArea = polygonList
    .filter(p => p.color === playerColor)
    .reduce((sum, p) => sum + p.area, 0)
    .toFixed(2);

  return (
    <>
      {!playerColor && <PlayerSelect setPlayerColor={setPlayerColor} />}

      <Map
        points={points}
        addPoint={addPoint}
        polygonList={polygonList}
        runnerPosition={runnerPosition}
        mapRef={mapRef}
      />

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: 'rgba(255,255,255,0.95)',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.15)',
        fontFamily: 'sans-serif'
      }}>
        {points.length >= 3 && (
          <button onClick={simulate} disabled={isSimulating}>
            {isSimulating ? "⏳ Symuluję..." : "🟢 Przejmij teren"}
          </button>
        )}
        {points.length > 0 && (
          <>
            <button onClick={undoLastPoint} disabled={isSimulating}>↩️ Cofnij punkt</button>
            <button onClick={resetPath} disabled={isSimulating}>❌ Resetuj</button>
          </>
        )}
        {points.length >= 2 && (
          <span style={{ alignSelf: 'center', fontSize: '0.9rem' }}>
            📏 {(totalDistance() / 1000).toFixed(2)} km • ⏱️ {Math.round(estimatedTime())} sek
          </span>
        )}
        {playerColor && (
          <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: playerColor }}>
            🌍 Twoje terytorium: {totalArea} km²
          </span>
        )}
      </div>
    </>
  );
}
