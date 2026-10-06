import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Login() {
  const navigate = useNavigate();
  // Hier bewaren we wat de gebruiker typt
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Deze functie logt de gebruiker in
  async function login(e: React.FormEvent) {

    // Zorgt dat de pagina niet opnieuw laadt
    e.preventDefault();
    setError("");

    // Controleer email en wachtwoord met Supabase
    const result =
      await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

    // Als login fout gaat
    if (result.error) {
      setError("Email of wachtwoord is verkeerd");
      return;
    }

    // Login goed = naar dashboard
    navigate("/dashboard");

  }


  return (
    <main>
      <h1>Fixel Login</h1>
      <form onSubmit={login}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={function (e) {
            setEmail(e.target.value);
          }}
        />


        <label>Wachtwoord</label>
        <input
          type="password"
          value={password}
          onChange={function (e) {
            setPassword(e.target.value);

          }}
        />

        <button type="submit">
          Inloggen
        </button>
      </form>
      {error && (
        <p>{error}</p>
      )}
    </main>

  );

}