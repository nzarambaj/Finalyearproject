import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { API } from "../services/api";

export default function DoctorStudiesPage() {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStudies();
  }, []);

  const loadStudies = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API}/studies/doctor-studies`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setStudies(data);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto"
        }}
      >
        <h2>Assigned Studies</h2>

        {loading ? (
          <p>Loading...</p>
        ) : studies.length === 0 ? (
          <p>No studies assigned.</p>
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
                  <th style={thStyle}>Patient</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Modality</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Uploaded By</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>

              <tbody>
                {studies.map((study) => (
                  <tr key={study.id}>
                    <td style={tdStyle}>
                      {study.patient_identifier}
                    </td>

                    <td style={tdStyle}>
                      {study.category}
                    </td>

                    <td style={tdStyle}>
                      {study.modality}
                    </td>

                    <td style={tdStyle}>
                      {study.status}
                    </td>

                    <td style={tdStyle}>
                      {study.uploaded_by}
                    </td>

                    <td style={tdStyle}>
                      {new Date(
                        study.created_at
                      ).toLocaleString()}
                    </td>

                    <td style={tdStyle}>
                      <button
                        onClick={() =>
                          navigate(
                            `/doctor/study/${study.id}`
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
                        View
                      </button>
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