/** Bump by prepending an entry. `APP_VERSION` is always the newest version. */
export const CHANGELOG: { version: number; date: string; notes: string[] }[] = [
  {
    version: 12,
    date: "2026-09-24",
    notes: ["Version number in the header. Tap it for this changelog."],
  },
  {
    version: 11,
    date: "2026-09-19",
    notes: ["Chris and Wristaker built-in weights updated."],
  },
  {
    version: 10,
    date: "2026-09-18",
    notes: [
      "Portrait Face-Off: Roll is the left two-thirds of the old stocks row.",
      "The right third opens a stocks sheet. Set yours and your opponent’s from your own side.",
    ],
  },
  {
    version: 9,
    date: "2026-09-11",
    notes: ["Large translucent Roll button on each Face-Off half."],
  },
  {
    version: 8,
    date: "2026-09-05",
    notes: ["Chris and Wristaker built-in weights updated."],
  },
  {
    version: 7,
    date: "2026-09-03",
    notes: [
      "Freestyle sits just right of Mii Gunner.",
      "Freestyle is a pool toggle at ×1. Landing on it lets that player pick anyone.",
    ],
  },
  {
    version: 6,
    date: "2026-09-02",
    notes: [
      "Chris and Wristaker built-in weights updated.",
      "Per-fighter eye lines, with a Gallery editor to retune them.",
      "Wide portraits stay centered on the eyes.",
    ],
  },
];

export const APP_VERSION = CHANGELOG[0]!.version;
