import React, { useState } from "react";

/*
  Design tokens pulled from the Workforce Adventure map screenshot:
  - Deep navy shell:      #0B1330
  - Sky gradient blues:   #1E5F8C -> #3B8FC7 -> #7FC4E8
  - Sand/ground:          #D9A25C / #C98A3E
  - Orange node accent:   #E8823C
  - Pink node accent:     #E85B94
  - Gold "active" accent: #F0C64C
  - Cream text:           #FDF6E3
  Cottage-house flavor (from the village reference) folded in as small pixel
  house glyphs + warm lantern glow, not a literal illustrated scene.
*/

const PixelHouse = ({ lit = false, roof = "#8B4A2B", wall = "#C98A3E", size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    shapeRendering="crispEdges"
    style={{ imageRendering: "pixelated", display: "block" }}
    aria-hidden="true"
  >
    {/* roof */}
    <rect x="2" y="3" width="12" height="2" fill={roof} />
    <rect x="3" y="1" width="10" height="2" fill={roof} />
    <rect x="5" y="0" width="6" height="1" fill={roof} />
    {/* walls */}
    <rect x="3" y="5" width="10" height="9" fill={wall} />
    <rect x="3" y="5" width="10" height="1" fill="#7A5230" opacity="0.4" />
    {/* door */}
    <rect x="7" y="10" width="2" height="4" fill="#4A2F1C" />
    {/* window */}
    <rect x="4" y="7" width="2" height="2" fill={lit ? "#F0C64C" : "#2B3A55"} />
    <rect x="10" y="7" width="2" height="2" fill={lit ? "#F0C64C" : "#2B3A55"} />
  </svg>
);

// Wider, more detailed cottage for the foreground skyline row — two windows,
// a chimney, and an optional striped-awning stall front like the market
// buildings in the reference village image.
const CottageBig = ({ lit = true, roof = "#7A3D22", wall = "#B87A3E", trim = "#5C3018", awning, flicker, w = 96, h = 92 }) => (
  <svg
    width={w}
    height={h}
    viewBox="0 0 24 22"
    shapeRendering="crispEdges"
    style={{ imageRendering: "pixelated", display: "block", flexShrink: 0 }}
    aria-hidden="true"
  >
    {/* chimney */}
    <rect x="17" y="1" width="2" height="4" fill={trim} />
    <rect x="16.5" y="0.5" width="3" height="1" fill="#3E2410" />
    {/* roof */}
    <polygon points="1,8 12,1 23,8" fill={roof} />
    <rect x="0.5" y="7.5" width="23" height="1.5" fill={trim} />
    {/* walls */}
    <rect x="2" y="9" width="20" height="12" fill={wall} />
    <rect x="2" y="9" width="20" height="1" fill="#00000022" />
    {/* trim beams */}
    <rect x="2" y="9" width="1" height="12" fill={trim} />
    <rect x="21" y="9" width="1" height="12" fill={trim} />
    {/* windows */}
    <rect x="4.5" y="11.5" width="4" height="4" fill={trim} />
    <rect x="5" y="12" width="3" height="3" fill={lit ? "#F0C64C" : "#22304E"} className={flicker ? "wlit" : undefined} />
    <rect x="15.5" y="11.5" width="4" height="4" fill={trim} />
    <rect x="16" y="12" width="3" height="3" fill={lit ? "#F0C64C" : "#22304E"} className={flicker ? "wlit" : undefined} />
    {/* door */}
    <rect x="10.5" y="15" width="3" height="6" fill={trim} />
    {/* awning */}
    {awning && (
      <>
        <rect x="9" y="14.5" width="6" height="1" fill="#5C1F1F" />
        <rect x="8.5" y="15.3" width="1" height="1.6" fill="#D9502E" />
        <rect x="9.5" y="15.3" width="1" height="1.6" fill="#F0E4C0" />
        <rect x="10.5" y="15.3" width="1" height="1.6" fill="#D9502E" />
        <rect x="11.5" y="15.3" width="1" height="1.6" fill="#F0E4C0" />
        <rect x="12.5" y="15.3" width="1" height="1.6" fill="#D9502E" />
        <rect x="13.5" y="15.3" width="1" height="1.6" fill="#F0E4C0" />
      </>
    )}
  </svg>
);

// Tall watchtower / castle silhouette for the far hillside, echoing the
// spired keep on the hill in the reference image.
const CastleSilhouette = ({ w = 260, h = 150 }) => (
  <svg
    width={w}
    height={h}
    viewBox="0 0 130 75"
    shapeRendering="crispEdges"
    style={{ imageRendering: "pixelated", display: "block" }}
    aria-hidden="true"
  >
    <g fill="#1B2C52">
      {/* left tower */}
      <rect x="8" y="30" width="10" height="45" />
      <polygon points="6,30 13,16 20,30" />
      {/* center keep, taller */}
      <rect x="30" y="18" width="22" height="57" />
      <rect x="34" y="8" width="14" height="12" />
      <polygon points="32,8 41,-4 50,8" />
      <rect x="40" y="-9" width="1.5" height="6" />
      {/* connecting wall */}
      <rect x="18" y="42" width="12" height="33" />
      <rect x="52" y="42" width="16" height="33" />
      {/* right spire cluster */}
      <rect x="68" y="26" width="9" height="49" />
      <polygon points="66,26 72.5,12 79,26" />
      <rect x="80" y="35" width="8" height="40" />
      <polygon points="78,35 84,23 90,35" />
      {/* far right small tower */}
      <rect x="95" y="40" width="7" height="35" />
      <polygon points="93,40 98.5,29 104,40" />
      {/* windows, lit */}
    </g>
    <g fill="#F0C64C" opacity="0.85">
      <rect x="38" y="30" width="2" height="3" />
      <rect x="44" y="30" width="2" height="3" />
      <rect x="12" y="48" width="2" height="3" />
      <rect x="72" y="42" width="2" height="3" />
    </g>
  </svg>
);

// Simple layered pine for tree lines.
const PixelPine = ({ w = 30, h = 46, shade = "#2E4A2E" }) => (
  <svg
    width={w}
    height={h}
    viewBox="0 0 12 18"
    shapeRendering="crispEdges"
    style={{ imageRendering: "pixelated", display: "block", flexShrink: 0 }}
    aria-hidden="true"
  >
    <rect x="5" y="15" width="2" height="3" fill="#4A3018" />
    <polygon points="6,0 11,7 1,7" fill={shade} />
    <polygon points="6,4 12,12 0,12" fill={shade} />
    <polygon points="6,9 12,17 0,17" fill={shade} />
  </svg>
);

const PixelMushroom = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    shapeRendering="crispEdges"
    style={{ imageRendering: "pixelated", display: "block" }}
    aria-hidden="true"
  >
    <rect x="4" y="7" width="4" height="4" fill="#F0E0C0" />
    <rect x="2" y="4" width="8" height="3" fill="#C9432E" />
    <rect x="3" y="3" width="6" height="1" fill="#C9432E" />
    <rect x="3" y="5" width="2" height="1" fill="#F0E0C0" />
    <rect x="7" y="4" width="2" height="1" fill="#F0E0C0" />
  </svg>
);

