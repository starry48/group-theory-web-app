export default function Sidebar({ mode, extraInfo }) {
  return (
    <aside style={{
      width: "260px", background: "var(--bg2)",
      borderLeft: "1px solid var(--border)",
      padding: "1.5rem 1rem", color: "var(--text2)",
      fontSize: "0.9rem", fontFamily: "var(--font-mono)"
    }}>
      <p style={{ color: "var(--text)", marginBottom: "0.5rem" }}>Game Info</p>
      <p>{mode ? `Mode: ${mode}` : "No mode selected."}</p>
    </aside>
  )
}