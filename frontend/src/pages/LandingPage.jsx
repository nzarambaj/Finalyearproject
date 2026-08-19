import { useNavigate } from "react-router-dom";
import {
  IconShieldLock,
  IconStethoscope,
  IconArrowRight
} from "@tabler/icons-react";

/*
 * Public entry page: a warm welcome over the shared
 * background image, with two ways in — Admin and
 * Employee (doctors / technicians).
 */
export default function LandingPage() {
  const navigate = useNavigate();

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
        backgroundRepeat: "no-repeat",
        overflow: "auto"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)"
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "760px",
          padding: "32px",
          textAlign: "center",
          color: "white"
        }}
      >
        <h1
          style={{
            fontSize: "40px",
            fontWeight: 700,
            margin: "0 0 12px",
            lineHeight: 1.15
          }}
        >
          Welcome to the Medical Imaging Platform
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#e5e7eb",
            maxWidth: "560px",
            margin: "0 auto 40px",
            lineHeight: 1.6
          }}
        >
          Secure, seamless access to imaging requests,
          studies, and radiology reports, all in one
          place. Choose how you'd like to sign in.
        </p>

        <div
          style={{
            display: "flex",
            gap: "22px",
            justifyContent: "center",
            flexWrap: "wrap"
          }}
        >
          <EntryButton
            icon={<IconShieldLock size={34} stroke={1.6} />}
            title="Admin Login"
            subtitle="Manage users, worklist & reports"
            onClick={() => navigate("/admin")}
          />

          <EntryButton
            icon={
              <IconStethoscope size={34} stroke={1.6} />
            }
            title="Employee Login"
            subtitle="Doctors & technicians"
            onClick={() => navigate("/login")}
          />
        </div>
      </div>
    </div>
  );
}

function EntryButton({ icon, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "260px",
        background: "rgba(255,255,255,0.97)",
        border: "none",
        borderRadius: "16px",
        padding: "26px 22px",
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        transition: "transform 0.15s ease"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform =
          "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <span
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "14px",
          background: "#eff6ff",
          color: "#2563eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {icon}
      </span>

      <span
        style={{
          fontSize: "20px",
          fontWeight: 600,
          color: "#111827"
        }}
      >
        {title}
      </span>

      <span
        style={{
          fontSize: "14px",
          color: "#6b7280"
        }}
      >
        {subtitle}
      </span>

      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "#2563eb",
          fontSize: "14px",
          fontWeight: 500,
          marginTop: "4px"
        }}
      >
        Continue <IconArrowRight size={16} />
      </span>
    </button>
  );
}
