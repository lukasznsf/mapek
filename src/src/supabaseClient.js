import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  "https://lbeyjlrotvcogjgbwreh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiZXlqbHJvdHZjb2dqZ2J3cmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMzEwNjUsImV4cCI6MjA2MDcwNzA2NX0.ZPj893TEEn7Z0FxbLg_oSu696-pJySwi2Y1ela0XmsU"
);
