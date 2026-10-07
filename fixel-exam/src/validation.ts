// Small checks used by several pages.
// Every check returns an error text, or "" when everything is fine.

// This is the error text for a wrong website address.
// We keep it in one place, because two checks below use it.
const URL_ERROR = "Voer een geldige URL in (bv. https://...)";

// This function checks the project name.
// It gets the text the user typed and gives back an error text.
// It gives back an empty text ("") when the name is fine.
// A name needs 1 to 80 characters (FE-02).
export function checkName(name: string): string {
  const text = name.trim();

  if (text == "") {
    return "Geef het project een naam";
  }

  if (text.length > 80) {
    return "De naam mag maximaal 80 tekens zijn";
  }

  return "";
}

// This function checks the website address.
// new URL(...) is a built-in way to read an address. When the text is not a real
// address it throws an error, and the try / catch turns that into our error text.
// The address must start with http or https (FE-03).
export function checkUrl(url: string): string {
  const text = url.trim();

  if (text == "") {
    return URL_ERROR;
  }

  let parsed: URL;

  try {
    parsed = new URL(text);
  } catch (error) {
    return URL_ERROR;
  }

  if (parsed.protocol != "http:" && parsed.protocol != "https:") {
    return URL_ERROR;
  }

  if (parsed.hostname == "") {
    return URL_ERROR;
  }

  return "";
}

// This function checks a feedback text or a reply: 1 to 500 characters.
// You give it the error text to show when the box is empty.
export function checkText(text: string, emptyError: string): string {
  const clean = text.trim();

  if (clean == "") {
    return emptyError;
  }

  if (clean.length > 500) {
    return "Maximaal 500 tekens";
  }

  return "";
}

// This function creates the secret part of the review link (TE-02).
// crypto.randomUUID() makes a long random code that nobody can guess.
// It fits a text column and a uuid column in the database.
export function makePublicKey(): string {
  return crypto.randomUUID();
}
