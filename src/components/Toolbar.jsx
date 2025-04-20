import React from "react";

export default function Toolbar({ onCapture, onReset, stats }) {
  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      width: "100%",
      background: "#fff",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      padding: "10px",
      borderTop: "1px solid #ccc",
      zIndex: 9999
    }}>
      <div>Długość: {stats.distance} km</div>
      <div>Czas: {stats.time} min</div>
      <button onClick={onCapture} style={{ padding: "6px 12px" }}>✅ Przejmij teren</button>
      <button onClick={onReset} style={{ padding: "6px 12px" }}>♻️ Resetuj trasę</button>
    </div>
  );
}