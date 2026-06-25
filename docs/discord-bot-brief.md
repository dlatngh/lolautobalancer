# Discord bot integration brief

You are building a **Discord bot** in a separate directory/repo. It is a thin client for an
existing **League of Legends Autobalancer** web app (Next.js). The bot does NOT reimplement
any parsing, rank-fetching, MMR, or balancing logic — the web app owns all of that. The bot
only: takes a pasted lobby chat log, calls the web app's HTTP API, renders the resulting
teams in Discord, and offers a **Reroll** button.

## Desired flow

```
User pastes lobby join log in Discord
        │
        ▼
Bot ── POST {WEB_APP_BASE_URL}/api/balance  { chatLog, rankMode } ──► web app
        │                                    (parse → fetch ranks → balance)
        ◄── { teams, lobby } ───────────────────────────────────────┘
        │
Bot posts an embed showing team1 vs team2, with a [Reroll] button.
Bot caches `lobby` (keyed by the posted message id).
        │
User clicks [Reroll]
        ▼
Bot ── POST {WEB_APP_BASE_URL}/api/lobby/balance  { lobby: <cached> } ──► web app
        ◄── { teams } ──────────────────────────────────────────────────┘
        │
Bot edits the original message with the new teams.
```

**Why two endpoints:** the first call (`/api/balance`) does the expensive work — parse the
log and hit Riot for every player's rank. Reroll must NOT repeat that. The first response
returns the resolved `lobby` (every player's rank/level already fetched); the bot caches it
and reroll just re-balances that cached lobby via `/api/lobby/balance`. Rerolls are instant
and never touch Riot.

## Web app base URL

Production: `https://lolautobalancer.vercel.app`

NOTE: at the time of writing, `/api/balance` is implemented but **not yet deployed** — it
returns 404 on production until the web app's current changes are committed and pushed
(Vercel auto-deploys). Confirm `/api/balance` is live before relying on it. Use an env var
`WEB_APP_BASE_URL` so you can point at a local dev server (`http://localhost:3000`) while
testing.

## API contract

### IMPORTANT: status is in the body, not the HTTP code

These routes always return **HTTP 200**. The real status is the `status` field inside the
JSON body. Branch on `body.status`, not the HTTP status code.

### 1. Balance (initial) — `POST /api/balance`

Request:
```json
{
  "chatLog": "GameName #Tag joined the lobby\nOther #Tag joined the lobby\n...",
  "rankMode": "HIGHEST"
}
```
- `chatLog` (string, required): the raw pasted lobby log, exactly as copied from the LoL
  client. The web app parses player names from lines ending in `joined the lobby` and drops
  anyone whose line ends in `left the lobby`. The bot does NOT parse — send the raw text.
- `rankMode` (optional, defaults to `"HIGHEST"`): `"HIGHEST"` uses each player's highest
  rank across Solo/Duo and Flex; `"SOLO_DUO"` uses Solo/Duo only.

Success response:
```json
{
  "status": 200,
  "message": "success",
  "teams": { "team1": [ ... ], "team2": [ ... ] },
  "lobby": { "Name#TAG": { ...PlayerInfo }, ... }
}
```
Error responses (still HTTP 200):
```json
{ "status": 401, "message": "Unauthorized." }
{ "status": 400, "message": "Number of players must be 2 or more. ..." }
{ "status": 500, "message": "Internal Server Error." }
```
- `401`: the `X-Bot-Secret` header is missing or wrong (see Security note). Required.
- `400`: no players parsed, fewer than 2 players, or more than 10 players.

### 2. Reroll — `POST /api/lobby/balance`

Request (send back the exact `lobby` object from the balance response):
```json
{ "lobby": { "Name#TAG": { ...PlayerInfo }, ... } }
```
Success response:
```json
{
  "status": 200,
  "message": "success",
  "teams": { "team1": [ ... ], "team2": [ ... ] }
}
```

## Data shapes

```ts
type RankMode = "HIGHEST" | "SOLO_DUO";

type PlayerInfo = {
  tier: string;             // "GOLD", "DIAMOND", "MASTER", ... or "" if unranked
  division: string | null;  // "I".."IV", or "" / null for unranked and apex tiers
  leaguePoints: number | null;
  summonerLevel: number;
  profileIconId: number;
};

// team1/team2 are arrays of SINGLE-KEY objects: one player per object.
type BalancedTeams = {
  team1: { [playerName: string]: PlayerInfo }[];
  team2: { [playerName: string]: PlayerInfo }[];
};

type Lobby = { [playerName: string]: PlayerInfo };
```

To read a player out of a team entry:
```ts
const name = Object.keys(entry)[0];     // "Name#TAG"
const info = entry[name];               // PlayerInfo
```
Player names are `GameName#TAG` (Riot ID). Display them as-is.

## Reroll behavior to expect

The balancer randomizes among all team splits whose MMR gap is within a tolerance of the
fairest possible split. So:
- Rerolling a varied lobby gives different fair splits each time.
- If the lobby has only ONE split near the optimum, reroll returns the same teams every
  time. That is correct, not a bug. Do not treat identical reroll output as an error.

## Discord implementation notes (discord.js)

- **Trigger:** decide how the user supplies the chat log. A slash command with a multiline
  string option is awkward for long pastes; a **modal** (text input) triggered by a slash
  command, or reading a pasted message, tends to work better. (Open question — pick one.)
- **Rank mode:** let the user choose HIGHEST vs SOLO_DUO — a slash command option, a select
  menu, or a per-guild default. (Open question.)
- **Render:** an embed with two fields (Team 1 / Team 2), each listing players and their
  rank (`tier`/`division` from PlayerInfo). Unranked players have `tier === ""`.
- **Reroll button:** `ButtonBuilder` with a stable `customId` (e.g. `"reroll"`), in an
  `ActionRowBuilder`. Handle the button in an `interactionCreate` listener.
- **Lobby cache:** `Map<messageId, Lobby>`. On reroll, look up the lobby by the interaction's
  message id, call `/api/lobby/balance`, then `interaction.update(...)` the message.
  - Caveat: an in-memory map is lost on bot restart, so Reroll on old messages will stop
    working after a restart. Acceptable for a simple bot; persist (Redis/SQLite) only if you
    need rerolls to survive restarts.
- **Errors:** if `body.status !== 200`, show `body.message` to the user (ephemeral reply).
  Handle network failures and non-JSON responses defensively.

## Config / env (bot side)

```
DISCORD_TOKEN=...                # bot token
WEB_APP_BASE_URL=https://lolautobalancer.vercel.app
BOT_SHARED_SECRET=...            # REQUIRED — must match the web app's BOT_SHARED_SECRET
```

## Security note (REQUIRED header)

`/api/balance` makes the web app hit Riot on the caller's behalf, so it is gated by a
shared secret. **Every** request to `/api/balance` must include the header:

```
X-Bot-Secret: <the shared secret>
```

The value must equal the web app's `BOT_SHARED_SECRET` environment variable. Requests with
a missing or wrong header get `{ "status": 401, "message": "Unauthorized." }`. The reroll
endpoint `/api/lobby/balance` is NOT gated (it does no Riot fetch), so it needs no header.

## Out of scope (do NOT build in the bot)

- Chat-log parsing, Riot API calls, MMR calculation, team balancing — all owned by the web
  app. The bot only forwards the raw chat log and renders responses.

## Minimal pseudo-code

```ts
// on lobby submit
const res = await fetch(`${WEB_APP_BASE_URL}/api/balance`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Bot-Secret": process.env.BOT_SHARED_SECRET,
  },
  body: JSON.stringify({ chatLog, rankMode }),
});
const data = await res.json();
if (data.status !== 200) return replyError(data.message);
const message = await channel.send({ embeds: [renderTeams(data.teams)], components: [rerollRow] });
lobbyCache.set(message.id, data.lobby);

// on reroll button
const lobby = lobbyCache.get(interaction.message.id);
if (!lobby) return interaction.reply({ content: "This lobby expired.", ephemeral: true });
const res = await fetch(`${WEB_APP_BASE_URL}/api/lobby/balance`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ lobby }),
});
const data = await res.json();
if (data.status !== 200) return interaction.reply({ content: data.message, ephemeral: true });
await interaction.update({ embeds: [renderTeams(data.teams)], components: [rerollRow] });
```

## Open questions to resolve in the bot session

1. How does the user submit the chat log — slash command modal, pasted message, or other?
2. How is rank mode chosen — command option, select menu, or per-guild default?
3. Hosting for the bot (it must be a long-running process; Vercel serverless will not host a
   gateway bot — use a small always-on host).
