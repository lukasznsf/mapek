import React, { useState, useEffect, useRef } from "react";
import Map from "./components/Map";
import { simulateTravel } from "./utils/simulator";
import PlayerSelect from "./components/PlayerSelect";
import Sidebar from "./components/Sidebar";
import * as turf from "@turf/turf";
import { insertPolygonToSupabase, subscribeToPolygonUpdates } from "./supabaseHelpers";

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
    if (savedColor && validColors.includes(savedColor)) {
      setPlayerColor(savedColor);
    }

    const sub = subscribeToPolygonUpdates((newPoly) => {
      if (!newPoly.coords) return;

      let coordsRaw = Array.isArray(newPoly.coords) ? newPoly.coords : [];
      if (!Array.isArray(coordsRaw)) return;

      const coords = coordsRaw.map(p => {
        if (Array.isArray(p)) return p;
        if (p && typeof p === "object" && "lat" in p && "lng" in p) return [p.lat, p.lng];
        return null;
      }).filter(Boolean);

      if (coords.length < 3) return;

      const newPolygon = {
        coords,
        color: newPoly.player_color || "gray",
        area: typeof newPoly.area === "number" ? newPoly.area : 0
      };

      setPolygonList(prev => {
        const alreadyExists = prev.some(p =>
          JSON.stringify(p.coords) === JSON.stringify(newPolygon.coords)
        );
        if (alreadyExists) return prev;
        return [...prev, newPolygon];
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
    if (isSimulating || !playerColor) return;
    if (points.length > 2 && getDistance(latlng, points[0]) < 20) {
      simulate();
      return;
    }
    setPoints([...points, latlng]);
  };

  const undoLastPoint = () => !isSimulating && setPoints(points.slice(0, -1));
  const resetPath = () => !isSimulating && (setPoints([]), setRunnerPosition(null));

  const simulate = async () => {
    if (points.length < 3) return alert("Potrzebujesz minimum 3 punktów.");
    const looped = [...points, points[0]];
    setIsSimulating(true);
    await simulateTravel(looped, 200, pos => setRunnerPosition(pos));
    const poly = turf.polygon([[...looped.map(p => [p.lng, p.lat]), [looped[0].lng, looped[0].lat]]]);
    const area = turf.area(poly) / 1e6;

    insertPolygonToSupabase({
      coords: looped.map(p => [p.lat, p.lng]),
      color: playerColor,
      area
    });

    setPoints([]);
    setRunnerPosition(null);
    setIsSimulating(false);
  };

  const getDistance = (a, b) => {
    const R = 6371000, rad = x => (x * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lng - a.lng);
    const lat1 = rad(a.lat), lat2 = rad(b.lat);
    const aVal = Math.sin(dLat/2)**2 + Math.sin(dLon/2)**2 * Math.cos(lat1) * Math.cos(lat2);
    return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  };

  const totalDistance = () => points.reduce((acc, cur, i, arr) =>
    i ? acc + getDistance(arr[i - 1], cur) : acc, 0);
  const estimatedTime = () => totalDistance() / (200 * 1000 / 3600);
  const totalArea = polygonList.filter(p => p.color === playerColor)
    .reduce((sum, p) => sum + (p.area || 0), 0).toFixed(2);

  return <>
    {!playerColor && <PlayerSelect setPlayerColor={setPlayerColor} />}
    <Map points={points} addPoint={addPoint} polygonList={polygonList} runnerPosition={runnerPosition} mapRef={mapRef} />
    <Sidebar polygonList={polygonList} />
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10000,
      background: 'rgba(255,255,255,0.95)', padding: '12px 16px',
      display: 'flex', justifyContent: 'center', gap: '12px',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.15)', fontFamily: 'sans-serif'
    }}>
      {points.length >= 3 && <button onClick={simulate} disabled={isSimulating}>{isSimulating ? "⏳ Symuluję..." : "🟢 Przejmij teren"}</button>}
      {points.length > 0 && <>
        <button onClick={undoLastPoint} disabled={isSimulating}>↩️ Cofnij punkt</button>
        <button onClick={resetPath} disabled={isSimulating}>❌ Resetuj</button>
      </>}
      {points.length >= 2 && <span style={{ alignSelf: 'center', fontSize: '0.9rem' }}>
        📏 {(totalDistance() / 1000).toFixed(2)} km • ⏱️ {Math.round(estimatedTime())} sek
      </span>}
      {playerColor && <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: playerColor }}>
        🌍 Twoje terytorium: {totalArea} km²
      </span>}
    </div>
  </>;
}
