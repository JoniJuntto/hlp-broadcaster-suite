import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

interface EventRecord {
  id: string;
  type: string;
  timestamp: Date;
  data?: unknown;
  description: string;
}

function Dashboard() {
  const [status, setStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [volume, setVolume] = useState<number>(0.7);
  const [muted, setMuted] = useState<boolean>(false);
  const [connectedAt, setConnectedAt] = useState<Date | null>(null);
  const [eventCount, setEventCount] = useState<number>(0);
  const [soundsPlayed, setSoundsPlayed] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const apiBase = useMemo(() => {
    return "https://hlp-api.onrender.com";
  }, []);

  const addEvent = (type: string, description: string, data?: unknown) => {
    const event: EventRecord = {
      id: Date.now().toString(),
      type,
      timestamp: new Date(),
      data,
      description,
    };
    setEvents((prev) => [event, ...prev.slice(0, 99)]); // Keep last 100 events
    setEventCount((prev) => prev + 1);
  };

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "#22c55e";
      case "connecting":
        return "#f59e0b";
      case "disconnected":
        return "#f87171";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return "●";
      case "connecting":
        return "◐";
      case "disconnected":
        return "○";
    }
  };

  const formatUptime = useMemo(() => {
    return () => {
      if (!connectedAt) return "00:00:00";
      const diff = Date.now() - connectedAt.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };
  }, [connectedAt]);

  const [uptime, setUptime] = useState("00:00:00");

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(formatUptime());
    }, 1000);
    return () => clearInterval(interval);
  }, [formatUptime]);

  useEffect(() => {
    setStatus("connecting");
    addEvent("system", "Connecting to server...");

    const es = new EventSource(`${apiBase}/events`);

    es.onopen = () => {
      setStatus("connected");
      setConnectedAt(new Date());
      addEvent("connection", "Connected to server");
    };

    es.addEventListener("connected", () => {
      setStatus("connected");
      setConnectedAt(new Date());
      addEvent("connection", "Server connection established");
    });

    es.addEventListener("play-sound", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as { src: string; filename: string };
        addEvent("sound", `Playing: ${payload.filename}`, payload);
        setSoundsPlayed((prev) => prev + 1);

        if (!muted) {
          const audio = audioRef.current ?? new Audio();
          audioRef.current = audio;
          audio.volume = volume;
          audio.src = `${apiBase}${payload.src}`;
          audio.play().catch(() => {
            addEvent("error", `Failed to play: ${payload.filename}`);
          });
        }
      } catch {
        addEvent("error", "Failed to parse sound event");
      }
    });

    es.onerror = (e: Event) => {
      console.error("EventSource error", e);
      setStatus("connecting");
      addEvent("error", "Connection lost, attempting to reconnect...");
    };

    return () => {
      es.close();
      addEvent("system", "Disconnected from server");
    };
  }, [apiBase, volume, muted]);

  const clearHistory = () => {
    setEvents([]);
    setEventCount(0);
    setSoundsPlayed(0);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="title">
            <span className="title-icon">🎵</span>
            HLP Broadcaster Suite
          </h1>
          <div className="status-badge" style={{ color: getStatusColor() }}>
            <span className="status-icon">{getStatusIcon()}</span>
            {status}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="dashboard">
          <div className="controls-section">
            <div className="control-card">
              <h3>Audio Controls</h3>
              <div className="audio-controls">
                <div className="volume-control">
                  <label>Volume</label>
                  <div className="volume-slider-container">
                    <input
                      type="range"
                      className="volume-slider"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      disabled={muted}
                    />
                    <span className="volume-value">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                </div>
                <button
                  className={`mute-button ${muted ? "muted" : ""}`}
                  onClick={() => setMuted(!muted)}
                >
                  {muted ? "🔇" : "🔊"}
                </button>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{uptime}</div>
                <div className="stat-label">Uptime</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{eventCount}</div>
                <div className="stat-label">Total Events</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{soundsPlayed}</div>
                <div className="stat-label">Sounds Played</div>
              </div>
            </div>
          </div>

          <div className="events-section">
            <div className="events-header">
              <h3>Event History</h3>
              <button className="clear-button" onClick={clearHistory}>
                Clear History
              </button>
            </div>
            <div className="events-container">
              {events.length === 0 ? (
                <div className="no-events">No events yet...</div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className={`event-item event-${event.type}`}
                  >
                    <div className="event-time">
                      {event.timestamp.toLocaleTimeString()}
                    </div>
                    <div className="event-content">
                      <div className="event-type">{event.type}</div>
                      <div className="event-description">
                        {event.description}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <audio ref={audioRef} />
    </div>
  );
}

function VideoOverlay() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const muted = true;
  const volume = 1;
  const [visible, setVisible] = useState<boolean>(false);

  const apiBase = useMemo(() => {
    return "http://localhost:8787";
  }, []);

  useEffect(() => {
    const es = new EventSource(`${apiBase}/events`);

    const playVideo = (src: string) => {
      const el = videoRef.current ?? document.createElement("video");
      if (!videoRef.current) videoRef.current = el;
      // Reset any existing playback and source to avoid freezing last frame
      try {
        el.pause();
      } catch {
        /* noop */
      }
      el.removeAttribute("src");
      el.load();
      el.src = `${apiBase}${src}`;
      el.muted = muted;
      el.volume = volume;
      setVisible(true);
      el.play().catch(() => undefined);
    };

    es.onopen = () => undefined;
    es.addEventListener("connected", () => undefined);
    es.addEventListener("play-video", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as { src: string };
        playVideo(payload.src);
      } catch {
        /* noop */
      }
    });
    es.onerror = () => undefined;

    return () => es.close();
  }, [apiBase, muted, volume]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "transparent",
        overflow: "hidden",
      }}
    >
      <video
        ref={videoRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          opacity: visible ? 1 : 0,
          transition: "opacity 150ms ease-in-out",
        }}
        playsInline
        onEnded={() => {
          const el = videoRef.current;
          if (el) {
            try {
              el.pause();
            } catch {
              /* noop */
            }
            el.removeAttribute("src");
            el.load();
          }
          setVisible(false);
        }}
        onError={() => {
          const el = videoRef.current;
          if (el) {
            try {
              el.pause();
            } catch {
              /* noop */
            }
            el.removeAttribute("src");
            el.load();
          }
          setVisible(false);
        }}
      />
    </div>
  );
}

function App() {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "/";
  if (pathname === "/video") {
    return <VideoOverlay />;
  }
  return <Dashboard />;
}

export default App;
