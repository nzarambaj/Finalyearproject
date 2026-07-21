import { useEffect, useState, useCallback } from "react";
import { API } from "../services/api";

/*
 * Comments on a study.
 * Radiologists write findings about the image;
 * other specialists recommend which examination
 * the technician should take.
 * canComment: doctors true, technicians false.
 */
export default function StudyComments({
  studyId,
  canComment,
  isRadiologist
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadComments = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API}/studies/${studyId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      setError("Comment is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API}/studies/${studyId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            comment: text
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to save comment"
        );
        return;
      }

      setText("");
      loadComments();
    } catch (err) {
      console.error(err);
      setError("Failed to save comment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "8px",
        padding: "20px",
        marginTop: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        Comments & Recommendations
      </h3>

      {canComment && (
        <form
          onSubmit={handleSubmit}
          style={{ marginBottom: "20px" }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={
              isRadiologist
                ? "Write your findings about this study image..."
                : "Recommend which examination the technician should take on the patient..."
            }
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              fontFamily: "inherit",
              resize: "vertical",
              boxSizing: "border-box"
            }}
          />

          {error && (
            <p
              style={{
                color: "#dc2626",
                fontSize: "14px",
                margin: "8px 0 0"
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: "10px",
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              cursor: saving
                ? "not-allowed"
                : "pointer",
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving
              ? "Saving..."
              : "Add Comment"}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: "#6b7280" }}>
          No comments yet.
        </p>
      ) : (
        comments.map((c) => (
          <div
            key={c.id}
            style={{
              borderTop: "1px solid #eee",
              padding: "12px 0"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px"
              }}
            >
              <strong>
                {c.doctor_name}
                {c.specialization && (
                  <span
                    style={{
                      color: "#2563eb",
                      fontWeight: 500
                    }}
                  >
                    {" "}
                    ({c.specialization})
                  </span>
                )}
              </strong>

              <span
                style={{
                  color: "#6b7280",
                  fontSize: "13px"
                }}
              >
                {new Date(
                  c.created_at
                ).toLocaleString()}
              </span>
            </div>

            <p
              style={{
                margin: "6px 0 0",
                whiteSpace: "pre-wrap"
              }}
            >
              {c.comment}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
