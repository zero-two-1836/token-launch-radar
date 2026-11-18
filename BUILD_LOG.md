# Build log — token-launch-radar (make.fun bounty token-radar-01)

This file is an honest log of what was done in this build session. It is NOT a
session transcript and must NOT be submitted as one: the entry's transcripts have
to come from the real harness session logs (see "Still to do" below).

## What was built (2026-11-18, Asia/Jakarta)

- 12:30 WIB — downloaded the kit (`https://make.fun/c/token-radar-01/kit`), read
  RULES.txt, the snapshot (758 protocols, watchlist 40, floor $50M) and the starter.
- 12:31 WIB — designed model radar-2: category peer multiples (median mcap/TVL of
  tokenized peers, shrunk 10:1 toward the market median ×0.205, capped ×1.5),
  growth ×(1 + clamp(7d, −50, +100)/100 × 0.5), maturity 0.6–1.0 by age tracked,
  launch likelihood by category (structural 1%, staking pool 10%, versioned ×0.5).
- 12:32–12:35 WIB — wrote `lib/model.ts` (model + farm plans), `main.ts`,
  `dashboard/` (index.html, app.css, app.js), copied `vendor/makefun-board.ts`
  byte-for-byte from the kit and the MIT LICENSE from the starter.
- 12:35 WIB — first run: 342 rows, rank 1 Steakhouse Financial. Found the peer
  median was dragged down by zero-market-cap tokens; fixed the peer filter to
  require mcap > 0. Re-ran: rank 1 $1,028,342,009, total implied $6.25B.
- 12:32 WIB — installed Google Chrome 158 (the VM's bundled browser refused to
  start: "Hatch WebGL domain policy is required"). Rendered the three screenshots
  from the real dashboard at 1440×900 with headless Chrome: board, detail
  (Steakhouse Financial), filtered (category Dexs). Verified all three visually.
- 12:36 WIB — verification: two runs byte-identical (diff -r clean); all 7 gate
  rows pass with a local re-implementation of the documented checks
  (dashboard_files, board_file, sorted_by_value, coverage 40/40, farm_steps,
  screenshots 1440×900 ≤ 512 KiB, dossier_matches). Dossier text 33,123 bytes
  (cap 65,536). Dashboard source 32,859 bytes, no network URLs.

## Result

- Board: 342 rows (all pre-token protocols), ranks 1–342, 342 distinct implied
  values, 6 farm steps per row (132–201 chars each), watchlist 40/40 covered.
- Dashboard: sortable/filterable board, detail view per protocol with model
  breakdown + farm plan, live-token view (24), method page with peer table.
- Screenshots: 1-board.png (162 KB), 2-detail.png (198 KB), 3-filtered.png
  (152 KB), all 1440×900 PNG.
- Repo contents: main.ts, lib/model.ts, vendor/makefun-board.ts, dashboard/,
  screenshots/, LICENSE (MIT), README.md, .makefun/owner.json (wallet
  2eE5nut8A67iZk44FBrNs1NLuJdprnUV3R4dX8ffmsSg).

## Still to do (parent agent only — this subagent has no browser and no GitHub auth)

1. Create the GitHub repo `zero-two-1836/token-launch-radar` (public) and push
   this directory to it. `gh` is NOT authenticated in this VM; use the parent's
   browser or an authenticated `gh auth login`.
2. Set the repo About before submitting:
   `gh repo edit zero-two-1836/token-launch-radar --description 'Token launch radar: 342 pre-token protocols ranked by implied value. Built by an AI agent for make.fun'"'"'s "Build the best token launch radar" bounty, $1,325 in USDC.' --homepage 'https://make.fun/bounty/token-radar-01' --add-topic 'makefun,ai-agents,bounties,trading'`
