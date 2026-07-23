import { useEffect, useRef, useState } from "react";
import * as nifti from "nifti-reader-js";

/*
 * Minimal NIfTI (.nii / .nii.gz) volume viewer.
 * Renders axial slices to a canvas with a slice
 * slider. DICOM studies keep using DicomViewer.
 */
export default function NiftiViewer({ fileUrl }) {
  const canvasRef = useRef(null);

  const [volume, setVolume] = useState(null);
  const [slice, setSlice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(fileUrl);

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

        const nx = header.dims[1];
        const ny = header.dims[2];
        const nz = Math.max(header.dims[3] || 1, 1);

        // Some synthetic/test files store data only in
        // time or higher dimensions — nothing to draw.
        if (nx * ny < 4) {
          throw new Error(
            `This file has no displayable image plane ` +
              `(spatial dimensions ${nx}×${ny}×${nz}). ` +
              `Please upload a scan with real image slices.`
          );
        }

        // Rescale slope/intercept (0 slope means unset)
        const slope = header.scl_slope || 1;
        const inter = header.scl_inter || 0;

        // Sample the volume for a stable global
        // intensity window across slices.
        let min = Infinity;
        let max = -Infinity;

        const total = nx * ny * nz;
        const stride = Math.max(
          1,
          Math.floor(total / 500000)
        );

        for (let i = 0; i < total; i += stride) {
          const v = voxels[i] * slope + inter;
          if (v < min) min = v;
          if (v > max) max = v;
        }

        if (min === max) max = min + 1;

        if (cancelled) return;

        setVolume({
          voxels,
          nx,
          ny,
          nz,
          slope,
          inter,
          min,
          max,
          header
        });

        setSlice(Math.floor(nz / 2));
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

  useEffect(() => {
    if (!volume || !canvasRef.current) return;

    const {
      voxels,
      nx,
      ny,
      slope,
      inter,
      min,
      max
    } = volume;

    const canvas = canvasRef.current;
    canvas.width = nx;
    canvas.height = ny;

    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(nx, ny);

    const sliceOffset = slice * nx * ny;
    const range = max - min;

    for (let y = 0; y < ny; y++) {

      // NIfTI rows run bottom-up; canvas top-down.
      const srcRow = (ny - 1 - y) * nx;
      const dstRow = y * nx;

      for (let x = 0; x < nx; x++) {
        const v =
          voxels[sliceOffset + srcRow + x] * slope +
          inter;

        const g = Math.max(
          0,
          Math.min(
            255,
            Math.round(((v - min) / range) * 255)
          )
        );

        const p = (dstRow + x) * 4;
        imageData.data[p] = g;
        imageData.data[p + 1] = g;
        imageData.data[p + 2] = g;
        imageData.data[p + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [volume, slice]);

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            maxWidth: "500px"
          }}
        >
          <input
            type="range"
            min={0}
            max={volume.nz - 1}
            value={slice}
            onChange={(e) =>
              setSlice(Number(e.target.value))
            }
            style={{ flex: 1 }}
          />

          <span
            style={{
              color: "white",
              fontSize: "14px",
              whiteSpace: "nowrap"
            }}
          >
            Slice {slice + 1} / {volume.nz}
          </span>
        </div>
      )}

      <p
        style={{
          color: "#9ca3af",
          fontSize: "13px",
          margin: 0
        }}
      >
        {volume.nx} × {volume.ny} × {volume.nz}
        {pixDims[1]
          ? ` — voxel ${pixDims[1].toFixed(2)} × ${(
              pixDims[2] || 0
            ).toFixed(2)} × ${(
              pixDims[3] || 0
            ).toFixed(2)} mm`
          : ""}
      </p>
    </div>
  );
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
      return Float64Array.from(
        new BigInt64Array(buffer),
        Number
      );

    case nifti.NIFTI1.TYPE_UINT64:
      return Float64Array.from(
        new BigUint64Array(buffer),
        Number
      );

    // Complex volumes (e.g. raw MRI data): display
    // the magnitude of each voxel.
    case nifti.NIFTI1.TYPE_COMPLEX64:
      return complexMagnitude(
        new Float32Array(buffer)
      );

    case nifti.NIFTI1.TYPE_COMPLEX128:
      return complexMagnitude(
        new Float64Array(buffer)
      );

    // RGB volumes: display luminance.
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
