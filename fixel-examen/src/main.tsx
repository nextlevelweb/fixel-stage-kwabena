import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css"; // this is how the whole app gets the styles from chapter 7

// Finds the <div id="root"> that's in index.html (chapter 4.3) and
// "mounts" the whole React app there. This is the very first thing that runs.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);