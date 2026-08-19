import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconUserPlus,
  IconListCheck,
  IconCategory,
  IconUsers
} from "@tabler/icons-react";

import Layout from "../components/Layout";
import TableScroll from "../components/TableScroll";
import { adminGet } from "../services/adminApi";
import { API } from "../services/api";

/*
 * Admin overview: headline stats, quick actions, and a
 * snapshot of recent imaging requests.
 */
export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await adminGet("/stats");
        setStats(s);

        const token = localStorage.getItem("token");
        const r = await fetch(`${API}/requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const list = await r.json();
        if (r.ok) setRequests(list.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Layout>
      <div style={{ width: "100%" }}>
        <h2 style={{ marginTop: 0 }}>Admin overview</h2>

        {loading || !stats ? (
          <p>Loading...</p>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "14px",
                marginBottom: "20px"
              }}
            >
              <Stat
                label="Total users"
                value={stats.total_users}
                hint={`${stats.doctors} doctors · ${stats.technicians} technicians`}
              />
              <Stat
                label="Imaging requests"
                value={stats.total_requests}
                hint={`${stats.pending_requests} pending`}
                hintColor="#b45309"
              />
              <Stat
                label="Reports issued"
                value={stats.reports_this_month}
                hint="this month"
              />
              <Stat
                label="Patients"
                value={stats.patients_this_month}
                hint="this month"
              />
              <Stat
                label="Deactivated users"
                value={stats.deactivated}
                hint="no longer sign in"
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "22px"
              }}
            >
              <button
                style={primaryBtn}
                onClick={() => navigate("/register")}
              >
                <IconUserPlus size={17} /> Register user
              </button>
              <button
                style={btn}
                onClick={() => navigate("/admin/requests")}
              >
                <IconListCheck size={17} /> Manage worklist
              </button>
              <button
                style={btn}
                onClick={() =>
                  navigate("/admin/specializations")
                }
              >
                <IconCategory size={17} /> Manage
                specializations
              </button>
              <button
                style={btn}
                onClick={() => navigate("/admin/users")}
              >
                <IconUsers size={17} /> Manage users
              </button>
            </div>

            <div style={card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px"
                }}
              >
                <h3 style={{ margin: 0 }}>
                  Recent imaging requests
                </h3>
                <button
                  style={linkBtn}
                  onClick={() => navigate("/admin/requests")}
                >
                  View all
                </button>
              </div>

              {requests.length === 0 ? (
                <p style={{ color: "#6b7280" }}>
                  No requests yet.
                </p>
              ) : (
                <TableScroll maxHeight="320px">
                  <table style={table}>
                  <thead>
                    <tr>
                      <th style={th}>Request</th>
                      <th style={th}>Patient</th>
                      <th style={th}>Exam</th>
                      <th style={th}>Doctor</th>
                      <th style={th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id}>
                        <td style={{ ...td, fontWeight: 600 }}>
                          {r.request_number}
                        </td>
                        <td style={td}>{r.patient_name}</td>
                        <td style={td}>{r.exam_type}</td>
                        <td style={td}>{r.doctor_name}</td>
                        <td style={td}>
                          <StatusPill status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </TableScroll>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function Stat({ label, value, hint, hintColor }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "10px",
        padding: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}
    >
      <div style={{ fontSize: "13px", color: "#6b7280" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: 700,
          margin: "4px 0"
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: hintColor || "#6b7280"
        }}
      >
        {hint}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const done = status === "completed";
  return (
    <span
      style={{
        background: done ? "#dcfce7" : "#fef9c3",
        color: done ? "#166534" : "#854d0e",
        padding: "2px 10px",
        borderRadius: "10px",
        fontSize: "12px"
      }}
    >
      {done ? "completed" : "pending"}
    </span>
  );
}

const card = {
  background: "white",
  borderRadius: "12px",
  padding: "18px 20px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
};
const table = { width: "100%", borderCollapse: "collapse" };
const th = {
  textAlign: "left",
  padding: "8px 6px",
  borderBottom: "1px solid #ddd",
  fontSize: "13px",
  color: "#6b7280",
  position: "sticky",
  top: 0,
  background: "white",
  zIndex: 1
};
const td = {
  padding: "10px 6px",
  borderBottom: "1px solid #eee",
  fontSize: "14px"
};
const flexBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px"
};
const primaryBtn = {
  ...flexBtn,
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer"
};
const btn = {
  ...flexBtn,
  background: "white",
  color: "#111827",
  border: "1px solid #d1d5db",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer"
};
const linkBtn = {
  background: "none",
  border: "none",
  color: "#2563eb",
  cursor: "pointer",
  fontSize: "13px"
};
