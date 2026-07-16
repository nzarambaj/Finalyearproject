import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { API } from "../services/api";

export default function StudiesPage() {

  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudies();
  }, []);

  const loadStudies = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API}/studies/my-studies`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      setStudies(data);

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
          maxWidth: "1100px",
          margin: "0 auto"
        }}
      >
        <h2>My Uploaded Studies</h2>

        {loading ? (
          <p>Loading...</p>
        ) : studies.length === 0 ? (
          <p>No studies found.</p>
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
                <th style={thStyle}>Created</th>
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
                    {study.modality || "-"}
                  </td>

                  <td style={tdStyle}>
                    {study.status}
                  </td>

                  <td style={tdStyle}>
                    {new Date(
                      study.created_at
                    ).toLocaleString()}
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
  borderBottom: "1px solid #ddd",
  padding: "12px",
  textAlign: "left"
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee"
};