import { useEffect, useState } from "react";

import Layout from "../components/Layout";
import { adminGet } from "../services/adminApi";
import { API } from "../services/api";

/*
 * Reports: headline figures plus request breakdowns by
 * exam type and by status, computed from the request
 * list.
 */
export default function AdminReportsPage() {
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
        if (r.ok) setRequests(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const countBy = (key) => {
    const map = {};
    requests.forEach((r) => {
      const k = r[key] || "—";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  };

  const byExam = countBy("exam_type");
  const completed = requests.filter(
    (r) => r.status === "completed"
  ).length;
  const pending = requests.length - completed;
  const max = Math.max(1, ...byExam.map((e) => e[1]));

  return (
    <Layout>
      <div style={{ width: "100%" }}>
        <h2 style={{ marginTop: 0 }}>Reports</h2>

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
                label="Total requests"
                value={stats.total_requests}
              />
              <Stat
                label="Pending"
                value={stats.pending_requests}
              />
              <Stat
                label="Reports this month"
                value={stats.reports_this_month}
              />
              <Stat
                label="Patients this month"
                value={stats.patients_this_month}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "16px"
              }}
            >
              <div style={card}>
                <h3 style={{ marginTop: 0 }}>
                  Requests by exam type
                </h3>
                {byExam.length === 0 ? (
                  <p style={{ color: "#6b7280" }}>
                    No data.
                  </p>
                ) : (
                  byExam.map(([name, n]) => (
                    <div
                      key={name}
                      style={{ marginBottom: "10px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "13px",
                          marginBottom: "4px"
                        }}
                      >
                        <span>{name}</span>
                        <span
                          style={{ color: "#6b7280" }}
                        >
                          {n}
                        </span>
                      </div>
                      <div
                        style={{
                          background: "#eef2ff",
                          borderRadius: "6px",
                          height: "10px"
                        }}
                      >
                        <div
                          style={{
                            width: `${(n / max) * 100}%`,
                            background: "#2563eb",
                            height: "100%",
                            borderRadius: "6px"
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={card}>
                <h3 style={{ marginTop: 0 }}>
                  Requests by status
                </h3>
                <StatusRow
                  label="Reported"
                  value={completed}
                  total={requests.length}
                  color="#16a34a"
                />
                <StatusRow
                  label="Pending"
                  value={pending}
                  total={requests.length}
                  color="#d97706"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ ...card, padding: "16px" }}>
      <div style={{ fontSize: "13px", color: "#6b7280" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: 700,
          marginTop: "4px"
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatusRow({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "13px",
          marginBottom: "4px"
        }}
      >
        <span>{label}</span>
        <span style={{ color: "#6b7280" }}>
          {value} ({pct}%)
        </span>
      </div>
      <div
        style={{
          background: "#f1f5f9",
          borderRadius: "6px",
          height: "10px"
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            background: color,
            height: "100%",
            borderRadius: "6px"
          }}
        />
      </div>
    </div>
  );
}

const card = {
  background: "white",
  borderRadius: "12px",
  padding: "18px 20px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
};
