import { useState, useEffect, useCallback, useRef } from "react"
import {
  z12Add,
  z12Subgroup,
  d4Mult,
  d4Subgroup,
  D4_ELEMENTS,
  cosetPart
} from "../utils/mathOfGroups.js"

const Z12_ELEMENTS = Array.from({ length: 12 }, (_, i) => i)
const COSET_COLORS = ["var(--cyan)", "var(--gold)", "var(--green)", "var(--purple)", "var(--red)", "var(--text)"]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Returns true if the given hand contains all elements needed to complete
// at least one full coset (accounting for cards already being collected).
function canCompleteAnyCoset(hand, collecting, cosets, map) {
  // For each coset, check if hand + collecting together cover the whole coset
  for (let i = 0; i < cosets.length; i++) {
    const coset = cosets[i]
    const have = new Set([
      ...collecting.filter(c => map[String(c.value)] === i).map(c => String(c.value)),
      ...hand.filter(c => map[String(c.value)] === i).map(c => String(c.value))
    ])
    if (coset.every(e => have.has(String(e)))) return true
  }
  return false
}

export default function CosetCapture({ onSidebarUpdate }) {
  const [groupMode, setGroupMode] = useState("Z12")
  const [subgroupIndex, setSubgroupIndex] = useState(0)
  const [cosets, setCosetsState] = useState([])
  const [playerHand, setPlayerHand] = useState([])
  const [opponentHand, setOpponentHand] = useState([])
  const [playerCollecting, setPlayerCollecting] = useState([])
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [message, setMessage] = useState("")
  const [gameOver, setGameOver] = useState(false)
  const [cosetMap, setCosetMap] = useState({})
  const [showHelp, setShowHelp] = useState(true)
  const [difficulty, setDifficulty] = useState("medium")
  // "player" | "ai" — only the active turn's player can act
  const [turn, setTurn] = useState("player")

  // Refs so the AI callback always reads fresh state without stale closures
  const cosetsRef = useRef([])
  const cosetMapRef = useRef({})
  const opponentCollectingRef = useRef([])
  const opponentScoreRef = useRef(0)
  const playerScoreRef = useRef(0)
  const difficultyRef = useRef("medium")
  const gameOverRef = useRef(false)
  const opponentHandRef = useRef([])
  const playerHandRef = useRef([])
  const playerCollectingRef = useRef([])
  const turnRef = useRef("player")

  const syncTurn = (val) => { turnRef.current = val; setTurn(val) }
  const syncOpponentCollecting = (val) => { opponentCollectingRef.current = val }
  const syncOpponentScore = (val) => { opponentScoreRef.current = val; setOpponentScore(val) }
  const syncPlayerScore = (val) => { playerScoreRef.current = val; setPlayerScore(val) }
  const syncPlayerCollecting = (val) => { playerCollectingRef.current = val; setPlayerCollecting(val) }
  const syncPlayerHand = (val) => { playerHandRef.current = val; setPlayerHand(val) }
  const syncOpponentHand = (val) => { opponentHandRef.current = val; setOpponentHand(val) }

  useEffect(() => { difficultyRef.current = difficulty }, [difficulty])

  const getConfig = useCallback(() => {
    if (groupMode === "Z12") {
      const subgroups = [
        { label: "{0, 6}", elements: z12Subgroup(2) },
        { label: "{0, 4, 8}", elements: z12Subgroup(3) },
        { label: "{0, 3, 6, 9}", elements: z12Subgroup(4) },
        { label: "{0, 2, 4, 6, 8, 10}", elements: z12Subgroup(6) },
      ]
      return { elements: Z12_ELEMENTS, op: z12Add, subgroups, label: e => String(e) }
    } else {
      const subs = d4Subgroup()
      const subgroups = subs.map(s => ({ label: "{" + s.join(", ") + "}", elements: s }))
      return { elements: D4_ELEMENTS, op: d4Mult, subgroups, label: e => e }
    }
  }, [groupMode])

  const init = useCallback(() => {
    const config = getConfig()
    const subgroup = config.subgroups[subgroupIndex]?.elements || config.subgroups[0].elements
    const cs = cosetPart(config.elements, subgroup, config.op)
    setCosetsState(cs)
    cosetsRef.current = cs

    const map = {}
    cs.forEach((c, i) => c.forEach(e => { map[String(e)] = i }))
    setCosetMap(map)
    cosetMapRef.current = map

    const allCards = shuffle(config.elements.map(e => ({ value: e, label: config.label(e) })))
    const mid = Math.floor(allCards.length / 2)
    const pHand = allCards.slice(0, mid)
    const oHand = allCards.slice(mid)
    syncPlayerHand(pHand)
    syncOpponentHand(oHand)

    syncPlayerCollecting([])
    syncOpponentCollecting([])
    syncPlayerScore(0)
    syncOpponentScore(0)
    gameOverRef.current = false
    setGameOver(false)
    syncTurn("player")
    setMessage("Your turn — collect cards from the same coset to score!")

    onSidebarUpdate({
      group: groupMode,
      subgroup,
      cosets: cs,
      lagrange: `${config.elements.length} = ${subgroup.length} × ${cs.length}`
    })
  }, [groupMode, subgroupIndex, getConfig, onSidebarUpdate])

  useEffect(() => { init() }, [init])

  const endGame = useCallback((pScore, oScore) => {
    gameOverRef.current = true
    setGameOver(true)
    if (pScore > oScore) setMessage(`🎉 You win! ${pScore} cosets to ${oScore}.`)
    else if (oScore > pScore) setMessage(`AI wins! ${oScore} cosets to ${pScore}.`)
    else setMessage(`It's a tie! ${pScore} cosets each.`)
  }, [])

  // Check if neither player can complete any coset with their current cards.
  // If so, pool all unscored cards, reshuffle, and redistribute.
  const checkAndResolveDeadlock = useCallback((pHand, oHand, pCollecting, oCollecting) => {
    const map = cosetMapRef.current
    const cs = cosetsRef.current

    const playerStuck = !canCompleteAnyCoset(pHand, pCollecting, cs, map)
    const aiStuck = !canCompleteAnyCoset(oHand, oCollecting, cs, map)

    if (!playerStuck || !aiStuck) return false // at least one can still score

    // Both stuck — pool and redistribute
    const pool = shuffle([...pHand, ...oHand, ...pCollecting, ...oCollecting])
    if (pool.length === 0) return false

    const mid = Math.floor(pool.length / 2)
    const newPHand = pool.slice(0, mid)
    const newOHand = pool.slice(mid)

    syncPlayerHand(newPHand)
    syncOpponentHand(newOHand)
    syncPlayerCollecting([])
    syncOpponentCollecting([])
    setMessage("⟳ Deadlock — neither player could complete a coset. Cards reshuffled!")
    return true
  }, [])

  // ── AI TURN ──────────────────────────────────────────────────────────────
  const aiTurn = useCallback((pHand, oHand) => {
    if (oHand.length === 0 || gameOverRef.current) {
      syncTurn("player")
      setMessage("Your turn.")
      return
    }

    setTimeout(() => {
      if (gameOverRef.current) return

      const diff = difficultyRef.current
      const map = cosetMapRef.current
      const cs = cosetsRef.current
      const oc = opponentCollectingRef.current

      let card = null

      if (diff === "hard") {
        if (oc.length > 0) {
          const target = map[String(oc[0].value)]
          const matching = oHand.filter(c => map[String(c.value)] === target)
          if (matching.length > 0) card = matching[0]
        }
        if (!card) {
          const counts = {}
          oHand.forEach(c => { const ci = map[String(c.value)]; counts[ci] = (counts[ci] || 0) + 1 })
          const bestCoset = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0])
          card = oHand.find(c => map[String(c.value)] === bestCoset) || oHand[0]
        }
      } else if (diff === "medium") {
        if (Math.random() < 0.6) {
          if (oc.length > 0) {
            const target = map[String(oc[0].value)]
            const matching = oHand.filter(c => map[String(c.value)] === target)
            if (matching.length > 0) card = matching[0]
          }
          if (!card) {
            const counts = {}
            oHand.forEach(c => { const ci = map[String(c.value)]; counts[ci] = (counts[ci] || 0) + 1 })
            const bestCoset = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0])
            card = oHand.find(c => map[String(c.value)] === bestCoset) || oHand[0]
          }
        } else {
          card = oHand[Math.floor(Math.random() * oHand.length)]
        }
      } else {
        // Easy: 30% chance to deliberately mis-play
        if (oc.length > 0 && Math.random() < 0.3) {
          const target = map[String(oc[0].value)]
          const wrong = oHand.filter(c => map[String(c.value)] !== target)
          card = wrong.length > 0
            ? wrong[Math.floor(Math.random() * wrong.length)]
            : oHand[Math.floor(Math.random() * oHand.length)]
        } else {
          card = oHand[Math.floor(Math.random() * oHand.length)]
        }
      }

      if (!card) { syncTurn("player"); setMessage("Your turn."); return }

      const cosetIdx = map[String(card.value)]
      const newOHand = oHand.filter(c => c !== card)
      syncOpponentHand(newOHand)

      const newOCollecting = [...oc, card]
      const allSame = newOCollecting.every(c => map[String(c.value)] === cosetIdx)

      let finalOCollecting = newOCollecting

      if (!allSame) {
        // AI mis-played — discard its collection
        syncOpponentCollecting([])
        finalOCollecting = []
      } else if (newOCollecting.length === cs[cosetIdx]?.length) {
        // AI completed a coset
        const newScore = opponentScoreRef.current + 1
        syncOpponentScore(newScore)
        syncOpponentCollecting([])
        finalOCollecting = []

        if (pHand.length === 0 && newOHand.length === 0) {
          endGame(playerScoreRef.current, newScore)
          return
        }
      } else {
        syncOpponentCollecting(newOCollecting)
      }

      // Check for deadlock before handing back to player
      const deadlocked = checkAndResolveDeadlock(
        pHand, newOHand,
        playerCollectingRef.current, finalOCollecting
      )

      syncTurn("player")
      if (!deadlocked) setMessage("Your turn.")
    }, 800)
  }, [endGame, checkAndResolveDeadlock])

  // ── PLAYER TURN ───────────────────────────────────────────────────────────
  const handlePlayCard = (card, idx) => {
    if (gameOver || turnRef.current !== "player") return

    const map = cosetMapRef.current
    const cs = cosetsRef.current
    const cosetIdx = map[String(card.value)]
    const newCollecting = [...playerCollectingRef.current, card]
    const newHand = playerHandRef.current.filter((_, i) => i !== idx)
    syncPlayerHand(newHand)

    const allSameCoset = newCollecting.every(c => map[String(c.value)] === cosetIdx)

    if (!allSameCoset) {
      // Player mis-played — discard and pass turn
      setMessage("Those cards don't share a coset — collection discarded. AI's turn...")
      syncPlayerCollecting([])
      syncTurn("ai")
      aiTurn(newHand, opponentHandRef.current)
      return
    }

    if (newCollecting.length === cs[cosetIdx]?.length) {
      // Player completed a coset
      const newScore = playerScoreRef.current + 1
      syncPlayerScore(newScore)
      syncPlayerCollecting([])
      setMessage(`✓ Coset collected! Score: ${newScore}. AI's turn...`)

      if (newHand.length === 0 && opponentHandRef.current.length === 0) {
        endGame(newScore, opponentScoreRef.current)
        return
      }

      // Pass turn to AI
      syncTurn("ai")
      aiTurn(newHand, opponentHandRef.current)
    } else {
      // Still collecting — stay on player's turn, no AI move yet
      syncPlayerCollecting(newCollecting)
      setMessage(`Collecting coset ${cosetIdx} (${newCollecting.length}/${cs[cosetIdx]?.length || "?"}). Keep going or play a different coset's card to discard and pass.`)
    }
  }

  const config = getConfig()
  const subgroupOptions = config.subgroups
  const isPlayerTurn = turn === "player" && !gameOver

  return (
    <>
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "var(--text)" }}>Coset Capture</h2>
          <p style={{ color: "var(--text2)", fontSize: "0.9rem" }}>Collect complete cosets of the subgroup</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: "var(--bg3)", borderRadius: "8px", border: "1px solid var(--border)", overflow: "hidden" }}>
            {[["Easy", "var(--green)"], ["Medium", "var(--gold)"], ["Hard", "var(--red)"]].map(([level, color]) => (
              <button key={level} onClick={() => { setDifficulty(level.toLowerCase()); difficultyRef.current = level.toLowerCase() }} style={{
                background: difficulty === level.toLowerCase() ? color : "transparent",
                color: difficulty === level.toLowerCase() ? "#000" : "var(--text2)",
                border: "none", padding: "0.35rem 0.65rem",
                fontFamily: "var(--font-mono)", fontSize: "0.75rem", cursor: "pointer",
                transition: "all 0.15s", fontWeight: difficulty === level.toLowerCase() ? "700" : "400"
              }}>{level}</button>
            ))}
          </div>
          <button onClick={() => setGroupMode(m => m === "Z12" ? "D4" : "Z12")} style={{
            background: "var(--bg3)", color: "var(--cyan)", border: "1px solid var(--cyan)",
            borderRadius: "8px", padding: "0.4rem 0.8rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem"
          }}>Switch to {groupMode === "Z12" ? "D₄" : "ℤ₁₂"}</button>
          <button onClick={init} style={{
            background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border)",
            borderRadius: "8px", padding: "0.4rem 0.8rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem"
          }}>New Game</button>
          <button onClick={() => setShowHelp(true)} style={{
            background: "var(--bg3)", color: "var(--cyan)", border: "1px solid var(--cyan)",
            borderRadius: "8px", padding: "0.4rem 0.8rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem"
          }}>Rules + Symbols</button>
        </div>
      </div>

      {/* Subgroup selector */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--text2)", fontSize: "0.7rem", marginBottom: "0.4rem" }}>SUBGROUP H</div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {subgroupOptions.map((sg, i) => (
            <button key={i} onClick={() => setSubgroupIndex(i)} style={{
              background: subgroupIndex === i ? "var(--green)" : "var(--bg3)",
              color: subgroupIndex === i ? "#000" : "var(--text2)",
              border: "1px solid var(--border)", borderRadius: "6px",
              padding: "0.3rem 0.6rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem"
            }}>{sg.label}</button>
          ))}
        </div>
      </div>

      {/* Coset partition */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--text2)", fontSize: "0.7rem", marginBottom: "0.4rem" }}>
          COSET PARTITION — {groupMode} / H ({cosets.length} cosets)
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {cosets.map((coset, i) => (
            <div key={i} style={{
              background: "var(--bg3)", border: `1px solid ${COSET_COLORS[i % COSET_COLORS.length]}`,
              borderRadius: "8px", padding: "0.5rem 0.75rem"
            }}>
              <div style={{ fontFamily: "var(--font-mono)", color: COSET_COLORS[i % COSET_COLORS.length], fontSize: "0.7rem", marginBottom: "0.3rem" }}>
                Coset {i}
              </div>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {coset.map(e => (
                  <span key={String(e)} style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.8rem",
                    color: COSET_COLORS[i % COSET_COLORS.length],
                    background: `${COSET_COLORS[i % COSET_COLORS.length]}22`,
                    padding: "0.1rem 0.4rem", borderRadius: "4px"
                  }}>{config.label(e)}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI difficulty + turn indicator row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text2)" }}>
          AI:&nbsp;
          <span style={{ color: difficulty === "easy" ? "var(--green)" : difficulty === "medium" ? "var(--gold)" : "var(--red)", fontWeight: 700 }}>
            {difficulty.toUpperCase()}
          </span>
          {difficulty === "easy" && " — random, sometimes self-sabotages"}
          {difficulty === "medium" && " — strategic 60%, random 40%"}
          {difficulty === "hard" && " — always optimal"}
        </div>
        {!gameOver && (
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700,
            color: turn === "player" ? "var(--gold)" : "var(--cyan)",
            background: turn === "player" ? "var(--gold)22" : "var(--cyan)22",
            border: `1px solid ${turn === "player" ? "var(--gold)" : "var(--cyan)"}`,
            padding: "0.2rem 0.6rem", borderRadius: "20px"
          }}>
            {turn === "player" ? "● YOUR TURN" : "○ AI THINKING..."}
          </div>
        )}
      </div>

      {/* Scores */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        {[["You", playerScore, "var(--gold)"], ["AI", opponentScore, "var(--text2)"]].map(([name, score, color]) => (
          <div key={name} style={{
            flex: 1, background: "var(--bg3)", border: "1px solid var(--border)",
            borderRadius: "8px", padding: "0.6rem 1rem", textAlign: "center"
          }}>
            <div style={{ fontFamily: "var(--font-mono)", color, fontSize: "0.75rem" }}>{name}</div>
            <div style={{ fontFamily: "var(--font-display)", color, fontSize: "1.5rem" }}>{score}</div>
          </div>
        ))}
      </div>

      {/* Status message */}
      <div style={{
        padding: "0.6rem 1rem", background: "var(--bg3)", borderRadius: "8px", marginBottom: "1.25rem",
        border: `1px solid ${gameOver ? "var(--gold)" : "var(--border)"}`,
        fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text)"
      }}>{message}</div>

      {/* Currently collecting */}
      {playerCollecting.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontFamily: "var(--font-mono)", color: "var(--gold)", fontSize: "0.7rem", marginBottom: "0.4rem" }}>
            COLLECTING ({playerCollecting.length}/{cosets[cosetMapRef.current[String(playerCollecting[0]?.value)]]?.length || "?"})
          </div>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {playerCollecting.map((c, i) => (
              <span key={i} style={{
                fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--gold)",
                background: "var(--bg3)", border: "1px solid var(--gold)",
                padding: "0.3rem 0.6rem", borderRadius: "6px"
              }}>{c.label}</span>
            ))}
          </div>
        </div>
      )}

      {/* Player hand */}
      <div>
        <div style={{ fontFamily: "var(--font-mono)", color: isPlayerTurn ? "var(--gold)" : "var(--text2)", fontSize: "0.7rem", marginBottom: "0.5rem" }}>
          YOUR HAND {isPlayerTurn ? "— click to play" : "— waiting for AI..."}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {playerHand.map((card, i) => {
            const cosetIdx = cosetMap[String(card.value)]
            const color = COSET_COLORS[cosetIdx % COSET_COLORS.length]
            return (
              <div key={i} onClick={() => handlePlayCard(card, i)} style={{
                background: "var(--card-bg)",
                border: `2px solid ${color}`,
                borderRadius: "8px", padding: "0.5rem 0.75rem",
                cursor: isPlayerTurn ? "pointer" : "not-allowed",
                opacity: isPlayerTurn ? 1 : 0.45,
                transition: "all 0.15s",
                fontFamily: "var(--font-mono)", fontSize: "1rem",
                color, minWidth: "44px", textAlign: "center"
              }}>{card.label}</div>
            )
          })}
          {playerHand.length === 0 && (
            <div style={{ color: "var(--text2)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>No cards left.</div>
          )}
        </div>
      </div>
    </div>

    {showHelp && (
      <div style={{ position: "fixed", inset: 0, background: "#000b", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "14px", padding: "1.5rem", width: "90%", maxWidth: "700px", maxHeight: "85vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ color: "var(--gold)", fontFamily: "var(--font-display)" }}>Coset Capture Guide</h2>
            <button onClick={() => setShowHelp(false)} style={{ background: "transparent", color: "var(--text2)", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ color: "var(--text2)", lineHeight: 1.7 }}>
            <p>Collect cards that belong to the same coset of the chosen subgroup before your opponent does.</p>
            <h3 style={{ color: "var(--cyan)", marginTop: "1rem" }}>Turns</h3>
            <p>
              You and the AI strictly alternate turns. You play one card per turn.
              If you're mid-collection and play a card from a different coset, your coset collection is discarded and the turn passes to the AI.
              The turn indicator at the top right shows whose move it is.
            </p>
            <h3 style={{ color: "var(--cyan)", marginTop: "1rem" }}>Deadlock</h3>
            <p>
              If neither player can complete any coset with their current cards, all unscored cards are reshuffled, and redistributed automatically.
            </p>
            <h3 style={{ color: "var(--cyan)", marginTop: "1rem" }}>Difficulty</h3>
            <p>
              <strong style={{ color: "var(--green)" }}>Easy</strong> — AI plays randomly and sometimes deliberately mis-plays.<br />
              <strong style={{ color: "var(--gold)" }}>Medium</strong> — AI plays strategically 60% of the time.<br />
              <strong style={{ color: "var(--red)" }}>Hard</strong> — AI always plays optimally, never mis-plays.
            </p>
            <h3 style={{ color: "var(--cyan)", marginTop: "1rem" }}>How To Play</h3>
            <ul>
              <li>Pick a subgroup H from the selector at the top.</li>
              <li>Click cards from your hand, each card is color-coded by coset.</li>
              <li>Collect all elements of a single coset to score a point.</li>
              <li>Playing the wrong-coset card discards your collection and passes the turn.</li>
              <li>Most complete cosets wins.</li>
            </ul>
            <h3 style={{ color: "var(--cyan)", marginTop: "1rem" }}>Group Theory Connection</h3>
            <p>A coset of H in G is gH = &#123; g★h : h ∈ H &#125;. By Lagrange's theorem the cosets partition G into equal-sized parts: |G| = |H| × (number of cosets).</p>
          </div>
        </div>
      </div>
    )}
    </>
  )
}