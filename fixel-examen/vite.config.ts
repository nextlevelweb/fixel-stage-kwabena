// This file tells Vite (the tool that turns your code into a real website) how to
// build your project. For Fixel that's very simple: "use React".
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // The react() plugin makes sure .tsx files (React + TypeScript) are understood.
  plugins: [react()],
});