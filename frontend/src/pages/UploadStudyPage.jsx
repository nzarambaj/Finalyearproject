import { useEffect, useState } from "react";
import Layout from "../components/Layout";

export default function UploadStudyPage() {
  const [categories, setCategories] = useState([]);

  const [categoryId, setCategoryId] = useState("");
  const [patientIdentifier, setPatientIdentifier] = useState("");

  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/studies/categories",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load categories"
        );
      }

      if (Array.isArray(data)) {
        setCategories(data);
      } else if (Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error(err);

      setCategories([]);

      setError(
        "Unable to load categories. Please login again."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!categoryId) {
      setError("Select study category");
      return;
    }

    if (!file) {
      setError("Select DICOM file");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append(
        "category_id",
        categoryId
      );

      formData.append(
        "patient_identifier",
        patientIdentifier
      );

      formData.append(
        "file",
        file
      );

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/studies/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Upload failed"
        );
      }

      setMessage(
        "Study uploaded successfully"
      );

      setCategoryId("");
      setPatientIdentifier("");
      setFile(null);

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }
  };

  return (
    <Layout>
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          margin: "0 auto"
        }}
      >
        <h2>Upload Study</h2>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#b91c1c",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "16px"
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              background: "#dcfce7",
              color: "#166534",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "16px"
            }}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px"
          }}
        >
          <input
            type="text"
            placeholder="Patient Identifier"
            value={patientIdentifier}
            onChange={(e) =>
              setPatientIdentifier(
                e.target.value
              )
            }
            style={inputStyle}
          />

          <select
            value={categoryId}
            onChange={(e) =>
              setCategoryId(
                e.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              Select Category
            </option>

            {categories.map((c) => (
              <option
                key={c.id}
                value={c.id}
              >
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="file"
            accept=".dcm"
            onChange={(e) =>
              setFile(
                e.target.files[0]
              )
            }
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              border: "none",
              borderRadius: "6px",
              background: "#2563eb",
              color: "white",
              cursor: "pointer"
            }}
          >
            {loading
              ? "Uploading..."
              : "Upload Study"}
          </button>
        </form>
      </div>
    </Layout>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px"
};