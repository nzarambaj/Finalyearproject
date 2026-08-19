import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

/*
 * Administrator sign-in. The admin logs in with a
 * username + password, then registers users via the
 * normal registration form. There is no public
 * self-registration.
 */
export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // The admin account's login identifier is stored
      // in the email field, so we send the username there.
      const data = await loginUser(
        username.trim(),
        password
      );

      if (data.user.role !== "admin") {
        setError(
          "These credentials are not for an administrator."
        );
        return;
      }

      login(data.token, data.user);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: "url('/images/login-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)"
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "380px",
          background: "white",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
        }}
      >
        <h2
          style={{
            textAlign: "center",
            margin: "0 0 4px"
          }}
        >
          Administrator
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            marginTop: 0
          }}
        >
          Sign in to register users
        </p>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#b91c1c",
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "14px",
              marginBottom: "12px"
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px"
          }}
        >
          <input
            type="text"
            placeholder="Username"
            value={username}
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, paddingRight: "64px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                color: "#2563eb",
                cursor: "pointer",
                fontSize: "13px"
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              border: "none",
              borderRadius: "6px",
              background: "#2563eb",
              color: "white",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  boxSizing: "border-box"
};
