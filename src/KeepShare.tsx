import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

const STORAGE_KEY = "keepshare_channel_id";

function encodeMagnet(url: string): string {
  const trimmed = url.trim();
  return encodeURIComponent(trimmed);
}

export default function KeepShare({ onBack }: { onBack: () => void }) {
  const [channelId, setChannelId] = useState("");
  const [magnetInput, setMagnetInput] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setChannelId(saved || "16b6v173");
  }, []);

  const saveChannelId = (id: string) => {
    setChannelId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const generate = () => {
    const id = channelId.trim();
    const magnet = magnetInput.trim();
    if (!id || !magnet) return;

    const encoded = encodeMagnet(magnet);
    const url = `https://keepshare.org/${id}/${encoded}`;
    setGeneratedUrl(url);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = generatedUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const extractHash = (input: string): string => {
    const trimmed = input.trim();
    const match = trimmed.match(/btih:([a-fA-F0-9]{40})/i);
    if (match) return match[1].toLowerCase();
    if (/^[a-fA-F0-9]{40}$/i.test(trimmed)) return trimmed.toLowerCase();
    return "";
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (text && !text.startsWith("magnet:")) {
      e.preventDefault();
      const hash = extractHash(text);
      if (hash) {
        setMagnetInput(`magnet:?xt=urn:btih:${hash}`);
      } else {
        setMagnetInput(text);
      }
    }
  };

  return (
    <div className="keepshare">
      <header className="header">
        <button className="btn-back" onClick={onBack}>←</button>
        <h1>KeepShare Generator</h1>
      </header>

      <div className="keepshare-form">
        <div className="form-group">
          <label>Channel ID</label>
          <input
            type="text"
            placeholder="e.g. 16b6v173"
            value={channelId}
            onChange={(e) => saveChannelId(e.target.value)}
            className="input"
          />
          <span className="hint">
            Get from keepshare.org/console
          </span>
        </div>

        <div className="form-group">
          <label>Magnet URL / Info Hash</label>
          <input
            type="text"
            placeholder="magnet:?xt=urn:btih:... or 40-char hash"
            value={magnetInput}
            onChange={(e) => setMagnetInput(e.target.value)}
            onPaste={handlePaste}
            className="input"
          />
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={generate}
          disabled={!channelId.trim() || !magnetInput.trim()}
        >
          Generate Link
        </button>

        {generatedUrl && (
          <div className="result">
            <label>Generated URL</label>
            <div className="result-row">
              <input
                type="text"
                readOnly
                value={generatedUrl}
                className="input result-input"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className={`btn btn-small ${copied ? "btn-success" : "btn-primary"}`}
                onClick={copyToClipboard}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                className="btn btn-small btn-open"
                onClick={() => invoke("open_url", { url: generatedUrl })}
              >
                Open
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
