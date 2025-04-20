import React, { useState, useEffect } from "react";
import Map from "./components/Map";
import Sidebar from "./components/Sidebar";
import PlayerSelect from "./components/PlayerSelect";
import Toolbar from "./components/Toolbar";
import * as turf from "@turf/turf";
import {
  insertPolygonToSupabase,
  loadExistingPolygons,
  subscribeToPolygonUpdates,
  updatePolygonById,
  deletePolygonById
} from "./supabaseHelpers";

export default function App() {
  const [points, setPoints] = useState([]);
  const [polygonList, setPolygonList] = useState([]);
  const [playerColor, setPlayerColor] = useState(null);

  useEffect(() => {
    const savedColor = localStorage.getItem("territory_player_color");
    if (savedColor) setPlayerColor(savedColor);
  }, []);

  useEffect(() => {
    loadExistingPolygons().then(setPolygonList);
    const sub = subscribeToPolygonUpdates((newPoly) => {
      if (!newPoly?.coords || !Array.isArray(newPoly.coords)) return;
      setPolygonList((prev) => {
        const exists = prev.some((p) => p.id === newPoly.id);
        if (exists) return prev;
        return [
          ...prev,
          {
            id: newPoly.id,
            coords: newPoly.coords,
            color: newPoly.player_color || "gray",
            area: newPoly.area || 0,
          },
        ];
      });
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    if (playerColor) localStorage.setItem("territory_player_color", playerColor);
  }, [playerColor]);

  const getDistance = (a, b) => {
    const R = 6371000, toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
    const aVal = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  };

  const tryCapture = async () => {
    if (points.length < 3 || !playerColor) return;

    const path = [...points, points[0]];
    const newPoly = turf.polygon([[...path.map(p => [p.lng, p.lat]), [path[0].lng, path[0].lat]]]);
    const area = turf.area(newPoly) / 1e6;
    const newCoords = path.map(p => [p.lat, p.lng]);

    const sameColorPolys = polygonList.filter(p => p.color === playerColor);
    const otherPolys = polygonList.filter(p => p.color !== playerColor);

    let merged = newPoly;
    for (const poly of sameColorPolys) {
      try {
        merged = turf.union(merged, turf.polygon([[...poly.coords.map(([a,b])=>[b,a]), [poly.coords[0][1], poly.coords[0][0]]]]));
      } catch {}
    }

    const mergedCoords = turf.getCoords(merged)[0].map(([lng, lat]) => [lat, lng]);
    const mergedArea = turf.area(merged) / 1e6;

    for (const poly of otherPolys) {
      const basePoly = turf.polygon([[...poly.coords.map(([a,b])=>[b,a]), [poly.coords[0][1], poly.coords[0][0]]]]);
      let diff;
      try {
        diff = turf.difference(basePoly, merged);
      } catch {}
      if (!diff) {
        await deletePolygonById(poly.id);
      } else {
        const diffCoords = turf.getCoords(diff)[0].map(([lng, lat]) => [lat, lng]);
        const diffArea = turf.area(diff) / 1e6;
        await updatePolygonById(poly.id, diffCoords, diffArea);
      }
    }

    for (const poly of sameColorPolys) {
      await deletePolygonById(poly.id);
    }

    await insertPolygonToSupabase({ coords: mergedCoords, color: playerColor, area: mergedArea });
    setPoints([]);
  };

  const handleClick = (latlng) => {
    if (!playerColor) return;
    if (points.length > 2 && getDistance(latlng, points[0]) < 20) {
      tryCapture();
    } else {
      setPoints([...points, latlng]);
    }
  };

  const getStats = () => {
    if (points.length < 2) return { distance: 0, time: 0 };
    let dist = 0;
    for (let i = 1; i < points.length; i++) {
      dist += getDistance(points[i - 1], points[i]);
    }
    dist = dist / 1000;
    const time = (dist / 200) * 60;
    return { distance: dist.toFixed(2), time: time.toFixed(1) };
  };

  return <>
    {!playerColor && <PlayerSelect setPlayerColor={setPlayerColor} />}
    <Map points={points} addPoint={handleClick} polygonList={polygonList} />
    <Sidebar polygonList={polygonList} />
    {points.length >= 2 && <Toolbar onCapture={tryCapture} onReset={() => setPoints([])} stats={getStats()} />}
  </>;
}