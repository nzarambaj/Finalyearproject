import {
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import StudiesPage from "./pages/StudiesPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";
import UploadStudyPage from "./pages/UploadStudyPage";
import DoctorStudiesPage from "./pages/DoctorStudiesPage";
import ViewStudyPage from "./pages/ViewStudyPage";
import NewRequestPage from "./pages/NewRequestPage";
import RequestsPage from "./pages/RequestsPage";
import RequestDetailPage from "./pages/RequestDetailPage";

export default function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<Navigate to="/login" />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["doctor","technician","admin"]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/studies"
        element={
          <ProtectedRoute roles={["doctor","technician","admin"]}>
            <StudiesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor-studies"
        element={
          <ProtectedRoute roles={["doctor"]}>
            <DoctorStudiesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/study/:id"
        element={
          <ProtectedRoute
            roles={["doctor"]}
          >
            <ViewStudyPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute roles={["doctor","technician","admin"]}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route
        path="/upload-study"
        element={
          <ProtectedRoute
            roles={["technician"]}
          >
            <UploadStudyPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/requests"
        element={
          <ProtectedRoute roles={["doctor","technician","admin"]}>
            <RequestsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/requests/new"
        element={
          <ProtectedRoute roles={["doctor"]}>
            <NewRequestPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/requests/:id"
        element={
          <ProtectedRoute roles={["doctor","technician","admin"]}>
            <RequestDetailPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}