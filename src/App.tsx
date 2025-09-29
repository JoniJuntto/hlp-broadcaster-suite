import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

interface EventRecord {
  id: string;
  type: string;
  timestamp: Date;
  data?: unknown;
  description: string;
}

const apiBase = import.meta.env.VITE_API_BASE_URL || 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
    ? "http://localhost:8787" 
    : "https://hlp-api.onrender.com");

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
  const [toast, setToast] = useState<{ username: string; rewardName: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  console.log("🌐 Broadcaster Suite API Base:", apiBase);

  

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
        const payload = JSON.parse(e.data) as { src: string; filename: string; username?: string; rewardName?: string };
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

        // Show toast if username and reward name are provided
        if (payload.username && payload.rewardName) {
          setToast({ username: payload.username, rewardName: payload.rewardName });
          setTimeout(() => setToast(null), 5000);
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
  }, [volume, muted]);

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
          <div className="header-actions">
            <div className="status-badge" style={{ color: getStatusColor() }}>
              <span className="status-icon">{getStatusIcon()}</span>
              {status}
            </div>
            <div className="nav-links">
              <a href="/tos" className="nav-link">
                Terms of Service
              </a>
              <a href="/privacy" className="nav-link">
                Privacy Policy
              </a>
              <a href="/video" className="nav-link">
                Video Overlay
              </a>
            </div>
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
      
      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "18px",
            fontWeight: "bold",
            textAlign: "center",
            zIndex: 10000,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            border: "2px solid #9146ff",
            animation: "fadeInOut 5s ease-in-out",
          }}
        >
          <div style={{ fontSize: "16px", marginBottom: "4px" }}>
            {toast.username}
          </div>
          <div style={{ fontSize: "14px", opacity: 0.9 }}>
            redeemed: {toast.rewardName}
          </div>
        </div>
      )}
      
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            5% { opacity: 1; transform: translateX(-50%) translateY(0); }
            95% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          }
        `}
      </style>
    </div>
  );
}

function TermsOfService() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="title">
            <span className="title-icon">📋</span>
            Terms of Service
          </h1>
          <div className="header-actions">
            <div className="nav-links">
              <a href="/privacy" className="nav-link">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="legal-container">
          <div className="legal-content">
            <div className="legal-section">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By using the Huikka Loyalty Program (HLP) Twitch Extension, you
                agree to be bound by these Terms of Service. If you do not agree
                to these terms, please do not use our extension.
              </p>
            </div>

            <div className="legal-section">
              <h2>2. Service Description</h2>
              <p>
                The HLP Extension is a loyalty program system that allows Twitch
                viewers to earn points through watch time and spend them on
                digital rewards. The extension includes:
              </p>
              <ul>
                <li>Automatic point earning based on watch time</li>
                <li>Digital marketplace for purchasing rewards</li>
                <li>Role-based point multipliers</li>
                <li>Real-time balance updates</li>
                <li>Broadcaster dashboard for monitoring</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>3. Data Collection and Privacy</h2>
              <p>
                We collect minimal data necessary for the loyalty program
                functionality:
              </p>
              <ul>
                <li>
                  <strong>Twitch User ID:</strong> Required for authentication
                  and point tracking
                </li>
                <li>
                  <strong>User Role:</strong> Used to apply appropriate point
                  multipliers
                </li>
                <li>
                  <strong>Point Balance:</strong> Stored to maintain loyalty
                  program state
                </li>
                <li>
                  <strong>Transaction History:</strong> Recorded for audit
                  purposes
                </li>
                <li>
                  <strong>Watch Time Data:</strong> Used to calculate earned
                  points
                </li>
              </ul>
              <p>
                <strong>We do NOT collect:</strong>
              </p>
              <ul>
                <li>Personal information (names, emails, addresses)</li>
                <li>Analytics or tracking data</li>
                <li>Third-party data sharing</li>
                <li>Google Analytics or similar services</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>4. User Responsibilities</h2>
              <p>Users are responsible for:</p>
              <ul>
                <li>
                  Using the extension in accordance with Twitch's Terms of
                  Service
                </li>
                <li>
                  Not attempting to exploit or manipulate the point system
                </li>
                <li>Respecting other users and the community</li>
                <li>Reporting any bugs or issues through proper channels</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>5. Point System</h2>
              <p>
                Points are earned automatically based on watch time and user
                role:
              </p>
              <ul>
                <li>
                  <strong>Broadcaster:</strong> Highest point multiplier
                </li>
                <li>
                  <strong>Moderator:</strong> Elevated point multiplier
                </li>
                <li>
                  <strong>VIP:</strong> Enhanced point multiplier
                </li>
                <li>
                  <strong>Viewer:</strong> Standard point multiplier
                </li>
              </ul>
              <p>
                Points are updated every 60 seconds while actively watching the
                stream. Points have no monetary value and cannot be exchanged
                for real currency.
              </p>
            </div>

            <div className="legal-section">
              <h2>6. Digital Rewards</h2>
              <p>Digital rewards available through the marketplace include:</p>
              <ul>
                <li>Custom emotes</li>
                <li>Highlight messages</li>
                <li>Custom badges</li>
                <li>Channel point multipliers</li>
                <li>Audio triggers</li>
                <li>Video overlays</li>
              </ul>
              <p>
                All rewards are digital and have no monetary value. Rewards are
                subject to availability and may be modified or removed at any
                time.
              </p>
            </div>

            <div className="legal-section">
              <h2>7. Service Availability</h2>
              <p>
                We strive to maintain high service availability but cannot
                guarantee uninterrupted access. The service may be temporarily
                unavailable due to:
              </p>
              <ul>
                <li>Maintenance and updates</li>
                <li>Technical issues</li>
                <li>Server problems</li>
                <li>Third-party service disruptions</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>8. Modifications and Updates</h2>
              <p>
                We reserve the right to modify, update, or discontinue the
                extension at any time. Changes to these terms will be
                communicated through the extension interface or Twitch platform.
              </p>
            </div>

            <div className="legal-section">
              <h2>9. Limitation of Liability</h2>
              <p>
                The extension is provided "as is" without warranties of any
                kind. We are not liable for any damages arising from the use of
                the extension, including but not limited to:
              </p>
              <ul>
                <li>Loss of points or rewards</li>
                <li>Service interruptions</li>
                <li>Data loss</li>
                <li>Technical malfunctions</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>10. Termination</h2>
              <p>
                We reserve the right to terminate access to the extension for
                users who violate these terms or engage in abusive behavior.
                Upon termination, all points and rewards may be forfeited.
              </p>
            </div>

            <div className="legal-section">
              <h2>11. Contact Information</h2>
              <p>
                For questions about these Terms of Service or the extension,
                please contact us through the Twitch Developer Console or the
                extension's support channels.
              </p>
            </div>

            <div className="legal-section">
              <h2>12. Effective Date</h2>
              <p>
                These Terms of Service are effective as of{" "}
                {new Date().toLocaleDateString()} and will remain in effect
                until modified or terminated.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="title">
            <span className="title-icon">🔒</span>
            Privacy Policy
          </h1>
          <div className="header-actions">
            <div className="nav-links">
              <a href="/tos" className="nav-link">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="legal-container">
          <div className="legal-content">
            <div className="legal-section">
              <h2>1. Introduction</h2>
              <p>
                This Privacy Policy explains how the Huikka Loyalty Program
                (HLP) Twitch Extension collects, uses, and protects your
                information. We are committed to protecting your privacy and
                being transparent about our data practices.
              </p>
              <p>
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="legal-section">
              <h2>2. Information We Collect</h2>
              <p>
                We collect only the minimal information necessary for the
                loyalty program to function properly:
              </p>

              <h3>2.1 Required Data</h3>
              <ul>
                <li>
                  <strong>Twitch User ID:</strong> Unique identifier provided by
                  Twitch for authentication and point tracking
                </li>
                <li>
                  <strong>User Role:</strong> Your role on the channel
                  (broadcaster, moderator, VIP, or viewer) to apply appropriate
                  point multipliers
                </li>
                <li>
                  <strong>Point Balance:</strong> Your current loyalty points
                  balance for the program
                </li>
                <li>
                  <strong>Transaction History:</strong> Records of purchases and
                  point earnings for audit purposes
                </li>
                <li>
                  <strong>Watch Time Data:</strong> Time spent watching the
                  stream to calculate earned points
                </li>
              </ul>

              <h3>2.2 Data We Do NOT Collect</h3>
              <ul>
                <li>
                  Personal information (names, email addresses, phone numbers)
                </li>
                <li>Payment information or financial data</li>
                <li>Location data or IP addresses</li>
                <li>Analytics or tracking data</li>
                <li>Third-party data sharing</li>
                <li>Google Analytics or similar services</li>
                <li>Cookies or tracking technologies</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>3. How We Use Your Information</h2>
              <p>
                We use the collected information solely for the following
                purposes:
              </p>
              <ul>
                <li>
                  <strong>Authentication:</strong> Verify your identity through
                  Twitch's official extension system
                </li>
                <li>
                  <strong>Point Calculation:</strong> Calculate and award points
                  based on watch time and user role
                </li>
                <li>
                  <strong>Transaction Processing:</strong> Process purchases and
                  maintain accurate point balances
                </li>
                <li>
                  <strong>Program Administration:</strong> Maintain the loyalty
                  program's functionality and integrity
                </li>
                <li>
                  <strong>Audit Trail:</strong> Keep records for program
                  transparency and dispute resolution
                </li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>4. Data Storage and Security</h2>
              <p>
                We implement appropriate security measures to protect your data:
              </p>
              <ul>
                <li>
                  <strong>Secure Storage:</strong> Data is stored in encrypted
                  databases with proper access controls
                </li>
                <li>
                  <strong>Access Control:</strong> Only authorized personnel
                  have access to user data
                </li>
                <li>
                  <strong>Data Encryption:</strong> All data transmission uses
                  HTTPS encryption
                </li>
                <li>
                  <strong>Regular Backups:</strong> Data is regularly backed up
                  to prevent loss
                </li>
                <li>
                  <strong>Security Monitoring:</strong> We monitor for
                  unauthorized access attempts
                </li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>5. Data Sharing and Third Parties</h2>
              <p>
                <strong>We do NOT share your data with third parties.</strong>
                Your information is used exclusively for the loyalty program
                functionality and is not sold, rented, or shared with:
              </p>
              <ul>
                <li>Advertising companies</li>
                <li>Analytics providers</li>
                <li>Social media platforms</li>
                <li>Data brokers</li>
                <li>Any other third parties</li>
              </ul>
              <p>
                The only exception is when required by law or to protect our
                rights and the rights of others.
              </p>
            </div>

            <div className="legal-section">
              <h2>6. Data Retention</h2>
              <p>
                We retain your data for as long as necessary to provide the
                loyalty program service:
              </p>
              <ul>
                <li>
                  <strong>Active Users:</strong> Data is retained while you
                  actively use the extension
                </li>
                <li>
                  <strong>Inactive Users:</strong> Data may be retained for up
                  to 2 years after last activity
                </li>
                <li>
                  <strong>Transaction Records:</strong> Kept for audit purposes
                  for up to 3 years
                </li>
                <li>
                  <strong>Legal Requirements:</strong> Some data may be retained
                  longer if required by law
                </li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>7. Your Rights and Choices</h2>
              <p>You have the following rights regarding your data:</p>
              <ul>
                <li>
                  <strong>Access:</strong> Request a copy of your data
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate
                  data
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your data
                </li>
                <li>
                  <strong>Portability:</strong> Request your data in a portable
                  format
                </li>
                <li>
                  <strong>Objection:</strong> Object to processing of your data
                </li>
              </ul>
              <p>
                To exercise these rights, please contact us through the Twitch
                Developer Console or extension support channels.
              </p>
            </div>

            <div className="legal-section">
              <h2>8. Children's Privacy</h2>
              <p>
                Our extension is not intended for children under 13 years of
                age. We do not knowingly collect personal information from
                children under 13. If you are a parent or guardian and believe
                your child has provided us with personal information, please
                contact us immediately.
              </p>
            </div>

            <div className="legal-section">
              <h2>9. International Data Transfers</h2>
              <p>
                Your data may be processed and stored in countries other than
                your own. We ensure appropriate safeguards are in place to
                protect your data during international transfers, including:
              </p>
              <ul>
                <li>Standard contractual clauses</li>
                <li>Adequacy decisions</li>
                <li>Appropriate technical and organizational measures</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>10. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. When we do,
                we will:
              </p>
              <ul>
                <li>Update the "Last Updated" date</li>
                <li>Notify users through the extension interface</li>
                <li>Post the updated policy on our website</li>
                <li>Obtain consent for material changes</li>
              </ul>
              <p>
                Your continued use of the extension after changes constitutes
                acceptance of the updated policy.
              </p>
            </div>

            <div className="legal-section">
              <h2>11. Contact Information</h2>
              <p>
                If you have questions about this Privacy Policy or our data
                practices, please contact us:
              </p>
              <ul>
                <li>
                  <strong>Primary Contact:</strong> Through the Twitch Developer
                  Console
                </li>
                <li>
                  <strong>Extension Support:</strong> Via the extension's
                  support channels
                </li>
                <li>
                  <strong>Data Protection:</strong> For privacy-specific
                  concerns
                </li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>12. Compliance</h2>
              <p>
                This Privacy Policy is designed to comply with applicable data
                protection laws, including:
              </p>
              <ul>
                <li>General Data Protection Regulation (GDPR)</li>
                <li>California Consumer Privacy Act (CCPA)</li>
                <li>Other applicable privacy laws</li>
              </ul>
              <p>
                We are committed to maintaining the highest standards of data
                protection and privacy.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function VideoOverlay() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const muted = true;
  const volume = 1;
  const [visible, setVisible] = useState<boolean>(false);
  const [toast, setToast] = useState<{ username: string; rewardName: string } | null>(null);

  useEffect(() => {
    const es = new EventSource(`${apiBase}/events`);

    const playVideo = (src: string, username?: string, rewardName?: string) => {
      const el = videoRef.current;
      if (!el) return;
      
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

      // Show toast if username and reward name are provided
      if (username && rewardName) {
        setToast({ username, rewardName });
        setTimeout(() => setToast(null), 5000);
      }
    };

    es.onopen = () => undefined;
    es.addEventListener("connected", () => undefined);
    es.addEventListener("play-video", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as { src: string; username?: string; rewardName?: string };
        playVideo(payload.src, payload.username, payload.rewardName);
      } catch {
        /* noop */
      }
    });
    es.onerror = () => undefined;

    return () => es.close();
  }, [muted, volume]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "transparent",
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
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
        muted={muted}
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
      
      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "18px",
            fontWeight: "bold",
            textAlign: "center",
            zIndex: 10000,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            border: "2px solid #9146ff",
            animation: "fadeInOut 5s ease-in-out",
          }}
        >
          <div style={{ fontSize: "16px", marginBottom: "4px" }}>
            {toast.username}
          </div>
          <div style={{ fontSize: "14px", opacity: 0.9 }}>
            redeemed: {toast.rewardName}
          </div>
        </div>
      )}
      
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            5% { opacity: 1; transform: translateX(-50%) translateY(0); }
            95% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          }
        `}
      </style>
    </div>
  );
}

function App() {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "/";
  if (pathname === "/video") {
    return <VideoOverlay />;
  }
  if (pathname === "/tos") {
    return <TermsOfService />;
  }
  if (pathname === "/privacy") {
    return <PrivacyPolicy />;
  }
  return <Dashboard />;
}

export default App;
