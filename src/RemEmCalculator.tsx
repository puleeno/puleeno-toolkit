import { useState, useEffect, useMemo, useRef } from "react";

const STORAGE_KEY_ENTRIES = "remem_entries";

interface Entry {
  id: number;
  px: number | "";
  base: number;
}

interface BaseGroup {
  base: number;
  entries: (Entry & { ratio: number })[];
}

function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENTRIES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((e: any) => ({
      id: Number(e.id) || Date.now(),
      px: e.px === "" ? "" : Number(e.px) || "",
      base: Number(e.base) || 16,
    }));
  } catch {
    return [];
  }
}

export default function RemEmCalculator({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<Entry[]>(loadEntries);
  const [formPx, setFormPx] = useState<number | "">("");
  const [formBase, setFormBase] = useState<number | "">("");
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
  }, [entries]);

  const effectiveBase = formBase === "" ? 16 : Number(formBase) || 16;

  const addEntry = () => {
    const px = formPx === "" ? "" : Number(formPx);
    if (px === "" || px <= 0) return;

    setEntries((prev) => [
      ...prev,
      { id: Date.now(), px, base: effectiveBase },
    ]);
    setFormPx("");
  };

  const removeEntry = (id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEntryPx = (id: number, newPx: number | "") => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, px: newPx } : e))
    );
  };

  const updateEntryBase = (id: number, newBase: number) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, base: newBase } : e))
    );
  };

  const groups: BaseGroup[] = useMemo(() => {
    const withRatio = entries.map((e) => ({
      ...e,
      ratio: e.px !== "" && e.base > 0 ? Number(e.px) / e.base : 0,
    }));

    const sorted = [...withRatio].sort((a, b) => a.base - b.base);

    const map = new Map<number, BaseGroup>();
    for (const entry of sorted) {
      const existing = map.get(entry.base);
      if (existing) {
        existing.entries.push(entry);
      } else {
        map.set(entry.base, { base: entry.base, entries: [entry] });
      }
    }

    return Array.from(map.values());
  }, [entries]);

  const formatRatio = (ratio: number): string => {
    const rounded = Math.round(ratio * 100) / 100;
    if (rounded === Math.floor(rounded)) return `${rounded}`;
    return String(rounded);
  };

  const copyRatio = async (entry: Entry & { ratio: number }) => {
    if (entry.px === "") return;
    const value = formatRatio(entry.ratio);
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const copyCss = async () => {
    if (entries.length === 0) return;

    const lines = [":root {"];
    for (const group of groups) {
      lines.push(`  /* ${group.base}px base */`);
      for (const entry of group.entries) {
        if (entry.px === "") continue;
        const ratio = entry.px / entry.base;
        const value = formatRatio(ratio);
        lines.push(`  /* ${entry.px}px */ ${value};`);
      }
    }
    lines.push("}");

    const css = lines.join("\n");

    try {
      await navigator.clipboard.writeText(css);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = css;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportJson = () => {
    const data = JSON.stringify(entries, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "remem-values.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!Array.isArray(parsed)) return;
        const valid = parsed
          .filter((item: any) => item && typeof item.px === "number" && typeof item.base === "number")
          .map((item: any) => ({
            id: Date.now() + Math.random(),
            px: item.px,
            base: item.base,
          }));
        if (valid.length > 0) setEntries((prev) => [...prev, ...valid]);
      } catch {}
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addEntry();
  };

  return (
    <div className="remem-container">
      <header className="header">
        <button className="btn-back" onClick={onBack}>
          ←
        </button>
        <h1>REM / EM Calculator</h1>
      </header>

      <div className="remem-form">
        <div className="remem-add-form">
          <div className="remem-form-row">
            <div className="form-group remem-field-px">
              <label>Px</label>
              <input
                type="number"
                min={0}
                step="any"
                placeholder="40"
                value={formPx}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormPx(v === "" ? "" : Number(v));
                }}
                onKeyDown={handleKeyDown}
                className="input"
              />
            </div>
            <div className="form-group remem-field-base">
              <label>Base</label>
              <input
                type="number"
                min={1}
                placeholder="16"
                value={formBase}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormBase(v === "" ? "" : Number(v));
                }}
                onKeyDown={handleKeyDown}
                className="input"
              />
            </div>
            <button
              className="btn btn-primary remem-btn-add"
              onClick={addEntry}
              disabled={formPx === "" || Number(formPx) <= 0}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="remem-actions">
          <button className="btn btn-small btn-secondary" onClick={exportJson}>
            Export
          </button>
          <button
            className="btn btn-small btn-secondary"
            onClick={() => fileRef.current?.click()}
          >
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={importJson}
            className="remem-file-input"
          />
          <button
            className={`btn btn-small ${copied ? "btn-success" : "btn-secondary"}`}
            onClick={copyCss}
          >
            {copied ? "Copied!" : "Copy CSS"}
          </button>
        </div>
      )}

      <div className="remem-results">
        {groups.length === 0 && (
          <div className="remem-empty">
            Add values above to see calculated ratios
          </div>
        )}

        {groups.map((group) => (
          <div key={group.base} className="remem-group">
            <div className="remem-group-header">
              <span className="remem-group-base">{group.base}px</span>
              <span className="remem-group-label">Base</span>
            </div>

            <div className="remem-group-entries">
              {group.entries.map((entry) => (
                <div key={entry.id} className="remem-entry">
                  <div className="remem-entry-values">
                    <input
                      type="number"
                      className="remem-entry-px-input"
                      value={entry.px}
                      min={0}
                      step="any"
                      onChange={(e) => {
                        const v = e.target.value;
                        updateEntryPx(entry.id, v === "" ? "" : Number(v));
                      }}
                    />
                    <span className="remem-entry-unit">px</span>
                    <span className="remem-entry-sep">/</span>
                    <span className="remem-entry-base-value">
                      {entry.base}px
                    </span>
                  </div>

                  <div className="remem-entry-result">
                    <span className="remem-entry-arrow">→</span>
                    <button
                      className={`remem-entry-ratio ${copiedId === entry.id ? "remem-entry-ratio--copied" : ""}`}
                      onClick={() => copyRatio(entry)}
                      title="Click to copy"
                    >
                      {entry.px !== "" ? `${formatRatio(entry.ratio)}rem` : "—"}
                    </button>
                    <button
                      className="remem-entry-delete"
                      onClick={() => removeEntry(entry.id)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
