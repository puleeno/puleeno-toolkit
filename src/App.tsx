import { useState } from "react";
import Timer from "./Timer";
import KeepShare from "./KeepShare";
import TuycoDownload from "./TuycoDownload";

type Screen = "home" | "timer" | "keepshare" | "tuyco" | "coming2";

interface Tile {
  id: Screen | "coming1" | "coming2";
  name: string;
  description: string;
  icon: string;
  color: string;
  size: "normal" | "wide";
}

const TILES: Tile[] = [
  {
    id: "timer",
    name: "Timer",
    description: "Pomodoro & countdown",
    icon: "⏱",
    color: "#0078d4",
    size: "wide",
  },
  {
    id: "keepshare",
    name: "KeepShare",
    description: "Magnet link generator",
    icon: "🔗",
    color: "#e81123",
    size: "normal",
  },
  {
    id: "tuyco",
    name: "Tuyco Download",
    description: "Send links to Tuyco downloader",
    icon: "🖼",
    color: "#d29922",
    size: "normal",
  },
  {
    id: "coming2",
    name: "Coming Soon",
    description: "More tools...",
    icon: "✨",
    color: "#8764b8",
    size: "normal",
  },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  const handleTileClick = (id: Screen) => {
    if (id === "coming2") return;
    setScreen(id);
  };

  const renderScreen = () => {
    switch (screen) {
      case "timer":
        return <Timer onBack={() => setScreen("home")} />;
      case "keepshare":
        return <KeepShare onBack={() => setScreen("home")} />;
      case "tuyco":
        return <TuycoDownload onBack={() => setScreen("home")} />;
      default:
        return renderHome();
    }
  };

  const renderHome = () => (
    <>
      <header className="header">
        <h1>Puleeno Toolkit</h1>
      </header>

      <div className="tiles-grid">
        {TILES.map((tile) => (
          <button
            key={tile.id}
            className={`tile tile-${tile.size}`}
            onClick={() => handleTileClick(tile.id as Screen)}
            style={{ backgroundColor: tile.color } as React.CSSProperties}
          >
            <span className="tile-icon">{tile.icon}</span>
            <div className="tile-text">
              <span className="tile-name">{tile.name}</span>
              <span className="tile-desc">{tile.description}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );

  return <div className="app">{renderScreen()}</div>;
}
