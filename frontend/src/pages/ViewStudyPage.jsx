import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Layout from "../components/Layout";
import DicomViewer from "../pages/DicomViewer";

export default function ViewStudyPage() {
  const { id } = useParams();

  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudy();
  }, []);

  const loadStudy = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/studies/${id}`,
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
        <DicomViewer />
      </div>
    </Layout>
  );
}