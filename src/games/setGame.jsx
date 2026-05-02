import { useState, useEffect, useCallback } from "react"
function generateDeck() {
  const deck = []
  for (let number = 0; number < 3; number++)
    for (let color = 0; color < 3; color++)
      for (let shape = 0; shape < 3; shape++)
        for (let shading = 0; shading < 3; shading++)
          deck.push({ number, color, shape, shading, id: `${number}${color}${shape}${shading}` })
  return deck
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function isValidSET(cards) {
  const attrs = ["number", "color", "shape", "shading"]
  for (const attr of attrs) {
    const sum = cards.reduce((acc, c) => acc + c[attr], 0)
    if (sum % 3 !== 0) return false
  }
  return true
}

function findHint(board) {
  for (let i = 0; i < board.length - 2; i++)
    for (let j = i + 1; j < board.length - 1; j++)
      for (let k = j + 1; k < board.length; k++)
        if (isValidSET([board[i], board[j], board[k]]))
          return [board[i].id, board[j].id, board[k].id]
  return null
}

const COLOR_NAMES = ["red", "green", "purple"]
const COLORS = ["var(--red)", "var(--green)", "var(--purple)"]
const SHAPE_SYMBOLS = ["●", "▲", "■"]
const SHADING_STYLE = ["filled", "striped", "empty"]

function CardSymbol({ color, shape, shading, count }) {
  const c = COLORS[color]
  const sym = SHAPE_SYMBOLS[shape]
  const style = SHADING_STYLE[shading]
  return (
    <div style={{ display: "flex", gap: "4px", justifyContent: "center", flexWrap: "wrap", minHeight: "28px", alignItems: "center" }}>
      {Array.from({ length: count + 1 }).map((_, i) => (
        <span key={i} style={{
          fontSize: "1.3rem", lineHeight: 1,
          color: style === "empty" ? "transparent" : c,
          WebkitTextStroke: style === "empty" ? `1.5px ${c}` : "none",
          opacity: style === "striped" ? 0.5 : 1
        }}>{sym}</span>
      ))}
    </div>
  )
}

function SetCard({ card, selected, hinted, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: selected ? "var(--bg3)" : "var(--card-bg)",
      border: `2px solid ${selected ? "var(--gold)" : hinted ? "#f97316" : "var(--border)"}`,
      borderRadius: "10px", padding: "0.75rem 0.5rem",
      cursor: "pointer", transition: "all 0.15s ease",
      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
      minWidth: "80px", minHeight: "110px", justifyContent: "center",
      boxShadow: selected ? "0 0 12px var(--gold)44" : "none",
      transform: selected ? "scale(1.04)" : "scale(1)"
    }}>
      <CardSymbol color={card.color} shape={card.shape} shading={card.shading} count={card.number} />
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text2)",
        textAlign: "center", letterSpacing: "0.05em"
      }}>
        [{card.number},{card.color},{card.shape},{card.shading}]
      </div>
    </div>
  )
}

