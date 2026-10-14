/* 指定联络人 · 课堂原型（非汇丰官方）
   长者端（嵌入银行 App）＋ 联络人端（短讯收件箱）＋ 测试模式（记录、问卷、提交） */
(() => {
  'use strict';

  const CFG = window.TC_CONFIG || {};
  const app = document.getElementById('app');
  const BAL = 386520;
  const STORE_KEY = 'tc_sessions_v1';

  // ---------- 小工具 ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => 'HKD ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pad2 = (x) => String(x).padStart(2, '0');
  const later = () => { const d = new Date(Date.now() + 864e5); return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
  const makeRef = (p) => p + String(Date.now()).slice(-9);
  const mask = (p) => { p = String(p || ''); return p.length < 6 ? p : p.slice(0, 4) + ' ••' + p.slice(-2); };
  const lastChar = (s) => String(s || '').slice(-1);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };

  // ---------- 图标 ----------
  const P = {
    back: '<path d="M15 18l-6-6 6-6"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    cross: '<path d="M6 6l12 12M18 6L6 18"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    pause: '<path d="M9 6v12M15 6v12"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    home: '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
    transfer: '<path d="M7 7h13l-4-4M17 17H4l4 4"/>',
    sliders: '<path d="M4 7h8M16 7h4M14 5v4M4 17h4M12 17h8M10 15v4"/>',
    bill: '<path d="M5 4h14v16l-3-2-2 2-2-2-2 2-2-2-3 2zM9 9h6M9 13h6"/>',
    receive: '<path d="M12 4v12M6 10l6 6 6-6M5 20h14"/>',
    more: '<path d="M5 12h.01M12 12h.01M19 12h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    lock: '<path d="M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3"/>',
    finger: '<path d="M12 11c0 3 0 6-1.5 9M8.5 7.5A5 5 0 0 1 17 11c0 2 0 4-.5 6M6 10a6.5 6.5 0 0 1 .8-3M7 14c0 2-.3 3.6-1 5M15 13.5c0 2.5-.3 4.5-1 6.5M12 7a4 4 0 0 0-4 4v1M4.5 5.5A9.5 9.5 0 0 1 19.5 8"/>',
    bank: '<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'
  };
  const icon = (name, size, sw, style) => `<svg aria-hidden="true" width="${size || 20}" height="${size || 20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw || 2}" stroke-linecap="round" stroke-linejoin="round"${style ? ` style="${style}"` : ''}>${P[name]}</svg>`;
  const chev = () => icon('chev', 18, 2, 'flex:none;color:#8C96A3');

  // ---------- 小组件 ----------
  const kv = (k, v) => `<div class="kv"><span>${k}</span><span>${v}</span></div>`;
  const info = (html) => `<div class="info">${icon('info', 20)}<div class="stack">${html}</div></div>`;
  const warn = (html) => `<div class="warn">${icon('alert', 22)}<div class="stack">${html}</div></div>`;
  const okbox = (html) => `<div class="okbox">${icon('shield', 22)}<div class="stack">${html}</div></div>`;
  const sec = (t) => `<div class="sec">${t}</div>`;
  const okCircle = () => `<div class="circle ok">${icon('check', 32, 2.6)}</div>`;
  const chipList = (list, current, act, prefix, multi) => `<div class="chips">${list.map((v) => {
    const on = multi ? (current || []).indexOf(v) >= 0 : current === v;
    return `<button class="chip" aria-pressed="${on}" data-act="${act}" data-arg="${esc(prefix + '|' + v)}">${esc(v)}</button>`;
  }).join('')}</div>`;
  const li = (ic, color, text) => `<div class="li">${icon(ic, 20, 2.4, 'color:' + color)}<span>${text}</span></div>`;

  // ---------- 内容 ----------
  const SCEN = [
    { key: 'amount', title: '超过你设定的金额', sub: '交易先停 24 小时，并通知他', effect: '超过金额的交易不会再暂停' },
    { key: 'staff', title: '职员担心有骗局时', sub: '除了和你确认，也会打给他', effect: '职员担心有骗局时，只会和你本人确认' },
    { key: 'safe', title: '申请解锁智安存时', sub: '让他知道有人申请解锁', effect: '申请解锁智安存时，不会通知你的联络人' },
    { key: 'reach', title: '银行长时间联络不上你', sub: '只请他转告你联系银行，不会说你的户口资料', effect: '银行联络不上你时，不会请联络人转告' }
  ];
  const findScen = (k) => SCEN.find((x) => x.key === k) || { title: '', effect: '' };
  const REL = ['子女', '配偶', '兄弟姐妹', '朋友', '社工', '其他'];
  const BASE_TX = [
    { name: '转账收入 · 陈家明', date: '10月12日', amount: '+HKD 2,000.00' },
    { name: '超级市场', date: '10月11日', amount: '-HKD 312.50' },
    { name: '电费', date: '10月9日', amount: '-HKD 486.00' }
  ];
  const SCREEN_NAMES = {
    home: '首页', transfer: '转账', transferReview: '确认转账', pause: '交易暂停', transferDone: '转账成功', cancelled: '已取消交易',
    branch: '到分行核实', messages: '讯息', settings: '设定', security: '户口保安', moneySafe: '智安存', moneySafeDone: '智安存已申请',
    tcIntro: '介绍', tcContact: '第1步 联络人', tcScenarios: '第2步 什么时候通知', tcAmount: '设定金额', tcReview: '第3步 确认',
    tcDone: '完成', sim1: '模拟1', sim2: '模拟2', sim3: '模拟3', tcManage: '管理页', tcContactDetail: '联络人资料',
    tcEditAmount: '修改金额', tcAddSecondary: '新增副联络人'
  };
  const SETUP_SCREENS = ['tcIntro', 'tcContact', 'tcScenarios', 'tcAmount', 'tcReview'];

  const Q_ELDER = [
    { id: 'a1', tag: 'A', q: '联络人可以看你的余额吗？', type: 'one', opts: ['可以', '不可以', '不知道'] },
    { id: 'a2', tag: 'A', q: '联络人可以替你批准或拒绝转账吗？', type: 'one', opts: ['可以', '不可以', '不知道'] },
    { id: 'b1', tag: 'B', q: '如果银行真的推出这个服务，你会开吗？', type: 'one', opts: ['一定会', '可能会', '说不定', '可能不会', '一定不会'] },
    { id: 'e1', tag: '', q: '整体来说，容不容易用？', type: 'one', opts: ['很容易', '容易', '一般', '难', '很难'] },
    { id: 'p1', tag: '', q: '看到「这笔交易先停一停」，你怎么想？（记下原话）', type: 'text' },
    { id: 'w1', tag: '', q: '你最不喜欢哪里？', type: 'text' },
    { id: 'n1', tag: '', q: '主持人备注（卡住的地方、看不懂的字等）', type: 'text' }
  ];
  const Q_CONTACT = [
    { id: 'd0', tag: 'D', q: '请他指出哪一条是真的银行通知', type: 'one', opts: ['#HSBC（正确）', '+852 6000 4410（诈骗）', '+852 6000 1827（诈骗）', '其他', '认不出'] },
    { id: 'd1', tag: 'D', q: '收到汇丰那条短讯，你会怎么做？（可多选）', type: 'multi', opts: ['亲自打给家人（长者）', '打通讯录里的银行官方热线', '回复或点链接', '不理会', '其他'] },
    { id: 'd2', tag: '', q: '看了事后指引短讯，你会怎么做？（记下原话）', type: 'text' },
    { id: 'w1', tag: '', q: '你最不喜欢哪里？', type: 'text' },
    { id: 'n1', tag: '', q: '主持人备注', type: 'text' }
  ];

  // ---------- 状态 ----------
  let mode = 'start';           // start | elder | contact | survey | submitted
  let S = null;                 // 银行 App 状态（长者端）
  let C = null;                 // 短讯 App 状态（联络人端）
  const T = { big: false, callOutcome: '不接听', afterGuide: false };
  let session = null;
  let panelOpen = false;
  let lastKey = '';
  let callTimer = null;
  let acceptTimer = null;
  let lastRecord = null;
  let submitStatus = '';
  const startForm = { participant: '', role: '长者', age: '65–74 岁' };

  const freshS = () => ({
    screen: 'home', introFrom: 'security', simFrom: 'tcDone', bannerOpen: true,
    c1name: '陈家明', c1rel: '子女', c1phone: '5000 0101', c1accepted: false,
    showC2: true, c2name: '李美玲', c2rel: '朋友', c2phone: '5000 0202', c2accepted: false,
    s2name: '李美玲', s2rel: '朋友', s2phone: '5000 0202',
    single: 10000, daily: 30000,
    scen: { amount: true, staff: true, safe: true, reach: true },
    termsOk: false, setupDone: false, setupRef: '',
    amountText: '', noteText: '', reviewAmount: 0, spent: 0,
    txs: [], paused: null, lastTx: null, cancelledTx: null,
    pending: [], nextId: 1, notice: '', formError: '',
    adjSingle: 10000, adjDaily: 30000,
    sheet: '', afterVerify: '', reduceKind: '', reduceWho: 'c1', detailWho: 'c1',
    callState: '', callTarget: '',
    messages: [{ title: '电子结单已备妥', body: '你 9 月的综合户口结单已可查看。', time: '10月3日' }],
    unread: 0
  });
  const freshC = () => ({ open: null, read: { dad: true, mart: true, tele: true }, openAt: 0 });

  // ---------- 记录 ----------
  const secs = () => (session ? Math.round((Date.now() - session.t0) / 100) / 10 : 0);
  const ev = (e, v) => { if (session) session.events.push({ t: secs(), e: e, v: v == null ? '' : String(v) }); };
  const savedSessions = () => store.get(STORE_KEY, []);
  // 编号 = 这台手机的代号（第一次打开时随机生成，之后固定）+ 这台手机的场次。
  // 例如 KQT-03。不同手机代号不同，所以不会撞号；场次计数在清除记录后也不会重来。
  const DEVICE_KEY = 'tc_device_v1';
  const COUNTER_KEY = 'tc_counter_v1';
  let volatileDevice = '';
  function deviceCode() {
    let code = store.get(DEVICE_KEY, '');
    if (code) return code;
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    code = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    if (!store.set(DEVICE_KEY, code)) { volatileDevice = volatileDevice || code; return volatileDevice; }
    return code;
  }
  function nextParticipantId() {
    const n = Number(store.get(COUNTER_KEY, 0)) + 1;
    return deviceCode() + '-' + pad2(n);
  }
  function commitParticipantId() {
    const n = Number(store.get(COUNTER_KEY, 0)) + 1;
    store.set(COUNTER_KEY, n);
  }

  function newSession() {
    session = {
      participant: startForm.participant.trim(), role: startForm.role, age: startForm.age,
      startedAt: new Date().toISOString(), t0: Date.now(), events: [], answers: {}, afterGuideShown: false,
      m: {
        introAt: null, notNow: 0, setupStartAt: null, setupDoneAt: null, lastSetup: '', scenOff: [], amount: '', c1rel: '', addedC2: false,
        simMax: 0, pauseAt: null, pauseFirst: '', pauseFirstSec: null, opens: [], hsbcDwell: 0
      }
    };
  }

  // ---------- 长者端：导航和业务 ----------
  function nav(screen, extra) {
    const prev = S.screen;
    Object.assign(S, { screen: screen, notice: '', formError: '', sheet: '' }, extra || {});
    if (screen === 'messages') S.unread = 0;
    if (prev !== screen) { ev('screen', SCREEN_NAMES[screen] || screen); onScreen(screen); }
    render();
  }
  function onScreen(screen) {
    const m = session.m;
    if (screen === 'tcIntro' && m.introAt == null) m.introAt = secs();
    if (screen === 'tcContact' && m.setupStartAt == null) m.setupStartAt = secs();
    if (SETUP_SCREENS.indexOf(screen) >= 0 && !S.setupDone) m.lastSetup = SCREEN_NAMES[screen];
    if (/^sim[123]$/.test(screen)) m.simMax = Math.max(m.simMax, Number(screen.slice(3)));
    if (screen === 'pause' && m.pauseAt == null) m.pauseAt = secs();
  }
  function msg(title, body) {
    S.messages = [{ title: title, body: body, time: '刚刚' }].concat(S.messages);
    S.unread += 1;
  }
  function pauseFirst(label) {
    const m = session.m;
    if (!m.pauseFirst && m.pauseAt != null) { m.pauseFirst = label; m.pauseFirstSec = Math.round((secs() - m.pauseAt) * 10) / 10; }
    ev('tap', label);
  }
  const parsedAmount = () => parseFloat(String(S.amountText).replace(/[^0-9.]/g, '')) || 0;
  const relLabel = (n, r) => esc(n) + (r ? '（' + esc(r) + '）' : '');
  const chipStatus = (accepted) => (accepted ? '<span class="tag ok">已生效</span>' : '<span class="tag wait">等待确认</span>');

  function clampTh(single, daily, which) {
    single = Math.max(5000, Math.min(500000, single));
    daily = Math.max(10000, Math.min(1000000, daily));
    if (daily < single) { if (which === 'single') daily = single; else single = daily; }
    return { single: single, daily: daily };
  }
  function verify(action) { S.sheet = 'verify'; S.afterVerify = action; ev('sheet', '确认本人：' + action); render(); }
  function scheduleAccept() {
    clearTimeout(acceptTimer);
    acceptTimer = setTimeout(() => {
      if (!S) return;
      const names = [];
      if (S.c1name && !S.c1accepted) { S.c1accepted = true; names.push(S.c1name); }
      if (S.c2name && !S.c2accepted) { S.c2accepted = true; names.push(S.c2name); }
      if (!names.length) return;
      msg(names.join('、') + ' 已确认', names.join('、') + ' 已致电汇丰官方热线，确认成为你的指定联络人。');
      if (mode === 'elder') render();
    }, 6000);
  }
  function finishSetup() {
    const keepC2 = S.showC2 && !!S.c2name.trim();
    if (!keepC2) { S.c2name = ''; S.c2rel = ''; S.c2phone = ''; }
    Object.assign(S, { setupDone: true, setupRef: makeRef('TC'), c1accepted: false, c2accepted: false, bannerOpen: false, afterVerify: '' });
    const m = session.m;
    m.setupDoneAt = secs();
    m.scenOff = SCEN.filter((sc) => !S.scen[sc.key]).map((sc) => sc.title);
    m.amount = (S.single === 10000 && S.daily === 30000) ? '接受建议（单笔 10,000 / 每日 30,000）' : '改为 单笔 ' + S.single.toLocaleString('en-US') + ' / 每日 ' + S.daily.toLocaleString('en-US');
    m.c1rel = S.c1rel;
    m.addedC2 = keepC2;
    ev('setup-done', '关掉：' + (m.scenOff.join('、') || '没有'));
    msg('指定联络人：邀请已发出', '我们已发短讯邀请 ' + S.c1name + (keepC2 ? ' 和 ' + S.c2name : '') + '。对方致电汇丰官方热线确认后生效。');
    nav('tcDone');
    scheduleAccept();
  }
  function submitTransfer() {
    const amt = S.reviewAmount;
    const over = S.setupDone && S.scen.amount && (amt > S.single || S.spent + amt > S.daily);
    ev('transfer', money(amt) + (over ? '（触发暂停）' : '（直接转出）'));
    S.afterVerify = '';
    if (over) {
      S.paused = { amount: amt, until: later(), ref: makeRef('TR') };
      S.amountText = ''; S.noteText = '';
      msg('一笔转账已暂停', money(amt) + ' 转给黄志伟，暂停至 ' + S.paused.until + '。我们已通知 ' + S.c1name + '。');
      nav('pause');
    } else {
      S.spent += amt;
      S.lastTx = { amount: amt, ref: makeRef('TR') };
      S.txs = [{ name: '转账 · 黄志伟', date: '今天', amount: '-' + money(amt) }].concat(S.txs);
      S.amountText = ''; S.noteText = '';
      msg('转账成功', money(amt) + ' 已转给黄志伟。');
      nav('transferDone');
    }
  }
  function confirmCancel() {
    if (!S.paused) { S.sheet = ''; render(); return; }
    ev('cancel-confirm', money(S.paused.amount));
    S.cancelledTx = S.paused; S.paused = null;
    msg('转账已取消', money(S.cancelledTx.amount) + ' 没有转出，仍在你的户口里。');
    nav('cancelled');
  }
  function unlockSafe() {
    const notify = S.setupDone && S.scen.safe;
    ev('unlock', notify ? '已通知联络人' : '没有通知联络人');
    S.afterVerify = '';
    msg('已收到智安存解锁申请', notify ? '我们已通知 ' + S.c1name + '：有人申请解锁你的智安存。' : '我们会按智安存的程序处理。');
    nav('moneySafeDone');
  }
  const reduceLabel = (kind) => {
    if (kind === 'raise') return '调高金额';
    if (kind === 'replace') return '更换联络人';
    if (kind === 'remove') return '取消联络人';
    if (kind && kind.indexOf('off:') === 0) return '关掉「' + findScen(kind.slice(4)).title + '」';
    return kind;
  };
  function reduceText(kind, who) {
    if (kind === 'replace') return { title: '更换联络人', body: '更换联络人会减少保护，要验证身份，24 小时后才生效。我们会通知 ' + who + '，新联络人也要致电汇丰官方热线重新确认。' };
    if (kind === 'remove') return { title: '取消联络人', body: '取消联络人会减少保护，要验证身份，24 小时后才生效，我们也会通知 ' + who + '。' };
    if (kind && kind.indexOf('off:') === 0) { const sc = findScen(kind.slice(4)); return { title: '关掉「' + sc.title + '」', body: '关掉后，' + sc.effect + '。这会减少保护，要验证身份，24 小时后才生效，并会通知 ' + who + '。' }; }
    return { title: '', body: '' };
  }
  function openReduce(kind, who) { S.reduceKind = kind; S.reduceWho = who || 'c1'; S.sheet = 'reduce'; ev('reduce-open', reduceLabel(kind)); render(); }
  function submitReduce() {
    const who = S.reduceWho === 'c2' ? S.c2name : S.c1name;
    const text = S.reduceKind === 'raise'
      ? '调高金额到 单笔 ' + money(S.adjSingle) + '、每日 ' + money(S.adjDaily)
      : (S.reduceKind === 'replace' ? '更换联络人 ' + who : S.reduceKind === 'remove' ? '取消联络人 ' + who : reduceLabel(S.reduceKind));
    const until = later();
    ev('reduce-submit', reduceLabel(S.reduceKind));
    S.pending = S.pending.concat([{ id: S.nextId, text: text, until: until, notify: who }]);
    S.nextId += 1;
    S.afterVerify = '';
    msg('设定改动等待生效', text + '，' + until + ' 生效。');
    nav('tcManage', { notice: '已提交。' + until + ' 生效，我们已通知 ' + who + '。' });
  }
  function confirmEdit() {
    const raise = S.adjSingle > S.single || S.adjDaily > S.daily;
    if (raise) { S.reduceKind = 'raise'; S.reduceWho = 'c1'; ev('reduce-open', '调高金额'); verify('submitReduce'); return; }
    S.single = S.adjSingle; S.daily = S.adjDaily;
    ev('lower', '单笔 ' + S.single + ' / 每日 ' + S.daily);
    msg('设定已更新', '金额已调低到 单笔 ' + money(S.single) + '、每日 ' + money(S.daily) + '。');
    nav('tcManage', { notice: '已调低金额，马上生效。' });
  }
  function inviteSecondary() {
    if (!S.s2name.trim() || !S.s2phone.trim()) { S.formError = '请填写姓名和手机号码。'; render(); return; }
    const name = S.s2name.trim();
    Object.assign(S, { c2name: name, c2rel: S.s2rel, c2phone: S.s2phone.trim(), c2accepted: false });
    ev('add-secondary', name);
    msg('指定联络人：邀请已发出', '我们已发短讯邀请 ' + name + '。');
    nav('tcManage', { notice: '已邀请 ' + name + ' 做副联络人，马上生效。对方致电确认后会开始收到通知。' });
    scheduleAccept();
  }
  function switchScen(key) {
    if (S.scen[key]) { openReduce('off:' + key, 'c1'); return; }
    S.scen = Object.assign({}, S.scen, { [key]: true });
    ev('scen-on', findScen(key).title);
    msg('设定已更新', '已打开「' + findScen(key).title + '」。');
    S.notice = '已打开「' + findScen(key).title + '」，马上生效。';
    render();
  }
  function startCall(name) {
    clearTimeout(callTimer);
    ev('call', name);
    S.sheet = ''; S.callState = 'dialing'; S.callTarget = name;
    render();
    callTimer = setTimeout(() => {
      if (!S || S.callState !== 'dialing') return;
      S.callState = T.callOutcome === '接通' ? 'connected' : 'noAnswer';
      ev('call-result', name + '：' + (S.callState === 'connected' ? '接通' : '没人接'));
      if (mode === 'elder') render();
    }, 2600);
  }
  function seedReady() {
    Object.assign(S, { setupDone: true, c1accepted: true, c2accepted: !!S.c2name, termsOk: true, bannerOpen: false, setupRef: S.setupRef || 'TC261014038' });
  }

  // ---------- 长者端：画面 ----------
  const V = {};

  V.home = () => {
    const recent = S.txs.concat(BASE_TX).slice(0, 4).map((t) => `<div class="tx"><div class="grow"><div>${esc(t.name)}</div><div class="small muted">${t.date}</div></div><div class="b">${t.amount}</div></div>`).join('');
    const paused = S.paused ? `<button class="paused" data-act="toPause">${icon('pause', 24, 2.4)}<span class="grow"><span class="blk b">1 笔转账暂停中</span><span class="blk mid">${money(S.paused.amount)} · 至 ${S.paused.until}</span></span>${icon('chev', 20)}</button>` : '';
    const banner = (!S.setupDone && S.bannerOpen) ? `<div class="banner">
<div style="display:flex;gap:12px;align-items:flex-start;padding-right:32px"><div class="tile">${icon('shield', 22)}</div><div class="stack" style="gap:4px"><div class="small b" style="color:var(--accent)">新功能 · 指定联络人</div><div class="b" style="line-height:1.4">遇到可疑交易，让信任的人帮你一把</div><div class="mid ink2">他只会收到提醒，不能看你的户口，也不能动你的钱。</div></div></div>
<button class="btn s" style="min-height:48px;font-size:1em;margin-top:4px" data-act="introFromHome">了解一下</button>
<button class="iconbtn x" aria-label="关闭" data-act="closeBanner">${icon('cross', 18, 2.2)}</button></div>` : '';
    return { tab: 'home', body: `<div class="pad" style="padding-top:16px">
<div class="hello"><div class="avatar">陈</div><div class="grow"><div class="small muted">早晨</div><div class="b" style="font-size:1.125em">陈国强</div></div><button class="iconbtn" aria-label="讯息" data-act="tab" data-arg="messages">${icon('bell', 24)}${S.unread ? '<span class="dot"></span>' : ''}</button></div>
<div class="balance"><div class="small">综合户口 · 储蓄</div><div class="small">123-456789-833</div><div class="amt">${money(BAL - S.spent)}</div><div class="small">可用结余</div></div>
<div class="quick"><button class="q" data-act="tab" data-arg="transfer"><span>${icon('transfer', 22)}</span>转账</button><div class="q"><span>${icon('bill', 22)}</span>缴费</div><div class="q"><span>${icon('receive', 22)}</span>收款</div><button class="q" data-act="tab" data-arg="settings"><span>${icon('more', 22)}</span>更多</button></div>
${paused}${banner}
<div class="card"><div class="cardtitle">最近交易</div>${recent}</div>
</div>` };
  };

  V.transfer = () => ({ tab: 'transfer', body: `<div class="pad">
<h1 class="h1 xl">转账</h1>
<div class="card"><div style="padding:12px 16px;border-bottom:1px solid var(--line)"><div class="small muted">由</div><div class="b">综合户口 · 储蓄</div><div class="small muted">${money(BAL - S.spent)}</div></div>
<div style="padding:12px 16px"><div class="small muted">至</div><div style="display:flex;align-items:center;gap:8px"><span class="b">黄志伟</span><span class="tag wait">新收款人</span></div><div class="small muted">户口 888-123456-001 · 转数快</div></div></div>
<label class="field"><span>金额（HKD）</span><input class="input amt" type="text" inputmode="decimal" autocomplete="off" data-bind="amountText" value="${esc(S.amountText)}" placeholder="0.00"></label>
<div class="chips">${[2000, 20000, 200000].map((v) => `<button class="chip" data-act="amtChip" data-arg="${v}">${v.toLocaleString('en-US')}</button>`).join('')}</div>
<label class="field"><span>备注（选填）</span><input class="input" type="text" autocomplete="off" data-bind="noteText" value="${esc(S.noteText)}"></label>
</div>`, footer: `<button class="btn p" id="goReview" data-act="goReview"${parsedAmount() > 0 ? '' : ' disabled'}>下一步</button>` });

  V.transferReview = () => ({ title: '确认转账', back: 'transfer', body: `<div class="pad">
<div class="center" style="padding:6px 0"><div class="small muted">转账金额</div><div class="b" style="font-size:1.875em;line-height:1.3">${money(S.reviewAmount)}</div></div>
<div class="kvs">${kv('由', '综合户口 · 储蓄')}${kv('至', '黄志伟<br>888-123456-001')}${kv('方式', '转数快')}${kv('手续费', 'HKD 0.00')}${kv('时间', '即时')}</div>
${info('<p class="mid">转账前请确认收款人身份。如果有人自称亲友、说换了新户口，请先打他原来的电话核实。</p>')}
</div>`, footer: `<button class="btn p" data-act="verifyTransfer">确认转账</button>` });

  V.pause = () => {
    const p = S.paused || { amount: 0, until: '', ref: '' };
    return { title: '转账暂停', back: 'home', body: `<div class="pad" style="padding-top:24px">
<div class="center" style="gap:10px"><div class="circle warn">${icon('pause', 30, 2.6)}</div><h1 class="h1">这笔交易先停一停</h1>
<div class="stack ink2" style="gap:4px"><p>这笔交易超过了你自己设定的金额。</p><p>按你之前的选择，交易会暂停 24 小时。</p><p>我们也会通知你的联络人 ${esc(S.c1name)}。</p></div></div>
<div class="kvs">${kv('金额', '<b>' + money(p.amount) + '</b>')}${kv('收款人', '黄志伟')}${kv('状态', '<span class="tag wait">暂停中</span>')}${kv('暂停至', p.until)}${kv('参考编号', p.ref)}</div>
${warn('<p class="b">如果有人叫你保密、叫你快点转账，很可能是骗局。</p>')}
</div>`, footer: `<button class="btn p" data-act="callSheet">${icon('phone', 20)}打给我的联络人</button><button class="btn s" data-act="cancelSheet">取消这笔交易</button><button class="btn t" data-act="toBranch">急需用钱：到分行核实</button>` };
  };

  V.transferDone = () => ({ title: '转账', body: `<div class="pad" style="padding-top:32px">
<div class="center">${okCircle()}<h1 class="h1">转账成功</h1><div class="b" style="font-size:1.75em;line-height:1.3">${S.lastTx ? money(S.lastTx.amount) : ''}</div></div>
<div class="kvs">${kv('收款人', '黄志伟')}${kv('参考编号', S.lastTx ? S.lastTx.ref : '')}${kv('时间', '刚刚')}</div>
</div>`, footer: `<button class="btn p" data-act="tab" data-arg="home">完成</button>` });

  V.cancelled = () => ({ title: '转账', body: `<div class="pad" style="padding-top:32px">
<div class="center">${okCircle()}<h1 class="h1">已取消这笔交易</h1><p>${S.cancelledTx ? money(S.cancelledTx.amount) : ''} 没有转出，钱还在你的户口里。</p></div>
<div class="card p"><p>我们已通知 ${esc(S.c1name)} 交易暂停。你可以亲自告诉对方，你已经取消了。</p></div>
</div>`, footer: `<button class="btn p" data-act="tab" data-arg="home">完成</button>` });

  V.branch = () => {
    const p = S.paused || { until: '', ref: '' };
    return { title: '到分行核实', back: S.paused ? 'pause' : 'home', body: `<div class="pad">
<p>如果真的急需用钱，可以亲身到分行。职员会和你本人一起核实，核实后可以提早完成这笔交易。</p>
<div class="card"><div class="row"><span class="num">1</span><span>带同身份证</span></div><div class="row"><span class="num">2</span><span>到任何一间分行</span></div><div class="row"><span class="num">3</span><span>告诉职员参考编号 ${p.ref}</span></div></div>
<p class="ink2">这笔交易暂停至 ${p.until}。如果你没有取消，时间到了会按你的指示完成。</p>
${warn('<p class="b">如果有人叫你别告诉银行、别告诉家人，那多半是骗局。</p>')}
</div>`, footer: `<button class="btn p" data-act="tab" data-arg="home">我知道了，返回首页</button>${S.paused ? '<button class="btn t" data-act="cancelSheet">改为取消这笔交易</button>' : ''}` };
  };

  V.messages = () => ({ tab: 'messages', body: `<div class="pad"><h1 class="h1 xl">讯息</h1><div class="card">${S.messages.map((mm) => `<div style="display:flex;flex-direction:column;gap:2px;padding:12px 16px;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between;gap:12px"><span class="b">${esc(mm.title)}</span><span class="small muted" style="flex:none">${mm.time}</span></div><div class="mid ink2">${esc(mm.body)}</div></div>`).join('')}</div></div>` });

  V.settings = () => ({ tab: 'settings', body: `<div class="pad"><h1 class="h1 xl">设定</h1><div class="card">
<div class="row"><span class="grow">个人资料</span>${chev()}</div>
<button class="row" data-act="go" data-arg="security"><span class="grow"><span class="blk">户口保安</span><span class="blk small muted">登入、转账限额、智安存、指定联络人</span></span>${chev()}</button>
<div class="row"><span class="grow">通知设定</span>${chev()}</div>
<div class="row"><span class="grow">字体大小</span><span class="muted">${T.big ? '大' : '标准'}</span>${chev()}</div>
<div class="row"><span class="grow">语言</span><span class="muted">简体中文</span>${chev()}</div>
</div></div>` });

  V.security = () => ({ title: '户口保安', back: 'settings', body: `<div class="list">
${sec('登入')}<div class="card"><div class="row"><span class="grow">指纹或面容登入</span><span class="muted">已开启</span></div><div class="row"><span class="grow">更改密码</span>${chev()}</div></div>
${sec('交易保护')}<div class="card">
<div class="row"><span class="grow">网上转账限额</span><span class="muted">已设定</span>${chev()}</div>
<button class="row" data-act="go" data-arg="moneySafe"><span class="grow">智安存</span><span class="muted">已开启</span>${chev()}</button>
<button class="row" data-act="openTC"><span class="tile" style="width:38px;height:38px;border-radius:10px">${icon('shield', 20)}</span><span class="grow"><span class="blk b">指定联络人</span><span class="blk small muted">大额转账或银行担心你被骗时，通知你信任的人</span></span>${S.setupDone ? '<span class="small b" style="color:var(--ok)">已开启</span>' : '<span class="tag new">新</span>'}${chev()}</button>
</div></div>` });

  V.moneySafe = () => ({ title: '智安存', back: 'security', body: `<div class="pad">
<div class="card p" style="gap:6px"><div style="display:flex;align-items:center;gap:10px"><span class="tile" style="width:38px;height:38px;border-radius:10px">${icon('lock', 20)}</span><span class="grow b">智安存</span><span class="tag ok">已锁定</span></div>
<div class="small muted" style="margin-top:8px">已存入</div><div class="b" style="font-size:1.75em;line-height:1.3">HKD 300,000.00</div></div>
<p>智安存里的钱已锁定。需要用钱时，可以申请解锁。</p>
${(S.setupDone && S.scen.safe) ? info('<p class="mid">按你的设定，申请解锁时，我们会通知你的联络人 ' + esc(S.c1name) + '。</p>') : ''}
</div>`, footer: `<button class="btn s" data-act="verifyUnlock">申请解锁</button>` });

  V.moneySafeDone = () => ({ title: '智安存', body: `<div class="pad" style="padding-top:32px">
<div class="center">${okCircle()}<h1 class="h1">已收到解锁申请</h1><p class="ink2">我们会按智安存的程序处理，并通知你结果。</p></div>
${(S.setupDone && S.scen.safe) ? `<div class="card p" style="flex-direction:row;gap:12px;align-items:flex-start"><span class="av">${esc(lastChar(S.c1name))}</span><p>按你的设定，我们已通知 ${esc(S.c1name)}：有人申请解锁你的智安存。</p></div>` : ''}
${warn('<p class="b">如果不是你本人申请，或者有人叫你解锁，请马上致电汇丰热线。</p>')}
</div>`, footer: `<button class="btn p" data-act="go" data-arg="security">完成</button>` });

  V.tcIntro = () => ({ title: '指定联络人', back: S.introFrom, body: `<div class="pad">
<div class="stack" style="gap:10px"><div class="tile lg">${icon('shield', 28)}</div><h1 class="h1 xl">多一个人，帮你留意户口</h1><p class="ink2">指定联络人是你信任的家人、朋友或社工。以下情况，我们会通知他：</p></div>
<div class="card">
<div class="row"><span class="av" style="width:34px;height:34px;background:var(--wbg);color:var(--wicon)">${icon('pause', 18, 2.6)}</span><span>大额转账或提款时，交易先停一停</span></div>
<div class="row"><span class="av" style="width:34px;height:34px">${icon('shield', 18)}</span><span>银行担心你遇到骗局时</span></div>
<div class="row"><span class="av" style="width:34px;height:34px">${icon('phone', 18)}</span><span>银行长时间联络不上你时</span></div></div>
<div class="card p"><div class="b">他可以</div>${li('check', 'var(--ok)', '收到银行的简短提醒')}${li('check', 'var(--ok)', '打电话关心你，或陪你到分行')}${li('check', 'var(--ok)', '致电汇丰提供情况，例如「我没有向他借钱」')}</div>
<div class="card p"><div class="b">他不可以</div>${li('cross', 'var(--ink)', '看你的余额或交易记录')}${li('cross', 'var(--ink)', '替你转账、取钱或批准交易')}${li('cross', 'var(--ink)', '更改你的设定')}</div>
<p class="b">钱怎么用，始终由你决定。你随时可以修改或取消。</p>
</div>`, footer: `<button class="btn p" data-act="go" data-arg="tcContact">开始设定</button><button class="btn t" data-act="notNow">以后再说</button>` });

  const contactFields = (prefix, relKey, label) => `
<label class="field"><span>姓名</span><input class="input" type="text" autocomplete="off" data-bind="${prefix}name" value="${esc(S[prefix + 'name'])}"></label>
<div class="field"><span>和你的关系</span><div role="group" aria-label="${label}和你的关系">${chipList(REL, S[relKey], 'rel', relKey)}</div></div>
<label class="field"><span>手机号码</span><input class="input" type="tel" autocomplete="off" data-bind="${prefix}phone" value="${esc(S[prefix + 'phone'])}"></label>`;

  V.tcContact = () => ({ title: '指定联络人', back: 'tcIntro', step: 1, body: `<div class="pad">
<div><h1 class="h1">谁是你信任的人？</h1><p class="ink2" style="margin-top:4px">可以是家人、朋友或社工。最多两位。</p></div>
<div class="card p" style="gap:14px"><div class="b">联络人 1（主）</div>${contactFields('c1', 'c1rel', '联络人 1 ')}</div>
${S.showC2
    ? `<div class="card p" style="gap:14px"><div style="display:flex;justify-content:space-between;align-items:center"><span class="b">联络人 2（副）</span><button class="btn t" style="width:auto;padding:0 4px" data-act="hideC2">移除</button></div>${contactFields('c2', 'c2rel', '联络人 2 ')}</div>`
    : '<button class="btn dash" data-act="showC2">＋ 加入第二位联络人（可选）</button>'}
${info('<p class="mid">我们会发短讯请对方确认。对方致电汇丰官方热线同意后，才会生效。</p>')}
${S.formError ? `<p class="err" role="alert">${esc(S.formError)}</p>` : ''}
</div>`, footer: `<button class="btn p" data-act="toScenarios">下一步</button>` });

  const scenRows = (where) => SCEN.map((sc) => {
    const on = !!S.scen[sc.key];
    const amt = (sc.key === 'amount' && on)
      ? `<button class="amtline" data-act="${where === 'setup' ? 'go' : 'openEdit'}" data-arg="tcAmount"><span class="grow"><span class="blk">单笔 ${money(S.single)}</span><span class="blk">每日 ${money(S.daily)}</span></span><span class="b" style="color:var(--accent)">修改</span></button>` : '';
    return `<div class="scen"><button class="row" role="switch" aria-checked="${on}" data-act="${where === 'setup' ? 'scenSetup' : 'scenManage'}" data-arg="${sc.key}"><span class="grow"><span class="blk b">${sc.title}</span><span class="blk mid ink2" style="margin-top:2px">${sc.sub}</span></span><span class="sw"></span></button>${amt}</div>`;
  }).join('');

  V.tcScenarios = () => ({ title: '指定联络人', back: 'tcContact', step: 2, body: `<div class="pad">
<div><h1 class="h1">什么时候通知${esc(S.c1name)}？</h1><p class="ink2" style="margin-top:4px">已帮你选好建议设定，你可以逐项关掉。</p></div>
<div class="card">${scenRows('setup')}</div>
<div class="info" style="padding:14px 16px">${icon('info', 20)}<div class="stack"><p class="b">为什么现在先选好？</p><p>真的出事时，骗子常会叫你拒绝。</p><p>之后要关掉任何一项，要等 24 小时，并会通知联络人。</p></div></div>
</div>`, footer: `<button class="btn p" data-act="go" data-arg="tcReview">下一步</button>` });

  const stepper = (label, value, arg, aria) => `<div class="stepper"><span class="b">${label}</span><div>
<button class="stepbtn" aria-label="${aria}减少" data-act="step" data-arg="${arg}|-1">${icon('minus', 20, 2.2)}</button>
<span class="stepval">${money(value)}</span>
<button class="stepbtn" aria-label="${aria}增加" data-act="step" data-arg="${arg}|1">${icon('plus', 20, 2.2)}</button></div></div>`;

  V.tcAmount = () => ({ title: '设定金额', back: 'tcScenarios', step: 2, body: `<div class="pad">
<div><h1 class="h1">设定金额</h1><p class="ink2" style="margin-top:4px">超过这个金额，交易会先暂停 24 小时。我们会告诉你，也会通知你的联络人。</p></div>
<div class="card"><div style="padding:12px 16px;border-bottom:1px solid var(--line)" class="ink2">根据你过去一年的用钱习惯，建议单笔 HKD 10,000.00、每日 HKD 30,000.00。</div>
${stepper('单笔', S.single, 'setup|single', '单笔')}${stepper('每日', S.daily, 'setup|daily', '每日')}
<div style="padding:4px 8px"><button class="btn t" style="width:auto;padding:0 8px" data-act="resetAmount">用回建议金额</button></div></div>
</div>`, footer: `<button class="btn p" data-act="go" data-arg="tcScenarios">完成</button>` });

  V.tcReview = () => ({ title: '指定联络人', back: 'tcScenarios', step: 3, body: `<div class="list" style="padding-top:20px">
<h1 class="h1">确认你的设定</h1>
${sec('联络人')}<div class="kvs">${kv('主', relLabel(S.c1name, S.c1rel) + ' · ' + esc(S.c1phone))}${kv('副', (S.showC2 && S.c2name.trim()) ? relLabel(S.c2name, S.c2rel) : '未设定')}</div>
${sec('什么时候通知联络人')}<div class="kvs">${SCEN.map((sc) => kv('<span style="color:var(--ink)">' + sc.title + '</span>', S.scen[sc.key] ? '<b style="color:var(--ok)">会通知</b>' : '<b style="color:var(--muted)">不通知</b>')).join('')}${kv('金额', '单笔 ' + money(S.single) + '<br>每日 ' + money(S.daily))}</div>
<div style="margin-top:14px">${info('<p class="mid">之后要减少保护（例如关掉通知、调高金额、取消联络人），要等 24 小时，并会通知联络人。</p>')}</div>
<button class="checkrow" style="margin-top:14px" role="checkbox" aria-checked="${S.termsOk}" data-act="toggleTerms"><span class="box">${icon('check', 18, 3)}</span><span>我已阅读并同意《指定联络人服务条款》</span></button>
</div>`, footer: `<button class="btn p" data-act="verifySetup"${S.termsOk ? '' : ' disabled'}>确认并验证身份</button>` });

  V.tcDone = () => ({ title: '指定联络人', body: `<div class="pad" style="padding-top:28px">
<div class="center">${okCircle()}<h1 class="h1">已发出邀请</h1><p class="ink2">我们已发短讯给 ${esc(S.c1name)}${S.c2name ? ' 和 ' + esc(S.c2name) : ''}。</p></div>
<div class="card"><div class="cardtitle" style="padding-bottom:6px">接下来</div>
<div class="row" style="border:0;padding:10px 16px"><span class="num">1</span><span>${esc(S.c1name)} 收到短讯</span></div>
<div class="row" style="border:0;padding:10px 16px"><span class="num">2</span><span>他自己查找汇丰官方热线，致电确认</span></div>
<div class="row" style="border:0;padding:10px 16px 14px"><span class="num">3</span><span>确认后就会生效，我们会在「讯息」通知你</span></div></div>
<div style="display:flex;justify-content:space-between;padding:0 4px" class="ink2"><span>参考编号</span><span>${S.setupRef}</span></div>
<p class="ink2">你可以在「设定 › 户口保安 › 指定联络人」随时修改或取消。</p>
</div>`, footer: `<button class="btn p" data-act="go" data-arg="tcManage">完成</button><button class="btn t" data-act="simStart" data-arg="tcDone">试试情境模拟</button>` });

  const simBar = () => `<div class="simbar">${icon('info', 20)}<span>示范：不会真的转账，也不会通知任何人。</span></div>`;

  V.sim1 = () => ({ title: '情境模拟', back: S.simFrom, body: `${simBar()}<div class="pad" style="padding-top:16px">
<h1 class="h1">如果有人叫你转一大笔钱</h1>
<p class="ink2">假设有人来电，自称是你的儿子，说急需 20 万，叫你马上转到一个新户口。你转账时会看到：</p>
<div class="mock"><div class="circle warn" style="width:52px;height:52px">${icon('pause', 24, 2.6)}</div><div class="b" style="font-size:1.125em">这笔交易先停一停</div><div class="mid ink2">交易会暂停 24 小时，我们也会通知 ${esc(S.c1name)}。</div>
<div class="stack" style="width:100%;gap:8px;margin-top:4px"><div class="fake" style="background:var(--accent);color:#fff">打给我的联络人</div><div class="fake" style="border:1.5px solid var(--accent);color:var(--accent)">取消这笔交易</div><div class="fake" style="color:var(--accent);padding:6px">急需用钱：到分行核实</div></div></div>
</div>`, footer: `<button class="btn p" data-act="go" data-arg="sim2">下一步（1/3）</button>` });

  V.sim2 = () => ({ title: '情境模拟', back: 'sim1', body: `${simBar()}<div class="pad" style="padding-top:16px">
<h1 class="h1">${esc(S.c1name)} 会收到这条短讯</h1>
<div class="card p"><div style="display:flex;align-items:center;gap:8px" class="small muted"><span class="av" style="width:28px;height:28px;background:var(--line);color:var(--ink2)">#</span>#HSBC · 短讯</div>
<div class="bubble">【汇丰】你是陈国强先生的指定联络人。陈国强先生的户口刚有一笔大额交易，现正暂停。请尽快亲自联系陈国强先生。如需向汇丰提供情况，请致电你通讯录里的汇丰官方热线。汇丰不会在短讯附上链接，也不会问你密码。</div></div>
<div class="card p"><div class="b">真的通知一定是这样</div>${li('check', 'var(--ok)', '不写金额')}${li('check', 'var(--ok)', '没有链接，不问密码')}${li('check', 'var(--ok)', '只请他亲自联系你，或打官方热线')}</div>
<p class="ink2">${esc(S.c1name)} 接受邀请时，也会看到这个示范。</p>
</div>`, footer: `<button class="btn p" data-act="go" data-arg="sim3">下一步（2/3）</button>` });

  V.sim3 = () => ({ title: '情境模拟', back: 'sim2', body: `${simBar()}<div class="pad" style="padding-top:16px">
<h1 class="h1">接下来，你可以</h1>
<div class="card">
<div class="row" style="align-items:flex-start"><span class="av" style="width:36px;height:36px">${icon('phone', 18)}</span><span><span class="blk b">打给联络人</span><span class="blk ink2">先和你信任的人谈一谈</span></span></div>
<div class="row" style="align-items:flex-start"><span class="av" style="width:36px;height:36px">${icon('cross', 18, 2.4)}</span><span><span class="blk b">取消这笔交易</span><span class="blk ink2">钱会留在你的户口里</span></span></div>
<div class="row" style="align-items:flex-start"><span class="av" style="width:36px;height:36px">${icon('bank', 18)}</span><span><span class="blk b">急需用钱：到分行核实</span><span class="blk ink2">和职员本人核实后，可以提早完成</span></span></div></div>
<div class="info" style="padding:14px 16px"><div class="stack"><p>24 小时后，如果你没有取消，钱会按你的指示转出。</p><p class="b">钱怎么用，始终由你决定。</p></div></div>
</div>`, footer: `<button class="btn p" data-act="simEnd">完成示范</button>` });

  V.tcManage = () => {
    const pend = S.pending.length ? `${sec('等待生效的改动')}<div class="card" style="background:var(--wbg);border-color:var(--wline)">${S.pending.map((p) => `<div style="display:flex;align-items:center;gap:12px;padding:12px 8px 12px 16px;border-bottom:1px solid var(--wline);color:var(--wink)"><div class="grow"><div class="b">${esc(p.text)}</div><div class="mid">${p.until} 生效 · 已通知 ${esc(p.notify)}</div></div><button class="btn t" style="width:auto;padding:0 10px;color:var(--wink);text-decoration:underline" data-act="withdraw" data-arg="${p.id}">撤回</button></div>`).join('')}</div>` : '';
    const c2row = S.c2name
      ? `<button class="row" data-act="detail" data-arg="c2"><span class="av">${esc(lastChar(S.c2name))}</span><span class="grow"><span class="blk b">${relLabel(S.c2name, S.c2rel)}</span><span class="blk small muted">副联络人 · ${mask(S.c2phone)}</span></span>${chipStatus(S.c2accepted)}${chev()}</button>`
      : `<button class="row" style="color:var(--accent)" data-act="go" data-arg="tcAddSecondary">${icon('plus', 22, 2.2)}<span class="grow b">新增副联络人</span><span class="small muted">马上生效</span></button>`;
    return { title: '指定联络人', back: 'security', body: `<div class="list">
${S.notice ? `<p class="notice" role="status">${esc(S.notice)}</p>` : ''}
${pend}
${sec('联络人')}<div class="card"><button class="row" data-act="detail" data-arg="c1"><span class="av">${esc(lastChar(S.c1name))}</span><span class="grow"><span class="blk b">${relLabel(S.c1name, S.c1rel)}</span><span class="blk small muted">主联络人 · ${mask(S.c1phone)}</span></span>${chipStatus(S.c1accepted)}${chev()}</button>${c2row}</div>
${sec('什么时候通知' + esc(S.c1name))}<div class="card">${scenRows('manage')}</div>
<div class="info" style="margin-top:16px;padding:14px 16px"><div class="stack" style="gap:10px"><p><b>马上生效：</b>新增联络人、调低金额、打开通知。</p><p><b>要等 24 小时：</b>更换或取消联络人、调高金额、关掉通知。要先验证身份，并通知原联络人。</p><p>亲身到分行，经职员核实，可马上生效。</p></div></div>
${sec('其他')}<div class="card"><button class="row" data-act="simStart" data-arg="tcManage"><span class="grow">试试情境模拟</span>${chev()}</button><div class="row"><span class="grow">每年确认一次联络人</span><span class="muted">下次：明年 10 月</span></div></div>
</div>` };
  };

  V.tcContactDetail = () => {
    const w = S.detailWho === 'c2' ? 'c2' : 'c1';
    const name = S[w + 'name'];
    return { title: '联络人资料', back: 'tcManage', body: `<div class="list" style="padding-top:20px">
<div style="display:flex;align-items:center;gap:14px;padding:0 4px 16px"><span class="av lg">${esc(lastChar(name))}</span><div><div class="b" style="font-size:1.25em">${esc(name)}</div><div class="muted">${w === 'c2' ? '副联络人' : '主联络人'}</div></div></div>
<div class="kvs">${kv('关系', esc(S[w + 'rel'] || '—'))}${kv('手机号码', mask(S[w + 'phone']))}${kv('状态', chipStatus(S[w + 'accepted']))}</div>
${sec('更改（会减少保护）')}<div class="card">
<button class="row" data-act="reduce" data-arg="replace|${w}"><span class="grow"><span class="blk">更换联络人</span><span class="blk mid ink2" style="margin-top:2px">要验证身份，24 小时后生效，并通知 ${esc(name)}</span></span>${chev()}</button>
<button class="row" data-act="reduce" data-arg="remove|${w}"><span class="grow"><span class="blk">取消联络人</span><span class="blk mid ink2" style="margin-top:2px">要验证身份，24 小时后生效，并通知 ${esc(name)}</span></span>${chev()}</button>
</div></div>` };
  };

  V.tcEditAmount = () => {
    const raise = S.adjSingle > S.single || S.adjDaily > S.daily;
    const same = S.adjSingle === S.single && S.adjDaily === S.daily;
    return { title: '修改金额', back: 'tcManage', body: `<div class="pad">
<div class="card">${stepper('单笔', S.adjSingle, 'edit|single', '单笔')}${stepper('每日', S.adjDaily, 'edit|daily', '每日')}<div style="padding:12px 16px" class="ink2">现在：单笔 ${money(S.single)}、每日 ${money(S.daily)}</div></div>
${(!same && !raise) ? okbox('<p>金额调低了，较少的钱也会先暂停。这会加强保护，马上生效。</p>') : ''}
${raise ? warn('<p>金额调高了，要转更多钱才会暂停。</p><p>要先验证身份，24 小时后才生效。</p><p>我们也会通知 ' + esc(S.c1name) + '。</p><p class="b">如果有人催你调高金额，很可能是骗局。</p>') : ''}
</div>`, footer: `<button class="btn p" data-act="confirmEdit"${same ? ' disabled' : ''}>${raise ? '验证身份并提交' : '确认，马上生效'}</button><button class="btn t" data-act="go" data-arg="tcManage">取消</button>` };
  };

  V.tcAddSecondary = () => ({ title: '新增副联络人', back: 'tcManage', body: `<div class="pad">
<p class="ink2">主联络人联系不上时，我们会通知副联络人。新增联络人会加强保护，马上生效。</p>
<div class="card p" style="gap:14px">${contactFields('s2', 's2rel', '副联络人')}</div>
${info('<p class="mid">我们会发短讯请对方确认。对方致电汇丰官方热线同意后，才会生效。</p>')}
${S.formError ? `<p class="err" role="alert">${esc(S.formError)}</p>` : ''}
</div>`, footer: `<button class="btn p" data-act="inviteSecondary">发出邀请</button>` });

  // ---------- 长者端：外框、弹层 ----------
  const TAB_DEF = [['home', '首页', 'home'], ['transfer', '转账', 'transfer'], ['messages', '讯息', 'bell'], ['settings', '设定', 'sliders']];
  const STEP_NAME = { 1: '联络人', 2: '什么时候通知', 3: '确认' };
  const wm = () => '<div class="wm">课堂原型，非汇丰官方</div>';

  function sheetHtml() {
    let inner = '';
    if (S.sheet === 'verify') {
      const VT = { finishSetup: '开启指定联络人服务前，请先确认是你本人。', submitTransfer: '确认转账 ' + money(S.reviewAmount) + ' 给黄志伟。', submitReduce: '这项改动会在 24 小时后生效。', unlockSafe: '申请解锁智安存前，请先确认是你本人。' };
      inner = `<div class="center" style="padding-top:6px"><div class="circle" style="width:60px;height:60px;background:var(--tint);color:var(--accent)">${icon('finger', 30, 1.8)}</div><div class="b" style="font-size:1.25em">确认是你本人</div><p class="ink2">${VT[S.afterVerify] || ''}</p></div>
<button class="btn p" data-act="doVerify">用指纹或面容确认</button><button class="btn s" style="font-size:1em" data-act="doVerify">改用短讯验证码</button><button class="btn g" data-act="closeSheet">取消</button>`;
    } else if (S.sheet === 'call') {
      const list = [{ n: S.c1name, r: '主联络人', p: S.c1phone }];
      if (S.c2name) list.push({ n: S.c2name, r: '副联络人', p: S.c2phone });
      inner = `<div class="b" style="font-size:1.125em;padding:4px 0">打给谁？</div>${list.map((c) => `<button class="row" style="border:1px solid var(--line);border-radius:12px" data-act="call" data-arg="${esc(c.n)}"><span class="av">${esc(lastChar(c.n))}</span><span class="grow"><span class="blk b">${esc(c.n)}</span><span class="blk small muted">${c.r} · ${esc(c.p)}</span></span>${icon('phone', 22, 2, 'flex:none;color:var(--ok)')}</button>`).join('')}<button class="btn g" data-act="closeSheet">取消</button>`;
    } else if (S.sheet === 'confirmCancel') {
      inner = `<div class="b" style="font-size:1.125em;padding-top:4px">取消这笔交易？</div><p class="ink2">${S.paused ? money(S.paused.amount) : ''} 会留在你的户口里，不会转出。</p><button class="btn p" data-act="confirmCancel">确认取消</button><button class="btn g" data-act="closeSheet">不取消</button>`;
    } else if (S.sheet === 'reduce') {
      const rt = reduceText(S.reduceKind, S.reduceWho === 'c2' ? S.c2name : S.c1name);
      inner = `<div class="b" style="font-size:1.125em;padding-top:4px">${esc(rt.title)}</div><p class="ink2">${esc(rt.body)}</p>${S.reduceKind === 'remove' ? '<p class="ink2">如果你不想通知对方，可以亲身到分行，经职员核实后马上取消。</p>' : ''}
${warn('<p class="b mid">如果有人叫你改设定、别告诉家人，很可能是骗局。</p>')}<button class="btn p" data-act="reduceVerify">验证身份并提交</button><button class="btn g" data-act="closeSheet">不改了</button>`;
    }
    return `<div class="sheetwrap"><div class="sheet" role="dialog" aria-modal="true"><div class="grip"></div>${inner}</div></div>`;
  }

  function callHtml() {
    const other = S.callTarget === S.c1name ? S.c2name : S.c1name;
    const status = S.callState === 'dialing' ? '正在打电话…' : S.callState === 'connected' ? '通话中 00:12' : '无人接听';
    const lower = S.callState === 'noAnswer'
      ? `<div class="stack" style="width:100%;gap:10px;margin-top:auto"><p style="color:#C9D1DB">不用急，这笔交易仍然暂停中。</p><button class="btn" style="background:#fff;color:var(--ink)" data-act="call" data-arg="${esc(S.callTarget)}">再打一次</button>${(S.c2name && other && other !== S.callTarget) ? `<button class="btn" style="border:1.5px solid #fff;background:transparent;color:#fff" data-act="call" data-arg="${esc(other)}">改打 ${esc(other)}</button>` : ''}<button class="btn" style="min-height:44px;background:transparent;color:#fff;font-weight:400;text-decoration:underline" data-act="endCall">返回银行 App</button></div>`
      : `<button class="hang" aria-label="挂断" data-act="endCall">${icon('phone', 30, 2, 'transform:rotate(135deg)')}</button>`;
    return `<div class="callov"><div class="av">${esc(lastChar(S.callTarget))}</div><div class="b" style="font-size:1.625em;line-height:1.3">${esc(S.callTarget)}</div><div role="status" style="color:#C9D1DB">${status}</div>${lower}</div>`;
  }

  function renderElder() {
    const v = V[S.screen]();
    let h = wm();
    if (!v.tab) h += `<div class="nav"><div>${v.back ? `<button class="iconbtn" aria-label="返回" data-act="go" data-arg="${v.back}">${icon('back', 26, 2.2)}</button>` : ''}</div><h2>${esc(v.title)}</h2><div></div></div>`;
    if (v.step) h += `<div class="prog"><div class="bars">${[1, 2, 3].map((n) => `<i class="${v.step >= n ? 'on' : ''}"></i>`).join('')}</div><p>第 ${v.step} 步，共 3 步：${STEP_NAME[v.step]}</p></div>`;
    h += `<div class="scroll">${v.body}</div>`;
    if (v.footer) h += `<div class="footer">${v.footer}</div>`;
    if (v.tab) h += `<nav class="tabs" aria-label="主选单">${TAB_DEF.map((t) => `<button class="tab" data-act="go" data-arg="${t[0]}"${v.tab === t[0] ? ' aria-current="page"' : ''}>${icon(t[2], 24)}${t[1]}</button>`).join('')}</nav>`;
    if (S.sheet && !S.callState) h += sheetHtml();
    if (S.callState) h += callHtml();
    if (panelOpen) h += panelHtml();
    return { html: h, key: 'elder:' + S.screen };
  }

  // ---------- 联络人端：短讯收件箱 ----------
  function threads() {
    const elder = '陈国强先生';
    const bank = [
      { text: '【汇丰】' + elder + '邀请你成为指定联络人。你不会因此获得他户口的任何权限。如果愿意，请自行查找汇丰官方热线致电确认。汇丰不会在短讯附上链接，也不会问你密码。', time: '9月20日 10:31' },
      { text: '【汇丰】你已确认成为' + elder + '的指定联络人。日后的通知只会请你致电官方热线或联系家人，不会有链接，不会问密码，也不会叫你转账。', time: '9月20日 10:52' },
      { text: '【汇丰】你是' + elder + '的指定联络人。' + elder + '的户口刚有一笔大额交易，现正暂停。请尽快亲自联系' + elder + '。如需向汇丰提供情况，请致电你通讯录里的汇丰官方热线。汇丰不会在短讯附上链接，也不会问你密码。', time: '今天 14:05' }
    ];
    if (T.afterGuide) bank.push({ text: '【汇丰】如' + elder + '怀疑受骗：1. 陪他立即致电警方「防骗易」18222 和汇丰热线；2. 不要责怪他，先陪他处理；3. 小心之后有人自称能帮忙追回款项。', time: '今天 16:40' });
    const all = {
      parcel: { sender: '+852 6000 1827', time: '14:12', msgs: [{ text: '【速递通知】你的包裹因地址不完整未能派送。请于今日内点击 [链接] 更新地址，否则包裹将被退回。', time: '今天 14:12' }] },
      bank: { sender: '#HSBC', time: T.afterGuide ? '16:40' : '14:05', msgs: bank },
      scam: { sender: '+852 6000 4410', time: '13:31', msgs: [{ text: '【户口安全】你的银行户口出现异常登入，已暂停使用。请立即点击 [链接] 验证身份并输入网上理财密码，以免户口被冻结。', time: '今天 13:31' }] },
      dad: { sender: '爸爸', time: '12:10', msgs: [{ text: '家明，今晚回来吃饭吗？', time: '今天 12:10' }] },
      mart: { sender: '#GreenMart', time: '昨天', msgs: [{ text: '【GreenMart】会员周末双倍积分，即日起至周日。回复 STOP 取消订阅。', time: '昨天 18:20' }] },
      tele: { sender: '#TeleNet', time: '昨天', msgs: [{ text: '【TeleNet】你本月的流动数据用量已达 80%。', time: '昨天 09:02' }] }
    };
    const order = T.afterGuide ? ['bank', 'parcel', 'scam', 'dad', 'mart', 'tele'] : ['parcel', 'bank', 'scam', 'dad', 'mart', 'tele'];
    return order.map((id) => Object.assign({ id: id }, all[id]));
  }
  function closeThread() {
    if (C.open === 'bank' && C.openAt) { session.m.hsbcDwell += (Date.now() - C.openAt) / 1000; C.openAt = 0; }
    if (C.open) ev('close', C.open);
    C.open = null;
  }
  function renderContact() {
    const list = threads();
    const cur = list.find((t) => t.id === C.open);
    let h = wm();
    if (!cur) {
      h += `<div class="sms"><div class="smshead"><h1 class="h1" style="font-size:2em">讯息</h1></div><div class="scroll">${list.map((t) => {
        const last = t.msgs[t.msgs.length - 1];
        const isNum = t.sender.charAt(0) === '+';
        return `<button class="thread" data-act="openThread" data-arg="${t.id}"><span class="unread">${C.read[t.id] ? '' : '<i aria-label="未读"></i>'}</span><span class="av" style="width:48px;height:48px;background:var(--line);color:var(--ink2);font-size:1.125em">${isNum ? icon('person', 24) : esc(t.sender.charAt(0))}</span><span class="grow"><span style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><span class="b" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.sender)}</span><span class="small muted" style="flex:none">${t.time}</span></span><span class="preview">${esc(last.text)}</span></span></button>`;
      }).join('')}</div></div>`;
    } else {
      const canReply = cur.sender.charAt(0) !== '#';
      h += `<div class="sms"><div class="tbar"><button class="iconbtn" style="width:auto;padding:0 10px 0 2px;margin:0;gap:2px" aria-label="返回讯息列表" data-act="closeThread">${icon('back', 26, 2.2)}讯息</button><div class="who">${esc(cur.sender)}</div></div>
<div class="msgs">${cur.msgs.map((mm) => `<div class="mtime">${mm.time}</div><div class="msg">${esc(mm.text)}</div>`).join('')}</div>
<div class="reply">${canReply ? '<div style="height:44px;border:1px solid #B8B8B4;border-radius:22px;padding:0 16px;display:flex;align-items:center;color:#6B6B67">短讯</div>' : '<div class="small muted" style="min-height:44px;display:flex;align-items:center;justify-content:center">这个发送人不能接收回复</div>'}</div></div>`;
    }
    if (panelOpen) h += panelHtml();
    return { html: h, key: 'contact:' + (C.open || 'inbox') };
  }

  // ---------- 主持人面板 ----------
  function panelHtml() {
    const dur = Math.round(secs());
    const head = `<div style="display:flex;justify-content:space-between;align-items:center"><div><div class="b" style="font-size:1.125em">主持人</div><div class="small muted">${esc(session.participant)} · ${session.role} · 已用 ${Math.floor(dur / 60)} 分 ${dur % 60} 秒</div></div><button class="iconbtn" aria-label="关闭" data-act="panelClose">${icon('cross', 20, 2.2)}</button></div>`;
    let body = '';
    if (mode === 'elder') {
      body = `${sec('直接跳到')}<div class="chips">
<button class="chip" data-act="panelJump" data-arg="home">首页</button><button class="chip" data-act="panelJump" data-arg="security">户口保安</button><button class="chip" data-act="panelJump" data-arg="manage">管理页（假设已设定）</button><button class="chip" data-act="panelJump" data-arg="transfer">转账（假设已设定）</button><button class="chip" data-act="panelJump" data-arg="pause">交易暂停（假设已设定）</button></div>
${sec('联络人接电话吗')}${chipList(['不接听', '接通'], T.callOutcome, 'panelOpt', 'call')}
${sec('字体大小')}${chipList(['标准', '大'], T.big ? '大' : '标准', 'panelOpt', 'font')}`;
    } else {
      body = `${sec('事后指引短讯')}${chipList(['不显示', '显示'], T.afterGuide ? '显示' : '不显示', 'panelOpt', 'after')}
${sec('字体大小')}${chipList(['标准', '大'], T.big ? '大' : '标准', 'panelOpt', 'font')}`;
    }
    return `<div class="panelwrap"><div class="panel" role="dialog" aria-modal="true" aria-label="主持人面板">${head}${body}
<div style="height:4px"></div><button class="btn dark" data-act="panelEnd">结束操作，填写问卷</button><button class="btn g" data-act="panelAbort">放弃这一场，回到开始页</button></div></div>`;
  }
  function openPanel() { if (!session || (mode !== 'elder' && mode !== 'contact')) return; panelOpen = true; ev('panel', '打开'); render(); }

  // ---------- 开始页 ----------
  function renderStart() {
    if (!startForm.participant) startForm.participant = nextParticipantId();
    const n = savedSessions().length;
    const h = `${wm()}<div class="plain">
<div><h1 class="h1 xl">开始一场测试</h1><p class="ink2" style="margin-top:4px">由组员填写，然后把手机交给参与者。</p></div>
<button class="row" style="border:1px solid var(--line);border-radius:14px" data-act="openRecords"><span class="tile">${icon('bill', 20)}</span><span class="grow"><span class="blk b">测试记录</span><span class="blk small muted">这台手机已保存 ${n} 场 · 查看、复制、导出</span></span>${chev()}</button>
<div class="card p" style="flex-direction:row;align-items:center;gap:14px"><div class="grow"><div class="small muted">这一场的编号（自动生成，不会重复）</div><div class="b" style="font-size:1.75em;letter-spacing:2px;line-height:1.3">${esc(startForm.participant)}</div></div></div>
<p class="mid ink2" style="margin-top:-6px">请把这个编号写在你的笔记上，方便之后对上记录。</p>
<div class="field"><span>角色</span>${chipList(['长者', '联络人'], startForm.role, 'startOpt', 'role')}</div>
<div class="field"><span>年龄段</span>${chipList(['55 岁以下', '55–64 岁', '65–74 岁', '75 岁或以上'], startForm.age, 'startOpt', 'age')}</div>
${startForm.err ? `<p class="err" role="alert">${esc(startForm.err)}</p>` : ''}
<button class="btn p" data-act="startTest">开始测试</button>
<div class="info">${icon('info', 20)}<div class="stack"><p class="mid">测试中长按顶部「课堂原型」那条（或连按 5 下），可以打开主持人面板：跳画面、调字体、切换联络人接不接电话、结束并填写问卷。</p><p class="mid">请用预填的虚构资料，不要让参与者输入真实姓名或电话。</p></div></div>
<a class="btn t" style="text-decoration:none" href="guide.html">测试主持卡</a>
</div>`;
    return { html: h, key: 'start' };
  }

  // ---------- 记录页 ----------
  const recordText = (r) => r.summary + '\n\n— 问卷 —\n' + r.answersText;
  function renderRecords() {
    const list = savedSessions();
    const items = list.map((r, i) => {
      const d = new Date(r.startedAt);
      const when = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
      return `<div class="qcard"><div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline"><span class="b">${esc(r.participant)} · ${esc(r.role)}</span><span class="small muted">${when} · 用时 ${fmtDur(r.durationSec)}</span></div>
<details><summary class="mid b" style="color:var(--accent);cursor:pointer;min-height:32px">看这一场的结果</summary><pre class="result" style="white-space:pre-wrap;min-height:0;margin:8px 0 0">${esc(recordText(r))}</pre></details>
<button class="btn s" style="min-height:44px;font-size:1em" data-act="copyOne" data-arg="${i}">复制这一场</button></div>`;
    }).reverse().join('');
    const where = CFG.formAction
      ? '每一场提交时已送到小组的 Google 表格。这里是这台手机上的备份。'
      : '还没有设定 Google 表单，记录只保存在这台手机。请用下面的按钮把记录发给组长。';
    const h = `${wm()}<div class="plain">
<div><h1 class="h1 xl">测试记录</h1><p class="ink2" style="margin-top:4px">这台手机共 ${list.length} 场。${where}</p></div>
${list.length ? `<button class="btn p" data-act="copyAll">复制全部记录（可贴到微信或邮件）</button>
<button class="btn s" data-act="exportCsv">导出 CSV 文件（可用 Excel 打开）</button>${items}` : '<div class="card p"><p class="ink2">还没有记录。做完一场测试、按「提交结果」后，就会出现在这里。</p></div>'}
<button class="btn g" data-act="backToStart">返回开始页</button>
${list.length ? '<button class="btn g" style="color:var(--err)" data-act="clearAll">清除这台手机的记录</button>' : ''}
</div>`;
    return { html: h, key: 'records' };
  }

  // ---------- 问卷、结果 ----------
  const questions = () => (session.role === '长者' ? Q_ELDER : Q_CONTACT);
  function renderSurvey() {
    const qs = questions();
    const h = `${wm()}<div class="plain">
<div><h1 class="h1">问卷</h1><p class="ink2" style="margin-top:4px">${esc(session.participant)} · ${session.role}。由组员读题、代按，记下参与者的原话。</p></div>
${qs.map((q, i) => `<div class="qcard">${q.tag ? `<span class="qtag">假设 ${q.tag}</span>` : ''}<div class="b">${i + 1}. ${q.q}</div>${q.type === 'text'
      ? `<textarea class="input" data-ans="${q.id}" rows="3">${esc(session.answers[q.id] || '')}</textarea>`
      : chipList(q.opts, session.answers[q.id], q.type === 'multi' ? 'ansMulti' : 'ans', q.id, q.type === 'multi')}</div>`).join('')}
<button class="btn p" data-act="submitSurvey">提交结果</button>
<button class="btn g" data-act="backToTest">返回测试画面</button>
</div>`;
    return { html: h, key: 'survey' };
  }
  function renderSubmitted() {
    const r = lastRecord;
    const status = submitStatus === 'sent' ? '结果已送出到小组的表格，并保存在这台手机。'
      : submitStatus === 'noform' ? '还没有设定 Google 表单，结果只保存在这台手机。请按「复制结果」发给组长。'
        : submitStatus === 'sending' ? '正在送出…'
          : '送出时出错，结果已保存在这台手机。请按「复制结果」发给组长。';
    const h = `${wm()}<div class="plain">
<div class="center" style="padding-top:12px">${okCircle()}<h1 class="h1">这一场完成了</h1><p class="ink2">${status}</p></div>
<textarea class="result" readonly id="resultText">${esc(r ? r.summary + '\n\n— 问卷 —\n' + r.answersText : '')}</textarea>
<button class="btn s" data-act="copyResult">复制结果</button>
<button class="btn p" data-act="nextParticipant">下一位参与者</button>
<button class="btn g" data-act="openRecords">查看这台手机的全部记录</button>
</div>`;
    return { html: h, key: 'submitted' };
  }

  const fmtAns = (a) => (Array.isArray(a) ? (a.length ? a.join('、') : '（没有回答）') : (a && String(a).trim() ? String(a).trim() : '（没有回答）'));
  const fmtDur = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ' 分 ' + (s % 60) + ' 秒'; };

  function elderSummary() {
    const m = session.m, E = session.events, a = session.answers;
    const L = [];
    const aOk = a.a1 === '不可以' && a.a2 === '不可以';
    const bOk = a.b1 === '一定会' || a.b1 === '可能会';
    L.push('【判断】A（明白联络人不能做什么）：' + (a.a1 && a.a2 ? (aOk ? '两题都对' : '有答错') : '未答完') + '；B（愿意开）：' + (a.b1 ? (bOk ? '愿意' : '不愿意或不确定') : '未答'));
    L.push('— 登记 —');
    L.push('看了介绍：' + (m.introAt != null ? '是（第 ' + m.introAt + ' 秒）' : '否'));
    L.push('按「以后再说」：' + m.notNow + ' 次');
    if (m.setupDoneAt != null) {
      L.push('完成登记：是，用时 ' + fmtDur(m.setupDoneAt - (m.introAt != null ? m.introAt : (m.setupStartAt || 0))));
      L.push('第 2 步关掉：' + (m.scenOff.length ? m.scenOff.join('、') : '没有'));
      L.push('金额（C）：' + m.amount);
      L.push('联络人关系：' + m.c1rel + '；加了副联络人：' + (m.addedC2 ? '是' : '否'));
    } else {
      L.push('完成登记：否' + (m.lastSetup ? '，最后停在：' + m.lastSetup : ''));
    }
    L.push('情境模拟：' + (m.simMax ? '看到第 ' + m.simMax + ' 页' : '没有打开'));
    L.push('— 大额转账 —');
    const transfers = E.filter((e) => e.e === 'transfer').map((e) => e.v);
    L.push('提交转账：' + (transfers.length ? transfers.join('；') : '没有'));
    L.push('看到暂停画面：' + (m.pauseAt != null ? '是' : '否'));
    if (m.pauseAt != null) L.push('第一个按：' + (m.pauseFirst ? m.pauseFirst + '（看到后 ' + m.pauseFirstSec + ' 秒）' : '没有按'));
    const calls = E.filter((e) => e.e === 'call-result').map((e) => e.v);
    if (calls.length) L.push('打电话：' + calls.join('；'));
    L.push('取消交易：' + (E.some((e) => e.e === 'cancel-confirm') ? '是' : '否') + '；打开「到分行核实」：' + (E.some((e) => e.e === 'screen' && e.v === '到分行核实') ? '是' : '否'));
    L.push('— 减少保护 —');
    const RED = { 'reduce-submit': '提交了', 'reduce-cancel': '看到提示后放弃', 'reduce-cancel-verify': '验证时放弃' };
    const red = E.filter((e) => RED[e.e]).map((e) => e.v + '：' + RED[e.e]);
    L.push(red.length ? red.join('；') : '没有尝试');
    L.push('— 智安存 —');
    L.push('申请解锁：' + (E.some((e) => e.e === 'unlock') ? '是' : '否'));
    L.push('— 主持人跳转 —');
    const JUMP = { home: '首页', security: '户口保安', manage: '管理页', transfer: '转账', pause: '交易暂停' };
    const jumps = E.filter((e) => e.e === 'jump').map((e) => (JUMP[e.v] || e.v) + '（第 ' + Math.round(e.t) + ' 秒）');
    L.push(jumps.length ? jumps.join('；') : '没有');
    return L.join('\n');
  }
  function contactSummary() {
    const m = session.m, a = session.answers;
    const d1 = a.d1 || [];
    const dOk = (d1.indexOf('亲自打给家人（长者）') >= 0 || d1.indexOf('打通讯录里的银行官方热线') >= 0) && d1.indexOf('回复或点链接') < 0;
    return [
      '【判断】D（会打官方热线或家人）：' + (d1.length ? (dOk ? '通过' : '不通过') : '未答') + '；认出真通知：' + (a.d0 ? (a.d0 === '#HSBC（正确）' ? '是' : '否（' + a.d0 + '）') : '未答'),
      '打开顺序：' + (m.opens.length ? m.opens.join(' → ') : '没有打开任何短讯'),
      '第一条打开：' + (m.opens[0] || '—'),
      '#HSBC 短讯停留：' + Math.round(m.hsbcDwell) + ' 秒',
      '打开「户口安全」诈骗短讯：' + (m.opens.indexOf('+852 6000 4410') >= 0 ? '是' : '否') + '；打开「速递」诈骗短讯：' + (m.opens.indexOf('+852 6000 1827') >= 0 ? '是' : '否'),
      '事后指引短讯：' + (session.afterGuideShown ? '有显示' : '没有显示')
    ].join('\n');
  }
  function buildRecord() {
    const dur = secs();
    const head = '参与者：' + session.participant + '（' + session.role + '，' + session.age + '）\n开始：' + new Date(session.startedAt).toLocaleString('zh-CN', { hour12: false }) + '；用时：' + fmtDur(dur) + '；字体：' + (T.big ? '大' : '标准') + (session.role === '长者' ? '；联络人接电话：' + T.callOutcome : '');
    const body = session.role === '长者' ? elderSummary() : contactSummary();
    const answersText = questions().map((q, i) => (i + 1) + '. ' + q.q + '\n→ ' + fmtAns(session.answers[q.id])).join('\n');
    return {
      participant: session.participant, role: session.role, age: session.age,
      startedAt: session.startedAt, durationSec: Math.round(dur), summary: head + '\n' + body, answersText: answersText,
      answers: session.answers, events: session.events
    };
  }
  function submitToForm(rec) {
    const f = CFG.fields || {};
    if (!CFG.formAction || typeof fetch !== 'function') return Promise.resolve('noform');
    const body = new URLSearchParams();
    const put = (k, v) => { if (f[k]) body.append(f[k], v); };
    put('participant', rec.participant);
    put('role', rec.role);
    put('summary', rec.summary);
    put('answers', rec.answersText);
    put('events', JSON.stringify(rec.events));
    return fetch(CFG.formAction, { method: 'POST', mode: 'no-cors', body: body }).then(() => 'sent').catch(() => 'failed');
  }
  function csvOf(list) {
    const cell = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const head = ['参与者', '角色', '年龄段', '开始时间', '用时（秒）', '摘要', '问卷答案', '事件记录'];
    const rows = list.map((r) => [r.participant, r.role, r.age, r.startedAt, r.durationSec, r.summary, r.answersText, JSON.stringify(r.events)].map(cell).join(','));
    return '﻿' + [head.map(cell).join(',')].concat(rows).join('\r\n');
  }
  function download(name, text) {
    try {
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) { window.alert('这台手机不能下载文件，请改用「复制结果」。'); }
  }
  function copyText(text) {
    const done = () => window.alert('已复制，可以粘贴到微信或邮件。');
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { ta.setSelectionRange(0, text.length); } catch (e) { /* 忽略 */ }
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      if (ok) done(); else window.alert('复制失败。请打开「看这一场的结果」，长按文字手动复制。');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }
  function shareOrDownload(name, text) {
    try {
      const file = new File([text], name, { type: 'text/csv' });
      if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: name }).catch(() => {});
        return;
      }
    } catch (e) { /* 改用下载 */ }
    download(name, text);
  }

  // ---------- 动作 ----------
  const A = {
    // 通用导航
    go: (s) => nav(s),
    tab: (s) => nav(s),
    toPause: () => nav(S.paused ? 'pause' : 'home'),
    introFromHome: () => nav('tcIntro', { introFrom: 'home' }),
    closeBanner: () => { S.bannerOpen = false; ev('tap', '关闭邀请卡'); render(); },
    openTC: () => nav(S.setupDone ? 'tcManage' : 'tcIntro', { introFrom: 'security' }),
    notNow: () => { session.m.notNow += 1; ev('tap', '以后再说'); nav(S.introFrom); },
    // 登记
    showC2: () => { Object.assign(S, { showC2: true, c2name: S.c2name || '李美玲', c2rel: S.c2rel || '朋友', c2phone: S.c2phone || '5000 0202' }); render(); },
    hideC2: () => { Object.assign(S, { showC2: false, c2name: '', c2rel: '', c2phone: '' }); render(); },
    rel: (arg) => { const i = arg.indexOf('|'); S[arg.slice(0, i)] = arg.slice(i + 1); S.formError = ''; render(); },
    toScenarios: () => {
      if (!S.c1name.trim() || !S.c1phone.trim()) { S.formError = '请填写联络人 1 的姓名和手机号码。'; ev('error', S.formError); render(); return; }
      if (S.showC2 && S.c2name.trim() && !S.c2phone.trim()) { S.formError = '请填写联络人 2 的手机号码。'; ev('error', S.formError); render(); return; }
      nav('tcScenarios');
    },
    scenSetup: (k) => { S.scen = Object.assign({}, S.scen, { [k]: !S.scen[k] }); ev('scen-setup', findScen(k).title + '：' + (S.scen[k] ? '开' : '关')); render(); },
    step: (arg) => {
      const [where, which, dir] = arg.split('|');
      const d = Number(dir);
      if (where === 'setup') {
        let a = S.single, b = S.daily;
        if (which === 'single') a += d * 5000; else b += d * 10000;
        Object.assign(S, clampTh(a, b, which));
      } else {
        let a = S.adjSingle, b = S.adjDaily;
        if (which === 'single') a += d * 5000; else b += d * 10000;
        const r = clampTh(a, b, which);
        S.adjSingle = r.single; S.adjDaily = r.daily;
      }
      render();
    },
    resetAmount: () => { S.single = 10000; S.daily = 30000; render(); },
    toggleTerms: () => { S.termsOk = !S.termsOk; render(); },
    verifySetup: () => { if (S.termsOk) verify('finishSetup'); },
    simStart: (from) => nav('sim1', { simFrom: from }),
    simEnd: () => nav(S.simFrom || 'tcManage'),
    // 管理
    scenManage: (k) => switchScen(k),
    detail: (w) => nav('tcContactDetail', { detailWho: w }),
    reduce: (arg) => { const [kind, who] = arg.split('|'); openReduce(kind, who); },
    reduceVerify: () => verify('submitReduce'),
    withdraw: (id) => { const p = S.pending.find((x) => String(x.id) === String(id)); ev('withdraw', p ? p.text : id); S.pending = S.pending.filter((x) => String(x.id) !== String(id)); S.notice = '已撤回改动，设定维持不变。'; render(); },
    openEdit: () => nav('tcEditAmount', { adjSingle: S.single, adjDaily: S.daily }),
    confirmEdit: () => confirmEdit(),
    inviteSecondary: () => inviteSecondary(),
    // 转账
    amtChip: (v) => { S.amountText = Number(v).toLocaleString('en-US'); render(); },
    goReview: () => { const amt = parsedAmount(); if (amt > 0) nav('transferReview', { reviewAmount: amt }); },
    verifyTransfer: () => verify('submitTransfer'),
    callSheet: () => { pauseFirst('打给我的联络人'); S.sheet = 'call'; render(); },
    cancelSheet: () => { pauseFirst('取消这笔交易'); S.sheet = 'confirmCancel'; render(); },
    toBranch: () => { pauseFirst('急需用钱：到分行核实'); nav('branch'); },
    confirmCancel: () => confirmCancel(),
    call: (name) => startCall(name),
    endCall: () => { clearTimeout(callTimer); ev('tap', S.callState === 'noAnswer' ? '返回银行 App' : '挂断'); S.callState = ''; render(); },
    // 智安存
    verifyUnlock: () => verify('unlockSafe'),
    // 弹层
    doVerify: () => {
      const a = S.afterVerify;
      ev('verified', a);
      if (a === 'finishSetup') finishSetup();
      else if (a === 'submitTransfer') submitTransfer();
      else if (a === 'submitReduce') submitReduce();
      else if (a === 'unlockSafe') unlockSafe();
      else { S.sheet = ''; render(); }
    },
    closeSheet: () => {
      if (S.sheet === 'reduce') ev('reduce-cancel', reduceLabel(S.reduceKind));
      if (S.sheet === 'verify' && S.afterVerify === 'submitReduce') ev('reduce-cancel-verify', reduceLabel(S.reduceKind));
      if (S.sheet === 'verify' && S.afterVerify !== 'submitReduce') ev('verify-cancel', S.afterVerify);
      if (S.sheet === 'call' || S.sheet === 'confirmCancel') ev('tap', '关闭：' + S.sheet);
      S.sheet = ''; S.afterVerify = '';
      render();
    },
    // 联络人端
    openThread: (id) => {
      const t = threads().find((x) => x.id === id);
      C.open = id; C.read[id] = true;
      if (t) { session.m.opens.push(t.sender); ev('open', t.sender); }
      if (id === 'bank') C.openAt = Date.now();
      render();
    },
    closeThread: () => { closeThread(); render(); },
    // 主持人面板
    panelClose: () => { panelOpen = false; render(); },
    panelJump: (where) => {
      panelOpen = false;
      ev('jump', where);
      if (where === 'home' || where === 'security') { nav(where); return; }
      seedReady();
      if (where === 'manage') nav('tcManage');
      else if (where === 'transfer') nav('transfer');
      else if (where === 'pause') { S.paused = { amount: 200000, until: later(), ref: makeRef('TR') }; nav('pause'); }
    },
    panelOpt: (arg) => {
      const [k, v] = arg.split('|');
      if (k === 'call') T.callOutcome = v;
      if (k === 'font') T.big = v === '大';
      if (k === 'after') { T.afterGuide = v === '显示'; if (T.afterGuide) session.afterGuideShown = true; }
      ev('setting', k + '：' + v);
      render();
    },
    panelEnd: () => {
      panelOpen = false;
      if (mode === 'contact') closeThread();
      clearTimeout(callTimer);
      if (S) S.callState = '';
      ev('end', '');
      mode = 'survey';
      render();
    },
    panelAbort: () => {
      if (!window.confirm('放弃这一场？这一场的记录不会保存。')) return;
      panelOpen = false; resetAll(); render();
    },
    // 开始页
    startOpt: (arg) => { const i = arg.indexOf('|'); startForm[arg.slice(0, i)] = arg.slice(i + 1); render(); },
    startTest: () => {
      startForm.participant = nextParticipantId();
      commitParticipantId();
      startForm.err = '';
      T.big = false;
      T.callOutcome = '不接听';
      T.afterGuide = false;
      newSession();
      if (startForm.role === '长者') { S = freshS(); C = null; mode = 'elder'; ev('screen', '首页'); }
      else { C = freshC(); S = null; mode = 'contact'; ev('screen', '讯息列表'); }
      render();
    },
    exportCsv: () => {
      const list = savedSessions();
      if (!list.length) { window.alert('这台手机还没有记录。'); return; }
      shareOrDownload('指定联络人测试记录.csv', csvOf(list));
    },
    clearAll: () => {
      if (!window.confirm('清除这台手机上的全部测试记录？已送出到表格的不受影响。')) return;
      store.set(STORE_KEY, []); startForm.participant = ''; render();
    },
    openRecords: () => { if (mode === 'submitted') resetAll(); mode = 'records'; render(); },
    backToStart: () => { mode = 'start'; render(); },
    copyAll: () => {
      const list = savedSessions();
      copyText(list.map(recordText).join('\n\n==========\n\n'));
    },
    copyOne: (i) => { const r = savedSessions()[Number(i)]; if (r) copyText(recordText(r)); },
    // 问卷
    ans: (arg) => { const i = arg.indexOf('|'); const id = arg.slice(0, i), v = arg.slice(i + 1); session.answers[id] = session.answers[id] === v ? '' : v; render(); },
    ansMulti: (arg) => {
      const i = arg.indexOf('|'); const id = arg.slice(0, i), v = arg.slice(i + 1);
      const cur = Array.isArray(session.answers[id]) ? session.answers[id].slice() : [];
      const k = cur.indexOf(v);
      if (k >= 0) cur.splice(k, 1); else cur.push(v);
      session.answers[id] = cur; render();
    },
    backToTest: () => { mode = session.role === '长者' ? 'elder' : 'contact'; render(); },
    submitSurvey: () => {
      const rec = buildRecord();
      lastRecord = rec;
      const list = savedSessions(); list.push(rec); store.set(STORE_KEY, list);
      submitStatus = 'sending';
      mode = 'submitted';
      render();
      submitToForm(rec).then((s) => { submitStatus = s; if (mode === 'submitted') render(); });
    },
    copyResult: () => { const ta = document.getElementById('resultText'); copyText(ta ? ta.value : ''); },
    nextParticipant: () => { resetAll(); render(); }
  };

  function resetAll() {
    clearTimeout(callTimer); clearTimeout(acceptTimer);
    session = null; S = null; C = null; panelOpen = false; lastRecord = null; submitStatus = '';
    T.big = false; T.afterGuide = false;
    startForm.participant = ''; startForm.err = '';
    mode = 'start';
  }

  // ---------- 渲染 ----------
  function render() {
    let out;
    if (mode === 'start') out = renderStart();
    else if (mode === 'survey') out = renderSurvey();
    else if (mode === 'submitted') out = renderSubmitted();
    else if (mode === 'records') out = renderRecords();
    else if (mode === 'contact') out = renderContact();
    else out = renderElder();
    const oldScroll = app.querySelector('.scroll, .plain');
    const keep = (oldScroll && lastKey === out.key) ? oldScroll.scrollTop : 0;
    app.classList.toggle('big', T.big);
    app.innerHTML = out.html;
    const sc = app.querySelector('.scroll, .plain');
    if (sc) sc.scrollTop = keep;
    if (lastKey !== out.key) { const msgs = app.querySelector('.msgs'); if (msgs) msgs.scrollTop = msgs.scrollHeight; }
    lastKey = out.key;
  }

  // ---------- 事件 ----------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = A[el.dataset.act];
    if (!fn) return;
    e.preventDefault();
    fn(el.dataset.arg);
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.bind) {
      if (mode === 'start') { startForm[t.dataset.bind] = t.value; return; }
      if (S) {
        S[t.dataset.bind] = t.value;
        if (t.dataset.bind === 'amountText') { const b = document.getElementById('goReview'); if (b) b.disabled = !(parsedAmount() > 0); }
      }
    }
    if (t.dataset && t.dataset.ans && session) session.answers[t.dataset.ans] = t.value;
  });
  // 主持人面板：长按水印，或连按 5 下
  let pressTimer = null, taps = 0, tapTimer = null;
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.wm')) return;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(openPanel, 800);
  });
  ['pointerup', 'pointercancel'].forEach((n) => document.addEventListener(n, () => clearTimeout(pressTimer)));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.wm')) return;
    taps += 1;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { taps = 0; }, 1500);
    if (taps >= 5) { taps = 0; openPanel(); }
  });
  window.addEventListener('beforeunload', (e) => {
    if (session && (mode === 'elder' || mode === 'contact' || mode === 'survey')) { e.preventDefault(); e.returnValue = ''; }
  });

  // 给自动检查用
  window.__tc = { get mode() { return mode; }, get S() { return S; }, get session() { return session; }, A: A };

  render();
})();
