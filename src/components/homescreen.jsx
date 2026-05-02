import { useState } from "react"

const modes = [
  {
    id: "SET",
    title: "SET",
    subtitle: "ℤ₃⁴",
    description: "Find groups of 3 cards where each attribute is all-same or all-different. Every valid SET is an affine line in ℤ₃⁴.",
    concept: "Vectors & Affine Geometry",
    color: "var(--cyan)",
    symbol: "⊕"
  },
  {
    id: "PermutationDuel",
    title: "Permutation Duel",
    subtitle: "S₄",
    description: "Play permutation cards to compose elements of S₄. Race to reach the target permutation before your opponent.",
    concept: "Symmetric Groups & Composition",
    color: "var(--gold)",
    symbol: "σ"
  },
  {
    id: "CosetCapture",
    title: "Coset Capture",
    subtitle: "ℤ₁₂ / D₄",
    description: "Compete to collect complete cosets of a subgroup. Cosets partition the group — every card belongs to exactly one.",
    concept: "Cosets & Lagrange's Theorem",
    color: "var(--green)",
    symbol: "gH"
  },
  {
    id: "Nim",
    title: "Nim",
    subtitle: "(ℤ₂)ⁿ",
    description: "Take stones from piles. The winning strategy is determined entirely by XOR — addition in a direct product of ℤ₂ groups.",
    concept: "Direct Products & XOR",
    color: "var(--purple)",
    symbol: "⊻"
  }
]

export default function HomeScreen({ onSelectMode }) {
  const [hovered, setHovered] = useState(null)

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "3rem 2rem" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
        <div style={{
          fontFamily: "var(--font-mono)", color: "var(--text2)",
          fontSize: "0.8rem", letterSpacing: "0.2em", marginBottom: "0.75rem"
        }}>
          MATH 411 — GROUP THEORY
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 6vw, 4rem)",
          color: "var(--text)", lineHeight: 1.1, marginBottom: "1rem"
        }}>
          Group Theory<br />
          <span style={{ color: "var(--gold)" }}>Card Games</span>
        </h1>
        <p style={{
          color: "var(--text2)", maxWidth: "500px", margin: "0 auto",
          fontStyle: "italic", fontSize: "1.1rem"
        }}>
          Four playable games that make abstract algebra concrete.
          Each mode reveals a different face of group structure.
        </p>
      </div>

      {/* What is a group? */}
      <GroupPrimer />

      {/* Game cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "1.5rem", maxWidth: "1100px", margin: "0 auto 3rem"
      }}>
        {modes.map(mode => (
          <div
            key={mode.id}
            onMouseEnter={() => setHovered(mode.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: "var(--card-bg)",
              border: `1px solid ${hovered === mode.id ? mode.color : "var(--border)"}`,
              borderRadius: "12px", padding: "1.75rem",
              transition: "all 0.25s ease",
              transform: hovered === mode.id ? "translateY(-4px)" : "none",
              boxShadow: hovered === mode.id ? `0 8px 30px ${mode.color}22` : "none",
              display: "flex", flexDirection: "column", gap: "1rem"
            }}
          >
            {/* Symbol + title */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h2 style={{
                  fontFamily: "var(--font-display)", fontSize: "1.4rem",
                  color: "var(--text)", marginBottom: "0.2rem"
                }}>{mode.title}</h2>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: mode.color
                }}>{mode.subtitle}</span>
              </div>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "1.8rem",
                color: mode.color, opacity: 0.6
              }}>{mode.symbol}</span>
            </div>

            <p style={{ color: "var(--text2)", fontSize: "0.95rem", lineHeight: 1.6, flex: 1 }}>
              {mode.description}
            </p>

            {/* Concept tag */}
            <div style={{
              fontSize: "0.75rem", fontFamily: "var(--font-mono)",
              color: mode.color, background: `${mode.color}15`,
              padding: "0.3rem 0.6rem", borderRadius: "4px",
              display: "inline-block", alignSelf: "flex-start"
            }}>
              {mode.concept}
            </div>

            <button
              onClick={() => onSelectMode(mode.id)}
              style={{
                background: mode.color, color: "#000",
                fontFamily: "var(--font-display)", fontWeight: "700",
                fontSize: "1rem", padding: "0.7rem 1.2rem",
                borderRadius: "8px", width: "100%", marginTop: "0.5rem"
              }}
            >
              Play →
            </button>
          </div>
        ))}
      </div>

      {/* References */}
      <References />
    </div>
  )
}

function GroupPrimer() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      maxWidth: "700px", margin: "0 auto 2.5rem",
      background: "var(--bg3)", border: "1px solid var(--border)",
      borderRadius: "10px", overflow: "hidden"
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "1rem 1.5rem",
          background: "transparent", color: "var(--gold)",
          fontFamily: "var(--font-display)", fontSize: "1rem",
          textAlign: "left", display: "flex", justifyContent: "space-between"
        }}
      >
        What is a group? {open ? "▲" : "▼"}
      </button>
      {open && (
        <div style={{ padding: "0 1.5rem 1.25rem", color: "var(--text2)", fontSize: "0.95rem" }}>
          <p style={{ marginBottom: "0.75rem" }}>
            A <strong style={{ color: "var(--text)" }}>group</strong> is a set G with an operation ★ satisfying four axioms:
          </p>
          {[
            ["Closure", "For all a, b ∈ G, we have a ★ b ∈ G"],
            ["Associativity", "(a ★ b) ★ c = a ★ (b ★ c) for all a, b, c ∈ G"],
            ["Identity", "There exists e ∈ G such that e ★ a = a ★ e = a"],
            ["Inverses", "For each a ∈ G there exists a⁻¹ such that a ★ a⁻¹ = e"]
          ].map(([name, desc]) => (
            <div key={name} style={{ display: "flex", gap: "0.75rem", marginBottom: "0.4rem" }}>
              <span style={{ color: "var(--gold)", fontFamily: "var(--font-mono)", fontSize: "0.8rem", minWidth: "100px" }}>{name}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function References() {
  const refs = [
    "Gallian, J. A. (2021). Contemporary Abstract Algebra (10th ed.). Chapman and Hall/CRC.",
    "Davis, T. (2003). The mathematics of the game SET. geometer.org/mathcircles/set.pdf",
    "Berlekamp, Conway & Guy (2001). Winning Ways for your Mathematical Plays. A K Peters.",
    "Sprague, R. P. (1935). Über mathematische Kampfspiele. Tôhoku Mathematical Journal, 41.",
    "Cameron, P. J. (1999). Permutation Groups. Cambridge University Press.",
    "Numberphile (2014). Nim — the mathematical strategy game. YouTube."
  ]
  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
      <h3 style={{ fontFamily: "var(--font-display)", color: "var(--text2)", fontSize: "1rem", marginBottom: "1rem" }}>
        References
      </h3>
      {refs.map((ref, i) => (
        <p key={i} style={{ color: "var(--text2)", fontSize: "0.85rem", marginBottom: "0.5rem", fontFamily: "var(--font-mono)" }}>
          [{i + 1}] {ref}
        </p>
      ))}
    </div>
  )
}