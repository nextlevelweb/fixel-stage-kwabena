import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";


// This component protects a page.
// It only shows its content (props.children) when someone is logged in.
// When nobody is logged in the visitor goes back to the login page (FE-01).
export default function ProtectedRoute(props: any) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(function () {
    checkUser();
  }, []);

  // This function asks Supabase who is logged in.
  // Nobody: go to the login page. Someone: show the page.
  async function checkUser() {
    const result =
      await supabase.auth.getUser();

    // Geen gebruiker gevonden
    if (!result.data.user) {
      navigate("/");
      return;
    }

    // Gebruiker is wel ingelogd
    setLoggedIn(true);
    setLoading(false);

  }



  if (loading) {
    return <p>Laden...</p>;
  }

  if (loggedIn == false) {
    return null;
  }
  return props.children;
}