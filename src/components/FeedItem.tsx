"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { Heart, Share2 } from "lucide-react";
import { FeedItemData } from "./Feed";
import { saveBestRageScore, getBestRageScore } from "../utils/sessionStore";

type FeedItemProps = {
  item: FeedItemData;
  isActive: boolean;
  itemIndex: number;
  onDoubleTap?: () => void;
  onGameComplete?: () => void;
  onRageComplete?: () => void;
  onVentComplete?: () => void;
};

// ─────────────────────────────────────────────────────────────
// Haptic helper — silent on unsupported devices
// ─────────────────────────────────────────────────────────────
function haptic(pattern: VibratePattern) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// Secret content pool — revealed on long press
// ─────────────────────────────────────────────────────────────
const SECRET_CONTENT = [
  "You found the hidden layer.",
  "Most people never hold long enough.",
  "This was always here. Waiting.",
  "You have more patience than you think.",
  "The real feed is beneath this one.",
  "Not everyone gets this far.",
  "You noticed. That's rare.",
  "This exists only for those who linger.",
  "Curiosity found its reward.",
  "Some things only reveal themselves when you're still.",
];

// ─────────────────────────────────────────────────────────────
// Visual escalation: bg + text scale + glow depth
// ─────────────────────────────────────────────────────────────
function getEscalation(index: number): {
  bgOverlay: string;
  textScale: string;
  glowIntensity: number;
} {
  if (index < 10) {
    return { bgOverlay: "transparent", textScale: "scale(1)", glowIntensity: 0 };
  }
  if (index < 20) {
    const t = (index - 10) / 10;
    return {
      bgOverlay: `rgba(${Math.round(60 * t)}, 0, ${Math.round(20 * t)}, ${0.15 * t})`,
      textScale: `scale(${1 + 0.04 * t})`,
      glowIntensity: t,
    };
  }
  const t = Math.min((index - 20) / 15, 1);
  return {
    bgOverlay: `rgba(${Math.round(60 + 30 * t)}, 0, ${Math.round(20 + 40 * t)}, ${0.15 + 0.1 * t})`,
    textScale: `scale(${1.04 + 0.04 * t})`,
    glowIntensity: 1,
  };
}

