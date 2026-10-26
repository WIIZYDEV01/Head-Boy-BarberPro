"use client";

import { useEffect, useRef, useState } from "react";

const POSTER =
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1800&q=60";

const REEL = [
  "https://assets.mixkit.co/videos/43236/43236-720.mp4",
  "https://videos.pexels.com/video-files/7697107/7697107-hd_1920_1080_30fps.mp4",
  "https://videos.pexels.com/video-files/4177952/4177952-hd_1920_1080_30fps.mp4",
  "https://videos.pexels.com/video-files/8867156/8867156-hd_1920_1080_24fps.mp4",
  "https://videos.pexels.com/video-files/3209298/3209298-hd_1920_1080_25fps.mp4",
];

export function VideoBackground() {
  const videoA = useRef<HTMLVideoElement>(null);
  const videoB = useRef<HTMLVideoElement>(null);
  const indexRef = useRef(0);
  const showingA = useRef(true);
  const [ready, setReady] = useState(false);
  const [front, setFront] = useState<"a" | "b">("a");

  useEffect(() => {
    const start = () => setReady(true);
    const idle = window.requestIdleCallback?.(start, { timeout: 900 });
    const fallback = window.setTimeout(start, 250);
    return () => {
      if (idle) window.cancelIdleCallback?.(idle);
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const a = videoA.current;
    const b = videoB.current;
    if (!a || !b) return;

    a.src = REEL[0];
    a.load();
    const play = (el: HTMLVideoElement) => {
      void el.play().catch(() => undefined);
    };

    const onCanPlay = () => play(a);
    a.addEventListener("canplay", onCanPlay, { once: true });

    const advance = () => {
      indexRef.current = (indexRef.current + 1) % REEL.length;
      const next = showingA.current ? b : a;
      const current = showingA.current ? a : b;
      next.src = REEL[indexRef.current];
      next.load();
      const swap = () => {
        play(next);
        showingA.current = !showingA.current;
        setFront(showingA.current ? "a" : "b");
        window.setTimeout(() => {
          current.pause();
        }, 900);
      };
      next.addEventListener("canplay", swap, { once: true });
    };

    a.addEventListener("ended", advance);
    b.addEventListener("ended", advance);
    a.addEventListener("error", advance);
    b.addEventListener("error", advance);

    const onVis = () => {
      const live = showingA.current ? a : b;
      if (document.hidden) live.pause();
      else play(live);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      a.removeEventListener("canplay", onCanPlay);
      a.removeEventListener("ended", advance);
      b.removeEventListener("ended", advance);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ready]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black" aria-hidden>
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center"
        style={{ backgroundImage: `url(${POSTER})` }}
      />
      {ready ? (
        <>
          <video
            ref={videoA}
            className={`shop-reel absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              front === "a" ? "opacity-100" : "opacity-0"
            }`}
            muted
            playsInline
            preload="auto"
            poster={POSTER}
          />
          <video
            ref={videoB}
            className={`shop-reel absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              front === "b" ? "opacity-100" : "opacity-0"
            }`}
            muted
            playsInline
            preload="metadata"
          />
        </>
      ) : null}
      <div className="shop-vignette absolute inset-0" />
      <div className="shop-grain absolute inset-0 opacity-[0.18]" />
    </div>
  );
}
