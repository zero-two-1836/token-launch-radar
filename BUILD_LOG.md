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

## radar-4 improvement (2026-11-19, third build session)

Why: the live rank was #5122 of 12,953 (judge 882,790; rank 1 is 965,989), and the user ordered
the rank up to top 10, never below 500. The judge is pairwise on five criteria in order (working
radar, value model from snapshot figures, concrete farm plans with costs/times, dashboard
usability, visual polish), reading only the three screenshots plus dashboard/ source through
dossier.json — lib/model.ts itself is NOT in the dossier, so the model must be visible in
app.js's method section, the detail view and the screenshots.

What radar-4 changes (lib/model.ts + dashboard/app.js + app.css, same rules in both so page and
board agree):
- The model now uses EVERY figure the snapshot carries. Chain breadth: each extra live chain up
  to ten adds 1% (x1.00 single-chain to x1.10 for eleven or more chains) — the chains array was
  the last snapshot field the model had not used. Category momentum: each category's TVL-weighted
  seven-day change, clamped to -20%…+50% and weighted 0.25, so a protocol in a hot sector is worth
  up to 12.5% more and one in a cold sector up to 5% less. Both are the snapshot's own numbers.
- Farm plans now total their cost: capital plus every dollar of gas over the hold period (first
  transaction, then one week of activity per week held), priced from the protocol's own first
  chain, and the implied value per dollar of that total, so a cheap farm on an L2 can be compared
  with a dear one on Ethereum mainnet. The detail view shows the cost table; the method section
  explains it. The value-per-dollar is labelled as a comparison figure, not a payout.
- The detail screenshot is now 1440x1400 so the whole detail view shows: the 8-row model
  breakdown, the farm-cost table, and all six farm steps. The dialog spacing was tightened and
  the overlay padding reduced so the content fits. Board and filtered screenshots re-rendered
  from the new dashboard at 1440x900 with Google Chrome 158 (installed via the .deb; the VM's
  bundled browser refuses to start: "Hatch WebGL domain policy is required").

Result (same snapshot, two runs byte-identical, all 7 gate rows pass, dossier text 39,671 bytes
of the 65,536 cap, dossier 895,241 bytes of the 1.5 MiB cap):
- Board: still 342 rows, watchlist 40/40, 342 distinct implied values, 0 farm steps out of range.
- Rank 1 Steakhouse Financial $677M -> $745M (11 chains, x1.10); rank 2 Sentora $651M -> $670M;
  rank 3 Gauntlet $403M -> $444M; Veda $254M -> $277M; USDD $180M -> $180M; Upshift #8 -> #6
  $99.5M; Polymarket #6 -> #7 $98.8M; RockawayX #11 -> #10 $67.1M; Bittensor dTAO #10 -> #11.
  Total implied $4.66B -> $4.86B. Top-10 overlap with radar-3 is 9/10; rank moves are +/-2.
- Farm costs now visible: Steakhouse $155.50 total ($150 capital + $5.50 gas on Base) at
  $4,789,772.14 implied per $1 farmed; Sentora $208.00 (Ethereum first chain: $8 + $10/week).
- Screenshots re-rendered from the real dashboard and verified visually: board ($4.86B, $744.8M
  rank 1), detail (8-row breakdown incl. chain x1.100 and momentum x1.000, cost table, all 6
  farm steps), filtered Dexs (26 rows, ranks 11/26/67).

Honest limit, for the parent: as with radar-3, there is no local judge score — the only
measurable local signals are the gate, determinism and the board/model sanity above. The two new
factors are deliberately modest (chain at most +10%, momentum at most +12.5% / -5%) so the board
does not reshuffle on a weak signal; what they credibly do is make the value model use every
snapshot figure (criterion 2) and make farm costs concrete and comparable (criterion 3), with
the full detail view now visible in the screenshot the judge reads first. Whether that lifts
the dev rate from #5122 toward the shortlist line is decided by the server grade, not here.


