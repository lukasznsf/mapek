import React from "react";

export default function Sidebar({ polygonList }) {
  const colors = ["green", "red", "blue", "yellow"];

  const stats = colors.map(color => {
    const total = polygonList
      .filter(p => p.color === color)
      .reduce((sum, p) => sum + (p.area || 0), 0)
      .toFixed(2);
    return { color, total };
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '160px',
      background: 'rgba(255,255,255,0.95)',
      padding: '10px',
      boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      zIndex: 10000
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>🏆 Ranking</h4>
      {stats.map(({ color, total }) => (
        <div key={color} style={{ marginBottom: '6px', color }}>
          {color.toUpperCase()}: {total} km²
        </div>
      ))}
    </div>
  );
}
