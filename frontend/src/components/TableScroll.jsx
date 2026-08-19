/*
 * Bounds a table to a scrollable region so only the
 * table scrolls while the page chrome stays put. Pair
 * with a sticky <thead> so column headers remain visible.
 */
export default function TableScroll({
  children,
  maxHeight = "calc(100vh - 300px)"
}) {
  return (
    <div style={{ overflowY: "auto", maxHeight }}>
      {children}
    </div>
  );
}
