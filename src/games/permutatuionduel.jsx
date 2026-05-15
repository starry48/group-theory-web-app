import { useState, useEffect, useCallback } from "react"
import {
  generateS4,
  composePerm,
  cycleNotation,
  orderofPerm,
  permAreEqual,
  randoTargetPerm
} from "../utils/permutation.js"

const IDENTITY = [0, 1, 2, 3]
const SUIT_LABELS = ["♠", "♥", "♦", "♣"]
const SUIT_COLORS = ["var(--text)","var(--red)","var(--cyan)","var(--green)"]

function PermCard({ perm, onClick, selected, label }) {
  const notation = cycleNotation(perm)
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? "var(--bg3)" : "var(--card-bg)",
        border: `2px solid ${
          selected ? "var(--gold)" : "var(--border)"
        }`,
        borderRadius: "10px",
        padding: "0.75rem",
        cursor: onClick ? "pointer" : "default",
        minWidth: "90px",
        textAlign: "center",
        transition: "all 0.15s",
        transform: selected ? "scale(1.05)" : "scale(1)",
        boxShadow: selected ? "0 0 12px var(--gold)44" : "none"
      }}
    >
      {label && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--text2)",
            fontSize: "0.65rem",
            marginBottom: "0.4rem"
          }}
        >
          {label}
        </div>
      )}

      {/* Arrow diagram */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "6px",
          marginBottom: "0.5rem"
        }}
      >
        {perm.map((to, from) => (
          <div
            key={from}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px"
            }}
          >
            <span
              style={{
                fontSize: "0.9rem",
                color: SUIT_COLORS[from]
              }}
            >
              {SUIT_LABELS[from]}
            </span>

            <span
              style={{
                fontSize: "0.6rem",
                color: "var(--text2)"
              }}
            >
              ↓
            </span>

            <span
              style={{
                fontSize: "0.9rem",
                color: SUIT_COLORS[to]
              }}
            >
              {SUIT_LABELS[to]}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--gold)",
          fontSize: "0.8rem"
        }}
      >
        {notation}
      </div>
    </div>
  )
}