3. Bundle the REAL session transcripts from the parent (Muse) session, which
   includes this subagent's session, with the kit CLI, attaching Muse usage
   rows (`--muse-usage`), then run the pre-submit check and submit:
   `node cli/makefun.mjs check --kit . --repo <repo> --transcripts transcripts.tar.gz`
   `node cli/makefun.mjs submit --competition token-radar-01 --repo-url https://github.com/zero-two-1836/token-launch-radar --commit <sha> --title "Token Launch Radar: 342 pre-token protocols by peer-multiple value" --bundle transcripts.tar.gz --keypair wallet.json`
   Do NOT hand-write a session file: this competition's handed_over_places is
   "none", so a handed-over session ranks but takes NO paid place.
4. No entry fee, no payment was made anywhere in this build.

## radar-3 improvement (2026-11-18 ~19:40 WIB, second build session)

Why: the live dev rank was #1788 of 11,489, and the user ordered the rank up to top 10. The
judge is pairwise on five criteria in order (working radar, value model from snapshot figures,
concrete farm plans with costs/times, dashboard usability, visual polish), reading only the
three screenshots plus dashboard/ source through dossier.json — lib/model.ts itself is NOT in
the dossier, so the model must be visible in app.js's method section and in the screenshots.

What was wrong with radar-2 (found by reading the snapshot, not by guessing):
- Risk Curators' peer multiple (0.4729) came from ONE tokenized peer trading at 2.97x its TVL,
  and Prediction Market's capped 1.5x came from ONE peer at 400x its TVL. The top of the board
  (ranks 1-3 all Risk Curators, #4 Polymarket at the 1.5x cap) rested on two outlier peers.
- Farm plans priced gas flat ("about $2 of gas a week") for every chain: wrong on Base (cents)
  and wrong on Ethereum mainnet (real money).

What radar-3 changes (lib/model.ts + dashboard/app.js, same rules in both so page and board agree):
- Peer ratios winsorized at the market's 90th percentile (x2.975 here): the 400x peer no longer
  sets a category. Prior weight scales with peer count: 30 for one peer, 20 for two, 10 for
  three or more. Risk Curators multiple 0.4729 -> 0.3115; Prediction Market 1.5 -> 0.3115.
- Farm plans price gas from the protocol's own first chain (Ethereum ~$8/tx, L2s ~$0.50,
  Solana-family under $0.10) and each weekly step now names what to track for its category.
- Method section in app.js states both guards; peer grid shows each category's prior.
- Fixed two wording bugs found while verifying: "under under $0.10 of gas" and "into a Upshift vault".

Result (same snapshot, two runs byte-identical, all 7 gate rows pass, dossier text 37,170 bytes
of the 65,536 cap):
- Board: still 342 rows, watchlist 40/40, 342 distinct implied values, 0 farm steps out of range.
- Rank 1 Steakhouse Financial $1,028M -> $677M; rank 2 Sentora $988M -> $651M; rank 3 Gauntlet
  $612M -> $403M; Polymarket #4 $478M -> #6 $99M; Veda #5 $235M -> #4 $254M; USDD stays #5
  $180M. Total implied $6.25B -> $4.66B.
- Screenshots re-rendered from the real dashboard at 1440x900 with Google Chrome 158 (installed
  via the .deb from dl.google.com; the VM's bundled browser refuses to start: "Hatch WebGL domain
  policy is required"). All three verified visually: board ($4.66B, $677.4M rank 1), detail
  (peer multiple x0.311, chain-aware gas, tracking note), filtered Dexs (26 rows, ranks 10/24/66).

Honest limit, for the parent: the kit publishes NO scorer or judge, so there is no local judge
score to report — the only measurable local signals are the gate (pass), determinism (pass) and
the board/model sanity above. The new dev rate is only known after a resubmit + server dev grade.
Top 10 (top 0.09% of 11,489; the final shortlist is 40) is not a realistic expectation from this
change alone: radar-3 fixes a real model flaw and is strictly better on criteria 2 and 3, but the
gap from #1788 to top 10 spans thousands of entries and the final is a fresh pairwise tournament
among the shortlist. What radar-3 credibly does is raise the dev win rate against the house
dashboards; whether that reaches the shortlist line is decided by the server grade, not here.

