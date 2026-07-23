import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import { API } from "../services/api";

const EXAM_TYPES = [
  "X-RAY",
  "CT",
  "MRI",
  "ULTRASOUND",
  "MAMMOGRAPHY",
  "NUCLEAR/PET"
];

/*
 * Doctor records the patient's personal details and
 * submits an imaging request for the technician.
 */
export default function NewRequestPage() {
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [examType, setExamType] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!patientName.trim()) {
      setError("Patient name is required");
      return;
    }

    if (!examType) {
      setError("Select the exam type");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(`${API}/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_name: patientName,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          phone: phone || null,
          address: address || null,
          exam_type: examType,
          clinical_notes: clinicalNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to submit request"
        );
      }

      setCreated(data.request);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <Layout>
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            background: "white",
            borderRadius: "8px",
            padding: "30px",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}
        >
          <h2 style={{ color: "#166534" }}>
            Request Submitted
          </h2>

          <p>
            Give this request number to the patient.
            The technician will use it to find the
            request:
          </p>

          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              letterSpacing: "2px",
              background: "#f0fdf4",
              border: "2px dashed #16a34a",
              borderRadius: "8px",
              padding: "16px",
              margin: "20px 0"
            }}
          >
            {created.request_number}
          </div>

          <p style={{ color: "#6b7280" }}>
            Patient: {created.patient_name} —{" "}
            {created.exam_type}
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              marginTop: "20px"
            }}
          >
            <button
              onClick={() =>
                navigate(`/requests/${created.id}`)
              }
              style={buttonStyle}
            >
              Open Request
            </button>

            <button
              onClick={() => {
                setCreated(null);
                setPatientName("");
                setDateOfBirth("");
                setGender("");
                setPhone("");
                setAddress("");
                setExamType("");
                setClinicalNotes("");
              }}
              style={{
                ...buttonStyle,
                background: "#6b7280"
              }}
            >
              New Request
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto"
        }}
      >
        <h2>New Imaging Request</h2>

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

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px"
          }}
        >
          <h3 style={{ margin: "0" }}>
            Patient Information
          </h3>

          <input
            type="text"
            placeholder="Patient Full Name *"
            value={patientName}
            onChange={(e) =>
              setPatientName(e.target.value)
            }
            style={inputStyle}
          />

          <div style={{ display: "flex", gap: "15px" }}>
            <input
              type="date"
              title="Date of Birth"
              value={dateOfBirth}
              onChange={(e) =>
                setDateOfBirth(e.target.value)
              }
              style={{ ...inputStyle, flex: 1 }}
            />

            <select
              value={gender}
              onChange={(e) =>
                setGender(e.target.value)
              }
              style={{ ...inputStyle, flex: 1 }}
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "15px" }}>
            <input
              type="text"
              placeholder="Phone"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              style={{ ...inputStyle, flex: 1 }}
            />

            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) =>
                setAddress(e.target.value)
              }
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>

          <h3 style={{ margin: "10px 0 0" }}>
            Requested Examination
          </h3>

          <select
            value={examType}
            onChange={(e) =>
              setExamType(e.target.value)
            }
            style={inputStyle}
          >
            <option value="">
              Select Exam Type *
            </option>

            {EXAM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <textarea
            rows={4}
            placeholder="Clinical notes / instructions for the technician..."
            value={clinicalNotes}
            onChange={(e) =>
              setClinicalNotes(e.target.value)
            }
            style={{
              ...inputStyle,
              fontFamily: "inherit",
              resize: "vertical"
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={buttonStyle}
          >
            {loading
              ? "Submitting..."
              : "Submit Request"}
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
  borderRadius: "6px",
  boxSizing: "border-box"
};

const buttonStyle = {
  padding: "12px 20px",
  border: "none",
  borderRadius: "6px",
  background: "#2563eb",
  color: "white",
  cursor: "pointer"
};
