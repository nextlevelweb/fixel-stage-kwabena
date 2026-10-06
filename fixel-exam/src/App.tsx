import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";


import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/projects";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Login />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>

          }
        />


        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}