export default function SETGame({ onSidebarUpdate }) {
  const [deck, setDeck] = useState([])
  const [board, setBoard] = useState([])
  const [selected, setSelected] = useState([])
  const [score, setScore] = useState(0)
  const [message, setMessage] = useState("")
  const [msgColor, setMsgColor] = useState("var(--text)")
  const [hint, setHint] = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const [showNoSetPopup, setShowNoSetPopup] = useState(false)

  const init = useCallback(() => {
    const d = shuffle(generateDeck())
    setDeck(d.slice(12))
    setBoard(d.slice(0, 12))
    setSelected([])
    setScore(0)
    setMessage("Find a SET! Select 3 cards.")
    setHint(null)
    setLastResult(null)
    setShowNoSetPopup(false)
  }, [])

  // After board changes, check if any SET exists — if not, show popup
  useEffect(() => {
    if (board.length === 0) return
    const hasSet = findHint(board) !== null
    if (!hasSet) setShowNoSetPopup(true)
  }, [board])

  useEffect(() => { init() }, [init])

  useEffect(() => {
    onSidebarUpdate({
      selectedCards: selected,
      lastResult
    })
  }, [selected, lastResult])

  const handleCardClick = (card) => {
    if (selected.find(c => c.id === card.id)) {
      setSelected(selected.filter(c => c.id !== card.id))
      return
    }
    if (selected.length >= 3) return
    const newSelected = [...selected, card]
    setSelected(newSelected)

    if (newSelected.length === 3) {
      const attrs = ["number", "color", "shape", "shading"]
      const sums = attrs.map(attr => newSelected.reduce((a, c) => a + c[attr], 0) % 3)
      const vals = attrs.map(attr => newSelected.map(c => c[attr]))
      const valid = sums.every(s => s === 0)
      const result = { valid, sums, vals }
      setLastResult(result)

      setTimeout(() => {
        if (valid) {
          setScore(s => s + 1)
          setMessage("✓ Valid SET! +1 point")
          setMsgColor("var(--green)")
          const ids = newSelected.map(c => c.id)
          const newBoard = board.filter(c => !ids.includes(c.id))
          const newDeck = [...deck]
          while (newBoard.length < 12 && newDeck.length > 0)
            newBoard.push(newDeck.shift())
          setBoard(newBoard)
          setDeck(newDeck)
        } else {
          setMessage("✗ Not a SET — try again")
          setMsgColor("var(--red)")
        }
        setSelected([])
        setHint(null)
      }, 800)
    }
  }

  const handleHint = () => {
    const h = findHint(board)
    if (h) { setHint(h); setMessage("Hint shown in orange") }
    else setMessage("No SET on board — try reshuffling!")
  }

  const handleShuffle = () => {
    setBoard(shuffle(board))
    setSelected([])
    setHint(null)
    setMessage("Board shuffled!")
  }

  // Combines board + remaining deck, reshuffles, redeals — score is kept
  const handleReshuffle = () => {
    const combined = shuffle([...board, ...deck])
    setBoard(combined.slice(0, 12))
    setDeck(combined.slice(12))
    setSelected([])
    setHint(null)
    setShowNoSetPopup(false)
    setMessage("Cards reshuffled — find a SET!")
    setMsgColor("var(--cyan)")
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>

      {/* No SET popup */}
      {showNoSetPopup && (
        <div style={{
          position: "fixed", inset: 0, background: "#000b",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300
        }}>
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--gold)",
            borderRadius: "14px", padding: "2rem", maxWidth: "400px", width: "90%",
            textAlign: "center", boxShadow: "0 0 40px var(--gold)33"
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔀</div>
            <h3 style={{
              fontFamily: "var(--font-display)", color: "var(--gold)",
              fontSize: "1.4rem", marginBottom: "0.75rem"
            }}>No Valid SETs!</h3>
            <p style={{
              color: "var(--text2)", fontSize: "0.95rem",
              marginBottom: "1.5rem", lineHeight: 1.6
            }}>
              There are no valid SETs on the board right now.
              Your score is safe — all unused cards from the board
              and deck will be reshuffled and redealt.
            </p>
            <div style={{
              background: "var(--bg3)", border: "1px solid var(--border)",
              borderRadius: "8px", padding: "0.6rem 1rem", marginBottom: "1.5rem",
              fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text2)"
            }}>
              Cards to reshuffle: {board.length + deck.length} &nbsp;|&nbsp; Score kept: {score}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button onClick={handleReshuffle} style={{
                background: "var(--gold)", color: "#000",
                fontFamily: "var(--font-display)", fontWeight: "700",
                fontSize: "1rem", padding: "0.6rem 1.4rem",
                borderRadius: "8px", border: "none"
              }}>Reshuffle Cards</button>
              <button onClick={() => setShowNoSetPopup(false)} style={{
                background: "transparent", color: "var(--text2)",
                fontFamily: "var(--font-mono)", fontSize: "0.85rem",
                padding: "0.6rem 1rem", borderRadius: "8px",
                border: "1px solid var(--border)"
              }}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "var(--text)" }}>SET</h2>
          <p style={{ color: "var(--text2)", fontSize: "0.9rem" }}>Select 3 cards that form a valid SET</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{
            fontFamily: "var(--font-mono)", color: "var(--gold)", fontSize: "1.1rem",
            background: "var(--bg3)", padding: "0.4rem 1rem", borderRadius: "8px",
            border: "1px solid var(--border)"
          }}>
            Score: {score}
          </div>
          <button onClick={handleHint} style={{
            background: "var(--bg3)", color: "#f97316", border: "1px solid #f97316",
            borderRadius: "8px", padding: "0.4rem 0.8rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem"
          }}>Hint</button>
          <button onClick={handleShuffle} style={{
            background: "var(--bg3)", color: "var(--purple)", border: "1px solid var(--purple)",
            borderRadius: "8px", padding: "0.4rem 0.8rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem"
          }}>Shuffle</button>
          <button onClick={init} style={{
            background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border)",
            borderRadius: "8px", padding: "0.4rem 0.8rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem"
          }}>New Game</button>
        </div>
      </div>

      <div style={{
        padding: "0.6rem 1rem", background: "var(--bg3)", borderRadius: "8px",
        marginBottom: "1.5rem", fontFamily: "var(--font-mono)", fontSize: "0.9rem",
        color: msgColor, border: "1px solid var(--border)"
      }}>{message}</div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
        gap: "0.75rem"
      }}>
        {board.map(card => (
          <SetCard
            key={card.id}
            card={card}
            selected={!!selected.find(c => c.id === card.id)}
            hinted={hint && hint.includes(card.id)}
            onClick={() => handleCardClick(card)}
          />
        ))}
      </div>

      <div style={{ marginTop: "1rem", color: "var(--text2)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
        Cards in deck: {deck.length} | Selected: {selected.length}/3
      </div>
    </div>
  )
}