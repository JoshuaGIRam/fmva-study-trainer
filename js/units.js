/* FMVA Trainer v2 — learning path (mapped to CFI's 15 FMVA core courses, 2026 curriculum)
   plus concise study notes. Notes are original summaries, not CFI course content. */
(function (G) {
  const F = (G.FMVA = G.FMVA || {});

  F.sections = [
    { id: 's1', name: 'Foundations', sub: 'Excel, analysis & model design', units: ['xl', 'fa', 'mg'] },
    { id: 's2', name: 'Building the Model', sub: '3 statements, forecasting & auditing', units: ['i3', 'm3', 'fc', 'op', 'au'], checkpoint: ['case_3s', 'case_audit'] },
    { id: 's3', name: 'Valuation', sub: 'DCF and relative valuation', units: ['bv', 'd1', 'd2', 'cv'], checkpoint: ['case_dcf', 'case_comps'] },
    { id: 's4', name: 'Analysis & Communication', sub: 'Scenarios, dashboards, pitchbooks, ethics', units: ['ss', 'dv', 'pp', 'et'], checkpoint: ['mock'] },
  ];

  F.units = {
    xl: { name: 'Excel Toolkit', icon: '⌗', course: 'Excel skills used across the program (Advanced Excel Formulas is an elective)',
      notes: [
        ['Lookups', ['<b>XLOOKUP(lookup, lookup_array, return_array, [if_not_found], [match_mode])</b> — exact match by default, can search left, returns a default instead of #N/A.', '<b>INDEX(range, MATCH(value, lookup_range, 0))</b> — the classic flexible lookup; the 0 forces exact match.', 'VLOOKUP defaults to approximate match (TRUE) — always pass FALSE/0 for exact match. It cannot look left and breaks when columns are inserted.']],
        ['Aggregation', ['<b>SUMIFS(sum_range, crit_range1, crit1, …)</b> — the sum range comes FIRST (unlike SUMIF).', 'SUMPRODUCT multiplies arrays element-wise then sums — useful for weighted averages.', 'Use MIN/MAX to cap/floor values (e.g., revolver draws, cash sweeps).']],
        ['Finance functions', ['<b>NPV(rate, values)</b> treats the first value as end of period 1. For a time-0 outlay use <b>=CF0 + NPV(rate, CF1:CFn)</b>.', '<b>XNPV / XIRR</b> use actual dates — preferred when cash flows are irregular.', '<b>PMT(rate, nper, pv)</b> gives a level payment; the sign is opposite to pv.', 'IRR can have multiple answers when cash flows change sign more than once.']],
        ['Scenario tools', ['CHOOSE(index, v1, v2, v3) and INDEX/MATCH on a scenario table drive live scenarios.', 'Data tables (What-If Analysis) run sensitivities; they recalculate constantly — set calculation to "Automatic except data tables" in large models.', 'Goal Seek finds the input that makes an output hit a target (one variable).']],
        ['Shortcuts worth knowing', ['F2 edit cell · F4 toggle $ anchors · Ctrl+[ trace precedents · Ctrl+` show formulas · Alt+M+P / Alt+M+D trace precedents/dependents.', 'Absolute ($A$1), mixed ($A1 / A$1) and relative references — mixed refs let one formula fill a whole grid.']],
      ] },
    fa: { name: 'Financial Analysis', icon: '%', course: 'Financial Analysis Fundamentals',
      notes: [
        ['Profitability', ['Gross margin = gross profit ÷ revenue; EBITDA margin; EBIT (operating) margin; net margin.', 'ROA = net income ÷ total assets; ROE = net income ÷ shareholders’ equity; ROIC = NOPAT ÷ invested capital.']],
        ['DuPont', ['<b>ROE = net margin × asset turnover × equity multiplier</b> (NI/Rev × Rev/Assets × Assets/Equity).', 'Two firms with the same ROE can get there very differently — margin-driven vs leverage-driven.']],
        ['Liquidity & leverage', ['Current ratio = CA ÷ CL. Quick ratio = (CA − inventory) ÷ CL.', 'Debt/Equity, Debt/Capital, Net debt/EBITDA (lenders’ favourite), Interest coverage = EBIT ÷ interest.']],
        ['Efficiency', ['DSO = AR ÷ revenue × 365. DIO = inventory ÷ COGS × 365. DPO = AP ÷ COGS × 365.', '<b>Cash conversion cycle = DSO + DIO − DPO.</b> Lower is better — less cash tied up.']],
        ['Analysis techniques', ['Horizontal (trend, YoY) and vertical (common-size, % of revenue / % of assets) analysis.', 'Always compare ratios against history, peers and the business model — a “bad” ratio for one industry is normal for another.']],
      ] },
    mg: { name: 'Modeling Guidelines', icon: '▦', course: 'Financial Modeling Guidelines (new core course in 2026)',
      notes: [
        ['Structure', ['Separate <b>inputs → calculations → outputs</b>. Flow logically top-to-bottom, left-to-right.', 'One row = one calculation, consistent across all columns (time periods). Same column = same period on every sheet.', 'Keep it as simple as the purpose allows — a model is built for a decision.']],
        ['Formatting conventions', ['<b>Blue font = hard-coded inputs; black = formulas; green = links to other sheets.</b>', 'Shade input cells; label units ($m, %, days) on every row; consistent signs (be explicit about whether costs are negative).']],
        ['Formula hygiene', ['Never embed hard-codes inside formulas (e.g., =B5*1.05). Put 5% in an input cell.', 'Avoid very long nested formulas — split into helper rows. Avoid merged cells, hidden rows and unnecessary circularity.', 'Avoid OFFSET/INDIRECT where possible — volatile and hard to audit.']],
        ['Checks', ['Build checks: balance sheet balances, cash ≥ 0 / minimum cash, sources = uses, sum of segments = total.', 'Roll up all checks into one master check flag visible on the cover/dashboard.']],
      ] },
    i3: { name: '3-Statement Linkages', icon: '⇄', course: 'Introduction to 3-Statement Modeling',
      notes: [
        ['The core links', ['Net income → top of cash flow statement (indirect) and → retained earnings.', 'D&A: expense on IS → added back on CFS → reduces PP&E on BS.', 'CapEx: CFS investing outflow → increases PP&E.', 'Change in working capital accounts → CFO. Debt issued/repaid → CFF and debt balance.', 'Ending cash from CFS → cash on BS. Then <b>assets = liabilities + equity</b>.']],
        ['Indirect cash flow rules', ['Increase in an operating ASSET (AR, inventory) = use of cash (subtract).', 'Increase in an operating LIABILITY (AP, accrued) = source of cash (add).', 'Add back non-cash expenses (D&A, stock-based comp, impairments). Subtract non-cash gains.']],
        ['Classic walk-through', ['Depreciation +$10, tax 25%: NI −$7.5; CFO = −7.5 + 10 = +$2.5; PP&E −$10; cash +$2.5; RE −$7.5. Assets −7.5 = equity −7.5. ✔']],
        ['Build order', ['Historicals → assumptions/drivers → income statement → supporting schedules (NWC, PP&E, debt, equity) → balance sheet → cash flow statement → link cash → checks.']],
      ] },
    m3: { name: '3-Statement Modeling', icon: '☰', course: '3-Statement Modeling',
      notes: [
        ['Revenue & costs', ['Drive revenue with growth or volume × price; costs as % of revenue or with their own drivers.', 'Fixed vs variable cost split determines operating leverage.']],
        ['Working capital schedule', ['AR = revenue × DSO/365; inventory = COGS × DIO/365; AP = COGS × DPO/365.', 'ΔNWC flows to CFO. Increase in NWC = cash outflow.']],
        ['PP&E schedule', ['Closing PP&E = opening + CapEx − depreciation (− disposals).', 'Forecast CapEx as % of revenue or vs. D&A; depreciation as % of opening PP&E or via a waterfall by asset vintage.']],
        ['Debt & interest', ['Closing debt = opening + draws − repayments. Revolvers balance the model: draw when cash < minimum, repay when surplus.', 'Interest on <b>average</b> balance is more accurate but creates circularity → use a circ switch (iterative calc) or interest on <b>opening</b> balance.']],
        ['Equity', ['Closing equity = opening + net income − dividends + share issuance − buybacks (+ SBC).']],
      ] },
    fc: { name: 'Forecasting Techniques', icon: '↗', course: 'Forecasting Techniques (new core course in 2026)',
      notes: [
        ['Approaches', ['<b>Top-down</b>: market size × market share. <b>Bottom-up</b>: units × price, customers × spend, stores × sales per store.', 'Driver-based forecasting ties line items to operational drivers, making scenarios easy.']],
        ['Quantitative methods', ['Growth rates (YoY, CAGR = (End/Start)^(1/n) − 1). Moving averages smooth noise. Regression (e.g., LINEST / FORECAST.LINEAR / TREND) projects a relationship.', 'Seasonality: use seasonal indices or same-period-last-year growth for monthly/quarterly forecasts.']],
        ['Judgement', ['Sense-check: implied margins, market share, ROIC and growth vs history and peers.', 'Avoid “hockey sticks” — justify inflection points. Forecast errors compound over time.']],
      ] },
    op: { name: 'Operational Modeling', icon: '⚙', course: 'Operational Modeling',
      notes: [
        ['Driver logic', ['Revenue = capacity × utilization × price, or customers × conversion × average order value.', 'Cost build-up: variable cost per unit, semi-fixed (step costs as capacity is added), fixed overhead.']],
        ['Unit economics', ['Contribution margin = price − variable cost. Break-even units = fixed costs ÷ contribution margin.', 'Operating leverage: high fixed costs → profits swing more with volume.']],
        ['Capacity', ['When demand exceeds capacity, either cap volume or trigger CapEx for new capacity (step-change).', 'Use MIN(demand, capacity) to cap sales volume.']],
      ] },
    au: { name: 'Auditing & Balancing', icon: '✓', course: 'Auditing and Balancing a 3-Statement Model',
      notes: [
        ['Find the imbalance', ['Look for the FIRST period where the balance sheet doesn’t balance — the error is usually in that period’s flows.', 'Check whether the imbalance is constant (often an opening balance error) or growing (a flow error repeating each period).', 'An imbalance equal to 2× a number suggests a sign error on that number.']],
        ['Common errors', ['Cash flow item not linked to the BS (or vice versa); wrong sign on ΔNWC; D&A not linked to PP&E; dividends missing from RE; hard-coded numbers.', 'Inconsistent formulas across a row; references to the wrong period (off-by-one column).']],
        ['Tools', ['Trace precedents/dependents, Evaluate Formula, Show Formulas (Ctrl+`), Go To Special → Constants to find hard-codes, Watch Window.', 'Error-trap carefully: IFERROR can hide genuine mistakes.']],
        ['Circularity', ['Usually from interest on average debt or cash. Use a circuit breaker (switch cell that sets interest to 0) to clear #REF/#NUM blow-ups.']],
      ] },
    bv: { name: 'Business Valuation', icon: '⚖', course: 'Introduction to Business Valuation',
      notes: [
        ['Three approaches', ['<b>Intrinsic</b> (DCF): value of future cash flows. <b>Relative</b>: trading comps and precedent transactions. Also asset-based (liquidation/replacement).', 'Present results as a range — the “football field” chart.']],
        ['EV vs equity value', ['<b>EV = equity value + debt + preferred + NCI − cash</b>.', 'EV belongs to all capital providers; equity value to shareholders only.', 'Match numerators and denominators: EV ↔ revenue/EBITDA/EBIT/FCFF; equity value ↔ net income/EPS/FCFE.']],
        ['Time value of money', ['PV = FV ÷ (1+r)^n. NPV = Σ CF ÷ (1+r)^t. IRR is the rate where NPV = 0.', 'Accept projects with NPV > 0; IRR > hurdle rate (watch out for non-conventional cash flows).']],
      ] },
    d1: { name: 'DCF Fundamentals', icon: '∑', course: 'DCF Valuation Modeling Fundamentals',
      notes: [
        ['Unlevered FCF', ['<b>FCFF = EBIT × (1 − t) + D&A − CapEx − ΔNWC</b>. Taxes are on EBIT (NOPAT), not net income.', 'FCFF is before interest — it belongs to debt and equity holders — so discount at WACC.']],
        ['Cost of capital', ['<b>CAPM: Ke = Rf + β × (Rm − Rf)</b>.', '<b>WACC = E/V × Ke + D/V × Kd × (1 − t)</b> using MARKET values (target capital structure).', 'Relever beta: βL = βU × [1 + (1 − t) × D/E]. Unlever peers first, take median, relever at target D/E.']],
        ['Terminal value', ['Perpetuity growth: <b>TV = FCFₙ × (1 + g) ÷ (WACC − g)</b>; g ≤ long-run GDP/inflation.', 'Exit multiple: TV = final-year EBITDA × EV/EBITDA multiple.', 'TV is often 60–80% of EV — always sense-check it.']],
      ] },
    d2: { name: 'Applied DCF', icon: '◎', course: 'Applied DCF Valuation Modeling',
      notes: [
        ['Discounting conventions', ['End-of-year: discount year t by t periods. <b>Mid-year: t − 0.5</b> (cash arrives evenly) → higher value.', 'Stub periods: partial first year — scale the cash flow and the discount period.']],
        ['From EV to price', ['Equity value = EV − debt − preferred − NCI + cash (+ non-operating assets).', 'Divide by DILUTED shares (treasury stock method for options/RSUs).']],
        ['Sanity checks', ['Implied exit multiple from the perpetuity method, and implied g from the exit method.', 'Sensitivity tables: WACC × g, WACC × exit multiple, revenue growth × margin.']],
        ['FCFE alternative', ['FCFE = FCFF − interest × (1 − t) + net borrowing → discount at cost of equity → gives EQUITY value directly.']],
      ] },
    cv: { name: 'Comparable Valuation', icon: '≈', course: 'Comparable Valuation Fundamentals',
      notes: [
        ['Trading comps', ['Pick peers on industry, size, growth, margins, geography. Spread EV/Revenue, EV/EBITDA, EV/EBIT, P/E.', 'Use median (robust to outliers) and quartiles; apply to the target’s metric → implied EV or equity value → per share.']],
        ['Precedent transactions', ['Multiples paid in past M&A deals. Usually higher than trading comps because they include a <b>control premium</b> and synergies.', 'Older deals reflect different market conditions — weight recent deals.']],
        ['Mechanics', ['Calendarize to a common year-end; use LTM or forward (NTM) metrics consistently.', 'Normalize for one-offs (restructuring, impairments) before computing multiples.', 'EV multiples are capital-structure neutral; P/E is affected by leverage.']],
      ] },
    ss: { name: 'Scenario & Sensitivity', icon: '⇅', course: 'Scenario & Sensitivity Analysis in Excel',
      notes: [
        ['Scenario vs sensitivity', ['<b>Scenario</b>: change a SET of related assumptions together (downside/base/upside).', '<b>Sensitivity</b>: change one or two inputs and observe the output (data tables, tornado charts).']],
        ['Excel mechanics', ['Scenario switch cell + CHOOSE / INDEX / OFFSET pulling from a scenario table into a live column.', 'One-variable data table: inputs in a column, formula referencing output at top. Two-variable: row and column inputs, output in the top-left corner.', 'Data table inputs must be on the SAME sheet as the table.']],
        ['Reading results', ['Tornado charts rank inputs by impact. Focus diligence on the inputs that move value most.']],
      ] },
    dv: { name: 'Data Viz & Dashboards', icon: '▥', course: 'Excel Data Visualization and Dashboards',
      notes: [
        ['Chart choice', ['Trend over time → line/column. Composition → stacked column or 100% stacked (avoid pies with many slices). Ranking → sorted bar. Bridge from A to B → waterfall. Relationship → scatter. Ranges → football field (floating bar).']],
        ['Design', ['Start from the message: what decision does this chart support? Title it with the insight.', 'Remove clutter (gridlines, 3D, legends you can label directly). Use colour sparingly for emphasis.', 'Dashboards: few KPIs, consistent layout, interactivity via slicers/drop-downs, source data on separate sheets.']],
      ] },
    pp: { name: 'PowerPoint & Pitchbooks', icon: '▭', course: 'PowerPoint & Pitchbooks',
      notes: [
        ['Pitchbook structure', ['Typical: situation overview → market/company overview → valuation (football field) → transaction considerations / process → appendix.', 'Executive summary up front; detail in the appendix.']],
        ['Slide principles', ['Action titles: the headline states the takeaway, not the topic.', 'One message per slide; consistent fonts, colours and alignment; footnotes and sources on every data slide.', 'Link Excel outputs carefully and check numbers tie to the model before sending.']],
      ] },
    et: { name: 'Professional Ethics', icon: '⚑', course: 'Professional Ethics',
      notes: [
        ['Core principles', ['Integrity, objectivity, professional competence and due care, confidentiality, professional behaviour.', 'Independence and managing conflicts of interest: disclose, mitigate or decline.']],
        ['In practice', ['Never manipulate assumptions to reach a pre-determined answer; document the basis for key assumptions.', 'Material non-public information (MNPI) must not be traded on or shared.', 'Escalate concerns through proper channels; whistleblowing protections exist for good-faith reports.']],
        ['Frameworks', ['Ask: Is it legal? Is it consistent with policy and professional codes? Would I be comfortable if it were public? Who is affected?']],
      ] },
  };

  F.unitOrder = F.sections.flatMap((s) => s.units);
})(typeof window !== 'undefined' ? window : globalThis);
