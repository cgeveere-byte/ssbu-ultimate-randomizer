import { useEffect, useRef } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { loadUserState, saveUserState, type CloudPayload } from "@/lib/cloud-state";
import {
  ensureBuiltInProfiles,
  isBuiltInProfileId,
} from "@/lib/profiles";
import { useRandomizerStore } from "@/lib/store";

function snapshot(): CloudPayload {
  const s = useRandomizerStore.getState();
  return {
    version: 1,
    profiles: s.profiles.filter((p) => !isBuiltInProfileId(p.id)),
    activeProfileId: s.activeProfileId,
    perPlayerProfiles: s.perPlayerProfiles,
    playerProfileIds: s.playerProfileIds,
    playerCount: s.playerCount,
    uniqueOnly: s.uniqueOnly,
    quickRolls: s.quickRolls,
    history: s.history.slice(0, 80),
    stockGames: s.stockGames.slice(0, 200),
  };
}

function mergeById<T extends { id: string; at?: number; updatedAt?: number }>(
  local: T[],
  remote: T[],
): T[] {
  const map = new Map<string, T>();
  for (const item of [...local, ...remote]) {
    const prev = map.get(item.id);
    const nextStamp = item.updatedAt ?? item.at ?? 0;
    const prevStamp = prev ? (prev.updatedAt ?? prev.at ?? 0) : -1;
    if (!prev || nextStamp >= prevStamp) map.set(item.id, item);
  }
  return [...map.values()];
}

function applyRemote(payload: CloudPayload) {
  const local = useRandomizerStore.getState();
  const mergedCustom = mergeById(
    local.profiles.filter((p) => !isBuiltInProfileId(p.id)),
    payload.profiles.filter((p) => !isBuiltInProfileId(p.id)),
  );
  const profiles = ensureBuiltInProfiles(mergedCustom);
  const activeProfileId = profiles.some((p) => p.id === payload.activeProfileId)
    ? payload.activeProfileId
    : local.activeProfileId;
  const history = mergeById(local.history, payload.history)
    .sort((a, b) => b.at - a.at)
    .slice(0, 80);
  const stockGames = mergeById(local.stockGames, payload.stockGames)
    .sort((a, b) => b.at - a.at)
    .slice(0, 200);
  useRandomizerStore.setState({
    profiles,
    activeProfileId,
    perPlayerProfiles: payload.perPlayerProfiles,
    playerProfileIds: Array.from({ length: 8 }, (_, i) => payload.playerProfileIds[i] ?? null),
    playerCount: payload.playerCount,
    uniqueOnly: payload.uniqueOnly,
    quickRolls: payload.quickRolls,
    history,
    stockGames,
  });
}

function waitHydrated(): Promise<void> {
  if (useRandomizerStore.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = useRandomizerStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

/** Pulls / pushes randomizer data for the signed-in account. */
export function CloudSync() {
  const { user, isPending } = useCurrentUserState();
  const readyRef = useRef(false);
  const lastSent = useRef("");
  const userId = user && !user.isDevFallback ? user.id : null;

  useEffect(() => {
    if (isPending || !userId) {
      readyRef.current = false;
      return;
    }
    let cancelled = false;
    let timer = 0;

    const push = () => {
      if (!readyRef.current || cancelled) return;
      const json = JSON.stringify(snapshot());
      if (json === lastSent.current) return;
      lastSent.current = json;
      void saveUserState({ data: snapshot() }).catch(() => {
        lastSent.current = "";
      });
    };

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(push, 900);
    };

    const boot = async () => {
      await waitHydrated();
      if (cancelled) return;
      try {
        const remote = await loadUserState();
        if (cancelled) return;
        if (remote) applyRemote(remote);
        if (cancelled) return;
        await saveUserState({ data: snapshot() });
        lastSent.current = JSON.stringify(snapshot());
      } catch {
        /* signed out / network — keep local */
      }
      if (!cancelled) readyRef.current = true;
    };

    void boot();
    const unsub = useRandomizerStore.subscribe(schedule);
    return () => {
      cancelled = true;
      readyRef.current = false;
      window.clearTimeout(timer);
      unsub();
    };
  }, [userId, isPending]);

  return null;
}
