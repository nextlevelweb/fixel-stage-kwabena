import { useState } from "react"; // useState keeps values that the screen shows
import { Link, useNavigate } from "react-router-dom"; // Link = a link, useNavigate = go to a page from code
import { supabase } from "../supabase"; // our connection with Supabase
import "../styles/Login.css";

// The employee lands here from the link in the e-mail.
// Supabase has already logged him in for a moment (a "recovery session"),
// so we only have to save the new password.
export default function ResetPassword() {
  const navigate = useNavigate(); // we use this to go to the login page later

  const [password, setPassword] = useState(""); // the new password
  const [repeat, setRepeat] = useState(""); // the password typed a second time
  const [error, setError] = useState(""); // the error text ("" = no error)
  const [done, setDone] = useState(false); // true when the password is saved

  // This function runs when the button is clicked
  async function savePassword() {
    setError(""); // remove the old error

    if (password.length < 8) { // too short
      setError("Het wachtwoord moet minimaal 8 tekens zijn");
      return; // stop here
    }

    if (password != repeat) { // the two passwords are not the same
      setError("De wachtwoorden zijn niet gelijk");
      return;
    }

    // Ask Supabase to save the new password of the user that is logged in by the e-mail link
    const result =
      await supabase.auth.updateUser({
        password: password
      });

    if (result.error) { // for example the link is too old
      setError("De link is verlopen of ongeldig. Vraag een nieuwe link aan.");
      return;
    }

    setDone(true); // show the "password changed" message

    // Log out, so he logs in again with the new password
    await supabase.auth.signOut();

    // After 2 seconds go to the login page
    setTimeout(function () {
      navigate("/");
    }, 2000); // 2000 milliseconds = 2 seconds
  }

  let message = null; // the message above the button, empty for now

  if (error != "") { // there is an error: show it in red
    message = (
      <p className="error">
        Foutmelding: {error}
      </p>
    );
  }

  if (done) { // the password is saved: show it in green
    message = (
      <p className="success">
        Je wachtwoord is gewijzigd. Je gaat naar het inlogscherm.
      </p>
    );
  }

  return (
    <div className="login-page"> {/* grey page with the box in the middle */}
      <main className="login"> {/* the white box */}
        <h1>Fixel</h1>

        <h2>Nieuw wachtwoord</h2>

        <label>
          Nieuw wachtwoord
        </label>

        <input
          type="password" // shows dots instead of letters
          value={password} // the input shows the value of "password"
          onChange={function (e) { // runs on every key press
            setPassword(e.target.value); // save what is typed
          }}
        />

        <label>
          Herhaal wachtwoord
        </label>

        <input
          type="password"
          value={repeat}
          onChange={function (e) {
            setRepeat(e.target.value);
          }}
        />

        {message} {/* the red or green message, or nothing */}

        <button
          type="button"
          onClick={savePassword} // click = run savePassword
        >
          Wachtwoord opslaan
        </button>

        <p className="login-link">
          <Link to="/forgot-password">Nieuwe link aanvragen</Link> {/* ask for a new e-mail */}
        </p>
      </main>

      <img className="company-logo" src="/nextlevelweb-logo.png" alt="NextLevelWeb, technology with purpose" />
    </div>
  );
}
