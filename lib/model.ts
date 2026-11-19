// The token radar's model, version radar-4: one snapshot of the protocol universe in, one ranked
// board out. Every pre-token protocol in the snapshot is scored — all 342 of them, not just the
// 40 on the watchlist — so the board is the whole pre-token universe, ranked by what a launch
// would be worth.
//
// Implied value follows only from the snapshot's own figures, never from a hand-kept list of
// names. The same function scores every protocol:
//
//   peer multiple = the median market-cap / TVL of the tokenized protocols in the same
//                     category, shrunk toward the market-wide median and capped at 1.5,
//                     floored at 0.02. Two guards keep one odd peer from setting a whole
//                     category: each peer's ratio is first capped at the market's 90th
//                     percentile (a tiny-TVL token trading at 400x its TVL cannot set the
//                     multiple for every protocol in its category), and the prior weight
//                     grows when a category has few peers (30 for one peer, 20 for two,
//                     10 for three or more), so a one-peer category leans almost entirely
//                     on the market median. A category with no tokenized peer uses the
//                     market median outright.
//   growth        = clamp(change_7d, -50, +100) per cent
//   growthMult    = 1 + (growth / 100) x 0.5
//   maturity      = 0.6 + min(age_days, 1095) / 1095 x 0.4   (age unknown: 365 days)
//   chains        = 1 + min(chains_live - 1, 10) x 0.01, so a protocol live on many chains
//                     is worth up to 10% more than a single-chain one: more chains means more
//                     users to reward, and the count is the snapshot's own field, the last one
//                     the model had not used yet. A protocol on one chain scores x1.00.
//   momentum      = 1 + clamp(category TVL-weighted 7-day change, -20, +50) / 100 x 0.25,
//                     so a protocol in a category whose money is growing fast is worth up to
//                     12.5% more, and one in a shrinking category up to 5% less. The sector's
//                     heat is the snapshot's own seven-day figures, aggregated by category.
//   likelihood    = 1.0, except a protocol whose category makes a launch structural nonsense
//                     (an exchange, a bridge, a wrapped or staked product of a token that
//                     already trades): 0.01; a staking pool: 0.10; a versioned name (a pool of
//                     another protocol): half again. The category, not the name, decides.
//   implied       = max(1, round(tvl_usd x peer multiple x growthMult x maturity x chains
//                     x momentum x likelihood))
//
// A launch is the token a protocol may issue one day. This model prices the token if it launched
// with the protocol's record as it stands; it never predicts whether or when a token is issued.
// "Records no token" is DefiLlama's record, never proof a protocol has none.
//
// radar-4 changes over radar-3: the model now uses every figure the snapshot carries. Chain
// breadth (the chains array) adds up to 10% for protocols live on many chains, and category
// momentum (the TVL-weighted seven-day change of the protocol's own category) adds up to 12.5%
// in a hot sector and takes up to 5% in a cold one. Farm plans now carry a total cost: the
// capital plus every dollar of gas over the hold period, and the implied value per dollar of
// that total, so a reader can compare what a farm costs against what its launch would be worth.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them. */
export interface ModelConstants {
  peer_prior_weight: number;
  peer_prior_thin_extra: number;
  peer_prior_thin_below: number;
  peer_winsor_percentile: number;
  peer_cap: number;
  peer_floor: number;
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_days: number;
  unknown_age_days: number;
  chain_breadth_step: number;
  chain_breadth_cap: number;
  momentum_weight: number;
  momentum_floor: number;
  momentum_cap: number;
  structural_likelihood: number;
  staking_pool_likelihood: number;
}

export const MODEL: ModelConstants = {
  peer_prior_weight: 10,
  peer_prior_thin_extra: 10,
  peer_prior_thin_below: 3,
  peer_winsor_percentile: 90,
  peer_cap: 1.5,
  peer_floor: 0.02,
  growth_weight: 0.5,
  growth_floor: -50,
  growth_cap: 100,
  maturity_floor: 0.6,
  maturity_range: 0.4,
  maturity_days: 1095,
  unknown_age_days: 365,
  chain_breadth_step: 0.01,
  chain_breadth_cap: 10,
  momentum_weight: 0.25,
  momentum_floor: -20,
  momentum_cap: 50,
  structural_likelihood: 0.01,
  staking_pool_likelihood: 0.1,
};

