import { useState } from "react"; // useState keeps values that the screen shows
import { Link } from "react-router-dom"; // Link goes to another page without reloading
import { supabase } from "../supabase"; // our connection with Supabase
import "../styles/Login.css";

// This page is for an employee who forgot the password.
// He fills in his e-mail and Supabase sends him a link to choose a new password.
export default function ForgotPassword() {
  const [email, setEmail] = useState(""); // the e-mail that is typed
  const [error, setError] = useState(""); // the error text ("" = no error)
  const [sent, setSent] = useState(false); // true when the e-mail is sent

  // This function runs when the button is clicked
  async function sendLink() {
    setError(""); // remove the old error

    if (email.trim() == "") { // nothing typed (trim removes spaces)
      setError("Vul je e-mail in"); // show the error
      return; // stop here
    }

    // Ask Supabase to send the e-mail. The link in it brings the employee to /reset-password
    const result =
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + "/reset-password" // where the link goes to
      });

    if (result.error) { // Supabase could not send it
      setError("De e-mail kon niet worden verstuurd, probeer opnieuw");
      return;
    }

    setSent(true); // show the "e-mail is sent" message
  }

  let message = null; // the message above the button, empty for now

  if (error != "") { // there is an error: show it in red
    message = (
      <p className="error">
        Foutmelding: {error}
      </p>
    );
  }

  if (sent) { // the e-mail is sent: show it in green
    message = (
      <p className="success">
        Als dit e-mailadres bij een account hoort, krijg je een e-mail met een link
        om een nieuw wachtwoord te kiezen.
      </p>
    );
  }

  return (
    <div className="login-page"> {/* grey page with the box in the middle */}
      <main className="login"> {/* the white box */}
        <h1>Fixel</h1>

        <h2>Wachtwoord vergeten</h2>

        <label>
          E-mail
        </label>

        <input
          type="email"
          value={email} // the input shows the value of "email"
          onChange={function (e) { // runs on every key press
            setEmail(e.target.value); // save what is typed
          }}
        />

        {message} {/* the red or green message, or nothing */}

        <button
          type="button"
          onClick={sendLink} // click = run sendLink
        >
          Verstuur link
        </button>

        <p className="login-link">
          <Link to="/">Terug naar inloggen</Link> {/* back to the login page */}
        </p>
      </main>

      <img className="company-logo" src="/nextlevelweb-logo.png" alt="NextLevelWeb, technology with purpose" />
    </div>
  );
}
