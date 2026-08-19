import {
  IconChevronLeft,
  IconChevronRight
} from "@tabler/icons-react";

/*
 * Simple pager. Shows nothing when there's only one page.
 */
export default function Pagination({
  page,
  pageCount,
  onPage
}) {
  if (pageCount <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "10px",
        marginTop: "12px"
      }}
    >
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        style={{
          ...btn,
          opacity: page <= 1 ? 0.4 : 1,
          cursor: page <= 1 ? "not-allowed" : "pointer"
        }}
        aria-label="Previous page"
      >
        <IconChevronLeft size={16} />
      </button>

      <span style={{ fontSize: "13px", color: "#6b7280" }}>
        Page {page} of {pageCount}
      </span>

      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount}
        style={{
          ...btn,
          opacity: page >= pageCount ? 0.4 : 1,
          cursor:
            page >= pageCount ? "not-allowed" : "pointer"
        }}
        aria-label="Next page"
      >
        <IconChevronRight size={16} />
      </button>
    </div>
  );
}

const btn = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  background: "white",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  color: "#374151"
};