const PixelLantern = ({ size = 16, flicker }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 8 12"
    shapeRendering="crispEdges"
    style={{
      imageRendering: "pixelated",
      display: "block",
      filter: flicker ? "drop-shadow(0 0 4px #F0C64Caa)" : "none",
    }}
    aria-hidden="true"
  >
    <rect x="3" y="0" width="2" height="2" fill="#5A4A2E" />
    <rect x="1" y="2" width="6" height="6" fill="#F0C64C" opacity={flicker ? 1 : 0.55} />
    <rect x="1" y="2" width="6" height="1" fill="#5A4A2E" />
    <rect x="1" y="7" width="6" height="1" fill="#5A4A2E" />
    <rect x="3" y="8" width="2" height="3" fill="#5A4A2E" />
  </svg>
);

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [focused, setFocused] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 1800);
  };

  const isLogin = mode === "login";
  const anyFieldActive = focused !== null || Object.values(form).some((v) => v.length > 0);

  return (
    <div
      style={{
        fontFamily: "'Silkscreen', 'Press Start 2P', monospace",
        minHeight: "100vh",
        width: "100%",
        background:
          "linear-gradient(180deg, #0B1330 0%, #16305A 28%, #2E6C97 55%, #5FA3C9 75%, #7FC4E8 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=VT323&display=swap');
        * { box-sizing: border-box; }
        .pxbtn {
          font-family: 'Silkscreen', monospace;
          cursor: pointer;
          image-rendering: pixelated;
          transition: transform 0.05s ease;
        }
        .pxbtn:active { transform: translateY(2px); }
        .pxinput {
          font-family: 'VT323', monospace;
          font-size: 18px;
        }
        .pxinput::placeholder { color: #9AA6C0; opacity: 1; }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .lantern-flicker { animation: flicker 2.4s ease-in-out infinite; }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .star { animation: twinkle 3s ease-in-out infinite; }
      `}</style>

      {/* stars */}
      {[...Array(18)].map((_, i) => (
        <div
          key={i}
          className="star"
          style={{
            position: "absolute",
            top: `${(i * 37) % 32}%`,
            left: `${(i * 53) % 100}%`,
            width: 2,
            height: 2,
            background: "#FDF6E3",
            animationDelay: `${(i % 5) * 0.4}s`,
          }}
        />
      ))}

      {/* moon */}
      <div
        style={{
          position: "absolute",
          top: 30,
          right: "10%",
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "#F0E4C0",
          boxShadow: "0 0 24px rgba(240,228,192,0.35)",
        }}
      />

      {/* ===== layered backdrop scene, bottom-anchored ===== */}

      {/* distant mountain ridge */}
      <div
        style={{
          position: "absolute",
          bottom: 210,
          left: 0,
          right: 0,
          height: 130,
          opacity: 0.55,
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
          <polygon points="0,100 0,55 60,10 130,60 190,20 260,65 330,15 400,50 400,100" fill="#0F1D3F" />
        </svg>
      </div>

      {/* castle silhouette on the hill, right of center like the reference */}
      <div style={{ position: "absolute", bottom: 190, left: "50%", transform: "translateX(-10%)", opacity: 0.9 }}>
        <CastleSilhouette w={230} h={135} />
      </div>

      {/* rolling hill band beneath the castle */}
      <div
        style={{
          position: "absolute",
          bottom: 150,
          left: 0,
          right: 0,
          height: 110,
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,90 L0,50 Q100,15 200,35 T400,20 L400,90 Z" fill="#17325A" />
        </svg>
      </div>

      {/* tree line, receding row */}
      <div
        style={{
          position: "absolute",
          bottom: 148,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          padding: "0 2%",
          overflow: "hidden",
        }}
      >
        {[...Array(14)].map((_, i) => (
          <PixelPine
            key={i}
            w={16 + (i % 3) * 6}
            h={26 + (i % 3) * 8}
            shade={i % 2 === 0 ? "#1F3A2C" : "#274630"}
          />
        ))}
      </div>

      {/* ground plane */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 158,
          background: "linear-gradient(180deg, #C98A3E 0%, #A9702F 55%, #8C5C28 100%)",
        }}
      />

      {/* foreground cottage row, sits on the ground plane */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "0 3%",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <CottageBig lit awning w={104} h={100} roof="#7A3D22" wall="#B87A3E" />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 4 }}>
            <div className="lantern-flicker">
              <PixelLantern flicker size={20} />
            </div>
            <PixelMushroom size={16} />
          </div>
          <CottageBig lit={anyFieldActive} w={78} h={78} roof="#5C3018" wall="#8B5A2E" />
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <CottageBig lit w={70} h={70} roof="#6B3A22" wall="#A9702F" />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 4 }}>
            <div className="lantern-flicker" style={{ animationDelay: "1s" }}>
              <PixelLantern flicker size={20} />
            </div>
            <PixelMushroom size={14} />
          </div>
          <CottageBig lit awning w={104} h={102} roof="#7A3D22" wall="#C98A3E" />
        </div>
      </div>

      {/* subtle vignette so the card stays legible over the scene */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 55%, rgba(11,19,48,0.15) 0%, rgba(11,19,48,0.55) 70%, rgba(11,19,48,0.75) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* main card */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          width: "100%",
          maxWidth: 380,
          marginBottom: 96,
        }}
      >
        {/* signpost header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#F0C64C",
              border: "3px solid #0B1330",
              boxShadow: "4px 4px 0 #0B1330",
              padding: "8px 18px",
              borderRadius: 2,
            }}
          >
            <PixelHouse lit size={22} roof="#4A2F1C" wall="#0B1330" />
            <span
              style={{
                fontSize: 13,
                letterSpacing: 1,
                color: "#4A2F1C",
                fontWeight: 700,
              }}
            >
              WORKFORCE ADVENTURE
            </span>
          </div>
        </div>

        {/* card */}
        <div
          style={{
            background: "#0C1636",
            border: "3px solid #060B1E",
            boxShadow: "6px 6px 0 rgba(0,0,0,0.5), 0 0 0 6px rgba(11,19,48,0.4)",
            borderRadius: 2,
            padding: "22px 20px 24px",
          }}
        >
          {/* mode toggle */}
          <div
            style={{
              display: "flex",
              border: "2px solid #0B1330",
              borderRadius: 2,
              overflow: "hidden",
              marginBottom: 20,
              background: "#0B1330",
            }}
          >
            <button
              className="pxbtn"
              onClick={() => setMode("login")}
              style={{
                flex: 1,
                padding: "10px 8px",
                border: "none",
                fontSize: 11,
                letterSpacing: 1,
                color: isLogin ? "#0B1330" : "#8FA0C7",
                background: isLogin ? "#E8823C" : "transparent",
                fontWeight: 700,
              }}
            >
              LOG IN
            </button>
            <button
              className="pxbtn"
              onClick={() => setMode("signup")}
              style={{
                flex: 1,
                padding: "10px 8px",
                border: "none",
                fontSize: 11,
                letterSpacing: 1,
                color: !isLogin ? "#0B1330" : "#8FA0C7",
                background: !isLogin ? "#E85B94" : "transparent",
                fontWeight: 700,
              }}
            >
              SIGN UP
            </button>
          </div>

          <p
            style={{
              fontSize: 10,
              color: "#8FA0C7",
              letterSpacing: 0.5,
              lineHeight: 1.7,
              marginTop: 0,
              marginBottom: 18,
              textAlign: "center",
            }}
          >
            {isLogin
              ? "ENTER THE VALLEY TO CONTINUE YOUR TRAIL"
              : "CREATE A HERO TO BEGIN THE TRAIL"}
          </p>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <Field
                label="HERO NAME"
                type="text"
                placeholder="e.g. RiverWalker"
                value={form.username}
                onChange={update("username")}
                onFocus={() => setFocused("username")}
                onBlur={() => setFocused(null)}
              />
            )}

            <Field
              label="EMAIL"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={update("email")}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
            />

            <Field
              label="PASSWORD"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={update("password")}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
            />

            {!isLogin && (
              <Field
                label="CONFIRM PASSWORD"
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={update("confirm")}
                onFocus={() => setFocused("confirm")}
                onBlur={() => setFocused(null)}
              />
            )}

            {isLogin && (
              <div style={{ textAlign: "right", marginBottom: 16, marginTop: -4 }}>
                <button
                  type="button"
                  className="pxbtn"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#7FC4E8",
                    fontSize: 9,
                    letterSpacing: 0.5,
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  FORGOT PASSWORD?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="pxbtn"
              style={{
                width: "100%",
                padding: "13px",
                border: "3px solid #0B1330",
                borderRadius: 2,
                background: submitted ? "#F0C64C" : isLogin ? "#E8823C" : "#E85B94",
                color: "#0B1330",
                fontSize: 12,
                letterSpacing: 1.5,
                fontWeight: 700,
                boxShadow: "3px 3px 0 rgba(0,0,0,0.35)",
              }}
            >
              {submitted ? "✓ WELCOME, TRAVELER" : isLogin ? "ENTER THE REALM" : "START YOUR JOURNEY"}
            </button>
          </form>

          <p
            style={{
              fontSize: 9,
              color: "#5C6A8F",
              textAlign: "center",
              marginTop: 18,
              marginBottom: 0,
              letterSpacing: 0.5,
            }}
          >
            {isLogin ? "NEW TO THE VALLEY? " : "ALREADY HAVE A HERO? "}
            <span
              onClick={() => setMode(isLogin ? "signup" : "login")}
              style={{
                color: isLogin ? "#E85B94" : "#E8823C",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {isLogin ? "CREATE ONE" : "LOG IN"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, placeholder, value, onChange, onFocus, onBlur }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 9,
          letterSpacing: 1,
          color: "#8FA0C7",
          marginBottom: 6,
          fontWeight: 700,
        }}
      >
        {label}
      </label>
      <input
        className="pxinput"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        required
        style={{
          width: "100%",
          padding: "10px 12px",
          background: "#182A57",
          border: "2px solid #2B3A6B",
          borderRadius: 2,
          color: "#FDF6E3",
          outline: "none",
        }}
      />
    </div>
  );
}
