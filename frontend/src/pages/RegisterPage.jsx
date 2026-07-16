import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { API as API_URL } from "../services/api";

export default function RegisterPage() {
const navigate = useNavigate();

const [specializations, setSpecializations] = useState([]);

const [fullName, setFullName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [role, setRole] = useState("doctor");
const [specializationId, setSpecializationId] = useState("");

const [showPassword, setShowPassword] = useState(false);

const [error, setError] = useState("");
const [success, setSuccess] = useState("");
const [loading, setLoading] = useState(false);

useEffect(() => {
fetch(`${API_URL}/doctors/specializations`)
.then((res) => res.json())
.then((data) => setSpecializations(data))
.catch((err) => console.error(err));
}, []);

const handleSubmit = async (e) => {
e.preventDefault();

if (!fullName.trim()) {
  setError("Full name is required");
  return;
}

if (!email.trim()) {
  setError("Email is required");
  return;
}

if (!password.trim()) {
  setError("Password is required");
  return;
}

if (password.length < 6) {
  setError("Password must be at least 6 characters");
  return;
}

if (!role) {
  setError("Please select a role");
  return;
}

if (role === "doctor" && !specializationId) {
  setError("Please select a specialization");
  return;
}

try {
  setLoading(true);
  setError("");
  setSuccess("");

  const response = await fetch(
    `${API_URL}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
        role,
        specialization_id:
          role === "doctor"
            ? specializationId
            : null
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Registration failed"
    );
  }

  setSuccess(
    "Account created successfully. Redirecting..."
  );

  setTimeout(() => {
    navigate("/login");
  }, 1500);

} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}

};

return (
    <div
    style={{
    minHeight: "100vh",
    backgroundImage:
    "url('/images/login-bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px"
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
        maxWidth: "450px",
        background: "rgba(255,255,255,0.95)",
        borderRadius: "12px",
        padding: "32px",
        boxShadow:
            "0 10px 30px rgba(0,0,0,0.25)"
        }}
    >
        <h2
        style={{
            textAlign: "center",
            color: "#2563eb",
            marginBottom: "10px"
        }}
        >
        Create Account
        </h2>

        <p
        style={{
            textAlign: "center",
            color: "#6b7280",
            marginBottom: "24px"
        }}
        >
        Medical Imaging Platform
        </p>

        {error && (
        <div
            style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "15px",
            textAlign: "center"
            }}
        >
            {error}
        </div>
        )}

        {success && (
        <div
            style={{
            background: "#dcfce7",
            color: "#166534",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "15px"
            }}
        >
            {success}
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
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) =>
            setFullName(e.target.value)
            }
            style={inputStyle}
        />

        <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) =>
            setEmail(e.target.value)
            }
            style={inputStyle}
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
            color: "#6b7280",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
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
                d="M3 3l18 18"
                />
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.58 10.58a2 2 0 102.83 2.83"
                />
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.88 5.09A9.77 9.77 0 0112 5c5 0 9.27 3.11 11 7a10.25 10.25 0 01-4.04 4.78"
                />
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6.23 6.23C4.63 7.35 3.33 9.02 2.46 12c1.73 3.89 6 7 11 7 1.56 0 3.05-.3 4.42-.85"
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

        <select
            value={role}
            onChange={(e) =>
            setRole(e.target.value)
            }
            style={inputStyle}
        >
            <option value="doctor">
            Doctor
            </option>

            <option value="technician">
            Technician
            </option>
        </select>

        {role === "doctor" && (
            <select
            value={specializationId}
            onChange={(e) =>
                setSpecializationId(
                e.target.value
                )
            }
            style={inputStyle}
            >
            <option value="">
                Select Specialization
            </option>

            {specializations.map((s) => (
                <option
                key={s.id}
                value={s.id}
                >
                {s.name}
                </option>
            ))}
            </select>
        )}

        <button
            type="submit"
            disabled={loading}
            style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "6px",
            background: "#2563eb",
            color: "white",
            fontWeight: "600",
            cursor: "pointer"
            }}
        >
            {loading
            ? "Creating Account..."
            : "Register"}
        </button>
        </form>

        <p
        style={{
            textAlign: "center",
            marginTop: "20px",
            color: "#6b7280"
        }}
        >
        Already have an account?{" "}
        <Link
            to="/login"
            style={{
            color: "#2563eb",
            fontWeight: "600",
            textDecoration: "none"
            }}
        >
            Sign In
        </Link>
        </p>
    </div>
    </div>
);
}

const inputStyle = {
width: "100%",
padding: "12px",
border: "1px solid #d1d5db",
borderRadius: "6px",
fontSize: "14px",
boxSizing: "border-box"
};
