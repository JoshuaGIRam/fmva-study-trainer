/* FMVA Trainer v2 — app engine + UI */
(function () {
  'use strict';
  const F = window.FMVA;
  const VERSION = '2.0.0';
  const KEY = 'fmvaTrainerV2';
  const DAY = 864e5;

  // ================= utilities =================
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const pct = (x) => Math.round(x * 100);
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / DAY);
  const addDays = (k, n) => { const d = new Date(k + 'T12:00'); d.setDate(d.getDate() + n); return dayKey(d); };
  const mmss = (ms) => { ms = Math.max(0, ms); const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  function weightedPick(items, weights) { const t = weights.reduce((a, b) => a + b, 0); let r = Math.random() * t; for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; }

  // ================= state =================
  const fresh = () => ({
    v: 2, created: Date.now(), onboarded: false,
    settings: { goal: 50, sound: true, haptics: true, examDate: '' },
    xp: 0, xpDay: {}, streak: { count: 0, last: null, best: 0, freezes: 1, frozen: [] },
    units: {}, topics: {}, items: {}, cases: {}, mocks: [], badges: {}, flags: [], mock: null,
    stats: { answered: 0, correct: 0, bestCombo: 0, lessons: 0, perfect: 0, calcCorrect: 0, waccCorrect: 0 },
  });
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === 2) { const f = fresh(); return Object.assign(f, s, { settings: Object.assign(f.settings, s.settings), stats: Object.assign(f.stats, s.stats), streak: Object.assign(f.streak, s.streak) }); }
    } catch (e) {}
    return fresh();
  }
  let S = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const unitState = (u) => S.units[u] || (S.units[u] = { lessons: 0, level: 0, legend: false, n: 0, c: 0, m: 0.5 });
  const todayXP = () => S.xpDay[dayKey()] || 0;

  // ================= content indexes =================
  const bankIdx = {}; F.bank.forEach((q) => (bankIdx[q.id] = q));
  const caseIdx = {}; const caseQ = {};
  F.cases.forEach((c) => { caseIdx[c.id] = c; c.questions.forEach((q) => (caseQ[q.id] = Object.assign({}, q, { unit: c.unit, topic: c.kind, diff: 3, type: 'case', caseId: c.id }))); });
  const byUnit = {}; F.unitOrder.forEach((u) => (byUnit[u] = { concept: [], gens: [] }));
  F.bank.forEach((q) => byUnit[q.unit].concept.push(q));
  Object.values(F.gens).forEach((g) => byUnit[g.unit].gens.push(g.id));
  const sectionOf = {}; F.sections.forEach((s, i) => s.units.forEach((u) => (sectionOf[u] = i)));
  const COLORS = [['var(--s1)', 'var(--s1d)'], ['var(--s2)', 'var(--s2d)'], ['var(--s3)', 'var(--s3d)'], ['var(--s4)', 'var(--s4d)']];
  const WEIGHT = { xl: 1, fa: 1.2, mg: 1, i3: 1.3, m3: 1.5, fc: 1.1, op: 1.1, au: 1.2, bv: 1.1, d1: 1.5, d2: 1.5, cv: 1.3, ss: 1.2, dv: 0.8, pp: 0.7, et: 0.7 };
  const validItem = (k) => (k.startsWith('g:') ? !!F.gens[k.slice(2)] : !!(bankIdx[k] || caseQ[k]));

  function getQ(id) {
    let q;
    if (id.startsWith('g:')) q = F.generate(id.slice(2));
    else q = Object.assign({}, bankIdx[id] || caseQ[id]);
    // shuffle options, track the correct one
    const order = shuffle(q.opts.map((_, i) => i));
    q.opts = order.map((i) => q.opts[i]); q.ans = order.indexOf(q.ans); q.key = id;
    return q;
  }

  // ================= sound / haptics / confetti =================
  let actx;
  function tone(seq) {
    if (!S.settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      let t = actx.currentTime;
      seq.forEach(([f, d]) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + 0.03); t += d * 0.8;
      });
    } catch (e) {}
  }
  const SND = { ok: [[660, 0.08], [990, 0.16]], bad: [[196, 0.2], [174, 0.22]], done: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.3]], badge: [[880, 0.08], [1175, 0.08], [1568, 0.22]] };
  const buzz = (p) => { if (S.settings.haptics && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };
  function confetti() {
    const c = document.createElement('canvas'); c.id = 'confetti'; document.body.appendChild(c);
    const x = c.getContext('2d'); const W = (c.width = innerWidth), H = (c.height = innerHeight);
    const cols = ['#1f6feb', '#21b35b', '#f5a524', '#e5484d', '#7c3aed', '#ff6a00'];
    const P = Array.from({ length: 140 }, () => ({ x: W / 2 + (Math.random() - 0.5) * 80, y: H * 0.35, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4, s: 4 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: pick(cols) }));
    const t0 = performance.now();
    (function f(t) {
      x.clearRect(0, 0, W, H);
      P.forEach((p) => { p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); });
      if (t - t0 < 2200) requestAnimationFrame(f); else c.remove();
    })(t0);
  }
  let toastTimer;
  function toast(msg, ms = 2600) {
    let t = document.querySelector('.toast'); if (t) t.remove();
    t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg; document.body.appendChild(t);
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), ms);
  }

  // ================= gamification =================
  const RANKS = [[0, 'Intern'], [100, 'Junior Analyst'], [300, 'Analyst I'], [600, 'Analyst II'], [1000, 'Senior Analyst'], [1600, 'Associate'], [2400, 'Senior Associate'], [3500, 'Vice President'], [5000, 'Director'], [7000, 'Managing Director'], [10000, 'Partner']];
  function rank(xp = S.xp) { let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++; return { i, name: RANKS[i][1], from: RANKS[i][0], to: RANKS[i + 1] ? RANKS[i + 1][0] : null, next: RANKS[i + 1] ? RANKS[i + 1][1] : null }; }

  const pendingCelebrations = [];
  function checkStreak() {
    const st = S.streak, t = dayKey();
    if (!st.last) return;
    const gap = daysBetween(st.last, t);
    if (gap <= 1) return;
    const missed = gap - 1;
    if (st.count > 0 && missed <= st.freezes) {
      st.freezes -= missed;
      for (let i = 1; i <= missed; i++) st.frozen.push(addDays(st.last, i));
      st.last = addDays(t, -1);
      pendingCelebrations.push(`🧊 Streak freeze used. Your ${st.count}-day streak is safe!`);
    } else if (st.count > 0) {
      pendingCelebrations.push(`Your ${st.count}-day streak ended. Start a new one today 💪`);
      st.count = 0;
    }
    save();
  }
  function addXP(n) {
    if (n <= 0) return;
    const before = todayXP(), r0 = rank().i, k = dayKey();
    S.xp += n; S.xpDay[k] = before + n;
    const st = S.streak;
    if (st.last !== k) {
      const gap = st.last ? daysBetween(st.last, k) : null;
      st.count = gap === 1 ? st.count + 1 : 1;
      st.last = k; st.best = Math.max(st.best, st.count);
      if (st.count > 1) pendingCelebrations.push(`🔥 ${st.count}-day streak!`);
      if (st.count % 7 === 0 && st.freezes < 2) { st.freezes++; pendingCelebrations.push('🧊 You earned a streak freeze'); }
    }
    if (before < S.settings.goal && before + n >= S.settings.goal) pendingCelebrations.push('🎯 Daily goal complete!');
    const r1 = rank().i;
    if (r1 > r0) pendingCelebrations.push(`🏅 Promoted to <b>${RANKS[r1][1]}</b>!`);
  }

  const BADGES = [
    ['first', '🎓', 'First lesson', 'Complete a lesson', () => S.stats.lessons >= 1],
    ['perfect', '💯', 'Flawless', 'Finish a lesson with no mistakes', () => S.stats.perfect >= 1],
    ['combo10', '⚡', 'On fire', '10 correct in a row', () => S.stats.bestCombo >= 10],
    ['streak3', '🔥', 'Warming up', '3-day streak', () => S.streak.best >= 3],
    ['streak7', '📆', 'Week strong', '7-day streak', () => S.streak.best >= 7],
    ['streak30', '🏆', 'Unstoppable', '30-day streak', () => S.streak.best >= 30],
    ['q100', '📚', 'Century', 'Answer 100 questions', () => S.stats.answered >= 100],
    ['q500', '🧠', 'Grinder', 'Answer 500 questions', () => S.stats.answered >= 500],
    ['calc50', '🧮', 'Number cruncher', '50 calculations correct', () => S.stats.calcCorrect >= 50],
    ['wacc', '⚖️', 'Cost of capital', '15 WACC / CAPM / beta correct', () => S.stats.waccCorrect >= 15],
    ['cases', '📂', 'Case cracker', 'Pass all 4 Excel cases', () => F.cases.every((c) => S.cases[c.id] && S.cases[c.id].best >= 0.7)],
    ['auditor', '🔍', 'Auditor', '100% on the audit case', () => S.cases.case_audit && S.cases.case_audit.best >= 1],
    ['rounded', '🧭', 'Well-rounded', 'Level 1+ in every unit', () => F.unitOrder.every((u) => S.units[u] && S.units[u].level >= 1)],
    ['legend', '👑', 'Legendary', 'Pass a Legendary challenge', () => Object.values(S.units).some((u) => u.legend)],
    ['mockpass', '✅', 'Passed', '70%+ on a full mock exam', () => S.mocks.some((m) => m.full && m.score >= 0.7)],
    ['ready', '🚀', 'Exam ready', '80%+ on a full mock exam', () => S.mocks.some((m) => m.full && m.score >= 0.8)],
  ];
  function checkBadges() {
    const got = [];
    BADGES.forEach(([id, ic, name, , fn]) => { if (!S.badges[id] && fn()) { S.badges[id] = Date.now(); got.push(`${ic} Badge unlocked: <b>${name}</b>`); } });
    return got;
  }
  function flushCelebrations(extra = []) {
    const all = pendingCelebrations.splice(0).concat(extra);
    all.forEach((m, i) => setTimeout(() => { toast(m); if (/Badge|Promoted|goal/.test(m)) tone(SND.badge); }, i * 2300));
  }

  // ================= learning engine =================
  const INTERVALS = [0, 1, 3, 7, 16, 35]; // days per Leitner box
  function record(q, ok) {
    S.stats.answered++; if (ok) S.stats.correct++;
    const tk = q.unit + '|' + q.topic;
    const t = S.topics[tk] || (S.topics[tk] = { n: 0, c: 0, m: 0.5 });
    t.n++; if (ok) t.c++; t.m = t.m * 0.75 + (ok ? 0.25 : 0);
    const u = unitState(q.unit); u.n++; if (ok) u.c++; u.m = u.m * 0.85 + (ok ? 0.15 : 0);
    const key = q.gen ? 'g:' + q.gen : q.key || q.id;
    const it = S.items[key] || (S.items[key] = { box: 0, due: 0, n: 0, c: 0, wrong: 0 });
    it.n++;
    if (ok) { it.c++; it.box = Math.min(5, it.box + 1); } else { it.box = 0; it.wrong++; }
    it.due = Date.now() + INTERVALS[it.box] * DAY; it.last = Date.now();
    if (ok && q.type === 'calc') S.stats.calcCorrect++;
    if (ok && /WACC|CAPM|Beta/.test(q.topic)) S.stats.waccCorrect++;
  }
  const unitMastery = (u) => { const s = S.units[u]; return s && s.n >= 3 ? s.m : null; };
  function readiness() {
    let s = 0, w = 0, rated = 0;
    F.unitOrder.forEach((u) => { const m = unitMastery(u); if (m !== null) rated++; s += (m === null ? 0.25 : m) * WEIGHT[u]; w += WEIGHT[u]; });
    let r = s / w;
    const last = S.mocks.filter((m) => m.full).slice(-1)[0];
    if (last && Date.now() - last.t < 21 * DAY) r = 0.5 * r + 0.5 * last.score;
    return { r, rated };
  }
  function prio(id) { const it = S.items[id]; if (!it) return Math.random() * 0.5; return (it.due <= Date.now() ? 1 : 3) + it.box * 0.3 + Math.random() * 0.6; }

  function buildLesson(u, { n = 8, legend = false } = {}) {
    const st = unitState(u), lvl = st.level, pool = byUnit[u];
    const want = (d) => (legend ? d >= 2 : lvl <= 1 ? d <= 2 : lvl >= 4 ? d >= 2 : true);
    let concepts = pool.concept.filter((q) => want(q.diff)); if (concepts.length < 4) concepts = pool.concept.slice();
    concepts = shuffle(concepts).sort((a, b) => prio(a.id) - prio(b.id));
    let gens = pool.gens.filter((g) => want(F.gens[g].diff)); if (!gens.length) gens = pool.gens.slice();
    const nCalc = gens.length ? Math.round(n * (legend ? 0.6 : 0.5)) : 0;
    const out = []; let gq = shuffle(gens);
    for (let i = 0; i < nCalc; i++) { if (!gq.length) gq = shuffle(gens); out.push('g:' + gq.pop()); }
    concepts.slice(0, n - out.length).forEach((q) => out.push(q.id));
    while (out.length < n) out.push(gens.length ? 'g:' + pick(gens) : pick(pool.concept).id);
    return shuffle(out);
  }
  function buildSmart(n = 10) {
    const now = Date.now();
    const due = Object.entries(S.items).filter(([k, it]) => it.due <= now && validItem(k) && !caseQ[k]).sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due).map(([k]) => k);
    const out = due.slice(0, Math.ceil(n * 0.4));
    const units = F.unitOrder, weights = units.map((u) => { const m = unitMastery(u); return (m === null ? 0.45 : Math.pow(1 - m, 1.5) + 0.05) * WEIGHT[u]; });
    let guard = 0;
    while (out.length < n && guard++ < 200) {
      const u = weightedPick(units, weights), pool = byUnit[u];
      let id;
      if (pool.gens.length && Math.random() < 0.5) id = 'g:' + pick(pool.gens);
      else { const c = shuffle(pool.concept).sort((a, b) => prio(a.id) - prio(b.id))[0]; id = c && c.id; }
      if (id && !out.includes(id)) out.push(id);
    }
    return shuffle(out);
  }
  const mistakeIds = () => Object.entries(S.items).filter(([k, it]) => it.wrong > 0 && it.box <= 2 && validItem(k)).sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due).map(([k]) => k);
  function buildMock(full) {
    const n = full ? 50 : 20; const qs = [];
    if (full) { const c = pick(F.cases); c.questions.forEach((q) => qs.push(q.id)); }
    const units = F.unitOrder, w = units.map((u) => WEIGHT[u]);
    const used = new Set(qs); let guard = 0;
    while (qs.length < n && guard++ < 2000) {
      const u = weightedPick(units, w), pool = byUnit[u];
      if (pool.gens.length && Math.random() < 0.45) qs.push('g:' + pick(pool.gens));
      else { const c = pick(pool.concept); if (c && !used.has(c.id)) { used.add(c.id); qs.push(c.id); } }
    }
    const caseIds = qs.filter((id) => caseQ[id]), rest = shuffle(qs.filter((id) => !caseQ[id]));
    const at = Math.floor(rest.length * 0.4); rest.splice(at, 0, ...caseIds); // keep case questions together
    return { full, n, limit: (full ? 180 : 72) * 60000, start: Date.now(), qs: rest.map(getQ), ans: Array(n).fill(null), flag: Array(n).fill(false), i: 0 };
  }

  // ================= navigation & view state =================
  let view = { tab: 'learn', note: null };
  let sess = null; // active practice session
  let sheet = null; // html for bottom sheet
  let review = null; // reviewing a finished mock
  let calcExpr = '';

  // ================= rendering =================
  function render() {
    const app = document.getElementById('app');
    let body = '';
    const inSession = !!(sess || S.mock || review);
    if (review) body = renderReview();
    else if (S.mock) body = renderMock();
    else if (sess) body = sess.done ? renderSummary() : renderSession();
    else body = { learn: renderLearn, practice: renderPractice, exam: renderExam, notes: renderNotes, profile: renderProfile }[view.tab]();
    app.className = 'app' + (inSession ? ' session' : '') + (sess && sess.checked && !sess.done ? ' checked' : '');
    app.innerHTML = (inSession ? '' : topbar()) + body + (inSession ? '' : tabs()) + (sheet ? `<div class="scrim" data-a="closeSheet"></div><div class="sheet">${sheet}</div>` : '');
    if (S.mock) tickMock();
  }
  function topbar() {
    const g = Math.min(100, pct(todayXP() / S.settings.goal));
    const active = S.streak.last === dayKey();
    return `<div class="topbar"><div class="topbar-in"><div class="brand">FMVA <b>Trainer</b></div><div class="chips">
      <span class="chip flame ${active ? '' : 'off'}" title="Streak">🔥 ${S.streak.count}</span>
      <span class="chip xp" title="Total XP">⚡ ${S.xp.toLocaleString()}</span>
      <span class="ring" style="--p:${g}" title="Daily goal"><span>${g >= 100 ? '✓' : g}</span></span></div></div></div>`;
  }
  function tabs() {
    const t = [['learn', '🗺️', 'Learn'], ['practice', '🎯', 'Practice'], ['exam', '⏱️', 'Exam'], ['notes', '📘', 'Notes'], ['profile', '👤', 'Profile']];
    return `<nav class="tabs"><div class="tabs-in">${t.map(([id, i, n]) => `<button class="tab ${view.tab === id ? 'on' : ''}" data-a="tab" data-v="${id}"><i>${i}</i>${n}</button>`).join('')}</div></nav>`;
  }

  // ---------- Learn ----------
  function recommendedUnit() {
    for (const u of F.unitOrder) if (unitState(u).level < 1) return u;
    return F.unitOrder.slice().sort((a, b) => unitState(a).level - unitState(b).level || (unitMastery(a) || 0) - (unitMastery(b) || 0))[0];
  }
  function renderLearn() {
    const rd = readiness(), rec = recommendedUnit();
    const ex = S.settings.examDate ? daysBetween(dayKey(), S.settings.examDate) : null;
    let h = `<div class="card"><div class="row"><div><div class="muted small" style="font-weight:800">EXAM READINESS</div><div class="big">${pct(rd.r)}%</div>
      <div class="small muted">${rd.rated}/16 units rated · pass mark 70%${ex !== null && ex >= 0 ? ` · <b>${ex} days</b> to exam` : ''}</div></div>
      <div class="gauge" style="--p:${pct(rd.r)};--c:${rd.r >= 0.8 ? 'var(--green)' : rd.r >= 0.7 ? 'var(--gold)' : 'var(--brand)'};width:86px;height:86px"><div style="width:66px;height:66px;font-size:22px">${rd.r >= 0.8 ? '🚀' : rd.r >= 0.7 ? '✅' : '📈'}</div></div></div>
      <div style="margin-top:12px" class="grid2"><button class="btn green sm" data-a="startUnit" data-v="${rec}">Continue: ${esc(F.units[rec].name)}</button><button class="btn ghost sm" data-a="smart">Smart practice</button></div></div>`;
    F.sections.forEach((s, si) => {
      const [c, cd] = COLORS[si];
      h += `<div class="section-banner" style="background:${c}"><div class="t">Section ${si + 1}</div><div class="n">${esc(s.name)}</div><div class="small" style="opacity:.9">${esc(s.sub)}</div></div><div class="path">`;
      s.units.forEach((u, i) => {
        const st = unitState(u), off = [0, 55, 80, 55, 0, -55, -80, -55][(i + si * 2) % 8];
        const p = st.legend ? 100 : st.level * 20 + (st.lessons % 2) * 10;
        h += `<div class="node-wrap" style="transform:translateX(${off}px)">${u === rec ? '<div class="next-tip">START HERE</div>' : ''}
          <button class="node ${st.legend ? 'legend' : ''}" data-a="unitSheet" data-v="${u}" aria-label="${esc(F.units[u].name)}"><span class="node-ring" style="--p:${p}"></span>
          <span class="face" style="background:${c};box-shadow:0 6px 0 ${cd}">${F.units[u].icon}</span>${st.level || st.legend ? `<span class="crowns">${st.legend ? '👑' : '★ ' + st.level}</span>` : ''}</button>
          <div class="node-label">${esc(F.units[u].name)}</div></div>`;
      });
      (s.checkpoint || []).forEach((cp) => {
        const isMock = cp === 'mock', done = isMock ? S.mocks.some((m) => m.full && m.score >= 0.7) : S.cases[cp] && S.cases[cp].best >= 0.7;
        const label = isMock ? 'Final: full mock exam' : 'Checkpoint: ' + caseIdx[cp].name.split(' — ')[1];
        h += `<div class="node-wrap"><button class="node cp ${done ? 'done' : ''}" data-a="${isMock ? 'tab' : 'caseSheet'}" data-v="${isMock ? 'exam' : cp}"><span class="face" style="background:var(--gold);box-shadow:0 6px 0 var(--gold-d)"><span>${isMock ? '🏁' : '📊'}</span></span></button><div class="node-label">${esc(label)}</div></div>`;
      });
      h += '</div>';
    });
    return h + `<p class="tiny muted" style="text-align:center;margin-top:24px">Path follows CFI's 2026 FMVA core curriculum. Original practice content, not affiliated with CFI.</p>`;
  }
  function unitSheet(u) {
    const st = unitState(u), un = F.units[u], m = unitMastery(u);
    const nq = byUnit[u].concept.length, ng = byUnit[u].gens.length;
    return `<div class="row"><div><div class="pill">${esc(un.course)}</div><div class="h1">${un.icon} ${esc(un.name)}</div></div></div>
      <div class="statgrid" style="margin:10px 0 14px"><div class="stat"><div class="v">${st.legend ? '👑' : '★ ' + st.level}<span class="small muted">/5</span></div><div class="l">Level</div></div>
      <div class="stat"><div class="v">${m === null ? '–' : pct(m) + '%'}</div><div class="l">Mastery</div></div><div class="stat"><div class="v">${nq}+${ng}</div><div class="l">Q's · generators</div></div></div>
      <div class="bar gold" style="margin-bottom:6px"><i style="width:${st.legend ? 100 : st.level * 20 + (st.lessons % 2) * 10}%"></i></div>
      <div class="small muted" style="margin-bottom:16px">${st.level >= 5 ? (st.legend ? 'Legendary! You have mastered this unit.' : 'Max level. Try the Legendary challenge: 10 hard questions in 15 min, 90% to pass.') : `2 lessons per level · ${st.lessons % 2}/2 done toward level ${st.level + 1}`}</div>
      <div class="stack"><button class="btn green" data-a="startUnit" data-v="${u}">Start lesson · 8 questions</button>
      ${st.level >= 5 && !st.legend ? `<button class="btn purple" data-a="legend" data-v="${u}">👑 Legendary challenge</button>` : ''}
      <button class="btn ghost" data-a="openNote" data-v="${u}">Read notes</button></div>`;
  }
  function caseSheet(id) {
    const c = caseIdx[id], best = S.cases[id];
    return `<div class="pill case">${esc(c.kind)} · ~${c.mins} min</div><div class="h1">${esc(c.name)}</div><p class="muted">${esc(c.brief)}</p>
      ${best ? `<p class="small"><b>Best score:</b> ${pct(best.best)}% ${best.best >= 0.7 ? '✅' : ''}</p>` : ''}
      <div class="stack"><a class="btn ghost" href="cases/${c.files[0]}" download>⬇ Download Excel task file</a>
      <button class="btn green" data-a="startCase" data-v="${id}">Answer case questions (${c.questions.length})</button>
      <a class="link small" href="cases/${c.files[1]}" download style="text-align:center">Solution workbook (open after you finish)</a></div>
      <p class="tiny muted">The real exam includes Excel modeling case studies. Build these in Excel first, then answer here.</p>`;
  }

  // ---------- Practice ----------
  function renderPractice() {
    const mis = mistakeIds().length;
    const items = [
      ['smart', '🧠', 'var(--brand)', 'Smart practice', 'Adaptive mix: your due reviews + weakest units · 10 Qs'],
      ['mistakes', '🔁', 'var(--red)', 'Review mistakes', mis ? `${mis} question${mis > 1 ? 's' : ''} to fix` : 'Nothing to review yet, nice'],
      ['sprint', '⏱️', 'var(--flame)', 'Calc sprint', '10 calculation questions against the clock'],
    ];
    let h = `<div class="h1">Practice</div><p class="muted" style="margin-top:0">Spaced repetition brings back what you miss: wrong answers return the same day, then after 1, 3, 7, 16 and 35 days.</p><div class="card">`;
    items.forEach(([a, ic, col, t, d]) => (h += `<button class="list-item" style="width:100%;text-align:left" data-a="${a}" ${a === 'mistakes' && !mis ? 'disabled' : ''}><span class="ico" style="background:${col}">${ic}</span><span style="flex:1"><b>${t}</b><br><span class="small muted">${d}</span></span><span class="muted">›</span></button>`));
    h += `</div><div class="h2" style="margin-top:20px">Excel case studies</div><div class="card">`;
    F.cases.forEach((c) => { const b = S.cases[c.id]; h += `<button class="list-item" style="width:100%;text-align:left" data-a="caseSheet" data-v="${c.id}"><span class="ico" style="background:var(--purple)">📊</span><span style="flex:1"><b>${esc(c.name)}</b><br><span class="small muted">${esc(c.kind)} · ${c.questions.length} Qs · ~${c.mins} min${b ? ` · best ${pct(b.best)}%` : ''}</span></span><span class="muted">›</span></button>`; });
    h += `</div><div class="h2" style="margin-top:20px">By unit</div><div class="card">`;
    F.unitOrder.forEach((u) => { const m = unitMastery(u), si = sectionOf[u]; h += `<button class="list-item" style="width:100%;text-align:left" data-a="unitSheet" data-v="${u}"><span class="ico" style="background:${COLORS[si][0]}">${F.units[u].icon}</span><span style="flex:1"><b>${esc(F.units[u].name)}</b><div class="bar" style="margin-top:6px;height:7px"><i style="width:${m === null ? 0 : pct(m)}%;background:${m === null ? 'var(--line)' : m >= 0.8 ? 'var(--green)' : m >= 0.6 ? 'var(--gold)' : 'var(--red)'}"></i></div></span><span class="small muted" style="width:42px;text-align:right">${m === null ? '–' : pct(m) + '%'}</span></button>`; });
    return h + '</div>';
  }

  // ---------- Exam ----------
  function renderExam() {
    const full = S.mocks.filter((m) => m.full).slice(-8);
    let h = `<div class="h1">Mock exam</div><p class="muted" style="margin-top:0">Mirrors the real format: 50 randomized multiple-choice questions, including an Excel case study, 3 hours, 70% to pass. The timer keeps running if you leave, just like the real exam (which can't be paused).</p>
      <div class="card"><div class="row"><div><div class="h2">Full mock</div><div class="small muted">50 questions · 3:00:00 · includes 1 Excel case</div></div><span style="font-size:34px">🏁</span></div><div style="margin-top:12px"><button class="btn" data-a="startMock" data-v="full">Start full mock</button></div></div>
      <div class="card"><div class="row"><div><div class="h2">Mini mock</div><div class="small muted">20 questions · 1:12:00 · same pace (3.6 min/Q)</div></div><span style="font-size:34px">⏱️</span></div><div style="margin-top:12px"><button class="btn ghost" data-a="startMock" data-v="mini">Start mini mock</button></div></div>`;
    if (S.mocks.length) {
      h += `<div class="card"><div class="h2">Your results</div><div class="week" style="height:130px">${S.mocks.slice(-10).map((m) => `<div class="d"><div class="small" style="font-weight:900">${pct(m.score)}</div><div class="col ${m.score >= 0.7 ? 'hit' : ''}" style="height:${Math.max(4, m.score * 100)}%;${m.full ? '' : 'opacity:.55'}"></div><div class="lbl">${m.full ? 'Full' : 'Mini'}</div></div>`).join('')}</div>
        <p class="tiny muted">Green = 70%+. ${full.length ? `Best full mock: <b>${pct(Math.max(...full.map((m) => m.score)))}%</b>` : 'No full mock yet.'}</p></div>`;
    }
    h += `<div class="card"><div class="h2">Exam-day tactics</div><ul class="small" style="padding-left:18px;margin:0">
      <li>Budget about <b>3.6 minutes per question</b>. Bank time on quick concept questions for the Excel cases.</li>
      <li>Have Excel open and build case calculations in a sheet. Don't do multi-step DCF math in your head.</li>
      <li>Flag anything taking more than 5 minutes and come back to it. Unanswered questions score zero, so never leave blanks.</li>
      <li>Re-read what is asked: EV vs equity value, pre- vs after-tax, opening vs average balance, end- vs mid-year.</li>
      <li>CFI's own practice exam (on your dashboard) is the closest thing to the real one. Take it once you're scoring 80%+ here.</li></ul></div>`;
    return h;
  }

  // ---------- Notes ----------
  const FORMULAS = [
    ['Time value of money', [['PV', 'FV ÷ (1+r)ⁿ'], ['NPV', 'Σ CFₜ ÷ (1+r)ᵗ − initial outlay'], ['Annuity payment', 'P × r ÷ (1 − (1+r)⁻ⁿ)'], ['CAGR', '(End ÷ Start)^(1/n) − 1']]],
    ['Ratios', [['ROE (DuPont)', 'NI/Rev × Rev/Assets × Assets/Equity'], ['Quick ratio', '(CA − inventory) ÷ CL'], ['Interest coverage', 'EBIT ÷ interest'], ['Net leverage', '(Debt − cash) ÷ EBITDA'], ['DSO / DIO / DPO', 'AR/Rev×365 · Inv/COGS×365 · AP/COGS×365'], ['Cash conversion cycle', 'DSO + DIO − DPO']]],
    ['Cost of capital', [['CAPM', 'Ke = Rf + β × (Rm − Rf)'], ['After-tax Kd', 'Kd × (1 − t)'], ['WACC', 'E/V × Ke + D/V × Kd × (1 − t)'], ['Relever beta', 'βL = βU × [1 + (1 − t) × D/E]']]],
    ['DCF', [['FCFF', 'EBIT(1 − t) + D&A − CapEx − ΔNWC'], ['FCFE', 'FCFF − Int(1 − t) + net borrowing'], ['TV (Gordon)', 'FCFₙ × (1+g) ÷ (WACC − g)'], ['TV (exit)', 'EBITDAₙ × exit multiple'], ['Mid-year factor', '1 ÷ (1+WACC)^(t − 0.5)'], ['Implied g', '(TV×W − FCF) ÷ (TV + FCF)']]],
    ['Enterprise value', [['EV', 'Equity value + debt + preferred + NCI − cash'], ['Equity value', 'EV − debt − preferred − NCI + cash'], ['Share price', 'Equity value ÷ diluted shares']]],
    ['Comps & deals', [['Implied price (EV mult.)', '(Metric × multiple − net debt) ÷ shares'], ['Implied price (P/E)', 'P/E × EPS'], ['Calendarize (FY ends month m)', 'm/12 × FY₁ + (12−m)/12 × FY₂'], ['Offer price', 'Unaffected price × (1 + premium)']]],
    ['Operations', [['Contribution margin', 'Price − variable cost'], ['Break-even units', 'Fixed costs ÷ contribution margin'], ['Revenue (capacity)', 'Capacity × utilization × price']]],
  ];
  function renderNotes() {
    if (view.note === 'formulas') return `<button class="link" data-a="noteBack">‹ All notes</button><div class="h1">Formula sheet</div>` + FORMULAS.map(([g, rows]) => `<div class="card"><div class="h2">${g}</div><table class="t">${rows.map(([a, b]) => `<tr><td><b>${esc(a)}</b></td><td style="text-align:left">${esc(b)}</td></tr>`).join('')}</table></div>`).join('');
    if (view.note) {
      const u = F.units[view.note];
      return `<button class="link" data-a="noteBack">‹ All notes</button><div class="h1">${u.icon} ${esc(u.name)}</div><div class="pill">${esc(u.course)}</div>
        <div class="card notes" style="margin-top:12px">${u.notes.map(([t, items]) => `<h3>${esc(t)}</h3><ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`).join('')}</div>
        <button class="btn green" data-a="startUnit" data-v="${view.note}">Practice this unit</button>`;
    }
    let h = `<div class="h1">Notes</div><p class="muted" style="margin-top:0">Short, exam-focused summaries. Read one, then do a lesson. Active recall beats re-reading.</p>
      <div class="card"><button class="list-item" style="width:100%;text-align:left" data-a="openNote" data-v="formulas"><span class="ico" style="background:var(--gold)">ƒ</span><span style="flex:1"><b>Formula sheet</b><br><span class="small muted">Every formula you need, on one page</span></span><span class="muted">›</span></button></div>`;
    F.sections.forEach((s, si) => { h += `<div class="h2" style="margin-top:18px">${esc(s.name)}</div><div class="card">${s.units.map((u) => `<button class="list-item" style="width:100%;text-align:left" data-a="openNote" data-v="${u}"><span class="ico" style="background:${COLORS[si][0]}">${F.units[u].icon}</span><span style="flex:1"><b>${esc(F.units[u].name)}</b><br><span class="small muted">${esc(F.units[u].course)}</span></span><span class="muted">›</span></button>`).join('')}</div>`; });
    return h;
  }

  // ---------- Profile ----------
  function renderProfile() {
    const r = rank(), acc = S.stats.answered ? S.stats.correct / S.stats.answered : 0;
    const days = Array.from({ length: 7 }, (_, i) => addDays(dayKey(), i - 6));
    const maxX = Math.max(S.settings.goal, ...days.map((d) => S.xpDay[d] || 0));
    let h = `<div class="card"><div class="row"><div><div class="muted small" style="font-weight:800">RANK</div><div class="h1" style="margin:0">${r.name}</div><div class="small muted">${S.xp.toLocaleString()} XP${r.to ? ` · ${(r.to - S.xp).toLocaleString()} to ${r.next}` : ' · top rank!'}</div></div><span style="font-size:44px">🏅</span></div>
      ${r.to ? `<div class="bar gold" style="margin-top:10px"><i style="width:${pct((S.xp - r.from) / (r.to - r.from))}%"></i></div>` : ''}</div>
      <div class="statgrid" style="margin-bottom:14px"><div class="stat"><div class="v">🔥 ${S.streak.count}</div><div class="l">Streak · best ${S.streak.best}</div></div><div class="stat"><div class="v">${S.stats.answered}</div><div class="l">Answered</div></div><div class="stat"><div class="v">${pct(acc)}%</div><div class="l">Accuracy</div></div>
      <div class="stat"><div class="v">🧊 ${S.streak.freezes}</div><div class="l">Freezes</div></div><div class="stat"><div class="v">${S.stats.lessons}</div><div class="l">Lessons</div></div><div class="stat"><div class="v">⚡ ${S.stats.bestCombo}</div><div class="l">Best combo</div></div></div>
      <div class="card"><div class="row"><div class="h2">This week</div><div class="small muted">goal ${S.settings.goal} XP/day</div></div><div class="week">${days.map((d) => { const v = S.xpDay[d] || 0; return `<div class="d"><div class="tiny" style="font-weight:800">${v || ''}</div><div class="col ${v >= S.settings.goal ? 'hit' : ''}" style="height:${(v / maxX) * 100}%"></div><div class="lbl">${'SMTWTFS'[new Date(d + 'T12:00').getDay()]}</div></div>`; }).join('')}</div></div>
      <div class="card"><div class="h2">Badges <span class="small muted">${Object.keys(S.badges).length}/${BADGES.length}</span></div><div class="badges">${BADGES.map(([id, ic, name, d]) => `<div class="badge ${S.badges[id] ? 'on' : ''}" title="${esc(d)}"><div class="b">${ic}</div>${esc(name)}</div>`).join('')}</div></div>
      <div class="card"><div class="h2">Settings</div>
        <div class="small muted" style="font-weight:800;margin:6px 0">DAILY GOAL</div><div class="seg">${[[30, 'Casual'], [50, 'Regular'], [100, 'Serious'], [150, 'Intense']].map(([g, n]) => `<button class="${S.settings.goal === g ? 'on' : ''}" data-a="goal" data-v="${g}">${n}<br><span class="tiny">${g} XP</span></button>`).join('')}</div>
        <div class="small muted" style="font-weight:800;margin:14px 0 6px">EXAM DATE</div><input type="date" id="examDate" value="${esc(S.settings.examDate)}" data-change="examDate">
        <div class="row" style="margin-top:14px"><b>Sound effects</b><button class="switch ${S.settings.sound ? 'on' : ''}" data-a="toggle" data-v="sound" aria-label="Sound"></button></div>
        <div class="row" style="margin-top:12px"><b>Haptics</b><button class="switch ${S.settings.haptics ? 'on' : ''}" data-a="toggle" data-v="haptics" aria-label="Haptics"></button></div></div>
      <div class="card"><div class="h2">Beta feedback <span class="small muted">${S.flags.length} flagged</span></div><p class="small muted" style="margin-top:0">Flag questions during practice (🚩), then copy them all here and paste them back to Claude to fix or tune.</p>
        <div class="grid2"><button class="btn sm" data-a="copyFlags" ${S.flags.length ? '' : 'disabled'}>Copy feedback</button><button class="btn ghost sm" data-a="clearFlags" ${S.flags.length ? '' : 'disabled'}>Clear</button></div></div>
      <div class="card"><div class="h2">Backup</div><p class="small muted" style="margin-top:0">Progress is saved on this device only. Export a backup before switching phones or clearing browser data.</p>
        <div class="grid2"><button class="btn ghost sm" data-a="export">Export</button><button class="btn ghost sm" data-a="import">Import</button></div><input type="file" id="importFile" accept="application/json" style="display:none" data-change="importFile">
        <button class="link small" style="margin-top:14px;color:var(--red)" data-a="reset">Reset all progress</button></div>
      <p class="tiny muted" style="text-align:center">FMVA Trainer v${VERSION} · Exam format per CFI's FMVA Final Exam overview (50 MCQs incl. Excel case studies, 3 hours, 70% pass). Curriculum mapped to the 2026 core courses. Original questions; not affiliated with or endorsed by CFI. FMVA® is a CFI trademark.</p>`;
    return h;
  }

  // ---------- Session (lesson / practice / case) ----------
  function caseContext(caseId, open) {
    const c = caseIdx[caseId];
    return `<details class="casebox" ${open ? 'open' : ''}><summary>📊 ${esc(c.name)}: case data</summary><p class="small">${esc(c.brief)}</p>
      ${c.tables.map((t) => `<div class="small" style="font-weight:800;margin-top:8px">${esc(t.title)}</div><div class="tscroll"><table class="t"><tr>${t.head.map((x) => `<th>${esc(x)}</th>`).join('')}</tr>${t.rows.map((r) => `<tr>${r.map((x) => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</table></div>`).join('')}
      <a class="link small" href="cases/${c.files[0]}" download>⬇ Excel task file</a></details>`;
  }
  function qBody(q, sel, state) {
    // state: null (answering), 'checked' (show right/wrong), or {chosen} for review
    const tags = `<span class="pill">${esc(F.units[q.unit].name)}</span> ${q.type === 'calc' ? '<span class="pill calc">Calculation</span>' : ''}${q.type === 'case' ? '<span class="pill case">Case</span>' : ''} ${q.diff >= 3 ? '<span class="pill hard">Hard</span>' : ''}`;
    const opts = q.opts.map((o, i) => {
      let cls = '';
      if (state) { if (i === q.ans) cls = 'right'; else if (i === sel) cls = 'wrong'; }
      else if (i === sel) cls = 'sel';
      return `<button class="opt ${cls}" data-a="sel" data-v="${i}" ${state ? 'disabled' : ''}><span class="k">${'ABCD'[i]}</span><span>${esc(o)}</span></button>`;
    }).join('');
    return `${q.caseId ? caseContext(q.caseId, !state && (!sess || sess.i === 0 || sess.mode !== 'case')) : ''}<div>${tags}</div><div class="qtext">${esc(q.q)}</div><div class="opts">${opts}</div>`;
  }
  function startSession(mode, ids, extra = {}) {
    if (!ids.length) { toast('Nothing to practice here yet'); return; }
    sess = Object.assign({ mode, queue: ids.slice(), i: 0, cur: null, sel: null, checked: false, results: [], combo: 0, xp: 0, start: Date.now(), requeued: 0, done: false }, extra);
    sheet = null; window.scrollTo(0, 0); render();
  }
  function renderSession() {
    const s = sess; if (!s.cur) { s.cur = getQ(s.queue[s.i]); s.cur.retry = s.retrySet && s.retrySet.has(s.i); }
    const q = s.cur, prog = pct(s.i / s.queue.length);
    const timer = s.timeLimit ? `<span class="timer" id="stimer">${mmss(s.timeLimit - (Date.now() - s.start))}</span>` : `<span class="combo">${s.combo >= 3 ? '🔥' + s.combo : ''}</span>`;
    let h = `<div class="sbar"><button class="x" data-a="quit" aria-label="Quit">✕</button><div class="bar"><i style="width:${prog}%"></i></div>${timer}</div>`;
    if (q.retry) h += `<div class="pill" style="background:var(--red-bg);color:var(--red-d);margin-bottom:6px">↻ Let's try that again</div>`;
    h += qBody(q, s.sel, s.checked ? 'checked' : null);
    h += `<div class="tools"><button data-a="calc">🧮 Calculator</button><button data-a="flag">🚩 Flag question</button></div>`;
    if (!s.checked) h += `<div class="footer"><div class="footer-in"><button class="btn green" data-a="check" ${s.sel === null ? 'disabled' : ''}>Check</button></div></div>`;
    else {
      const ok = s.sel === q.ans;
      h += `<div class="footer ${ok ? 'ok' : 'bad'}"><div class="footer-in"><div class="row"><div class="verdict">${s.verdict}</div><button class="small" style="font-weight:800;color:var(--muted)" data-a="flag">🚩 Flag</button></div>
        ${ok ? '' : `<div class="small" style="font-weight:800;margin-bottom:4px">Correct answer: ${esc(q.opts[q.ans])}</div>`}<div class="exp">${esc(q.exp)}</div>
        <button class="btn ${ok ? 'green' : 'red'}" data-a="next">Continue</button></div></div>`;
    }
    if (s.timeLimit) { clearTimeout(sessTimer); sessTimer = setTimeout(tickSession, 1000); }
    return h;
  }
  let sessTimer;
  function tickSession() {
    const el = document.getElementById('stimer'); if (!el || !sess || !sess.timeLimit) return;
    const left = sess.timeLimit - (Date.now() - sess.start); el.textContent = mmss(left); el.classList.toggle('low', left < 120000);
    if (left <= 0 && !sess.done) { finishSession(true); return; }
    sessTimer = setTimeout(tickSession, 1000);
  }
  function check() {
    const s = sess, q = s.cur; if (s.sel === null || s.checked) return;
    const ok = s.sel === q.ans; s.checked = true;
    record(q, ok);
    if (!q.retry) s.results.push({ ok, unit: q.unit });
    let xp = 0;
    if (ok) { s.combo++; S.stats.bestCombo = Math.max(S.stats.bestCombo, s.combo); xp = q.retry ? 5 : q.diff >= 3 ? 15 : 10; if (s.combo >= 5) xp += 5; tone(SND.ok); buzz(15); }
    else { s.combo = 0; tone(SND.bad); buzz([30, 40, 30]); if (['lesson', 'practice', 'legendX'].includes(s.mode) && s.requeued < 3) { s.requeued++; s.queue.push(q.key); (s.retrySet = s.retrySet || new Set()).add(s.queue.length - 1); } }
    s.lastXP = xp; s.verdict = ok ? pick(['Nice!', 'Correct!', 'Spot on!', 'Excellent!', 'Nailed it!']) + (xp ? ` <span class="small">+${xp} XP</span>` : '') : 'Not quite';
    s.xp += xp; addXP(xp); save(); render();
    if (!ok) { const o = document.querySelector('.opts'); o && o.classList.add('shake'); }
  }
  function next() { const s = sess; s.i++; s.cur = null; s.sel = null; s.checked = false; if (s.i >= s.queue.length) finishSession(); else { window.scrollTo(0, 0); render(); } }
  function finishSession(timeUp) {
    const s = sess; s.done = true; s.timeUp = !!timeUp;
    const n = s.results.length, c = s.results.filter((r) => r.ok).length, acc = n ? c / n : 0; s.acc = acc; s.msgs = [];
    if (s.mode === 'lesson' || s.mode === 'legend') {
      const st = unitState(s.unit);
      if (s.mode === 'lesson') {
        S.stats.lessons++;
        if (acc >= 0.6) { st.lessons++; const nl = Math.min(5, Math.floor(st.lessons / 2)); if (nl > st.level) { st.level = nl; s.msgs.push(`⭐ ${F.units[s.unit].name} reached level ${nl}!`); } }
        else s.msgs.push('Score 60%+ to count this lesson toward the next level.');
        const bonus = 15 + (acc === 1 ? 10 : 0); s.xp += bonus; addXP(bonus);
      } else if (acc >= 0.9 && !timeUp) { st.legend = true; s.msgs.push(`👑 ${F.units[s.unit].name} is now LEGENDARY!`); addXP(40); s.xp += 40; }
      else s.msgs.push('Legendary needs 90% within 15 minutes. Have another go!');
      if (acc === 1 && n >= 5) S.stats.perfect++;
    } else if (s.mode === 'case') {
      const prev = S.cases[s.caseId]; S.cases[s.caseId] = { best: Math.max(acc, prev ? prev.best : 0), last: Date.now() };
      if (acc >= 0.7) s.msgs.push('✅ Checkpoint passed!'); addXP(20); s.xp += 20;
    } else { addXP(10); s.xp += 10; }
    const badges = checkBadges(); save();
    tone(SND.done); if (acc >= 0.7) confetti(); buzz(40);
    render(); flushCelebrations(badges);
  }
  function renderSummary() {
    const s = sess, n = s.results.length, c = s.results.filter((r) => r.ok).length, mins = Math.max(1, Math.round((Date.now() - s.start) / 60000));
    const title = s.timeUp ? "⏰ Time's up!" : s.acc === 1 ? 'Perfect!' : s.acc >= 0.8 ? 'Great work!' : s.acc >= 0.6 ? 'Lesson complete!' : 'Keep going!';
    return `<div class="celebrate"><div class="emoji">${s.acc === 1 ? '💯' : s.acc >= 0.7 ? '🎉' : '💪'}</div><div class="h1">${title}</div><p class="muted">${esc(s.title || '')}</p></div>
      <div class="statgrid"><div class="stat" style="border-color:var(--gold)"><div class="v" style="color:var(--gold-d)">+${s.xp}</div><div class="l">XP earned</div></div><div class="stat" style="border-color:var(--green)"><div class="v" style="color:var(--green-d)">${pct(s.acc)}%</div><div class="l">${c}/${n} correct</div></div><div class="stat" style="border-color:var(--brand)"><div class="v" style="color:var(--brand)">${mins}m</div><div class="l">Time</div></div></div>
      ${s.msgs.length ? `<div class="card" style="margin-top:14px">${s.msgs.map((m) => `<div style="font-weight:800;margin:4px 0">${m}</div>`).join('')}</div>` : ''}
      <div class="stack" style="margin-top:18px"><button class="btn green" data-a="endSession">Continue</button>${s.mode === 'lesson' ? `<button class="btn ghost" data-a="startUnit" data-v="${s.unit}">Another lesson</button>` : ''}</div>`;
  }

  // ---------- Mock exam ----------
  let mockTimer;
  function tickMock() {
    clearTimeout(mockTimer);
    const m = S.mock; if (!m) return;
    const left = m.limit - (Date.now() - m.start), el = document.getElementById('mtimer');
    if (left <= 0) { submitMock(true); return; }
    if (el) { el.textContent = mmss(left); el.classList.toggle('low', left < 600000); }
    mockTimer = setTimeout(tickMock, 1000);
  }
  function renderMock() {
    const m = S.mock, q = m.qs[m.i], answered = m.ans.filter((a) => a !== null).length;
    return `<div class="sbar"><button class="x" data-a="mockMenu" aria-label="Menu">☰</button><div style="flex:1"><div class="small muted" style="font-weight:800">${m.full ? 'FULL MOCK' : 'MINI MOCK'} · Q${m.i + 1}/${m.n} · ${answered} answered</div><div class="bar brand" style="height:8px;margin-top:4px"><i style="width:${pct(answered / m.n)}%"></i></div></div><span class="timer" id="mtimer">${mmss(m.limit - (Date.now() - m.start))}</span></div>
      ${qBody(q, m.ans[m.i], null)}
      <div class="tools"><button data-a="calc">🧮 Calculator</button><button data-a="mflag">${m.flag[m.i] ? '⭐ Flagged for review' : '☆ Flag for review'}</button><button data-a="flag">🚩 Report issue</button></div>
      <div class="footer"><div class="footer-in"><div class="grid2"><button class="btn ghost" data-a="mprev" ${m.i === 0 ? 'disabled' : ''}>‹ Back</button>${m.i === m.n - 1 ? '<button class="btn gold" data-a="mockMenu">Review & submit</button>' : '<button class="btn" data-a="mnext">Next ›</button>'}</div></div></div>`;
  }
  function mockMenu() {
    const m = S.mock, un = m.ans.filter((a) => a === null).length;
    sheet = `<div class="h2">Question navigator</div><p class="small muted">Blue = answered · gold outline = flagged</p><div class="qgrid">${m.qs.map((_, i) => `<button class="${m.ans[i] !== null ? 'a' : ''} ${m.flag[i] ? 'f' : ''} ${i === m.i ? 'cur' : ''}" data-a="mgo" data-v="${i}">${i + 1}</button>`).join('')}</div>
      <div class="stack" style="margin-top:18px"><button class="btn gold" data-a="submitMock">Submit exam${un ? ` (${un} unanswered)` : ''}</button><button class="btn ghost" data-a="closeSheet">Keep going</button><button class="link small" style="color:var(--red)" data-a="abandonMock">Abandon mock (no score)</button></div>`;
    render();
  }
  function submitMock(timeUp) {
    const m = S.mock; if (!m) return; clearTimeout(mockTimer);
    let correct = 0; const byUnit = {};
    m.qs.forEach((q, i) => { const ok = m.ans[i] === q.ans; if (ok) correct++; record(q, ok); const b = byUnit[q.unit] || (byUnit[q.unit] = { n: 0, c: 0 }); b.n++; if (ok) b.c++; });
    const score = correct / m.n, mins = Math.round(Math.min(m.limit, Date.now() - m.start) / 60000);
    S.mocks.push({ t: Date.now(), full: m.full, n: m.n, correct, score, mins, byUnit });
    const xp = correct * 3 + (score >= 0.7 ? 50 : 0); addXP(xp);
    review = { m, score, correct, byUnit, mins, xp, timeUp: !!timeUp, i: null };
    S.mock = null; sheet = null;
    const badges = checkBadges(); save();
    tone(SND.done); if (score >= 0.7) confetti(); window.scrollTo(0, 0); render(); flushCelebrations(badges);
  }
  function renderReview() {
    const r = review, m = r.m;
    if (r.i !== null) {
      const q = m.qs[r.i], chosen = m.ans[r.i];
      return `<div class="sbar"><button class="x" data-a="revBack">‹</button><div style="flex:1;font-weight:800">Question ${r.i + 1} of ${m.n}</div></div>${qBody(q, chosen, 'checked')}
        <div class="card" style="margin-top:14px;border-color:${chosen === q.ans ? 'var(--green)' : 'var(--red)'}"><b>${chosen === null ? 'Not answered' : chosen === q.ans ? 'Correct' : 'Incorrect'}</b><p class="small" style="margin-bottom:0">${esc(q.exp)}</p></div>
        <div class="tools"><button data-a="flag">🚩 Report issue</button></div>
        <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-a="revGo" data-v="${r.i - 1}" ${r.i === 0 ? 'disabled' : ''}>‹ Prev</button><button class="btn ghost" data-a="revGo" data-v="${r.i + 1}" ${r.i === m.n - 1 ? 'disabled' : ''}>Next ›</button></div>`;
    }
    const pass = r.score >= 0.7, units = Object.entries(r.byUnit).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n);
    return `<div class="celebrate"><div class="emoji">${pass ? '🎉' : '📈'}</div><div class="h1">${r.timeUp ? "Time's up · " : ''}${pct(r.score)}%</div><p class="muted" style="margin:0">${r.correct}/${m.n} correct · ${pass ? '<b style="color:var(--green-d)">PASS</b> (70%+)' : '<b style="color:var(--red-d)">Below the 70% pass mark</b>'} · ${r.mins} min · +${r.xp} XP</p></div>
      <div class="card"><div class="h2">By unit (weakest first)</div>${units.map(([u, b]) => `<div style="margin:10px 0"><div class="row small"><b>${esc(F.units[u].name)}</b><span>${b.c}/${b.n}</span></div><div class="bar" style="height:8px"><i style="width:${pct(b.c / b.n)}%;background:${b.c / b.n >= 0.7 ? 'var(--green)' : 'var(--red)'}"></i></div></div>`).join('')}</div>
      <div class="card"><div class="h2">Review answers</div><div class="qgrid">${m.qs.map((q, i) => `<button class="${m.ans[i] === q.ans ? 'r' : 'w'}" data-a="revGo" data-v="${i}">${i + 1}</button>`).join('')}</div></div>
      <div class="stack"><button class="btn green" data-a="revDone">Done</button><button class="btn ghost" data-a="revWeak">Practice my weakest units</button></div>`;
  }

  // ---------- sheets: flag, calculator, onboarding ----------
  let flagReason = null;
  function flagSheet() {
    const reasons = ['Answer key looks wrong', 'Confusing wording', 'Explanation unclear', 'Too easy', 'Too hard', 'Typo / formatting'];
    sheet = `<div class="h2">🚩 Flag this question</div><p class="small muted" style="margin-top:0">Saved to Profile → Beta feedback so you can send it back for fixes.</p>
      <div class="seg">${reasons.map((r) => `<button class="${flagReason === r ? 'on' : ''}" data-a="flagReason" data-v="${esc(r)}" style="flex:1 1 45%">${esc(r)}</button>`).join('')}</div>
      <textarea id="flagNote" rows="3" placeholder="Optional note: what's off?" style="margin-top:12px"></textarea>
      <div class="stack" style="margin-top:12px"><button class="btn" data-a="saveFlag" ${flagReason ? '' : 'disabled'}>Save flag</button><button class="btn ghost" data-a="closeSheet">Cancel</button></div>`;
    render();
  }
  function currentQ() { if (review && review.i !== null) return { q: review.m.qs[review.i], chosen: review.m.ans[review.i] }; if (S.mock) return { q: S.mock.qs[S.mock.i], chosen: S.mock.ans[S.mock.i] }; if (sess && sess.cur) return { q: sess.cur, chosen: sess.sel }; return null; }
  function calcSheet() {
    let res = ''; try { if (calcExpr && /^[0-9+\-*/().%^\s]+$/.test(calcExpr)) { const v = Function('"use strict";return (' + calcExpr.replace(/\^/g, '**').replace(/(\d+(?:\.\d+)?)%/g, '($1/100)') + ')')(); if (isFinite(v)) res = '= ' + (+v.toFixed(8)).toLocaleString('en-US', { maximumFractionDigits: 6 }); } } catch (e) { res = ''; }
    const k = ['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '^', '⌫', '%', '='];
    sheet = `<div class="row"><div class="h2">Calculator</div><button class="link" data-a="closeSheet">Done</button></div><div class="card" style="margin:6px 0 12px;padding:8px"><div class="small muted" style="text-align:right;min-height:20px;word-break:break-all">${esc(calcExpr) || '&nbsp;'}</div><div class="calc-display">${esc(res) || '0'}</div></div>
      <div class="keys">${k.map((x) => `<button class="${'/*-+^%('.includes(x) || x === ')' ? 'op' : ''} ${x === '=' ? 'eq' : ''}" data-a="key" data-v="${esc(x)}" ${x === '=' ? 'style="grid-column:span 2"' : ''}>${x === '*' ? '×' : x === '/' ? '÷' : esc(x)}</button>`).join('')}</div>
      <p class="tiny muted">Tip: 1.08^5 for powers · 25% = 0.25. On the real exam, use Excel.</p>`;
    render();
  }
  function onboarding() {
    sheet = `<div class="celebrate" style="padding:6px 0"><div class="emoji">📈</div><div class="h1">Welcome to FMVA Trainer</div><p class="muted">Bite-size lessons across all 15 core courses, real calculations with fresh numbers every time, Excel case studies and full mock exams.</p></div>
      <div class="small muted" style="font-weight:800;margin:6px 0">PICK A DAILY GOAL</div><div class="seg">${[[30, 'Casual', '~10 min'], [50, 'Regular', '~15 min'], [100, 'Serious', '~30 min'], [150, 'Intense', '~45 min']].map(([g, n, t]) => `<button class="${S.settings.goal === g ? 'on' : ''}" data-a="goal" data-v="${g}">${n}<br><span class="tiny">${t}</span></button>`).join('')}</div>
      <div class="small muted" style="font-weight:800;margin:14px 0 6px">EXAM DATE (OPTIONAL)</div><input type="date" id="examDate" value="${esc(S.settings.examDate)}" data-change="examDate">
      <button class="btn green" style="margin-top:18px" data-a="onboardDone">Let's go</button>`;
  }

  // ================= actions =================
  const A = {
    tab: (v) => { view.tab = v; view.note = null; sheet = null; window.scrollTo(0, 0); render(); },
    closeSheet: () => { sheet = null; if (!S.onboarded) { S.onboarded = true; save(); } render(); },
    unitSheet: (v) => { sheet = unitSheet(v); render(); },
    caseSheet: (v) => { sheet = caseSheet(v); render(); },
    openNote: (v) => { view.tab = 'notes'; view.note = v; sheet = null; window.scrollTo(0, 0); render(); },
    noteBack: () => { view.note = null; render(); },
    startUnit: (v) => startSession('lesson', buildLesson(v), { unit: v, title: F.units[v].name + ' · Level ' + (unitState(v).level + 1) }),
    legend: (v) => startSession('legend', buildLesson(v, { n: 10, legend: true }), { unit: v, title: '👑 Legendary: ' + F.units[v].name, timeLimit: 15 * 60000 }),
    smart: () => startSession('practice', buildSmart(10), { title: 'Smart practice' }),
    mistakes: () => startSession('review', mistakeIds().slice(0, 10), { title: 'Mistake review' }),
    sprint: () => { const ids = shuffle(Object.keys(F.gens)).slice(0, 10).map((g) => 'g:' + g); startSession('sprint', ids, { title: 'Calc sprint', timeLimit: 20 * 60000 }); },
    startCase: (v) => startSession('case', caseIdx[v].questions.map((q) => q.id), { caseId: v, title: caseIdx[v].name }),
    sel: (v) => { if (S.mock) { S.mock.ans[S.mock.i] = +v; save(); render(); return; } if (sess && !sess.checked) { sess.sel = +v; render(); } },
    check, next,
    quit: () => { sheet = `<div class="h2">Quit this session?</div><p class="muted">Answers so far are saved to your stats, but you won't get completion XP.</p><div class="stack"><button class="btn red" data-a="confirmQuit">Quit</button><button class="btn ghost" data-a="closeSheet">Keep learning</button></div>`; render(); },
    confirmQuit: () => { sess = null; sheet = null; flushCelebrations(); render(); },
    endSession: () => { const s = sess; sess = null; if (s && s.mode === 'case') view.tab = 'practice'; render(); },
    startMock: (v) => { if (S.mock) { render(); return; } S.mock = buildMock(v === 'full'); save(); window.scrollTo(0, 0); render(); },
    mnext: () => { S.mock.i = Math.min(S.mock.n - 1, S.mock.i + 1); save(); window.scrollTo(0, 0); render(); },
    mprev: () => { S.mock.i = Math.max(0, S.mock.i - 1); save(); window.scrollTo(0, 0); render(); },
    mgo: (v) => { S.mock.i = +v; sheet = null; save(); window.scrollTo(0, 0); render(); },
    mflag: () => { S.mock.flag[S.mock.i] = !S.mock.flag[S.mock.i]; save(); render(); },
    mockMenu,
    submitMock: () => submitMock(false),
    abandonMock: () => { S.mock = null; sheet = null; clearTimeout(mockTimer); save(); render(); },
    revGo: (v) => { review.i = +v; window.scrollTo(0, 0); render(); },
    revBack: () => { review.i = null; render(); },
    revDone: () => { review = null; view.tab = 'exam'; render(); },
    revWeak: () => { const weak = Object.entries(review.byUnit).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n).slice(0, 3).map(([u]) => u); review = null; const ids = []; weak.forEach((u) => ids.push(...buildLesson(u, { n: 4 }))); startSession('practice', shuffle(ids), { title: 'Weakest units drill' }); },
    flag: () => { flagReason = null; flagSheet(); },
    flagReason: (v) => { flagReason = v; const note = document.getElementById('flagNote'); const keep = note ? note.value : ''; flagSheet(); const n2 = document.getElementById('flagNote'); if (n2) n2.value = keep; },
    saveFlag: () => {
      const c = currentQ(); if (!c) return; const note = (document.getElementById('flagNote') || {}).value || '';
      S.flags.push({ t: Date.now(), id: c.q.key || c.q.id, gen: c.q.gen || null, reason: flagReason, note, q: c.q.q, opts: c.q.opts, key: c.q.opts[c.q.ans], chosen: c.chosen === null || c.chosen === undefined ? null : c.q.opts[c.chosen] });
      save(); sheet = null; render(); toast('🚩 Flag saved. Thanks, beta tester!');
    },
    calc: () => calcSheet(),
    key: (v) => { if (v === 'C') calcExpr = ''; else if (v === '⌫') calcExpr = calcExpr.slice(0, -1); else if (v === '=') { const m = (sheet.match(/calc-display">= ([^<]+)/) || [])[1]; if (m) calcExpr = m.replace(/,/g, ''); } else calcExpr += v; calcSheet(); },
    goal: (v) => { S.settings.goal = +v; save(); if (!S.onboarded) onboarding(); render(); },
    toggle: (v) => { S.settings[v] = !S.settings[v]; save(); render(); },
    onboardDone: () => { S.onboarded = true; sheet = null; save(); render(); },
    copyFlags: async () => {
      const txt = `FMVA Trainer v${VERSION} — beta feedback (${S.flags.length} flags)\n\n` + S.flags.map((f, i) => `#${i + 1} [${f.id}${f.gen ? ' generator:' + f.gen : ''}] ${f.reason}${f.note ? ' — "' + f.note + '"' : ''}\nQ: ${f.q}\nOptions: ${f.opts.join(' | ')}\nAnswer key: ${f.key}${f.chosen ? '\nI chose: ' + f.chosen : ''}`).join('\n\n');
      try { await navigator.clipboard.writeText(txt); toast('📋 Copied. Paste it into your chat with Claude'); }
      catch (e) { if (navigator.share) navigator.share({ text: txt }).catch(() => {}); else { sheet = `<div class="h2">Copy this</div><textarea rows="12">${esc(txt)}</textarea><button class="btn ghost" style="margin-top:10px" data-a="closeSheet">Close</button>`; render(); } }
    },
    clearFlags: () => { if (confirm('Clear all flagged questions?')) { S.flags = []; save(); render(); } },
    export: () => { const b = new Blob([JSON.stringify(S)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `fmva-trainer-backup-${dayKey()}.json`; document.body.appendChild(a); a.click(); a.remove(); },
    import: () => document.getElementById('importFile').click(),
    reset: () => { if (confirm('Reset ALL progress, XP, streaks and badges? This cannot be undone.')) { S = fresh(); S.onboarded = true; save(); render(); toast('Progress reset'); } },
  };
  const CHANGE = {
    examDate: (el) => { S.settings.examDate = el.value; save(); },
    importFile: (el) => { const f = el.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const s = JSON.parse(r.result); if (s.v !== 2) throw 0; localStorage.setItem(KEY, JSON.stringify(s)); S = load(); render(); toast('✅ Backup restored'); } catch (e) { toast('That file is not a valid FMVA Trainer backup'); } }; r.readAsText(f); },
  };
  document.addEventListener('click', (e) => { const el = e.target.closest('[data-a]'); if (!el || el.disabled) return; const fn = A[el.dataset.a]; if (fn) { e.preventDefault(); fn(el.dataset.v, el); } });
  document.addEventListener('change', (e) => { const el = e.target.closest('[data-change]'); if (el && CHANGE[el.dataset.change]) CHANGE[el.dataset.change](el); });
  document.addEventListener('keydown', (e) => {
    if (sheet || e.target.closest('input,textarea')) return;
    const k = e.key.toLowerCase();
    if (S.mock && !review) { if ('abcd'.includes(k) && k.length === 1) A.sel('abcd'.indexOf(k)); else if (e.key === 'ArrowRight') A.mnext(); else if (e.key === 'ArrowLeft') A.mprev(); return; }
    if (sess && !sess.done) { if ('abcd1234'.includes(k) && k.length === 1 && !sess.checked) A.sel('abcd1234'.indexOf(k) % 4); else if (e.key === 'Enter') sess.checked ? next() : check(); }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkStreak(); if (!sess && !S.mock && !review) render(); } });

  // ================= boot =================
  checkStreak();
  if (!S.onboarded) onboarding();
  render();
  flushCelebrations();
  window.__FMVA_TEST__ = { get S() { return S; }, get sess() { return sess; }, checkStreak, addXP, A, buildLesson, buildSmart, buildMock, getQ, readiness };

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('./sw.js').catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) toast('✨ App updated. Pull to refresh or reopen to load the new version', 5000); });
  }
})();
