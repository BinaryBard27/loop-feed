"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FeedItem from "./FeedItem";
import {
  getAIText,
  getStaticFallback,
  getDisruptText,
  getDecisionText,
  getResetText,
} from "../utils/contentGenerator";
import {
  loadAndUpdateStreak,
  incrementTotalViewed,
} from "../utils/sessionStore";
import { Volume2, VolumeX } from "lucide-react";

export type FeedItemData = {
  id: string;
  type: "meme" | "ai" | "spike" | "game" | "premium" | "rage" | "disrupt" | "decision" | "reset" | "vent";
  contentUrl?: string;
  text?: string;
  quality?: "weak" | "average" | "premium";
};

const IDLE_TRAPS = [
  "Wait…",
  "Just one more",
  "Don't stop now",
  "This next one is better",
  "You're still here?",
];

const SPIKE_CONTENT = [
  "Stop. Don't scroll.",
  "Wait... why are you still here?",
  "You were about to close this, right?",
  "This is your sign to keep going.",
];

// Session time reveal messages (shown once after 2 min)
const TIME_REVEALS = [
  { main: "You've been scrolling for 2 minutes.", sub: "And you're still here." },
  { main: "2 minutes in.", sub: "The algorithm is working." },
  { main: "Still going after 2 minutes.", sub: "You can stop anytime. You won't." },
];

