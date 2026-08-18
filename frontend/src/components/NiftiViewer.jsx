import { useEffect, useRef, useState } from "react";
import * as nifti from "nifti-reader-js";

/*
 * NIfTI (.nii / .nii.gz) volume viewer with an optional
 * segmentation overlay (e.g. an AVM mask) painted over
 * the base CT in colour, with an opacity control.
 *
 * The overlay is expected to be pre-registered to the
 * base (same voxel grid) — registration/segmentation
 * happen in external tools; the platform displays them.
 */
export default function NiftiViewer({ fileUrl, overlayUrl }) {
  const canvasRef = useRef(null);

  const [volume, setVolume] = useState(null);
  const [overlay, setOverlay] = useState(null);
  const [overlayWarning, setOverlayWarning] = useState("");

  const [slice, setSlice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showOverlay, setShowOverlay] = useState(true);
  const [opacity, setOpacity] = useState(0.5);

  // Load the base volume (and compute its window).
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const vol = await loadVolume(fileUrl);

        // Guard against files with no real image plane.
        if (vol.nx * vol.ny < 4) {
          throw new Error(
            `This file has no displayable image plane ` +
              `(spatial dimensions ${vol.nx}×${vol.ny}×${vol.nz}). ` +
              `Please upload a scan with real image slices.`
          );
        }

        computeWindow(vol);

        if (cancelled) return;

        setVolume(vol);
        setSlice(Math.floor(vol.nz / 2));
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(
            err.message || "Failed to load NIfTI file"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  // Load the optional overlay mask.
  useEffect(() => {
    let cancelled = false;

    if (!overlayUrl) {
      setOverlay(null);
      setOverlayWarning("");
      return;
    }

    const load = async () => {
      try {
        const ov = await loadVolume(overlayUrl);
        if (cancelled) return;
        setOverlay(ov);
        setOverlayWarning("");
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setOverlay(null);
          setOverlayWarning(
            "Overlay could not be loaded."
          );
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [overlayUrl]);

  // Flag a geometry mismatch once both are loaded.
  useEffect(() => {
    if (!volume || !overlay) return;

    if (
      overlay.nx !== volume.nx ||
      overlay.ny !== volume.ny ||
      overlay.nz !== volume.nz
    ) {
      setOverlayWarning(
        `Overlay geometry ${overlay.nx}×${overlay.ny}×${overlay.nz} ` +
          `does not match the CT ${volume.nx}×${volume.ny}×${volume.nz}. ` +
          `The mask must be registered to this scan first.`
      );
    } else {
      setOverlayWarning("");
    }
  }, [volume, overlay]);

  // Render the current slice (base + optional overlay).
  useEffect(() => {
    if (!volume || !canvasRef.current) return;

    const { voxels, nx, ny, slope, inter, min, max } = volume;

    const canvas = canvasRef.current;
    canvas.width = nx;
    canvas.height = ny;

    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(nx, ny);

    const sliceOffset = slice * nx * ny;
    const range = max - min || 1;

    const geometryOk =
      overlay &&
      overlay.nx === nx &&
      overlay.ny === ny &&
      overlay.nz === volume.nz;

    const drawOverlay =
      showOverlay && geometryOk && opacity > 0;

    for (let y = 0; y < ny; y++) {
      // NIfTI rows run bottom-up; canvas top-down.
      const srcRow = (ny - 1 - y) * nx;
      const dstRow = y * nx;

      for (let x = 0; x < nx; x++) {
        const srcIdx = sliceOffset + srcRow + x;

        const v = voxels[srcIdx] * slope + inter;

        let g = Math.round(((v - min) / range) * 255);
        g = g < 0 ? 0 : g > 255 ? 255 : g;

        let r = g;
        let gg = g;
        let b = g;

        // Paint mask voxels (any non-zero label) red.
        if (drawOverlay && overlay.voxels[srcIdx] !== 0) {
          r = Math.round(g * (1 - opacity) + 255 * opacity);
          gg = Math.round(g * (1 - opacity));
          b = Math.round(g * (1 - opacity));
        }

        const p = (dstRow + x) * 4;
        imageData.data[p] = r;
        imageData.data[p + 1] = gg;
        imageData.data[p + 2] = b;
        imageData.data[p + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [volume, overlay, slice, showOverlay, opacity]);

  if (loading) {
    return (
      <div style={boxStyle}>
        <p style={{ color: "white" }}>
          Loading NIfTI volume...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={boxStyle}>
        <p style={{ color: "#fca5a5" }}>{error}</p>
      </div>
    );
  }

  const pixDims = volume.header.pixDims || [];
  const hasOverlay = !!overlay && !overlayWarning;

  return (
    <div style={boxStyle}>
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: "100%",
          maxHeight: "70vh",
          imageRendering: "pixelated",
          background: "black"
        }}
      />

      {volume.nz > 1 && (
        <div style={rowStyle}>
          <span style={labelStyle}>Slice</span>
          <input
            type="range"
            min={0}
            max={volume.nz - 1}
            value={slice}
            onChange={(e) => setSlice(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={labelStyle}>
            {slice + 1} / {volume.nz}
          </span>
        </div>
      )}

      {hasOverlay && (
        <div style={rowStyle}>
          <label
            style={{
              ...labelStyle,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer"
            }}
          >
            <input
              type="checkbox"
              checked={showOverlay}
              onChange={(e) => setShowOverlay(e.target.checked)}
            />
            <span style={{ color: "#f87171" }}>■</span> AVM
            overlay
          </label>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            disabled={!showOverlay}
            onChange={(e) => setOpacity(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={labelStyle}>
            {Math.round(opacity * 100)}%
          </span>
        </div>
      )}

      {overlayWarning && (
        <p
          style={{
            color: "#fcd34d",
            fontSize: "13px",
            margin: 0,
            maxWidth: "500px",
            textAlign: "center"
          }}
        >
          {overlayWarning}
        </p>
      )}

      <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
        {volume.nx} × {volume.ny} × {volume.nz}
        {pixDims[1]
          ? ` — voxel ${pixDims[1].toFixed(2)} × ${(
              pixDims[2] || 0
            ).toFixed(2)} × ${(pixDims[3] || 0).toFixed(2)} mm`
          : ""}
        {hasOverlay ? " — AVM overlay loaded" : ""}
      </p>
    </div>
  );
}

// Fetch, decompress and parse a NIfTI URL into a volume.
async function loadVolume(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to download file");
  }

  let data = await response.arrayBuffer();

  if (nifti.isCompressed(data)) {
    data = nifti.decompress(data);
  }

  if (!nifti.isNIFTI(data)) {
    throw new Error("Not a valid NIfTI file");
  }

  const header = nifti.readHeader(data);
  const imageBuffer = nifti.readImage(header, data);
  const voxels = toTypedArray(header, imageBuffer);

  if (!voxels) {
    throw new Error(
      `Unsupported NIfTI datatype (code ${header.datatypeCode})`
    );
  }

  return {
    voxels,
    nx: header.dims[1],
    ny: header.dims[2],
    nz: Math.max(header.dims[3] || 1, 1),
    slope: header.scl_slope || 1,
    inter: header.scl_inter || 0,
    min: 0,
    max: 1,
    header
  };
}

// Compute a stable global intensity window on a volume.
function computeWindow(vol) {
  const { voxels, nx, ny, slope, inter } = vol;
  const total = nx * ny * vol.nz;
  const stride = Math.max(1, Math.floor(total / 500000));

  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < total; i += stride) {
    const v = voxels[i] * slope + inter;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  if (min === max) max = min + 1;

  vol.min = min;
  vol.max = max;
}

function toTypedArray(header, buffer) {
  switch (header.datatypeCode) {
    case nifti.NIFTI1.TYPE_UINT8:
      return new Uint8Array(buffer);
    case nifti.NIFTI1.TYPE_INT8:
      return new Int8Array(buffer);
    case nifti.NIFTI1.TYPE_UINT16:
      return new Uint16Array(buffer);
    case nifti.NIFTI1.TYPE_INT16:
      return new Int16Array(buffer);
    case nifti.NIFTI1.TYPE_UINT32:
      return new Uint32Array(buffer);
    case nifti.NIFTI1.TYPE_INT32:
      return new Int32Array(buffer);
    case nifti.NIFTI1.TYPE_FLOAT32:
      return new Float32Array(buffer);
    case nifti.NIFTI1.TYPE_FLOAT64:
      return new Float64Array(buffer);

    case nifti.NIFTI1.TYPE_INT64:
      return Float64Array.from(new BigInt64Array(buffer), Number);

    case nifti.NIFTI1.TYPE_UINT64:
      return Float64Array.from(new BigUint64Array(buffer), Number);

    // Complex volumes (e.g. raw MRI data): magnitude.
    case nifti.NIFTI1.TYPE_COMPLEX64:
      return complexMagnitude(new Float32Array(buffer));

    case nifti.NIFTI1.TYPE_COMPLEX128:
      return complexMagnitude(new Float64Array(buffer));

    // RGB volumes: luminance.
    case nifti.NIFTI1.TYPE_RGB24: {
      const rgb = new Uint8Array(buffer);
      const out = new Float32Array(rgb.length / 3);
      for (let i = 0; i < out.length; i++) {
        out[i] =
          0.299 * rgb[i * 3] +
          0.587 * rgb[i * 3 + 1] +
          0.114 * rgb[i * 3 + 2];
      }
      return out;
    }

    default:
      return null;
  }
}

function complexMagnitude(pairs) {
  const out = new Float64Array(pairs.length / 2);
  for (let i = 0; i < out.length; i++) {
    const re = pairs[i * 2];
    const im = pairs[i * 2 + 1];
    out[i] = Math.sqrt(re * re + im * im);
  }
  return out;
}

const boxStyle = {
  background: "#111827",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "14px"
};

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  width: "100%",
  maxWidth: "500px"
};

const labelStyle = {
  color: "white",
  fontSize: "14px",
  whiteSpace: "nowrap"
};
