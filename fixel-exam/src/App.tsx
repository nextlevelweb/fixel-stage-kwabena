import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";


import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/projects";
import ProtectedRoute from "./components/ProtectedRoute";
import ProjectDetail from "./pages/projectdetail";
import Review from "./pages/Review";

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
  path="/review/:publicKey"
  element={<Review />}
/>

  <Route
  path="/projects/:id"
  element={

    <ProtectedRoute>

      <ProjectDetail />

    </ProtectedRoute>

  }
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
        />
}