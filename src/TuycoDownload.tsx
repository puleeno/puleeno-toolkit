import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

const SERVER_KEY = "tuyco_server_url";
const DEFAULT_SERVER = "http://127.0.0.1:8710";

interface JobStatus {
  loaded: boolean;
  ok: boolean;
  message: string;
  jobId?: number;
}

export default function TuycoDownload({ onBack }: { onBack: () => void }) {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<JobStatus>({ loaded: false, ok: false, message: "" });

  useEffect(() => {
    const saved = localStorage.getItem(SERVER_KEY);
    if (saved) setServerUrl(saved);
  }, []);

  const saveServerUrl = (value: string) => {
    setServerUrl(value);
    localStorage.setItem(SERVER_KEY, value);
  };

  const send = async () => {
    const target = url.trim();
    if (!target) return;
    setSending(true);
    setStatus({ loaded: true, ok: false, message: "Sending to Tuyco…" });
    try {
      const res = await fetch(`${serverUrl.replace(/\/+$/, "")}/downloads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: target,
          ...(name.trim() ? { title: name.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({
          loaded: true,
          ok: false,
          message: `Tuyco error ${res.status}: ${data.error || res.statusText}`,
        });
        return;
      }
      setStatus({
        loaded: true,
        ok: true,
        message: `Queued as job #${data.job_id}`,
        jobId: data.job_id,
      });
      setName("");
      setUrl("");
    } catch (e) {
      setStatus({
        loaded: true,
        ok: false,
        message: `Cannot reach Tuyco at ${serverUrl}. Is it running?`,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="keepshare">
      <header className="header">
        <button className="btn-back" onClick={onBack}>←</button>
        <h1>Tuyco Download</h1>
      </header>

      <div className="keepshare-form">
        <div className="form-group">
          <label>Tuyco server</label>
          <input
            type="text"
            placeholder="http://127.0.0.1:8710"
            value={serverUrl}
            onChange={(e) => saveServerUrl(e.target.value)}
            className="input"
          />
          <span className="hint">Tuyco download manager endpoint</span>
        </div>

        <div className="form-group">
          <label>Name (optional)</label>
          <input
            type="text"
            placeholder="Album, video, post title…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
          <span className="hint">Used as the album / video name in Tuyco</span>
        </div>

        <div className="form-group">
          <label>Link to download</label>
          <input
            type="text"
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && send()}
            className="input"
          />
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={send}
          disabled={sending || !url.trim()}
        >
          {sending ? "Sending…" : "Send to Tuyco"}
        </button>

        {status.loaded && (
          <div className={`result ${status.ok ? "result-ok" : "result-err"}`}>
            <span>{status.message}</span>
            {status.jobId !== undefined && (
              <button
                className="btn btn-small btn-open"
                onClick={() => invoke("open_url", { url: serverUrl }).catch(() => {})}
              >
                Open Tuyco
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}