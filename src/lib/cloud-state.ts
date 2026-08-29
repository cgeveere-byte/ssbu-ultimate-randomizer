import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  type WeightProfile,
  isBuiltInProfileId,
  normalizeWeights,
} from "@/lib/profiles";
import type { PickRecord, StockGame } from "@/lib/store";

export type CloudPayload = {
  version: 1;
  profiles: WeightProfile[];
  activeProfileId: string;
  perPlayerProfiles: boolean;
  playerProfileIds: (string | null)[];
  playerCount: number;
  uniqueOnly: boolean;
  quickRolls: boolean;
  history: PickRecord[];
  stockGames: StockGame[];
};

const profileSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
  weights: z.record(z.string(), z.number()),
  updatedAt: z.number(),
});

const pickSchema = z.object({
  id: z.string(),
  fighterIds: z.array(z.string()),
  profileNames: z.array(z.string()),
  at: z.number(),
});

const stockSchema = z.object({
  id: z.string(),
  at: z.number(),
  p1FighterId: z.string(),
  p2FighterId: z.string(),
  p1Stocks: z.number(),
  p2Stocks: z.number(),
  timedOut: z.boolean(),
});

const payloadSchema = z.object({
  version: z.literal(1),
  profiles: z.array(profileSchema).max(40),
  activeProfileId: z.string().max(80),
  perPlayerProfiles: z.boolean(),
  playerProfileIds: z.array(z.string().nullable()).max(8),
  playerCount: z.number().int().min(1).max(8),
  uniqueOnly: z.boolean(),
  quickRolls: z.boolean(),
  history: z.array(pickSchema).max(80),
  stockGames: z.array(stockSchema).max(200),
});

function sanitize(raw: CloudPayload): CloudPayload {
  const parsed = payloadSchema.parse(raw);
  return {
    ...parsed,
    profiles: parsed.profiles
      .filter((p) => !isBuiltInProfileId(p.id))
      .map((p) => ({
        ...p,
        weights: normalizeWeights(p.weights),
      })),
    playerProfileIds: Array.from({ length: 8 }, (_, i) => parsed.playerProfileIds[i] ?? null),
  };
}

export const loadUserState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<CloudPayload | null> => {
    const sql = await getSql();
    const rows = await sql<{ payload: string }>`
      select payload from user_randomizer_state where user_id = ${context.userId} limit 1
    `;
    const raw = rows[0]?.payload;
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as CloudPayload;
      return sanitize(parsed);
    } catch {
      return null;
    }
  });

export const saveUserState = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: CloudPayload) => sanitize(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const text = JSON.stringify(data);
    await sql`
      insert into user_randomizer_state (user_id, payload, updated_at)
      values (${context.userId}, ${text}, now())
      on conflict (user_id) do update
      set payload = excluded.payload, updated_at = now()
    `;
    return { ok: true as const };
  });
