import { useState } from "react";
import Timer from "./Timer";
import KeepShare from "./KeepShare";

type Tab = "timer" | "keepshare";

const TABS: { id: Tab; label: string }[] = [
  { id: "timer", label: "Timer" },
  { id: "keepshare", label: "KeepShare" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("timer");

  return (
    <div className="app">
      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="tab-content">
        {activeTab === "timer" && <Timer />}
        {activeTab === "keepshare" && <KeepShare />}
      </div>
    </div>
  );
}
