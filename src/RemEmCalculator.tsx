import { useState, useEffect, useMemo } from "react";

const STORAGE_KEY_ROOT = "remem_root_font_size";
const STORAGE_KEY_ENTRIES = "remem_entries";

interface Entry {
  id: number;
  name: string;
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
      name: String(e.name || ""),
      px: e.px === "" ? "" : Number(e.px) || "",
      base: Number(e.base) || 16,
    }));
  } catch {
    return [];
  }
}

export default function RemEmCalculator({ onBack }: { onBack: () => void }) {
  const [rootFontSize, setRootFontSize] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ROOT);
    return saved ? Number(saved) || 16 : 16;
  });
  const [entries, setEntries] = useState<Entry[]>(loadEntries);
  const [formName, setFormName] = useState("");
  const [formPx, setFormPx] = useState<number | "">("");
  const [formBase, setFormBase] = useState<number | "">("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROOT, String(rootFontSize));
  }, [rootFontSize]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
  }, [entries]);

  const effectiveBase =
    formBase === "" ? rootFontSize : Number(formBase) || rootFontSize;

  const addEntry = () => {
    const name = formName.trim();
    const px = formPx === "" ? "" : Number(formPx);
    if (!name || px === "" || px <= 0) return;

    const newEntry: Entry = {
      id: Date.now(),
      name,
      px,
      base: effectiveBase,
    };

    setEntries((prev) => [...prev, newEntry]);
    setFormName("");
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
    if (ratio === Math.floor(ratio)) return `${ratio}rem`;
    const str = ratio.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
    return `${str}rem`;
  };

  const toCssVarName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const copyCss = async () => {
    if (entries.length === 0) return;

    const lines = [":root {"];
    for (const group of groups) {
      lines.push(`  /* ${group.base}px base */`);
      for (const entry of group.entries) {
        if (entry.px === "") continue;
        const ratio = entry.px / entry.base;
        const varName = `--${toCssVarName(entry.name)}`;
        const value = formatRatio(ratio);
        const comment = `/* ${entry}px / ${entry.base}px base */`;
        lines.push(`  ${varName}: ${value}; ${comment}`);
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
        <div className="form-group">
          <label>Root Font Size</label>
          <div className="remem-root-input">
            <input
              type="number"
              min={1}
              value={rootFontSize}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v > 0) setRootFontSize(v);
              }}
              className="input remem-input-small"
            />
            <span className="remem-unit">px</span>
          </div>
        </div>

        <div className="remem-add-form">
          <div className="remem-form-row">
            <div className="form-group remem-field-name">
              <label>Name</label>
              <input
                type="text"
                placeholder="e.g. Line Height"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input"
              />
            </div>
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
                placeholder={String(rootFontSize)}
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
              disabled={
                !formName.trim() || formPx === "" || Number(formPx) <= 0
              }
            >
              +
            </button>
          </div>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="remem-actions">
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
              <span className="remem-group-base">{group.base}px Base</span>
              <span className="remem-group-count">
                {group.entries.length} value
                {group.entries.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="remem-group-entries">
              {group.entries.map((entry) => (
                <div key={entry.id} className="remem-entry">
                  <div className="remem-entry-info">
                    <span className="remem-entry-name">{entry.name}</span>
                    <div className="remem-entry-values">
                      <input
                        type="number"
                        className="remem-entry-px-input"
                        value={entry.px}
                        min={0}
                        step="any"
                        onChange={(e) => {
                          const v = e.target.value;
                          updateEntryPx(
                            entry.id,
                            v === "" ? "" : Number(v)
                          );
                        }}
                      />
                      <span className="remem-entry-unit">px</span>
                      <span className="remem-entry-sep">/</span>
                      <input
                        type="number"
                        className="remem-entry-base-input"
                        value={entry.base}
                        min={1}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (v > 0) updateEntryBase(entry.id, v);
                        }}
                      />
                      <span className="remem-entry-unit">px</span>
                    </div>
                  </div>

                  <div className="remem-entry-result">
                    <span className="remem-entry-arrow">→</span>
                    <span className="remem-entry-ratio">
                      {entry.px !== "" ? formatRatio(entry.ratio) : "—"}
                    </span>
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
