import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Nav() {
  const navigate = useNavigate();

  // Gebruiker uitloggen
  async function logout() {
    await supabase.auth.signOut();
    // Terug naar login
    navigate("/");
  }
  return (
    <nav>
      <Link to="/dashboard">
        Dashboard
      </Link>
      <Link to="/projects">
        Projecten
      </Link>
      <button onClick={logout}>
        Uitloggen
      </button>
    </nav>
  );
}