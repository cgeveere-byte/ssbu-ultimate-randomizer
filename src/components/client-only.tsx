import { useEffect, useState, type ReactNode } from "react";

/** Avoid SSR/client mismatch for localStorage-backed UI. */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <>{fallback}</>;
  return <>{children}</>;
}
