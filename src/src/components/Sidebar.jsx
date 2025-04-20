import React from "react";

export default function Sidebar({ polygonList }) {
  const colors = ["green", "red", "blue", "yellow"];
  const stats = colors.map(color => {
    const areaSum = polygonList
      .filter(p => p.color === color)
      .reduce((acc, p) => acc + (p.area || 0), 0);
    return {
      color,
      area: areaSum.toFixed(2)
    };
  });

  return (
    <div style={{ position: "fixed", top: 0, right: 0, background: "#fff", padding: 10, zIndex: 10000 }}>
      <h4>🏆 Ranking</h4>
      {stats.map(({ color, area }) => (
        <div key={color} style={{ color }}>{color.toUpperCase()}: {area} km²</div>
      ))}
    </div>
  );
}
