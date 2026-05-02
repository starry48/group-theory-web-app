export default function MathPanel({ onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000a",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200
    }}>
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: "12px", padding: "2rem", maxWidth: "500px", width: "90%"
      }}>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--cyan)", marginBottom: "1rem" }}>
          ∑ Math Reference
        </h2>
        <p style={{ color: "var(--text2)", marginBottom: "1.5rem" }}>
          Full math reference coming soon.
        </p>
        <button onClick={onClose} style={{
          background: "var(--border)", color: "var(--text)",
          padding: "0.5rem 1.2rem", borderRadius: "6px"
        }}>Close</button>
      </div>
    </div>
  )
}