/** The model's version label: the dashboard names it. */
export const MODEL_VERSION = 'radar-4';

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  age_days: number | null;
  implied_value_usd: number;
  model: {
    peer_multiple: number;
    peer_count: number;
    growth_pct: number;
    growth_multiplier: number;
    maturity_multiplier: number;
    chain_multiplier: number;
    chain_count: number;
    momentum_multiplier: number;
    category_growth_pct: number;
    likelihood: number;
    likelihood_reason: string;
    age_days: number | null;
    farm_capital_usd: number;
    farm_gas_total_usd: number;
    farm_total_cost_usd: number;
    farm_value_per_dollar: number;
  };
  farm_steps: string[];
}

/** The dashboard's compact view of one row, with farm plans generated in the page. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  peer_multiple: number;
  peer_count: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  chain_multiplier: number;
  chain_count: number;
  momentum_multiplier: number;
  category_growth_pct: number;
  likelihood: number;
  likelihood_reason: string;
  farm_capital_usd: number;
  farm_gas_total_usd: number;
  farm_total_cost_usd: number;
  farm_value_per_dollar: number;
  watchlist: boolean;
}

/** A live-token protocol: it already trades, so the board shows the market's own value. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
}

/** One category's peer multiple, for the dashboard's methodology table. */
export interface PeerRow {
  category: string;
  peers: number;
  median: number | null;
  multiple: number;
  prior: number;
  growth_pct: number;
  protocols: number;
}

/** Everything the dashboard needs: the board, the live set, the peers and the model. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  watchlist_size: number;
  board_size: number;
  live_size: number;
  total_implied_usd: number;
  peers: PeerRow[];
  global_multiple: number;
  peer_winsor_cap: number;
  rows: RadarRow[];
  live: LiveRow[];
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** The median of a non-empty list of numbers. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** Categories whose token would price the underlying asset, not a new launch. */
const STRUCTURAL = new Set(['CEX', 'Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC']);

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/** The prior weight a category's multiple leans on: thin categories lean harder on the market. */
export function priorFor(peerCount: number, model: ModelConstants = MODEL): number {
  const thin = Math.max(0, model.peer_prior_thin_below - peerCount);
  return model.peer_prior_weight + thin * model.peer_prior_thin_extra;
}

/**
 * The peer multiples: for every category, the median market-cap / TVL of its tokenized
 * protocols, shrunk toward the market-wide median. Built from the snapshot alone.
 *
 * Two guards keep one odd peer from setting a whole category. First, every peer's ratio is
 * capped at the market's 90th percentile before the median is taken: a tiny-TVL token trading
 * at 400x its TVL is one protocol's story, not its category's multiple. Second, the prior
 * weight grows when a category has few peers, so a one-peer category leans almost entirely
 * on the market median instead of on that one peer.
 */
export function peerTable(snapshot: Snapshot, model: ModelConstants = MODEL): { peers: PeerRow[]; global: number; winsorCap: number } {
  const tokenized = snapshot.protocols.filter((p) => p.mcap_usd !== null && p.mcap_usd > 0 && p.tvl_usd > 0);
  const ratios = tokenized.map((p) => p.mcap_usd! / p.tvl_usd);
  const global = tokenized.length > 0 ? median(ratios) : 0.2;
  // The winsor cap: the market's 90th percentile of mcap / TVL, so the median of a category
  // can never be set by a ratio above what nine in ten tokenized protocols trade at.
  const sorted = [...ratios].sort((a, b) => a - b);
  const winsorCap = sorted.length > 0 ? sorted[Math.min(sorted.length - 1, Math.floor((model.peer_winsor_percentile / 100) * sorted.length))]! : 1;
  const capped = (r: number): number => Math.min(r, winsorCap);
  const byCategory = new Map<string, number[]>();
  for (const p of tokenized) {
    const list = byCategory.get(p.category ?? 'Uncategorized') ?? [];
    list.push(capped(p.mcap_usd! / p.tvl_usd));
    byCategory.set(p.category ?? 'Uncategorized', list);
  }
  const categories = new Set(snapshot.protocols.map((p) => p.category ?? 'Uncategorized'));
  const momentum = categoryMomentum(snapshot);
  const peers: PeerRow[] = [...categories].sort().map((category) => {
    const list = byCategory.get(category);
    const growth = momentum.get(category) ?? 0;
    const count = snapshot.protocols.filter((p) => (p.category ?? 'Uncategorized') === category).length;
    if (list === undefined || list.length === 0) {
      return { category, peers: 0, median: null, multiple: round4(global), prior: priorFor(0, model), growth_pct: round4(growth), protocols: count };
    }
    const med = median(list);
    const prior = priorFor(list.length, model);
    const multiple = Math.min(model.peer_cap, Math.max(model.peer_floor, (list.length * med + prior * global) / (list.length + prior)));
    return { category, peers: list.length, median: round4(med), multiple: round4(multiple), prior, growth_pct: round4(growth), protocols: count };
  });
  return { peers, global: round4(global), winsorCap: round4(winsorCap) };
}

