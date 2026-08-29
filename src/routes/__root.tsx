import { useEffect } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth/provider";
import { portraitUrls, preloadFighterPortraits } from "@/lib/roster";

export const Route = createRootRoute({
  head: () => ({
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
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
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
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}