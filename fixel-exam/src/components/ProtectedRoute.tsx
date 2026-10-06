import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";


export default function ProtectedRoute(props: any) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(function () {
    checkUser();
  }, []);

  // Controleren of iemand is ingelogd
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