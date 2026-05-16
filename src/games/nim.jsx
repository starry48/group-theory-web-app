import { useState, useEffect, useCallback } from "react"
import { xorAll, nimOpt, toBinar } from "../utils/mathOfGroups.js"

const INITIAL_PILES = [3, 5, 7]

export default function NimGame({ onSidebarUpdate }) {
  const [piles, setPiles] = useState(INITIAL_PILES)
  const [currentPlayer, setCurrentPlayer] = useState("player") // "player" | "ai"
  const [selectedPile, setSelectedPile] = useState(null)
  const [takeAmount, setTakeAmount] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [message, setMessage] = useState("Your turn — select a pile and choose how many to take.")
  const [log, setLog] = useState([])
  const [teachMode, setTeachMode] = useState(false)
  const [teachHint, setTeachHint] = useState(null)
  const [customPiles, setCustomPiles] = useState("3,5,7")
  const [showHelp, setShowHelp] = useState(true)
  const [difficulty, setDifficulty] = useState("medium")

  const xorValue = xorAll(piles)
  const isLosing = xorValue === 0
  const bits = Math.max(4, ...piles.map(n => n.toString(2).length))

  useEffect(() => {
  onSidebarUpdate({
      piles,
      xorValue,
      binary: piles.map(p => p.toString(2)),
      winningPosition: xorValue !== 0,
      currentPlayer
    })
  }, [piles, xorValue, currentPlayer, onSidebarUpdate])


  const addLog = (entry) => setLog(l => [entry, ...l].slice(0, 10))

  const checkGameOver = (newPiles) => {
    if (newPiles.every(p => p === 0)) return true
    return false
  }

  const applyMove = useCallback((newPiles, player) => {
    setPiles(newPiles)
    if (checkGameOver(newPiles)) {
      setGameOver(true)
      // last to take wins → the player who just moved wins
      setWinner(player)
      setMessage(player === "player" ? "🎉 You win!" : "AI wins! Study the XOR strategy to improve.")
      return true
    }
    return false
  }, [])

  // AI turn
  useEffect(() => {
    if (currentPlayer !== "ai" || gameOver) return
    const timer = setTimeout(() => {
      const newPiles = [...piles]
      let explanation

      const useOptimal =
        difficulty === "hard" ||
        (difficulty === "medium" && Math.random() < 0.5)

      if (useOptimal) {
        const move = nimOpt(piles)
        if (move) {
          newPiles[move.pileIndex] = piles[move.pileIndex] - move.removeAmount
          explanation = `AI takes ${move.removeAmount} from pile ${move.pileIndex + 1} → XOR becomes 0`
        } else {
          const pileIdx = piles.findIndex(p => p > 0)
          newPiles[pileIdx] -= 1
          explanation = `AI is in a losing position — takes 1 from pile ${pileIdx + 1}`
        }
      } else {
        // random valid move
        const nonEmpty = piles.map((p, i) => p > 0 ? i : -1).filter(i => i >= 0)
        const pileIdx = nonEmpty[Math.floor(Math.random() * nonEmpty.length)]
        const amount = Math.ceil(Math.random() * piles[pileIdx])
        newPiles[pileIdx] -= amount
        explanation = `AI randomly takes ${amount} from pile ${pileIdx + 1}`
      }

      addLog(`AI: ${explanation}`)
      const over = applyMove(newPiles, "ai")
      if (!over) {
        setCurrentPlayer("player")
        setMessage("Your turn.")
        setSelectedPile(null)
        setTakeAmount(1)
      }
    }, 900)
    return () => clearTimeout(timer)
  }, [currentPlayer, gameOver, piles, applyMove, difficulty])

  const handleTake = () => {
    if (selectedPile === null || takeAmount < 1 || takeAmount > piles[selectedPile]) {
      setMessage("Invalid move — pick a pile and a valid amount.")
      return
    }
    const newPiles = [...piles]
    newPiles[selectedPile] -= takeAmount
    addLog(`You: take ${takeAmount} from pile ${selectedPile + 1}`)
    setTeachHint(null)
    const over = applyMove(newPiles, "player")
    if (!over) {
      setCurrentPlayer("ai")
      setMessage("AI is thinking...")
      setSelectedPile(null)
      setTakeAmount(1)
    }
  }

  const handleTeachMe = () => {
    const move = nimOpt(piles)
    if (!move) {
      setTeachHint("You're in a losing position, any move you make will give the AI a win with perfect play. Take 1 from any pile.")
    } else {
      setTeachHint(
        `Best move: take ${move.removeAmount} from pile ${move.pileIndex + 1}. ` +
        `This reduces it to ${piles[move.pileIndex] - move.removeAmount}, making the new XOR = 0.`
      )
    }
    setTeachMode(true)
  }

  const handleReset = () => {
    try {
      const parsed = customPiles.split(",").map(s => {
        const n = parseInt(s.trim()); return isNaN(n) || n < 0 ? 3 : n
      })
      setPiles(parsed.slice(0, 6))
    } catch { setPiles(INITIAL_PILES) }
    setCurrentPlayer("player")
    setGameOver(false)
    setWinner(null)
    setMessage("Your turn — select a pile and choose how many to take.")
    setLog([])
    setSelectedPile(null)
    setTakeAmount(1)
    setTeachHint(null)
  }

  return (
    <>
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "var(--text)" }}>Nim</h2>
          <p style={{ color: "var(--text2)", fontSize: "0.9rem" }}>Take stones from piles. Last to take wins.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Difficulty */}
          <div style={{ display: "flex", background: "var(--bg3)", borderRadius: "8px", border: "1px solid var(--border)", overflow: "hidden" }}>
            {[["Easy", "var(--green)"], ["Medium", "var(--gold)"], ["Hard", "var(--red)"]].map(([level, color]) => (
              <button key={level} onClick={() => setDifficulty(level.toLowerCase())} style={{
                background: difficulty === level.toLowerCase() ? color : "transparent",
                color: difficulty === level.toLowerCase() ? "#000" : "var(--text2)",
                border: "none", padding: "0.35rem 0.65rem",
                fontFamily: "var(--font-mono)", fontSize: "0.75rem", cursor: "pointer",
                transition: "all 0.15s", fontWeight: difficulty === level.toLowerCase() ? "700" : "400"
              }}>{level}</button>
            ))}
          </div>
          <input
            value={customPiles}
            onChange={e => setCustomPiles(e.target.value)}
            placeholder="e.g. 3,5,7"
            style={{
              background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)",
              padding: "0.35rem 0.6rem", borderRadius: "6px", fontFamily: "var(--font-mono)",
              fontSize: "0.8rem", width: "100px"
            }}
          />
          <button onClick={handleReset} style={{
            background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border)",
            borderRadius: "8px", padding: "0.4rem 0.8rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem"
          }}>New Game</button>
          <button onClick={() => setShowHelp(true)} style={{
            background: "var(--bg3)", color: "var(--cyan)", border: "1px solid var(--cyan)",
            borderRadius: "8px", padding: "0.4rem 0.8rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem"
          }}>Rules + Symbols</button>
        </div>
      </div>

      {/* Status */}
      <div style={{
        padding: "0.6rem 1rem", background: gameOver ? "var(--bg3)" : "var(--bg3)",
        borderRadius: "8px", marginBottom: "1.25rem",
        border: `1px solid ${gameOver ? (winner === "player" ? "var(--green)" : "var(--red)") : "var(--border)"}`,
        fontFamily: "var(--font-mono)", fontSize: "0.9rem",
        color: gameOver ? (winner === "player" ? "var(--green)" : "var(--red)") : "var(--text)"
      }}>{message}</div>

      {/* XOR display */}
      <div style={{
        background: "var(--bg3)", border: "1px solid var(--border)",
        borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1.5rem",
        fontFamily: "var(--font-mono)", fontSize: "0.85rem"
      }}>
        <div style={{ color: "var(--text2)", fontSize: "0.7rem", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          XOR COMPUTATION — ADDITION IN (ℤ₂)ⁿ
        </div>
        {piles.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: "1rem", marginBottom: "0.3rem", alignItems: "center" }}>
            <span style={{ color: "var(--text2)", minWidth: "60px" }}>Pile {i + 1}:</span>
            <span style={{ color: "var(--text)", minWidth: "20px" }}>{p}</span>
            <span style={{ color: "var(--text2)" }}>=</span>
            <span style={{ color: "var(--cyan)" }}>{toBinar(p, bits)}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid var(--border)", marginTop: "0.5rem", paddingTop: "0.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ color: "var(--text2)", minWidth: "60px" }}>XOR:</span>
          <span style={{ color: "var(--text)", minWidth: "20px" }}>{xorValue}</span>
          <span style={{ color: "var(--text2)" }}>=</span>
          <span style={{ color: xorValue === 0 ? "var(--red)" : "var(--green)" }}>{toBinar(xorValue, bits)}</span>
          <span style={{ marginLeft: "0.5rem", color: xorValue === 0 ? "var(--red)" : "var(--green)" }}>
            {xorValue === 0 ? "← LOSING" : "← WINNING"}
          </span>
        </div>
      </div>

      {/* Piles */}
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {piles.map((count, i) => (
          <div
            key={i}
            onClick={() => { if (!gameOver && currentPlayer === "player") setSelectedPile(i) }}
            style={{
              background: selectedPile === i ? "var(--bg3)" : "var(--card-bg)",
              border: `2px solid ${selectedPile === i ? "var(--gold)" : "var(--border)"}`,
              borderRadius: "12px", padding: "1rem", cursor: "pointer",
              minWidth: "90px", textAlign: "center", transition: "all 0.15s",
              boxShadow: selectedPile === i ? "0 0 12px var(--gold)44" : "none"
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", color: "var(--text2)", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
              Pile {i + 1}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", marginBottom: "0.5rem" }}>
              {Array.from({ length: count }).map((_, j) => (
                <div key={j} style={{
                  width: "28px", height: "10px", borderRadius: "5px",
                  background: "var(--gold)", opacity: 0.85
                }} />
              ))}
              {count === 0 && <div style={{ color: "var(--text2)", fontSize: "0.8rem" }}>empty</div>}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", color: "var(--gold)", fontSize: "1rem" }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      {!gameOver && currentPlayer === "player" && (
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
          <span style={{ color: "var(--text2)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>Take:</span>
          <input
            type="number" min="1"
            max={selectedPile !== null ? piles[selectedPile] : 1}
            value={takeAmount}
            onChange={e => setTakeAmount(Number(e.target.value))}
            style={{
              width: "60px", background: "var(--bg3)", border: "1px solid var(--border)",
              color: "var(--text)", borderRadius: "6px", padding: "0.3rem 0.5rem",
              fontFamily: "var(--font-mono)", textAlign: "center"
            }}
          />
          <button onClick={handleTake} style={{
            background: "var(--gold)", color: "#000",
            fontFamily: "var(--font-display)", fontWeight: "700",
            padding: "0.5rem 1.2rem", borderRadius: "8px", fontSize: "1rem"
          }}>Take</button>
          <button onClick={handleTeachMe} style={{
            background: "transparent", color: "var(--cyan)", border: "1px solid var(--cyan)",
            borderRadius: "8px", padding: "0.5rem 0.8rem",
            fontFamily: "var(--font-mono)", fontSize: "0.85rem"
          }}>Teach Me</button>
        </div>
      )}

      {/* Teach hint */}
      {teachHint && (
        <div style={{
          background: "var(--bg3)", border: "1px solid var(--cyan)", borderRadius: "8px",
          padding: "0.75rem 1rem", marginBottom: "1rem",
          fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--cyan)"
        }}>💡 {teachHint}</div>
      )}

      {/* Move log */}
      {log.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          <div style={{ fontFamily: "var(--font-mono)", color: "var(--text2)", fontSize: "0.7rem", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>MOVE LOG</div>
          {log.map((entry, i) => (
            <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: i === 0 ? "var(--text)" : "var(--text2)", marginBottom: "0.2rem" }}>
              {entry}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Help Popup */}
    {showHelp && (
      <div style={{
        position: "fixed", inset: 0, background: "#000b",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300
      }}>
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: "14px", padding: "1.5rem", width: "90%",
          maxWidth: "680px", maxHeight: "85vh", overflowY: "auto"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ color: "var(--gold)", fontFamily: "var(--font-display)" }}>Nim Guide</h2>
            <button onClick={() => setShowHelp(false)} style={{
              background: "transparent", color: "var(--text2)", border: "none", fontSize: "1.2rem", cursor: "pointer"
            }}>✕</button>
          </div>
          <div style={{ color: "var(--text2)", lineHeight: 1.7 }}>
            <p>Nim is a strategy game where players take turns removing stones from piles. The player who takes the last stone wins.</p>

            <h3 style={{ color: "var(--cyan)", marginTop: "1rem" }}>How To Play</h3>
            <ul>
              <li>Select a pile by clicking on it.</li>
              <li>Enter how many stones you want to take in which you need to take at least 1.</li>
              <li>Press <strong>Take</strong> to make your move.</li>
              <li>The AI will respond automatically.</li>
              <li>Whoever takes the very last stone wins.</li>
            </ul>

            <h3 style={{ color: "var(--cyan)", marginTop: "1rem" }}>Symbol Legend</h3>
            <p>
              <strong style={{ color: "var(--text)" }}>XOR (⊕)</strong> — Bitwise exclusive-or of all pile sizes. The key to optimal strategy.<br />
              <strong style={{ color: "var(--green)" }}>WINNING</strong> — XOR ≠ 0. A perfect move exists to force a win.<br />
              <strong style={{ color: "var(--red)" }}>LOSING</strong> — XOR = 0. Any move gives the opponent a winning position.<br />
              <strong style={{ color: "var(--cyan)" }}>Binary digits</strong> — Pile sizes shown in base-2 so XOR is computed column-by-column.
            </p>

            <h3 style={{ color: "var(--cyan)", marginTop: "1rem" }}>Group Theory Connection</h3>
            <p>
              Nim strategy is rooted within the group (ℤ₂)ⁿ which is the set of binary strings of length n under bitwise XOR.
              Each pile's size is an element with the composition being XOR. The identity is 0 (all zeros), and every element is
              its own inverse. A position will be losing exactly when the XOR of all pile sizes is the identity element.
            </p>
            <p style={{ marginTop: "0.5rem" }}>
              Use the <strong style={{ color: "var(--cyan)" }}>Teach Me</strong> button mid-game to see the optimal move explained in terms of XOR.
            </p>
          </div>
        </div>
      </div>
    )}
    </>
  )
}