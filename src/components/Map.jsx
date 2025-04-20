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
      {polygonList.map((poly, i) => {
        try {
          return <Polygon key={i} positions={poly.coords} pathOptions={{ color: poly.color, fillOpacity: 0.4 }} />;
        } catch (e) {
          console.warn("Błąd rysowania polygonu:", poly, e);
          return null;
        }
      })}
      {runnerPosition && <Marker position={runnerPosition} icon={runnerIcon} />}
    </MapContainer>
  );
}
