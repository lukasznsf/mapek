
export async function deletePolygonByCoords(coords) {
  const { error } = await supabase
    .from("territories")
    .delete()
    .eq("coords", coords);
  if (error) console.error("❌ Błąd usuwania polygonu:", error.message);
}

export async function replacePolygon(oldCoords, newCoords, color, area) {
  await deletePolygonByCoords(oldCoords);
  await insertPolygonToSupabase({ coords: newCoords, color, area });
}