export default function Feed() {
  const [items, setItems] = useState<FeedItemData[]>([
    { id: "init-1", type: "meme", contentUrl: "https://i.imgflip.com/1ur9b0.jpg", quality: "premium" },
    { id: "init-2", type: "ai", text: "You are aware of your blinking now.", quality: "premium" },
    { id: "init-3", type: "spike", text: "Stop. Don't scroll." }
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [idleText, setIdleText] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // ── Retention HUD ───────────────────────────────────────────
  const [sessionStreak, setSessionStreak] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  // HUD visibility: flashes on each scroll, fades after 2.5s
  const [hudVisible, setHudVisible] = useState(false);
  const hudTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Session time reveal ─────────────────────────────────────
  const [timeReveal, setTimeReveal] = useState<{ main: string; sub: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayPausedRef = useRef(false);

  const lastItemWeakRef = useRef(false);
  const lastTypesRef = useRef<string[]>(["meme", "ai", "spike"]);
  const itemsViewedRef = useRef(0);
  const sessionStartRef = useRef(Date.now());

  // ── On mount: load streak + schedule time reveal ─────────────
  useEffect(() => {
    const { streak } = loadAndUpdateStreak();
    setSessionStreak(streak);

    // Show session time reveal at exactly 2 minutes
    const revealTimer = setTimeout(() => {
      const msg = TIME_REVEALS[Math.floor(Math.random() * TIME_REVEALS.length)];
      setTimeReveal(msg);
      // Auto-dismiss after 4 seconds
      setTimeout(() => setTimeReveal(null), 4000);
    }, 120_000);

    return () => clearTimeout(revealTimer);
  }, []);

  // Flash HUD helper
  const flashHud = useCallback(() => {
    setHudVisible(true);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => setHudVisible(false), 2500);
  }, []);

  const getSubredditUrl = (isPremium = false) => {
    if (isPremium) return `https://meme-api.com/gimme/me_irl`;
    const subs = ["wholesomememes", "dankmemes", "me_irl"];
    const sub = subs[Math.floor(Math.random() * subs.length)];
    return `https://meme-api.com/gimme/${sub}`;
  };

  // ─────────────────────────────────────────────────────────────
  // Weighted type selector — probability-based, no fixed intervals
  // ─────────────────────────────────────────────────────────────
  const getNextTypeWeighted = useCallback((): string => {
    const viewed = itemsViewedRef.current;

    if (viewed > 4) {
      const specialRoll = Math.random();
      if (specialRoll < 0.07) return "rage";
      if (specialRoll < 0.13) return "vent";     // ~6%: frustration release
      if (specialRoll < 0.22) return "disrupt";
      if (specialRoll < 0.30) return "reset";
      if (specialRoll < 0.37) return "decision";
    }

    let type = "";
    for (let i = 0; i < 5; i++) {
      const rand = Math.random();
      if (rand < 0.38) type = "meme";
      else if (rand < 0.70) type = "ai";
      else if (rand < 0.82) type = "game";
      else type = "spike";

      const recent = lastTypesRef.current.slice(-2);
      if (!(recent.length === 2 && recent[0] === type && recent[1] === type)) break;
    }

    lastTypesRef.current.push(type);
    if (lastTypesRef.current.length > 5) lastTypesRef.current.shift();
    return type;
  }, []);

  const preloadImage = (url: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = url;
    });

  const fetchContent = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      let newItem: FeedItemData | null = null;
      const generateId = `item-${Date.now()}-${Math.random()}`;

      if (lastItemWeakRef.current || Math.random() < 0.15) {
        try {
          const res = await fetch(getSubredditUrl(true));
          const data = await res.json();
          if (!data.nsfw && (!data.url || !data.url.includes(".gif"))) {
            await preloadImage(data.url);
            newItem = { id: generateId, type: "meme", contentUrl: data.url, quality: "premium" };
            lastItemWeakRef.current = false;
            lastTypesRef.current.push("meme");
          }
        } catch (_) {}
      }

      if (!newItem) {
        const type = getNextTypeWeighted();

        if (type === "rage") {
          newItem = { id: generateId, type: "rage", quality: "premium" };
        } else if (type === "vent") {
          newItem = { id: generateId, type: "vent", quality: "premium" };
        } else if (type === "disrupt") {
          newItem = { id: generateId, type: "disrupt", text: getDisruptText(), quality: "average" };
        } else if (type === "decision") {
          newItem = { id: generateId, type: "decision", text: getDecisionText(), quality: "average" };
        } else if (type === "reset") {
          newItem = { id: generateId, type: "reset", text: getResetText(), quality: "average" };
        } else if (type === "meme") {
          try {
            const res = await fetch(getSubredditUrl());
            const data = await res.json();
            if (data.nsfw || (data.url && data.url.includes(".gif"))) {
              fetchingRef.current = false;
              return fetchContent();
            }
            await preloadImage(data.url);
            const isWeak = Math.random() < 0.3;
            lastItemWeakRef.current = isWeak;
            newItem = { id: generateId, type: "meme", contentUrl: data.url, quality: isWeak ? "weak" : "average" };
          } catch (_) {
            const aiData = getAIText(itemsViewedRef.current > 10);
            newItem = { id: generateId, type: "ai", text: aiData.text, quality: "average" };
          }
        } else if (type === "game") {
          if (itemsViewedRef.current > 4) {
            lastItemWeakRef.current = false;
            newItem = { id: generateId, type: "game", quality: "premium" };
          } else {
            const aiData = getAIText(itemsViewedRef.current > 10);
            newItem = { id: generateId, type: "ai", text: aiData.text, quality: "average" };
          }
        } else if (type === "spike") {
          lastItemWeakRef.current = false;
          newItem = {
            id: generateId, type: "spike",
            text: SPIKE_CONTENT[Math.floor(Math.random() * SPIKE_CONTENT.length)]
          };
        } else {
          try {
            const aiData = getAIText(itemsViewedRef.current > 10);
            const isWeak = Math.random() < 0.3;
            lastItemWeakRef.current = isWeak;
            newItem = { id: generateId, type: "ai", text: aiData.text, quality: isWeak ? "weak" : "average" };
          } catch (_) {
            newItem = { id: generateId, type: "ai", text: getStaticFallback(), quality: "average" };
          }
        }
      }

      if (newItem) setItems(prev => [...prev, newItem as FeedItemData]);
    } catch (_) {
      setItems(prev => [
        ...prev,
        { id: `item-fallback-${Date.now()}`, type: "ai", text: getStaticFallback(), quality: "average" }
      ]);
    } finally {
      fetchingRef.current = false;
    }
  }, [getNextTypeWeighted]);

  // Keep buffer >= 5 items
  useEffect(() => {
    const buffer = items.length - activeIndex;
    if (buffer < 5) fetchContent();
  }, [items.length, activeIndex, fetchContent]);

  // ─────────────────────────────────────────────────────────────
  // Sound engine — scroll whoosh always plays (low vol);
  // deeper/faster sounds as session escalates.
  // Sound toggle only controls the louder swipe click.
  // ─────────────────────────────────────────────────────────────
  const playScrollSound = useCallback((index: number) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Whoosh: filtered noise sweep
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      // Escalate pitch with depth: starts at 800Hz, climbs to 2000Hz
      const escalatedFreq = Math.min(800 + index * 60, 2000);
      filter.frequency.setValueAtTime(escalatedFreq, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(escalatedFreq * 0.4, ctx.currentTime + 0.12);
      filter.Q.value = 0.8;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      source.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  }, []);

  const playSwipeSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (_) {}
  }, [soundEnabled]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    if (showOverlay) setShowOverlay(false);

    const scrollPosition = containerRef.current.scrollTop;
    const windowHeight = window.innerHeight;
    const newIndex = Math.round(scrollPosition / windowHeight);

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      itemsViewedRef.current = newIndex;
      playScrollSound(newIndex); // whoosh — always on
      playSwipeSound();          // click — sound-toggle gated

      // Track session count + all-time count
      const newSessionCount = newIndex + 1;
      setSessionCount(newSessionCount);
      incrementTotalViewed();

      flashHud();
    }

    setIdleText("");
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    if (Math.random() < 0.6) {
      const trapDelay = 2000 + Math.random() * 3000;
      idleTimerRef.current = setTimeout(() => {
        const trapText = IDLE_TRAPS[Math.floor(Math.random() * IDLE_TRAPS.length)];
        setIdleText(trapText);
      }, trapDelay);
    }
  };

  const forceNextScroll = useCallback(() => {
    if (containerRef.current && activeIndex < items.length - 1) {
      const nextPosition = (activeIndex + 1) * window.innerHeight;
      containerRef.current.scrollTo({ top: nextPosition, behavior: "smooth" });
    }
  }, [activeIndex, items.length]);

  const handleRageComplete = useCallback(() => {
    autoPlayPausedRef.current = false;
    setTimeout(() => forceNextScroll(), 200);
  }, [forceNextScroll]);

  const handleVentComplete = useCallback(() => {
    autoPlayPausedRef.current = false;
    setTimeout(() => forceNextScroll(), 300);
  }, [forceNextScroll]);

  // Autoplay — pauses during rage
  useEffect(() => {
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);

    const currentItem = items[activeIndex];
    if (currentItem?.type === "rage" || currentItem?.type === "vent") {
      autoPlayPausedRef.current = true;
      return;
    }
    autoPlayPausedRef.current = false;

    let delay = 2000 + Math.random() * 2000;
    if (activeIndex > 0 && Math.random() < 0.15) {
      delay = 800 + Math.random() * 400;
    }

    autoPlayTimerRef.current = setTimeout(() => {
      if (!autoPlayPausedRef.current) forceNextScroll();
    }, delay);

    return () => { if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current); };
  }, [activeIndex, items, forceNextScroll]);

  return (
    <>
      {/* ── Main feed ─────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="h-[100dvh] w-full overflow-y-auto snap-y snap-mandatory style-none no-scrollbar relative"
        onScroll={handleScroll}
        onClick={() => { if (showOverlay) setShowOverlay(false); }}
      >
        {items.map((item, index) => (
          <FeedItem
            key={item.id}
            item={item}
            isActive={index === activeIndex}
            itemIndex={index}
            onDoubleTap={() => playSwipeSound()}
            onGameComplete={() => forceNextScroll()}
            onRageComplete={handleRageComplete}
            onVentComplete={handleVentComplete}
          />
        ))}
      </div>

      {/* ── Session HUD ───────────────────────────────────────── */}
      {/* Top-left: streak pill */}
      <AnimatePresence>
        {hudVisible && sessionStreak >= 2 && (
          <motion.div
            key="streak"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.25 }}
            className="fixed top-5 left-5 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 backdrop-blur-md border border-white/10"
          >
            <span className="text-base">🔥</span>
            <span className="text-white/80 text-xs font-bold tracking-wider">{sessionStreak} day streak</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom-left: session item counter */}
      <AnimatePresence>
        {hudVisible && sessionCount > 0 && (
          <motion.div
            key="count"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 left-6 z-30"
          >
            <span className="text-white/25 text-xs font-mono tracking-widest">
              #{sessionCount.toString().padStart(2, "0")}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Session time reveal (2-minute trigger) ────────────── */}
      <AnimatePresence>
        {timeReveal && (
          <motion.div
            key="time-reveal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-45 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none"
          >
            <p className="text-white text-2xl font-bold text-center px-8 tracking-tight leading-snug">
              {timeReveal.main}
            </p>
            <p className="text-white/50 text-base font-medium mt-3 tracking-wide">
              {timeReveal.sub}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Idle trap overlay ─────────────────────────────────── */}
      {idleText && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center bg-black/50 z-40 transition-opacity duration-500">
          <h1 className="text-white text-4xl font-bold tracking-widest uppercase drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] px-4 text-center">
            {idleText}
          </h1>
        </div>
      )}

      {/* ── Intro overlay ─────────────────────────────────────── */}
      {showOverlay && (
        <div className="fixed inset-0 flex items-center justify-center bg-black z-50 transition-opacity duration-1000 ease-out pointer-events-none">
          <h1 className="text-white text-3xl font-bold tracking-widest uppercase animate-pulse">
            Scroll. Don&#39;t think.
          </h1>
        </div>
      )}

      {/* ── Sound toggle ──────────────────────────────────────── */}
      <button
        onClick={e => { e.stopPropagation(); setSoundEnabled(!soundEnabled); }}
        className="fixed bottom-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors text-white outline-none"
        aria-label={soundEnabled ? "Mute sound" : "Enable sound"}
      >
        {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>
    </>
  );
}
