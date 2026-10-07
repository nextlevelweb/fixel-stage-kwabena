import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";


import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ProjectDetail from "./pages/projectdetail";
import Review from "./pages/Review";

// This component holds all the pages of Fixel.
// Each <Route> says: when the address looks like this, show that page.
// <ProtectedRoute> around a page means: only for logged-in employees.
// The review page has no ProtectedRoute, a client opens it without an account.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Login />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
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
/>

        <Route
          path="/projects"
          element={<Navigate to="/dashboard" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}