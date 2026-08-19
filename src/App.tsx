import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

type TimerStatus = "idle" | "running" | "paused" | "finished";

interface Preset {
  label: string;
  minutes: number;
}

const PRESETS: Preset[] = [
  { label: "1 min", minutes: 1 },
  { label: "3 min", minutes: 3 },
  { label: "5 min", minutes: 5 },
  { label: "10 min", minutes: 10 },
  { label: "15 min", minutes: 15 },
  { label: "25 min (Pomodoro)", minutes: 25 },
  { label: "5 min (Break)", minutes: 5 },
];

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function App() {
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [totalSeconds, setTotalSeconds] = useState(5 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(5 * 60);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [customSeconds, setCustomSeconds] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const playAlarmSound = useCallback(async () => {
    if (!soundEnabled) return;

    let originalVolume = 50;
    try {
      originalVolume = await invoke<number>("lower_volume_for_alarm");
    } catch {}

    const audioCtx = new AudioContext();
    const playBeep = (freq: number, startTime: number, duration: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = freq;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.5, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    for (let i = 0; i < 3; i++) {
      playBeep(880, now + i * 0.3, 0.2);
      playBeep(1100, now + i * 0.3 + 0.15, 0.15);
    }

    setTimeout(() => {
      invoke("restore_volume", { volume: originalVolume }).catch(() => {});
    }, 1200);
  }, [soundEnabled]);

  const sendNotification = useCallback(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Time's up!", {
        body: "Your timer has finished. Ready for the next session?",
        icon: "/vite.svg",
      });
    }
    invoke("show_notification", {
      title: "Time's up!",
      body: "Your timer has finished.",
    }).catch(() => {});
  }, []);

  const handleTimerEnd = useCallback(() => {
    clearTimer();
    setStatus("finished");
    setSessionCount((c) => c + 1);
    playAlarmSound();
    sendNotification();
  }, [clearTimer, playAlarmSound, sendNotification]);

  const startTimer = useCallback(() => {
    clearTimer();
    setStatus("running");
    intervalRef.current = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          handleTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer, handleTimerEnd]);

  const pauseTimer = useCallback(() => {
    clearTimer();
    setStatus("paused");
  }, [clearTimer]);

  const resumeTimer = useCallback(() => {
    startTimer();
  }, [startTimer]);

  const resetTimer = useCallback(() => {
    clearTimer();
    setStatus("idle");
    setRemainingSeconds(totalSeconds);
  }, [clearTimer, totalSeconds]);

  const applyCustomTime = useCallback(() => {
    const total = customMinutes * 60 + customSeconds;
    if (total > 0) {
      clearTimer();
      setTotalSeconds(total);
      setRemainingSeconds(total);
      setStatus("idle");
    }
  }, [customMinutes, customSeconds, clearTimer]);

  const applyPreset = useCallback(
    (minutes: number) => {
      clearTimer();
      const total = minutes * 60;
      setTotalSeconds(total);
      setRemainingSeconds(total);
      setCustomMinutes(minutes);
      setCustomSeconds(0);
      setStatus("idle");
    },
    [clearTimer]
  );

  const continueTimer = useCallback(() => {
    setRemainingSeconds(totalSeconds);
    setStatus("idle");
  }, [totalSeconds]);

  const snoozeTimer = useCallback(() => {
    setRemainingSeconds(totalSeconds);
    startTimer();
  }, [totalSeconds, startTimer]);

  const progress = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="app">
      <header className="header">
        <h1>Timer</h1>
        {sessionCount > 0 && (
          <span className="session-badge">Session #{sessionCount}</span>
        )}
      </header>

      <div className="timer-container">
        <svg className="timer-ring" viewBox="0 0 260 260">
          <circle
            className="ring-bg"
            cx="130"
            cy="130"
            r="120"
            fill="none"
            strokeWidth="8"
          />
          <circle
            className="ring-progress"
            cx="130"
            cy="130"
            r="120"
            fill="none"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 130 130)"
          />
        </svg>
        <div className="timer-display">
          <span className={`time-text ${status === "finished" ? "finished" : ""}`}>
            {formatTime(remainingSeconds)}
          </span>
          <span className="status-text">{status.toUpperCase()}</span>
        </div>
      </div>

      <div className="controls">
        {status === "idle" && (
          <button className="btn btn-primary" onClick={startTimer}>
            Start
          </button>
        )}
        {status === "running" && (
          <button className="btn btn-warning" onClick={pauseTimer}>
            Pause
          </button>
        )}
        {status === "paused" && (
          <button className="btn btn-primary" onClick={resumeTimer}>
            Resume
          </button>
        )}
        {status === "finished" && (
          <>
            <button className="btn btn-primary" onClick={snoozeTimer}>
              Snooze
            </button>
            <button className="btn btn-secondary" onClick={continueTimer}>
              Reset
            </button>
          </>
        )}
        {(status === "running" || status === "paused") && (
          <button className="btn btn-secondary" onClick={resetTimer}>
            Reset
          </button>
        )}
      </div>

      <div className="settings">
        <h2>Settings</h2>

        <div className="setting-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
            />
            Sound Alerts
          </label>
        </div>

        <div className="presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              className={`btn btn-preset ${
                totalSeconds === preset.minutes * 60 ? "active" : ""
              }`}
              onClick={() => applyPreset(preset.minutes)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="custom-time">
          <label>Custom:</label>
          <input
            type="number"
            min="0"
            max="180"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Number(e.target.value))}
          />
          <span>m</span>
          <input
            type="number"
            min="0"
            max="59"
            value={customSeconds}
            onChange={(e) => setCustomSeconds(Number(e.target.value))}
          />
          <span>s</span>
          <button className="btn btn-small" onClick={applyCustomTime}>
            Set
          </button>
        </div>
      </div>
    </div>
  );
}
