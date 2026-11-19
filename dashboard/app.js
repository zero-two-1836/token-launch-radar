(function () {
  var DATA = window.RADAR;
  var MODEL = DATA.model;

  /* ---------- formatting ---------- */
  function fmtUsd(n) {
    if (n === null || n === undefined) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }
  function fmtPct(n) {
    if (n === null || n === undefined) return '—';
    var s = (n > 0 ? '+' : '') + n.toFixed(1) + '%';
    return s;
  }
  function fmtAge(days) {
    if (days === null || days === undefined) return '—';
    if (days < 30) return days + 'd';
    if (days < 365) return Math.round(days / 30) + 'mo';
    return (days / 365).toFixed(1) + 'y';
  }
  function fmtDate(s) {
    return s || '—';
  }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
    if (children) {
      if (!Array.isArray(children)) children = [children];
      children.forEach(function (c) { if (c) node.appendChild(c); });
    }
    return node;
  }

  /* ---------- farm plan: the same rules as lib/model.ts, so the page shows the board's plan ---------- */
  function chainOf(p) { return p.chains && p.chains.length > 0 ? p.chains[0] : 'its main chain'; }
  function capitalFor(p) {
    if (p.tvl_usd >= 5e9) return 250;
    if (p.tvl_usd >= 1e9) return 150;
    if (p.tvl_usd >= 1e8) return 100;
    return 50;
  }
  function holdDaysFor(age) {
    if (age === null || age === undefined) return 30;
    if (age < 180) return 60;
    if (age < 365) return 45;
    return 30;
  }
  function actionFor(p, capital, chain) {
    var c = (p.category || '').toLowerCase();
    var name = p.name;
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'Supply $' + capital + ' of USDC to ' + name + ' on ' + chain + ' and borrow $20 against it, then repay the borrow.';
    if (c.indexOf('dex') >= 0 || c.indexOf('yield') >= 0 || c.indexOf('leveraged farm') >= 0 || c.indexOf('liquidity manager') >= 0 || c === 'farm') return 'Provide $' + capital + ' of liquidity to ' + name + "'s main pool on " + chain + ' and keep the position open.';
    if (c.indexOf('bridge') >= 0) return 'Bridge $' + capital + ' of USDC to ' + chain + ' through ' + name + ' and use the bridged funds in its app.';
    if (c.indexOf('staking') >= 0 || c.indexOf('restak') >= 0) return 'Stake $' + capital + " of the chain's staking asset through " + name + ' and keep the receipt token.';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0 || c.indexOf('options') >= 0) return 'Deposit $' + capital + ' of USDC as margin on ' + name + ' and open one small hedged position.';
    if (c.indexOf('prediction') >= 0) return 'Fund $' + capital + ' and place one market position on ' + name + ', then close it after the market resolves.';
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0) return 'Deposit $' + capital + ' into the ' + name + ' vault on ' + chain + ' and keep the vault shares.';
    if (c.indexOf('stable') >= 0) return 'Mint or deposit $' + capital + ' of the stable asset through ' + name + ' on ' + chain + ' and hold it.';
    if (c.indexOf('rwa') >= 0) return 'Mint $' + capital + " of the protocol's yield-bearing asset on " + chain + ' and hold it.';
    if (c.indexOf('insurance') >= 0) return 'Buy $' + capital + ' of cover from ' + name + ' on ' + chain + ' and keep the policy active.';
    if (c.indexOf('chain') >= 0) return 'Bridge $' + capital + ' to ' + chain + " through its official bridge and use one app built on it.";
    if (c.indexOf('payment') >= 0 || c.indexOf('card') >= 0) return 'Hold $' + capital + ' in ' + name + ' on ' + chain + ' and make one payment with it.';
    if (c.indexOf('governance') >= 0) return 'Deposit $' + capital + ' into ' + name + ' on ' + chain + ' and vote once on an open proposal.';
    return 'Deposit $' + capital + ' of USDC into ' + name + ' on ' + chain + ' and keep the position open.';
  }
  function weeklyFor(p) {
    var c = (p.category || '').toLowerCase();
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'Each week, adjust the position once: add or remove a little collateral, or borrow and repay a small amount.';
    if (c.indexOf('dex') >= 0 || c.indexOf('yield') >= 0 || c.indexOf('leveraged farm') >= 0 || c.indexOf('liquidity manager') >= 0 || c === 'farm') return 'Each week, claim any rewards and add a little liquidity, or swap once through the pool.';
    if (c.indexOf('bridge') >= 0) return 'Each week, bridge a small amount again, on a different day, so the activity spans more than one week.';
    if (c.indexOf('staking') >= 0 || c.indexOf('restak') >= 0) return 'Each week, check the staking rewards and restake what is claimable instead of withdrawing it.';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0 || c.indexOf('options') >= 0) return 'Each week, open and close one small position instead of leaving the account untouched.';
    if (c.indexOf('prediction') >= 0) return 'Each week, place one small position on a new market instead of betting once and stopping.';
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0) return "Each week, check the vault's yield and add a little capital when it is positive.";
    return 'Each week, make one qualifying action: a deposit, a borrow, a swap or a vote.';
  }
  var L2_CHAINS = ['Arbitrum', 'Optimism', 'Base', 'Polygon', 'zkSync Era', 'Linea', 'Scroll', 'Blast', 'Mantle', 'Mode', 'Starknet', 'Taiko', 'Unichain', 'Ink', 'Sei', 'Sonic', 'Berachain', 'Corn', 'Katana', 'Arbitrum Nova', 'Fraxtal', 'Manta', 'Klaytn', 'Celo', 'Gnosis', 'Fantom', 'Avalanche', 'BSC', 'Binance', 'Plasma', 'Stable', 'World Chain', 'MegaETH', 'Monad', 'Tempo', 'Arc', 'Robinhood Chain'];
  var CHEAP_CHAINS = ['Solana', 'Sui', 'Aptos', 'Near', 'TON', 'Cosmos', 'Injective', 'Osmosis', 'dYdX', 'Stellar', 'Algorand', 'Hedera', 'ICP', 'Kaspa', 'Tron', 'Bittensor', 'Hyperliquid L1', 'Babylon Genesis', 'Initia', 'XION', 'Nervos', 'Alephium', 'Massa', 'Neo3', 'Ontology', 'Astar', 'Orai', 'Mantra', 'BandChain', 'Harmony', 'Mina', 'Fetch Hub', 'Proton', 'Kusama', 'PlatON', 'Metis', 'Elrond', 'Tezos', 'Stacks', 'Allora', 'Qubic', 'Celestia', 'Arweave', 'XDC', 'BSV Blockchain', 'Canton', 'Cronos', 'Conflux', 'Kava', 'Filecoin', 'Pi Network', 'Morph', 'Zcash', 'Cardano', 'Polkadot'];
  function gasFor(chain) {
    if (chain === 'Ethereum') return { tx: 'about $8', week: 'about $10 of gas a week' };
    if (L2_CHAINS.indexOf(chain) >= 0) return { tx: 'about $0.50', week: 'about $1 of gas a week' };
    if (CHEAP_CHAINS.indexOf(chain) >= 0) return { tx: 'under $0.10', week: 'under $0.50 of gas a week' };
    return { tx: 'about $2', week: 'about $2 of gas a week' };
  }
  function trackFor(p) {
    var c = (p.category || '').toLowerCase();
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0) return "Track the vault's yield and assets under management on " + p.name + "'s own page, and move only when both are rising.";
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return "Track the borrow rate and your health factor on " + p.name + "'s page, and top up collateral before it gets thin.";
    if (c.indexOf('dex') >= 0 || c.indexOf('yield') >= 0 || c.indexOf('liquidity manager') >= 0 || c === 'farm') return "Track the pool's volume and the fees your share earned, and move the position when another pool pays clearly more.";
    if (c.indexOf('bridge') >= 0) return 'Track which chains ' + p.name + ' adds routes to, and bridge to a new one when it opens.';
    if (c.indexOf('staking') >= 0 || c.indexOf('restak') >= 0) return 'Track the staking yield and any slashing or unbonding window, and never unstake the week a snapshot is rumoured.';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0 || c.indexOf('options') >= 0) return 'Track open interest and funding on ' + p.name + ', and close the position before funding turns against it.';
    if (c.indexOf('prediction') >= 0) return 'Track which markets resolve and what the crowd gets wrong, and stake the side the crowd is mispricing.';
    if (c.indexOf('rwa') >= 0) return 'Track the underlying yield and the redemption window, and redeem only inside the window the protocol publishes.';
    if (c.indexOf('stable') >= 0) return 'Track the peg and the reserves behind it, and leave if the peg slips more than a few cents.';
    if (c.indexOf('insurance') >= 0) return 'Track which covers pay out and what the premiums cost, and renew the cover before it lapses.';
    if (c.indexOf('chain') >= 0) return 'Track which apps launch on the chain and what they pay early users, and use one a week.';
    if (c.indexOf('governance') >= 0) return 'Track the open proposals and how the vote goes, and vote on the one that changes the rewards.';
    return "Track " + p.name + "'s own announcements for a points program or a snapshot date, and act in the week it is named.";
  }
  function stepText(step) {
    var s = step.text + ' Cost: ' + step.cost + '. Time: ' + step.time + '.';
    if (s.length > 600) s = s.slice(0, 596) + '...';
    if (s.length < 20) s = s + " Hold the position and check the protocol's own page.";
    return s;
  }
  function farmSteps(p) {
    var chain = chainOf(p);
    var capital = capitalFor(p);
    var hold = holdDaysFor(p.age_days);
    var gas = gasFor(chain);
    return [
      { text: 'Use a fresh wallet that holds only the funds you plan to farm with ' + p.name + ' on ' + chain + ', and keep its seed phrase offline.', cost: gas.tx + ' of gas for the first transaction', time: '5 minutes' },
      { text: actionFor(p, capital, chain), cost: '$' + capital + ' of capital and ' + gas.tx + ' of gas', time: '15 minutes to set up' },
      { text: weeklyFor(p) + ' ' + trackFor(p), cost: gas.week, time: '10 minutes a week' },
      { text: 'Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot.', cost: 'the $' + capital + ' stays in the position', time: hold + ' days' },
      { text: "Before you withdraw, open " + p.name + "'s own points or rewards page and claim only from the link it publishes.", cost: 'no fee to check, and never pay to claim', time: '10 minutes' },
      { text: 'Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.', cost: 'nothing but the log', time: '5 minutes' }
    ].map(stepText);
  }

  /* ---------- state ---------- */
  function readHash() {
    var h = {};
    var raw = window.location.hash.replace(/^#/, '');
    raw.split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      h[decodeURIComponent(i >= 0 ? kv.slice(0, i) : kv)] = i >= 0 ? decodeURIComponent(kv.slice(i + 1)) : '1';
    });
    return {
      q: h.q || '',
      category: h.cat || 'all',
      chain: h.chain || 'all',
      watch: h.watch === '1',
      likely: h.likely || 'all',
      sort: h.sort || 'implied',
      dir: h.dir === '1' ? 1 : -1,
      detail: h.detail || null,
      tab: h.tab || 'board'
    };
  }
  function writeHash(state) {
    var parts = [];
    if (state.q) parts.push('q=' + encodeURIComponent(state.q));
    if (state.category !== 'all') parts.push('cat=' + encodeURIComponent(state.category));
    if (state.chain !== 'all') parts.push('chain=' + encodeURIComponent(state.chain));
    if (state.watch) parts.push('watch=1');
    if (state.likely !== 'all') parts.push('likely=' + encodeURIComponent(state.likely));
    if (state.sort !== 'implied') parts.push('sort=' + encodeURIComponent(state.sort));
    if (state.dir === 1) parts.push('dir=1');
    if (state.detail) parts.push('detail=' + encodeURIComponent(state.detail));
    if (state.tab !== 'board') parts.push('tab=' + encodeURIComponent(state.tab));
    var next = parts.length ? '#' + parts.join('&') : '#';
    if (window.location.hash !== next) window.history.replaceState(null, '', next);
  }
  var state = readHash();

  /* ---------- filtering and sorting ---------- */
  function filteredRows() {
    var list = DATA.rows.filter(function (r) {
      if (state.watch && !r.watchlist) return false;
      if (state.likely === 'likely' && r.likelihood < 0.5) return false;
      if (state.likely === 'long' && r.likelihood >= 0.5) return false;
      if (state.category !== 'all' && (r.category || 'Uncategorized') !== state.category) return false;
      if (state.chain !== 'all' && r.chains.indexOf(state.chain) < 0) return false;
      if (state.q) {
        var q = state.q.toLowerCase();
        if ((r.name + ' ' + r.slug + ' ' + (r.category || '')).toLowerCase().indexOf(q) < 0) return false;
      }
      return true;
    });
    var key = state.sort;
    var dir = state.dir;
    list.sort(function (a, b) {
      var d = 0;
      if (key === 'implied') d = a.implied_value_usd - b.implied_value_usd;
      else if (key === 'tvl') d = a.tvl_usd - b.tvl_usd;
      else if (key === 'change') d = (a.change_7d || 0) - (b.change_7d || 0);
      else if (key === 'age') d = (a.age_days || 0) - (b.age_days || 0);
      else if (key === 'name') d = a.name.localeCompare(b.name);
      else d = a.rank - b.rank;
      if (d === 0) d = a.rank - b.rank;
      return d * dir;
    });
    return list;
  }
  function likelihoodBadge(r) {
    if (r.likelihood >= 0.5) return el('span', { class: 'badge likely', text: 'Likely ' + Math.round(r.likelihood * 100) + '%' });
    if (r.likelihood >= 0.05) return el('span', { class: 'badge long', text: 'Long shot ' + Math.round(r.likelihood * 100) + '%' });
    return el('span', { class: 'badge structural', text: 'Structural ' + Math.round(r.likelihood * 100) + '%' });
  }

  /* ---------- rendering ---------- */
  function sortHeader(key, label) {
    var arrow = state.sort === key ? (state.dir === -1 ? ' ↓' : ' ↑') : '';
    return el('th', { class: 'num' }, [el('button', {
      type: 'button', text: label + arrow,
      onclick: function () {
        if (state.sort === key) state.dir = -state.dir;
        else { state.sort = key; state.dir = key === 'name' ? 1 : -1; }
        writeHash(state); render();
      }
    })]);
  }
  function boardTable(list) {
    var head = el('tr', null, [
      el('th', { text: '#' }),
      el('th', { text: 'Protocol' }),
      el('th', { text: 'Category' }),
      el('th', { text: 'Chains' }),
      sortHeader('tvl', 'TVL'),
      sortHeader('change', '7d'),
      sortHeader('implied', 'Implied value'),
      el('th', { text: 'Launch' })
    ]);
    var body = el('tbody');
    list.forEach(function (r) {
      var chg = r.change_7d === null ? el('td', { class: 'num', text: '—' }) :
        el('td', { class: 'num ' + (r.change_7d >= 0 ? 'up' : 'down'), text: fmtPct(r.change_7d) });
      var nameCell = el('td', { class: 'name' }, [
        el('span', { text: r.name }),
        el('small', { text: r.slug + (r.watchlist ? ' · on the watchlist' : '') })
      ]);
      if (r.watchlist) nameCell.appendChild(el('span', { class: 'badge watch', text: 'Watchlist' }));
      body.appendChild(el('tr', {
        tabindex: '0',
        onclick: function () { state.detail = r.slug; writeHash(state); render(); },
        onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); state.detail = r.slug; writeHash(state); render(); } }
      }, [
        el('td', { text: String(r.rank) }),
        nameCell,
        el('td', { text: r.category || '—' }),
        el('td', { text: r.chains.slice(0, 3).join(', ') || '—' }),
        el('td', { class: 'num', text: fmtUsd(r.tvl_usd) }),
        chg,
        el('td', { class: 'num', text: fmtUsd(r.implied_value_usd) }),
        el('td', null, [likelihoodBadge(r)])
      ]));
    });
    if (list.length === 0) {
      return el('div', null, [
        el('table', { class: 'board' }, [el('thead', null, [head])]),
        el('p', { class: 'empty', text: 'No protocol matches these filters. Clear the search or pick another category.' })
      ]);
    }
    return el('table', { class: 'board' }, [el('thead', null, [head]), body]);
  }
  function detailView(r) {
    var steps = farmSteps(r);
    var m = r;
    var rows = [
      ['TVL', fmtUsd(m.tvl_usd)],
      ['Peer multiple (' + (m.peer_count > 0 ? m.peer_count + ' tokenized peer' + (m.peer_count === 1 ? '' : 's') + ' in ' + (m.category || 'this category') : 'no tokenized peer in this category, market median') + ')', '×' + m.peer_multiple.toFixed(3)],
      ['7-day growth', fmtPct(m.change_7d) + ' → ×' + m.growth_multiplier.toFixed(3)],
      ['Maturity (' + fmtAge(m.age_days) + ' tracked, no token)', '×' + m.maturity_multiplier.toFixed(3)],
      ['Chain breadth (' + m.chain_count + ' live chain' + (m.chain_count === 1 ? '' : 's') + ')', '×' + m.chain_multiplier.toFixed(3)],
      ['Category momentum (' + (m.category || 'this category') + ' ' + fmtPct(m.category_growth_pct) + ' TVL-weighted 7d)', '×' + m.momentum_multiplier.toFixed(3)],
      ['Launch likelihood', Math.round(m.likelihood * 100) + '%'],
      ['Implied value', fmtUsd(m.implied_value_usd)]
    ];
    var modelRows = rows.map(function (kv) {
      return el('tr', null, [el('td', { text: kv[0] }), el('td', { text: kv[1] })]);
    });
    var costRows = [
      ['Capital in the position', '$' + m.farm_capital_usd],
      ['Gas over the hold period', '$' + m.farm_gas_total_usd],
      ['Total cost to farm', '$' + m.farm_total_cost_usd],
      ['Implied value per $1 farmed', '$' + m.farm_value_per_dollar.toLocaleString('en-US')]
    ].map(function (kv) {
      return el('tr', null, [el('td', { text: kv[0] }), el('td', { text: kv[1] })]);
    });
    return el('div', {
      class: 'overlay',
      onclick: function (e) { if (e.target === this) { state.detail = null; writeHash(state); render(); } }
    }, [el('div', { class: 'detail', role: 'dialog', 'aria-label': r.name }, [
      el('button', { class: 'close', type: 'button', text: 'Close ×', onclick: function () { state.detail = null; writeHash(state); render(); } }),
      el('p', { class: 'eyebrow', text: 'Rank #' + r.rank + ' · ' + (r.category || 'Uncategorized') }),
      el('h2', { text: r.name }),
      el('p', { class: 'sub', text: r.slug + ' · ' + (r.chains.join(', ') || 'no chain listed') + ' · tracked since ' + fmtDate(r.listed_at) + (r.watchlist ? ' · on the watchlist' : '') }),
      el('dl', null, [
        el('div', null, [el('dt', { text: 'TVL' }), el('dd', { text: fmtUsd(r.tvl_usd) })]),
        el('div', null, [el('dt', { text: '7-day change' }), el('dd', { text: fmtPct(r.change_7d) })]),
        el('div', null, [el('dt', { text: 'Age tracked' }), el('dd', { text: fmtAge(r.age_days) })]),
        el('div', null, [el('dt', { text: 'Implied value' }), el('dd', { text: fmtUsd(r.implied_value_usd) })])
      ]),
      el('h3', { text: 'How the value is built' }),
      el('table', { class: 'model' }, modelRows),
      el('p', { class: 'note', text: 'Implied value = TVL × peer multiple × growth × maturity × chain breadth × category momentum × launch likelihood. Multipliers are shown rounded; the board carries the program’s exact product. ' + r.likelihood_reason }),
      el('h3', { text: 'What the farm costs' }),
      el('table', { class: 'model' }, costRows),
      el('p', { class: 'note', text: 'Total cost is the capital plus every dollar of gas over the hold period, priced from this protocol’s own first chain. Implied value per $1 farmed compares farms with each other — a cheap farm on an L2 against a dear one on Ethereum — it is not a payout: the launch value is shared across every farmer.' }),
      el('h3', { text: 'How to farm it' }),
      el('ol', { class: 'steps' }, steps.map(function (s) {
        var cut = s.indexOf(' Cost: ');
        var head = cut >= 0 ? s.slice(0, cut) : s;
        var tail = cut >= 0 ? s.slice(cut + 1) : '';
        return el('li', null, [el('b', { text: head }), el('span', { text: tail })]);
      })),
      el('p', { class: 'note', text: 'This protocol records no token in the snapshot. That is the record, not proof it has none — and an airdrop is never guaranteed. Never pay anyone to claim.' })
    ])]);
  }
  function liveTable() {
    var head = el('tr', null, [
      el('th', { text: '#' }), el('th', { text: 'Protocol' }), el('th', { text: 'Category' }),
      el('th', { class: 'num', text: 'TVL' }), el('th', { class: 'num', text: 'Market cap' }), el('th', { class: 'num', text: '7d' })
    ]);
    var body = el('tbody');
    DATA.live.forEach(function (r, i) {
      body.appendChild(el('tr', null, [
        el('td', { text: String(i + 1) }),
        el('td', { class: 'name', text: r.name }),
        el('td', { text: r.category || '—' }),
        el('td', { class: 'num', text: fmtUsd(r.tvl_usd) }),
        el('td', { class: 'num', text: fmtUsd(r.mcap_usd) }),
        el('td', { class: 'num ' + ((r.change_7d || 0) >= 0 ? 'up' : 'down'), text: fmtPct(r.change_7d) })
      ]));
    });
    return el('div', null, [
      el('p', { class: 'count', text: 'The 24 largest tokenized protocols by market cap. They already trade, so the board shows the market’s own value for them — never a model’s. They are the peers the multiples come from.' }),
      el('table', { class: 'board' }, [el('thead', null, [head]), body])
    ]);
  }
  function methodSection() {
    var peers = DATA.peers.filter(function (p) { return p.peers > 0; }).sort(function (a, b) { return b.peers - a.peers; });
    var grid = el('div', { class: 'peergrid' }, peers.map(function (p) {
      return el('div', null, [
        el('b', { text: p.category }),
        el('span', { text: p.peers + ' peer' + (p.peers === 1 ? '' : 's') + ' · median ×' + (p.median === null ? '—' : p.median.toFixed(3)) + ' · prior ' + p.prior + ' → multiple ×' + p.multiple.toFixed(3) + ' · sector ' + (p.growth_pct > 0 ? '+' : '') + p.growth_pct.toFixed(1) + '% 7d' })
      ]);
    }));
    return el('div', null, [
      el('div', { class: 'card' }, [
        el('h2', { text: 'The model: peer multiples, not a name list' }),
        el('p', null, [el('b', { text: 'Implied value = TVL × peer multiple × growth × maturity × chain breadth × category momentum × launch likelihood.' }), el('span', { text: ' Every factor comes from the snapshot’s own figures. No protocol name is special-cased anywhere in the program: the same function scores all 342 pre-token protocols, and it uses every figure the snapshot carries.' })]),
        el('div', { class: 'formula', text: 'implied = round(TVL × peerMultiple × (1 + clamp(7d, −50, +100) / 100 × 0.5) × (0.6 + min(age, 1095) / 1095 × 0.4) × (1 + min(chains − 1, 10) × 0.01) × (1 + clamp(sector7d, −20, +50) / 100 × 0.25) × likelihood)' }),
        el('h3', { text: 'Peer multiple' }),
        el('p', { text: 'For each category, the median market-cap / TVL of its tokenized protocols, shrunk toward the market-wide median (×' + DATA.global_multiple.toFixed(3) + ') with prior weight ' + MODEL.peer_prior_weight + ', capped at ×' + MODEL.peer_cap + ' and floored at ×' + MODEL.peer_floor + '. Two guards keep one odd peer from setting a whole category: every peer ratio is first capped at the market’s 90th percentile (×' + (DATA.peer_winsor_cap || 0).toFixed(3) + '), so a tiny-TVL token trading at 400× its TVL cannot set its category’s multiple; and the prior weight grows when a category has few peers — 30 for one peer, 20 for two, 10 for three or more — so a one-peer category leans almost entirely on the market. A category with none uses the market median outright.' }),
        grid,
        el('h3', { text: 'Chain breadth and sector momentum' }),
        el('p', { text: 'Two factors use the snapshot’s remaining figures. Chain breadth: a protocol live on more chains reaches more users to reward, so each extra chain up to ten adds 1% — a protocol on eleven chains or more scores ×1.10, a single-chain one ×1.00. Sector momentum: each category’s TVL-weighted seven-day change, so a protocol in a sector whose money is growing fast is worth up to 12.5% more and one in a shrinking sector up to 5% less. Both are the snapshot’s own numbers, never a hand-kept list.' }),
        el('h3', { text: 'Launch likelihood' }),
        el('p', { text: 'Core protocols price at 100%. An exchange, a bridge or a wrapped / staked product prices at 1%: its value is the underlying asset, not a new token. A staking pool prices at 10%. A versioned name — a pool of another protocol — halves the weight again. The category decides, never the name.' }),
        el('h3', { text: 'Growth and maturity' }),
        el('p', { text: 'Seven-day TVL growth moves the value by half its size, clamped to −50% … +100%. Age tracked with no token adds up to 40%: a protocol that has run for years without issuing anything is the one whose launch would be worth the most.' }),
        el('h3', { text: 'What a farm costs' }),
        el('p', { text: 'Every protocol’s detail view totals its farm cost: the capital plus every dollar of gas over the hold period, priced from its own first chain — about $8 a transaction on Ethereum mainnet, about $0.50 on an L2, under $0.10 on the cheap chains — and divides the implied value by that total. The figure compares farms with each other; it is not a payout.' })
      ]),
      el('div', { class: 'card' }, [
        el('h2', { text: 'How to read the board' }),
        el('p', { text: 'Rank 1 is the most valuable launch on the snapshot’s figures. Click any row for its model breakdown, its total farm cost and its six-step farm plan, with what each step costs and how long it takes. Use the filters to narrow by category, chain or watchlist, and sort by implied value, TVL, growth or age.' }),
        el('p', { text: '“Records no token” is DefiLlama’s record, never proof a protocol has none. The implied value is this entry’s own claim, never make.fun’s, and a farm plan is a set of steps, not a promise of an airdrop.' })
      ])
    ]);
  }
  function render() {
    var main = document.getElementById('board');
    main.setAttribute('aria-busy', 'false');
    main.innerHTML = '';
    var wrap = el('div', { class: 'wrap' });
    var categories = Array.from(new Set(DATA.rows.map(function (r) { return r.category || 'Uncategorized'; }))).sort();
    var chains = Array.from(new Set(DATA.rows.reduce(function (acc, r) { return acc.concat(r.chains); }, []))).sort();
    wrap.appendChild(el('header', { class: 'hero' }, [
      el('p', { class: 'eyebrow', text: 'Token launch radar · snapshot ' + DATA.as_of }),
      el('h1', null, [el('span', { text: 'Every pre-token protocol, ' }), el('span', { class: 'grad', text: 'ranked by what its launch would be worth.' })]),
      el('p', { class: 'lede', text: '342 protocols that record no token, scored by a peer-multiple model built from the snapshot itself — TVL, seven-day growth, age tracked with no token, how many chains each one is live on, how hot its sector is, and whether a launch is structurally possible. Click any row for its model breakdown, its total farm cost and its farm plan.' }),
      el('div', { class: 'stats' }, [
        el('div', { class: 'stat' }, [el('b', { text: String(DATA.board_size) }), el('span', { text: 'pre-token protocols ranked' })]),
        el('div', { class: 'stat' }, [el('b', { text: String(DATA.watchlist_size) }), el('span', { text: 'on the watchlist, all covered' })]),
        el('div', { class: 'stat' }, [el('b', { text: fmtUsd(DATA.total_implied_usd) }), el('span', { text: 'total implied value' })]),
        el('div', { class: 'stat' }, [el('b', { text: '×' + DATA.global_multiple.toFixed(3) }), el('span', { text: 'market-wide peer multiple' })])
      ])
    ]));
    var tabs = el('div', { class: 'tabs' }, [
      el('button', { type: 'button', 'aria-pressed': state.tab === 'board' ? 'true' : 'false', text: 'Board', onclick: function () { state.tab = 'board'; writeHash(state); render(); } }),
      el('button', { type: 'button', 'aria-pressed': state.tab === 'live' ? 'true' : 'false', text: 'Live tokens', onclick: function () { state.tab = 'live'; writeHash(state); render(); } }),
      el('button', { type: 'button', 'aria-pressed': state.tab === 'method' ? 'true' : 'false', text: 'Model & method', onclick: function () { state.tab = 'method'; writeHash(state); render(); } })
    ]);
    wrap.appendChild(tabs);
    if (state.tab === 'method') {
      wrap.appendChild(methodSection());
    } else if (state.tab === 'live') {
      wrap.appendChild(liveTable());
    } else {
      var search = el('input', { type: 'search', placeholder: 'Search name, slug or category…', value: state.q, 'aria-label': 'Search protocols' });
      search.addEventListener('input', function () { state.q = search.value; writeHash(state); render(); });
      var catSel = el('select', { 'aria-label': 'Category' }, [el('option', { value: 'all', text: 'All categories' })].concat(categories.map(function (c) {
        return el('option', { value: c, text: c, selected: c === state.category ? 'selected' : null });
      })));
      catSel.addEventListener('change', function () { state.category = catSel.value; writeHash(state); render(); });
      var chainSel = el('select', { 'aria-label': 'Chain' }, [el('option', { value: 'all', text: 'All chains' })].concat(chains.map(function (c) {
        return el('option', { value: c, text: c, selected: c === state.chain ? 'selected' : null });
      })));
      chainSel.addEventListener('change', function () { state.chain = chainSel.value; writeHash(state); render(); });
      var likelySel = el('select', { 'aria-label': 'Launch likelihood' }, [
        el('option', { value: 'all', text: 'Any likelihood' }),
        el('option', { value: 'likely', text: 'Likely launches', selected: state.likely === 'likely' ? 'selected' : null }),
        el('option', { value: 'long', text: 'Long shots & structural', selected: state.likely === 'long' ? 'selected' : null })
      ]);
      likelySel.addEventListener('change', function () { state.likely = likelySel.value; writeHash(state); render(); });
      var watchLabel = el('label', null, [el('input', {
        type: 'checkbox', checked: state.watch ? 'checked' : null,
        onchange: function (e) { state.watch = e.target.checked; writeHash(state); render(); }
      }), el('span', { text: 'Watchlist only' })]);
      var list = filteredRows();
      wrap.appendChild(el('div', { class: 'controls' }, [search, catSel, chainSel, likelySel, watchLabel]));
      wrap.appendChild(el('p', { class: 'count', text: 'Showing ' + list.length + ' of ' + DATA.rows.length + ' pre-token protocols · ranked by implied value · click a row for its farm plan' }));
      wrap.appendChild(boardTable(list));
    }
    wrap.appendChild(el('footer', null, [
      el('p', { text: 'Snapshot: ' + DATA.source + ' · as of ' + DATA.as_of + ' · watchlist floor ' + fmtUsd(DATA.floor_usd) + ' · model ' + DATA.model_version + ' (peer multiples, growth, maturity, launch likelihood).' }),
      el('p', { text: '“Records no token” is the snapshot’s record, never proof a protocol has none. Implied values are this entry’s own claims, and a farm plan is a set of steps, not a promise of an airdrop.' })
    ]));
    main.appendChild(wrap);
    if (state.detail) {
      var row = null;
      DATA.rows.forEach(function (r) { if (r.slug === state.detail) row = r; });
      if (row) main.appendChild(detailView(row));
      else { state.detail = null; writeHash(state); }
    }
  }
  window.addEventListener('hashchange', function () { state = readHash(); render(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state.detail) { state.detail = null; writeHash(state); render(); }
  });
  render();
})();
