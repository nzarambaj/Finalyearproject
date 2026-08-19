import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconUserPlus,
  IconKey,
  IconUserOff,
  IconUserCheck
} from "@tabler/icons-react";

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import { adminGet, adminSend } from "../services/adminApi";
import { API } from "../services/api";

const PAGE_SIZE = 13;

/*
 * User management: list users (filterable by role),
 * register new ones, change a doctor's specialization,
 * deactivate/reactivate, and reset passwords.
 */
export default function AdminUsersPage({
  initialRole = "all"
}) {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [resetFor, setResetFor] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    setRoleFilter(initialRole);
  }, [initialRole]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await adminGet(
        `/users?role=${roleFilter}`
      );
      setUsers(list);
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/doctors/specializations`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => setSpecializations(d))
      .catch(() => {});
  }, []);

  const flash = (msg) => {
    setMessage(msg);
    setError("");
    setTimeout(() => setMessage(""), 2500);
  };

  const toggleActive = async (u) => {
    try {
      await adminSend("PATCH", `/users/${u.id}`, {
        active: !u.active
      });
      flash(
        u.active
          ? `${u.full_name} deactivated`
          : `${u.full_name} reactivated`
      );
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const changeSpecialization = async (u, specId) => {
    try {
      await adminSend("PATCH", `/users/${u.id}`, {
        specialization_id: Number(specId)
      });
      flash(`${u.full_name}'s specialization updated`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitReset = async () => {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    try {
      await adminSend(
        "POST",
        `/users/${resetFor.id}/password`,
        { password: newPassword }
      );
      flash(`Password reset for ${resetFor.full_name}`);
      setResetFor(null);
      setNewPassword("");
    } catch (err) {
      setError(err.message);
    }
  };

  const pageCount = Math.ceil(users.length / PAGE_SIZE) || 1;
  const paged = users.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <Layout>
      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "14px"
          }}
        >
          <h2 style={{ margin: 0 }}>
            {roleFilter === "doctor"
              ? "Doctors"
              : roleFilter === "technician"
              ? "Technicians"
              : "User management"}
          </h2>
          <button
            style={{
              ...primaryBtn,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
            onClick={() => navigate("/register")}
          >
            <IconUserPlus size={16} /> Register user
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "14px"
          }}
        >
          {["all", "doctor", "technician"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              style={{
                ...pill,
                background:
                  roleFilter === r ? "#2563eb" : "#e5e7eb",
                color: roleFilter === r ? "white" : "#374151"
              }}
            >
              {r === "all"
                ? "All"
                : r === "doctor"
                ? "Doctors"
                : "Technicians"}
            </button>
          ))}
        </div>

        {message && <div style={successBox}>{message}</div>}
        {error && <div style={errorBox}>{error}</div>}

        {resetFor && (
          <div style={{ ...card, marginBottom: "14px" }}>
            <h3 style={{ marginTop: 0 }}>
              Reset password — {resetFor.full_name}
            </h3>
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap"
              }}
            >
              <input
                type="text"
                placeholder="New password (min 6 chars)"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                style={input}
              />
              <button style={primaryBtn} onClick={submitReset}>
                Save
              </button>
              <button
                style={btn}
                onClick={() => {
                  setResetFor(null);
                  setNewPassword("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={card}>
          {loading ? (
            <p>Loading...</p>
          ) : users.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No users.</p>
          ) : (
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Name</th>
                  <th style={th}>Email</th>
                  <th style={th}>Role</th>
                  <th style={th}>Specialization</th>
                  <th style={th}>Status</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((u) => (
                  <tr key={u.id}>
                    <td style={td}>{u.full_name}</td>
                    <td style={{ ...td, color: "#6b7280" }}>
                      {u.email}
                    </td>
                    <td style={td}>{u.role}</td>
                    <td style={td}>
                      {u.role === "doctor" ? (
                        <select
                          value={u.specialization_id || ""}
                          onChange={(e) =>
                            changeSpecialization(
                              u,
                              e.target.value
                            )
                          }
                          style={select}
                        >
                          <option value="">—</option>
                          {specializations.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>
                          —
                        </span>
                      )}
                    </td>
                    <td style={td}>
                      <span
                        style={{
                          background: u.active
                            ? "#dcfce7"
                            : "#fee2e2",
                          color: u.active
                            ? "#166534"
                            : "#b91c1c",
                          padding: "2px 10px",
                          borderRadius: "10px",
                          fontSize: "12px"
                        }}
                      >
                        {u.active ? "active" : "deactivated"}
                      </span>
                    </td>
                    <td style={td}>
                      <button
                        style={{
                          ...iconBtn,
                          color: u.active
                            ? "#b91c1c"
                            : "#166534"
                        }}
                        onClick={() => toggleActive(u)}
                        title={
                          u.active
                            ? "Deactivate"
                            : "Reactivate"
                        }
                      >
                        {u.active ? (
                          <IconUserOff size={16} />
                        ) : (
                          <IconUserCheck size={16} />
                        )}
                        {u.active
                          ? "Deactivate"
                          : "Reactivate"}
                      </button>
                      <button
                        style={{
                          ...iconBtn,
                          color: "#2563eb"
                        }}
                        onClick={() => {
                          setResetFor(u);
                          setNewPassword("");
                        }}
                        title="Reset password"
                      >
                        <IconKey size={16} />
                        Reset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
const table = {
  width: "100%",
  borderCollapse: "collapse"
};
const th = {
  textAlign: "left",
  padding: "8px 6px",
  borderBottom: "1px solid #ddd",
  fontSize: "13px",
  color: "#6b7280"
};
const td = {
  padding: "10px 6px",
  borderBottom: "1px solid #eee",
  fontSize: "14px"
};
const primaryBtn = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "9px 15px",
  borderRadius: "8px",
  cursor: "pointer"
};
const btn = {
  background: "white",
  color: "#111827",
  border: "1px solid #d1d5db",
  padding: "9px 15px",
  borderRadius: "8px",
  cursor: "pointer"
};
const smallBtn = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
  marginRight: "12px",
  padding: 0
};
const iconBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
  marginRight: "14px",
  padding: 0
};
const pill = {
  border: "none",
  padding: "6px 14px",
  borderRadius: "20px",
  cursor: "pointer",
  fontSize: "13px"
};
const input = {
  flex: 1,
  minWidth: "220px",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px"
};
const select = {
  padding: "6px 8px",
  border: "1px solid #d1d5db",
  borderRadius: "6px"
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
