-- Per-user randomizer snapshot (profiles, prefs, history, matchup stocks).
create table if not exists user_randomizer_state (
  user_id text primary key,
  payload text not null,
  updated_at timestamptz not null default now()
);
