import { useEffect } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth/provider";
import { CloudSync } from "@/components/cloud-sync";
import { portraitUrls, preloadFighterPortraits } from "@/lib/roster";

function publicShareHost() {
  const raw = String(import.meta.env.VITE_PUBLIC_HOSTNAME ?? "").trim();
  const host = raw.replace(/^https?:\/\//, "").split("/")[0].split(":")[0].toLowerCase();
  if (!host || !host.includes(".") || !/^[a-z0-9.-]+$/.test(host)) return "";
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return "";
  if (
    host === "vercel.app" ||
    host.endsWith(".vercel.app") ||
    host === "vercel.com" ||
    host.endsWith(".vercel.com")
  ) {
    return "";
  }
  return host;
}

export const Route = createRootRoute({
  head: () => {
    const host = publicShareHost();
    const ogImage = host ? `https://${host}/og.jpg` : "";
    const xBanner = host ? `https://${host}/x-banner.jpg` : "";
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          title: "Smash Ultimate Randomizer — Weighted Character Select",
        },
        {
          name: "description",
          content:
            "Random Super Smash Bros. Ultimate character picker with per-fighter weights: never pick, rare, often, and favorites.",
        },
        ...(ogImage
          ? [
              { property: "og:image", content: ogImage },
              { property: "og:image:width", content: "1200" },
              { property: "og:image:height", content: "630" },
            ]
          : []),
        ...(xBanner ? [{ property: "x:game:image", content: xBanner }] : []),
      ],
      links: [
        { rel: "stylesheet", href: appCss },
      ],
    };
  },
  component: RootDocument,
});

function PortraitWarmup() {
  useEffect(() => {
    const kick = () => {
      void preloadFighterPortraits();
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(kick);
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(kick, 1);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 -z-10 h-px w-px overflow-hidden opacity-0"
    >
      {portraitUrls().map((src) => (
        <img
          key={src}
          src={src}
          alt=""
          width={1}
          height={1}
          decoding="async"
          loading="eager"
          fetchPriority="low"
        />
      ))}
    </div>
  );
}

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PortraitWarmup />
        <AuthProvider>
          <CloudSync />
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
