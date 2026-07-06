import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();

  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!email.trim()) {
    setError("Email is required");
    return;
  }

  if (!password.trim()) {
    setError("Password is required");
    return;
  }

  try {
    setError("");

    const data = await loginUser(
      email,
      password
    );

    login(data.token, data.user);

    if (
      ["doctor", "technician", "admin"].includes(
        data.user.role
      )
    ) {
      navigate("/dashboard");
    }
  } catch (err) {
    setError(err.message);
  }
};

    return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        backgroundImage: "url('/images/login-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden"
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)"
        }}
      />

      {/* Login Card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "8px",
            color: "#2563eb"
          }}
        >
          Medical Imaging Platform
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            marginBottom: "24px",
            fontSize: "14px"
          }}
        >
          Sign in to continue
        </p>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#b91c1c",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "16px",
              textAlign: "center",
              fontSize: "14px"
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
            gap: "12px"
          }}
        >
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              boxSizing: "border-box",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px"
            }}
          />

          <div
            style={{
              position: "relative",
              width: "100%"
            }}
          >
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                paddingRight: "45px",
                boxSizing: "border-box",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
                color: "#6b7280"
              }}
            >
              {showPassword ? (
                /* Eye OFF */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7
                    1.03-2.34 2.99-4.29 5.5-5.5M6.7 6.7A9.956 9.956 0 0112 5
                    c5 0 9.27 3.11 11 7a10.05 10.05 0 01-4.17 5.17M15 12a3 3 0 11-6 0
                    3 3 0 016 0z"
                  />
                </svg>
              ) : (
                /* Eye ON */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5
                    c4.477 0 8.268 2.943 9.542 7
                    -1.274 4.057-5.065 7-9.542 7
                    -4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: "6px",
              backgroundColor: "#2563eb",
              color: "white",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "4px"
            }}
          >
            Sign In
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "14px",
            color: "#6b7280"
          }}
        >
          Don't have an account?{" "}
          <a
            href="/register"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            Register
          </a>
        </p>
      </div>
    </div>
  );
}