import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import { API } from "../services/api";

/*
 * Doctor worklist overview: headline stats and the
 * full list of imaging requests with a read-status
 * badge. Mirrors the RIS-style dashboard.
 */
export default function WorklistPage() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API}/requests/worklist`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const body = await response.json();

      if (response.ok) {
        setData(body);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString(
    undefined,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

  // Any doctor can open any request to view it; only
  // the requesting doctor can comment on it.
  const canOpen = () => true;

  const stats = data?.stats;
  const delta = stats
    ? stats.todays_studies - stats.yesterday_studies
    : 0;

  return (
    <Layout>
      <div style={{ width: "100%" }}>
        <h2 style={{ marginBottom: "4px" }}>
          Worklist overview
        </h2>

        <p
          style={{
            color: "#6b7280",
            marginTop: 0
          }}
        >
          {today} — Radiology Information System
        </p>

        {loading ? (
          <p>Loading...</p>
        ) : !data ? (
          <p>Unable to load the worklist.</p>
        ) : (
          <>
            {/* Stat cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
                marginBottom: "24px"
              }}
            >
              <StatCard
                label="Today's studies"
                value={stats.todays_studies}
                hint={
                  delta === 0
                    ? "Same as yesterday"
                    : `${delta > 0 ? "↑" : "↓"} ${Math.abs(
                        delta
                      )} since yesterday`
                }
                hintColor={
                  delta >= 0 ? "#16a34a" : "#dc2626"
                }
              />

              <StatCard
                label="Pending reads"
                value={stats.pending_reads}
                hint={
                  stats.urgent_reads > 0
                    ? `${stats.urgent_reads} urgent`
                    : "None urgent"
                }
                hintColor={
                  stats.urgent_reads > 0
                    ? "#dc2626"
                    : "#6b7280"
                }
              />

              <StatCard
                label="Reports issued"
                value={stats.reports_issued}
                hint="This month"
                hintColor="#6b7280"
              />

              <StatCard
                label="Active patients"
                value={stats.active_patients}
                hint="This month"
                hintColor="#6b7280"
              />
            </div>

            {/* Worklist panel (full width) */}
            <div
              style={{
                background: "white",
                borderRadius: "10px",
                padding: "20px",
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.1)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px"
                }}
              >
                <h3 style={{ margin: 0 }}>Worklist</h3>

                <span
                  style={{
                    background: "#eef2ff",
                    color: "#4338ca",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 600
                  }}
                >
                  {data.pending_count} pending
                </span>
              </div>

              {data.items.length === 0 ? (
                <p style={{ color: "#6b7280" }}>
                  No requests yet.
                </p>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse"
                  }}
                >
                  <tbody>
                    {data.items.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() =>
                          canOpen(item) &&
                          navigate(
                            `/requests/${item.id}`
                          )
                        }
                        style={{
                          borderTop:
                            "1px solid #f0f0f0",
                          cursor: canOpen(item)
                            ? "pointer"
                            : "default"
                        }}
                      >
                        <td
                          style={{
                            padding: "12px 8px",
                            width: "44px"
                          }}
                        >
                          <Avatar
                            name={item.patient_name}
                          />
                        </td>

                        <td style={{ padding: "12px 8px" }}>
                          <div
                            style={{ fontWeight: 600 }}
                          >
                            {item.patient_name}
                          </div>
                          <div
                            style={{
                              color: "#6b7280",
                              fontSize: "13px"
                            }}
                          >
                            {item.exam_type} —{" "}
                            {item.request_number}
                          </div>
                        </td>

                        <td
                          style={{
                            padding: "12px 8px",
                            color: "#6b7280",
                            fontSize: "13px"
                          }}
                        >
                          {item.doctor_name}
                        </td>

                        <td
                          style={{
                            padding: "12px 8px",
                            textAlign: "right",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {item.priority ===
                            "urgent" && (
                            <Badge
                              text="Urgent"
                              bg="#fee2e2"
                              color="#b91c1c"
                            />
                          )}{" "}
                          <StatusBadge
                            status={item.read_status}
                          />
                        </td>

                        <td
                          style={{
                            padding: "12px 8px",
                            textAlign: "right",
                            color: "#9ca3af",
                            fontSize: "13px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {new Date(
                            item.created_at
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ label, value, hint, hintColor }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "10px",
        padding: "18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: "14px"
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "32px",
          fontWeight: 700,
          margin: "6px 0 2px"
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: "13px",
          color: hintColor
        }}
      >
        {hint}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: {
      text: "Pending",
      bg: "#fef9c3",
      color: "#854d0e"
    },
    review: {
      text: "Review",
      bg: "#dbeafe",
      color: "#1e40af"
    },
    ready: {
      text: "Ready",
      bg: "#dcfce7",
      color: "#166534"
    }
  };

  const s = map[status] || map.pending;

  return (
    <Badge text={s.text} bg={s.bg} color={s.color} />
  );
}

function Badge({ text, bg, color }) {
  return (
    <span
      style={{
        background: bg,
        color,
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600
      }}
    >
      {text}
    </span>
  );
}

function Avatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "#e0e7ff",
        color: "#4338ca",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: 600
      }}
    >
      {initials}
    </div>
  );
}
