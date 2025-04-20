import { supabase } from "./supabaseClient";

function getClientId() {
  let id = localStorage.getItem("client_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("client_id", id);
  }
  return id;
}

export async function insertPolygonToSupabase({ coords, color, area }) {
  const client_id = getClientId();

  const coordsSanitized = coords.map(p => {
    if (Array.isArray(p)) return p;
    if (typeof p === "object" && "lat" in p && "lng" in p) return [p.lat, p.lng];
    return null;
  }).filter(Boolean);

  if (coordsSanitized.length < 3) {
    console.warn("❗Niepoprawne coords do zapisania:", coords);
    return;
  }

  const { error } = await supabase.from("territories").insert({
    player_color: color,
    coords: coordsSanitized,
    area,
    client_id
  });

  if (error) {
    console.error("❌ Błąd zapisu do Supabase:", error.message);
  }
}

export function subscribeToPolygonUpdates(onUpdate) {
  return supabase
    .channel("public:territories")
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "territories"
    }, (payload) => {
      if (payload.eventType === "INSERT" && payload.new) {
        onUpdate(payload.new);
      }
    }).subscribe();
}
