import { supabase } from "./supabaseClient";

export async function insertPolygonToSupabase({ coords, color, area }) {
  await supabase.from("territories").insert({
    player_color: color,
    coords,
    area
  });
}

export async function loadExistingPolygons() {
  const { data, error } = await supabase.from("territories").select("*");
  if (error) {
    console.error("Błąd ładowania danych:", error.message);
    return [];
  }
  return data.map(p => ({
    coords: Array.isArray(p.coords) ? p.coords.map(c => [c[0], c[1]]) : [],
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