# token-launch-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/zero-two-1836/token-launch-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/zero-two-1836/token-launch-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Launch Radar (model radar-5): every pre-token protocol in the sealed DefiLlama snapshot — all 342 of them, watchlist included — ranked by what its token launch would be worth, with a seven-step farm plan for each one. The value is a peer-multiple model built from the snapshot itself: each category's true median market-cap / TVL among its tokenized protocols, winsorized at the market's 90th percentile and shrunk toward the market median with a prior weight that grows when a category has few peers (30 for one peer, 20 for two, 10 for three or more), times seven-day growth, maturity with no token, chain breadth (each extra live chain up to ten adds 1%), sector momentum (the category's TVL-weighted seven-day change, measured leave-one-out so a protocol's own week is never counted twice, up to +12.5% in a hot sector and −5% in a cold one), and a launch likelihood set by category (an exchange, bridge or wrapped/staked product prices at 1%). The model uses every figure the snapshot carries. Farm plans price gas from the protocol's own first chain, name what to track week to week, and close their own books: the first step funds the wallet with the plan's exact total and the last states the all-in cost — capital, gas and active minutes — with the exit day. The board itself carries each farm's total cost and the implied value per dollar of it, so a cheap farm on an L2 can be compared with a dear one on Ethereum mainnet without opening a row. The dashboard is a static offline page: a sortable, filterable board, a detail view with the model breakdown, a market-median sensitivity figure, farm cost and farm plan for every protocol, a live-token reference view, and the method in full with a worked example taken from rank 1's own figures.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input path/to/snapshot.json
```

Node 22 or later, standard library only, no install. The program reads the sealed snapshot, writes `board.json` (342 rows), `data.js`, the dashboard and the dossier to the output directory, deterministically: two runs write the same bytes.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ymfx8s8x&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
