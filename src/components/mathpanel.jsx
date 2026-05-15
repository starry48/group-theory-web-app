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
          ∑ GroupMath Reference
        </h2>
        <div style={{ color: "var(--text2)", lineHeight: 1.7 }}>
          <h3 style={{ color: "var(--gold)" }}>Groups</h3>
          <p>
            A group is a set together with an operation satisfying:
          </p>

          <ul>
            <li>Closure</li>
            <li>Associativity</li>
            <li>Identity element</li>
            <li>Inverse elements</li>
          </ul>

          <h3 style={{ color: "var(--gold)", marginTop: "1rem" }}>Cosets</h3>
          <p>
            A coset is formed by combining a subgroup with another group element.
            Cosets partition the group into equally sized pieces.
          </p>

          <h3 style={{ color: "var(--gold)", marginTop: "1rem" }}>Lagrange's Theorem</h3>
          <p>
            The size of a subgroup divides the size of the whole group.
          </p>

          <h3 style={{ color: "var(--gold)", marginTop: "1rem" }}>Permutation Groups</h3>
          <p>
            Permutations rearrange objects. Composition of permutations forms symmetric groups.
          </p>

          <h3 style={{ color: "var(--gold)", marginTop: "1rem" }}>Nim + XOR</h3>
          <p>
            Winning Nim positions are determined using binary XOR. A zero XOR value means the
            current player is in a losing position if the opponent plays optimally.
          </p>
        </div>
        <button onClick={onClose} style={{
          background: "var(--border)", color: "var(--text)",
          padding: "0.5rem 1.2rem", borderRadius: "6px"
        }}>Close</button>
      </div>
    </div>
  )
}