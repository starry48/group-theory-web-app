import { useState } from "react"
import HomeScreen from "./components/homescreen"
import Sidebar from "./components/sidebar"
import MathPanel from "./components/mathpanel"
import SETGame from "./games/setGame"
import PermutationDuel from "./games/permutatuionduel"
import CosetCapture from "./games/cosetcapture"
import NimGame from "./games/nim"
import "./index.css"

export default function App() {
  const [currentMode, setCurrentMode] = useState(null)
  const [showMathPanel, setShowMathPanel] = useState(false)
  const [sidebarInfo, setSidebarInfo] = useState({})

  const handleHome = () => { setCurrentMode(null); setSidebarInfo({}) }

  const renderGame = () => {
    const props = { onSidebarUpdate: setSidebarInfo }
    switch (currentMode) {
      case "SET":             return <SETGame {...props} />
      case "PermutationDuel": return <PermutationDuel {...props} />
      case "CosetCapture":    return <CosetCapture {...props} />
      case "Nim":             return <NimGame {...props} />
      default:                return null
    }
  }

  const modeLabels = {
    SET: "SET — ℤ₃⁴",
    PermutationDuel: "Permutation Duel — S₄",
    CosetCapture: "Coset Capture — ℤ₁₂ / D₄",
    Nim: "Nim — (ℤ₂)ⁿ"
  }

  if (currentMode === null) return <HomeScreen onSelectMode={setCurrentMode} />

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.75rem 1.5rem", background: "var(--bg2)",
        borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100
      }}>
        <button onClick={handleHome} style={{
          background: "transparent", color: "var(--text2)", fontSize: "0.9rem",
          fontFamily: "var(--font-mono)", padding: "0.4rem 0.8rem",
          border: "1px solid var(--border)", borderRadius: "6px"
        }}>← Home</button>
        <span style={{ fontFamily: "var(--font-display)", color: "var(--gold)", fontSize: "1.1rem" }}>
          {modeLabels[currentMode]}
        </span>
        <button onClick={() => setShowMathPanel(true)} style={{
          background: "transparent", color: "var(--cyan)", fontSize: "0.9rem",
          fontFamily: "var(--font-mono)", padding: "0.4rem 0.8rem",
          border: "1px solid var(--cyan)", borderRadius: "6px"
        }}>∑ Math Reference</button>
      </nav>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>{renderGame()}</main>
        <Sidebar mode={currentMode} extraInfo={sidebarInfo} />
      </div>
      {showMathPanel && <MathPanel onClose={() => setShowMathPanel(false)} />}
    </div>
  )}