import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

// This component is the top bar of the page.
// It shows the name FIXEL on the left and the log out button on the right.
export default function Nav() {
  const navigate = useNavigate();

  // This function logs the user out.
  // signOut() ends the session at Supabase, then navigate("/") sends
  // the user back to the login page.
  async function logout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  // Here is the container of the top bar (a white bar with a thin line below it)
  return (
    <header className="topbar">
      <span className="brand">
        FIXEL
      </span>

      <button type="button" onClick={logout}>
        Uitloggen
      </button>
    </header>
  );
}
