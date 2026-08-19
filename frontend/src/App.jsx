import {
  Routes,
  Route
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
import WorklistPage from "./pages/WorklistPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminRequestsPage from "./pages/AdminRequestsPage";
import AdminSpecializationsPage from "./pages/AdminSpecializationsPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import LandingPage from "./pages/LandingPage";

export default function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<LandingPage />}
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
        path="/admin"
        element={<AdminLoginPage />}
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/doctors"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminUsersPage initialRole="doctor" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/technicians"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminUsersPage initialRole="technician" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminReportsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/requests"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminRequestsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/specializations"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminSpecializationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/register"
        element={
          <ProtectedRoute roles={["admin"]}>
            <RegisterPage />
          </ProtectedRoute>
        }
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
        path="/worklist"
        element={
          <ProtectedRoute roles={["doctor","admin"]}>
            <WorklistPage />
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