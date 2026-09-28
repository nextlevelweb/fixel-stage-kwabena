import { createClient } from "@supabase/supabase-js";

// During the build, Vite automatically substitutes the values from your .env file here.
// Only variables starting with VITE_ are allowed to end up in the browser code —
// that's a built-in Vite safeguard against accidentally leaking secrets.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Stop immediately with a clear error message if .env is missing or empty,
// instead of the app misbehaving somewhere deep in the code later on.
if (!url || !key) {
  throw new Error("Supabase-configuratie ontbreekt. Controleer je .env-bestand.");
}

// One central "supabase" client that's reused throughout the whole app to log
// in, fetch data, and save data.
export const supabase = createClient(url, key);