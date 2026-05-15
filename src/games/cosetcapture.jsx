import { useState, useEffect, useCallback } from "react"
import { z12Add, z12Subgroup, d4Mult, d4Subgroups, D4_ELEMENTS, cosetPart } from "../utils/mathOfGroup.js"

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

export default function CosetCapture({ onSidebarUpdate }) {
  const [groupMode, setGroupMode] = useState("Z12")
  const [subgroupIndex, setSubgroupIndex] = useState(0)
  const [cosets, setCosets] = useState([])
  const [playerHand, setPlayerHand] = useState([])
  const [opponentHand, setOpponentHand] = useState([])
  const [playerCollecting, setPlayerCollecting] = useState([])
  const [opponentCollecting, setOpponentCollecting] = useState([])
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [message, setMessage] = useState("")
  const [gameOver, setGameOver] = useState(false)
  const [cosetMap, setCosetMap] = useState({})

  const getConfig = useCallback(() => {
    if (groupMode === "Z12") {
      const subgroups = [
        { label: "{0, 6}", elements: z12Subgroup(2) },
        { label: "{0, 4, 8}", elements: z12Subgroup(3) },
        { label: "{0, 3, 6, 9}", elements: z12Subgroup(4) },
        { label: "{0, 2, 4, 6, 8, 10}", elements: z12Subgroup(6) },
      ]
      return {
        elements: Z12_ELEMENTS,
        op: z12Add,
        subgroups,
        label: e => String(e)
      }
    } else {
      const subs = d4Subgroups()
      const subgroups = subs.map(s => ({ label: "{" + s.join(", ") + "}", elements: s }))
      return {
        elements: D4_ELEMENTS,
        op: d4Multiply,
        subgroups,
        label: e => e
      }
    }
  }, [groupMode])

  const init = useCallback(() => {
    const config = getConfig()
    const subgroup = config.subgroups[subgroupIndex]?.elements || config.subgroups[0].elements
    const cs = cosetPartition(config.elements, subgroup, config.op)
    setCosets(cs)

    // build a map: element → coset index
    const map = {}
    cs.forEach((c, i) => c.forEach(e => { map[String(e)] = i }))
    setCosetMap(map)

    // deal cards
    const allCards = shuffle(config.elements.map(e => ({ value: e, label: config.label(e) })))
    const mid = Math.floor(allCards.length / 2)
    setPlayerHand(allCards.slice(0, mid))
    setOpponentHand(allCards.slice(mid))
    setPlayerCollecting([])
    setOpponentCollecting([])
    setPlayerScore(0)
    setOpponentScore(0)
    setGameOver(false)
    setMessage("Collect cards from the same coset to score! Click a card to play it.")

    onSidebarUpdate({
      group: groupMode,
      subgroup,
      cosets: cs,
      lagrange: `${config.elements.length} = ${subgroup.length} × ${cs.length}`
    })
  }, [groupMode, subgroupIndex, getConfig])

  useEffect(() => { init() }, [init])

  const checkCosetComplete = (collecting, cosets) => {
    for (let i = 0; i < cosets.length; i++) {
      const coset = cosets[i]
      if (coset.length === collecting.filter(c => cosetMap[String(c.value)] === i).length) {
        const inThisCoset = collecting.filter(c => cosetMap[String(c.value)] === i)
        if (inThisCoset.length === coset.length && inThisCoset.length === collecting.length) {
          return i
        }
      }
    }
    // simpler check: all cards in collecting share same coset index
    if (collecting.length === 0) return -1
    const idx = cosetMap[String(collecting[0].value)]
    const allSame = collecting.every(c => cosetMap[String(c.value)] === idx)
    if (allSame && collecting.length === cosets[idx]?.length) return idx
    return -1
  }

  const handlePlayCard = (card, idx) => {
    if (gameOver) return
    const cosetIdx = cosetMap[String(card.value)]
    const newCollecting = [...playerCollecting, card]
    const newHand = playerHand.filter((_, i) => i !== idx)
    setPlayerHand(newHand)

    // check if all cards in newCollecting are in same coset
    const allSameCoset = newCollecting.every(c => cosetMap[String(c.value)] === cosetIdx)
    if (!allSameCoset) {
      setMessage("Those cards don't share a coset — collecting discarded.")
      setPlayerCollecting([])
      // AI takes a turn
      aiTurn(newHand, opponentHand)
      return
    }

    if (newCollecting.length === cosets[cosetIdx]?.length) {
      const newScore = playerScore + 1
      setPlayerScore(newScore)
      setPlayerCollecting([])
      setMessage(`✓ Coset collected! Score: ${newScore}`)
      if (newHand.length === 0 && opponentHand.length === 0) {
        endGame(newScore, opponentScore)
        return
      }
    } else {
      setPlayerCollecting(newCollecting)
      setMessage(`Collecting coset ${cosetIdx} (${newCollecting.length}/${cosets[cosetIdx]?.length || "?"}). Keep going or switch.`)
    }

    aiTurn(newHand, opponentHand)
  }

  const aiTurn = useCallback((pHand, oHand) => {
    if (oHand.length === 0) return
    setTimeout(() => {
      // AI plays first card from hand
      const card = oHand[0]
      const cosetIdx = cosetMap[String(card.value)]
      const newOHand = oHand.slice(1)
      setOpponentHand(newOHand)
      const newOCollecting = [...opponentCollecting, card]
      const allSame = newOCollecting.every(c => cosetMap[String(c.value)] === cosetIdx)
      if (!allSame) {
        setOpponentCollecting([])
        return
      }
      if (newOCollecting.length === cosets[cosetIdx]?.length) {
        const newScore = opponentScore + 1
        setOpponentScore(newScore)
        setOpponentCollecting([])
        if (pHand.length === 0 && newOHand.length === 0) {
          endGame(playerScore, newScore)
        }
      } else {
        setOpponentCollecting(newOCollecting)
      }
    }, 600)
  }, [cosetMap, cosets, opponentCollecting, opponentScore, playerScore])

  const endGame = (pScore, oScore) => {
    setGameOver(true)
    if (pScore > oScore) setMessage(`🎉 You win! ${pScore} cosets to ${oScore}.`)
    else if (oScore > pScore) setMessage(`AI wins! ${oScore} cosets to ${pScore}.`)
    else setMessage(`It's a tie! ${pScore} cosets each.`)
  }

  const config = getConfig()
  const subgroupOptions = config.subgroups

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "var(--text)" }}>Coset Capture</h2>
          <p style={{ color: "var(--text2)", fontSize: "0.9rem" }}>Collect complete cosets of the subgroup</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => setGroupMode(m => m === "Z12" ? "D4" : "Z12")} style={{
            background: "var(--bg3)", color: "var(--cyan)", border: "1px solid var(--cyan)",
            borderRadius: "8px", padding: "0.4rem 0.8rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem"
          }}>Switch to {groupMode === "Z12" ? "D₄" : "ℤ₁₂"}</button>
          <button onClick={init} style={{
            background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border)",
            borderRadius: "8px", padding: "0.4rem 0.8rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem"
          }}>New Game</button>
        </div>
      </div>

      {/* Subgroup selector */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--text2)", fontSize: "0.7rem", marginBottom: "0.4rem" }}>SUBGROUP H</div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {subgroupOptions.map((sg, i) => (
            <button key={i} onClick={() => { setSubgroupIndex(i) }} style={{
              background: subgroupIndex === i ? "var(--green)" : "var(--bg3)",
              color: subgroupIndex === i ? "#000" : "var(--text2)",
              border: "1px solid var(--border)", borderRadius: "6px",
              padding: "0.3rem 0.6rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem"
            }}>{sg.label}</button>
          ))}
        </div>
      </div>

      {/* Coset partition visualization */}
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

      {/* Scores */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        {[["You", playerScore, "var(--gold)"], ["AI", opponentScore, "var(--text2)"]].map(([name, score, color]) => (
          <div key={name} style={{
            flex: 1, background: "var(--bg3)", border: `1px solid var(--border)`,
            borderRadius: "8px", padding: "0.6rem 1rem", textAlign: "center"
          }}>
            <div style={{ fontFamily: "var(--font-mono)", color, fontSize: "0.75rem" }}>{name}</div>
            <div style={{ fontFamily: "var(--font-display)", color, fontSize: "1.5rem" }}>{score}</div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div style={{
        padding: "0.6rem 1rem", background: "var(--bg3)", borderRadius: "8px", marginBottom: "1.25rem",
        border: `1px solid ${gameOver ? "var(--gold)" : "var(--border)"}`,
        fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text)"
      }}>{message}</div>

      {/* Currently collecting */}
      {playerCollecting.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontFamily: "var(--font-mono)", color: "var(--gold)", fontSize: "0.7rem", marginBottom: "0.4rem" }}>
            COLLECTING ({playerCollecting.length}/{cosets[cosetMap[String(playerCollecting[0]?.value)]]?.length || "?"})
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
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--gold)", fontSize: "0.7rem", marginBottom: "0.5rem" }}>
          YOUR HAND — click to play
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {playerHand.map((card, i) => {
            const cosetIdx = cosetMap[String(card.value)]
            const color = COSET_COLORS[cosetIdx % COSET_COLORS.length]
            return (
              <div
                key={i}
                onClick={() => handlePlayCard(card, i)}
                style={{
                  background: "var(--card-bg)", border: `2px solid ${color}`,
                  borderRadius: "8px", padding: "0.5rem 0.75rem",
                  cursor: "pointer", transition: "all 0.15s",
                  fontFamily: "var(--font-mono)", fontSize: "1rem",
                  color, minWidth: "44px", textAlign: "center"
                }}
              >
                {card.label}
              </div>
            )
          })}
          {playerHand.length === 0 && (
            <div style={{ color: "var(--text2)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>No cards left.</div>
          )}
        </div>
      </div>
    </div>
  )
}