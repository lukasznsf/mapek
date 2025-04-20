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
  const { error } = await supabase.from("territories").insert({
    player_color: color,
    coords,
    area,
    client_id
  });
  if (error) console.error("❌ Supabase insert error:", error.message);
}

export function subscribeToPolygonUpdates(onUpdate) {
  return supabase
    .channel("public:territories")
    .on("postgres_changes", { event: "*", schema: "public", table: "territories" }, payload => {
      if (payload.eventType === "INSERT") onUpdate(payload.new);
    })
    .subscribe();
}
