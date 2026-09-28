import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase"; // note the ../ : we're now in src/pages/

export default function Login() {
  // What the user types, plus any error message and whether we're waiting on Supabase.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Called as soon as you click "Inloggen" or press Enter in the form.
  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); // prevents the browser from reloading the page
    setError("");

    // Step 1: check it ourselves in the browser first, before bothering Supabase.
    if (!email.trim() || !password) {
      setError("Vul e-mail en wachtwoord in.");
      return;
    }

    // Step 2: ask Supabase to log in. Supabase itself compares the
    // password with the securely stored (hashed) version in the database.
    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (loginError) {
      // Deliberately a vague message: don't reveal whether the email address actually exists.
      setError("E-mail of wachtwoord onjuist.");
      setPassword(""); // password field clears itself, email stays as is
      return;
    }

    // Step 3: success -> on to the dashboard.
    navigate("/dashboard");
  }

  return (
    <div className="page login-page">
      <form className="card" onSubmit={handleSubmit}>
        <p className="brand">FIXEL</p>
        <p className="subtitle">Log in als medewerker</p>

        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />

        <label htmlFor="password">Wachtwoord</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Bezig..." : "Inloggen"}
        </button>

        <p className="hint">
          Na inloggen → Dashboard. Na uitloggen → geen toegang meer tot projecten (FE-01).
        </p>
      </form>
    </div>
  );
}