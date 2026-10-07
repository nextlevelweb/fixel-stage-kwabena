// supabase.ts — like config/database.php in Laravel:
// it reads the connection settings from .env and creates ONE shared database client.
import { createClient } from "@supabase/supabase-js";

// During the build, Vite automatically substitutes the values from your .env file here.
// Only variables starting with VITE_ are allowed to end up in the browser code.
// That's a built-in Vite safeguard against accidentally leaking secrets.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// The error message we show when the .env file is missing or incomplete.
const configErrorMessage = "Supabase-configuratie ontbreekt. Controleer je .env-bestand.";

// Stop immediately with a clear error message if .env is missing or empty,
// instead of the app misbehaving somewhere deep in the code later on.
// Each value can be missing (undefined) or present but empty (""), so we check both.
if (url === undefined) {
  throw new Error(configErrorMessage);
}
if (url === "") {
  throw new Error(configErrorMessage);
}
if (key === undefined) {
  throw new Error(configErrorMessage);
}
if (key === "") {
  throw new Error(configErrorMessage);
}

// One central "supabase" client that's reused by all the pages to log
// in, fetch data, and save data. Every page imports it from here.
export const supabase = createClient(url, key);