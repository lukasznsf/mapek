import React from "react";
import { MapContainer, TileLayer, Marker, Polyline, Polygon, useMapEvents } from "react-leaflet";
import L from "leaflet";

const runnerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/4470/4470310.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    }
  });
  return null;
}

export default function Map({ points, addPoint, polygonList, runnerPosition, mapRef }) {
  const closingLine = (points.length > 1) ? [points[points.length - 1], points[0]] : null;

  const groupedPolygons = {};
  polygonList.forEach(p => {
    if (!groupedPolygons[p.color]) groupedPolygons[p.color] = [];
    groupedPolygons[p.color].push(...p.coords);
  });

  return (
    <MapContainer
      center={[50.6722, 17.9253]}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
      whenCreated={(map) => (mapRef.current = map)}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler onClick={addPoint} />
      {points.map((pos, i) => <Marker key={i} position={pos} />)}
      {points.length > 1 && <Polyline positions={points} color="blue" />}
      {closingLine && <Polyline positions={closingLine} color="blue" dashArray="5,5" />}
      {Object.entries(groupedPolygons).map(([color, coords], i) => (
        <Polygon key={i} positions={coords} pathOptions={{ color, fillOpacity: 0.4 }} />
      ))}
      {runnerPosition && <Marker position={runnerPosition} icon={runnerIcon} />}
    </MapContainer>
  );
}
