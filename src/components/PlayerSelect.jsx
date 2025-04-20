import React from "react";

export default function PlayerSelect({ setPlayerColor }) {
  const colors = ["green", "red", "blue", "yellow"];
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'white',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 16, fontFamily: 'sans-serif'
    }}>
      <h2>Wybierz swój kolor gracza:</h2>
      <div style={{ display: 'flex', gap: 12 }}>
        {colors.map(color => (
          <button key={color} onClick={() => setPlayerColor(color)} style={{
            background: color, border: 'none', color: 'white',
            padding: '10px 20px', fontSize: '16px', borderRadius: '8px'
          }}>{color.toUpperCase()}</button>
        ))}
      </div>
    </div>
  );
}
