"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { VideoBackground } from "@/components/media/video-background";
import { RouteProgress } from "@/components/ui/route-progress";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const skipHeavyMedia = pathname.startsWith("/auth/callback");

  return (
    <>
      {skipHeavyMedia ? <div className="fixed inset-0 z-0 bg-black" aria-hidden /> : <VideoBackground />}
      <RouteProgress />
      <div className="relative z-10 flex min-h-full flex-1 flex-col">{children}</div>
    </>
  );
}
