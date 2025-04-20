import { supabase } from "./supabaseClient";

export async function insertPolygonToSupabase({ coords, color, area }) {
  const { error } = await supabase.from("territories").insert({
    player_color: color,
    coords,
    area
  });
  if (error) console.error("❌ Supabase insert error:", error.message);
}

export async function loadExistingPolygons() {
  const { data, error } = await supabase.from("territories").select("*");
  if (error) {
    console.error("❌ Error loading polygons:", error.message);
    return [];
  }
  return data.map(p => ({
    id: p.id,
    coords: p.coords,
    color: p.player_color || "gray",
    area: p.area || 0
  }));
}

export function subscribeToPolygonUpdates(onUpdate) {
  return supabase
    .channel("public:territories")
    .on("postgres_changes", { event: "*", schema: "public", table: "territories" }, payload => {
      if (payload.eventType === "INSERT") onUpdate(payload.new);
    })
    .subscribe();
}

export async function deletePolygonById(id) {
  const { error } = await supabase.from("territories").delete().eq("id", id);
  if (error) console.error("❌ Error deleting polygon:", error.message);
}

export async function updatePolygonById(id, coords, area) {
  const { error } = await supabase
    .from("territories")
    .update({ coords, area })
    .eq("id", id);
  if (error) console.error("❌ Error updating polygon:", error.message);
}