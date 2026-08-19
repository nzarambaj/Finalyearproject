import { Link, useNavigate } from "react-router-dom";
import {
  IconLayoutDashboard,
  IconListCheck,
  IconClipboardList,
  IconPlus,
  IconUsers,
  IconStethoscope,
  IconDeviceDesktop,
  IconCategory,
  IconChartBar,
  IconUser
} from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";

function NavLink({ to, icon, label }) {
  return (
    <Link style={linkStyle} to={to}>
      {icon}
      {label}
    </Link>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f5f7fb"
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: "250px",
          background: "#111827",
          color: "white",
          padding: "20px"
        }}
      >
        <h2
          style={{
            marginBottom: "30px",
            fontSize: "20px"
          }}
        >
          Medical Imaging
        </h2>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}
        >
          {user?.role !== "admin" && (
            <NavLink
              to="/dashboard"
              icon={<IconLayoutDashboard size={18} stroke={1.75} />}
              label="Dashboard"
            />
          )}

          {/* Technician Menu */}
          {user?.role === "technician" && (
            <NavLink
              to="/requests"
              icon={<IconListCheck size={18} stroke={1.75} />}
              label="Imaging Requests"
            />
          )}

          {/* Doctor Menu */}
          {user?.role === "doctor" && (
            <>
              <NavLink
                to="/worklist"
                icon={<IconClipboardList size={18} stroke={1.75} />}
                label="Worklist"
              />
              <NavLink
                to="/requests/new"
                icon={<IconPlus size={18} stroke={1.75} />}
                label="New Request"
              />
              <NavLink
                to="/requests"
                icon={<IconListCheck size={18} stroke={1.75} />}
                label="Imaging Requests"
              />
            </>
          )}

          {/* Admin Menu */}
          {user?.role === "admin" && (
            <>
              <NavLink
                to="/admin/dashboard"
                icon={<IconLayoutDashboard size={18} stroke={1.75} />}
                label="Overview"
              />
              <NavLink
                to="/admin/users"
                icon={<IconUsers size={18} stroke={1.75} />}
                label="Users"
              />
              <NavLink
                to="/admin/doctors"
                icon={<IconStethoscope size={18} stroke={1.75} />}
                label="Doctors"
              />
              <NavLink
                to="/admin/technicians"
                icon={<IconDeviceDesktop size={18} stroke={1.75} />}
                label="Technicians"
              />
              <NavLink
                to="/admin/requests"
                icon={<IconListCheck size={18} stroke={1.75} />}
                label="Imaging Requests"
              />
              <NavLink
                to="/admin/specializations"
                icon={<IconCategory size={18} stroke={1.75} />}
                label="Specializations"
              />
              <NavLink
                to="/admin/reports"
                icon={<IconChartBar size={18} stroke={1.75} />}
                label="Reports"
              />
            </>
          )}

          <NavLink
            to="/profile"
            icon={<IconUser size={18} stroke={1.75} />}
            label="Profile"
          />
        </nav>
      </aside>

      {/* Main Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Top Bar */}
        <header
          style={{
            background: "white",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e5e7eb"
          }}
        >
          <div>
            <strong>
              Welcome, {user?.full_name}
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}
          >
            <span
              style={{
                background: "#2563eb",
                color: "white",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                textTransform: "capitalize"
              }}
            >
              {user?.role}
            </span>

            <button
              onClick={handleLogout}
              style={{
                background: "#dc2626",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main
          style={{
            flex: 1,
            padding: "24px",
            display: "flex",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "1200px"
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

const linkStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: "white",
  textDecoration: "none",
  padding: "10px",
  borderRadius: "6px",
  background: "#1f2937",
  fontSize: "14px"
};