export default function PermutationDuel({ onSidebarUpdate }) {
  const [allPerms] = useState(() => generateS4())
  const [playerHand, setPlayerHand] = useState([])
  const [opponentHand, setOpponentHand] = useState([])
  const [currentProduct, setCurrentProduct] = useState(IDENTITY)
  const [targetPerm, setTargetPerm] = useState(null)
  const [playedCards, setPlayedCards] = useState([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [message, setMessage] = useState("")
  const [turn, setTurn] = useState("player")
  const [showHelp, setShowHelp] = useState(true)
  const dealHands = useCallback((perms) => {
    const shuffled = [...perms].sort(() => Math.random() - 0.5)
    setPlayerHand(shuffled.slice(0, 5))
    setOpponentHand(shuffled.slice(5, 10))
  }, [])

  const drawMoreCards = useCallback(() => {
    const shuffled = [...allPerms].sort(() => Math.random() - 0.5)
    setPlayerHand(shuffled.slice(0, 4))
    setOpponentHand(shuffled.slice(4, 8))
    setMessage("No winner yet — new cards have been dealt!")
  }, [allPerms])

  const init = useCallback(() => {
    const target = randoTargetPerm(allPerms)
    setTargetPerm(target)
    dealHands(allPerms)
    setCurrentProduct(IDENTITY)
    setPlayedCards([])
    setGameOver(false)
    setWinner(null)
    setMessage("Play a card to compose permutations. Reach the target!")
    setTurn("player")}, [allPerms, dealHands])

  useEffect(() => {init()}, [init])

  useEffect(() => {
    onSidebarUpdate({
      currentProduct,
      targetPerm,
      productNotation: cycleNotation(currentProduct),
      order: orderofPerm(currentProduct)
    })}, [currentProduct, targetPerm, onSidebarUpdate])

  // AI turn
  useEffect(() => {
    if (turn !== "ai" || gameOver) return
    const timer = setTimeout(() => {
      if (opponentHand.length === 0) {
        setTurn("player")
        return
      }

      const idx = Math.floor(Math.random() * opponentHand.length)
      const card = opponentHand[idx]
      const newProduct = composePerm(currentProduct,card)
      const newHand = opponentHand.filter((_, i) => i !== idx)
      setOpponentHand(newHand)
      setCurrentProduct(newProduct)
      setPlayedCards((p) => [{perm: card,player: "ai",notation: cycleNotation(card)},...p])

      if (permAreEqual(newProduct, targetPerm)) {
        setGameOver(true)
        setWinner("ai")

        setMessage("AI reached the target first! Better luck next time.")
        return
      }
      setTurn("player")
      setMessage("Your turn — play a card.")
    }, 1000)
    return () => clearTimeout(timer)
  }, [turn,gameOver,opponentHand,currentProduct,targetPerm])
  // Auto deal more cards
  useEffect(() => {
    if (gameOver) return

    if (playerHand.length === 0 &&opponentHand.length === 0) {
      drawMoreCards()
    }
  }, [playerHand,opponentHand,gameOver,drawMoreCards])

  const handlePlayCard = (card, idx) => {
    if (turn !== "player" || gameOver) return
    const newProduct = composePerm(currentProduct,card)
    const newHand = playerHand.filter((_, i) => i !== idx)
    setPlayerHand(newHand)
    setCurrentProduct(newProduct)
    setPlayedCards((p) => [{perm: card,player: "you",notation: cycleNotation(card)},...p])

    if (permAreEqual(newProduct, targetPerm)) {
      setGameOver(true)
      setWinner("player")
      setMessage("🎉 You reached the target! You win!")
      return
    }
    setTurn("ai")
    setMessage("AI is thinking...")
  }

  return (
    <>
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto"
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem"
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.8rem",
                color: "var(--text)"
              }}
            >
              Permutation Duel
            </h2>

            <p
              style={{
                color: "var(--text2)",
                fontSize: "0.9rem"
              }}
            >
              Compose permutations to reach the target
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "center"
            }}
          >
            <button
              onClick={init}
              style={{
                background: "var(--bg3)",
                color: "var(--text2)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.4rem 0.8rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem"
              }}
            >
              New Game
            </button>

            <button
              onClick={() => setShowHelp(true)}
              style={{
                background: "var(--bg3)",
                color: "var(--cyan)",
                border: "1px solid var(--cyan)",
                borderRadius: "8px",
                padding: "0.4rem 0.8rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem"
              }}
            >
              Rules + Symbols
            </button>
          </div>
        </div>

        {/* Target + Current */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}
        >
          <div
            style={{
              background: "var(--bg3)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "1rem",
              textAlign: "center"
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text2)",
                fontSize: "0.7rem",
                marginBottom: "0.75rem"
              }}
            >
              TARGET
            </div>

            {targetPerm && (
              <PermCard perm={targetPerm} />
            )}
          </div>

          <div
            style={{
              background: "var(--bg3)",
              border: "1px solid var(--gold)",
              borderRadius: "10px",
              padding: "1rem",
              textAlign: "center"
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text2)",
                fontSize: "0.7rem",
                marginBottom: "0.75rem"
              }}
            >
              CURRENT PRODUCT
            </div>

            <PermCard perm={currentProduct} />
          </div>
        </div>

        {/* Status */}
        <div
          style={{
            padding: "0.6rem 1rem",
            background: "var(--bg3)",
            borderRadius: "8px",
            marginBottom: "1.25rem",
            border: `1px solid ${
              gameOver
                ? winner === "player"
                  ? "var(--green)"
                  : "var(--red)"
                : "var(--border)"
            }`,
            fontFamily: "var(--font-mono)",
            fontSize: "0.9rem",
            color: gameOver
              ? winner === "player"
                ? "var(--green)"
                : "var(--red)"
              : "var(--text)"
          }}
        >
          {message}
        </div>

        {/* Opponent hand */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text2)",
              fontSize: "0.7rem",
              marginBottom: "0.5rem"
            }}
          >
            OPPONENT'S HAND ({opponentHand.length} cards)
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap"
            }}
          >
            {opponentHand.map((_, i) => (
              <div
                key={i}
                style={{
                  width: "90px",
                  height: "80px",
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text2)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.2rem"
                }}
              >
                ?
              </div>
            ))}
          </div>
        </div>

        {/* Played cards */}
        {playedCards.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text2)",
                fontSize: "0.7rem",
                marginBottom: "0.5rem"
              }}
            >
              LAST PLAYED
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap"
              }}
            >
              {playedCards.slice(0, 5).map((entry, i) => (
                <PermCard
                  key={i}
                  perm={entry.perm}
                  label={
                    entry.player === "you"
                      ? "You"
                      : "AI"
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Player hand */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--gold)",
              fontSize: "0.7rem",
              marginBottom: "0.5rem"
            }}
          >
            YOUR HAND — click a card to play it
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap"
            }}
          >
            {playerHand.map((perm, i) => (
              <PermCard
                key={i}
                perm={perm}
                onClick={() =>
                  handlePlayCard(perm, i)
                }
              />
            ))}

            {playerHand.length === 0 && (
              <div
                style={{
                  color: "var(--text2)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem"
                }}
              >
                Waiting for more cards...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help Popup */}
      {showHelp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300
          }}
        >
          <div
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "1.5rem",
              width: "90%",
              maxWidth: "700px",
              maxHeight: "85vh",
              overflowY: "auto"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem"
              }}
            >
              <h2
                style={{
                  color: "var(--gold)",
                  fontFamily: "var(--font-display)"
                }}
              >
                Permutation Duel Guide
              </h2>

              <button
                onClick={() => setShowHelp(false)}
                style={{
                  background: "transparent",
                  color: "var(--text2)",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                color: "var(--text2)",
                lineHeight: 1.7
              }}
            >
              <p>
                A permutation rearranges objects.
                In this game, the suits are being
                shuffled.
              </p>

              <h3
                style={{
                  color: "var(--cyan)",
                  marginTop: "1rem"
                }}
              >
                Symbol Legend
              </h3>

              <p>
                ♠ = Position 1
                <br />
                ♥ = Position 2
                <br />
                ♦ = Position 3
                <br />
                ♣ = Position 4
              </p>

              <h3
                style={{
                  color: "var(--cyan)",
                  marginTop: "1rem"
                }}
              >
                How To Play
              </h3>

              <ul>
                <li>
                  Each card represents a
                  permutation.
                </li>

                <li>
                  Playing a card composes it
                  with the current permutation
                  product.
                </li>

                <li>
                  Your goal is to make the
                  current product match the
                  target permutation.
                </li>

                <li>
                  The AI is trying to reach
                  the target before you do.
                </li>

                <li>
                  If both players run out of
                  cards, new cards are dealt
                  automatically.
                </li>
              </ul>

              <h3
                style={{
                  color: "var(--cyan)",
                  marginTop: "1rem"
                }}
              >
                Group Theory Connection
              </h3>

              <p>
                The set of all permutations
                together with composition
                forms the symmetric group S₄.
                The game helps visualize
                permutation multiplication,
                identity elements, inverses,
                and composition order.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}