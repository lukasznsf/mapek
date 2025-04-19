import React from "react";

const colors = ["green", "red", "blue", "yellow"];

export default function PlayerSelect({ setPlayerColor }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <h2>Wybierz gracza</h2>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {colors.map(color => (
          <button
            key={color}
            onClick={() => setPlayerColor(color)}
            style={{
              backgroundColor: color,
              border: 'none',
              padding: '10px 20px',
              fontSize: '18px',
              color: 'white',
              cursor: 'pointer',
              borderRadius: '10px',
              boxShadow: '0 0 10px rgba(0,0,0,0.3)'
            }}
          >
            {color.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
