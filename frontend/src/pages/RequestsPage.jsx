import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import { API } from "../services/api";
import { useAuth } from "../context/AuthContext";

/*
 * All submitted imaging requests.
 * Every doctor and technician sees the list, but a
 * doctor can only open the requests they submitted;
 * technicians can open any request to upload the
 * image, and can search by request number or name.
 */
export default function RequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async (term = "") => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const query = term
        ? `?search=${encodeURIComponent(term)}`
        : "";

      const response = await fetch(
        `${API}/requests${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setRequests(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadRequests(search);
  };

  const canOpen = (request) =>
    user?.role === "technician" ||
    user?.role === "admin" ||
    request.doctor_id === user?.id;

  return (
    <Layout>
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <h2 style={{ margin: 0 }}>
            Imaging Requests
          </h2>

          {user?.role === "doctor" && (
            <button
              onClick={() =>
                navigate("/requests/new")
              }
              style={{
                background: "#2563eb",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              + New Request
            </button>
          )}
        </div>

        <form
          onSubmit={handleSearch}
          style={{
            display: "flex",
            gap: "10px",
            margin: "16px 0"
          }}
        >
          <input
            type="text"
            placeholder="Search by request number (e.g. REQ-00001) or patient name..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px"
            }}
          />

          <button
            type="submit"
            style={{
              background: "#111827",
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Search
          </button>
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : requests.length === 0 ? (
          <p>No requests found.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white"
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Request #</th>
                <th style={thStyle}>Patient</th>
                <th style={thStyle}>Exam</th>
                <th style={thStyle}>Doctor</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td
                    style={{
                      ...tdStyle,
                      fontWeight: 600
                    }}
                  >
                    {r.request_number}
                  </td>

                  <td style={tdStyle}>
                    {r.patient_name}
                  </td>

                  <td style={tdStyle}>
                    {r.exam_type}
                  </td>

                  <td style={tdStyle}>
                    {r.doctor_name}
                  </td>

                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        background:
                          r.status === "completed"
                            ? "#dcfce7"
                            : "#fef9c3",
                        color:
                          r.status === "completed"
                            ? "#166534"
                            : "#854d0e"
                      }}
                    >
                      {r.status}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    {new Date(
                      r.created_at
                    ).toLocaleString()}
                  </td>

                  <td style={tdStyle}>
                    {canOpen(r) ? (
                      <button
                        onClick={() =>
                          navigate(
                            `/requests/${r.id}`
                          )
                        }
                        style={{
                          background: "#2563eb",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          cursor: "pointer"
                        }}
                      >
                        Open
                      </button>
                    ) : (
                      <span
                        style={{
                          color: "#9ca3af",
                          fontSize: "13px"
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

const thStyle = {
  padding: "12px",
  borderBottom: "1px solid #ddd",
  textAlign: "left"
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee"
};
