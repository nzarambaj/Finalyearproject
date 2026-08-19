import { useCallback, useEffect, useState } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX
} from "@tabler/icons-react";

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import { adminSend } from "../services/adminApi";
import { API } from "../services/api";

const PAGE_SIZE = 13;

/*
 * Specialization management: list, add, rename, remove
 * (removal blocked when a specialization is in use).
 */
export default function AdminSpecializationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const r = await fetch(
        `${API}/doctors/specializations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const list = await r.json();
      if (r.ok) setItems(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg) => {
    setMessage(msg);
    setError("");
    setTimeout(() => setMessage(""), 2500);
  };

  const add = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await adminSend("POST", "/specializations", {
        name: newName.trim()
      });
      flash(`Added "${newName.trim()}"`);
      setNewName("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const rename = async (item) => {
    if (!editName.trim()) return;
    try {
      await adminSend(
        "PATCH",
        `/specializations/${item.id}`,
        { name: editName.trim() }
      );
      flash("Renamed");
      setEditId(null);
      setEditName("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (item) => {
    try {
      await adminSend(
        "DELETE",
        `/specializations/${item.id}`
      );
      flash(`Removed "${item.name}"`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const pageCount = Math.ceil(items.length / PAGE_SIZE) || 1;
  const paged = items.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <Layout>
      <div style={{ width: "100%", maxWidth: "760px" }}>
        <h2 style={{ marginTop: 0 }}>
          Specialization management
        </h2>

        {message && <div style={successBox}>{message}</div>}
        {error && <div style={errorBox}>{error}</div>}

        <form
          onSubmit={add}
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "16px"
          }}
        >
          <input
            type="text"
            placeholder="New specialization name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px"
            }}
          />
          <button
            style={{
              ...primaryBtn,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <IconPlus size={16} /> Add
          </button>
        </form>

        <div style={card}>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Specialization</th>
                  <th style={{ ...th, textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((item) => (
                  <tr key={item.id}>
                    <td style={td}>
                      {editId === item.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) =>
                            setEditName(e.target.value)
                          }
                          style={{
                            padding: "6px 8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            width: "260px"
                          }}
                        />
                      ) : (
                        item.name
                      )}
                    </td>
                    <td
                      style={{
                        ...td,
                        textAlign: "right"
                      }}
                    >
                      {editId === item.id ? (
                        <>
                          <button
                            style={{
                              ...smallBtn,
                              color: "#166534"
                            }}
                            onClick={() => rename(item)}
                          >
                            <IconCheck size={16} /> Save
                          </button>
                          <button
                            style={{
                              ...smallBtn,
                              color: "#6b7280"
                            }}
                            onClick={() => {
                              setEditId(null);
                              setEditName("");
                            }}
                          >
                            <IconX size={16} /> Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            style={{
                              ...smallBtn,
                              color: "#2563eb"
                            }}
                            onClick={() => {
                              setEditId(item.id);
                              setEditName(item.name);
                            }}
                          >
                            <IconEdit size={16} /> Rename
                          </button>
                          <button
                            style={{
                              ...smallBtn,
                              color: "#b91c1c"
                            }}
                            onClick={() => remove(item)}
                          >
                            <IconTrash size={16} /> Remove
                          </button>
                        </>
                      )}
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

        <p
          style={{
            color: "#6b7280",
            fontSize: "13px",
            marginTop: "12px"
          }}
        >
          A specialization that is assigned to a doctor or a
          study category can't be removed.
        </p>
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
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer"
};
const smallBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
  marginLeft: "12px",
  padding: 0
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
