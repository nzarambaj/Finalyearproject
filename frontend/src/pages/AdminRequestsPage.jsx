import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconExternalLink } from "@tabler/icons-react";

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import TableScroll from "../components/TableScroll";
import { adminGet, adminSend } from "../services/adminApi";
import { API } from "../services/api";

const PAGE_SIZE = 13;

/*
 * Worklist management: view every imaging request,
 * search, reassign to another doctor, and change
 * priority.
 */
export default function AdminRequestsPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (term = "") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const query = term
        ? `?search=${encodeURIComponent(term)}`
        : "";
      const r = await fetch(`${API}/requests${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = await r.json();
      if (r.ok) {
        setRequests(list);
        setPage(1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    adminGet("/doctors")
      .then(setDoctors)
      .catch(() => {});
  }, [load]);

  const flash = (msg) => {
    setMessage(msg);
    setError("");
    setTimeout(() => setMessage(""), 2500);
  };

  const reassign = async (req, doctorId) => {
    try {
      await adminSend("PATCH", `/requests/${req.id}`, {
        doctor_id: Number(doctorId)
      });
      flash(`${req.request_number} reassigned`);
      load(search);
    } catch (err) {
      setError(err.message);
    }
  };

  const setPriority = async (req, priority) => {
    try {
      await adminSend("PATCH", `/requests/${req.id}`, {
        priority
      });
      flash(`${req.request_number} set to ${priority}`);
      load(search);
    } catch (err) {
      setError(err.message);
    }
  };

  const pageCount =
    Math.ceil(requests.length / PAGE_SIZE) || 1;
  const paged = requests.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <Layout>
      <div style={{ width: "100%" }}>
        <h2 style={{ marginTop: 0 }}>
          Worklist management
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(search);
          }}
          style={{
            display: "flex",
            gap: "10px",
            margin: "0 0 14px"
          }}
        >
          <input
            type="text"
            placeholder="Search by request number or patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px"
            }}
          />
          <button style={dark}>Search</button>
        </form>

        {message && <div style={successBox}>{message}</div>}
        {error && <div style={errorBox}>{error}</div>}

        <div style={card}>
          {loading ? (
            <p>Loading...</p>
          ) : requests.length === 0 ? (
            <p style={{ color: "#6b7280" }}>
              No requests found.
            </p>
          ) : (
            <TableScroll>
              <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Request</th>
                  <th style={th}>Patient</th>
                  <th style={th}>Exam</th>
                  <th style={th}>Doctor</th>
                  <th style={th}>Priority</th>
                  <th style={th}>Status</th>
                  <th style={th}>Open</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r) => (
                  <tr key={r.id}>
                    <td style={{ ...td, fontWeight: 600 }}>
                      {r.request_number}
                    </td>
                    <td style={td}>{r.patient_name}</td>
                    <td style={td}>{r.exam_type}</td>
                    <td style={td}>
                      <select
                        value={r.doctor_id}
                        onChange={(e) =>
                          reassign(r, e.target.value)
                        }
                        style={select}
                      >
                        {doctors.every(
                          (d) => d.id !== r.doctor_id
                        ) && (
                          <option value={r.doctor_id}>
                            {r.doctor_name}
                          </option>
                        )}
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.full_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={td}>
                      <select
                        value={r.priority || "normal"}
                        onChange={(e) =>
                          setPriority(r, e.target.value)
                        }
                        style={select}
                      >
                        <option value="normal">
                          Normal
                        </option>
                        <option value="urgent">
                          Urgent
                        </option>
                      </select>
                    </td>
                    <td style={td}>
                      <span
                        style={{
                          background:
                            r.status === "completed"
                              ? "#dcfce7"
                              : "#fef9c3",
                          color:
                            r.status === "completed"
                              ? "#166534"
                              : "#854d0e",
                          padding: "2px 10px",
                          borderRadius: "10px",
                          fontSize: "12px"
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={td}>
                      <button
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: "none",
                          border: "none",
                          color: "#2563eb",
                          cursor: "pointer",
                          padding: 0
                        }}
                        onClick={() =>
                          navigate(`/requests/${r.id}`)
                        }
                      >
                        <IconExternalLink size={16} />
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </TableScroll>
          )}
          <Pagination
            page={page}
            pageCount={pageCount}
            onPage={setPage}
          />
        </div>
      </div>
    </Layout>
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
const select = {
  padding: "6px 8px",
  border: "1px solid #d1d5db",
  borderRadius: "6px"
};
const dark = {
  background: "#111827",
  color: "white",
  border: "none",
  padding: "10px 18px",
  borderRadius: "6px",
  cursor: "pointer"
};
const successBox = {
  background: "#dcfce7",
  color: "#166534",
  padding: "10px 12px",
  borderRadius: "6px",
  marginBottom: "12px"
};
const errorBox = {
  background: "#fee2e2",
  color: "#b91c1c",
  padding: "10px 12px",
  borderRadius: "6px",
  marginBottom: "12px"
};
