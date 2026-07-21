import { Fragment, useEffect, useState } from "react";
import Layout from "../components/Layout";
import StudyComments from "../components/StudyComments";
import { API } from "../services/api";

export default function StudiesPage() {

  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Study whose doctor comments are expanded
  const [openStudyId, setOpenStudyId] = useState(null);

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
                <th style={thStyle}>
                  Doctor Comments
                </th>
              </tr>
            </thead>

            <tbody>

              {studies.map((study) => (
                <Fragment key={study.id}>
                  <tr>
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

                    <td style={tdStyle}>
                      <button
                        onClick={() =>
                          setOpenStudyId(
                            openStudyId === study.id
                              ? null
                              : study.id
                          )
                        }
                        style={{
                          background:
                            openStudyId === study.id
                              ? "#6b7280"
                              : "#2563eb",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          cursor: "pointer"
                        }}
                      >
                        {openStudyId === study.id
                          ? "Hide"
                          : "View"}
                      </button>
                    </td>
                  </tr>

                  {openStudyId === study.id && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: "0 12px 12px",
                          background: "#f9fafb"
                        }}
                      >
                        <StudyComments
                          studyId={study.id}
                          canComment={false}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
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