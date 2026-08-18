import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Layout from "../components/Layout";
import NiftiViewer from "../components/NiftiViewer";
import RequestComments from "../components/RequestComments";
import DicomViewer from "../pages/DicomViewer";
import { API } from "../services/api";
import { useAuth } from "../context/AuthContext";

/*
 * One imaging request: patient record, the doctor's
 * clinical notes, the uploaded image (with viewer),
 * technician upload, and the requesting doctor's
 * comments.
 */
export default function RequestDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState("");

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  const [overlayFile, setOverlayFile] = useState(null);
  const [overlayUploading, setOverlayUploading] = useState(false);
  const [overlayError, setOverlayError] = useState("");
  const [overlayMessage, setOverlayMessage] = useState("");

  const isOwner =
    user?.role === "doctor" &&
    request?.doctor_id === user?.id;

  const loadRequest = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API}/requests/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setNotFound(
          data.message || "Request not found"
        );
        return;
      }

      setRequest(data);
    } catch (error) {
      console.error(error);
      setNotFound("Failed to load request");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const handleUpload = async (e) => {
    e.preventDefault();

    setUploadError("");
    setUploadMessage("");

    if (!file) {
      setUploadError(
        "Select a DICOM (.dcm) or NIfTI (.nii, .nii.gz) file"
      );
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API}/requests/${id}/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Upload failed"
        );
      }

      setUploadMessage(
        "Image uploaded successfully"
      );
      setFile(null);

      loadRequest();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleOverlayUpload = async (e) => {
    e.preventDefault();

    setOverlayError("");
    setOverlayMessage("");

    if (!overlayFile) {
      setOverlayError(
        "Select a NIfTI mask (.nii or .nii.gz)"
      );
      return;
    }

    try {
      setOverlayUploading(true);

      const formData = new FormData();
      formData.append("file", overlayFile);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API}/requests/${id}/overlay`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Overlay upload failed"
        );
      }

      setOverlayMessage("Overlay uploaded successfully");
      setOverlayFile(null);

      loadRequest();
    } catch (err) {
      setOverlayError(err.message);
    } finally {
      setOverlayUploading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <p>Loading request...</p>
      </Layout>
    );
  }

  if (notFound || !request) {
    return (
      <Layout>
        <p>{notFound || "Request not found."}</p>
      </Layout>
    );
  }

  const isNifti = /\.nii(\.gz)?$/i.test(
    request.file_url || request.file_path || ""
  );

  return (
    <Layout>
      <div
        style={{
          width: "100%",
          maxWidth: "1200px"
        }}
      >
        {/* Request summary */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px"
            }}
          >
            <h2 style={{ margin: 0 }}>
              {request.request_number}
            </h2>

            <span
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                background:
                  request.status === "completed"
                    ? "#dcfce7"
                    : "#fef9c3",
                color:
                  request.status === "completed"
                    ? "#166534"
                    : "#854d0e"
              }}
            >
              {request.status === "completed"
                ? "Image uploaded"
                : "Waiting for imaging"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "24px",
              marginTop: "14px"
            }}
          >
            <p style={infoStyle}>
              <strong>Requested Exam:</strong>{" "}
              {request.exam_type}
            </p>

            <p style={infoStyle}>
              <strong>Doctor:</strong>{" "}
              {request.doctor_name}
            </p>

            <p style={infoStyle}>
              <strong>Date:</strong>{" "}
              {new Date(
                request.created_at
              ).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Patient record */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>
            Patient Record
          </h3>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "24px"
            }}
          >
            <p style={infoStyle}>
              <strong>Name:</strong>{" "}
              {request.patient_name}
            </p>

            <p style={infoStyle}>
              <strong>Date of Birth:</strong>{" "}
              {request.date_of_birth
                ? new Date(
                    request.date_of_birth
                  ).toLocaleDateString()
                : "-"}
            </p>

            <p style={infoStyle}>
              <strong>Gender:</strong>{" "}
              {request.gender || "-"}
            </p>

            <p style={infoStyle}>
              <strong>Phone:</strong>{" "}
              {request.phone || "-"}
            </p>

            <p style={infoStyle}>
              <strong>Address:</strong>{" "}
              {request.address || "-"}
            </p>
          </div>

          <h4 style={{ marginBottom: "6px" }}>
            Doctor's Clinical Notes
          </h4>

          <p
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              background: "#f9fafb",
              borderRadius: "6px",
              padding: "12px"
            }}
          >
            {request.clinical_notes ||
              "No notes provided."}
          </p>
        </div>

        {/* Technician upload */}
        {user?.role === "technician" &&
          request.status !== "completed" && (
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>
                Upload Image
              </h3>

              {uploadError && (
                <div style={errorBox}>
                  {uploadError}
                </div>
              )}

              {uploadMessage && (
                <div style={successBox}>
                  {uploadMessage}
                </div>
              )}

              <form
                onSubmit={handleUpload}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  alignItems: "center"
                }}
              >
                <input
                  type="file"
                  accept=".dcm,.nii,.nii.gz,application/gzip"
                  onChange={(e) =>
                    setFile(e.target.files[0])
                  }
                />

                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  {uploading
                    ? "Uploading..."
                    : "Upload"}
                </button>
              </form>
            </div>
          )}

        {/* Image viewer */}
        {request.study_id &&
          (isNifti ? (
            <NiftiViewer
              fileUrl={request.file_url}
              overlayUrl={request.overlay_url}
            />
          ) : (
            <DicomViewer
              studyId={request.study_id}
            />
          ))}

        {/* AVM overlay upload — NIfTI studies only.
            Radiologist, technician, or admin. */}
        {request.study_id &&
          isNifti &&
          (user?.role === "doctor" ||
            user?.role === "technician" ||
            user?.role === "admin") && (
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>
                AVM Segmentation Overlay
              </h3>

              <p
                style={{
                  color: "#6b7280",
                  marginTop: 0,
                  fontSize: "14px"
                }}
              >
                Upload a NIfTI mask (produced in ITK-SNAP /
                3D Slicer and registered to this CT). It
                will be painted over the scan in the viewer
                above.
                {request.overlay_url
                  ? " An overlay is already attached — uploading replaces it."
                  : ""}
              </p>

              {overlayError && (
                <div style={errorBox}>{overlayError}</div>
              )}

              {overlayMessage && (
                <div style={successBox}>
                  {overlayMessage}
                </div>
              )}

              <form
                onSubmit={handleOverlayUpload}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  alignItems: "center"
                }}
              >
                <input
                  type="file"
                  accept=".nii,.nii.gz,application/gzip"
                  onChange={(e) =>
                    setOverlayFile(e.target.files[0])
                  }
                />

                <button
                  type="submit"
                  disabled={overlayUploading}
                  style={{
                    background: "#7c3aed",
                    color: "white",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  {overlayUploading
                    ? "Uploading..."
                    : request.overlay_url
                    ? "Replace Overlay"
                    : "Upload Overlay"}
                </button>
              </form>
            </div>
          )}

        {/* Comments: any doctor can read; only the
            requesting doctor can add one. */}
        {(user?.role === "doctor" ||
          user?.role === "admin") && (
          <RequestComments
            requestId={id}
            canComment={isOwner}
          />
        )}
      </div>
    </Layout>
  );
}

const cardStyle = {
  background: "white",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "20px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
};

const infoStyle = {
  margin: 0
};

const errorBox = {
  background: "#fee2e2",
  color: "#b91c1c",
  padding: "12px",
  borderRadius: "6px",
  marginBottom: "12px"
};

const successBox = {
  background: "#dcfce7",
  color: "#166534",
  padding: "12px",
  borderRadius: "6px",
  marginBottom: "12px"
};