/**
 * Each category's seven-day momentum: the TVL-weighted mean of its protocols' seven-day
 * TVL change, from the snapshot alone. A category whose money is growing fast is a hot
 * sector; one whose money is leaving is cold. Protocols with no reported change are left
 * out of their category's average instead of counted as flat.
 */
export function categoryMomentum(snapshot: Snapshot): Map<string, number> {
  const out = new Map<string, number>();
  const byCategory = new Map<string, { tvl: number; weighted: number }>();
  for (const p of snapshot.protocols) {
    if (p.change_7d === null || !Number.isFinite(p.change_7d)) continue;
    const key = p.category ?? 'Uncategorized';
    const cur = byCategory.get(key) ?? { tvl: 0, weighted: 0 };
    cur.tvl += p.tvl_usd;
    cur.weighted += p.tvl_usd * p.change_7d;
    byCategory.set(key, cur);
  }
  for (const [key, v] of byCategory) out.set(key, v.tvl > 0 ? v.weighted / v.tvl : 0);
  return out;
}

/** A protocol's chain-breadth multiplier: more live chains, more users to reward, up to +10%. */
export function chainMultiplier(chainCount: number, model: ModelConstants = MODEL): number {
  const extra = Math.min(Math.max(chainCount - 1, 0), model.chain_breadth_cap);
  return round4(1 + extra * model.chain_breadth_step);
}

/** A category's momentum multiplier: a hot sector lifts its protocols, a cold one trims them. */
export function momentumMultiplier(categoryGrowthPct: number, model: ModelConstants = MODEL): number {
  const clamped = Math.min(model.momentum_cap, Math.max(model.momentum_floor, categoryGrowthPct));
  return round4(1 + (clamped / 100) * model.momentum_weight);
}

/** A protocol's launch likelihood and the reason, from its category and name shape only. */
export function likelihoodOf(p: SnapshotProtocol, model: ModelConstants = MODEL): { likelihood: number; reason: string } {
  const category = p.category ?? 'Uncategorized';
  let likelihood = 1;
  let reason = 'Core protocol: its category launches tokens, so a launch is priced at full weight.';
  if (STRUCTURAL.has(category)) {
    likelihood = model.structural_likelihood;
    reason = 'Structural: an exchange, bridge or wrapped/staked product — its value is the underlying asset, not a new token, so a launch is priced at 1%.';
  } else if (category === 'Staking Pool') {
    likelihood = model.staking_pool_likelihood;
    reason = 'Staking pool: pools rarely issue their own token, so a launch is priced at 10%.';
  }
  if (VERSIONED.test(p.name)) {
    likelihood *= 0.5;
    reason += ' Versioned name: a pool of another protocol, so the weight is halved again.';
  }
  return { likelihood, reason };
}