## radar-5 — round 6 improvement (2026-11-22, fourth build session)

Why: the live dev rank was #7,252 of 15,909 and the user ordered every entry improved
toward the top ("pecut terus sampe top 10"). The judge is pairwise on five criteria in
order (working radar, value model from the snapshot's own figures, concrete farm plans
with costs and times, dashboard usability, visual polish), reading the three screenshots
plus dashboard/ source through dossier.json. Worked in a copy at repo-r6; the submitted
entry/ tree was not touched.

What radar-5 changes (lib/model.ts + dashboard/app.js + app.css, same rules in model and
page so board, screenshots and code agree):
- Sector momentum is now leave-one-out: a protocol's own seven-day change is removed from
  its category's TVL-weighted average before its momentum factor is taken, so no protocol's
  week is counted twice (once in its own growth factor, again in its sector's). Spot-checked:
  sole-reporter categories (3Jane, Boros, 100% of their category's reporting TVL) now score a
  neutral sector 0.00% instead of their own +26.3% / -10.4%; a 96%-share protocol scores the
  rest of its category (-17.12%) instead of the whole-category figure (-19.47%).
- Peer medians are true medians (mean of the two middle ratios on an even peer count)
  instead of the upper middle ratio. Market-wide median x0.205 -> x0.214; total implied
  $4.86B -> $4.64B; top 10 unchanged in membership, values shift by at most ~7%.
- Farm plans run to seven steps and close their own books, all figures from farmCostFor so
  the plan and the detail cost table cannot disagree: step 1 funds the wallet with the plan's
  exact total (capital + gas), step 3 totals the gas across the whole hold, and step 7 states
  the all-in cost (capital, gas, active minutes) with the exit day and the leave condition.
  Verified: the detail view's rendered steps equal board.json's farm_steps byte for byte.
- The board itself now carries the farm economics: a sortable "Per $1 farmed" column with
  each farm's all-in cost under it, a log-scale value bar under each implied value, and the
  top 3 ranks highlighted. The detail view adds a sensitivity line (the same record priced
  at the market-wide median multiple: Steakhouse $725.7M -> $512.2M), and the method section
  adds a worked example computed from rank 1's own figures in the page.
- Screenshots re-rendered at 1440x1440 (Playwright Chromium; the VM's bundled browser still
  refuses with the WebGL policy error): board 253 KB and filtered 254 KB (were 162/157 KB at
  1440x900, below the rules' 300-350 KB guidance), detail 357 KB showing the whole view —
  8-row model breakdown, sensitivity, cost table, all 7 farm steps and the closing note —
  after tightening the dialog spacing so nothing is cut.

Result (same snapshot, two runs byte-identical, all 7 gate rows pass on a local
re-implementation, dossier 1,197,112 bytes of the 1.5 MiB cap, dossier text 43,542 of the
65,536 cap so the judge reads the whole dashboard source; dashboard source 43,278 bytes):
- Board: still 342 rows, watchlist 40/40, 342 distinct implied values, 7 farm steps per row
  (135-411 chars each), 0 steps out of range.
- Rank 1 Steakhouse Financial $745M -> $726M; Sentora $670M -> $650M; Gauntlet $444M ->
  $430M; Veda $277M -> $266M; USDD $180M -> $173M; total implied $4.64B.
- Kit check on the committed tree: 4 passed (competition_open, snapshot, license_osi,
  entrypoint), 1 failed = transcripts_present only, which is the parent's bundling step.

Honest limit, for the parent: as with radar-3/4 there is no local judge score — the
measurable signals are the gate (pass), determinism (pass), page/board agreement (pass) and
the model sanity above. radar-5 removes a real double-count in the model (criterion 2),
makes every farm plan state its exact funding and all-in total (criterion 3), and puts the
farm economics on the board itself (criteria 4-5). Whether that lifts the dev rate from
#7,252 toward the shortlist line (place 40) is decided by the server grade, not here.
