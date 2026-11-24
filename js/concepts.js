/* FMVA Trainer v2.1 — teaching layer.
   F.concepts: one explainer card per unit|topic, in teaching order (lessons introduce them in this order).
   F.glossary: tappable definitions for jargon in questions and explanations. Original content. */
(function (G) {
  const F = (G.FMVA = G.FMVA || {});
  const C = {};
  const card = (unit, topic, title, body, example, excel) => (C[unit + '|' + topic] = { unit, topic, title, body, example, excel });

  // ---------------- Finance Basics ----------------
  card('ff', 'The three statements', 'The three financial statements',
    ['Every company reports three statements. Together they tell you how it performed, what it owns and owes, and where its cash went.',
     '<b>Income statement</b>: performance over a <i>period</i> (a quarter, a year). Revenue minus costs = profit. Think of it as a video of the year.',
     '<b>Balance sheet</b>: a <i>snapshot</i> on one day. What the company owns (<b>assets</b>), what it owes (<b>liabilities</b>), and what belongs to the owners (<b>equity</b>). It always balances: <b>Assets = Liabilities + Equity</b>.',
     '<b>Cash flow statement</b>: the cash that actually came in and went out, split into <b>operating</b> (running the business), <b>investing</b> (buying equipment, stores) and <b>financing</b> (loans, shares, dividends).',
     'Why three? Because <b>profit is not cash</b>. A sale on credit is revenue today, but the cash only arrives when the customer pays.'],
    'A wholesaler sells $100 of goods on 30-day credit.<br>• Income statement: revenue +$100<br>• Balance sheet: accounts receivable +$100 (the customer owes you)<br>• Cash flow statement: cash +$0, until the customer pays next month.');

  card('ff', 'Income statement terms', 'Reading the income statement, top to bottom',
    ['The income statement is a waterfall. Each line subtracts another kind of cost:',
     '<b>Revenue</b> (sales) − <b>COGS</b> (cost of the goods you sold) = <b>Gross profit</b><br>− <b>SG&A</b> (selling, general & admin: salaries, rent, marketing) = <b>EBITDA</b><br>− <b>D&A</b> (depreciation & amortization) = <b>EBIT</b> (operating profit)<br>− <b>Interest</b> = <b>Pre-tax income</b> (EBT)<br>− <b>Tax</b> = <b>Net income</b>',
     '<b>EBITDA</b> = Earnings Before Interest, Taxes, Depreciation & Amortization. Analysts like it because it shows operating performance before financing choices, tax and accounting for long-life assets.',
     '<b>Depreciation</b> spreads the cost of a long-life asset over the years you use it. A $50k delivery truck used for 5 years costs $10k a year on the income statement, even though the cash left on day one.'],
    'Revenue 1,000 − COGS 600 = Gross profit 400<br>− SG&A 200 = EBITDA 200<br>− D&A 50 = EBIT 150<br>− Interest 30 = Pre-tax 120<br>− Tax 25% (30) = <b>Net income 90</b>');

  card('ff', 'Time value of money', 'Time value of money',
    ['$100 today is worth more than $100 next year, because today you could invest it and earn a return.',
     '<b>Compounding</b> moves money forward in time: <b>FV = PV × (1 + r)ⁿ</b>. You earn interest on your interest.',
     '<b>Discounting</b> is the reverse. It turns a future amount into today\'s value: <b>PV = FV ÷ (1 + r)ⁿ</b>.',
     'The <b>discount rate</b> (r) is the return you require for waiting and taking the risk. A higher rate or a longer wait makes a future amount worth less today. Almost all valuation (DCF, NPV) rests on this one idea.'],
    '$1,000 invested at 10% for 2 years: 1,000 × 1.10 × 1.10 = <b>$1,210</b>.<br>Reverse it: $1,210 received in 2 years, at 10%, is worth 1,210 ÷ 1.10² = <b>$1,000 today</b>.',
    '=FV(rate, nper, 0, −pv) and =PV(rate, nper, 0, −fv). Or just type =1000*1.1^2.');

  card('ff', 'Loans & annuities', 'Loans and annuities (equal payments)',
    ['An <b>annuity</b> is a series of <b>equal payments</b> at regular intervals, like a car loan, a mortgage or a lease.',
     'A loan payment has to do two jobs: pay the <b>interest</b> and gradually pay back the <b>principal</b> (the amount borrowed). Early payments are mostly interest. Later ones are mostly principal.',
     'The payment formula is <b>P × r ÷ (1 − (1 + r)⁻ⁿ)</b>. Read it like this: <b>P × r</b> is just one year\'s interest on the full loan. Dividing by (1 − (1 + r)⁻ⁿ), a number below 1, bumps the payment up enough to also repay the principal within n periods.',
     '<b>You don\'t need to memorise this formula.</b> In Excel (and on the exam) you use <b>=PMT(rate, nper, pv)</b>. What matters is knowing what the inputs mean and that the result is the level payment.'],
    'Borrow $100m at 8% for 5 years.<br>Interest alone would be 100 × 8% = 8.0 a year. Repaying the principal evenly would be 100 ÷ 5 = 20.0.<br>The level payment: =PMT(8%, 5, 100) = <b>−25.05</b> a year. That falls between "interest only" and "interest + straight principal on the full balance" (28), because the balance shrinks each year.',
    '=PMT(rate, nper, pv) returns a negative number (cash going out). For monthly payments, divide the rate by 12 and multiply the years by 12.');

  // ---------------- Excel toolkit ----------------
  card('xl', 'Lookups', 'Looking things up',
    ['Models constantly pull a value from a table: a price for a product code, a growth rate for a scenario.',
     '<b>XLOOKUP(what, where, return)</b> is the modern choice. It does an exact match by default, can look left or right, and lets you set a value to show if nothing is found.',
     '<b>INDEX(return_range, MATCH(what, lookup_range, 0))</b> is the classic flexible version. The <b>0</b> means exact match.',
     '<b>VLOOKUP</b> only looks to the right, breaks when columns are inserted, and does an <i>approximate</i> match unless you put FALSE/0 as the last argument. That trap appears in exam questions.'],
    'Store codes in A2:A50, sales in D2:D50.<br>=XLOOKUP("POS-12", A2:A50, D2:D50) → sales for store POS-12.');

  card('xl', 'Aggregation', 'Summing with conditions',
    ['<b>SUMIFS(sum_range, criteria_range1, criteria1, …)</b> adds up values that meet one or more conditions. The range to sum comes <b>first</b>, which differs from the older SUMIF.',
     '<b>SUMPRODUCT</b> multiplies two ranges item by item, then adds the results. It is handy for weighted averages (e.g. weight × return).'],
    '=SUMIFS(Sales, Region, "East", Year, 2026) → total East sales in 2026.<br>Weighted margin: =SUMPRODUCT(Revenue, Margin) / SUM(Revenue).');

  card('xl', 'References', 'Anchoring references with $',
    ['When you copy a formula, Excel shifts its references. <b>$</b> locks part of a reference so it doesn\'t move.',
     '<b>$A$1</b> locks both column and row. <b>$A1</b> locks only the column. <b>A$1</b> locks only the row. Press <b>F4</b> to cycle through them.',
     'Mixed references let one formula fill a whole grid, such as a sensitivity table. That is a key modeling skill.'],
    'Prices across row 3, quantities down column A. In B5: <b>=B$3*$A5</b>. Copy it right and down and every cell is correct.');

  card('xl', 'Functions', 'MIN, MAX and other modeling helpers',
    ['<b>MIN</b> and <b>MAX</b> do a lot of work in models, as <b>caps</b> and <b>floors</b>.',
     '<b>Cap</b>: =MIN(what you want, the limit). You can never go above the limit. Example: a company has a <b>credit line</b> (a "revolver", like a corporate overdraft) with a $50m limit. If it needs $70m, =MIN(70, 50) borrows only 50.',
     '<b>Floor</b>: =MAX(0, x) stops a number from going negative, e.g. tax can\'t be negative, and you can\'t repay more than you owe.',
     'Avoid <b>OFFSET</b> and <b>INDIRECT</b> where you can. They recalculate constantly ("volatile") and are hard to trace when auditing.'],
    'Cash shortfall = 70, credit limit = 50, already borrowed = 10.<br>Draw = MIN(70, 50 − 10) = <b>40</b>. The model borrows only what\'s left on the line.');

  // ---------------- Financial analysis ----------------
  card('fa', 'Profitability', 'Margins: how much of each dollar you keep',
    ['A <b>margin</b> is a profit line divided by revenue. Margins let you compare companies of different sizes.',
     '<b>Gross margin</b> = gross profit ÷ revenue (pricing power and product cost).<br><b>EBITDA margin</b> = EBITDA ÷ revenue (operating efficiency).<br><b>EBIT margin</b> = EBIT ÷ revenue.<br><b>Net margin</b> = net income ÷ revenue (what\'s left for owners).',
     'Grocery retail runs thin margins (a few % net) but high volume. Software runs high margins. Always compare a company with its own industry.'],
    'Revenue 500, gross profit 150, EBITDA 50, net income 15.<br>Gross margin 30%, EBITDA margin 10%, net margin <b>3%</b>.');

  card('fa', 'Ratio analysis', 'Key ratios: liquidity, leverage and returns',
    ['<b>Liquidity</b> (can it pay its bills soon?): Current ratio = current assets ÷ current liabilities. <b>Quick ratio</b> excludes inventory, because inventory can be slow to turn into cash.',
     '<b>Leverage</b> (how much debt?): <b>Net debt ÷ EBITDA</b> is the lenders\' favourite, roughly "years of operating cash profit to repay debt". <b>Interest coverage</b> = EBIT ÷ interest (how many times profit covers interest).',
     '<b>Returns</b>: ROA = net income ÷ assets. ROE = net income ÷ equity.',
     '<b>DuPont</b> breaks ROE into three drivers: <b>margin × asset turnover × leverage</b> (NI/Revenue × Revenue/Assets × Assets/Equity). Two companies can reach the same ROE in very different ways.'],
    'Net margin 5% × asset turnover 2.0x × equity multiplier 2.0x = <b>ROE 20%</b>. ROA is 5% × 2.0 = 10%. Leverage doubles it.');

  card('fa', 'Working capital metrics', 'Working capital days',
    ['<b>Working capital</b> is cash tied up in day-to-day operations: money customers owe you, plus stock on shelves, minus what you owe suppliers.',
     '<b>DSO</b> (days sales outstanding) = receivables ÷ revenue × 365. How long customers take to pay.<br><b>DIO</b> (days inventory) = inventory ÷ COGS × 365. How long stock sits.<br><b>DPO</b> (days payables) = payables ÷ COGS × 365. How long you take to pay suppliers.',
     '<b>Cash conversion cycle = DSO + DIO − DPO.</b> The number of days your cash is locked up. Lower is better.',
     'Inventory and payables use <b>COGS</b>, because they\'re recorded at cost, not selling price.'],
    'A supermarket: customers pay cash (DSO 2), stock sells in 20 days (DIO 20), suppliers are paid in 35 days (DPO 35).<br>CCC = 2 + 20 − 35 = <b>−13 days</b>. Suppliers effectively fund the business.');

  card('fa', 'Analysis techniques', 'Horizontal and vertical analysis',
    ['<b>Horizontal analysis</b> compares across time: year-over-year growth in each line.',
     '<b>Vertical (common-size) analysis</b> shows every line as a % of a base: revenue for the income statement, total assets for the balance sheet. That lets you compare a small and a large company side by side.',
     'A ratio only means something with context: compare it with history, with peers, and with the business model.'],
    'COGS 600 on revenue 1,000 = 60% of revenue (vertical).<br>Revenue 1,000 → 1,080 = +8% (horizontal).');

  // ---------------- Modeling guidelines ----------------
  card('mg', 'Structure', 'How a good model is laid out',
    ['Keep <b>inputs → calculations → outputs</b> separate, and make the logic flow top-to-bottom, left-to-right.',
     'One row = one calculation, with the <b>same formula across every period</b>. Use the same column for the same year on every sheet.',
     'Avoid <b>circular references</b> (a formula that depends on its own result) unless you really need one. If you use one, add an on/off switch (a "circuit breaker") so you can reset the model if it blows up.'],
    'Assumptions sheet (growth %, margins) → Calculations sheet (revenue, costs, schedules) → Outputs sheet (valuation, charts).');

  card('mg', 'Formatting conventions', 'Colour codes everyone uses',
    ['<b>Blue font = hard-coded input</b> (a number you typed).<br><b>Black = formula.</b><br><b>Green = link to another sheet.</b>',
     'Anyone opening the model can instantly see what they\'re allowed to change. Label units on every row ($m, %, days).'],
    'Growth rate 5.0% in blue → revenue formula in black → summary sheet pulling revenue in green.');

  card('mg', 'Formula hygiene', 'Clean formulas',
    ['<b>Never bury a number inside a formula</b>, like =B5*1.05. Put the 5% in its own labelled input cell and reference it. Otherwise nobody can see or change the assumption.',
     'Split long, nested formulas into several simple helper rows. Short formulas are easier to check.',
     'Keep formulas <b>consistent across a row</b>. A different formula in one column is a classic hidden error.'],
    'Bad: =C10*1.04<br>Good: =C10*(1+$C$4), where C4 holds "Revenue growth 4.0%" in blue.');

  card('mg', 'Checks', 'Error checks',
    ['Build checks that return 0 (or TRUE) when things are right: the balance sheet balances, cash never goes below the minimum, the segment total equals the reported total.',
     'Roll all checks into <b>one master check</b> shown on the front page, so any user can see at a glance if something broke.'],
    'Balance check = ROUND(Total assets − Total liabilities & equity, 3). It should be 0 in every year.');

  // ---------------- 3-statement linkages ----------------
  card('i3', '3-statement linkages', 'How the three statements connect',
    ['<b>Net income</b> feeds two places: the top of the cash flow statement, and retained earnings on the balance sheet.',
     '<b>Non-cash expenses</b> (like depreciation) reduce profit but not cash, so they\'re <b>added back</b> on the cash flow statement.',
     '<b>Working capital</b>: when an asset like receivables or inventory goes UP, cash goes DOWN (subtract). When a liability like payables goes UP, cash goes UP (add).',
     '<b>CapEx</b> (buying equipment) is an investing cash outflow that increases PP&E. Depreciation then reduces PP&E.',
     'Ending cash from the cash flow statement becomes cash on the balance sheet, and then the balance sheet should balance.'],
    'Depreciation +$10, tax 25%:<br>• Net income −7.5 (10 less, but saves 2.5 of tax)<br>• Cash flow: −7.5 + 10 add-back = <b>cash +2.5</b><br>• Balance sheet: PP&E −10, cash +2.5 → assets −7.5; retained earnings −7.5 → still balanced ✔');

  card('i3', 'Build order', 'The order to build a 3-statement model',
    ['1. Historical statements → 2. Assumptions/drivers → 3. Income statement → 4. Supporting schedules (working capital, PP&E, debt, equity) → 5. Balance sheet → 6. Cash flow statement → 7. Link ending cash to the balance sheet → 8. Checks.',
     'Cash is usually the last link, because it\'s the result of everything else.'],
    null);

  // ---------------- 3-statement modeling ----------------
  card('m3', 'Revenue & costs', 'Forecasting revenue and costs',
    ['Forecast revenue with a growth rate, or better, with drivers (volume × price).',
     'Costs: model variable costs as a % of revenue, and fixed costs separately. A business with mostly fixed costs has high <b>operating leverage</b>: profit swings a lot when revenue moves.'],
    'Revenue 100 → 110 (+10%). Variable costs 60% of revenue, fixed costs 30.<br>Profit goes 10 → 14, so +40% profit from +10% revenue. That\'s operating leverage.');

  card('m3', 'Working capital schedule', 'Forecasting working capital',
    ['Turn the "days" assumptions back into balances:<br><b>Receivables = revenue × DSO ÷ 365</b><br><b>Inventory = COGS × DIO ÷ 365</b><br><b>Payables = COGS × DPO ÷ 365</b>',
     'Net working capital (NWC) = receivables + inventory − payables. The <b>change</b> in NWC hits cash: an increase is a use of cash.'],
    'Revenue 365, DSO 30 → receivables = 365 × 30 ÷ 365 = <b>30</b>.<br>If NWC rises from 50 to 58, cash flow falls by <b>8</b>.');

  card('m3', 'PP&E schedule', 'The PP&E roll-forward',
    ['PP&E (property, plant & equipment) is the company\'s long-life assets: stores, trucks, machines.',
     '<b>Closing PP&E = opening PP&E + CapEx − depreciation.</b>',
     'CapEx is often forecast as a % of revenue. Depreciation is a % of opening PP&E, or a schedule per asset.'],
    'Opening 300 + CapEx 40 − depreciation 30 = closing <b>310</b>.');

  card('m3', 'Debt schedule', 'Debt schedules and the revolver',
    ['Each loan gets its own roll-forward: <b>closing = opening + new borrowing − repayments</b>. Interest = balance × rate.',
     'A <b>revolver</b> (revolving credit facility) works like a company overdraft or credit card. There\'s a limit, you draw on it when you\'re short of cash, repay when you have spare cash, and can draw again.',
     'In a model the revolver is the <b>automatic top-up</b>: if cash would fall below the minimum, draw the shortfall, but <b>capped</b> at the available limit with MIN. When there\'s surplus cash, repay, but never more than you owe (MIN again).',
     'Interest on the <b>average</b> balance is more accurate but creates a <b>circular reference</b> (interest → cash → debt → interest). Using the <b>opening</b> balance avoids that.'],
    'Minimum cash 20. Before the revolver, cash would be 5 → shortfall 15. Limit 50, already drawn 40 → only 10 available.<br>Draw = MIN(15, 50 − 40) = <b>10</b>. The model shows the company is still 5 short, which is a real warning sign.',
    'Draw: =MIN(MAX(0, min_cash − cash_before), limit − opening_balance)<br>Repay: =MIN(MAX(0, cash_before − min_cash), opening_balance)');

  card('m3', 'Equity', 'Equity roll-forward',
    ['<b>Closing equity = opening + net income − dividends + new shares issued − buybacks.</b>',
     'Retained earnings is the part from profits: opening + net income − dividends.',
     'Borrowing or repaying debt does NOT change equity. It moves cash and debt.'],
    'Opening retained earnings 200 + net income 50 − dividends 20 = <b>230</b>.');

  // ---------------- Forecasting ----------------
  card('fc', 'Growth rates', 'Growth rates and CAGR',
    ['Year-over-year growth = this year ÷ last year − 1.',
     '<b>CAGR</b> (compound annual growth rate) is the single steady rate that gets you from a start value to an end value: <b>(End ÷ Start)^(1/n) − 1</b>, where n is the number of <i>years between</i> them.',
     'Watch the counting: 2022 → 2026 is <b>4</b> periods, not 5.'],
    'Revenue 100 in 2022 → 146 in 2026: (146/100)^(1/4) − 1 = <b>9.9%</b> a year.',
    '=(End/Start)^(1/n)-1, or =RRI(n, start, end).');

  card('fc', 'Forecasting methods', 'Ways to forecast',
    ['<b>Top-down</b>: market size × your market share.<br><b>Bottom-up</b>: build from drivers, like stores × sales per store, or customers × average basket.',
     '<b>Historical trends</b>: average growth, moving averages (smooth noise but react slowly), or linear regression (FORECAST.LINEAR / TREND).',
     '<b>Seasonality</b>: for monthly forecasts use the same month last year, or seasonal indices. December isn\'t a normal month for a retailer.'],
    'Bottom-up: 40 stores × $2.5m per store × 1.03 like-for-like growth = <b>$103m</b> revenue.');

  card('fc', 'Judgement', 'Sanity-checking a forecast',
    ['Ask whether the numbers make sense: implied margins, market share and growth compared with history and peers.',
     'Be suspicious of <b>"hockey sticks"</b> (sudden jumps). Every inflection needs a reason: a price increase, a new store, a cost programme.'],
    'Margin jumping 8% → 20% with no stated driver = challenge it.');

  // ---------------- Operational modeling ----------------
  card('op', 'Unit economics', 'Unit economics and break-even',
    ['<b>Contribution margin</b> = price − variable cost per unit. That\'s what each unit contributes toward fixed costs.',
     '<b>Break-even units = fixed costs ÷ contribution margin.</b> Add a target profit to fixed costs to find the units needed for that profit.'],
    'Price $25, variable cost $10 → contribution $15.<br>Fixed costs $300,000 ÷ 15 = <b>20,000 units</b> to break even.');

  card('op', 'Capacity & drivers', 'Capacity and drivers',
    ['Operational models build revenue from physical drivers: <b>capacity × utilization × price</b>.',
     'You can\'t sell more than you can make: units sold = <b>MIN(demand, capacity)</b>. When demand outgrows capacity, the model may trigger CapEx for new capacity.',
     '<b>Step costs</b> stay flat until a threshold, then jump (e.g. adding a second shift).'],
    '3 lines × 40,000 units × 85% utilization × $20 = <b>$2.04m</b> revenue.');

  // ---------------- Auditing ----------------
  card('au', 'Find the imbalance', 'Finding why a balance sheet doesn\'t balance',
    ['Find the <b>first year</b> it breaks. The error is in that year\'s flows.',
     '<b>Same gap every year</b> → usually an opening balance or a one-off link. <b>Growing gap</b> → a recurring flow error.',
     'A gap of exactly <b>2× some line item</b> usually means that item has the wrong sign (it was added instead of subtracted).'],
    'Balance sheet off by 24, and the change in inventory is 12 → check the sign of inventory on the cash flow statement.');

  card('au', 'Tools', 'Excel auditing tools',
    ['<b>Ctrl + `</b> shows formulas instead of values.<br><b>Trace precedents/dependents</b> draws arrows to the inputs/outputs of a cell.<br><b>Go To Special → Constants</b> selects every typed number, which helps you find hard-codes.<br><b>Evaluate Formula</b> steps through a formula. The <b>Watch Window</b> tracks key cells.'],
    null);

  card('au', 'Common errors', 'Common model errors',
    ['Wrong sign on a cash flow item. A cash flow with no matching balance sheet entry (e.g. dividends paid but not deducted from retained earnings). Formulas that point to the wrong year.',
     '<b>Hard-codes</b>: a typed number where a formula should be. They don\'t always break the balance check, which is what makes them dangerous.',
     '<b>IFERROR(…, 0)</b> everywhere hides real mistakes by turning them into zeros.'],
    null);

  card('au', 'Circularity', 'Circular references',
    ['A <b>circular reference</b> happens when a formula depends on its own result, e.g. interest on average debt → net income → cash → debt → interest.',
     'Excel can solve it with iterative calculation, but if an error gets into the loop, #REF!/#NUM! spreads everywhere. A <b>circuit breaker</b> (switch cell that sets interest to 0) breaks the loop so the model can recover.'],
    null);

  // ---------------- Business valuation ----------------
  card('bv', 'Approaches', 'Three ways to value a business',
    ['<b>Intrinsic</b>: a DCF values the business on the cash it will generate in future.',
     '<b>Relative</b>: <b>comparable companies</b> (what similar listed companies trade at) and <b>precedent transactions</b> (what buyers paid for similar companies).',
     'Analysts show all methods as ranges on a <b>football field</b> chart and triangulate a value.'],
    null);

  card('bv', 'Enterprise value', 'Enterprise value vs equity value',
    ['<b>Equity value</b> (market cap) = share price × shares. It is what belongs to shareholders.',
     '<b>Enterprise value (EV)</b> is the value of the operating business to <i>everyone</i> who funds it, both lenders and shareholders.<br><b>EV = equity value + debt + preferred stock + non-controlling interest − cash.</b>',
     'Why subtract cash? If you bought the whole company, you\'d get its cash back, so the net cost of the business is lower.',
     'Match multiples: EV goes with metrics before interest (Revenue, EBITDA, EBIT). Equity value goes with metrics after interest (net income → P/E).'],
    '100m shares × $10 = equity value 1,000. Debt 400, cash 100.<br>EV = 1,000 + 400 − 100 = <b>1,300</b>.');

  card('bv', 'Time value of money', 'NPV: is an investment worth it?',
    ['<b>NPV (net present value)</b> = present value of all future cash flows − the cost today.',
     'Discount each year\'s cash flow: CF ÷ (1 + r)^year. Add them up, subtract the upfront investment.',
     '<b>NPV > 0</b> means the project earns more than your required return and creates value. NPV < 0 means it destroys value.'],
    'Cost 100 today; receives 60 in year 1 and 60 in year 2; r = 10%.<br>PV = 60/1.10 + 60/1.21 = 54.5 + 49.6 = 104.1 → NPV = <b>+4.1</b> ✔');

  card('bv', 'Returns', 'IRR and multiple of money',
    ['<b>IRR</b> (internal rate of return) is the discount rate at which NPV = 0. It is the project\'s own annual return. Accept if IRR > your required return (the "hurdle rate").',
     'With one investment and one payback: <b>IRR = (money out ÷ money in)^(1/years) − 1</b>.',
     '<b>MOIC</b> (multiple of money) = money back ÷ money in. It ignores time; IRR doesn\'t.',
     'When choosing between projects, trust <b>NPV</b> over IRR: IRR can mislead on size and timing.'],
    'Invest 100, get 200 after 5 years: MOIC 2.0x; IRR = 2^(1/5) − 1 = <b>14.9%</b>.');

  card('bv', 'Excel NPV & IRR', 'Excel\'s NPV trap (and XNPV)',
    ['Excel\'s <b>=NPV(rate, values)</b> assumes the <b>first</b> value arrives at the <b>end of year 1</b>. So if you include the time-0 investment in the range, Excel discounts it by one year, which is wrong.',
     'Correct: <b>=CF0 + NPV(rate, CF1:CFn)</b>.',
     '<b>XNPV / XIRR</b> use actual dates, which is better when cash flows are irregular.',
     'If cash flows change sign more than once (−, +, −) there can be <b>more than one IRR</b>. Use NPV.'],
    'B1 = −100 (today), B2:B3 = 60, 60, rate 10%.<br>Wrong: =NPV(10%, B1:B3) = 3.8<br>Right: =B1 + NPV(10%, B2:B3) = <b>4.1</b>');

  // ---------------- DCF fundamentals ----------------
  card('d1', 'Free cash flow', 'Unlevered free cash flow (FCFF)',
    ['A DCF values the cash the business generates for <b>all</b> its funders, before any interest is paid. That\'s <b>unlevered free cash flow</b> (FCFF).',
     '<b>FCFF = EBIT × (1 − tax rate) + D&A − CapEx − increase in NWC.</b>',
     'Step by step: take operating profit and tax it as if there were no debt (that\'s <b>NOPAT</b>), add back non-cash D&A, subtract the investment in equipment (CapEx) and the extra cash tied up in working capital.',
     'Interest is left out on purpose. The cost of debt is captured in the discount rate (WACC) instead.'],
    'EBIT 80, tax 25% → NOPAT 60. + D&A 20 − CapEx 25 − ΔNWC 4 = <b>FCFF 51</b>.');

  card('d1', 'Cost of equity (CAPM)', 'Cost of equity: CAPM',
    ['Shareholders expect a return for the risk they take. <b>CAPM</b> estimates it:<br><b>Cost of equity = risk-free rate + beta × equity risk premium.</b>',
     '<b>Risk-free rate</b>: yield on government bonds. <b>Equity risk premium</b> (market risk premium): the extra return the stock market pays over the risk-free rate (Rm − Rf). <b>Beta</b>: how much the stock moves with the market.',
     'Trap: if you\'re given the <i>market return</i> (Rm), subtract Rf first. If you\'re given the <i>premium</i>, don\'t subtract again.'],
    'Rf 4%, beta 1.2, market return 9% → premium 5%.<br>Ke = 4% + 1.2 × 5% = <b>10.0%</b>.');

  card('d1', 'Beta', 'Beta: levering and unlevering',
    ['<b>Beta</b> measures market risk. 1.0 moves with the market; 1.5 swings 50% more.',
     'A company\'s beta includes both its business risk and the extra risk from its debt. To borrow peers\' betas, <b>unlever</b> them (strip out each peer\'s debt), take the median, then <b>relever</b> at your company\'s debt level.',
     '<b>Levered β = unlevered β × [1 + (1 − tax) × Debt/Equity]</b>.'],
    'Unlevered β 0.8, D/E 0.5, tax 25%: 0.8 × (1 + 0.75 × 0.5) = <b>1.10</b>.');

  card('d1', 'WACC', 'WACC: the blended cost of capital',
    ['<b>WACC</b> (weighted average cost of capital) blends what shareholders and lenders require, weighted by how much of each the company uses.',
     '<b>WACC = E/V × cost of equity + D/V × cost of debt × (1 − tax)</b>, where V = E + D.',
     'Debt uses the <b>after-tax</b> cost, because interest reduces taxable income (the "tax shield").',
     'Use <b>market</b> values or the target capital structure, not book values. FCFF is discounted at WACC.'],
    '70% equity at 11%, 30% debt at 7%, tax 25%:<br>0.7 × 11% + 0.3 × 7% × 0.75 = 7.7% + 1.6% = <b>9.3%</b>.');

  card('d1', 'Terminal value', 'Terminal value',
    ['You can\'t forecast forever, so after ~5 years a DCF adds a <b>terminal value</b> (TV), the value of all cash flows beyond the forecast.',
     '<b>Perpetuity growth (Gordon) method: TV = final-year FCF × (1 + g) ÷ (WACC − g)</b>, where g is a modest long-run growth rate (about inflation/GDP, e.g. 2–3%).',
     'TV is a value at the <b>end</b> of the forecast. You still have to <b>discount it back</b> to today.',
     'TV is often 60–80% of the whole valuation, so small changes in g or WACC matter a lot.'],
    'Year-5 FCF 100, WACC 9%, g 2.5%: TV = 100 × 1.025 ÷ 0.065 = <b>1,577</b> (at end of year 5).');

  // ---------------- Applied DCF ----------------
  card('d2', 'Discounting conventions', 'End-of-year vs mid-year discounting',
    ['<b>End-of-year</b>: year t\'s cash is discounted t years.',
     '<b>Mid-year convention</b>: cash really arrives through the year, so on average it arrives mid-year. Discount by <b>t − 0.5</b>. That gives a slightly <b>higher</b> value.',
     '<b>Stub period</b>: if the valuation date is mid-year, only the remaining months of the first year count, and the discount periods shift.'],
    'Year-3 FCF 100 at 10%: end-of-year 100/1.1³ = 75.1; mid-year 100/1.1^2.5 = <b>78.8</b>.');

  card('d2', 'Terminal value', 'Exit-multiple terminal value and cross-checks',
    ['<b>Exit multiple method</b>: TV = final-year EBITDA × an EV/EBITDA multiple (from comps).',
     'Cross-check the two methods. Work out the growth rate your exit multiple implies, and the multiple your growth rate implies. A Gordon TV that implies 25x EBITDA when peers trade at 9x is a red flag.'],
    'EBITDA 150 × 8.0x = TV 1,200 at year 5. At 10% WACC its PV = 1,200 ÷ 1.1⁵ = <b>745</b>.');

  card('d2', 'DCF valuation', 'Putting the DCF together',
    ['1. Forecast FCFF for ~5 years. 2. Work out WACC. 3. Discount each FCF to today. 4. Calculate TV and discount it. 5. <b>EV = PV of FCFs + PV of TV.</b>',
     'Then sense-check with a <b>sensitivity table</b> (WACC vs g) and the TV share of EV.'],
    'PV of FCFs 220 + PV of TV 580 = <b>EV 800</b> (TV = 73% of EV).');

  card('d2', 'EV to equity bridge', 'From enterprise value to share price',
    ['A DCF on FCFF gives <b>EV</b>. To get to what shareholders own:<br><b>Equity value = EV − debt − preferred − non-controlling interest + cash</b> (+ non-operating assets like investments in associates).',
     'Then divide by <b>diluted</b> shares (including in-the-money options and RSUs) to get the price per share.'],
    'EV 1,300 − debt 400 + cash 100 = equity 1,000 ÷ 100m diluted shares = <b>$10.00</b>.');

  card('d2', 'Free cash flow', 'FCFE: cash for shareholders only',
    ['<b>FCFE</b> (free cash flow to equity) = FCFF − interest × (1 − tax) + net new borrowing. It is the cash left for shareholders after lenders are paid.',
     'Discount FCFE at the <b>cost of equity</b> (not WACC). The result is <b>equity value</b> directly.',
     'Rule: FCFF ↔ WACC → EV. FCFE ↔ cost of equity → equity value. Never mix them.'],
    'FCFF 100 − interest 20 × 0.75 + borrowing 10 = <b>FCFE 95</b>.');

  // ---------------- Comparable valuation ----------------
  card('cv', 'Trading comps', 'Comparable companies ("comps")',
    ['Value a company by what the market pays for similar ones. Pick peers with a similar business, size, growth and margins.',
     'Calculate a <b>multiple</b> for each peer, e.g. <b>EV/EBITDA</b> or <b>P/E</b> (share price ÷ earnings per share). Take the <b>median</b>, which isn\'t thrown off by one weird peer.',
     'Apply it to your company: EBITDA × median EV/EBITDA = implied EV → subtract net debt → ÷ shares = price. P/E gives equity value directly (no net debt step).',
     'Clean up one-off items (restructuring, write-downs) before calculating multiples.'],
    'Peers: 7x, 8x, 9x, 10x, 20x → median <b>9x</b> (the mean, 10.8x, is skewed by the 20x).<br>EBITDA 50 × 9 = EV 450 − net debt 150 = equity 300 ÷ 30m shares = <b>$10</b>.');

  card('cv', 'Precedent transactions', 'Precedent transactions',
    ['Multiples that buyers actually <b>paid</b> in past acquisitions of similar companies.',
     'They\'re usually <b>higher</b> than trading comps because buyers pay a <b>control premium</b> (extra to take over) and expect <b>synergies</b> (cost savings from combining).',
     'Older deals reflect different markets, so weight recent ones more.'],
    'Unaffected price $20, 30% premium → offer $26. × 50m shares = 1,300 + net debt 200 = EV 1,500 ÷ EBITDA 150 = <b>10.0x</b>.');

  card('cv', 'Calendarization', 'Calendarization',
    ['Peers have different year-ends. To compare like with like, convert everyone to the same 12 months, usually the calendar year.',
     'For a fiscal year ending in month m: <b>Calendar year = m/12 × FY ending this year + (12 − m)/12 × FY ending next year.</b>',
     '<b>LTM</b> (last twelve months) is a similar idea: the most recent four quarters.'],
    'FY ends June. FY Jun-2026 EBITDA 100, FY Jun-2027 EBITDA 120.<br>CY2026 = 6/12 × 100 + 6/12 × 120 = <b>110</b>.');

  // ---------------- Scenario & sensitivity ----------------
  card('ss', 'Scenario analysis', 'Scenarios',
    ['A <b>scenario</b> changes a whole <i>set</i> of related assumptions together: Downside / Base / Upside.',
     'Build it with a <b>switch cell</b> (1, 2, 3) and =CHOOSE(switch, downside, base, upside) or INDEX/MATCH pulling from a scenario table into one "live" column.',
     '<b>Goal Seek</b> answers "what input gets me to this output?" for one variable.'],
    'Switch = 2 → =CHOOSE(2, 2%, 5%, 8%) returns <b>5%</b> growth.');

  card('ss', 'Sensitivity analysis', 'Sensitivity tables',
    ['A <b>sensitivity</b> flexes one or two inputs and shows how the output moves.',
     'Excel <b>data tables</b> (What-If Analysis): put the output formula in the top-left corner, one input across the top, the other down the side. Input cells must be on the <b>same sheet</b>.',
     'A <b>tornado chart</b> ranks inputs by how much they swing the result.',
     '<b>bps</b> = basis points; 100 bps = 1%.'],
    'Typical DCF table: WACC 8% / 9% / 10% across × terminal growth 2% / 2.5% / 3% down → share price in each cell.');

  // ---------------- Data viz ----------------
  card('dv', 'Chart choice', 'Picking the right chart',
    ['Trend over time → <b>line</b>. Compare categories → <b>sorted bar</b>. Bridge from A to B → <b>waterfall</b>. Valuation ranges → <b>football field</b>. Relationship → <b>scatter</b>.',
     'Avoid pie charts with many slices. People judge angles poorly.'],
    null);

  card('dv', 'Design', 'Designing clear charts and dashboards',
    ['Start with the message. Title the chart with the insight ("Margin fell 3pts on freight costs"), not the topic ("Margin").',
     'Remove clutter (3D, heavy gridlines), and use colour only to highlight what matters.',
     'Dashboards: a few key metrics, consistent layout, with context (target, last year).'],
    null);

  // ---------------- PowerPoint ----------------
  card('pp', 'Pitchbook structure', 'How a pitchbook is organised',
    ['Executive summary → situation / company overview → valuation (football field) → transaction considerations → appendix with backup detail.'],
    null);

  card('pp', 'Slide principles', 'Slides that work',
    ['<b>Action titles</b>: the headline states the takeaway in a sentence.',
     'One message per slide. Sources and footnotes on data slides. Every number must tie to the latest model.'],
    null);

  // ---------------- Ethics ----------------
  card('et', 'Core principles', 'Core ethical principles',
    ['<b>Integrity, objectivity, professional competence & due care, confidentiality, professional behaviour.</b>',
     'Never tweak assumptions to hit an answer someone wants. Disclose conflicts of interest. Only take on work you\'re competent to do, or get help.'],
    null);

  card('et', 'In practice', 'Ethics in practice',
    ['<b>MNPI</b> (material non-public information): never trade on it or share it. That\'s insider trading.',
     'Client information stays confidential, even if anonymised.',
     'Found a material error after sending? Tell your manager and correct it openly.'],
    null);

  card('et', 'Frameworks', 'A quick ethics test',
    ['Is it legal? Is it consistent with policy and professional codes? Would I be comfortable if it were on the front page? Who could be harmed?'],
    null);

  F.concepts = C;
  F.topicOrder = {};
  Object.values(C).forEach((c) => (F.topicOrder[c.unit] = F.topicOrder[c.unit] || []).push(c.topic));

  // ---------------- Glossary ----------------
  // [key, display term, definition, [aliases matched in text], concept key]
  const GL = [
    ['annuity', 'Annuity', 'A series of equal payments at regular intervals, like a loan, mortgage or lease payment.', ['annuity', 'annuities', 'level payment', 'equal annual payments'], 'ff|Loans & annuities'],
    ['principal', 'Principal', 'The amount originally borrowed (as opposed to the interest on it).', ['principal'], 'ff|Loans & annuities'],
    ['revolver', 'Revolver (revolving credit facility)', 'A flexible credit line, like a company overdraft or credit card. The company can borrow up to a limit, repay, and borrow again. Models use it to cover cash shortfalls automatically.', ['revolver', 'revolving credit facility', 'credit line', 'revolving credit'], 'm3|Debt schedule'],
    ['cashsweep', 'Cash sweep', 'Using surplus cash to repay debt early, automatically, in the model.', ['cash sweep'], 'm3|Debt schedule'],
    ['circ', 'Circular reference', 'A formula that depends on its own result, e.g. interest on average debt → net income → cash → debt → interest.', ['circular reference', 'circularity', 'circuit breaker', 'circuit-breaker'], 'au|Circularity'],
    ['hardcode', 'Hard-code', 'A number typed directly into a cell or formula instead of being calculated or referenced.', ['hard-coded', 'hard-code', 'hard-codes', 'hardcoded'], 'mg|Formula hygiene'],
    ['ebitda', 'EBITDA', 'Earnings Before Interest, Taxes, Depreciation & Amortization. It shows operating profit before financing, tax and asset-accounting choices.', ['EBITDA'], 'ff|Income statement terms'],
    ['ebit', 'EBIT', 'Earnings Before Interest & Taxes, also called operating profit. EBIT = EBITDA − D&A.', ['EBIT'], 'ff|Income statement terms'],
    ['nopat', 'NOPAT', 'Net Operating Profit After Tax = EBIT × (1 − tax rate). Operating profit taxed as if there were no debt.', ['NOPAT'], 'd1|Free cash flow'],
    ['da', 'D&A (depreciation & amortization)', 'Spreading the cost of long-life assets (equipment = depreciation; intangibles = amortization) over the years they\'re used. A non-cash expense.', ['D&A', 'depreciation', 'amortization'], 'ff|Income statement terms'],
    ['cogs', 'COGS', 'Cost of goods sold: the direct cost of the products or services sold.', ['COGS'], 'ff|Income statement terms'],
    ['sga', 'SG&A', 'Selling, general & administrative expenses: salaries, rent, marketing and other overheads.', ['SG&A'], 'ff|Income statement terms'],
    ['ni', 'Net income', 'Bottom-line profit after all costs, interest and tax.', ['net income'], 'ff|Income statement terms'],
    ['re', 'Retained earnings', 'Cumulative profits kept in the business (not paid as dividends). Part of equity.', ['retained earnings'], 'm3|Equity'],
    ['nwc', 'Net working capital (NWC)', 'Cash tied up in day-to-day operations: receivables + inventory − payables. An increase uses cash.', ['net working capital', 'working capital', 'NWC', 'ΔNWC'], 'm3|Working capital schedule'],
    ['ar', 'Accounts receivable', 'Money customers owe the company for sales already made.', ['accounts receivable', 'receivables'], 'fa|Working capital metrics'],
    ['ap', 'Accounts payable', 'Money the company owes its suppliers.', ['accounts payable', 'payables'], 'fa|Working capital metrics'],
    ['dso', 'DSO / DIO / DPO', 'Days sales outstanding (receivables ÷ revenue × 365), days inventory (inventory ÷ COGS × 365), days payables (payables ÷ COGS × 365).', ['DSO', 'DIO', 'DPO'], 'fa|Working capital metrics'],
    ['ccc', 'Cash conversion cycle', 'DSO + DIO − DPO: how many days cash is locked up in operations.', ['cash conversion cycle'], 'fa|Working capital metrics'],
    ['capex', 'CapEx', 'Capital expenditure: cash spent on long-life assets like equipment, stores and vehicles.', ['CapEx', 'capital expenditure'], 'm3|PP&E schedule'],
    ['ppe', 'PP&E', 'Property, plant & equipment: a company\'s physical long-life assets.', ['PP&E'], 'm3|PP&E schedule'],
    ['cfo', 'Cash flow from operations (CFO)', 'Cash generated by running the business: net income + non-cash items ± working capital changes.', ['cash flow from operations', 'CFO', 'operating cash flow'], 'i3|3-statement linkages'],
    ['fcff', 'FCFF (unlevered free cash flow)', 'Cash the business generates for all funders: EBIT × (1 − t) + D&A − CapEx − ΔNWC. Discounted at WACC.', ['FCFF', 'unlevered free cash flow', 'free cash flow'], 'd1|Free cash flow'],
    ['fcfe', 'FCFE', 'Free cash flow to equity: FCFF − after-tax interest + net borrowing. Discounted at the cost of equity.', ['FCFE'], 'd2|Free cash flow'],
    ['wacc', 'WACC', 'Weighted average cost of capital: the blended return required by shareholders and lenders. E/V × Ke + D/V × Kd × (1 − t).', ['WACC'], 'd1|WACC'],
    ['capm', 'CAPM', 'Capital Asset Pricing Model: cost of equity = risk-free rate + beta × equity risk premium.', ['CAPM'], 'd1|Cost of equity (CAPM)'],
    ['ke', 'Cost of equity', 'The return shareholders require. Usually estimated with CAPM.', ['cost of equity', 'Ke'], 'd1|Cost of equity (CAPM)'],
    ['kd', 'Cost of debt', 'The interest rate the company pays to borrow. Use it after tax in WACC: Kd × (1 − t).', ['cost of debt', 'Kd'], 'd1|WACC'],
    ['beta', 'Beta', 'How much a stock moves relative to the market (1.0 = same as market). Measures market risk in CAPM.', ['beta', 'levered beta', 'unlevered beta', 'relevered beta'], 'd1|Beta'],
    ['rf', 'Risk-free rate', 'The return on a (near) riskless investment, typically government bonds.', ['risk-free rate', 'risk-free'], 'd1|Cost of equity (CAPM)'],
    ['erp', 'Equity risk premium', 'The extra return the stock market pays above the risk-free rate (Rm − Rf). Also called the market risk premium.', ['equity risk premium', 'market risk premium', 'risk premium'], 'd1|Cost of equity (CAPM)'],
    ['taxshield', 'Tax shield', 'Interest is tax-deductible, so debt\'s effective cost is lower: Kd × (1 − t).', ['tax shield'], 'd1|WACC'],
    ['tv', 'Terminal value', 'The value of all cash flows beyond the explicit forecast, at the end of the forecast period.', ['terminal value', 'TV'], 'd1|Terminal value'],
    ['gordon', 'Gordon growth / perpetuity growth', 'TV = FCF × (1 + g) ÷ (WACC − g): cash flows growing forever at rate g.', ['Gordon growth', 'perpetuity growth', 'perpetuity'], 'd1|Terminal value'],
    ['exit', 'Exit multiple', 'Terminal value = final-year EBITDA × an EV/EBITDA multiple.', ['exit multiple'], 'd2|Terminal value'],
    ['disc', 'Discount rate', 'The annual return used to convert future cash into today\'s value.', ['discount rate', 'discounting', 'discounted'], 'ff|Time value of money'],
    ['pv', 'Present value', 'What a future amount is worth today: FV ÷ (1 + r)ⁿ.', ['present value', 'PV'], 'ff|Time value of money'],
    ['npv', 'NPV', 'Net present value: PV of future cash flows minus the upfront cost. Positive = creates value.', ['NPV', 'net present value', 'XNPV'], 'bv|Time value of money'],
    ['irr', 'IRR', 'Internal rate of return: the discount rate that makes NPV = 0. The project\'s own annual return.', ['IRR', 'XIRR', 'hurdle rate'], 'bv|Returns'],
    ['moic', 'Multiple of money (MOIC)', 'Money back ÷ money in. Ignores time.', ['multiple of money', 'MOIC'], 'bv|Returns'],
    ['cagr', 'CAGR', 'Compound annual growth rate: (End ÷ Start)^(1/n) − 1.', ['CAGR'], 'fc|Growth rates'],
    ['ev', 'Enterprise value (EV)', 'Value of the operating business to all funders: equity value + debt + preferred + NCI − cash.', ['enterprise value', 'EV'], 'bv|Enterprise value'],
    ['eqv', 'Equity value', 'What shareholders own: share price × diluted shares, or EV − net debt − other claims.', ['equity value', 'market cap', 'market capitalization'], 'bv|Enterprise value'],
    ['netdebt', 'Net debt', 'Debt minus cash.', ['net debt'], 'bv|Enterprise value'],
    ['nci', 'Non-controlling interest (NCI)', 'The share of a subsidiary owned by outside shareholders. Added in EV because consolidated EBITDA includes 100% of the subsidiary.', ['non-controlling interest', 'NCI', 'minority interest'], 'bv|Enterprise value'],
    ['pref', 'Preferred stock', 'A hybrid security paid before common shareholders. Treated like debt in the EV bridge.', ['preferred stock'], 'bv|Enterprise value'],
    ['diluted', 'Diluted shares', 'Shares outstanding plus extra shares from in-the-money options, RSUs and convertibles.', ['diluted shares', 'diluted'], 'd2|EV to equity bridge'],
    ['multiple', 'Valuation multiple', 'A price ratio like EV/EBITDA or P/E, used to compare companies of different sizes.', ['EV/EBITDA', 'EV/Revenue', 'multiples'], 'cv|Trading comps'],
    ['pe', 'P/E ratio', 'Share price ÷ earnings per share (or equity value ÷ net income). An equity multiple.', ['P/E'], 'cv|Trading comps'],
    ['eps', 'EPS', 'Earnings per share: net income ÷ shares.', ['EPS', 'earnings per share'], 'cv|Trading comps'],
    ['comps', 'Comparable companies (comps)', 'Similar listed companies whose market multiples are used to value a target.', ['comparable companies', 'comps', 'trading comps', 'peers', 'peer'], 'cv|Trading comps'],
    ['precedent', 'Precedent transactions', 'Past acquisitions of similar companies; the multiples paid are used to value a target.', ['precedent transactions', 'precedents', 'precedent'], 'cv|Precedent transactions'],
    ['premium', 'Control premium', 'The extra a buyer pays above the market price to take control of a company.', ['control premium'], 'cv|Precedent transactions'],
    ['synergies', 'Synergies', 'Cost savings or extra revenue expected from combining two companies.', ['synergies'], 'cv|Precedent transactions'],
    ['ltm', 'LTM', 'Last twelve months: the most recent four quarters of results.', ['LTM'], 'cv|Calendarization'],
    ['calendarize', 'Calendarize', 'Convert a company\'s fiscal-year figures to a common calendar year so peers can be compared.', ['calendarize', 'calendarization', 'calendar-year', 'fiscal year'], 'cv|Calendarization'],
    ['midyear', 'Mid-year convention', 'Discounting each year\'s cash flow by (t − 0.5) because cash arrives through the year.', ['mid-year convention', 'mid-year'], 'd2|Discounting conventions'],
    ['stub', 'Stub period', 'A partial first forecast period when the valuation date isn\'t at a year-end.', ['stub period', 'stub'], 'd2|Discounting conventions'],
    ['sens', 'Sensitivity analysis', 'Flexing one or two inputs to see how the output changes (data tables, tornado charts).', ['sensitivity analysis', 'sensitivity table', 'data table', 'tornado chart', 'sensitivity'], 'ss|Sensitivity analysis'],
    ['scen', 'Scenario analysis', 'Changing a whole set of related assumptions together (downside / base / upside).', ['scenario analysis', 'scenario switch', 'scenario'], 'ss|Scenario analysis'],
    ['bps', 'Basis points (bps)', '1 bp = 0.01%. 100 bps = 1%.', ['bps', 'basis points'], 'ss|Sensitivity analysis'],
    ['dupont', 'DuPont analysis', 'ROE = net margin × asset turnover × equity multiplier.', ['DuPont', 'equity multiplier', 'asset turnover'], 'fa|Ratio analysis'],
    ['roe', 'ROE / ROA', 'Return on equity = net income ÷ equity. Return on assets = net income ÷ total assets.', ['ROE', 'ROA'], 'fa|Ratio analysis'],
    ['coverage', 'Interest coverage', 'EBIT ÷ interest expense: how many times operating profit covers interest.', ['interest coverage', 'coverage'], 'fa|Ratio analysis'],
    ['quick', 'Quick ratio', '(Current assets − inventory) ÷ current liabilities.', ['quick ratio', 'current ratio'], 'fa|Ratio analysis'],
    ['leverage', 'Leverage', 'Use of debt. Often measured as net debt ÷ EBITDA or debt ÷ equity.', ['leverage', 'levered', 'capital structure'], 'fa|Ratio analysis'],
    ['oplev', 'Operating leverage', 'High fixed costs make profit swing more when revenue changes.', ['operating leverage'], 'm3|Revenue & costs'],
    ['contrib', 'Contribution margin', 'Price − variable cost per unit: what each unit contributes to fixed costs.', ['contribution margin'], 'op|Unit economics'],
    ['breakeven', 'Break-even', 'The volume at which profit is zero: fixed costs ÷ contribution margin.', ['break-even', 'breakeven'], 'op|Unit economics'],
    ['step', 'Step costs', 'Costs that stay flat until a threshold, then jump (e.g. a new shift).', ['step costs', 'semi-fixed'], 'op|Capacity & drivers'],
    ['utilization', 'Utilization', 'The share of capacity actually used.', ['utilization'], 'op|Capacity & drivers'],
    ['mnpi', 'MNPI', 'Material non-public information. Trading on it or sharing it is insider trading.', ['material non-public information', 'MNPI', 'insider trading'], 'et|In practice'],
    ['football', 'Football field', 'A floating-bar chart comparing valuation ranges from different methods.', ['football field'], 'bv|Approaches'],
    ['waterfall', 'Waterfall chart', 'A bridge chart showing how positives and negatives get from a starting value to an ending value.', ['waterfall'], 'dv|Chart choice'],
    ['balance', 'Balance check', 'Assets − (liabilities + equity). It should be 0 in every period.', ['balance check'], 'mg|Checks'],
    ['volatile', 'Volatile function', 'A function like OFFSET or INDIRECT that recalculates on every change. Slows models and is hard to trace.', ['volatile', 'OFFSET', 'INDIRECT'], 'xl|Functions'],
    ['xlookup', 'XLOOKUP / INDEX-MATCH', 'Flexible exact-match lookups that can return a column to either side.', ['XLOOKUP', 'INDEX/MATCH', 'VLOOKUP'], 'xl|Lookups'],
    ['sumifs', 'SUMIFS', 'Sums values meeting one or more conditions: =SUMIFS(sum_range, criteria_range, criteria, …).', ['SUMIFS', 'SUMPRODUCT'], 'xl|Aggregation'],
    ['pmt', 'PMT', 'Excel function for the level payment on a loan: =PMT(rate, nper, pv).', ['PMT'], 'ff|Loans & annuities'],
  ];
  F.glossary = {};
  const aliasMap = {}; const aliases = [];
  GL.forEach(([key, term, def, al, concept]) => { F.glossary[key] = { key, term, def, concept }; al.forEach((a) => { aliasMap[a.toLowerCase()] = key; aliases.push(a); }); });
  aliases.sort((a, b) => b.length - a.length);
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const RE = new RegExp('(^|[^A-Za-z0-9&])(' + aliases.map(escRe).join('|') + ')(?![A-Za-z0-9&])', 'gi');
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  // Returns escaped HTML with the first occurrence of each glossary term turned into a tappable button.
  F.linkify = function (text, used) {
    used = used || new Set(); text = String(text);
    let out = '', last = 0, m; RE.lastIndex = 0;
    while ((m = RE.exec(text))) {
      const start = m.index + m[1].length, word = m[2], key = aliasMap[word.toLowerCase()];
      if (!key || used.has(key)) continue;
      used.add(key);
      out += esc(text.slice(last, start)) + `<button class="term" data-a="term" data-v="${key}">${esc(word)}</button>`;
      last = start + word.length;
    }
    return out + esc(text.slice(last));
  };
})(typeof window !== 'undefined' ? window : globalThis);
