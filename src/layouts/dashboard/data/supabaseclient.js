import { createClient } from "@supabase/supabase-js";

export const supabaseClient = createClient(
  "https://odtnjfvjqyukjaeghbmp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kdG5qZnZqcXl1a2phZWdoYm1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NDgyMzEsImV4cCI6MjA3NDUyNDIzMX0.X_1P9J8-7ERCy8nLZaHD2bVGBGBWjSVE4arIiR35eJM",
  {
    db: { schema: "public" },
    auth: { persistSession: true },
  }
);

