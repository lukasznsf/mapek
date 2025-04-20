import React from "react";
export default function Sidebar({ polygonList }) {
  const colors = ["green", "red", "blue", "yellow"];
  const stats = colors.map(c => ({
    color: c,
    total: polygonList.filter(p => p.color === c).reduce((a, p) => a + (p.area || 0), 0).toFixed(2)
  }));
  return (
    <div style={{ position: "fixed", top: 0, right: 0, background: "#fff", padding: 10, zIndex: 10000 }}>
      <h4>🏆 Ranking</h4>
      {stats.map(({ color, total }) => (
        <div key={color} style={{ color }}>{color.toUpperCase()}: {total} km²</div>
      ))}
    </div>
  );
}
