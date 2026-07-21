import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Layout from "../components/Layout";
import StudyComments from "../components/StudyComments";
import { API } from "../services/api";
import { useAuth } from "../context/AuthContext";
import DicomViewer from "../pages/DicomViewer";

export default function ViewStudyPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);

  // Only radiologists examine the image itself;
  // other specialists only review and recommend.
  const isRadiologist =
    user?.specialization === "Radiologist";

  useEffect(() => {
    loadStudy();
  }, []);

  const loadStudy = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API}/studies/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      setStudy(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <p>Loading study...</p>
      </Layout>
    );
  }

  if (!study) {
    return (
      <Layout>
        <p>Study not found.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        style={{
          width: "100%",
          maxWidth: "1200px"
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Study Details
          </h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "24px"
            }}
          >
            <p style={infoStyle}>
              <strong>Patient:</strong>{" "}
              {study.patient_identifier}
            </p>

            <p style={infoStyle}>
              <strong>Category:</strong>{" "}
              {study.category}
            </p>

            <p style={infoStyle}>
              <strong>Modality:</strong>{" "}
              {study.modality || "-"}
            </p>

            <p style={infoStyle}>
              <strong>Status:</strong>{" "}
              {study.status}
            </p>

            <p style={infoStyle}>
              <strong>Uploaded By:</strong>{" "}
              {study.uploaded_by}
            </p>
          </div>
        </div>

        {isRadiologist && <DicomViewer />}

        <StudyComments
          studyId={id}
          canComment={user?.role === "doctor"}
          isRadiologist={isRadiologist}
        />
      </div>
    </Layout>
  );
}

const infoStyle = {
  margin: 0
};
