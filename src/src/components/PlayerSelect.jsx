import React from "react";
export default function PlayerSelect({ setPlayerColor }) {
  const colors = ["green", "red", "blue", "yellow"];
  return (
    <div style={{ position: "fixed", inset: 0, background: "white", zIndex: 9999, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 20 }}>
      <h2>🎮 Wybierz kolor gracza:</h2>
      <div style={{ display: "flex", gap: 20 }}>
        {colors.map(c => (
          <button key={c} onClick={() => setPlayerColor(c)} style={{ background: c, color: "#fff", padding: "10px 20px", borderRadius: "8px" }}>
            {c.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
