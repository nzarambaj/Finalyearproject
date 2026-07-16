import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import dicomParser from "dicom-parser";
import { API } from "../services/api";
/**
 * ------------------------------------------------------------------
 * ANNOTATION STATE STRUCTURE
 * ------------------------------------------------------------------
 * annotations: {
 *   [seriesIndex]: {
 *     [frameIndex]: Annotation[]
 *   }
 * }
 *
 * Annotation (current type: "distance"):
 * {
 *   id: string,
 *   type: "distance",            // future: "angle" | "rectangle" | "ellipse" | "arrow" | "text"
 *   points: [{x, y}, {x, y}],    // image-space pixel coordinates (native resolution)
 *   value: number,               // computed measurement value
 *   unit: "mm" | "px",
 *   createdAt: ISOString
 * }
 *
 * To add a new tool type, give it its own "type" string, store whatever
 * points/metadata it needs, and add a render branch in the SVG overlay
 * plus a creation handler in handleMouseDown.
 * ------------------------------------------------------------------
 *
 * MULTI-SERIES ARCHITECTURE
 * ------------------------------------------------------------------
 * series: [
 *   {
 *     seriesInstanceUID: string,
 *     seriesDescription: string,
 *     instances: string[]        // file_urls, one per frame/slice
 *   }
 * ]
 *
 * - activeSeriesIndex selects which series is displayed.
 * - frameCacheRef caches parsed frames per "seriesIndex:frameIndex".
 * - annotations are keyed per series + frame, so switching series never
 *   loses or mixes up measurements.
 * ------------------------------------------------------------------
 */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Normalizes whatever shape the backend returns into a consistent
// series[] array, so the rest of the component never has to special-case it.
function normalizeSeries(data) {
  if (Array.isArray(data?.series) && data.series.length > 0) {
    return data.series.map((s, i) => ({
      seriesInstanceUID: s.seriesInstanceUID || `series-${i}`,
      seriesDescription: s.seriesDescription || `Series ${i + 1}`,
      instances: (s.instances || []).map((inst) =>
        typeof inst === "string" ? inst : inst.file_url
      ),
    }));
  }

  if (Array.isArray(data?.file_urls) && data.file_urls.length > 0) {
    return [
      {
        seriesInstanceUID: "series-0",
        seriesDescription: "Series 1",
        instances: data.file_urls,
      },
    ];
  }

  if (data?.file_url) {
    return [
      {
        seriesInstanceUID: "series-0",
        seriesDescription: "Series 1",
        instances: [data.file_url],
      },
    ];
  }

  return [];
}

function createDistanceAnnotation(p1, p2, pixelSpacing) {
  const dxPx = p2.x - p1.x;
  const dyPx = p2.y - p1.y;

  let value, unit;
  if (pixelSpacing) {
    const dxMm = dxPx * pixelSpacing.col;
    const dyMm = dyPx * pixelSpacing.row;
    value = Math.sqrt(dxMm * dxMm + dyMm * dyMm);
    unit = "mm";
  } else {
    value = Math.sqrt(dxPx * dxPx + dyPx * dyPx);
    unit = "px";
  }

  return {
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "distance",
    points: [p1, p2],
    value,
    unit,
    createdAt: new Date().toISOString(),
  };
}

const btnStyle = {
  padding: "6px 12px",
  fontSize: "13px",
  border: "1px solid #444",
  borderRadius: "4px",
  background: "#1a1a1a",
  color: "#ddd",
  cursor: "pointer",
};

const activeBtnStyle = {
  ...btnStyle,
  background: "#2563eb",
  borderColor: "#2563eb",
  color: "#fff",
};

