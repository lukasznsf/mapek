import React, { useState, useEffect, useRef } from "react";
import Map from "./components/Map";
import Sidebar from "./components/Sidebar";
import PlayerSelect from "./components/PlayerSelect";
import * as turf from "@turf/turf";
import { simulateTravel } from "./utils/simulator";
import {
  insertPolygonToSupabase,
  subscribeToPolygonUpdates,
  loadExistingPolygons,
  deletePolygonByCoords,
  replacePolygon
} from "./supabaseHelpers";

export default function App() {
  const [points, setPoints] = useState([]);
  const [polygonList, setPolygonList] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [runnerPosition, setRunnerPosition] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const savedColor = localStorage.getItem("territory_player_color");
    const validColors = ["green", "red", "blue", "yellow"];
    if (validColors.includes(savedColor)) {
      setPlayerColor(savedColor);
    } else {
      setPlayerColor(null);
    }
  }, []);

  useEffect(() => {
    loadExistingPolygons().then(polys => setPolygonList(polys));
    const sub = subscribeToPolygonUpdates((newPoly) => {
      const coordsRaw = Array.isArray(newPoly.coords) ? newPoly.coords : [];

      const coords = coordsRaw.map(p => {
        if (Array.isArray(p) && p.length === 2) return p;
        if (p && typeof p === "object" && "lat" in p && "lng" in p) return [p.lat, p.lng];
        return null;
      }).filter(p => Array.isArray(p) && typeof p[0] === "number" && typeof p[1] === "number");

      if (coords.length < 3) return;

      setPolygonList(prev => {
        const alreadyExists = prev.some(p =>
          JSON.stringify(p.coords) === JSON.stringify(coords)
        );
        if (alreadyExists) return prev;
        return [...prev, {
          coords,
          color: newPoly.player_color || "gray",
          area: newPoly.area || 0
        }];
      });
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    if (playerColor) {
      localStorage.setItem("territory_player_color", playerColor);
    }
  }, [playerColor]);

  const addPoint = (latlng) => {
    if (!playerColor || isSimulating) return;
    if (points.length > 2 && getDistance(latlng, points[0]) < 20) {
      simulate();
      return;
    }
    setPoints([...points, latlng]);
  };

  const resetPath = () => !isSimulating && setPoints([]);
  const undoLast = () => !isSimulating && setPoints(points.slice(0, -1));

  const simulate = async () => {
    const path = [...points, points[0]];
    setIsSimulating(true);
    await simulateTravel(path, 200, setRunnerPosition);

    const newPoly = turf.polygon([[...path.map(p => [p.lng, p.lat]), [path[0].lng, path[0].lat]]]);
    const newArea = turf.area(newPoly) / 1e6;

    // Odejmujemy z innych graczy
    for (const existing of polygonList) {
      if (existing.color === playerColor) continue;

      try {
        const exPoly = turf.polygon([[...existing.coords.map(p => [p[1], p[0]])]]);
        const diff = turf.difference(exPoly, newPoly);
        if (!diff) {
          await deletePolygonByCoords(existing.coords);
        } else {
          const simplified = turf.simplify(diff, { tolerance: 0.0001, highQuality: false });
          const coordinates = simplified.geometry.coordinates?.[0]?.map(c => [c[1], c[0]]) || [];
          const newArea = turf.area(simplified) / 1e6;
          if (coordinates.length >= 3 && newArea > 0.0001) {
            await replacePolygon(existing.coords, coordinates, existing.color, newArea);
          } else {
            await deletePolygonByCoords(existing.coords);
          }
        }
      } catch (e) {
        console.warn("❌ Błąd przy turf.difference", e);
      }
    }

    // Zapisujemy nowy polygon gracza
    await insertPolygonToSupabase({
      coords: path.map(p => [p.lat, p.lng]),
      color: playerColor,
      area: newArea
    });

    setPoints([]); setRunnerPosition(null); setIsSimulating(false);
  };

  const getDistance = (a, b) => {
    const R = 6371000, toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
    const aVal = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  };

  const distanceKm = (points.reduce((acc, cur, i, arr) =>
    i ? acc + getDistance(arr[i - 1], cur) : acc, 0) / 1000).toFixed(2);
  const timeSec = Math.round((distanceKm / 200) * 3600);
  const totalArea = polygonList.filter(p => p.color === playerColor)
    .reduce((acc, p) => acc + (p.area || 0), 0).toFixed(2);

  return <>
    {!playerColor && <PlayerSelect setPlayerColor={setPlayerColor} />}
    <Map points={points} addPoint={addPoint} polygonList={polygonList} runnerPosition={runnerPosition} mapRef={mapRef} />
    <Sidebar polygonList={polygonList} />
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', zIndex: 9999, padding: '12px', display: 'flex', justifyContent: 'center', gap: 12 }}>
      {points.length >= 3 && <button onClick={simulate}>🏁 Przejmij</button>}
      {points.length > 0 && <><button onClick={undoLast}>↩ Cofnij</button><button onClick={resetPath}>❌ Reset</button></>}
      <span>📏 {distanceKm} km • ⏱ {timeSec}s</span>
      <span style={{ color: playerColor }}>🌍 Twoje: {totalArea} km²</span>
      <button onClick={() => {
        localStorage.removeItem("territory_player_color");
        window.location.reload();
      }}>🎨 Zmień gracza</button>
    </div>
  </>;
}
