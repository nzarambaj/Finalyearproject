import { useEffect, useRef, useState } from "react";
import { Niivue } from "@niivue/niivue";

/*
 * NIfTI viewer built on NiiVue: multiplanar (axial /
 * coronal / sagittal / 3D) views with synced crosshair
 * navigation, and an optional segmentation overlay
 * (e.g. an AVM mask) rendered with a selectable colormap
 * and opacity. Base CT and overlay load straight from
 * their URLs (Cloudinary).
 */

// SLICE_TYPE values are stable in NiiVue.
const SLICE = {
  axial: 0,
  coronal: 1,
  sagittal: 2,
  multi: 3,
  render: 4
};

const VIEWS = [
  { key: "multi", label: "Multiplanar" },
  { key: "axial", label: "Axial" },
  { key: "coronal", label: "Coronal" },
  { key: "sagittal", label: "Sagittal" },
  { key: "render", label: "3D" }
];

const OVERLAY_COLORMAPS = [
  "red",
  "redyellow",
  "warm",
  "hot",
  "blue",
  "green",
  "violet"
];

// Fixed overlay opacity (no user slider).
const OVERLAY_OPACITY = 0.7;

export default function NiftiViewer({ fileUrl, overlayUrl }) {
  const canvasRef = useRef(null);
  const nvRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [view, setView] = useState("multi");
  const [colormap, setColormap] = useState("red");
  const [showOverlay, setShowOverlay] = useState(true);

  // Create/attach NiiVue once and (re)load volumes when
  // the CT or overlay URL changes.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError("");

        let nv = nvRef.current;

        if (!nv) {
          nv = new Niivue({
            backColor: [0, 0, 0, 1],
            crosshairColor: [1, 0, 0, 1],
            show3Dcrosshair: true
          });
          nvRef.current = nv;
          await nv.attachToCanvas(canvasRef.current);
        }

        const volumes = [{ url: fileUrl, colormap: "gray" }];

        if (overlayUrl) {
          volumes.push({
            url: overlayUrl,
            colormap,
            opacity: showOverlay ? OVERLAY_OPACITY : 0
          });
        }

        await nv.loadVolumes(volumes);

        if (cancelled) return;

        // A mask's values (e.g. 0/1 labels) are tiny next
        // to CT intensities. NiiVue otherwise inherits the
        // CT window and the mask renders below-threshold
        // (invisible), so window the overlay to its own
        // range: hide background (0), colour every label.
        if (overlayUrl && nv.volumes.length > 1) {
          const ov = nv.volumes[1];
          ov.cal_min = 0.5;
          ov.cal_max = ov.global_max > 1 ? ov.global_max : 1;
          nv.updateGLVolume();
        }

        nv.setSliceType(SLICE[view] ?? SLICE.multi);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(
            err?.message || "Failed to load the scan"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (fileUrl) run();

    return () => {
      cancelled = true;
    };
  }, [fileUrl, overlayUrl]);

  // Live view / colormap / opacity updates.
  useEffect(() => {
    const nv = nvRef.current;
    if (nv) nv.setSliceType(SLICE[view] ?? SLICE.multi);
  }, [view]);

  useEffect(() => {
    const nv = nvRef.current;
    if (nv && nv.volumes && nv.volumes.length > 1) {
      nv.setColormap(nv.volumes[1].id, colormap);
    }
  }, [colormap]);

  useEffect(() => {
    const nv = nvRef.current;
    if (nv && nv.volumes && nv.volumes.length > 1) {
      nv.setOpacity(1, showOverlay ? OVERLAY_OPACITY : 0);
    }
  }, [showOverlay]);

  // Free the WebGL context on unmount.
  useEffect(() => {
    return () => {
      const nv = nvRef.current;
      try {
        nv?.gl
          ?.getExtension("WEBGL_lose_context")
          ?.loseContext();
      } catch {
        /* ignore */
      }
      nvRef.current = null;
    };
  }, []);

  const hasOverlay = !!overlayUrl;

  return (
    <div style={boxStyle}>
      <div style={{ position: "relative", width: "100%" }}>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "70vh",
            display: "block",
            background: "black",
            borderRadius: "6px"
          }}
        />

        {loading && (
          <div style={overlayMsgStyle}>
            Loading scan...
          </div>
        )}

        {error && (
          <div
            style={{ ...overlayMsgStyle, color: "#fca5a5" }}
          >
            {error}
          </div>
        )}
      </div>

      {/* View selector */}
      <div style={rowStyle}>
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            style={{
              ...pillStyle,
              background:
                view === v.key ? "#2563eb" : "#374151"
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Overlay controls */}
      {hasOverlay && (
        <div style={rowStyle}>
          <span style={labelStyle}>
            <span style={{ color: "#f87171" }}>■</span> AVM
            overlay
          </span>

          <select
            value={colormap}
            onChange={(e) => setColormap(e.target.value)}
            style={selectStyle}
          >
            {OVERLAY_COLORMAPS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowOverlay((s) => !s)}
            style={{
              ...pillStyle,
              background: showOverlay ? "#2563eb" : "#374151"
            }}
          >
            {showOverlay ? "Hide" : "Show"}
          </button>
        </div>
      )}

      <p
        style={{
          color: "#9ca3af",
          fontSize: "13px",
          margin: 0,
          textAlign: "center"
        }}
      >
        Click a panel to move the crosshair; scroll to
        change slice.
        {hasOverlay ? " AVM overlay loaded." : ""}
      </p>
    </div>
  );
}

const boxStyle = {
  background: "#111827",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "12px"
};

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap"
};

const labelStyle = {
  color: "white",
  fontSize: "14px",
  whiteSpace: "nowrap"
};

const pillStyle = {
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "13px",
  cursor: "pointer"
};

const selectStyle = {
  padding: "6px 8px",
  borderRadius: "6px",
  border: "1px solid #4b5563",
  background: "#1f2937",
  color: "white"
};

const overlayMsgStyle = {
  position: "absolute",
  top: "12px",
  left: "12px",
  color: "white",
  fontSize: "14px",
  background: "rgba(0,0,0,0.6)",
  padding: "6px 10px",
  borderRadius: "6px"
};