export default function DicomViewer() {
  const { id: studyId } = useParams();
  const TOKEN = localStorage.getItem("token");
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const frameCacheRef = useRef(new Map());
  const fitRequestedRef = useRef(true);

  const [study, setStudy] = useState(null);
  const [series, setSeries] = useState([]);
  const [activeSeriesIndex, setActiveSeriesIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [wc, setWc] = useState(0);
  const [ww, setWw] = useState(1);

  const [baseScale, setBaseScale] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const [tool, setTool] = useState("pan"); // 'pan' | 'measure'
  const [annotations, setAnnotations] = useState({});
  const [measureDraft, setMeasureDraft] = useState(null);
  const [measurePreview, setMeasurePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const activeSeries = series[activeSeriesIndex];
  const scale = baseScale * zoom;
  const currentAnnotations =
    annotations[activeSeriesIndex]?.[frameIndex] || [];

  // ------------------------------------------------------------------
  // 1. Fetch study metadata
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchStudy = async () => {
      try {
        const res = await fetch(
          `${API}/studies/${studyId}`,
          { headers: { Authorization: `Bearer ${TOKEN}` } }
        );
        const data = await res.json();
        if (cancelled) return;

        setStudy(data);
        setSeries(normalizeSeries(data));
      } catch (err) {
        console.error("Failed to fetch study:", err);
        if (!cancelled) setError("Failed to fetch study metadata");
      }
    };

    fetchStudy();
    return () => {
      cancelled = true;
    };
  }, [studyId]);

  // ------------------------------------------------------------------
  // 2. Fetch + parse + cache a single frame
  // ------------------------------------------------------------------
  const loadFrame = useCallback(
    async (seriesIndex, idx) => {
      const cacheKey = `${seriesIndex}:${idx}`;
      if (frameCacheRef.current.has(cacheKey)) {
        return frameCacheRef.current.get(cacheKey);
      }

      const s = series[seriesIndex];
      const url = s?.instances?.[idx];
      if (!url) return null;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch frame ${idx}: ${res.status}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      const byteArray = new Uint8Array(arrayBuffer);
      const dataSet = dicomParser.parseDicom(byteArray);

      const rows = dataSet.uint16("x00280010");
      const cols = dataSet.uint16("x00280011");
      const bitsAllocated = dataSet.uint16("x00280100");
      const pixelRepresentation = dataSet.uint16("x00280103");
      const photometricInterpretation = dataSet.string("x00280004") || "";
      const rescaleSlope = dataSet.floatString("x00281053") ?? 1;
      const rescaleIntercept = dataSet.floatString("x00281052") ?? 0;
      const windowCenter = dataSet.floatString("x00281050");
      const windowWidth = dataSet.floatString("x00281051");

      // Pixel Spacing (0028,0030) -> "rowSpacing\\colSpacing" in mm.
      // Used to convert measurements from pixels to millimeters.
      let pixelSpacing = null;
      const pixelSpacingStr = dataSet.string("x00280030");
      if (pixelSpacingStr) {
        const parts = pixelSpacingStr.split("\\").map(Number);
        if (parts.length === 2 && !parts.some(Number.isNaN)) {
          pixelSpacing = { row: parts[0], col: parts[1] };
        }
      }

      const pixelDataElement = dataSet.elements.x7fe00010;
      if (!pixelDataElement) throw new Error("No pixel data found");

      let pixelData;
      if (bitsAllocated === 16) {
        pixelData =
          pixelRepresentation === 1
            ? new Int16Array(
                dataSet.byteArray.buffer,
                pixelDataElement.dataOffset,
                pixelDataElement.length / 2
              )
            : new Uint16Array(
                dataSet.byteArray.buffer,
                pixelDataElement.dataOffset,
                pixelDataElement.length / 2
              );
      } else {
        pixelData = new Uint8Array(
          dataSet.byteArray.buffer,
          pixelDataElement.dataOffset,
          pixelDataElement.length
        );
      }

      const rescaled = new Float32Array(pixelData.length);
      let dataMin = Infinity;
      let dataMax = -Infinity;
      for (let i = 0; i < pixelData.length; i++) {
        const v = pixelData[i] * rescaleSlope + rescaleIntercept;
        rescaled[i] = v;
        if (v < dataMin) dataMin = v;
        if (v > dataMax) dataMax = v;
      }

      const defaultWc =
        windowCenter != null ? windowCenter : (dataMin + dataMax) / 2;
      const defaultWw =
        windowWidth != null ? windowWidth : dataMax - dataMin || 1;

      const frame = {
        rescaled,
        rows,
        cols,
        invert: photometricInterpretation === "MONOCHROME1",
        defaultWc,
        defaultWw,
        dataMin,
        dataMax,
        pixelSpacing,
      };

      frameCacheRef.current.set(cacheKey, frame);
      return frame;
    },
    [series]
  );

  // ------------------------------------------------------------------
  // 3. Load the current frame whenever series or slice index changes
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!activeSeries) return;
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    loadFrame(activeSeriesIndex, frameIndex)
      .then((frame) => {
        if (cancelled || !frame) return;
        setCurrentFrame(frame);
      })
      .catch((err) => {
        console.error("Failed to load frame:", err);
        if (!cancelled) setError(err.message || "Failed to load frame");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeSeries, activeSeriesIndex, frameIndex, loadFrame]);

  // ------------------------------------------------------------------
  // 4. When the active series changes: reset slice index and request
  //    a fresh fit-to-screen + default window/level on next frame load
  // ------------------------------------------------------------------
  useEffect(() => {
    fitRequestedRef.current = true;
    setFrameIndex(0);
    setMeasureDraft(null);
    setMeasurePreview(null);
  }, [activeSeriesIndex]);

  // ------------------------------------------------------------------
  // 5. Fit-to-screen helper (also used by the toolbar button)
  // ------------------------------------------------------------------
  const fitToScreen = useCallback((frame) => {
    if (!frame || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const fit = Math.min(rect.width / frame.cols, rect.height / frame.rows);

    setBaseScale(fit);
    setZoom(1);
    setPan({
      x: (rect.width - frame.cols * fit) / 2,
      y: (rect.height - frame.rows * fit) / 2,
    });
  }, []);

  // Apply defaults + fit whenever a "fresh" frame (new series) loads
  useEffect(() => {
    if (!currentFrame) return;
    if (fitRequestedRef.current) {
      setWc(currentFrame.defaultWc);
      setWw(currentFrame.defaultWw);
      fitToScreen(currentFrame);
      fitRequestedRef.current = false;
    }
  }, [currentFrame, fitToScreen]);

  // ------------------------------------------------------------------
  // 6. Track container size (for the annotation overlay) and keep the
  //    view centered if the user hasn't manually zoomed in
  // ------------------------------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });

      if (!currentFrame) return;

      if (zoom === 1) {
        fitToScreen(currentFrame);
      } else {
        const fit = Math.min(width / currentFrame.cols, height / currentFrame.rows);
        setBaseScale(fit);
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFrame, zoom, fitToScreen]);

  // ------------------------------------------------------------------
  // 7. Draw pixel data to the canvas (windowing applied here)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!currentFrame || !canvasRef.current) return;

    const { rescaled, rows, cols, invert } = currentFrame;
    const canvas = canvasRef.current;
    canvas.width = cols;
    canvas.height = rows;

    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(cols, rows);

    const min = wc - ww / 2;
    const range = ww || 1;

    for (let i = 0; i < rescaled.length; i++) {
      let gray = ((rescaled[i] - min) / range) * 255;
      gray = Math.max(0, Math.min(255, gray));
      if (invert) gray = 255 - gray;

      const idx = i * 4;
      imageData.data[idx] = gray;
      imageData.data[idx + 1] = gray;
      imageData.data[idx + 2] = gray;
      imageData.data[idx + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
  }, [currentFrame, wc, ww]);

  // ------------------------------------------------------------------
  // 8. Coordinate helpers
  // ------------------------------------------------------------------
  const screenToImage = (sx, sy) => ({
    x: (sx - pan.x) / scale,
    y: (sy - pan.y) / scale,
  });

  const imageToScreen = (x, y) => ({
    x: pan.x + x * scale,
    y: pan.y + y * scale,
  });

  // ------------------------------------------------------------------
  // 9. Wheel handling: plain wheel = slice scroll, ctrl/cmd+wheel = zoom
  //    Attached manually so preventDefault() reliably stops page scroll.
  // ------------------------------------------------------------------
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      if (!currentFrame || !containerRef.current) return;

      if (e.ctrlKey || e.metaKey) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const oldScale = baseScale * zoom;
        const imgX = (mouseX - pan.x) / oldScale;
        const imgY = (mouseY - pan.y) / oldScale;

        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = clamp(zoom * factor, 0.1, 16);
        const newScale = baseScale * newZoom;

        setZoom(newZoom);
        setPan({
          x: mouseX - imgX * newScale,
          y: mouseY - imgY * newScale,
        });
      } else {
        if (!activeSeries || activeSeries.instances.length <= 1) return;
        const dir = e.deltaY > 0 ? 1 : -1;
        setFrameIndex((idx) =>
          clamp(idx + dir, 0, activeSeries.instances.length - 1)
        );
      }
    },
    [currentFrame, baseScale, zoom, pan, activeSeries]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // ------------------------------------------------------------------
  // 10. Mouse interaction
  //     - measure tool: click to place first point, click again to finish
  //     - plain drag: pan
  //     - shift + drag: window/level (horizontal = width, vertical = center)
  // ------------------------------------------------------------------
  const handleMouseDown = (e) => {
    if (!currentFrame || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (tool === "measure") {
      const imgPoint = screenToImage(sx, sy);

      if (!measureDraft) {
        setMeasureDraft(imgPoint);
        setMeasurePreview(imgPoint);
      } else {
        const annotation = createDistanceAnnotation(
          measureDraft,
          imgPoint,
          currentFrame.pixelSpacing
        );
        setAnnotations((prev) => {
          const seriesAnn = prev[activeSeriesIndex] || {};
          const frameAnn = seriesAnn[frameIndex] || [];
          return {
            ...prev,
            [activeSeriesIndex]: {
              ...seriesAnn,
              [frameIndex]: [...frameAnn, annotation],
            },
          };
        });
        setMeasureDraft(null);
        setMeasurePreview(null);
      }
      return;
    }

    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startPan = { ...pan };
    const startWc = wc;
    const startWw = ww;
    const isWindowing = e.shiftKey;
    const range = currentFrame.dataMax - currentFrame.dataMin || 1;
    const sensitivity = range / 256;

    const onMove = (ev) => {
      if (isWindowing) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const newWw = clamp(startWw + dx * sensitivity, 1, range * 4);
        const newWc = clamp(
          startWc - dy * sensitivity,
          currentFrame.dataMin - range,
          currentFrame.dataMax + range
        );
        setWw(newWw);
        setWc(newWc);
      } else {
        setPan({
          x: startPan.x + (ev.clientX - startX),
          y: startPan.y + (ev.clientY - startY),
        });
      }
    };

    const onUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // Live preview line while the measure tool has a first point placed
  const handleMouseMove = (e) => {
    if (tool !== "measure" || !measureDraft || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    setMeasurePreview(screenToImage(sx, sy));
  };

  // ------------------------------------------------------------------
  // 11. Annotation management
  // ------------------------------------------------------------------
  const removeAnnotation = (id) => {
    setAnnotations((prev) => {
      const seriesAnn = prev[activeSeriesIndex] || {};
      const frameAnn = seriesAnn[frameIndex] || [];
      return {
        ...prev,
        [activeSeriesIndex]: {
          ...seriesAnn,
          [frameIndex]: frameAnn.filter((a) => a.id !== id),
        },
      };
    });
  };

  const clearFrameAnnotations = () => {
    setAnnotations((prev) => ({
      ...prev,
      [activeSeriesIndex]: {
        ...(prev[activeSeriesIndex] || {}),
        [frameIndex]: [],
      },
    }));
  };

  // ------------------------------------------------------------------
  // 12. Render
  // ------------------------------------------------------------------
  if (!study) return <p>Loading study...</p>;

  if (series.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>DICOM Viewer</h2>
        <p style={{ color: "red" }}>
          {error || "No image series found for this study."}
        </p>
      </div>
    );
  }

  const previewLine = (() => {
    if (!measureDraft || !measurePreview) return null;

    const dxPx = measurePreview.x - measureDraft.x;
    const dyPx = measurePreview.y - measureDraft.y;
    let value, unit;
    if (currentFrame?.pixelSpacing) {
      const dxMm = dxPx * currentFrame.pixelSpacing.col;
      const dyMm = dyPx * currentFrame.pixelSpacing.row;
      value = Math.sqrt(dxMm * dxMm + dyMm * dyMm);
      unit = "mm";
    } else {
      value = Math.sqrt(dxPx * dxPx + dyPx * dyPx);
      unit = "px";
    }

    const p1 = imageToScreen(measureDraft.x, measureDraft.y);
    const p2 = imageToScreen(measurePreview.x, measurePreview.y);
    return { p1, p2, value, unit };
  })();

  return (
    <div style={{ padding: "20px" }}>
      <h2>DICOM Viewer</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Series selector */}
      {series.length > 1 && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
          {series.map((s, i) => (
            <button
              key={s.seriesInstanceUID}
              style={i === activeSeriesIndex ? activeBtnStyle : btnStyle}
              onClick={() => setActiveSeriesIndex(i)}
            >
              {s.seriesDescription}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <button style={tool === "pan" ? activeBtnStyle : btnStyle} onClick={() => { setTool("pan"); setMeasureDraft(null); setMeasurePreview(null); }}>
          Pan / Zoom
        </button>
        <button style={tool === "measure" ? activeBtnStyle : btnStyle} onClick={() => setTool("measure")}>
          Measure
        </button>
        <button style={btnStyle} onClick={() => fitToScreen(currentFrame)}>
          Fit to screen
        </button>
        <button
          style={btnStyle}
          onClick={() => {
            if (currentFrame) {
              setWc(currentFrame.defaultWc);
              setWw(currentFrame.defaultWw);
            }
          }}
        >
          Reset W/L
        </button>
        <button style={btnStyle} onClick={clearFrameAnnotations} disabled={currentAnnotations.length === 0}>
          Clear measurements
        </button>

        <span style={{ marginLeft: "auto", fontSize: "13px", color: "#aaa" }}>
          Slice {frameIndex + 1} / {activeSeries.instances.length} &nbsp;·&nbsp; WL {Math.round(wc)} / {Math.round(ww)} &nbsp;·&nbsp; Zoom {(zoom * 100).toFixed(0)}%
        </span>
      </div>

      {/* Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "900px",
          height: "650px",
          background: "#000",
          overflow: "hidden",
          cursor:
            tool === "measure" ? "crosshair" : isDragging ? "grabbing" : "grab",
          userSelect: "none",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            imageRendering: "pixelated",
          }}
        />

        {/* Annotation overlay */}
        <svg
          width={containerSize.width}
          height={containerSize.height}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        >
          {currentAnnotations.map((ann) => {
            if (ann.type !== "distance") return null;
            const p1 = imageToScreen(ann.points[0].x, ann.points[0].y);
            const p2 = imageToScreen(ann.points[1].x, ann.points[1].y);
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const label = `${ann.value.toFixed(1)} ${ann.unit}`;

            return (
              <g key={ann.id}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#3DDC84" strokeWidth="2" />
                <circle cx={p1.x} cy={p1.y} r="4" fill="#3DDC84" />
                <circle cx={p2.x} cy={p2.y} r="4" fill="#3DDC84" />
                <rect x={midX - 32} y={midY - 20} width="64" height="18" fill="rgba(0,0,0,0.65)" rx="3" />
                <text x={midX} y={midY - 7} fill="#fff" fontSize="12" textAnchor="middle">
                  {label}
                </text>
              </g>
            );
          })}

          {previewLine && (
            <g>
              <line
                x1={previewLine.p1.x}
                y1={previewLine.p1.y}
                x2={previewLine.p2.x}
                y2={previewLine.p2.y}
                stroke="#3DDC84"
                strokeWidth="2"
                strokeDasharray="5,4"
              />
              <circle cx={previewLine.p1.x} cy={previewLine.p1.y} r="4" fill="#3DDC84" />
              <rect
                x={(previewLine.p1.x + previewLine.p2.x) / 2 - 32}
                y={(previewLine.p1.y + previewLine.p2.y) / 2 - 20}
                width="64"
                height="18"
                fill="rgba(0,0,0,0.65)"
                rx="3"
              />
              <text
                x={(previewLine.p1.x + previewLine.p2.x) / 2}
                y={(previewLine.p1.y + previewLine.p2.y) / 2 - 7}
                fill="#fff"
                fontSize="12"
                textAnchor="middle"
              >
                {previewLine.value.toFixed(1)} {previewLine.unit}
              </text>
            </g>
          )}
        </svg>

        {isLoading && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "white", fontSize: "14px" }}>
            Loading...
          </div>
        )}

        {!currentFrame?.pixelSpacing && tool === "measure" && (
          <div style={{ position: "absolute", bottom: "8px", left: "8px", color: "#f59e0b", fontSize: "12px", background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: "4px" }}>
            No Pixel Spacing tag found — measurements shown in pixels
          </div>
        )}
      </div>

      {/* Measurements list */}
      {currentAnnotations.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "4px" }}>Measurements on this slice:</p>
          <ul style={{ fontSize: "13px", paddingLeft: "20px" }}>
            {currentAnnotations.map((ann) => (
              <li key={ann.id} style={{ marginBottom: "2px" }}>
                {ann.value.toFixed(2)} {ann.unit}{" "}
                <button
                  style={{ ...btnStyle, padding: "2px 8px", fontSize: "11px", marginLeft: "8px" }}
                  onClick={() => removeAnnotation(ann.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Controls help */}
      <p style={{ fontSize: "12px", color: "#888", marginTop: "10px" }}>
        Scroll = change slice &nbsp;·&nbsp; Ctrl/Cmd + scroll = zoom &nbsp;·&nbsp; Drag = pan &nbsp;·&nbsp;
        Shift + drag = window/level &nbsp;·&nbsp; Measure tool: click two points
      </p>
    </div>
  );
}
