import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  async function login() {

    setError("");
    const emailInput =
      document.getElementById("email") as HTMLInputElement;

    const passwordInput =
      document.getElementById("password") as HTMLInputElement;

    const email = emailInput.value;
    const password = passwordInput.value;

    if (email == "") {
      setError("Vul je e-mail in");
      return;
    }

    if (password == "") {
      setError("Vul je wachtwoord in");
      return;
    }

    const result =
      await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (result.error) {
      setError("E-mail of wachtwoord onjuist");
      passwordInput.value = "";
      return;
    }


    navigate("/dashboard");
  }

  let errorMessage = null;
  if (error != "") {
    errorMessage = (
      <p className="error">
        Foutmelding: {error}
      </p>
    );
  }

  return (
    <div className="login-page">
      <main className="login">

        <h1>Fixel</h1>
        <h2>Inloggen</h2>

        <label>
          E-mail
        </label>

        <input
          id="email"
          type="email"
        />

        <label>
          Wachtwoord
        </label>

        <input
          id="password"
          type="password"
        />

        {errorMessage}

        <button
          type="button"
          onClick={login}
        >

          Inloggen
        </button>

        <p className="login-link">
          <Link to="/forgot-password">
            Wachtwoord vergeten?
          </Link>
        </p>
      </main>

      <img className="company-logo" src="/nextlevelweb-logo.png" alt="NextLevelWeb, technology with purpose" />
    </div>
  );
}