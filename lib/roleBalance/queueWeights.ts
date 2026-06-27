export type QueueCategory = "SOLO_DUO" | "FLEX" | "NORMAL";

// The queue categories a player can choose to include, in display order.
export const QUEUE_CATEGORIES: QueueCategory[] = ["SOLO_DUO", "FLEX", "NORMAL"];

// Human-readable labels for the queue selector UI.
export const QUEUE_CATEGORY_LABELS: { [category in QueueCategory]: string } = {
  SOLO_DUO: "Ranked Solo/Duo",
  FLEX: "Ranked Flex",
  NORMAL: "Normal Draft",
};

// Tunable: how representative each queue is of true role skill.
export const QUEUE_WEIGHTS: { [category in QueueCategory]: number } = {
  SOLO_DUO: 1.0,
  FLEX: 0.6,
  NORMAL: 0.3,
};

// Summoner's Rift queue ids we draw role history from. Only role-representative
// queues are tracked: ARAM/Arena/bots have no lane roles, and Blind Pick (430),
// Quickplay (490), and Swiftplay (480) are excluded as casual auto-fill modes.
const QUEUE_ID_TO_CATEGORY: { [queueId: number]: QueueCategory } = {
  420: "SOLO_DUO",
  440: "FLEX",
  400: "NORMAL", // normal draft pick
};

export const TRACKED_QUEUE_IDS: number[] = Object.keys(QUEUE_ID_TO_CATEGORY).map(
  (queueId) => Number(queueId)
);

export function queueCategory(queueId: number): QueueCategory | null {
  return QUEUE_ID_TO_CATEGORY[queueId] ?? null;
}
