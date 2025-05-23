import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Polygon, useMapEvents } from "react-leaflet";
import L from "leaflet";

const customIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/709/709586.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function Map({ points, addPoint, polygonList }) {
  const Events = () => {
    useMapEvents({
      click(e) {
        addPoint(e.latlng);
      },
    });
    return null;
  };

  return (
    <>
      <MapContainer center={[50.67, 17.92]} zoom={13} style={{ height: "100vh", width: "100vw" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Events />
        {points.map((p, i) => (
          <Marker
            key={i}
            position={p}
            icon={customIcon}
          />
        ))}
        {points.length > 1 && <Polyline positions={points} />}
        {polygonList.map((p, i) => (
          <Polygon key={i} positions={p.coords} pathOptions={{ color: p.color }} />
        ))}
      </MapContainer>
    </>
  );
}