/** The multipliers and the implied value one protocol gets under `model`. */
export function impliedValue(
  protocol: SnapshotProtocol,
  asOf: string,
  peerByCategory: Map<string, PeerRow>,
  globalMultiple: number,
  momentumByCategory: Map<string, number>,
  model: ModelConstants = MODEL,
): { implied: number; multiple: number; peerCount: number; growthPct: number; growthMult: number; maturityMult: number; chainMult: number; chainCount: number; momentumMult: number; categoryGrowth: number; likelihood: number; reason: string; age: number | null } {
  const age = ageDays(asOf, protocol.listed_at);
  const rawGrowth = finite(protocol.change_7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  const growthMult = 1 + (growthPct / 100) * model.growth_weight;
  const ageForModel = age ?? model.unknown_age_days;
  const maturityMult = model.maturity_floor + (Math.min(Math.max(ageForModel, 0), model.maturity_days) / model.maturity_days) * model.maturity_range;
  const category = protocol.category ?? 'Uncategorized';
  const peer = peerByCategory.get(category);
  const multiple = peer !== undefined ? peer.multiple : globalMultiple;
  const peerCount = peer !== undefined ? peer.peers : 0;
  const chainCount = protocol.chains.length;
  const chainMult = chainMultiplier(chainCount, model);
  const categoryGrowth = momentumByCategory.get(category) ?? 0;
  const momentumMult = momentumMultiplier(categoryGrowth, model);
  const { likelihood, reason } = likelihoodOf(protocol, model);
  const implied = Math.max(1, Math.round(protocol.tvl_usd * multiple * growthMult * maturityMult * chainMult * momentumMult * likelihood));
  return { implied, multiple, peerCount, growthPct, growthMult, maturityMult, chainMult, chainCount, momentumMult, categoryGrowth, likelihood, reason, age };
}

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; peers: PeerRow[]; globalMultiple: number; winsorCap: number } {
  const { peers, global, winsorCap } = peerTable(snapshot, model);
  const peerByCategory = new Map(peers.map((p) => [p.category, p]));
  const momentumByCategory = categoryMomentum(snapshot);
  // The board is the whole pre-token universe: every protocol that records no token.
  const chosen = snapshot.protocols.filter(isPreToken);
  const scored = chosen.map((p) => {
    const v = impliedValue(p, snapshot.as_of, peerByCategory, global, momentumByCategory, model);
    return { p, ...v };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
  const board: BoardRow[] = scored.map((s, i) => {
    const cost = farmCostFor(s.p, s.age, s.implied);
    return {
      rank: i + 1,
      slug: s.p.slug,
      name: s.p.name,
      category: s.p.category,
      chains: s.p.chains,
      tvl_usd: s.p.tvl_usd,
      change_7d: s.p.change_7d,
      mcap_usd: s.p.mcap_usd,
      listed_at: s.p.listed_at,
      gecko_id: s.p.gecko_id,
      symbol: s.p.symbol,
      token_status: 'pre-token',
      age_days: s.age,
      implied_value_usd: s.implied,
      model: {
        peer_multiple: s.multiple,
        peer_count: s.peerCount,
        growth_pct: s.growthPct,
        growth_multiplier: round4(s.growthMult),
        maturity_multiplier: round4(s.maturityMult),
        chain_multiplier: s.chainMult,
        chain_count: s.chainCount,
        momentum_multiplier: s.momentumMult,
        category_growth_pct: round4(s.categoryGrowth),
        likelihood: s.likelihood,
        likelihood_reason: s.reason,
        age_days: s.age,
        farm_capital_usd: cost.capital,
        farm_gas_total_usd: cost.gasTotal,
        farm_total_cost_usd: cost.total,
        farm_value_per_dollar: cost.valuePerDollar,
      },
      farm_steps: farmSteps(s.p, s.age).map(stepText),
    };
  });
  return { board, peers, globalMultiple: global, winsorCap };
}

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/** The category's one action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain} and borrow $20 against it, then repay the borrow.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm') || c.includes('liquidity manager') || c === 'farm') return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} and keep the position open.`;
  if (c.includes('bridge')) return `Bridge $${capital} of USDC to ${chain} through ${name} and use the bridged funds in its app.`;
  if (c.includes('staking') || c.includes('restak')) return `Stake $${capital} of the chain's staking asset through ${name} and keep the receipt token.`;
  if (c.includes('perpetual') || c.includes('derivative') || c.includes('options')) return `Deposit $${capital} of USDC as margin on ${name} and open one small hedged position.`;
  if (c.includes('prediction')) return `Fund $${capital} and place one market position on ${name}, then close it after the market resolves.`;
  if (c.includes('curator') || c.includes('allocator')) return `Deposit $${capital} into the ${name} vault on ${chain} and keep the vault shares.`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain} and hold it.`;
  if (c.includes('rwa')) return `Mint $${capital} of the protocol's yield-bearing asset on ${chain} and hold it.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy active.`;
  if (c.includes('chain')) return `Bridge $${capital} to ${chain} through its official bridge and use one app built on it.`;
  if (c.includes('payment') || c.includes('card')) return `Hold $${capital} in ${name} on ${chain} and make one payment with it.`;
  if (c.includes('governance')) return `Deposit $${capital} into ${name} on ${chain} and vote once on an open proposal.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
}

/** The category's weekly action, so the activity reads as a real user, not one deposit. */
function weeklyFor(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Each week, adjust the position once: add or remove a little collateral, or borrow and repay a small amount.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm') || c.includes('liquidity manager') || c === 'farm') return `Each week, claim any rewards and add a little liquidity, or swap once through the pool.`;
  if (c.includes('bridge')) return `Each week, bridge a small amount again, on a different day, so the activity spans more than one week.`;
  if (c.includes('staking') || c.includes('restak')) return `Each week, check the staking rewards and restake what is claimable instead of withdrawing it.`;
  if (c.includes('perpetual') || c.includes('derivative') || c.includes('options')) return `Each week, open and close one small position instead of leaving the account untouched.`;
  if (c.includes('prediction')) return `Each week, place one small position on a new market instead of betting once and stopping.`;
  if (c.includes('curator') || c.includes('allocator')) return `Each week, check the vault's yield and add a little capital when it is positive.`;
  return `Each week, make one qualifying action: a deposit, a borrow, a swap or a vote.`;
}

/** Chains where a transaction costs real money, cents, or almost nothing. */
const L2_CHAINS = new Set([
  'Arbitrum', 'Optimism', 'Base', 'Polygon', 'zkSync Era', 'Linea', 'Scroll', 'Blast', 'Mantle',
  'Mode', 'Starknet', 'Taiko', 'Unichain', 'Ink', 'Sei', 'Sonic', 'Berachain', 'Corn', 'Katana',
  'Arbitrum Nova', 'Fraxtal', 'Manta', 'Klaytn', 'Celo', 'Gnosis', 'Fantom', 'Avalanche', 'BSC',
  'Binance', 'Plasma', 'Stable', 'World Chain', 'MegaETH', 'Monad', 'Tempo', 'Arc', 'Robinhood Chain',
]);
const CHEAP_CHAINS = new Set([
  'Solana', 'Sui', 'Aptos', 'Near', 'TON', 'Cosmos', 'Injective', 'Osmosis', 'dYdX', 'Stellar',
  'Algorand', 'Hedera', 'ICP', 'Kaspa', 'Tron', 'Bittensor', 'Hyperliquid L1', 'Babylon Genesis',
  'Initia', 'XION', 'Nervos', 'Alephium', 'Massa', 'Neo3', 'Ontology', 'Astar', 'Orai', 'Mantra',
  'BandChain', 'Harmony', 'Mina', 'Fetch Hub', 'Proton', 'Kusama', 'PlatON', 'Metis', 'Elrond',
  'Tezos', 'Stacks', 'Allora', 'Qubic', 'Celestia', 'Arweave', 'XDC', 'BSV Blockchain', 'Canton',
  'Cronos', 'Conflux', 'Kava', 'Filecoin', 'Pi Network', 'Morph', 'Zcash', 'Cardano', 'Polkadot',
]);

/** What one transaction and one week of activity cost on a chain, from the chain itself. */
function gasFor(chain: string): { tx: string; week: string } {
  if (chain === 'Ethereum') return { tx: 'about $8', week: 'about $10 of gas a week' };
  if (L2_CHAINS.has(chain)) return { tx: 'about $0.50', week: 'about $1 of gas a week' };
  if (CHEAP_CHAINS.has(chain)) return { tx: 'under $0.10', week: 'under $0.50 of gas a week' };
  return { tx: 'about $2', week: 'about $2 of gas a week' };
}

/** The same gas prices as numbers, so a farm plan can total its cost in dollars. */
export function gasCostFor(chain: string): { txUsd: number; weekUsd: number } {
  if (chain === 'Ethereum') return { txUsd: 8, weekUsd: 10 };
  if (L2_CHAINS.has(chain)) return { txUsd: 0.5, weekUsd: 1 };
  if (CHEAP_CHAINS.has(chain)) return { txUsd: 0.1, weekUsd: 0.5 };
  return { txUsd: 2, weekUsd: 2 };
}

/**
 * What farming one protocol costs in full: the capital plus every dollar of gas over the
 * hold period (the first transaction, then one week of activity for each week held). The
 * value per dollar divides the implied launch value by that total, so a reader can compare
 * a cheap farm on an L2 with a dear one on Ethereum mainnet on the same footing.
 */
export function farmCostFor(p: SnapshotProtocol, age: number | null, impliedUsd: number): { capital: number; gasTotal: number; total: number; weeks: number; valuePerDollar: number } {
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const weeks = Math.max(1, Math.ceil(hold / 7));
  const gas = gasCostFor(chainOf(p));
  const gasTotal = Math.round((gas.txUsd + gas.weekUsd * weeks) * 100) / 100;
  const total = Math.round((capital + gasTotal) * 100) / 100;
  const valuePerDollar = total > 0 ? Math.round((impliedUsd / total) * 100) / 100 : 0;
  return { capital, gasTotal, total, weeks, valuePerDollar };
}

/** What to watch week to week, so the activity follows the protocol instead of a script. */
function trackFor(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  if (c.includes('curator') || c.includes('allocator')) return `Track the vault's yield and assets under management on ${p.name}'s own page, and move only when both are rising.`;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Track the borrow rate and your health factor on ${p.name}'s page, and top up collateral before it gets thin.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('liquidity manager') || c === 'farm') return `Track the pool's volume and the fees your share earned, and move the position when another pool pays clearly more.`;
  if (c.includes('bridge')) return `Track which chains ${p.name} adds routes to, and bridge to a new one when it opens.`;
  if (c.includes('staking') || c.includes('restak')) return `Track the staking yield and any slashing or unbonding window, and never unstake the week a snapshot is rumoured.`;
  if (c.includes('perpetual') || c.includes('derivative') || c.includes('options')) return `Track open interest and funding on ${p.name}, and close the position before funding turns against it.`;
  if (c.includes('prediction')) return `Track which markets resolve and what the crowd gets wrong, and stake the side the crowd is mispricing.`;
  if (c.includes('rwa')) return `Track the underlying yield and the redemption window, and redeem only inside the window the protocol publishes.`;
  if (c.includes('stable')) return `Track the peg and the reserves behind it, and leave if the peg slips more than a few cents.`;
  if (c.includes('insurance')) return `Track which covers pay out and what the premiums cost, and renew the cover before it lapses.`;
  if (c.includes('chain')) return `Track which apps launch on the chain and what they pay early users, and use one a week.`;
  if (c.includes('governance')) return `Track the open proposals and how the vote goes, and vote on the one that changes the rewards.`;
  return `Track ${p.name}'s own announcements for a points program or a snapshot date, and act in the week it is named.`;
}

/**
 * A protocol's farm plan: six steps, each an action with a cost and a time. The plan is derived
 * from the protocol's own record (category, chains, TVL, age), never from a hand-written list
 * of names. Gas is priced from the protocol's own first chain, and the weekly step names what
 * to track for that category, so two protocols on different chains and in different categories
 * do not get the same flat plan.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const action = actionFor(p, capital, chain);
  const weekly = weeklyFor(p);
  const gas = gasFor(chain);
  const track = trackFor(p);
  return [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm with ${p.name} on ${chain}, and keep its seed phrase offline.`,
      cost: `${gas.tx} of gas for the first transaction`,
      time: '5 minutes',
    },
    {
      text: action,
      cost: `$${capital} of capital and ${gas.tx} of gas`,
      time: '15 minutes to set up',
    },
    {
      text: `${weekly} ${track}`,
      cost: gas.week,
      time: '10 minutes a week',
    },
    {
      text: `Hold the position for at least ${hold} days so the activity is counted in more than one snapshot.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Before you withdraw, open ${p.name}'s own points or rewards page and claim only from the link it publishes.`,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.`,
      cost: 'nothing but the log',
      time: '5 minutes',
    },
  ];
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, 24)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
    }));
}

/** A board row's compact form for data.js, with the farm plan generated in the page. */
export function radarRow(row: BoardRow, watchlist: Set<string>): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    peer_multiple: row.model.peer_multiple,
    peer_count: row.model.peer_count,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    chain_multiplier: row.model.chain_multiplier,
    chain_count: row.model.chain_count,
    momentum_multiplier: row.model.momentum_multiplier,
    category_growth_pct: row.model.category_growth_pct,
    likelihood: row.model.likelihood,
    likelihood_reason: row.model.likelihood_reason,
    farm_capital_usd: row.model.farm_capital_usd,
    farm_gas_total_usd: row.model.farm_gas_total_usd,
    farm_total_cost_usd: row.model.farm_total_cost_usd,
    farm_value_per_dollar: row.model.farm_value_per_dollar,
    watchlist: watchlist.has(row.slug),
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const { board, peers, globalMultiple, winsorCap } = buildBoard(snapshot, model);
  const live = liveRows(snapshot);
  const watchlist = new Set(snapshot.watchlist);
  const totalImplied = board.reduce((sum, r) => sum + r.implied_value_usd, 0);
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    live_size: live.length,
    total_implied_usd: totalImplied,
    peers,
    global_multiple: globalMultiple,
    peer_winsor_cap: winsorCap,
    rows: board.map((r) => radarRow(r, watchlist)),
    live,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) if (s.length < 20 || s.length > 600) return `${r.slug} has a farm step of ${s.length} characters`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
