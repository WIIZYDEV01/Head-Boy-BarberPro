"use client";

import { useEffect, useRef, useState } from "react";

const POSTER =
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1400&q=55";
const VIDEO_SD = "https://videos.pexels.com/video-files/7697073/7697073-sd_640_360_30fps.mp4";

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const start = () => setSrc(VIDEO_SD);
    const idle = window.requestIdleCallback?.(start, { timeout: 1200 });
    const fallback = window.setTimeout(start, 400);
    return () => {
      if (idle) window.cancelIdleCallback?.(idle);
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    const play = () => {
      void video.play().catch(() => undefined);
    };
    play();
    const onVis = () => {
      if (document.hidden) video.pause();
      else play();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [src]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black" aria-hidden>
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url(${POSTER})` }}
      />
      {src ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full scale-105 object-cover"
          muted
          loop
          playsInline
          preload="metadata"
          poster={POSTER}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/62 to-black/88" />
    </div>
  );
}
