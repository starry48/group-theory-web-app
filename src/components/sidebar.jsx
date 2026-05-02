export default function Sidebar({ mode, extraInfo }) {
  return (
    <aside style={{
      width: "280px", minWidth: "280px",
      background: "var(--bg2)", borderLeft: "1px solid var(--border)",
      padding: "1.5rem", overflowY: "auto", fontSize: "0.9rem"
    }}>
      <div style={{
        fontFamily: "var(--font-mono)", color: "var(--gold)",
        fontSize: "0.7rem", letterSpacing: "0.15em", marginBottom: "1rem"
      }}>
        GROUP THEORY LENS
      </div>

      {mode === "SET" && <SetSidebar info={extraInfo} />}
      {mode === "PermutationDuel" && <PermSidebar info={extraInfo} />}
      {mode === "CosetCapture" && <CosetSidebar info={extraInfo} />}
      {mode === "Nim" && <NimSidebar info={extraInfo} />}
    </aside>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: "var(--font-mono)", color: "var(--text2)",
      fontSize: "0.7rem", letterSpacing: "0.1em",
      borderBottom: "1px solid var(--border)", paddingBottom: "0.4rem", marginBottom: "0.75rem"
    }}>{children}</div>
  )
}

function MathBox({ children }) {
  return (
    <div style={{
      background: "var(--bg3)", border: "1px solid var(--border)",
      borderRadius: "6px", padding: "0.75rem", fontFamily: "var(--font-mono)",
      fontSize: "0.8rem", color: "var(--cyan)", marginBottom: "0.75rem", lineHeight: 1.7
    }}>{children}</div>
  )
}

function Def({ term, children }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <span style={{ color: "var(--gold)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>{term}: </span>
      <span style={{ color: "var(--text2)", fontSize: "0.85rem" }}>{children}</span>
    </div>
  )
}

function SetSidebar({ info }) {
  const { selectedCards, lastResult } = info
  return (
    <div>
      <SectionTitle>THE MATH</SectionTitle>
      <Def term="Cards">Each card is a vector in ℤ₃⁴ — four attributes, each taking a value in {"{0, 1, 2}"}.</Def>
      <Def term="Valid SET">Three cards c₁, c₂, c₃ form a SET iff for each attribute i: c₁[i] + c₂[i] + c₃[i] ≡ 0 (mod 3)</Def>
      <Def term="Affine line">A valid SET is exactly an affine line in the vector space ℤ₃⁴.</Def>

      {selectedCards && selectedCards.length > 0 && (
        <>
          <SectionTitle>SELECTED CARDS</SectionTitle>
          {selectedCards.map((card, i) => (
            <MathBox key={i}>
              [{card.number}, {card.color}, {card.shape}, {card.shading}]
            </MathBox>
          ))}
        </>
      )}

      {lastResult && (
        <>
          <SectionTitle>LAST CHECK</SectionTitle>
          <MathBox>
            {lastResult.sums.map((s, i) => (
              <div key={i}>attr {i}: {lastResult.vals[i].join(" + ")} = {lastResult.vals[i].reduce((a,b)=>a+b,0)} ≡ {s} (mod 3) {s === 0 ? "✓" : "✗"}</div>
            ))}
          </MathBox>
          <div style={{ color: lastResult.valid ? "var(--green)" : "var(--red)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
            {lastResult.valid ? "✓ Valid SET — all sums ≡ 0" : "✗ Not a SET"}
          </div>
        </>
      )}
    </div>
  )
}

function PermSidebar({ info }) {
  const { currentProduct, targetPerm, productNotation, order } = info
  return (
    <div>
      <SectionTitle>THE MATH</SectionTitle>
      <Def term="S₄">The symmetric group on 4 elements. Contains all 4! = 24 permutations.</Def>
      <Def term="Composition">σ∘τ means apply τ first, then σ. Composition is the group operation.</Def>
      <Def term="Order">The order of σ is the smallest n where σⁿ = identity.</Def>

      {currentProduct && (
        <>
          <SectionTitle>CURRENT PRODUCT</SectionTitle>
          <MathBox>
            Array: [{currentProduct.join(", ")}]{"\n"}
            Cycle: {productNotation || "e"}{"\n"}
            Order: {order || "—"}
          </MathBox>
        </>
      )}

      {targetPerm && (
        <>
          <SectionTitle>TARGET</SectionTitle>
          <MathBox>[{targetPerm.join(", ")}]</MathBox>
        </>
      )}
    </div>
  )
}

function CosetSidebar({ info }) {
  const { group, subgroup, cosets, lagrange } = info
  return (
    <div>
      <SectionTitle>THE MATH</SectionTitle>
      <Def term="Subgroup">H ≤ G if H is closed under the group operation and contains inverses.</Def>
      <Def term="Left coset">gH = {"{ g★h : h ∈ H }"} for any g ∈ G.</Def>
      <Def term="Lagrange">|G| = |H| × (number of cosets)</Def>

      {group && subgroup && (
        <>
          <SectionTitle>CURRENT GAME</SectionTitle>
          <MathBox>
            Group: {group}{"\n"}
            |G| = {group === "Z12" ? 12 : 8}{"\n"}
            H = {"{"}{subgroup?.join(", ")}{"}"}{"\n"}
            |H| = {subgroup?.length}{"\n"}
            Cosets: {lagrange || "—"}
          </MathBox>
        </>
      )}
    </div>
  )
}

function NimSidebar({ info }) {
  const { piles, xorValue, isLosing } = info

  const getBits = (nums) => {
    if (!nums || nums.length === 0) return 4
    return Math.max(4, ...nums.map(n => n.toString(2).length))
  }

  const bits = getBits(piles)

  return (
    <div>
      <SectionTitle>THE MATH</SectionTitle>
      <Def term="XOR">Bitwise XOR = addition in (ℤ₂)ⁿ, the direct product of n copies of ℤ₂.</Def>
      <Def term="Theorem">A position is LOSING iff XOR of all pile sizes = 0.</Def>
      <Def term="Strategy">Find a pile where piles[i] XOR nimSum &lt; piles[i]. Reduce that pile.</Def>

      {piles && piles.length > 0 && (
        <>
          <SectionTitle>LIVE XOR</SectionTitle>
          <MathBox>
            {piles.map((p, i) => (
              <div key={i}>{p.toString().padStart(2)} = {p.toString(2).padStart(bits, "0")}</div>
            ))}
            <div style={{ borderTop: "1px solid var(--border)", marginTop: "0.4rem", paddingTop: "0.4rem" }}>
              XOR = {xorValue?.toString(2).padStart(bits, "0")} = {xorValue}
            </div>
          </MathBox>
          <div style={{
            color: isLosing ? "var(--red)" : "var(--green)",
            fontFamily: "var(--font-mono)", fontSize: "0.85rem"
          }}>
            {isLosing ? "✗ Losing position (XOR = 0)" : "✓ Winning position (XOR ≠ 0)"}
          </div>
        </>
      )}

      <div style={{ marginTop: "1rem" }}>
        <SectionTitle>SPRAGUE-GRUNDY</SectionTitle>
        <span style={{ color: "var(--text2)", fontSize: "0.85rem" }}>
          Every impartial game position has a nim-value. Nim is the canonical example — all such games reduce to it.
        </span>
      </div>
    </div>
  )
}