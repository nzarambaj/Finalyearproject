import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
          <Link
            style={linkStyle}
            to="/dashboard"
          >
            Dashboard
          </Link>

          {/* Technician Menu */}
          {user?.role === "technician" && (
            <>
              <Link
                style={linkStyle}
                to="/studies"
              >
                My Studies
              </Link>

              <Link
                style={linkStyle}
                to="/upload-study"
              >
                Upload Study
              </Link>
            </>
          )}

          {/* Doctor Menu */}
          {user?.role === "doctor" && (
            <Link
              style={linkStyle}
              to="/doctor-studies"
            >
              Assigned Studies
            </Link>
          )}

          {/* Admin Menu (future use) */}
          {user?.role === "admin" && (
            <Link
              style={linkStyle}
              to="/studies"
            >
              All Studies
            </Link>
          )}

          <Link
            style={linkStyle}
            to="/profile"
          >
            Profile
          </Link>
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
  color: "white",
  textDecoration: "none",
  padding: "10px",
  borderRadius: "6px",
  background: "#1f2937"
};