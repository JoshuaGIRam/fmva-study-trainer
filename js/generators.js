/* FMVA Trainer v2 — calculation question generators.
   Every question is built from random inputs and the answer is computed in code,
   so answer keys are always right. Wrong options come from common candidate mistakes. */
(function (G) {
  const F = (G.FMVA = G.FMVA || {});

  // ---------- helpers ----------
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const step = (a, b, s) => { const n = Math.round((b - a) / s); return +(a + ri(0, n) * s).toFixed(6); };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const r2 = (x) => Math.round(x * 100) / 100;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const mean = (a) => sum(a) / a.length;

  const fmt = {
    pct: (x, d = 1) => (x * 100).toFixed(d) + '%',
    m: (x, d = 1) => (x < 0 ? '−$' : '$') + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) + 'm',
    usd: (x, d = 2) => (x < 0 ? '−$' : '$') + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }),
    num: (x, d = 1) => x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }),
    x: (x, d = 1) => x.toFixed(d) + 'x',
    days: (x) => x.toFixed(1) + ' days',
    units: (x) => Math.ceil(x).toLocaleString('en-US') + ' units',
    beta: (x) => x.toFixed(2),
  };
  F.fmt = fmt;

  /* Build options: correct value + mistake values, deduped on the displayed string.
     Falls back to plausible perturbations if mistakes collide. */
  function options(correct, mistakes, f) {
    const c = f(correct);
    const seen = new Set([c]);
    const out = [];
    for (const v of mistakes) {
      if (!isFinite(v)) continue;
      const s = f(v);
      if (!seen.has(s)) { seen.add(s); out.push(s); }
      if (out.length === 3) break;
    }
    const bumps = [1.1, 0.9, 1.2, 0.8, 1.15, 0.85, 1.3, 0.7, 1.05, 0.95];
    const unit = Math.max(Math.abs(correct) * 0.1, 1);
    const cands = bumps.map((b) => correct * b).concat([1, -1, 2, -2, 3, -3, 5, -5].map((k) => correct + k * unit));
    for (const v of cands) {
      if (out.length === 3) break;
      const s = f(v);
      if (!seen.has(s)) { seen.add(s); out.push(s); }
    }
    return [c, ...out];
  }
  F._options = options;

  // Each generator returns {q, opts (correct first), exp, diff}
  const gens = {};
  const def = (id, unit, topic, diff, fn) => { gens[id] = { id, unit, topic, diff, fn }; };

  // ================= Excel toolkit =================
  def('excel_npv', 'xl', 'Excel finance functions', 3, () => {
    const r = step(0.06, 0.12, 0.01), c0 = -ri(80, 110) * 10, cf = [ri(40, 60) * 10, ri(40, 60) * 10, ri(45, 70) * 10];
    const trueNpv = c0 + cf.reduce((s, c, i) => s + c / Math.pow(1 + r, i + 1), 0);
    const excel = trueNpv / (1 + r); // Excel NPV treats first value as end of period 1
    const undisc = c0 + sum(cf);
    return {
      q: `Cells B1:B4 contain a project's cash flows: B1 = ${c0} (today), B2 = ${cf[0]}, B3 = ${cf[1]}, B4 = ${cf[2]} (end of years 1–3). What does =NPV(${fmt.pct(r, 0)}, B1:B4) return?`,
      opts: options(excel, [trueNpv, undisc, trueNpv * (1 + r)], (v) => fmt.num(v, 1)),
      exp: `Excel's NPV assumes the FIRST value arrives at the end of period 1, so it discounts the time-0 outlay too. =NPV(${fmt.pct(r, 0)},B1:B4) = ${fmt.num(excel, 1)}. The true NPV is ${fmt.num(trueNpv, 1)}, which you get with =B1+NPV(${fmt.pct(r, 0)},B2:B4). That's a classic exam trap.`,
    };
  });

  def('pmt', 'xl', 'Excel finance functions', 2, () => {
    const P = ri(10, 60) * 10, r = step(0.05, 0.10, 0.005), n = pick([5, 7, 10]);
    const pmt = (P * r) / (1 - Math.pow(1 + r, -n));
    return {
      q: `A company borrows $${P}m at ${fmt.pct(r, 1)} per year, repaid with equal annual payments over ${n} years. What annual payment does =PMT(${fmt.pct(r, 1)}, ${n}, ${P}) imply (ignore the sign)?`,
      opts: options(pmt, [P / n, (P / n) * (1 + r), P * r + P / n * 0.5, P * r], (v) => fmt.m(v, 2)),
      exp: `Annuity payment = P × r ÷ (1 − (1+r)^−n) = ${P} × ${fmt.pct(r, 1)} ÷ (1 − ${(1 + r).toFixed(3)}^−${n}) = ${fmt.m(pmt, 2)}. Excel returns it as a negative number (cash out) because the loan amount was entered as positive.`,
    };
  });

  def('choose', 'ss', 'Scenario analysis', 1, () => {
    const g = [step(0.01, 0.03, 0.005), step(0.04, 0.06, 0.005), step(0.07, 0.10, 0.005)];
    const k = ri(1, 3), rev = ri(200, 900);
    const out = rev * (1 + g[k - 1]);
    return {
      q: `A scenario switch cell holds ${k}. Revenue growth = CHOOSE(switch, ${g.map((x) => fmt.pct(x, 1)).join(', ')}) for Downside / Base / Upside. Last year's revenue was $${rev}m. What is forecast revenue?`,
      opts: options(out, g.filter((_, i) => i !== k - 1).map((x) => rev * (1 + x)).concat([rev * (1 + mean(g))]), (v) => fmt.m(v, 1)),
      exp: `CHOOSE returns the ${['1st', '2nd', '3rd'][k - 1]} value (${fmt.pct(g[k - 1], 1)}), so revenue = ${rev} × (1 + ${fmt.pct(g[k - 1], 1)}) = ${fmt.m(out, 1)}.`,
    };
  });

  // ================= Financial analysis =================
  def('dupont', 'fa', 'Ratio analysis', 2, () => {
    const margin = step(0.04, 0.14, 0.005), turn = step(0.6, 1.8, 0.1), lev = step(1.4, 3.0, 0.1);
    const roe = margin * turn * lev, roa = margin * turn;
    if (Math.random() < 0.5) {
      return {
        q: `Net profit margin is ${fmt.pct(margin, 1)}, asset turnover is ${turn.toFixed(1)}x and the equity multiplier (assets ÷ equity) is ${lev.toFixed(1)}x. What is ROE?`,
        opts: options(roe, [roa, margin * lev, margin * turn / lev], (v) => fmt.pct(v, 1)),
        exp: `DuPont: ROE = margin × asset turnover × equity multiplier = ${fmt.pct(margin, 1)} × ${turn.toFixed(1)} × ${lev.toFixed(1)} = ${fmt.pct(roe, 1)}. Margin × turnover alone is ROA (${fmt.pct(roa, 1)}).`,
      };
    }
    return {
      q: `A company's ROE is ${fmt.pct(roe, 1)} and its equity multiplier (assets ÷ equity) is ${lev.toFixed(1)}x. What is its ROA?`,
      opts: options(roa, [roe * lev, roe - lev / 100, roe / (lev - 1)], (v) => fmt.pct(v, 1)),
      exp: `ROE = ROA × equity multiplier, so ROA = ${fmt.pct(roe, 1)} ÷ ${lev.toFixed(1)} = ${fmt.pct(roa, 1)}. The gap between ROE and ROA comes from leverage.`,
    };
  });

  def('coverage', 'fa', 'Ratio analysis', 1, () => {
    const t = ri(0, 2);
    if (t === 0) {
      const ebitda = ri(80, 300), da = Math.round(ebitda * step(0.15, 0.35, 0.05)), int = ri(8, 40);
      const ebit = ebitda - da, cov = ebit / int;
      return {
        q: `EBITDA is $${ebitda}m, D&A is $${da}m and interest expense is $${int}m. What is the interest coverage ratio (EBIT ÷ interest)?`,
        opts: options(cov, [ebitda / int, (ebit - int) / int, int / ebit], (v) => fmt.x(v, 1)),
        exp: `EBIT = ${ebitda} − ${da} = ${ebit}. Coverage = ${ebit} ÷ ${int} = ${fmt.x(cov, 1)}. Using EBITDA (${fmt.x(ebitda / int, 1)}) gives the EBITDA coverage ratio instead, which is a different metric.`,
      };
    }
    if (t === 1) {
      const debt = ri(150, 600), cash = ri(20, 140), ebitda = ri(60, 220);
      const lev = (debt - cash) / ebitda;
      return {
        q: `Total debt is $${debt}m, cash is $${cash}m and EBITDA is $${ebitda}m. What is net debt ÷ EBITDA?`,
        opts: options(lev, [debt / ebitda, (debt + cash) / ebitda, ebitda / (debt - cash)], (v) => fmt.x(v, 2)),
        exp: `Net debt = ${debt} − ${cash} = ${debt - cash}. Net leverage = ${debt - cash} ÷ ${ebitda} = ${fmt.x(lev, 2)}.`,
      };
    }
    const ca = ri(120, 400), inv = Math.round(ca * step(0.25, 0.45, 0.05)), cl = ri(90, 300);
    const qr = (ca - inv) / cl;
    return {
      q: `Current assets are $${ca}m (including $${inv}m of inventory) and current liabilities are $${cl}m. What is the quick ratio?`,
      opts: options(qr, [ca / cl, inv / cl, (ca + inv) / cl], (v) => fmt.x(v, 2)),
      exp: `Quick ratio excludes inventory: (${ca} − ${inv}) ÷ ${cl} = ${fmt.x(qr, 2)}. The current ratio would be ${fmt.x(ca / cl, 2)}.`,
    };
  });

  def('ccc', 'fa', 'Working capital metrics', 2, () => {
    const rev = ri(400, 1200), cogs = Math.round(rev * step(0.55, 0.75, 0.05));
    const ar = Math.round(rev * ri(25, 60) / 365), inv = Math.round(cogs * ri(30, 90) / 365), ap = Math.round(cogs * ri(25, 60) / 365);
    const dso = ar / rev * 365, dio = inv / cogs * 365, dpo = ap / cogs * 365;
    const ccc = dso + dio - dpo;
    return {
      q: `Revenue $${rev}m, COGS $${cogs}m, accounts receivable $${ar}m, inventory $${inv}m, accounts payable $${ap}m. Using a 365-day year, what is the cash conversion cycle?`,
      opts: options(ccc, [dso + dio + dpo, dso + inv / rev * 365 - ap / rev * 365, dso - dio + dpo], fmt.days),
      exp: `DSO = ${ar}/${rev}×365 = ${dso.toFixed(1)}; DIO = ${inv}/${cogs}×365 = ${dio.toFixed(1)}; DPO = ${ap}/${cogs}×365 = ${dpo.toFixed(1)}. CCC = DSO + DIO − DPO = ${ccc.toFixed(1)} days. Inventory and payables days use COGS, not revenue.`,
    };
  });

  // ================= 3-statement linkages =================
  def('retained', 'i3', '3-statement linkages', 1, () => {
    const open = ri(100, 500), ni = ri(20, 90), pay = step(0.2, 0.6, 0.1), div = Math.round(ni * pay * 10) / 10;
    const close = open + ni - div;
    return {
      q: `Opening retained earnings are $${open}m. Net income is $${ni}m and the company pays out ${fmt.pct(pay, 0)} of net income as dividends. What are closing retained earnings?`,
      opts: options(close, [open + ni, open + div, open - ni + div, open + ni + div], (v) => fmt.m(v, 1)),
      exp: `Closing RE = opening + net income − dividends = ${open} + ${ni} − ${div} = ${fmt.m(close, 1)}.`,
    };
  });

  def('cfo', 'i3', '3-statement linkages', 2, () => {
    const ni = ri(30, 120), da = ri(10, 50), dar = ri(3, 20), dinv = ri(2, 15), dap = ri(2, 15);
    // AR increases (use), inventory decreases (source), AP increases (source)
    const cfo = ni + da - dar + dinv + dap;
    return {
      q: `Net income $${ni}m; D&A $${da}m; accounts receivable increased by $${dar}m; inventory decreased by $${dinv}m; accounts payable increased by $${dap}m. What is cash flow from operations?`,
      opts: options(cfo, [ni + da + dar - dinv - dap, ni - da - dar + dinv + dap, ni + da + dar + dinv + dap, ni + da - dar - dinv + dap], (v) => fmt.m(v, 0)),
      exp: `CFO = NI + D&A − ↑AR + ↓inventory + ↑AP = ${ni} + ${da} − ${dar} + ${dinv} + ${dap} = ${fmt.m(cfo, 0)}. More assets tied up = use of cash; more payables = source of cash.`,
    };
  });

  // ================= 3-statement schedules =================
  def('nwc', 'm3', 'Working capital schedule', 2, () => {
    const ar0 = ri(40, 120), inv0 = ri(30, 100), ap0 = ri(25, 90);
    const ar1 = ar0 + ri(-10, 25), inv1 = inv0 + ri(-10, 25), ap1 = ap0 + ri(-8, 20);
    const nwc0 = ar0 + inv0 - ap0, nwc1 = ar1 + inv1 - ap1, d = nwc1 - nwc0;
    if (Math.abs(d) < 5) return gens.nwc.fn();
    const f = (v) => (v < 0 ? '−' : '+') + '$' + Math.abs(v).toFixed(0) + 'm';
    return {
      q: `Year 0 → Year 1: receivables $${ar0}m → $${ar1}m, inventory $${inv0}m → $${inv1}m, payables $${ap0}m → $${ap1}m. What is the impact of the change in NWC on cash flow in Year 1?`,
      opts: options(-d, [d, -((ar1 + inv1 + ap1) - (ar0 + inv0 + ap0)), -((ar1 + inv1) - (ar0 + inv0))], f),
      exp: `NWC = AR + inventory − AP: ${nwc0} → ${nwc1}, a change of ${d > 0 ? '+' : ''}${d}. ${d > 0 ? 'An increase in NWC is a use of cash' : 'A decrease in NWC releases cash'}, so the cash impact is ${f(-d)}.`,
    };
  });

  def('days_balance', 'm3', 'Working capital schedule', 1, () => {
    const rev = ri(300, 1500), cogs = Math.round(rev * step(0.55, 0.75, 0.05)), t = ri(0, 2);
    if (t === 0) {
      const dso = ri(30, 75), ar = rev * dso / 365;
      return { q: `Forecast revenue is $${rev}m and the DSO assumption is ${dso} days (365-day year). What is forecast accounts receivable?`,
        opts: options(ar, [cogs * dso / 365, rev * dso / 360, rev / dso], (v) => fmt.m(v, 1)),
        exp: `AR = revenue × DSO ÷ 365 = ${rev} × ${dso} ÷ 365 = ${fmt.m(ar, 1)}.` };
    }
    if (t === 1) {
      const dio = ri(30, 90), inv = cogs * dio / 365;
      return { q: `Forecast revenue is $${rev}m, forecast COGS is $${cogs}m and the inventory days (DIO) assumption is ${dio}. What is forecast inventory?`,
        opts: options(inv, [rev * dio / 365, cogs * dio / 360, cogs / dio], (v) => fmt.m(v, 1)),
        exp: `Inventory = COGS × DIO ÷ 365 = ${cogs} × ${dio} ÷ 365 = ${fmt.m(inv, 1)}. Inventory is driven by COGS, not revenue.` };
    }
    const dpo = ri(25, 70), ap = cogs * dpo / 365;
    return { q: `Forecast revenue is $${rev}m, forecast COGS is $${cogs}m and the payables days (DPO) assumption is ${dpo}. What is forecast accounts payable?`,
      opts: options(ap, [rev * dpo / 365, cogs * dpo / 360, cogs / dpo], (v) => fmt.m(v, 1)),
      exp: `AP = COGS × DPO ÷ 365 = ${cogs} × ${dpo} ÷ 365 = ${fmt.m(ap, 1)}.` };
  });

  def('debt', 'm3', 'Debt schedule', 2, () => {
    const open = ri(20, 80) * 10, rep = ri(2, 10) * 10, r = step(0.05, 0.09, 0.005);
    const close = open - rep, avg = (open + close) / 2;
    if (Math.random() < 0.5) {
      const int = avg * r;
      return { q: `Opening term loan is $${open}m with a mandatory repayment of $${rep}m during the year. The rate is ${fmt.pct(r, 1)}, charged on the AVERAGE balance. What is interest expense?`,
        opts: options(int, [open * r, close * r, rep * r], (v) => fmt.m(v, 1)),
        exp: `Closing = ${open} − ${rep} = ${close}. Average = ${avg}. Interest = ${avg} × ${fmt.pct(r, 1)} = ${fmt.m(int, 1)}. Note: average-balance interest creates a circular reference when the repayment depends on cash. That's why models add a circularity switch.` };
    }
    const int = open * r;
    return { q: `Opening revolver balance is $${open}m. During the year the company repays $${rep}m. Interest of ${fmt.pct(r, 1)} is charged on the OPENING balance to avoid circularity. What is interest expense?`,
      opts: options(int, [avg * r, close * r, (open + rep) * r], (v) => fmt.m(v, 1)),
      exp: `Interest = opening balance × rate = ${open} × ${fmt.pct(r, 1)} = ${fmt.m(int, 1)}.` };
  });

  def('ppe', 'm3', 'PP&E schedule', 1, () => {
    const open = ri(200, 800), capex = ri(30, 120), dr = step(0.08, 0.15, 0.01);
    const dep = open * dr, close = open + capex - dep;
    return { q: `Opening net PP&E is $${open}m. CapEx is $${capex}m. Depreciation is ${fmt.pct(dr, 0)} of OPENING net PP&E. What is closing net PP&E?`,
      opts: options(close, [open + capex + dep, open - capex - dep, open + capex - (open + capex) * dr], (v) => fmt.m(v, 1)),
      exp: `Depreciation = ${open} × ${fmt.pct(dr, 0)} = ${dep.toFixed(1)}. Closing PP&E = ${open} + ${capex} − ${dep.toFixed(1)} = ${fmt.m(close, 1)}.` };
  });

  // ================= Forecasting =================
  def('cagr', 'fc', 'Growth rates', 1, () => {
    const start = ri(100, 400), n = ri(3, 6), g = step(0.03, 0.15, 0.005), end = Math.round(start * Math.pow(1 + g, n));
    const cagr = Math.pow(end / start, 1 / n) - 1;
    const y0 = 2026 - n;
    return { q: `Revenue grew from $${start}m in ${y0} to $${end}m in 2026. What is the compound annual growth rate (CAGR)?`,
      opts: options(cagr, [(end / start - 1) / n, Math.pow(end / start, 1 / (n + 1)) - 1, end / start - 1, Math.pow(end / start, 1 / (n - 1)) - 1], (v) => fmt.pct(v, 1)),
      exp: `${y0}→2026 is ${n} periods. CAGR = (${end}/${start})^(1/${n}) − 1 = ${fmt.pct(cagr, 1)}. Common traps: counting ${n + 1} years, or using the simple average.` };
  });

  def('avg_growth', 'fc', 'Forecasting methods', 2, () => {
    const r0 = ri(200, 500), gs = [step(0.02, 0.12, 0.01), step(0.02, 0.12, 0.01), step(0.02, 0.12, 0.01)];
    const rs = [r0]; gs.forEach((g) => rs.push(Math.round(rs[rs.length - 1] * (1 + g))));
    const real = [rs[1] / rs[0] - 1, rs[2] / rs[1] - 1, rs[3] / rs[2] - 1];
    const avg = mean(real), next = rs[3] * (1 + avg);
    return { q: `Revenue for the last four years: $${rs.join('m, $')}m. Forecast next year's revenue using the AVERAGE of the last three annual growth rates.`,
      opts: options(next, [rs[3] * (1 + real[2]), rs[3] + (rs[3] - rs[0]) / 3, rs[3] * (1 + (rs[3] / rs[0] - 1) / 4)], (v) => fmt.m(v, 1)),
      exp: `Growth rates: ${real.map((x) => fmt.pct(x, 1)).join(', ')}. Average = ${fmt.pct(avg, 2)}. Forecast = ${rs[3]} × (1 + ${fmt.pct(avg, 2)}) = ${fmt.m(next, 1)}.` };
  });

  // ================= Operational modeling =================
  def('breakeven', 'op', 'Unit economics', 1, () => {
    const price = ri(20, 80), vc = Math.round(price * step(0.35, 0.7, 0.05)), fc = ri(2, 12) * 100000;
    const cm = price - vc;
    if (Math.random() < 0.5) {
      const be = fc / cm;
      return { q: `A product sells for $${price} with variable cost of $${vc} per unit. Fixed costs are $${fc.toLocaleString()} per year. What is the break-even volume?`,
        opts: options(be, [fc / price, fc / vc, fc / (price + vc)], fmt.units),
        exp: `Contribution margin = ${price} − ${vc} = $${cm} per unit. Break-even = ${fc.toLocaleString()} ÷ ${cm} = ${fmt.units(be)}.` };
    }
    const target = ri(1, 5) * 100000, u = (fc + target) / cm;
    return { q: `Price $${price}/unit, variable cost $${vc}/unit, fixed costs $${fc.toLocaleString()}. How many units are needed to earn an operating profit of $${target.toLocaleString()}?`,
      opts: options(u, [fc / cm, (fc + target) / price, target / cm], fmt.units),
      exp: `Units = (fixed costs + target profit) ÷ contribution margin = (${fc.toLocaleString()} + ${target.toLocaleString()}) ÷ ${cm} = ${fmt.units(u)}.` };
  });

  def('capacity', 'op', 'Capacity & drivers', 2, () => {
    const lines = ri(2, 6), cap = ri(20, 60) * 1000, util = step(0.6, 0.95, 0.05), price = ri(50, 250);
    const units = lines * cap * util, rev = units * price / 1e6;
    return { q: `A plant has ${lines} production lines, each with capacity of ${cap.toLocaleString()} units per year. Forecast utilization is ${fmt.pct(util, 0)} and the average selling price is $${price}. What is forecast revenue?`,
      opts: options(rev, [lines * cap * price / 1e6, cap * util * price / 1e6, lines * cap * (1 - util) * price / 1e6], (v) => fmt.m(v, 2)),
      exp: `Units = ${lines} × ${cap.toLocaleString()} × ${fmt.pct(util, 0)} = ${units.toLocaleString()}. Revenue = units × $${price} = ${fmt.m(rev, 2)}. Driver-based forecasts like this are the core of operational modeling.` };
  });

  // ================= Intro to valuation =================
  def('pv', 'bv', 'Time value of money', 1, () => {
    const cf = ri(50, 500), r = step(0.05, 0.12, 0.005), n = ri(2, 8);
    const pv = cf / Math.pow(1 + r, n);
    return { q: `What is the present value of $${cf}m received in ${n} years at a ${fmt.pct(r, 1)} discount rate?`,
      opts: options(pv, [cf / (1 + r * n), cf / Math.pow(1 + r, n - 1), cf * Math.pow(1 + r, n)], (v) => fmt.m(v, 1)),
      exp: `PV = ${cf} ÷ (1 + ${fmt.pct(r, 1)})^${n} = ${fmt.m(pv, 1)}.` };
  });

  def('npv', 'bv', 'Time value of money', 2, () => {
    const r = step(0.07, 0.12, 0.01), c0 = ri(80, 200), cf = [ri(20, 70), ri(30, 80), ri(40, 90)];
    const npv = -c0 + cf.reduce((s, c, i) => s + c / Math.pow(1 + r, i + 1), 0);
    return { q: `A project costs $${c0}m today and returns $${cf[0]}m, $${cf[1]}m and $${cf[2]}m at the end of years 1–3. At a ${fmt.pct(r, 0)} discount rate, what is the NPV?`,
      opts: options(npv, [sum(cf) - c0, npv / (1 + r), -c0 + cf.reduce((s, c, i) => s + c / Math.pow(1 + r, i), 0)], (v) => fmt.m(v, 1)),
      exp: `NPV = −${c0} + ${cf[0]}/${(1 + r).toFixed(2)} + ${cf[1]}/${(1 + r).toFixed(2)}² + ${cf[2]}/${(1 + r).toFixed(2)}³ = ${fmt.m(npv, 1)}. ${npv > 0 ? 'Positive NPV → value-creating at this hurdle rate.' : 'Negative NPV → the project destroys value at this hurdle rate.'}` };
  });

  def('irr2', 'bv', 'Returns', 2, () => {
    const inv = ri(50, 300), moic = step(1.5, 3.5, 0.1), n = ri(3, 7), out = Math.round(inv * moic);
    const irr = Math.pow(out / inv, 1 / n) - 1;
    return { q: `An investor puts in $${inv}m today and receives $${out}m in ${n} years, with no interim cash flows. What is the IRR?`,
      opts: options(irr, [(out / inv - 1) / n, out / inv - 1, Math.pow(out / inv, 1 / (n + 1)) - 1], (v) => fmt.pct(v, 1)),
      exp: `With one inflow, IRR = (${out}/${inv})^(1/${n}) − 1 = ${fmt.pct(irr, 1)}. The multiple of money is ${(out / inv).toFixed(2)}x. IRR also reflects time, the multiple doesn't.` };
  });

  def('ev_build', 'bv', 'Enterprise value', 1, () => {
    const sh = ri(50, 400), px = step(8, 60, 0.5), debt = ri(100, 900), cash = ri(20, 200), nci = ri(0, 60), pref = pick([0, 0, ri(10, 80)]);
    const mcap = sh * px, ev = mcap + debt - cash + nci + pref;
    return { q: `${sh}m shares at $${px.toFixed(2)}; debt $${debt}m; cash $${cash}m; non-controlling interest $${nci}m; preferred stock $${pref}m. What is enterprise value?`,
      opts: options(ev, [mcap + debt + cash + nci + pref, mcap + debt - cash, mcap - debt + cash - nci - pref], (v) => fmt.m(v, 0)),
      exp: `EV = market cap + debt − cash + NCI + preferred = ${mcap.toFixed(0)} + ${debt} − ${cash} + ${nci} + ${pref} = ${fmt.m(ev, 0)}.` };
  });

  def('ev_bridge', 'd2', 'EV to equity bridge', 2, () => {
    const ev = ri(80, 300) * 10, debt = ri(20, 80) * 10, cash = ri(5, 40) * 5, nci = ri(0, 40), pref = pick([0, ri(10, 60)]), sh = ri(40, 250);
    const eq = ev - debt + cash - nci - pref, px = eq / sh;
    return { q: `A DCF gives enterprise value of $${ev}m. Debt $${debt}m, cash $${cash}m, NCI $${nci}m, preferred $${pref}m, ${sh}m diluted shares. What is the implied share price?`,
      opts: options(px, [(ev + debt - cash) / sh, ev / sh, (ev - debt + cash) / sh, (ev - debt - cash - nci - pref) / sh], (v) => fmt.usd(v, 2)),
      exp: `Equity value = EV − debt + cash − NCI − preferred = ${ev} − ${debt} + ${cash} − ${nci} − ${pref} = ${eq}. Price = ${eq} ÷ ${sh} = ${fmt.usd(px, 2)}.` };
  });

  // ================= DCF fundamentals =================
  def('capm', 'd1', 'Cost of equity (CAPM)', 1, () => {
    const rf = step(0.025, 0.05, 0.0025), b = step(0.6, 1.8, 0.05), mrp = step(0.04, 0.07, 0.005);
    const ke = rf + b * mrp;
    if (Math.random() < 0.5) {
      const rm = rf + mrp;
      return { q: `Risk-free rate ${fmt.pct(rf, 2)}, beta ${b.toFixed(2)}, expected market return ${fmt.pct(rm, 2)}. What is the cost of equity?`,
        opts: options(ke, [rf + b * rm, b * mrp, rf + mrp, b * rm], (v) => fmt.pct(v, 2)),
        exp: `Market risk premium = ${fmt.pct(rm, 2)} − ${fmt.pct(rf, 2)} = ${fmt.pct(mrp, 2)}. Ke = ${fmt.pct(rf, 2)} + ${b.toFixed(2)} × ${fmt.pct(mrp, 2)} = ${fmt.pct(ke, 2)}.` };
    }
    return { q: `Risk-free rate ${fmt.pct(rf, 2)}, beta ${b.toFixed(2)}, equity (market) risk premium ${fmt.pct(mrp, 2)}. What is the cost of equity?`,
      opts: options(ke, [rf + b * (mrp - rf), b * mrp, rf + mrp, b * (rf + mrp)], (v) => fmt.pct(v, 2)),
      exp: `The premium is already Rm − Rf, so don't subtract Rf again. Ke = ${fmt.pct(rf, 2)} + ${b.toFixed(2)} × ${fmt.pct(mrp, 2)} = ${fmt.pct(ke, 2)}.` };
  });

  def('wacc', 'd1', 'WACC', 2, () => {
    const E = ri(30, 150) * 10, D = ri(10, 80) * 10, ke = step(0.08, 0.14, 0.005), kd = step(0.04, 0.08, 0.005), t = step(0.2, 0.3, 0.05);
    const V = E + D, w = E / V * ke + D / V * kd * (1 - t);
    return { q: `Market value of equity $${E}m, market value of debt $${D}m. Cost of equity ${fmt.pct(ke, 1)}, pre-tax cost of debt ${fmt.pct(kd, 1)}, tax rate ${fmt.pct(t, 0)}. What is WACC?`,
      opts: options(w, [E / V * ke + D / V * kd, D / V * ke + E / V * kd * (1 - t), (ke + kd * (1 - t)) / 2, ke * (1 - D / E) + D / E * kd * (1 - t)], (v) => fmt.pct(v, 2)),
      exp: `Weights: E/V = ${fmt.pct(E / V, 1)}, D/V = ${fmt.pct(D / V, 1)}. WACC = ${fmt.pct(E / V, 1)}×${fmt.pct(ke, 1)} + ${fmt.pct(D / V, 1)}×${fmt.pct(kd, 1)}×(1−${fmt.pct(t, 0)}) = ${fmt.pct(w, 2)}. Use market values and AFTER-tax debt.` };
  });

  def('kd_at', 'd1', 'WACC', 1, () => {
    const kd = step(0.04, 0.09, 0.0025), t = step(0.15, 0.35, 0.05), a = kd * (1 - t);
    return { q: `A company's bonds yield ${fmt.pct(kd, 2)} and its marginal tax rate is ${fmt.pct(t, 0)}. What after-tax cost of debt goes into WACC?`,
      opts: options(a, [kd, kd * t, kd / (1 - t)], (v) => fmt.pct(v, 2)),
      exp: `After-tax Kd = ${fmt.pct(kd, 2)} × (1 − ${fmt.pct(t, 0)}) = ${fmt.pct(a, 2)}. Interest is tax-deductible, so the tax shield lowers the effective cost.` };
  });

  def('beta', 'd1', 'Beta', 3, () => {
    const bu = step(0.6, 1.2, 0.05), de = step(0.2, 1.0, 0.05), t = step(0.2, 0.3, 0.05);
    const bl = bu * (1 + (1 - t) * de);
    if (Math.random() < 0.5) {
      return { q: `The peer-group unlevered beta is ${bu.toFixed(2)}. Your target's D/E is ${de.toFixed(2)} and its tax rate is ${fmt.pct(t, 0)}. What is the relevered beta?`,
        opts: options(bl, [bu * (1 + de), bu / (1 + (1 - t) * de), bu * (1 + t * de)], fmt.beta),
        exp: `βL = βU × [1 + (1 − t) × D/E] = ${bu.toFixed(2)} × [1 + ${(1 - t).toFixed(2)} × ${de.toFixed(2)}] = ${bl.toFixed(2)}.` };
    }
    const blr = r2(bl), bur = blr / (1 + (1 - t) * de);
    return { q: `A peer has a levered beta of ${blr.toFixed(2)}, D/E of ${de.toFixed(2)} and a tax rate of ${fmt.pct(t, 0)}. What is its unlevered beta?`,
      opts: options(bur, [blr / (1 + de), blr * (1 + (1 - t) * de), blr * (1 - de)], fmt.beta),
      exp: `βU = βL ÷ [1 + (1 − t) × D/E] = ${blr.toFixed(2)} ÷ ${(1 + (1 - t) * de).toFixed(3)} = ${bur.toFixed(2)}. Unlevering strips out the financial risk so peers with different leverage can be compared.` };
  });

  def('fcff', 'd1', 'Free cash flow', 2, () => {
    const ebitda = ri(80, 300), da = Math.round(ebitda * step(0.15, 0.3, 0.05)), t = step(0.2, 0.3, 0.05), capex = Math.round(da * step(1.0, 1.6, 0.1)), dnwc = ri(2, 20);
    const ebit = ebitda - da, f = ebit * (1 - t) + da - capex - dnwc;
    if (Math.random() < 0.5) {
      return { q: `EBIT $${ebit}m, tax rate ${fmt.pct(t, 0)}, D&A $${da}m, CapEx $${capex}m, increase in NWC $${dnwc}m. What is unlevered free cash flow (FCFF)?`,
        opts: options(f, [ebit * (1 - t) + da - capex + dnwc, ebit + da - capex - dnwc, ebit * (1 - t) - capex - dnwc, ebit * (1 - t) + da + capex - dnwc], (v) => fmt.m(v, 1)),
        exp: `FCFF = EBIT×(1−t) + D&A − CapEx − ΔNWC = ${(ebit * (1 - t)).toFixed(1)} + ${da} − ${capex} − ${dnwc} = ${fmt.m(f, 1)}.` };
    }
    return { q: `EBITDA $${ebitda}m, D&A $${da}m, tax rate ${fmt.pct(t, 0)}, CapEx $${capex}m, increase in NWC $${dnwc}m. What is FCFF?`,
      opts: options(f, [ebitda * (1 - t) - capex - dnwc, ebitda - ebit * t, ebitda - ebit * t - capex + dnwc, ebitda - capex - dnwc], (v) => fmt.m(v, 1)),
      exp: `Taxes are on EBIT, not EBITDA: EBIT = ${ebit}, tax = ${(ebit * t).toFixed(1)}. FCFF = EBITDA − tax on EBIT − CapEx − ΔNWC = ${ebitda} − ${(ebit * t).toFixed(1)} − ${capex} − ${dnwc} = ${fmt.m(f, 1)}.` };
  });

  def('tv_gordon', 'd1', 'Terminal value', 2, () => {
    const fcf = ri(40, 200), w = step(0.08, 0.12, 0.005), g = step(0.015, 0.035, 0.005), n = 5;
    const tv = fcf * (1 + g) / (w - g);
    return { q: `Year-${n} FCFF is $${fcf}m. WACC is ${fmt.pct(w, 1)} and long-term growth is ${fmt.pct(g, 1)}. What is the terminal value at the end of Year ${n} (perpetuity growth method)?`,
      opts: options(tv, [fcf / (w - g), fcf * (1 + g) / w, tv / Math.pow(1 + w, n), fcf * (1 + g) / (w + g)], (v) => fmt.m(v, 0)),
      exp: `TV = FCF₅ × (1+g) ÷ (WACC − g) = ${fcf} × ${(1 + g).toFixed(3)} ÷ (${fmt.pct(w, 1)} − ${fmt.pct(g, 1)}) = ${fmt.m(tv, 0)}. That's a Year-5 value. It still needs discounting back to today.` };
  });

  // ================= Applied DCF =================
  def('tv_exit', 'd2', 'Terminal value', 2, () => {
    const ebitda = ri(60, 250), mult = step(6, 12, 0.5), w = step(0.08, 0.12, 0.005), n = 5;
    const tv = ebitda * mult, pv = tv / Math.pow(1 + w, n);
    return { q: `Year-${n} EBITDA is $${ebitda}m. Using an exit multiple of ${mult.toFixed(1)}x and a WACC of ${fmt.pct(w, 1)}, what is the PRESENT value of the terminal value (end-of-year discounting)?`,
      opts: options(pv, [tv, tv / Math.pow(1 + w, n - 1), tv / Math.pow(1 + w, n + 1), tv / (1 + w * n)], (v) => fmt.m(v, 0)),
      exp: `TV = ${ebitda} × ${mult.toFixed(1)} = ${tv.toFixed(0)} at end of Year ${n}. PV = ${tv.toFixed(0)} ÷ ${(1 + w).toFixed(3)}^${n} = ${fmt.m(pv, 0)}. Even with mid-year convention for FCFs, an exit-multiple TV is typically discounted a full ${n} years.` };
  });

  def('midyear', 'd2', 'Discounting conventions', 2, () => {
    const fcf = ri(40, 200), w = step(0.08, 0.12, 0.005), t = ri(2, 5);
    const pv = fcf / Math.pow(1 + w, t - 0.5);
    return { q: `Using the mid-year convention, what is the present value of Year-${t} FCFF of $${fcf}m at a WACC of ${fmt.pct(w, 1)}?`,
      opts: options(pv, [fcf / Math.pow(1 + w, t), fcf / Math.pow(1 + w, t + 0.5), fcf / Math.pow(1 + w, t - 1)], (v) => fmt.m(v, 1)),
      exp: `Mid-year assumes cash arrives evenly, so the average arrives mid-year: discount period = ${t} − 0.5 = ${t - 0.5}. PV = ${fcf} ÷ ${(1 + w).toFixed(3)}^${t - 0.5} = ${fmt.m(pv, 1)}. Mid-year gives a HIGHER value than end-of-year.` };
  });

  def('dcf_ev', 'd2', 'DCF valuation', 3, () => {
    const w = step(0.08, 0.11, 0.005), g = step(0.02, 0.03, 0.005), f = [ri(40, 70)]; for (let i = 0; i < 2; i++) f.push(Math.round(f[i] * step(1.03, 1.12, 0.01)));
    const n = 3, tv = f[2] * (1 + g) / (w - g);
    const pvF = f.reduce((s, c, i) => s + c / Math.pow(1 + w, i + 1), 0), pvTv = tv / Math.pow(1 + w, n), ev = pvF + pvTv;
    return { q: `FCFF forecast: Year 1 $${f[0]}m, Year 2 $${f[1]}m, Year 3 $${f[2]}m. WACC ${fmt.pct(w, 1)}, terminal growth ${fmt.pct(g, 1)} (Gordon growth on Year-3 FCFF). End-of-year discounting. What is enterprise value?`,
      opts: options(ev, [pvF + tv, sum(f) + pvTv, pvF + tv / Math.pow(1 + w, n + 1), pvF + f[2] / (w - g) / Math.pow(1 + w, n)], (v) => fmt.m(v, 0)),
      exp: `PV of FCFs = ${pvF.toFixed(1)}. TV = ${f[2]}×${(1 + g).toFixed(3)}/(${fmt.pct(w, 1)}−${fmt.pct(g, 1)}) = ${tv.toFixed(1)}; PV of TV = ${tv.toFixed(1)}/${(1 + w).toFixed(3)}³ = ${pvTv.toFixed(1)}. EV = ${fmt.m(ev, 0)}. TV is ${fmt.pct(pvTv / ev, 0)} of EV, which is typical, and it's why TV assumptions matter so much.` };
  });

  def('implied_g', 'd2', 'Terminal value', 3, () => {
    const fcf = ri(50, 150), w = step(0.08, 0.12, 0.005), mult = step(7, 11, 0.5), ebitda = Math.round(fcf * step(1.4, 2.0, 0.1));
    const tv = ebitda * mult, g = (tv * w - fcf) / (tv + fcf);
    return { q: `A DCF uses an exit multiple of ${mult.toFixed(1)}x on Year-5 EBITDA of $${ebitda}m. Year-5 FCFF is $${fcf}m and WACC is ${fmt.pct(w, 1)}. What perpetual growth rate does this terminal value imply?`,
      opts: options(g, [(tv * w - fcf) / tv, w - fcf / tv, (tv * w - fcf) / (tv - fcf)], (v) => fmt.pct(v, 2)),
      exp: `Set TV = FCF(1+g)/(W−g) and solve: g = (TV×W − FCF) ÷ (TV + FCF) = (${tv.toFixed(0)}×${fmt.pct(w, 1)} − ${fcf}) ÷ (${tv.toFixed(0)} + ${fcf}) = ${fmt.pct(g, 2)}. Cross-checking the two TV methods is a standard sanity check.` };
  });

  def('fcfe', 'd2', 'Free cash flow', 3, () => {
    const fcff = ri(50, 200), int = ri(5, 30), t = step(0.2, 0.3, 0.05), nb = ri(-30, 30);
    const fcfe = fcff - int * (1 - t) + nb;
    return { q: `FCFF is $${fcff}m. Interest expense is $${int}m, tax rate ${fmt.pct(t, 0)}, and net borrowing is ${nb >= 0 ? '+' : '−'}$${Math.abs(nb)}m. What is FCFE?`,
      opts: options(fcfe, [fcff - int + nb, fcff - int * (1 - t) - nb, fcff + int * (1 - t) + nb], (v) => fmt.m(v, 1)),
      exp: `FCFE = FCFF − interest × (1 − t) + net borrowing = ${fcff} − ${(int * (1 - t)).toFixed(1)} ${nb >= 0 ? '+' : '−'} ${Math.abs(nb)} = ${fmt.m(fcfe, 1)}. FCFE is discounted at the cost of EQUITY, not WACC.` };
  });

  // ================= Comparable valuation =================
  const peerNames = ['Alpha', 'Bravo', 'Cobalt', 'Delta', 'Ember', 'Fjord', 'Granite'];
  def('comps', 'cv', 'Trading comps', 2, () => {
    const k = 5, mults = Array.from({ length: k }, () => step(6, 13, 0.1)); mults[ri(0, k - 1)] = step(16, 22, 0.5); // one outlier
    const ebitda = ri(40, 200), nd = ri(50, 400), sh = ri(30, 200);
    const med = median(mults), avg = mean(mults);
    const px = (ebitda * med - nd) / sh;
    return { q: `Peer EV/EBITDA multiples: ${mults.map((m, i) => peerNames[i] + ' ' + m.toFixed(1) + 'x').join(', ')}. Target EBITDA $${ebitda}m, net debt $${nd}m, ${sh}m shares. Using the MEDIAN multiple, what is the implied share price?`,
      opts: options(px, [(ebitda * avg - nd) / sh, ebitda * med / sh, (ebitda * med + nd) / sh], (v) => fmt.usd(v, 2)),
      exp: `Median = ${med.toFixed(1)}x (the median resists the ${Math.max(...mults).toFixed(1)}x outlier; the mean is ${avg.toFixed(2)}x). EV = ${ebitda} × ${med.toFixed(1)} = ${(ebitda * med).toFixed(1)}. Equity = EV − net debt = ${(ebitda * med - nd).toFixed(1)}. Price = ${fmt.usd(px, 2)}.` };
  });

  def('pe', 'cv', 'Trading comps', 2, () => {
    const pes = Array.from({ length: 5 }, () => step(10, 22, 0.5)), ni = ri(20, 120), sh = ri(20, 150), nd = ri(40, 300);
    const med = median(pes), eps = ni / sh, px = med * eps;
    return { q: `Peer P/E multiples: ${pes.map((m) => m.toFixed(1) + 'x').join(', ')}. The target earns net income of $${ni}m with ${sh}m shares and has $${nd}m of net debt. Using the median P/E, what is the implied share price?`,
      opts: options(px, [mean(pes) * eps, (med * ni - nd) / sh, (med * ni + nd) / sh], (v) => fmt.usd(v, 2)),
      exp: `EPS = ${ni}/${sh} = ${eps.toFixed(3)}. Median P/E = ${med.toFixed(1)}x. Price = ${med.toFixed(1)} × ${eps.toFixed(3)} = ${fmt.usd(px, 2)}. P/E is an EQUITY multiple, so you don't adjust for net debt.` };
  });

  def('precedent', 'cv', 'Precedent transactions', 3, () => {
    const px = step(10, 50, 0.5), prem = step(0.2, 0.45, 0.05), sh = ri(40, 200), nd = ri(50, 400), ebitda = Math.round((px * sh + nd) / step(6, 11, 0.5));
    const offer = px * (1 + prem), eqv = offer * sh, ev = eqv + nd, m = ev / ebitda;
    return { q: `A target's unaffected share price was $${px.toFixed(2)}. The acquirer paid a ${fmt.pct(prem, 0)} premium. ${sh}m shares, net debt $${nd}m, LTM EBITDA $${ebitda}m. What EV/EBITDA multiple did the deal imply?`,
      opts: options(m, [(px * sh + nd) / ebitda, eqv / ebitda, (px * sh + nd) * (1 + prem) / ebitda, (eqv - nd) / ebitda], (v) => fmt.x(v, 1)),
      exp: `Offer price = ${px.toFixed(2)} × ${(1 + prem).toFixed(2)} = ${offer.toFixed(2)}. Equity = ${eqv.toFixed(1)}. Transaction EV = ${eqv.toFixed(1)} + ${nd} = ${ev.toFixed(1)}. EV/EBITDA = ${fmt.x(m, 1)}. The premium applies to EQUITY value, and that's why precedents usually trade above comps.` };
  });

  def('calendarize', 'cv', 'Calendarization', 3, () => {
    const mEnd = pick([3, 6, 9]), names = { 3: 'March 31', 6: 'June 30', 9: 'September 30' };
    const a = ri(80, 200), b = Math.round(a * step(1.05, 1.2, 0.01));
    const cy = (mEnd / 12) * a + ((12 - mEnd) / 12) * b;
    return { q: `A peer's fiscal year ends ${names[mEnd]}. EBITDA for FY ending ${names[mEnd]} 2026 is $${a}m and for FY ending ${names[mEnd]} 2027 is $${b}m. What is calendar-year 2026 EBITDA?`,
      opts: options(cy, [((12 - mEnd) / 12) * a + (mEnd / 12) * b, (a + b) / 2, a], (v) => fmt.m(v, 1)),
      exp: `CY2026 = Jan–Dec 2026. Jan–${['', '', '', 'Mar', '', '', 'Jun', '', '', 'Sep'][mEnd]} 2026 (${mEnd} months) falls in FY2026; the remaining ${12 - mEnd} months fall in FY2027. CY = ${mEnd}/12 × ${a} + ${12 - mEnd}/12 × ${b} = ${fmt.m(cy, 1)}.` };
  });

  // ================= Scenario & sensitivity =================
  def('sens_tv', 'ss', 'Sensitivity analysis', 3, () => {
    const fcf = ri(50, 150), w = step(0.08, 0.10, 0.005), g = step(0.02, 0.03, 0.005), dw = pick([0.005, 0.01]);
    const tv0 = fcf * (1 + g) / (w - g), tv1 = fcf * (1 + g) / (w + dw - g), ch = tv1 / tv0 - 1;
    return { q: `Terminal value uses FCF $${fcf}m, growth ${fmt.pct(g, 1)} and WACC ${fmt.pct(w, 1)}. In your sensitivity table, by what percentage does TV change if WACC rises by ${(dw * 10000).toFixed(0)} bps?`,
      opts: options(ch, [-dw / w, -dw, (w - g) / (w + dw - g) - 1 - dw], (v) => fmt.pct(v, 1)),
      exp: `TV falls from ${tv0.toFixed(0)} to ${tv1.toFixed(0)}: ${fmt.pct(ch, 1)}. The denominator (WACC − g) is small, so small rate changes move TV a lot. That's why WACC × g sensitivity tables are standard.` };
  });

  F.gens = gens;
  F.generate = function (id) {
    const g = gens[id];
    const out = g.fn();
    return { id: 'g:' + id, gen: id, unit: g.unit, topic: g.topic, diff: g.diff, type: 'calc', q: out.q, opts: out.opts, ans: 0, exp: out.exp };
  };
})(typeof window !== 'undefined' ? window : globalThis);