// ─────────────────────────────────────────────────────────────
// Share helper — Web Share API + clipboard fallback
// ─────────────────────────────────────────────────────────────
async function shareScore(score: number, isNewBest: boolean): Promise<void> {
  const text = isNewBest
    ? `🔥 NEW PERSONAL BEST: ${score} taps in 3 seconds on BrainLoop! Can you beat it?`
    : `I scored ${score} taps in 3 seconds on BrainLoop. Think you can do better?`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "BrainLoop — Rage Tap", text, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(`${text} ${window.location.href}`);
    }
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────
// RageTap — 3-second tap challenge
// ─────────────────────────────────────────────────────────────
function RageTap({ isActive, itemIndex, onComplete }: { isActive: boolean; itemIndex: number; onComplete?: () => void }) {
  const [tapCount, setTapCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3);
  const [isNewBest, setIsNewBest] = useState(false);
  const [previousBest, setPreviousBest] = useState(0);
  const [showCopied, setShowCopied] = useState(false);

  const tapCountRef = useRef(0);
  const finalScoreRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startedRef = useRef(false);

  const { bgOverlay, glowIntensity } = getEscalation(itemIndex);

  useEffect(() => {
    if (!isActive || startedRef.current) return;
    startedRef.current = true;
    setPreviousBest(getBestRageScore());

    const kickoff = setTimeout(() => {
      setRunning(true);
      setTimeLeft(3);
      haptic(50);

      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { if (intervalRef.current) clearInterval(intervalRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);

      timerRef.current = setTimeout(() => {
        const finalScore = tapCountRef.current;
        finalScoreRef.current = finalScore;
        const result = saveBestRageScore(finalScore);
        setIsNewBest(result.isNewBest);
        setRunning(false);
        setDone(true);
        haptic(result.isNewBest ? [80, 40, 80, 40, 120] : [60, 30, 60]);
        if (onComplete) onComplete();
      }, 3000);
    }, 700);

    return () => clearTimeout(kickoff);
  }, [isActive, onComplete]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const handleTap = () => {
    if (!running) return;
    tapCountRef.current += 1;
    setTapCount(tapCountRef.current);
    haptic(8);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await shareScore(finalScoreRef.current, isNewBest);
    if (!navigator.share) {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const timerBarWidth = running ? `${(timeLeft / 3) * 100}%` : done ? "0%" : "100%";

  return (
    <div
      className="flex flex-col items-center justify-center h-full w-full select-none relative overflow-hidden"
      onClick={handleTap}
      onTouchEnd={e => { e.preventDefault(); handleTap(); }}
      style={{ touchAction: "none", background: bgOverlay }}
    >
      {running && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
          <div
            className="w-72 h-72 rounded-full border-2 border-red-500/25 animate-ping"
            style={{ boxShadow: glowIntensity > 0 ? `0 0 ${40 * glowIntensity}px rgba(239,68,68,${0.15 * glowIntensity})` : "none" }}
          />
          <div className="absolute w-52 h-52 rounded-full border-2 border-red-500/10 animate-ping" style={{ animationDelay: "0.35s" }} />
        </div>
      )}

      <p className="text-white/50 text-xs font-bold tracking-[0.4em] uppercase mb-4 z-10">
        {done ? (isNewBest ? "🔥 new best" : "your score") : "⚡ rage tap"}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={tapCount}
          initial={{ scale: running ? 1.18 : 1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.07, ease: "easeOut" }}
          className={`text-[7rem] font-black tabular-nums z-10 leading-none ${
            running ? "text-red-400 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]"
            : done ? isNewBest ? "text-yellow-300 drop-shadow-[0_0_30px_rgba(253,224,71,0.8)]" : "text-white/60"
            : "text-white/20"
          }`}
        >
          {tapCount}
        </motion.div>
      </AnimatePresence>

      {done && isNewBest && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className="mt-2 px-4 py-1 bg-yellow-400/20 border border-yellow-400/40 rounded-full z-10"
        >
          <span className="text-yellow-300 text-sm font-bold tracking-widest uppercase">Personal Best!</span>
        </motion.div>
      )}

      {done && !isNewBest && previousBest > 0 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-3 text-white/30 text-sm font-semibold tracking-widest uppercase z-10">
          Best: {previousBest} — Try again ↑
        </motion.p>
      )}

      {done && !isNewBest && previousBest === 0 && (
        <p className="mt-3 text-white/30 text-sm font-semibold tracking-widest uppercase z-10">Keep going ↑</p>
      )}

      {done && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          onClick={handleShare}
          className="mt-6 z-10 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-sm font-semibold hover:bg-white/20 transition-colors"
        >
          <Share2 size={14} />
          <span>Share score</span>
        </motion.button>
      )}

      <AnimatePresence>
        {showCopied && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white/15 backdrop-blur px-4 py-1.5 rounded-full z-20"
          >
            <span className="text-white/80 text-xs font-semibold">Copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-white/10 rounded-full overflow-hidden z-10">
        <div className="h-full bg-red-500 rounded-full" style={{ width: timerBarWidth, transition: running ? "width 1s linear" : "none" }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VentItem — Rage Room / Frustration Release
// ─────────────────────────────────────────────────────────────
const ALL_FRUSTRATIONS = [
  "TRAFFIC", "MONDAYS", "EMAILS", "WAITING", "MEETINGS",
  "DEADLINES", "BUFFERING", "COLD COFFEE", "AUTOCORRECT",
  "SLOW WIFI", "NOTIFICATIONS", "HOLD MUSIC", "SMALL TALK",
  "ALARM CLOCKS", "LOADING...", "PASSWORDS", "UPDATES",
  "ADS", "VOICEMAILS", "PAPERWORK", "OVERTIME", "BAD WIFI",
];

const RELEASE_MSGS = [
  "Better.\nKeep going.",
  "Released.\nBreathe.",
  "Lighter now.",
  "Good.\nContinue.",
  "Clean.\nKeep scrolling.",
];

// Fixed 3×2 scatter positions — prevents word overlap
const WORD_POSITIONS = [
  { top: "12%", left: "8%"  },
  { top: "11%", left: "53%" },
  { top: "39%", left: "5%"  },
  { top: "41%", left: "51%" },
  { top: "65%", left: "10%" },
  { top: "64%", left: "49%" },
];

type VentWord = { id: number; text: string; dx: number; dy: number; rot: number };

function VentItem({ isActive, onComplete }: { isActive: boolean; onComplete?: () => void }) {
  const [words] = useState<VentWord[]>(() => {
    const shuffled = [...ALL_FRUSTRATIONS].sort(() => Math.random() - 0.5).slice(0, 6);
    return shuffled.map((text, i) => ({
      id: i,
      text,
      // Unique random exit trajectories baked in at creation
      dx: (Math.random() > 0.5 ? 1 : -1) * (90 + Math.random() * 130),
      dy: (Math.random() > 0.5 ? 1 : -1) * (70 + Math.random() * 110),
      rot: (Math.random() - 0.5) * 80,
    }));
  });

  const [smashed, setSmashed] = useState<Set<number>>(new Set());
  const [released, setReleased] = useState(false);
  const [releaseMsg] = useState(() => RELEASE_MSGS[Math.floor(Math.random() * RELEASE_MSGS.length)]);
  const completedRef = useRef(false);

  const handleSmash = (word: VentWord) => {
    if (released || smashed.has(word.id)) return;
    haptic([18, 6, 22]); // satisfying double-thud per smash
    setSmashed(prev => new Set([...prev, word.id]));
  };

  // All 6 smashed → celebration haptic → auto-advance
  useEffect(() => {
    if (smashed.size === 6 && !completedRef.current) {
      completedRef.current = true;
      setReleased(true);
      haptic([120, 60, 120, 60, 220]); // big celebratory burst
      setTimeout(() => { if (onComplete) onComplete(); }, 2800);
    }
  }, [smashed.size, onComplete]);

  const progress = smashed.size / 6;
  // Background: red radial wash grows with progress
  const bgR = Math.round(60 + 70 * progress);
  const bgAlpha = 0.06 + 0.22 * progress;

  return (
    <div className="relative h-full w-full overflow-hidden flex items-center justify-center">
      {/* Growing red wash */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-500"
        style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(${bgR}, 0, ${Math.round(18 * progress)}, ${bgAlpha}) 0%, transparent 80%)` }}
      />

      {/* Header label */}
      <p className="absolute top-14 w-full text-center text-white/30 text-xs font-bold tracking-[0.4em] uppercase z-10">
        {released ? "✓ released" : "⬡ tap to smash"}
      </p>

      {/* Smashable frustration words */}
      <AnimatePresence>
        {words.filter(w => !smashed.has(w.id)).map(word => (
          <motion.button
            key={word.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { delay: word.id * 0.08, type: "spring", stiffness: 220, damping: 15 }
            }}
            exit={{
              scale: 0,
              opacity: 0,
              x: word.dx,
              y: word.dy,
              rotate: word.rot,
              transition: { duration: 0.26, ease: [0.1, 0, 0.8, 1] }
            }}
            style={{
              position: "absolute",
              top: WORD_POSITIONS[word.id].top,
              left: WORD_POSITIONS[word.id].left,
            }}
            className="px-5 py-3 rounded-2xl border border-red-500/50 bg-red-500/10 text-red-400 font-black text-sm tracking-widest uppercase active:scale-90 transition-transform z-10 select-none"
            onClick={e => { e.stopPropagation(); handleSmash(word); }}
            onTouchEnd={e => { e.stopPropagation(); e.preventDefault(); handleSmash(word); }}
          >
            {word.text}
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Released state */}
      <AnimatePresence>
        {released && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className="flex flex-col items-center z-20 pointer-events-none"
          >
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1] }}
              transition={{ duration: 0.45 }}
              className="text-7xl mb-5"
            >
              💥
            </motion.p>
            <p className="text-white text-3xl font-black text-center px-10 leading-snug whitespace-pre-line">
              {releaseMsg}
            </p>
            <p className="text-white/25 text-xs mt-4 tracking-[0.4em] uppercase">↑ keep scrolling</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smash progress bar */}
      {!released && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-white/10 rounded-full overflow-hidden z-10">
          <div
            className="h-full bg-red-500 rounded-full transition-all duration-200"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main FeedItem
// ─────────────────────────────────────────────────────────────
export default function FeedItem({
  item, isActive, itemIndex,
  onDoubleTap, onGameComplete, onRageComplete, onVentComplete
}: FeedItemProps) {
  const [liked, setLiked] = useState(false);
  const [gameActive, setGameActive] = useState(item.type === "game");
  const [clickCount, setClickCount] = useState(0);
  const [secretText, setSecretText] = useState<string | null>(null);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressActiveRef = useRef(false);

  const { bgOverlay, textScale, glowIntensity } = getEscalation(itemIndex);

  // Game micro-loop timer
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (item.type === "game" && isActive && gameActive) {
      timeout = setTimeout(() => {
        setGameActive(false);
        if (onGameComplete) onGameComplete();
      }, 3000);
    }
    return () => { if (timeout) clearTimeout(timeout); };
  }, [isActive, item.type, gameActive, onGameComplete]);

  // Long press — reveal secret content
  const handlePointerDown = useCallback(() => {
    if (item.type === "rage" || item.type === "vent") return;
    longPressActiveRef.current = true;
    longPressTimerRef.current = setTimeout(() => {
      if (!longPressActiveRef.current) return;
      const secret = SECRET_CONTENT[Math.floor(Math.random() * SECRET_CONTENT.length)];
      setSecretText(secret);
      haptic([40, 20, 80, 20, 40]);
      setTimeout(() => setSecretText(null), 3000);
    }, 600);
  }, [item.type]);

  const handlePointerUp = useCallback(() => {
    longPressActiveRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  }, []);

  let lastTap = 0;
  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    longPressActiveRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    if (item.type === "game" && gameActive) {
      setClickCount(c => c + 1);
      haptic(8);
      e.preventDefault();
      return;
    }
    // These types handle their own taps internally
    if (item.type === "rage" || item.type === "vent") return;

    // Double-tap like
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
      setLiked(true);
      haptic([30, 20, 50]);
      if (onDoubleTap) onDoubleTap();
      e.preventDefault();
    }
    lastTap = currentTime;
  };

  const textStyle = (): string => {
    switch (item.type) {
      case "disrupt":  return "text-4xl font-bold text-cyan-300 drop-shadow-[0_0_14px_rgba(34,211,238,0.7)]";
      case "decision": return "text-4xl font-extrabold text-violet-300 drop-shadow-[0_0_14px_rgba(167,139,250,0.6)]";
      case "reset":    return "text-5xl font-black text-yellow-300 drop-shadow-[0_0_18px_rgba(253,224,71,0.7)] tracking-tight";
      case "spike":    return "text-5xl font-black tracking-tight text-white";
      default:         return "text-4xl font-bold text-white";
    }
  };

  const bgAccent = (): string => {
    const map: Partial<Record<FeedItemData["type"], string>> = {
      disrupt:  "radial-gradient(ellipse at center, rgba(8,145,178,0.18) 0%, transparent 70%)",
      decision: "radial-gradient(ellipse at center, rgba(124,58,237,0.18) 0%, transparent 70%)",
      reset:    "radial-gradient(ellipse at center, rgba(202,138,4,0.14) 0%, transparent 70%)",
      rage:     "radial-gradient(ellipse at center, rgba(239,68,68,0.12) 0%, transparent 70%)",
    };
    return map[item.type] ?? "none";
  };

  const typeBadge = (): string | null => {
    const map: Partial<Record<FeedItemData["type"], string>> = {
      disrupt: "⚡ mind check",
      decision: "△ decide",
      reset: "◉ pattern break",
    };
    return map[item.type] ?? null;
  };

  const escalationFilter =
    glowIntensity > 0
      ? `drop-shadow(0 0 ${Math.round(12 * glowIntensity)}px rgba(180,0,60,${0.25 * glowIntensity}))`
      : "none";

  return (
    <div
      className="relative w-full h-[100dvh] flex items-center justify-center bg-black snap-start snap-always"
      onClick={handleTouchEnd}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
    >
      {/* Escalation background wash */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-colors duration-1000"
        style={{ background: bgOverlay }}
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, rotate: -1 }}
        animate={isActive ? { scale: 1, opacity: 1, rotate: 0 } : { scale: 0.95, opacity: 0.5, rotate: -1 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full flex flex-col items-center justify-center relative touch-none z-10"
        style={{ background: bgAccent() }}
      >
        {/* ── MEME ──────────────────────────────────────────── */}
        {item.type === "meme" && item.contentUrl ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={item.contentUrl} alt="Meme"
              className="max-h-full max-w-full object-contain feed-image pointer-events-auto relative z-10"
              loading="lazy"
              style={{ transition: "transform 0.4s ease", transform: textScale }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none z-20" />
          </div>

        /* ── GAME ───────────────────────────────────────────── */
        ) : item.type === "game" ? (
          <div className="flex flex-col items-center justify-center h-full w-full select-none cursor-pointer">
            <h2 className="text-3xl font-bold text-white/90 px-8 text-center mb-8">Tap as fast as you can!</h2>
            <div className={`text-9xl font-black ${gameActive ? "text-white" : "text-neutral-600"} tabular-nums transition-colors`}>
              {clickCount}
            </div>
            {!gameActive && <p className="text-xl font-bold text-white mt-4 tracking-widest uppercase">Score</p>}
          </div>

        /* ── RAGE TAP ───────────────────────────────────────── */
        ) : item.type === "rage" ? (
          <RageTap isActive={isActive} itemIndex={itemIndex} onComplete={onRageComplete} />

        /* ── VENT ROOM ──────────────────────────────────────── */
        ) : item.type === "vent" ? (
          <VentItem isActive={isActive} onComplete={onVentComplete} />

        /* ── TEXT TYPES ─────────────────────────────────────── */
        ) : (
          <div className="w-full max-w-md px-8 py-12 text-center select-none" style={{ filter: escalationFilter }}>
            {typeBadge() && (
              <p className="text-xs font-bold tracking-[0.35em] uppercase mb-6 text-white/30">{typeBadge()}</p>
            )}
            <h2
              className={`font-sans leading-tight ${textStyle()}`}
              style={{
                transform: textScale,
                transition: "transform 0.5s ease",
                ...(item.type !== "ai" && item.type !== "spike"
                  ? {}
                  : { backgroundImage: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.55) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
                )
              }}
            >
              {item.text ?? "..."}
            </h2>
          </div>
        )}
      </motion.div>

      {/* Secret content overlay (long press) */}
      <AnimatePresence>
        {secretText && isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm pointer-events-none"
          >
            <p className="text-white/30 text-xs font-bold tracking-[0.4em] uppercase mb-4">⬤ hidden layer</p>
            <p className="text-white text-2xl font-bold text-center px-10 leading-snug">{secretText}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Like Effect */}
      {liked && isActive && !["game", "rage", "vent"].includes(item.type) && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: [0, 1.5, 1], opacity: [1, 1, 0] }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
        >
          <Heart className="w-32 h-32 text-red-500 fill-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]" />
        </motion.div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .feed-image { transition: transform 0.4s ease; }
        .feed-image:active { transform: scale(1.03); }
      `}} />
    </div>
  );
}
