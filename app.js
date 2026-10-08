/* Chinbilig · Jiu-jitsu. Static, no build. Data: Supabase docs table (paths bjj/*) or localStorage. */
(function () {
"use strict";
const SEED = window.BJJ_SEED;
const CFG = window.APP_CONFIG || {};
const LKEY = "bjj-v1";
const KEYS = ["tree", "plans", "log", "body", "belt", "weight", "comp", "rolls", "settings"];
const NS = () => "bjj/u/" + SB.uid() + "/";
const MEMBER_DOMAIN = CFG.memberDomain || "member.bjjclub.mn";
/* ---------- language: Mongolian by default, English on request. Text is translated in the DOM as it renders. ---------- */
const I18N = {
  lang: "mn", obs: null, names: null,
  pack() { return (window.BJJ_LANG || {})[this.lang] || null; },
  tr(t) { const p = this.pack(); if (!p) return t; const k = t.trim(); if (!k) return t; const d = p.dict[k]; if (this.names && this.names.has(k)) return t.replace(k, this.names.get(k)); if (d != null) return t.replace(k, d); if (this.names && this.names.has(k)) return t.replace(k, this.names.get(k)); for (const r of p.rules) { if (r[0].test(k)) { const out = k.replace(r[0], r[1]); if (out !== k) return t.replace(k, this.swapNames(out)); } } if (k.includes(" · ")) { const parts = k.split(" · "); const out = parts.map((p0) => this.one(p0)).join(" · "); if (out !== k) return t.replace(k, out); } if (/[A-Za-z]{3}/.test(k) && this.nameRe) { const out = this.swapNames(k); if (out !== k) return t.replace(k, out); } return t; },
  one(k) { const p = this.pack(); const d = p.dict[k]; if (d != null) return d; if (this.names && this.names.has(k)) return this.names.get(k); for (const r of p.rules) if (r[0].test(k)) { const out = k.replace(r[0], r[1]); if (out !== k) return this.swapNames(out); } return this.swapNames(k); },
  swapNames(t) { if (!this.nameRe) return t; return t.replace(this.nameRe, (m) => this.names.get(m) || m); },
  node(n) { if (n.nodeType === 3) { const v = n.nodeValue; if (n.__i18n === v) return; const o = this.tr(v); if (o !== v) { n.nodeValue = o; n.__i18n = o; } else n.__i18n = v; return; } if (n.nodeType !== 1 || n.tagName === "SCRIPT" || n.tagName === "STYLE") return; for (const a of ["placeholder", "aria-label", "title"]) { const v = n.getAttribute(a); if (v) { const o = this.tr(v); if (o !== v) n.setAttribute(a, o); } } const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) this.node(t); n.querySelectorAll("[placeholder],[aria-label],[title]").forEach((e) => { for (const a of ["placeholder", "aria-label", "title"]) { const v = e.getAttribute(a); if (v) { const o = this.tr(v); if (o !== v) e.setAttribute(a, o); } } }); },
  buildNames() { this.names = new Map(); for (const n of nodes()) if (n.en && n.n) this.names.set(n.n, n.n); const keys = [...this.names.keys()].filter((k) => k.length > 3).sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); this.nameRe = keys.length ? new RegExp("(?<![\\p{L}])(?:" + keys.join("|") + ")(?![\\p{L}])", "gu") : null; },
  start() { if (this.obs) return; this.buildNames(); this.node(document.body); document.documentElement.lang = "mn"; this.obs = new MutationObserver((muts) => { for (const m of muts) { if (m.type === "characterData") this.node(m.target); else for (const a of m.addedNodes) this.node(a); } }); this.obs.observe(document.body, { childList: true, subtree: true, characterData: true }); },
  stop() { if (this.obs) { this.obs.disconnect(); this.obs = null; } document.documentElement.lang = "en"; },
  set(l) { this.lang = l; try { localStorage.setItem("bjj-lang", l); } catch (e) {} if (l === "mn") this.start(); else this.stop(); },
};
function dn(n) { return n.n; }
function tr(t) { return I18N.lang === "mn" ? I18N.tr(t) : t; }
function emailOf(login) { login = String(login || "").trim().toLowerCase(); return login.includes("@") ? login : login.replace(/[^a-z0-9._-]/g, "") + "@" + MEMBER_DOMAIN; }
function loginName(email) { return String(email || "").replace("@" + MEMBER_DOMAIN, ""); }
const TAB_ALIAS = { train: "me", log: "me", drills: "me", body: "me", belt: "me", weight: "me", comp: "me" };

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = (o) => JSON.parse(JSON.stringify(o));
const pad = (n) => (n < 10 ? "0" : "") + n;
function todayIso() { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function addDays(iso, n) { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function mondayOf(iso) { const d = new Date(iso + "T12:00:00"); const w = (d.getDay() + 6) % 7; return addDays(iso, -w); }
function daysBetween(a, b) { return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000); }
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function fmtD(iso) { if (!iso) return ""; const d = new Date(iso + "T12:00:00"); return (d.getMonth() + 1) + "/" + d.getDate() + " " + WD[d.getDay()]; }
function fmtLong(iso) { if (!iso) return ""; const d = new Date(iso + "T12:00:00"); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
function monthsSince(iso) { if (!iso) return 0; const a = new Date(iso + "T12:00:00"), b = new Date(); return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth() - (b.getDate() < a.getDate() ? 1 : 0)); }
function sv(id) { const el = $(id); return el ? el.value : ""; }
function lines(s) { return String(s || "").split("\n").map((x) => x.trim()).filter(Boolean); }
const CHEV = '<svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12l5 5L19 7"/></svg>';

/* ---------- Supabase (plain REST) ---------- */
const SB = {
  url: (CFG.supabaseUrl || "").replace(/\/$/, ""), key: CFG.supabaseAnonKey || "", session: null,
  configured() { return !!(this.url && this.key); },
  loadSession() { try { this.session = JSON.parse(sessionStorage.getItem("cb-sb-session") || localStorage.getItem("cb-sb-session") || "null"); } catch (e) { this.session = null; } },
  storeSession(s) { this.session = s; try { localStorage.removeItem("cb-sb-session"); sessionStorage.removeItem("cb-sb-session"); if (s) (localStorage.getItem("arrow-remember") === "0" ? sessionStorage : localStorage).setItem("cb-sb-session", JSON.stringify(s)); } catch (e) {} },
  async auth(body, grant) {
    const r = await fetch(this.url + "/auth/v1/token?grant_type=" + grant, { method: "POST", headers: { apikey: this.key, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error_description || j.msg || "auth");
    this.storeSession({ access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000, email: j.user && j.user.email, uid: j.user && j.user.id, name: j.user && j.user.user_metadata && j.user.user_metadata.name || "", birthDate: j.user && j.user.user_metadata && j.user.user_metadata.birthDate || "", username: j.user && j.user.user_metadata && j.user.user_metadata.username || "" }); return this.session;
  },
  login(email, password) { return this.auth({ email, password }, "password"); },
  async signup(email, password, name, birthDate, username) {
    const r = await fetch(this.url + "/auth/v1/signup", { method: "POST", headers: { apikey: this.key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password, data: { name, ...(birthDate?{birthDate}:{}), username } }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error_description || j.msg || j.message || "signup");
    if (j.access_token) { this.storeSession({ access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000, email: j.user && j.user.email, uid: j.user && j.user.id, name, birthDate, username }); return true; }
    return false;
  },
  // creates a login for someone else (coach adds a member); the returned session is ignored so the coach stays signed in
  async createUser(email, password, name, birthDate, username) { const r = await fetch(this.url + "/auth/v1/signup", { method: "POST", headers: { apikey: this.key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password, data: { name, ...(birthDate?{birthDate}:{}), username } }) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error_description || j.msg || j.message || "signup"); const id = (j.user && j.user.id) || j.id; if (!id) throw new Error("no user id"); return { id, confirmed: !!j.access_token }; },
  uid() { const s = this.session; if (!s) return ""; if (!s.uid && s.access) { try { s.uid = JSON.parse(atob(s.access.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub; } catch (e) {} } return s.uid || ""; },
  async token() {
    if (!this.session) throw new Error("noauth");
    if (Date.now() > this.session.exp - 60000) { try { await this.auth({ refresh_token: this.session.refresh }, "refresh_token"); } catch (e) { this.storeSession(null); throw new Error("noauth"); } }
    return this.session.access;
  },
  async req(path, opt) {
    opt = opt || {}; const t = await this.token();
    const r = await fetch(this.url + path, Object.assign({}, opt, { headers: Object.assign({ apikey: this.key, Authorization: "Bearer " + t }, opt.headers || {}) }));
    if (r.status === 401) { this.storeSession(null); throw new Error("noauth"); }
    if (!r.ok) throw new Error("http " + r.status); return r;
  },
  async get(path) { const r = await this.req("/rest/v1/docs?select=data&path=eq." + encodeURIComponent(path)); const rows = await r.json(); return rows.length ? rows[0].data : null; },
  async list(prefix) { const r = await this.req("/rest/v1/docs?select=path,data&path=like." + encodeURIComponent(prefix + "*")); return r.json(); },
  set(path, data) { return this.req("/rest/v1/docs", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ path, data, updated_at: new Date().toISOString() }) }); },
};

/* ---------- state ---------- */
function blank() {
  return {
    tree: { nodes: [] },
    plans: { items: [], setups: [] },
    log: { items: [] },
    body: { routines: [], items: [], drills: [] },
    belt: { track: "kids", belt: "white", stripes: 0, since: "", history: [], goals: {} },
    weight: { items: [], cls: "adult_m", target: "" },
    comp: { events: [] },
    rolls: { items: [] },
    settings: { theme: "system", timer: { work: 5, rest: 1, rounds: 5 }, seeded: false },
  };
}
let S = blank();
let mode = "local";
const UI = { tab: "home", tech: { id: null, q: "", view: "pos", map: false }, body: { cat: "warm", open: null }, comp: { id: null }, confirm: null, sheet: null, anim: "" };
UI.seg = { me: "prog" }; UI.clubSeg = "today"; UI.memF = "all"; UI.attDate = "";
try { const t = localStorage.getItem("bjj-tab"); if (t) { if (TAB_ALIAS[t]) { UI.tab = TAB_ALIAS[t]; if (t !== "train") UI.seg[UI.tab] = t; } else UI.tab = t; } if (localStorage.getItem("bjj-map") === "1") UI.tech.map = true; } catch (e) {}

function seedAll(force) {
  if (force || !S.tree.nodes.length) S.tree.nodes = SEED.nodes();
  if (force || !S.plans.items.length) S.plans.items = SEED.plans.map((p) => Object.assign({ id: uid() }, clone(p)));
  if (force || !S.body.routines.length) S.body.routines = SEED.routines.map((r) => Object.assign({ id: uid() }, clone(r)));
  S.settings.seeded = true; S.settings.seedVer = SEED.version || 1;
}
function mergeSeed() {
  const ver = SEED.version || 1; if ((S.settings.seedVer || 1) >= ver) return false;
  const have = new Map(nodes().map((n) => [n.id, n])); let added = 0; const FIELDS = ["gi", "belt", "pts", "energy", "when", "oc", "bait", "kids", "legal", "f", "rank", "them"];
  for (const n of SEED.nodes()) { const ex = have.get(n.id); if (!ex) { if (!n.p || have.has(n.p)) { nodes().push(n); have.set(n.id, n); added++; } } else for (const k of FIELDS) if (ex[k] === undefined && n[k] !== undefined) ex[k] = n[k]; }
  S.settings.seedVer = ver; return added;
}
function normalize() {
  const b = blank();
  for (const k of KEYS) { if (!S[k] || typeof S[k] !== "object") S[k] = b[k]; for (const f in b[k]) if (S[k][f] == null) S[k][f] = b[k][f]; }
  if (!S.settings.timer) S.settings.timer = b.settings.timer;
}

/* ---------- persistence ---------- */
const dirty = {}, timers = {}, chains = {};
function setSync() {}

function save(key) {
  dirty[key] = 1; setSync(mode === "cloud" ? "saving" : "local");
  clearTimeout(timers[key]); timers[key] = setTimeout(() => flush(key), 600);
}
function flush(key) {
  const run = async () => {
    try {
      if (mode === "cloud") await SB.set(NS() + key, clone(S[key]));
      else localStorage.setItem(LKEY, JSON.stringify(S));
      delete dirty[key]; if (!Object.keys(dirty).length) setSync(mode === "cloud" ? "ok" : "local");
    } catch (e) { if (e.message === "noauth") showLogin("Please sign in again."); else setSync("err", "Could not save, retrying"); setTimeout(() => flush(key), 5000); }
  };
  chains[key] = (chains[key] || Promise.resolve()).then(run, run); return chains[key];
}

async function startCloud() {
  const stopProgress=()=>{};
  try {
    let rows = await SB.list(NS()); let legacy = false;
    if (!rows.length) { const old = await SB.list("bjj/"); rows = old.filter((r) => KEYS.includes(r.path.slice(4))).map((r) => ({ path: NS() + r.path.slice(4), data: r.data })); legacy = rows.length > 0; }
    for (const r of rows) { const k = r.path.slice(NS().length); if (KEYS.includes(k)) S[k] = r.data; }
    normalize();
    if (legacy) for (const k of KEYS) await SB.set(NS() + k, clone(S[k]));
    if (!S.settings.seeded) { seedAll(false); for (const k of ["tree", "plans", "body", "belt", "settings"]) await SB.set(NS() + k, clone(S[k])); }
    { const added = mergeSeed(); if (added) { await SB.set(NS() + "tree", clone(S.tree)); await SB.set(NS() + "settings", clone(S.settings)); } }
    await window.ARROW_UI.wait(document.querySelector('#login button[aria-busy="true"]'));
    mode = "cloud"; applyTheme(); if (S.settings.lang && S.settings.lang !== I18N.lang) I18N.set(S.settings.lang); if (I18N.lang === "mn") I18N.buildNames(); setSync("ok"); document.body.classList.remove("locked"); render();
    if (S.settings.lastAdded) { toast(S.settings.lastAdded + " new moves added to the library"); delete S.settings.lastAdded; }
    joinPending();
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && !Object.keys(dirty).length) refresh(); });
  } catch (e) { if (e.message === "noauth") showLogin(); else { $("boot-splash")?.remove(); $("main").innerHTML=shimmer("feed")+'<button class="btn wide" data-act="boot-retry">Try again</button>'; setSync("err", "Could not connect"); console.error(e); } } finally {stopProgress();}
}
async function refresh() {
  try { const rows = await SB.list(NS()); let ch = false; for (const r of rows) { const k = r.path.slice(NS().length); if (KEYS.includes(k) && !dirty[k] && JSON.stringify(S[k]) !== JSON.stringify(r.data)) { S[k] = r.data; ch = true; } } if (ch) { normalize(); render(); } } catch (e) {}
}
/* Club QR: <app>?checkin=<clubId>&c=<club code>, one permanent code per club, printed at the door. Scanning it marks today's
   attendance; someone who is not a member yet joins the club first. <app>?join=… does the join only. The pair waits in
   localStorage `bjj-join` until the person has an account. */
function parseJoinParams(q) { const ci = q.get("checkin"), j = q.get("join"); if (!ci && !j) return null; return { id: ci || j, code: (q.get("c") || "").trim().toUpperCase(), att: !!ci }; }
function pendingJoin() { try { const j = JSON.parse(localStorage.getItem("bjj-join") || "null"); return j && j.id ? j : null; } catch (e) { return null; } }
function joinBanner() { const j = pendingJoin(); if (!j) return ""; const c = (SEED.clubs || []).find((x) => x.id === j.id); return '<div class="tip"><span>' + (j.att ? "Checking in at" : "You are joining") + "</span> <b>" + esc(c ? c.n : "your club") + "</b></div>"; }
async function joinPending() {
  const j = pendingJoin(); if (!j) return; try { localStorage.removeItem("bjj-join"); } catch (e) {}
  while (CLUB.busy) await new Promise((r) => setTimeout(r, 60)); if (clubNeeds()) await clubLoad();
  const finish = async () => { if (j.att) await checkinWith(j.code); else { UI.tab = "home"; render(); } };
  if (S.settings.clubId === j.id) { await finish(); return; }
  const doJoin = async () => { if (S.settings.clubId) await clubLeave(); await clubJoin(j.id, j.code, false); if (S.settings.clubId === j.id) await finish(); };
  if (S.settings.clubId) { openSheet("Switch club?", '<p class="small">You are a member of another club. Leave it and join the new one?</p>', { saveLabel: "Join", onSave() { doJoin(); return true; } }); return; }
  await doJoin();
}
async function checkinWith(code) {
  const P = CLUB.profile; if (!P) return false;
  if ((code || "").toUpperCase() !== (P.code || "").toUpperCase()) { toast("Wrong club code"); return false; }
  try {
    let result;
    if(mode==='cloud') {
      const r=await fetch('/api/check-in',{method:'POST',headers:{Authorization:'Bearer '+await SB.token(),'Content-Type':'application/json'},body:JSON.stringify({club:CLUB.id,code}),signal:AbortSignal.timeout(20000)});
      result=await r.json();if(!r.ok){toast(result.reason==='window'?'QR check-in opens 60 minutes before class and closes 40 minutes after it starts.':result.error||'Could not check in');return false;}
    } else {
      const slot=window.ARROW_CHECKIN.windowFor(P.schedule,myTrack(),Date.now(),P.timezone||'Asia/Ulaanbaatar',isAdmin());
      if(!slot){toast('QR check-in opens 60 minutes before class and closes 40 minutes after it starts.');return false;}
      await attMark(slot.date,true);result={date:slot.date,attendance:CLUB.att.doc};
    }
    CLUB.att={ym:result.date.slice(0,7),doc:result.attendance};if(CLUB.att.ym===thisMonth())CLUB.attMonth=result.attendance;
    UI.tab='club';UI.clubSeg='today';render();toast('Checked in · '+P.n);return true;
  }catch(e){toast('Could not check in');return false;}
}

/* member side: the middle tab button opens the camera and scans the club QR (BarcodeDetector, else jsQR loaded on demand);
   the club code can be typed instead. */
let SCAN = null; const SCAN_LIB = { p: null };
function canScan() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.isSecureContext || location.hostname === "localhost")); }
function checkinSheet(auto) {
  const P = CLUB.profile; const today = todayIso(); const inClub = !!(P && !clubNeeds());
  const b = (canScan() ? '<div class="scanbox" id="scan-box"><video id="scan-v" playsinline muted></video><p class="muted small scan-msg" id="scan-msg">Point the camera at the club QR at the door.</p><button class="btn wide" data-act="scan-start">Open the camera</button></div>' : '<p class="muted small">The camera is not available here: open the phone camera and point it at the QR instead.</p>') +
    (inClub ? (attDays(CLUB.attMonth, myUid()).includes(today) ? '<p class="tip good">You are already checked in for today.</p>' : "") + field("ci-code", "Or type the club code", inp("ci-code", "", "text", 'autocapitalize="characters" autocomplete="off" maxlength="8" placeholder="6 characters"')) : '<p class="small">Not in a club yet? The QR at your club\'s door signs you up too.</p><button class="btn ghost wide" data-act="tab" data-v="club">Find my club</button>');
  if (!("BarcodeDetector" in window) && typeof jsQR !== "function" && !SCAN_LIB.p && canScan()) SCAN_LIB.p = loadScript("vendor/jsQR.js?v=1").catch(() => { SCAN_LIB.p = null; });
  openSheet("Check in", b, inClub ? { saveLabel: "Check in", async onSave() { const t = sv("ci-code").trim().toUpperCase(); if (!t) { $("ci-code").focus(); return false; } return await checkinWith(t); } } : {});
  if (auto && canScan()) cameraGranted().then(granted=>{if(granted && $("scan-v"))scanStart();});
}
function loadScript(src) { return new Promise((res, rej) => { const e = document.createElement("script"); e.src = src; e.onload = res; e.onerror = rej; document.head.appendChild(e); }); }
async function scanStart() {
  const v = $("scan-v"); if (!v || SCAN || v.dataset.starting) return; v.dataset.starting="1"; const msg = $("scan-msg");
  try {
    const need = !("BarcodeDetector" in window) && typeof jsQR !== "function"; const lib = need ? (SCAN_LIB.p || (SCAN_LIB.p = loadScript("vendor/jsQR.js?v=1"))) : null;
    const st = await acquireCamera(); if (document.visibilityState!=="visible" || !v.isConnected || !$("sheet").classList.contains("open")) { releaseCamera(); return; } st.getTracks().forEach(t=>t.enabled=true); v.srcObject = st; await v.play();
    if (lib) { if (msg) msg.textContent = tr(""); await lib; } $("scan-box").classList.add("on"); if (msg) msg.textContent = tr("Point the camera at the club QR at the door.");
    SCAN = { st, det: "BarcodeDetector" in window ? new BarcodeDetector({ formats: ["qr_code"] }) : null, on: true }; scanLoop();
  } catch (e) { if (msg) msg.textContent = tr("Camera not available") + ". " + tr("Allow the camera in the browser settings, or type the code."); else toast("Camera not available"); releaseCamera(); } finally {delete v.dataset.starting;}
}
async function scanLoop(scan=SCAN) {
  if (!scan || scan!==SCAN || !scan.on) return; const v = $("scan-v"); if (!v || !v.isConnected) { scanStop(); return; }
  try {
    let raw = "";
    if (SCAN.det) { const codes = await SCAN.det.detect(v); const c = codes.find((x) => x.rawValue); raw = c ? c.rawValue : ""; }
    else if (v.videoWidth) { const cv = SCAN.cv || (SCAN.cv = document.createElement("canvas")); const w = Math.min(640, v.videoWidth), h = Math.round((w * v.videoHeight) / v.videoWidth); cv.width = w; cv.height = h; const g = cv.getContext("2d", { willReadFrequently: true }); g.drawImage(v, 0, 0, w, h); const im = g.getImageData(0, 0, w, h); const r = jsQR(im.data, w, h, { inversionAttempts: "dontInvert" }); raw = r && r.data || ""; }
    if (SCAN!==scan || !scan.on) return; if (raw) { scanStop(); handleScan(raw); return; }
  } catch (e) {}
  setTimeout(()=>scanLoop(scan), 200);
}
const CAMERA={stream:null,pending:null,timer:null};
async function cameraGranted(){if(CAMERA.stream?.getTracks().some(t=>t.readyState==='live'))return true;try{return (await navigator.permissions.query({name:'camera'})).state==='granted';}catch(_){return false;}}
async function acquireCamera(){clearTimeout(CAMERA.timer);if(CAMERA.stream?.getTracks().some(t=>t.readyState==='live'))return CAMERA.stream;if(!CAMERA.pending)CAMERA.pending=navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:1280}}}).then(st=>CAMERA.stream=st).finally(()=>CAMERA.pending=null);return CAMERA.pending;}
function releaseCamera(){clearTimeout(CAMERA.timer);CAMERA.stream?.getTracks().forEach(t=>t.stop());CAMERA.stream=null;}
function scanStop(){if(SCAN){SCAN.on=false;SCAN=null;}const video=$('scan-v');if(video){video.pause();video.srcObject=null;}CAMERA.stream?.getTracks().forEach(t=>t.enabled=false);clearTimeout(CAMERA.timer);CAMERA.timer=setTimeout(releaseCamera,30000);}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){scanStop();releaseCamera();}});window.addEventListener('pagehide',()=>{scanStop();releaseCamera();});
function handleScan(url) { let j = null; try { j = parseJoinParams(new URL(url, location.href).searchParams); } catch (e) {} if (!j) { toast("Not a club QR"); const m = $("scan-msg"); if (m) m.textContent = tr("Not a club QR"); setTimeout(() => { if (UI.sheet && $("scan-v")) scanStart(); }, 1200); return; } try { localStorage.setItem("bjj-join", JSON.stringify(j)); } catch (e) {} closeSheet(); joinPending(); }
function appBase() { return location.origin + location.pathname.replace(/index\.html$/, ""); }
function checkinLink() { return appBase() + "?checkin=" + encodeURIComponent(CLUB.id) + "&c=" + encodeURIComponent((CLUB.profile && CLUB.profile.code) || ""); }
function qrSheet() {
  if (!CLUB.profile) return; const url = checkinLink(); const svg = window.QR ? QR.svg(url) : "";
  const b = '<h3>' + esc(CLUB.profile.n) + "</h3>" +
    '<p class="small">Print this once and put it at the door. Members scan it (Record → I\'m on the mat, or the phone camera) and today\'s attendance is marked; a new person joins the club with it.</p>' +
    '<div class="qrbox" id="qr-box">' + (svg || '<p class="empty">The link is too long for a QR code.</p>') + "</div>" +
    '<div class="codes big" style="text-align:center"><span>Club code<b>' + esc(CLUB.profile.code || "—") + "</b></span></div>" +
    '<button class="btn wide" data-act="qr-save">Save the poster</button><div class="grid2"><button class="btn ghost" data-act="qr-copy" data-url="' + esc(url) + '">Copy link</button><button class="btn ghost" data-act="qr-share" data-url="' + esc(url) + '">Share</button></div>';
  openSheet("Club QR", b, {}); QR_IMG.blob = null; qrImage().then((bl) => { QR_IMG.blob = bl; });
}
const QR_IMG = { blob: null };
async function qrImage() {
  const url = checkinLink(); const q = window.QR && QR.matrix(url); if (!q) return null; const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, W, H); g.fillStyle = "#fc5200"; g.fillRect(0, 0, W, 24); g.fillStyle = "#111"; g.textAlign = "center"; g.font = "700 72px -apple-system, Helvetica, Arial, sans-serif";
  const name = CLUB.profile.n; let fs = 72; while (fs > 36 && g.measureText(name).width > W - 120) { fs -= 4; g.font = "700 " + fs + "px -apple-system, Helvetica, Arial, sans-serif"; } g.fillText(name, W / 2, 150);
  g.font = "600 44px -apple-system, Helvetica, Arial, sans-serif"; g.fillStyle = "#fc5200"; g.fillText(tr("Scan to check in"), W / 2, 230);
  const n = q.length, z = 3, cell = Math.floor(820 / (n + 2 * z)), side = cell * (n + 2 * z), x0 = Math.round((W - side) / 2), y0 = 290; g.fillStyle = "#000";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q[r][c]) g.fillRect(x0 + (c + z) * cell, y0 + (r + z) * cell, cell, cell);
  let y = y0 + side + 80; g.fillStyle = "#111"; g.font = "600 36px -apple-system, Helvetica, Arial, sans-serif"; g.fillText(tr("Club code"), W / 2, y); g.font = "800 96px -apple-system, Helvetica, Arial, sans-serif"; g.fillText(String(CLUB.profile.code || "").split("").join(" "), W / 2, y + 110); y += 190;
  g.fillStyle = "#555"; g.font = "500 34px -apple-system, Helvetica, Arial, sans-serif"; g.fillText(tr("In the app: Record → I'm on the mat → Scan the QR."), W / 2, y);
  return new Promise((res) => cv.toBlob(res, "image/png"));
}
async function qrSend(save) {
  const blob = QR_IMG.blob || (await qrImage()); if (!blob) return; const file = new File([blob], "club-qr-" + CLUB.id + ".png", { type: "image/png" });
  if (!save && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: CLUB.profile.n }); return; } catch (e) { if (e.name === "AbortError") return; } }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast("Image saved");
}
function startLocal() {
  try { const j = JSON.parse(localStorage.getItem(LKEY) || "null"); if (j) S = j; } catch (e) {}
  normalize(); if (!S.settings.seeded) { seedAll(false); localStorage.setItem(LKEY, JSON.stringify(S)); } else if (mergeSeed()) localStorage.setItem(LKEY, JSON.stringify(S));
  mode = "local"; applyTheme(); if (S.settings.lang && S.settings.lang !== I18N.lang) I18N.set(S.settings.lang); if (I18N.lang === "mn") I18N.buildNames(); setSync("local"); render(); joinPending();
}
function buttonBusy(button,busy){window.ARROW_UI.busy(button,busy);}
function rememberLogin(login) { try { const remember = !$('lg-remember') || $('lg-remember').checked; localStorage.setItem('arrow-remember',remember?'1':'0'); if (remember) localStorage.setItem('arrow-login',login); else localStorage.removeItem('arrow-login'); } catch(e) {} }
function showLogin(msg, signup) {
  $("boot-splash")?.remove();
  document.body.classList.add('locked'); $('tabs').innerHTML = ''; $('belt').innerHTML = '';
  let remembered=''; try { remembered=localStorage.getItem('arrow-login')||''; } catch(e) {}
  $('main').innerHTML = '<form class="card auth-card" id="login"><span class="eyebrow">ARROW JIU-JITSU</span><h2>'+(signup?'Create your account':'Sign in')+'</h2>'+joinBanner()+(msg?'<p role="alert" class="auth-message">'+esc(msg)+'</p>':'')+
    (signup?'<div class="field"><label for="lg-n">Real name</label><input id="lg-n" type="text" autocomplete="name" required placeholder="Бат-Эрдэнэ"><small class="muted">Нэрээ кирилл үсгээр бичнэ үү.</small></div>':'')+
    '<div class="field"><label for="lg-e">'+(signup?'Username':'Email or username')+'</label><input id="lg-e" type="text" autocomplete="username" required autocapitalize="none" autocorrect="off" spellcheck="false" value="'+esc(signup?'':remembered)+'"></div>'+
    '<div class="field"><label for="lg-p">Password</label><input id="lg-p" type="password" autocomplete="'+(signup?'new-password':'current-password')+'" required'+(signup?' minlength="8"':'')+'></div><label class="remember-row"><input type="checkbox" id="lg-remember"'+(localStorage.getItem('arrow-remember')==='0'?'':' checked')+'>Remember me</label>'+
    '<button class="btn wide" type="submit">'+(signup?'Create account':'Sign in')+'</button><button class="btn ghost wide" type="button" data-act="auth-mode" data-v="'+(signup?'in':'up')+'">'+(signup?'I already have an account':'New here? Create an account')+'</button>'+(!signup?'<div class="auth-recovery"><button type="button" class="btn ghost" data-recovery="username">Forgot username?</button><button type="button" class="btn ghost" data-recovery="password">Forgot password?</button></div>':'')+'</form>';
  $('login').addEventListener('submit',async(e)=>{e.preventDefault();const button=e.target.querySelector('button[type="submit"]');if(button.disabled)return;const login=sv('lg-e'),name=sv('lg-n').trim(),un=A.username(login);
    if(signup&&!A.validUsername(un)){toast('Enter a valid username');return;}
    if(signup&&!/^[А-Яа-яЁёӨөҮү\s.'’-]+$/.test(name)){toast('Нэрээ кирилл үсгээр бичнэ үү.');return;}
    rememberLogin(login);buttonBusy(button,true,signup?'Бүртгэж байна…':'Нэвтэрч байна…');
    try {if(signup){const ok=await SB.signup(emailOf(un),sv('lg-p'),name,undefined,un);if(!ok){showLogin('Бүртгэл үүслээ. Нэвтэрч чадахгүй бол клубийн коучтай холбогдоно уу.');return;}}else await SB.login(emailOf(login),sv('lg-p')); S=blank();await startCloud();}
    catch(err){const message=signup?String(err.message||err):'Wrong email or password.';const notice=document.createElement('p');notice.className='auth-message';notice.setAttribute('role','alert');notice.textContent=tr(message);e.target.querySelector('.auth-message')?.remove();e.target.prepend(notice);}
    finally{buttonBusy(button,false);}
  });
}
function recoverySheet(kind) {
  let saved='';try{saved=localStorage.getItem('arrow-login')||'';}catch(e){}
  if(kind==='username'){openSheet('Forgot username?','<p>Хэрэглэгчийн нэрээ мартсан бол клубийн коучтай холбогдоорой. Коуч гишүүдийн жагсаалтаас таны нэрийг шалгаж өгнө.</p>'+(saved?'<p>Энэ төхөөрөмжид хадгалсан нэвтрэх нэр: <b>'+esc(saved)+'</b></p>':'')+'<p class="muted">Имэйлээр бүртгүүлсэн бол имэйлээрээ нэвтэрч болно.</p>',{});return;}
  openSheet('Forgot password?','<p>Бодит имэйлээр бүртгүүлсэн бол сэргээх холбоос авна. Зөвхөн username ашигладаг эрхээ сэргээхийн тулд клубийн коучтай холбогдоно уу.</p>'+field('recover-email','Email',inp('recover-email','','email','required autocomplete="email"'))+'<p id="recovery-result" role="status"></p>',{saveLabel:'Send reset link',onSave:async()=>{const email=sv('recover-email').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.toLowerCase().endsWith('@'+MEMBER_DOMAIN)){toast('Бүртгэлдээ ашигласан бодит имэйлээ оруулна уу.');return false;}
    const r=await fetch(SB.url+'/auth/v1/recover?redirect_to='+encodeURIComponent(location.origin+location.pathname),{method:'POST',headers:{apikey:SB.key,'Content-Type':'application/json'},body:JSON.stringify({email})});if(!r.ok)throw Error('Сэргээх холбоос илгээж чадсангүй. Дахин оролдоно уу.');$('recovery-result').textContent='Энэ имэйлтэй эрх байвал сэргээх холбоос очно. Имэйлээ шалгана уу.';return false;}});
}
async function resetPasswordFromLink() {
  const params=new URLSearchParams(location.hash.slice(1));if(params.get('type')!=='recovery')return false;$('boot-splash')?.remove();
  const access=params.get('access_token'),refresh=params.get('refresh_token');history.replaceState(null,'',location.pathname+location.search);
  if(!access||!refresh){showLogin('Сэргээх холбоос хүчингүй байна. Шинэ холбоос авна уу.');return true;}
  document.body.classList.add('locked');$('main').innerHTML='<form id="reset-password" class="card auth-card"><h2>Шинэ нууц үг</h2>'+field('reset-new','Password',inp('reset-new','','password','required minlength="8" autocomplete="new-password"'))+field('reset-confirm','Confirm password',inp('reset-confirm','','password','required minlength="8" autocomplete="new-password"'))+'<button class="btn wide">Save password</button><p role="status" id="reset-result"></p></form>';
  $('reset-password').addEventListener('submit',async e=>{e.preventDefault();if(sv('reset-new')!==sv('reset-confirm')){toast('Нууц үгүүд ижил байх ёстой.');return;}const b=e.target.querySelector('button');if(b.disabled)return;buttonBusy(b,true,'Хадгалж байна…');try{const r=await fetch(SB.url+'/auth/v1/user',{method:'PUT',headers:{apikey:SB.key,Authorization:'Bearer '+access,'Content-Type':'application/json'},body:JSON.stringify({password:sv('reset-new')})});if(!r.ok)throw Error('Холбоосын хугацаа дууссан байна. Шинэ холбоос авна уу.');SB.storeSession(null);showLogin('Нууц үг шинэчлэгдлээ. Шинэ нууц үгээрээ нэвтэрнэ үү.');}catch(err){$('reset-result').textContent=err.message;}finally{buttonBusy(b,false);}});return true;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-recovery]');if(b)recoverySheet(b.dataset.recovery);});
window.addEventListener('hashchange',()=>{if(SB.configured())resetPasswordFromLink();});

/* ---------- tree helpers ---------- */
const CATS = [["stand", "Standing"], ["guard", "Guard, bottom"], ["pass", "Passing, top"], ["top", "Dominant, top"], ["escape", "Escapes, bottom"]];
const CAT_COLOR = { stand: "var(--t-td)", guard: "var(--t-sweep)", pass: "var(--t-pass)", top: "var(--t-sub)", escape: "var(--t-esc)" };
const TYPES = [["sub", "Submission"], ["sweep", "Sweep"], ["pass", "Pass"], ["td", "Takedown"], ["esc", "Escape"], ["trans", "Transition"], ["grip", "Grip"], ["ctl", "Control"]];
const TNAME = Object.fromEntries(TYPES);
const BELT_ORDER = ["white", "blue", "purple", "brown", "black"];
const BELT_COLOR = { white: "#9a9aa2", blue: "#1f5fd6", purple: "#7a3fc4", brown: "#7a4a1f", black: "#111114" };
const RANK = { "-2": ["Hard", "bad"], "-1": ["Tough", "warn"], "0": ["Neutral", "na"], "1": ["Good", "ok"], "2": ["Dominant", "ok"] };
const GI_NAME = { gi: "Gi", nogi: "No-gi", both: "Gi · No-gi" };
function myBeltIdx() { const b = (S.belt.belt || "white").split("-")[0]; const i = BELT_ORDER.indexOf(b); return i < 0 ? 0 : i; }
function allowed(n) {
  if (!n || n.k !== "mv") return true; const st = S.settings;
  if (st.rules === "gi" && n.gi === "nogi") return false; if (st.rules === "nogi" && n.gi === "gi") return false;
  if (st.beltFilter && BELT_ORDER.indexOf(n.belt || "white") > myBeltIdx()) return false;
  return true;
}
function kidsWarn(n) { return n && n.kids === false && S.belt.track === "kids"; }
function bolts(e) { let h = ""; for (let i = 1; i <= 3; i++) h += '<i class="' + (i <= (e || 2) ? "on" : "") + '"></i>'; return '<span class="bolts" title="Energy">' + h + "</span>"; }
function metaBadges(n, full) {
  if (!n) return ""; let h = "";
  if (n.k === "pos") { const r = RANK[String(n.rank || 0)]; h += '<span class="pill ' + r[1] + '">' + r[0] + "</span>"; return h; }
  if (n.k === "df") { if (n.f === "rare") h += '<span class="pill na">rare</span>'; else if (full) h += '<span class="pill na">common</span>'; if (n.bait) h += '<span class="pill warn">their trap</span>'; return h; }
  if (n.gi && n.gi !== "both") h += '<span class="pill na">' + GI_NAME[n.gi] + "</span>";
  if (n.belt && n.belt !== "white") h += '<span class="pill belt" style="background:' + BELT_COLOR[n.belt] + '">' + n.belt + "+</span>";
  if (n.pts) h += '<span class="pill ok">+' + n.pts + "</span>";
  if (n.bait) h += '<span class="pill warn">trap</span>';
  if (kidsWarn(n)) h += '<span class="pill bad">not for kids</span>';
  if (full) h += bolts(n.energy);
  return h;
}
const nodes = () => S.tree.nodes;
const node = (id) => nodes().find((n) => n.id === id);
const kids = (id) => nodes().filter((n) => n.p === id);
const positions = () => nodes().filter((n) => n.k === "pos");
function ancestors(id) { const out = []; let n = node(id); while (n) { out.unshift(n); n = n.p ? node(n.p) : null; } return out; }
function subtreeIds(id) { const out = [id]; for (const c of kids(id)) out.push(...subtreeIds(c.id)); return out; }
function posOf(id) { return ancestors(id)[0]; }
/* Setups: every move elsewhere whose result is this position, grouped by the position it starts from. */
function entriesTo(posId) {
  const out = []; for (const m of nodes()) { if (m.k !== "mv") continue; const from = posOf(m.id); if (!from || from.id === posId) continue;
    const oc = m.oc && m.oc.length ? m.oc : m.to ? [{ to: m.to, f: "common" }] : []; const o = oc.find((x) => x.to === posId); if (o) out.push({ m, from, f: o.f || "common" }); }
  const groups = {}; for (const e of out) (groups[e.from.id] = groups[e.from.id] || []).push(e);
  return Object.keys(groups).sort((a, b) => CATS.findIndex((c) => c[0] === node(a).cat) - CATS.findIndex((c) => c[0] === node(b).cat)).map((k) => ({ from: node(k), items: groups[k].sort((a, b) => (a.f === b.f ? 0 : a.f === "rare" ? 1 : -1)) }));
}
function themLine(p) { return p && p.them ? '<span class="them"><svg viewBox="0 0 24 24">' + TICON.df + "</svg>" + esc(p.them) + "</span>" : ""; }
function countDesc(id) { return subtreeIds(id).length - 1; }
function tbadge(n) { if (n.k === "df") return '<span class="tbadge df">Defense</span>'; return n.t ? '<span class="tbadge ' + n.t + '">' + TNAME[n.t] + "</span>" : ""; }
function kindLabel(n) { return n.k === "pos" ? "Position" : n.k === "df" ? "Opponent" : "Me"; }
function childHeading(n) { return n.k === "pos" ? "What can I do from here" : n.k === "mv" ? "How does the opponent defend" : "Then what do I do"; }
function logStats(id) {
  let given = 0, got = 0, drilled = 0;
  for (const s of S.log.items) { for (const x of s.subs || []) if (x.id === id) given += +x.c || 1; for (const x of s.taps || []) if (x.id === id) got += +x.c || 1; for (const x of s.tech || []) if (x.id === id) drilled++; }
  return { given, got, drilled };
}

/* ---------- belt helpers ---------- */
function beltDef(track, id) { return (SEED.belts[track] || []).find((b) => b.id === id) || SEED.belts.kids.find((b) => b.id === id) || SEED.belts.adult.find((b) => b.id === id) || SEED.belts.adult[0]; }
function beltSwatch(b) {
  const parts = b.id.split("-"); const base = b.c;
  const secondary = parts[1] === "white" ? "#f4f4f6" : parts[1] === "black" ? "#111114" : null;
  return secondary ? '<i style="background:' + base + '"></i><i style="background:' + secondary + '"></i><i style="background:' + base + '"></i>' : '<i style="background:' + base + '"></i>';
}
function beltHtml(big) {
  const b = beltDef(S.belt.track, S.belt.belt); const st = Math.max(0, Math.min(4, +S.belt.stripes || 0));
  const bar = b.id === "black" ? "#c62828" : "#111114";
  return '<span class="b-main">' + beltSwatch(b) + '</span><span class="b-bar" style="background:' + bar + '">' + "<i></i>".repeat(st) + "</span>";
}
function renderHeader() { const el = $("hdr-av"); if (!el) return; el.innerHTML = avatarInner(myName(), S.settings.avatar); const t = $("title"); if (t && t.textContent !== "Jiu-jitsu" && I18N.lang === "en") t.textContent = "Jiu-jitsu"; }
function renderBelt() { const el = $("belt"); if (!el) return; el.dataset.act = "belt-page"; el.dataset.v = "open"; el.style.cursor = "pointer"; const b = beltDef(S.belt.track, S.belt.belt); el.innerHTML = beltHtml(); el.setAttribute("aria-label", b.n + " belt, " + (S.belt.stripes || 0) + " stripes"); }

/* ---------- tabs & render ---------- */
const TABS = [
  ["home", "Home", '<path d="M3 11l9-8 9 8"/><path d="M5 10v11h5v-6h4v6h5V10"/>'],
  ["tech", "Technique", '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="9"/>'],
  ["rec", "Check-in", '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><rect x="8" y="8" width="3" height="3"/><rect x="13" y="8" width="3" height="3"/><rect x="8" y="13" width="3" height="3"/><path d="M13 13h3v3"/>'],
  ["club", "Club", '<path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-7h6v7"/>'],
  ["me", "You", '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'],
];
const SEGS = { me: [["prog", "Progress"], ["log", "Log"], ["drills", "Drills"], ["body", "Body"], ["belt", "Rank"], ["weight", "Weight"], ["comp", "Compete"]] };
function renderTabs() {
  $("tabs").innerHTML = TABS.map((t) => t[0] === "rec" ? '<button class="rec" data-act="record" aria-label="Check in"><span><svg viewBox="0 0 24 24">' + t[2] + "</svg></span>" + t[1] + "</button>" : '<button data-act="tab" data-v="' + t[0] + '"' + (UI.tab === t[0] ? ' aria-current="page"' : "") + '><svg viewBox="0 0 24 24">' + t[2] + "</svg>" + t[1] + "</button>").join("");
}
const VIEWS = {};
function render(anim) {
  renderBelt(); renderHeader(); renderTabs();
  if (TAB_ALIAS[UI.tab]) { if (UI.tab !== "train") UI.seg[TAB_ALIAS[UI.tab]] = UI.tab; UI.tab = TAB_ALIAS[UI.tab]; }
  const m = $("main"); const fn = VIEWS[UI.tab] || VIEWS.tech;
  m.className = ""; m.innerHTML = fn(); if (anim) { void m.offsetWidth; m.className = anim; }
  renderTimer(); initGraphs(); const hw = $("hist"); if (hw && hw.parentElement) hw.parentElement.scrollLeft = hw.scrollWidth;
}
function go(anim) { const preserve=UI.tab==="me"&&document.body.dataset.page==="me", y=window.scrollY;render(anim);window.scrollTo({top:preserve?y:0,behavior:"instant"}); }
let toastT;
function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200); }
function armConfirm(key) { if (UI.confirm === key) { UI.confirm = null; return true; } UI.confirm = key; render(); setTimeout(() => { if (UI.confirm === key) { UI.confirm = null; render(); } }, 3500); return false; }
function delBtn(key, act, attrs) { const on = UI.confirm === key; return '<button class="x' + (on ? " confirm" : "") + '" data-act="' + act + '" data-key="' + esc(key) + '" ' + (attrs || "") + ' aria-label="Delete">' + (on ? "Delete?" : "✕") + "</button>"; }
function seg(items, cur, act, scroll) { return (scroll ? '<div class="seg-wrap">' : '') + '<div class="seg' + (scroll ? " scroll" : "") + '" role="tablist">' + items.map((i) => '<button role="tab" data-act="' + act + '" data-v="' + i[0] + '" aria-selected="' + (cur === i[0]) + '">' + i[1] + "</button>").join("") + "</div>" + (scroll ? '<span class="seg-more" aria-hidden="true">›</span></div><p class="seg-hint">Swipe for more sections</p>' : ""); }
function chips(group, items, cur) { return '<div class="chips" data-group="' + group + '">' + items.map((i) => '<button type="button" class="chip' + (cur === i[0] ? " on" : "") + '" data-act="pick" data-group="' + group + '" data-v="' + esc(i[0]) + '">' + esc(i[1]) + "</button>").join("") + "</div>"; }
function scale(group, cur, lo, hi) { let h = '<div class="scale" data-group="' + group + '">'; for (let i = lo; i <= hi; i++) h += '<button type="button" data-act="pick" data-group="' + group + '" data-v="' + i + '" class="' + (cur === i ? "on" : "") + '">' + i + "</button>"; return h + "</div>"; }
function field(id, label, input) { return '<div class="field"><label for="' + id + '">' + label + "</label>" + input + "</div>"; }
function inp(id, val, type, extra) { return '<input id="' + id + '" type="' + (type || "text") + '" value="' + esc(val == null ? "" : val) + '" ' + (extra || "") + ">"; }
function ta(id, val, ph) { return '<textarea id="' + id + '" placeholder="' + esc(ph || "") + '">' + esc(val || "") + "</textarea>"; }

/* ---------- bottom sheet ---------- */
function openSheet(title, body, opt) {
  opt = opt || {}; UI.sheet = Object.assign({ picks: {}, pk: {} }, opt.state || {}); UI.sheetSave = opt.onSave; UI.sheetDel = opt.onDelete;
  const html = typeof body === "function" ? body() : body;
  $("sheet-body").innerHTML = "<h2>" + esc(title) + "</h2>" + html +
    '<div class="foot">' + (opt.onDelete ? '<button class="btn ghost danger" data-act="sheet-del">' + (opt.delLabel || "Delete") + "</button>" : "") + '<button class="btn ghost" data-act="sheet-close">Cancel</button>' + (opt.onSave ? '<button class="btn" data-act="sheet-save">' + (opt.saveLabel || "Save") + "</button>" : "") + "</div>";
  $("sheet").classList.add("open"); $("backdrop").classList.add("open"); $("sheet").scrollTop = 0;
  const f = $("sheet-body").querySelector("input[autofocus]"); if (f) setTimeout(() => f.focus(), 350);
}
function closeSheet() { scanStop(); $("sheet").classList.remove("open"); $("backdrop").classList.remove("open"); UI.sheet = null; UI.sheetSave = null; UI.sheetDel = null; setTimeout(() => { if (!UI.sheet) $("sheet-body").innerHTML = ""; }, 400); }
async function finishSheetSave(button) {
  if (!UI.sheetSave || UI.savingSheet) return;
  const sheet = UI.sheet; UI.savingSheet = true; button = button || document.querySelector('[data-act="sheet-save"]'); buttonBusy(button,true,'Хадгалж байна…');
  try { const saved=await UI.sheetSave();await window.ARROW_UI.wait(button);if(saved !== false && UI.sheet === sheet) closeSheet(); }
  catch (e) { toast("Could not save: " + e.message); }
  finally { UI.savingSheet = false; if (button && button.isConnected) buttonBusy(button,false); }
}
function pickVal(group, def) { return UI.sheet && UI.sheet.picks[group] != null ? UI.sheet.picks[group] : def; }

/* picker: multi-select with counts (armbar ×2) */
function picker(key, label, source, opt) {
  opt = opt || {}; const list = (UI.sheet.pk[key] = UI.sheet.pk[key] || []);
  return '<div class="field" id="pk-' + key + '"><label for="pki-' + key + '">' + label + '</label><input id="pki-' + key + '" type="text" placeholder="' + esc(opt.ph || "Search by name…") + '" data-pk="' + key + '" data-src="' + source + '" data-counts="' + (opt.counts ? 1 : 0) + '" autocomplete="off"><div class="sugg" id="pks-' + key + '" hidden></div><div class="picked" id="pkp-' + key + '">' + pickedHtml(key, !!opt.counts) + "</div></div>";
}
function pickedHtml(key, counts) {
  const list = UI.sheet.pk[key] || [];
  return list.map((x, i) => '<span class="chip on">' + esc(x.n || 'Unspecified') + (counts ? ' <button type="button" class="x" style="min-height:28px;min-width:28px;padding:0 6px" data-act="pk-dec" data-pk="' + key + '" data-i="' + i + '" aria-label="Remove">−</button><b>' + (key === "oc" ? (x.c >= 2 ? "rare" : "common") : (x.c || 1)) + '</b><button type="button" class="x" style="min-height:28px;min-width:28px;padding:0 6px" data-act="pk-inc" data-pk="' + key + '" data-i="' + i + '" aria-label="Add">+</button>' : "") + '<button type="button" class="x" style="min-height:28px;min-width:28px;padding:0 6px" data-act="pk-rm" data-pk="' + key + '" data-i="' + i + '" aria-label="Delete">×</button></span>').join("") || '<span class="muted small">None selected</span>';
}
function pkSource(src) {
  if (src === "mv") return nodes().filter((n) => n.k === "mv").map((n) => ({ id: n.id, n: n.n, sub: (posOf(n.id) || {}).n || "" }));
  if (src === "sub") return nodes().filter((n) => n.k === "mv" && n.t === "sub").map((n) => ({ id: n.id, n: n.n, sub: (posOf(n.id) || {}).n || "" }));
  if (src === "pos") return positions().map((n) => ({ id: n.id, n: n.n, sub: n.en }));
  return [];
}
function pkSuggest(input) {
  const key = input.dataset.pk, q = input.value.trim().toLowerCase(); const box = $("pks-" + key); if (!box) return;
  if (!q) { box.hidden = true; return; }
  const seen = new Set(); const items = pkSource(input.dataset.src).filter((x) => { const hit = x.n.toLowerCase().includes(q) || (x.sub || "").toLowerCase().includes(q); if (!hit || seen.has(x.n)) return false; seen.add(x.n); return true; }).slice(0, 8);
  let h = items.map((x) => '<button type="button" data-act="pk-add" data-pk="' + key + '" data-id="' + esc(x.id) + '" data-n="' + esc(x.n) + '">' + esc(x.n) + (x.sub ? " <small>· " + esc(x.sub) + "</small>" : "") + "</button>").join("");
  if (!items.some((x) => x.n.toLowerCase() === q)) h += '<button type="button" data-act="pk-add" data-pk="' + key + '" data-id="" data-n="' + esc(input.value.trim()) + '">“' + esc(input.value.trim()) + '” add as new</button>';
  box.innerHTML = h; box.hidden = false;
}
function pkAdd(key, id, n) {
  if (key.startsWith("live-")) { liveAdd(key.slice(5), n); return; }
  const list = (UI.sheet.pk[key] = UI.sheet.pk[key] || []); const ex = list.find((x) => (id && x.id === id) || x.n === n);
  if (ex) ex.c = (ex.c || 1) + 1; else list.push({ id: id || "", n, c: 1 });
  const input = $("pki-" + key); if (input) { input.value = ""; $("pks-" + key).hidden = true; }
  $("pkp-" + key).innerHTML = pickedHtml(key, input && input.dataset.counts === "1");
}
function pkChange(key, i, d) {
  const list = UI.sheet.pk[key] || []; if (!list[i]) return;
  if (d === 0) list.splice(i, 1); else { list[i].c = Math.max(1, (list[i].c || 1) + d); }
  const input = $("pki-" + key); $("pkp-" + key).innerHTML = pickedHtml(key, input && input.dataset.counts === "1");
}

/* ======================= TECHNIQUE ======================= */
VIEWS.tech = function () {
  if (UI.tech.id && node(UI.tech.id)) return vNode(node(UI.tech.id));
  let h = '<div class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="tq" type="search" placeholder="Search positions, techniques…" value="' + esc(UI.tech.q) + '" autocomplete="off"></div>';
  if (UI.tech.q.trim().length >= 2) return h + vSearch(UI.tech.q.trim().toLowerCase());
  if (UI.setupEd) return vSetupEdit();
  if (!["pos", "mine", "disc", "setups", "learn", "plans", "rolls"].includes(UI.tech.view)) UI.tech.view = "pos";
  h += seg([["pos", "Roll"], ["mine", "Mine (" + mineIds().length + ")"], ["disc", "Discover"], ["setups", "Setups"], ["learn", "Learn"], ["plans", "Plans"], ["rolls", "History"]], UI.tech.view, "techview", true);
  if (UI.tech.view === "mine") return h + vMine();
  if (UI.tech.view === "disc") return h + vDiscover();
  if (["setups", "learn", "plans", "rolls"].includes(UI.tech.view) && !unlocked()) { if (clubNeeds() && !CLUB.busy) clubLoad(); return h + lockCard({ setups: "Setups", learn: "Learn", plans: "Game plans", rolls: "Roll history" }[UI.tech.view]); }
  if (UI.tech.view === "setups") return h + vSetups();
  if (UI.tech.view === "learn") return h + vLearn();
  if (UI.tech.view === "plans") return h + vPlans();
  if (UI.tech.view === "rolls") return h + vRolls();
  const R = UI.roll;
  h += '<div class="card rollcard">';
  if (R) {
    const trail = R.steps.map((st, i) => '<button type="button" class="crumb ' + st.k + (i === R.steps.length - 1 ? " last" : "") + '" data-act="roll-rewind" data-i="' + i + '">' + esc(st.n) + "</button>").join('<span class="sep">›</span>');
    h += '<div class="histwrap"><div class="hist" id="hist">' + trail + "</div></div>";
    if (UI.walkCat) h += '<div class="jump"><p class="muted small">I ended up in…</p><div class="chips">' + positions().filter((p) => p.cat === UI.walkCat).map((p) => '<button class="chip pchip" data-act="walk-pos" data-id="' + p.id + '" style="color:' + CAT_COLOR[p.cat] + '">' + iconFor(p) + "<span>" + esc(p.n) + "</span></button>").join("") + "</div></div>";
  } else h += '<div class="start-head"><h3>Where are you?</h3><span class="muted small">tap a position to start</span></div>';
  h += rollGraphSvg();
  if (R) { const cur = R.cur === "finish" ? FINISH : node(R.cur); const q = cur.k === "pos" ? "What do you do?" : cur.k === "mv" ? "What does the opponent do?" : "What do you do now?"; h += '<div class="now"><span class="pict" style="color:' + nodeColor(cur) + '">' + iconFor(cur) + '</span><div class="txt"><b>' + esc(cur.n) + "</b><span>" + q + "</span></div>" + (cur.k === "pos" && metaBadges(cur) ? '<div class="meta">' + metaBadges(cur) + "</div>" : "") + "</div>" + (cur.k === "pos" ? themLine(cur) : "");
    if (R.plan) { const sp = setupById(R.plan); if (sp) { const on = R.steps.every((s, i) => sp.steps[i] && sp.steps[i].id === s.id); const nx = on && sp.steps[R.steps.length]; h += '<p class="small plan-line">★ <b>' + esc(sp.n) + "</b> · " + (nx ? "next: " + esc(nx.n) : on ? "done, finish it" : "off the setup, improvise") + "</p>"; } } }
  else h += '<div class="legend">' + CATS.map((c) => '<span><i style="background:' + CAT_COLOR[c[0]] + '"></i>' + c[1] + "</span>").join("") + '</div><p class="muted small">Jump node to node. It only ends with a submission or points.</p>';
  h += "</div>";
  const all = positions();
  h += '<details class="card fold"><summary><h3>All positions</h3><span class="muted small">' + all.length + " · browse & edit</span></summary><div class=\"list\">" + CATS.map(([cat, label]) => { const ps = all.filter((p) => p.cat === cat); return ps.length ? '<div class="group-label" style="color:' + CAT_COLOR[cat] + '">' + label + "</div>" + ps.map((p) => '<button class="node-row" data-act="open" data-id="' + p.id + '"><span class="pict" style="color:' + CAT_COLOR[cat] + '">' + iconFor(p) + '</span><div class="txt"><b>' + esc(p.n) + "</b>" + (p.en ? "<small>" + esc(p.en) + "</small>" : "") + '</div><span class="cnt">' + kids(p.id).length + "</span>" + CHEV + "</button>").join("") : ""; }).join("") + '</div><button class="btn ghost wide" data-act="add-node" data-p="">+ Add position</button></details>';
  return h;
};
function vSearch(q) {
  const res = nodes().filter((n) => n.n.toLowerCase().includes(q) || (n.en || "").toLowerCase().includes(q)).slice(0, 40);
  if (!res.length) return '<div class="card"><p class="empty">Nothing found. Try another word.</p></div>';
  return '<div class="card"><div class="list">' + res.map((n) => { const a = ancestors(n.id); const crumb = a.slice(0, -1).map((x) => x.n).join(" › "); return '<button class="node-row' + (n.k === "df" ? " df" : "") + '" data-act="open" data-id="' + n.id + '"><span class="pict" style="color:' + nodeColor(n) + '">' + iconFor(n) + '</span><div class="txt"><b>' + esc(n.n) + "</b><small>" + esc(crumb || n.en || kindLabel(n)) + "</small></div>" + tbadge(n) + CHEV + "</button>"; }).join("") + "</div></div>";
}
/* Mine / Discover: a FlowRoll-style technique list. S.settings.mine holds node ids; Discover groups distinct names. */
const DISC_CATS = [["sub", "Submission"], ["sweep", "Sweep"], ["td", "Takedown"], ["pass", "Guard pass"], ["esc", "Escape"], ["trans", "Transition"], ["ctl", "Control"], ["grip", "Grip"], ["pos:guard", "Guard positions"], ["pos:top", "Top positions"]];
const DISC_LABEL = Object.fromEntries(DISC_CATS.concat(CATS.map(([c, l]) => ["pos:" + c, l])));
function discColor(key) { return key.startsWith("pos:") ? CAT_COLOR[key.slice(4)] || "var(--ink)" : typeColor(key); }
function discCatOf(n) { return n.k === "pos" ? "pos:" + (n.cat || "guard") : n.k === "mv" ? n.t || "trans" : null; }
function mineIds() { const st = S.settings; if (!Array.isArray(st.mine)) st.mine = []; return st.mine; }
function mineHas(ids) { const m = mineIds(); return ids.every((id) => m.includes(id)); }
function mineToggle(ids, on) { const m = mineIds(); for (const id of ids) { const i = m.indexOf(id); if (on && i < 0) m.push(id); if (!on && i >= 0) m.splice(i, 1); } save("settings"); }
/* distinct names per category: { key: [{ n, en, ids, pos }] } */
function discGroups(list) {
  const g = {};
  for (const n of list || nodes()) { const key = discCatOf(n); if (!key) continue; const k = n.n.trim().toLowerCase(); const byName = (g[key] = g[key] || {}); const e = byName[k] || (byName[k] = { n: n.n, en: n.en || "", ids: [], pos: [] }); e.ids.push(n.id); if (n.k === "mv") { const p = posOf(n.id); if (p && !e.pos.includes(p.n)) e.pos.push(p.n); } }
  const out = {}; for (const k in g) out[k] = Object.values(g[k]).sort((a, b) => a.n.localeCompare(b.n)); return out;
}
function plusBtn(ids) { const on = mineHas(ids); return '<button type="button" class="plus' + (on ? " on" : "") + '" data-act="mine-toggle" data-ids="' + ids.join(",") + '" data-on="' + (on ? 0 : 1) + '" aria-label="' + (on ? "Remove from mine" : "Add to mine") + '">' + (on ? "✓" : "+") + "</button>"; }
function mineRow(r, key, remove) {
  const first = node(r.ids[0]); const sub = key.startsWith("pos:") ? "" : r.pos.length > 1 ? (remove ? r.pos.join(" · ") : "from " + r.pos.length + " positions") : r.pos[0] || "";
  return '<div class="mrow"><button type="button" class="mrow-t" data-act="open" data-id="' + r.ids[0] + '"><span class="pict" style="color:' + discColor(key) + '">' + iconFor(first) + '</span><div class="txt"><b>' + esc(r.n) + "</b>" + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</div></button>" + (remove ? '<button type="button" class="x" data-act="mine-rm" data-ids="' + r.ids.join(",") + '" aria-label="Remove from mine">✕</button>' : plusBtn(r.ids)) + "</div>";
}
function vDiscover() {
  const q = (UI.discQ || "").trim().toLowerCase(); const G = discGroups(); const open = (UI.discOpen = UI.discOpen || new Set());
  let h = '<div class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="dq" type="search" placeholder="Search techniques…" value="' + esc(UI.discQ || "") + '" autocomplete="off"></div>';
  h += '<div class="card disc">'; let any = false;
  for (const [key, label] of DISC_CATS) {
    let rows = G[key] || []; if (q) rows = rows.filter((r) => r.n.toLowerCase().includes(q) || r.en.toLowerCase().includes(q));
    if (!rows.length) continue; any = true; const on = q ? true : open.has(key);
    h += '<button type="button" class="disc-cat' + (on ? " open" : "") + '" data-act="disc-cat" data-v="' + key + '" aria-expanded="' + on + '"><i style="background:' + discColor(key) + '"></i><b>' + label + '</b><span class="cnt">' + rows.length + "</span>" + CHEV + "</button>";
    if (on) h += '<div class="disc-rows">' + rows.map((r) => mineRow(r, key)).join("") + "</div>";
  }
  if (!any) h += '<p class="empty">Nothing found. Try another word.</p>';
  return h + "</div>";
}
function vMine() {
  const list = mineIds().map(node).filter(Boolean);
  if (!list.length) return '<div class="card mine-empty"><span class="pict big" style="color:var(--accent)">' + svgIcon(TICON.sub) + '</span><h3>My techniques</h3><p class="small muted">Pick the techniques you are working on. They show up here, and Learn can quiz you on them.</p><button class="btn" data-act="techview" data-v="disc">Go to Discover</button></div>';
  const G = discGroups(list); const keys = DISC_CATS.map((c) => c[0]).concat(Object.keys(G).filter((k) => !DISC_CATS.some((c) => c[0] === k)));
  let h = '<div class="card"><div class="card-head"><h3>My techniques</h3><span class="muted small">' + list.length + " techniques</span></div><div class=\"list\">";
  for (const key of keys) { const rows = G[key]; if (!rows || !rows.length) continue; h += '<div class="group-label" style="color:' + discColor(key) + '">' + (DISC_LABEL[key] || key) + " · " + rows.length + "</div>" + rows.map((r) => mineRow(r, key, true)).join(""); }
  h += '</div><button class="btn wide" data-act="mine-learn">Quiz these in Learn</button><button class="btn ghost wide" data-act="techview" data-v="disc">+ Add more from Discover</button></div>';
  return h;
}
function vNode(n) {
  const path = ancestors(n.id); const ch = kids(n.id); const back = n.p ? n.p : "";
  let h = '<button class="back" data-act="back" data-id="' + back + '"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>' + (n.p ? esc(node(n.p).n) : "Positions") + "</button>";
  h += '<div class="card"><div class="path">' + path.map((x, i) => '<button class="pn ' + x.k + (i === path.length - 1 ? " cur" : "") + '" data-act="open" data-id="' + x.id + '"><span class="rail"><i></i></span><span class="pt"><span class="k">' + kindLabel(x) + '</span><span class="nm">' + esc(x.n) + "</span></span></button>").join("") + "</div>";
  h += '<div class="actions" style="align-items:center">' + tbadge(n) + (n.en ? '<span class="muted small" style="flex:1 1 0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(n.en) + "</span>" : '<span style="flex:1 1 0"></span>') + (n.k !== "df" ? '<button class="btn ghost minepill' + (mineHas([n.id]) ? " on" : "") + '" data-act="mine-toggle" data-ids="' + n.id + '" data-on="' + (mineHas([n.id]) ? 0 : 1) + '">' + (mineHas([n.id]) ? "✓ In my list" : "+ Add to mine") + "</button>" : "") + '<button class="btn ghost" style="flex:none" data-act="edit-node" data-id="' + n.id + '">Edit</button></div>';
  { const mb = metaBadges(n, true); if (mb) h += '<div class="meta">' + mb + "</div>"; }
  if (n.k === "pos" && n.them) h += '<p class="small"><span class="muted">Them:</span> ' + esc(n.them) + "</p>";
  if (n.k === "mv" && n.when) h += '<p class="small"><span class="muted">Opens when:</span> ' + esc(n.when) + "</p>";
  if (n.k === "df" && n.to && node(n.to)) h += '<p class="small"><span class="muted">They end up in:</span> <button class="to-link sm" data-act="open" data-id="' + n.to + '">' + esc(node(n.to).n) + "</button></p>";
  if (n.bait) h += '<div class="tip"><b>' + (n.k === "df" ? "Their trap" : "Trap") + ":</b> " + esc(n.bait) + "</div>";
  if (n.k === "mv" && n.oc && n.oc.length) h += '<p class="small"><span class="muted">Lands in:</span> ' + n.oc.filter((o) => node(o.to)).map((o) => '<button class="to-link sm" data-act="open" data-id="' + o.to + '">' + esc(node(o.to).n) + (o.f === "rare" ? " · rare" : "") + "</button>").join(" ") + "</p>";
  if (n.legal) h += '<p class="muted small">Rules: ' + esc(n.legal) + "</p>";
  if (n.s && n.s.length) h += '<ol class="steps">' + n.s.map((s) => "<li>" + esc(s) + "</li>").join("") + "</ol>";
  if (n.x) h += '<p class="small">' + esc(n.x) + "</p>";
  if (n.to && node(n.to) && !(n.oc && n.oc.length)) h += '<div><button class="to-link" data-act="open" data-id="' + n.to + '">→ Next: ' + esc(node(n.to).n) + "</button></div>";
  if (n.k === "mv") { const st = logStats(n.id); const bits = []; if (st.drilled) bits.push(st.drilled + " sessions drilled"); if (st.given) bits.push(st.given + " times finished"); if (st.got) bits.push(st.got + " times caught"); const rs = rollStatsFor(n.id); if (rs.used) bits.push("used in " + rs.used + " roll" + (rs.used > 1 ? "s" : "")); if (bits.length) h += '<p class="muted small">' + bits.join(" · ") + "</p>"; }
  if (n.k === "pos") h += '<div class="actions"><button class="btn" data-act="roll-start" data-pos="' + n.id + '">Roll from here</button></div>';
  h += "</div>";
  if (n.k === "pos") {
    const en = entriesTo(n.id); const cnt = en.reduce((a, g) => a + g.items.length, 0);
    const sps = S.plans.setups.filter((x) => x.steps[0] && x.steps[0].id === n.id);
    h += '<div class="card"><div class="card-head"><h3>Setups from here</h3><span class="muted small">my paths to a submission</span></div>' + (sps.length ? '<div class="list">' + sps.map(setupRow).join("") + "</div>" : '<p class="empty">No setup yet. Build the chain you want to land from here.</p>') + '<button class="btn ghost wide" data-act="add-setup" data-pos="' + n.id + '">+ New setup</button></div>';
    h += '<div class="card"><div class="card-head"><h3>Ways in · how you get here</h3><span class="muted small">' + (cnt ? cnt + " entr" + (cnt > 1 ? "ies" : "y") : "none yet") + "</span></div>";
    if (cnt) h += '<div class="list">' + en.map((g) => '<div class="group-label" style="color:' + CAT_COLOR[g.from.cat] + '">from ' + esc(g.from.n) + "</div>" + g.items.map((e) => '<button class="node-row" data-act="open" data-id="' + e.m.id + '"><span class="pict" style="color:' + nodeColor(e.m) + '">' + iconFor(e.m) + '</span><div class="txt"><b>' + esc(e.m.n) + "</b>" + (e.m.when ? "<small>" + esc(e.m.when) + "</small>" : "") + "</div>" + (e.f === "rare" ? '<span class="pill na">rare</span>' : "") + tbadge(e.m) + CHEV + "</button>").join("")).join("") + "</div>";
    else h += '<p class="empty">No move leads here yet. Add how you pull, sweep or pass into it.</p>';
    h += '<button class="btn ghost wide" data-act="add-entry" data-id="' + n.id + '">+ Add an entry</button></div>';
  }
  h += '<div class="card"><div class="card-head"><h3>' + childHeading(n) + "</h3>" + seg([["map", "Map"], ["list", "List"]], UI.tech.map ? "map" : "list", "techmap") + "</div>";
  if (UI.tech.map && ch.length) h += mindMapSvg(n) + '<p class="muted small">Tap a branch for its next step. Dashed amber = their defense.</p>';
  else if (ch.length) { const rowOf = (c) => '<button class="node-row' + (c.k === "df" ? " df" : "") + '" data-act="open" data-id="' + c.id + '"><span class="pict" style="color:' + nodeColor(c) + '">' + iconFor(c) + '</span><div class="txt"><b>' + esc(c.n) + "</b>" + (c.en ? "<small>" + esc(c.en) + "</small>" : "") + "</div>" + (c.k === "df" ? (c.f === "rare" ? '<span class="pill na">rare</span>' : "") + '<span class="cnt">' + kids(c.id).length + " answers</span>" : metaBadges(c) + tbadge(c)) + (c.k !== "df" && kids(c.id).length ? '<span class="cnt">' + kids(c.id).length + "</span>" : "") + CHEV + "</button>";
    if (n.k === "pos" && ch.length > 6) h += '<div class="list">' + TYPES.map(([t, label]) => { const g = ch.filter((c) => (c.t || "trans") === t); return g.length ? '<div class="group-label" style="color:' + typeColor(t) + '">' + label + (g.length > 1 ? "s" : "") + " · " + g.length + "</div>" + g.map(rowOf).join("") : ""; }).join("") + "</div>";
    else h += '<div class="list">' + ch.map(rowOf).join("") + "</div>"; }
  else h += '<p class="empty">' + (n.k === "mv" ? "Write how the opponent defends, then add your answer." : "Nothing here yet. Add your first option.") + "</p>";
  h += '<button class="btn ghost wide" data-act="add-node" data-p="' + n.id + '">+ ' + (n.k === "mv" ? "Add a defense" : "Add an option") + "</button></div>";
  if (n.k === "pos") {
    const plans = S.plans.items.filter((p) => (p.tags || []).includes(n.id));
    if (plans.length) h += '<div class="card"><h3>In game plans</h3><div class="list">' + plans.map((p) => '<div class="row"><div class="txt"><b>' + esc(p.n) + "</b></div></div>").join("") + "</div></div>";
  }
  return h;
}

/* ======================= ICONS ======================= */
/* Category pictograms (two stick figures) and move-type glyphs. 24×24, stroke = currentColor. */
const PICT = {
  stand: '<circle cx="12" cy="4.5" r="2.2"/><path d="M12 7v7M12 14l-3.5 6M12 14l3.5 6M8 10.5l4-1.5 4 1.5"/>',
  guard: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/>',
  pass: '<path d="M4 17c3-9 13-9 16 0M20 17l-1-4M20 17l-4-1M3 20h18"/>',
  top: '<path d="M4 18h16M5 15l2-8 5 4 5-4 2 8z"/>',
  escape: '<path d="M14 4h5v16h-5M4 12h11M11 8l4 4-4 4"/>',
  finish: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3"/>',
};
const TICON = {
  sit: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  bait: '<path d="M12 3v9a4 4 0 0 0 8 0M12 3h-3M12 3h3"/><circle cx="12" cy="18" r="2"/>',
  sub: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  sweep: '<path d="M20 12a8 8 0 1 1-3-6.3M20 4v4h-4"/>',
  pass: '<path d="M4 16c3-9 13-9 16 0M20 16l-1-4M20 16l-4-1"/>',
  td: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  esc: '<path d="M14 4h5v16h-5M4 12h11M11 8l4 4-4 4"/>',
  trans: '<path d="M4 12h14M13 7l5 5-5 5"/>',
  grip: '<path d="M8 11V6.5a1.5 1.5 0 0 1 3 0V11M11 10V5.5a1.5 1.5 0 0 1 3 0V11M14 11V7.5a1.5 1.5 0 0 1 3 0V13c0 4-2 7-6 7s-6-3-6-7v-2a1.5 1.5 0 0 1 3 0"/>',
  ctl: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/>',
  df: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6zM9 9l6 6M15 9l-6 6"/>',
  pos: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>',
};
const svgIcon = (inner) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>";
function pictSvg(cat) { return svgIcon(PICT[cat] || PICT.guard); }
function iconFor(n) { return svgIcon(n.k === "fin" ? PICT.finish : n.k === "pos" ? PICT[n.cat] || PICT.guard : n.k === "df" ? TICON.df : TICON[n.t] || TICON.trans); }
function nodeColor(n) { return n.k === "pos" ? CAT_COLOR[n.cat] || "var(--ink)" : n.k === "df" ? "var(--df-ink)" : typeColor(n.t); }

/* ======================= GRAPHS ======================= */
/* Shared pan / pinch-zoom canvas. State per graph id lives in UI.graph[id] = {tx,ty,s,sel,open}. */
UI.graph = {};
const TW = (t, fs) => t.length * (fs || 11) * 0.56;
function gState(id) { return (UI.graph[id] = UI.graph[id] || { tx: 0, ty: 0, s: 0, sel: null, open: {} }); }
function typeColor(t) { return t ? "var(--t-" + t + ")" : "var(--t-trans)"; }
function wrapText(t, max) { if (t.length <= max) return [t]; const i = t.lastIndexOf(" ", max); const a = i > 3 ? t.slice(0, i) : t.slice(0, max); let b = t.slice(a.length).trim(); if (b.length > max) b = b.slice(0, max - 1) + "…"; return [a, b]; }
/* icon node: circle with a glyph, label outside (below or to the right) */
function iconNode(n, cx, cy, r, opt) {
  opt = opt || {}; const col = opt.color || nodeColor(n); const cls = "g-node " + n.k + (opt.cls ? " " + opt.cls : ""); const inner = n.k === "pos" ? PICT[n.cat] || PICT.guard : n.k === "df" ? TICON.df : TICON[n.t] || TICON.trans;
  const ir = r * 1.15; let h = '<g class="' + cls + '" data-id="' + n.id + '" style="color:' + col + '">' +
    '<circle class="hit" cx="' + cx + '" cy="' + cy + '" r="' + (r + 10) + '"/>' +
    '<circle class="b" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>' +
    '<svg class="ic" x="' + (cx - ir / 2) + '" y="' + (cy - ir / 2) + '" width="' + ir + '" height="' + ir + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>";
  if (opt.label !== false) {
    const fs = opt.fs || 11, ls = wrapText(dn(n), opt.max || 16);
    if (opt.side) h += ls.map((l, i) => '<text class="lb" x="' + (cx + r + 7) + '" y="' + (cy + (ls.length === 1 ? fs * 0.36 : i ? fs + 1 : -2)) + '">' + esc(l) + "</text>").join("");
    else h += ls.map((l, i) => '<text class="lb" x="' + cx + '" y="' + (cy + r + 13 + i * (fs + 2)) + '" text-anchor="middle">' + esc(l) + "</text>").join("");
  }
  if (opt.badge) h += '<g class="g-badge"><circle cx="' + (cx + r * 0.75) + '" cy="' + (cy - r * 0.75) + '" r="8.5"/><text x="' + (cx + r * 0.75) + '" y="' + (cy - r * 0.75 + 3.3) + '" text-anchor="middle">+' + opt.badge + "</text></g>";
  return h + "</g>";
}
function canvasHtml(id, svgInner, bounds, legend, roll) {
  const sid = id.replace(/[^a-z0-9]/gi, "_"); const R = UI.roll;
  const bar = roll && R ? '<div class="fbar"><button type="button" class="pillb" data-act="roll-undo"' + (R.steps.length < 2 ? " disabled" : "") + '>↶ Undo</button><button type="button" class="pillb" data-act="roll-other">Elsewhere…</button><button type="button" class="pillb strong" data-act="roll-end">End roll</button></div>' : "";
  return '<div class="canvas' + (roll ? " rollcv" : "") + '" data-graph="' + id + '" data-x0="' + bounds.x + '" data-y0="' + bounds.y + '" data-w="' + bounds.w + '" data-h="' + bounds.h + '"><svg class="g" aria-label="Technique graph"><defs><pattern id="dots-' + sid + '" width="22" height="22" patternUnits="userSpaceOnUse"><circle class="g-dots" cx="1" cy="1" r="1"/></pattern><marker id="arr-' + sid + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1L9 5L0 9z" fill="context-stroke"/></marker></defs><rect class="bgp" x="-5000" y="-5000" width="10000" height="10000" fill="url(#dots-' + sid + ')"/><g class="vp">' + svgInner + "</g></svg>" +
    '<div class="ctl"><button type="button" data-g="in" aria-label="Zoom in">+</button><button type="button" data-g="out" aria-label="Zoom out">−</button><button type="button" data-g="fit" aria-label="Fit to screen"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button></div>' +
    '<div class="hint">' + (roll ? (R ? "tap the next step" : "tap a position") : "drag · pinch · tap") + "</div>" + (roll && R && node(R.cur) && node(R.cur).k === "pos" ? '<div class="gtog" role="tablist"><button type="button" class="' + (R.by === "when" ? "" : "on") + '" data-act="roll-by" data-v="type">My moves</button><button type="button" class="' + (R.by === "when" ? "on" : "") + '" data-act="roll-by" data-v="when">Their situation</button></div>' : "") + '<div class="gchip"></div>' + bar + "</div>" + (legend || "");
}

/* --- roll graph ("second brain" view): the node you are in sits in the middle, every legal next step
   orbits it, what lies behind those is faded further out, the way you came trails off to the left.
   Tap a node to jump there. --- */
const FINISH = { id: "finish", k: "fin", n: "Tap!", t: "", cat: "" };
function nextOf(n) {
  if (!n || n.k === "fin") return [];
  const out = kids(n.id).filter(allowed).map((c) => ({ n: c, how: c.k === "df" ? "they" : "me", f: c.f || "" }));
  if (n.k === "mv") {
    const oc = (n.oc && n.oc.length ? n.oc : n.to ? [{ to: n.to, f: "common" }] : []).filter((o) => node(o.to));
    for (const o of oc) out.push({ n: node(o.to), how: "works", f: o.f || "common", label: o.n || "" });
    if (n.t === "sub") out.push({ n: FINISH, how: "tap" });
  }
  if (n.k === "df" && n.to && node(n.to)) out.push({ n: node(n.to), how: "lands", f: n.f || "common" });
  return out;
}
function gNode(n, x, y, r, role, attrs, badge, sub) {
  const col = n.k === "fin" ? "var(--ok)" : n.k === "grp" ? (n.t ? typeColor(n.t) : "var(--accent)") : nodeColor(n); const inner = n.k === "fin" ? PICT.finish : n.k === "pos" ? PICT[n.cat] || PICT.guard : n.k === "df" ? TICON.df : n.k === "grp" && !n.t ? TICON.sit : TICON[n.t] || TICON.trans;
  const ir = Math.round(r * 1.2); const fs = role === "cur" ? 12 : 10.5; const r2 = role.indexOf("ring2") === 0, ans = role.indexOf("ans") > 0; const nm = n.k === "grp" ? tr(n.n) : dn(n); const ls = r2 && !ans ? [nm.length > 14 ? nm.slice(0, 13).trim() + "…" : nm] : wrapText(nm, role === "cur" ? 20 : ans ? 13 : 15);
  const trap = n.bait && role !== "cur" ? '<g class="g-trap"><circle cx="' + (-r * 0.8) + '" cy="' + (-r * 0.8) + '" r="8"/><svg x="' + (-r * 0.8 - 5) + '" y="' + (-r * 0.8 - 5) + '" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + TICON.bait + "</svg></g>" : "";
  const star = role.indexOf("planned") > 0 ? '<text class="star" y="' + (-r - 6) + '" text-anchor="middle">★</text>' : "";
  return '<g class="g-node rn ' + n.k + " " + role + '" data-id="' + n.id + '" data-role="' + role + '" ' + (attrs || "") + ' data-x="' + x.toFixed(1) + '" data-y="' + y.toFixed(1) + '" style="transform:translate(' + x.toFixed(1) + "px," + y.toFixed(1) + 'px);color:' + col + '">' +
    '<circle class="hit" r="' + (r + 12) + '"/><circle class="b" r="' + r + '"/>' +
    '<svg class="ic" x="' + (-ir / 2) + '" y="' + (-ir / 2) + '" width="' + ir + '" height="' + ir + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>" +
    ls.map((l, i) => '<text class="lb" y="' + (r + 12 + i * (fs + 2)) + '" text-anchor="middle" style="font-size:' + (r2 ? (ans ? 9.5 : 9) : fs) + 'px">' + esc(l) + "</text>").join("") + (sub ? '<text class="lb sub" y="' + (r + 12 + ls.length * (fs + 2)) + '" text-anchor="middle">' + esc((sub = tr(sub)).length > 24 ? sub.slice(0, 23).trim() + "…" : sub) + "</text>" : "") + (badge ? '<g class="g-badge"><circle cx="' + (r * 0.75) + '" cy="' + (-r * 0.75) + '" r="9"/><text x="' + (r * 0.75) + '" y="' + (-r * 0.75 + 3.3) + '" text-anchor="middle">' + badge + "</text></g>" : "") + trap + star + "</g>";
}
function gEdge(ka, a, kb, b, cls, color) { return '<line class="g-edge ' + cls + '" data-a="' + ka + '" data-b="' + kb + '" x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '"' + (color ? ' style="stroke:' + color + '"' : "") + "/>"; }
function rollGraphSvg() {
  const R = UI.roll; let nodesOut = "", edges = ""; const P = {}; const groupItems = {}; let planned = null; let minX = -40, maxX = 40, minY = -40, maxY = 40;
  const put = (key, n, x, y, r, role, attrs, badge, sub) => { P[key] = [x, y]; if (R && R.plan) { const pid = R.plan && planned; if (pid && (n.id === pid || (n.k === "grp" && (groupItems[key] || []).some((it) => it.n.id === pid)))) role += " planned"; } nodesOut += gNode(n, x, y, r, role, 'data-k="' + key + '" ' + (attrs || ""), badge, sub); minX = Math.min(minX, x - 60); maxX = Math.max(maxX, x + 60); minY = Math.min(minY, y - 40); maxY = Math.max(maxY, y + 40); };
  if (!R) {
    const CR = 150; CATS.forEach(([cat], i) => { const a = (-90 + i * 72) * Math.PI / 180; const cx = Math.cos(a) * CR, cy = Math.sin(a) * CR; const ps = positions().filter((p) => p.cat === cat); const rr = ps.length > 1 ? 30 + ps.length * 7 : 0; ps.forEach((p, j) => { const b = a + (j / ps.length) * 2 * Math.PI; put("s:" + p.id, p, cx + Math.cos(b) * rr, cy + Math.sin(b) * rr, 15, "start"); }); });
    const seen = {}; for (const m of nodes()) if (m.k === "mv" && m.to && P["s:" + m.to]) { const from = posOf(m.id).id; const k = from + ">" + m.to; if (from === m.to || !P["s:" + from] || seen[k]) continue; seen[k] = 1; edges += gEdge("s:" + from, P["s:" + from], "s:" + m.to, P["s:" + m.to], "faint", CAT_COLOR[node(from).cat]); }
    return canvasHtml("roll", edges + nodesOut, { x: minX, y: minY, w: maxX - minX, h: maxY - minY }, "", true);
  }
  const cur = R.cur === "finish" ? FINISH : node(R.cur) || node(R.pos);
  // trail (the way you came), to the left
  const prev = R.steps.slice(0, -1); let lastKey = "c";
  for (let i = 0; i < Math.min(4, prev.length); i++) { const st = prev[prev.length - 1 - i]; const n = node(st.id); if (!n) break; const key = "t" + i; const x = -(i + 1) * 78, y = i % 2 ? 18 : -18; put(key, n, x, y, 11, "trail", 'data-i="' + (prev.length - 1 - i) + '"'); edges += gEdge(key, [x, y], lastKey, lastKey === "c" ? [0, 0] : P[lastKey], "trail"); lastKey = key; }
  // next steps on the right; many options are bundled by type into hubs
  const all = nextOf(cur); let next = all, hubs = null;
  const whens = cur.k === "pos" ? [...new Set(all.map((e) => e.n.when || ""))] : [];
  const plan = R.plan ? setupById(R.plan) : null; planned = plan && plan.steps.length > R.steps.length && R.steps.every((s, i) => plan.steps[i] && plan.steps[i].id === s.id) ? plan.steps[R.steps.length].id : null;
  if (cur.k === "pos" && R.by === "when" && whens.length > 1 && all.length > 5) { hubs = {}; for (const e of all) (hubs[e.n.when || ""] = hubs[e.n.when || ""] || []).push(e);
    { const ks = Object.keys(hubs).filter((k) => k).sort((a, b) => hubs[b].length - hubs[a].length); if (ks.length > 7) { const rest = ks.slice(6); hubs["Other situations"] = hubs["Other situations"] || []; for (const k of rest) { hubs["Other situations"].push(...hubs[k]); delete hubs[k]; } } }
    next = Object.keys(hubs).sort((a, b) => (a === "" ? -1 : b === "" ? 1 : 0)).map((w) => ({ n: { id: "g:" + (w || "any"), k: "grp", n: w || "Any time", t: "", cat: "", when: w }, how: "group", items: hubs[w] })); }
  else if (cur.k === "pos" && all.length > 6) { hubs = {}; for (const e of all) (hubs[e.n.t || "trans"] = hubs[e.n.t || "trans"] || []).push(e); const order = TYPES.map((t) => t[0]); next = Object.keys(hubs).sort((a, b) => order.indexOf(a) - order.indexOf(b)).map((t) => ({ n: { id: "g:" + t, k: "grp", n: TNAME[t] + (hubs[t].length > 1 ? "s" : ""), t, cat: "" }, how: "group", items: hubs[t] })); }
  const n1 = next.length; const r1 = Math.min(170, Math.max(112, 96 + n1 * 9)); const span = n1 > 1 ? Math.min(200, 60 + n1 * 28) : 0;
  next.forEach((e, k) => {
    if (e.how === "group") {
      const deg = n1 > 1 ? -span / 2 + (span / (n1 - 1)) * k : 0; const a = deg * Math.PI / 180; const x = Math.cos(a) * r1, y = Math.sin(a) * r1; const gk = e.n.t || e.n.id; const key = "h:" + gk; const open = R.grp === gk; groupItems[key] = e.items;
      put(key, e.n, x, y, open ? 19 : 16, "group" + (open ? " open" : ""), 'data-t="' + esc(gk) + '"', e.items.length);
      edges += gEdge("c", [0, 0], key, [x, y], "step" + (open ? "" : " faint"), e.n.t ? typeColor(e.n.t) : "var(--accent)");
      if (open) { const m = e.items.length; const sector = Math.min(170, 30 + m * 22); const two = m > 6; e.items.forEach((it, j) => { const d2 = deg + (m > 1 ? -sector / 2 + (sector / (m - 1)) * j : 0); const a2 = d2 * Math.PI / 180; const rr = r1 + 96 + (two && j % 2 ? 78 : 0); const x2 = Math.cos(a2) * rr, y2 = Math.sin(a2) * rr; const k2 = "n:" + it.n.id; put(k2, it.n, x2, y2, 16, "next" + (it.f === "rare" ? " rare" : ""), 'data-how="' + it.how + '"', "", it.n.when); edges += gEdge(key, [x, y], k2, [x2, y2], "step", nodeColor(it.n));
          const n2 = two ? [] : nextOf(it.n).filter((z) => z.n.k === "df").slice(0, 2); const sec2 = m > 1 ? Math.min(24, sector / (m - 1) * 0.8) : 30;
          n2.forEach((e2, q) => { const d3 = d2 + (n2.length > 1 ? -sec2 / 2 + sec2 * q : 0); const a3 = d3 * Math.PI / 180; const x3 = Math.cos(a3) * (r1 + 170), y3 = Math.sin(a3) * (r1 + 170); const k3 = "n2:" + it.n.id + ":" + e2.n.id; put(k3, e2.n, x3, y3, 9, "ring2", 'data-p="' + it.n.id + '"'); edges += gEdge(k2, [x2, y2], k3, [x3, y3], "faint df", nodeColor(e2.n)); }); }); }
      return;
    }
    const deg = n1 > 1 ? -span / 2 + (span / (n1 - 1)) * k : 0; const a = deg * Math.PI / 180; const x = Math.cos(a) * r1, y = Math.sin(a) * r1; const key = "n:" + e.n.id;
    put(key, e.n, x, y, e.f === "rare" ? 14 : 17, "next" + (e.f === "rare" ? " rare" : "") + (e.how === "works" ? " works" : ""), 'data-how="' + e.how + '"');
    edges += gEdge("c", [0, 0], key, [x, y], "step " + e.how + (e.n.k === "df" || e.how === "lands" ? " df" : ""), e.n.k === "fin" ? "var(--ok)" : e.how === "works" ? "var(--ok)" : e.how === "lands" ? "var(--df-ink)" : nodeColor(e.n));
    const isDf = e.n.k === "df"; const next2 = nextOf(e.n).slice(0, isDf ? 4 : 3); const sector = n1 > 1 ? Math.min(isDf ? 56 : 44, span / (n1 - 1) * 0.9) : 60;
    next2.forEach((e2, j) => { const d2 = deg + (next2.length > 1 ? -sector / 2 + (sector / (next2.length - 1)) * j : 0); const a2 = d2 * Math.PI / 180; const rr = r1 + (isDf ? 98 : 92); const x2 = Math.cos(a2) * rr, y2 = Math.sin(a2) * rr; const key2 = "n2:" + e.n.id + ":" + e2.n.id; put(key2, e2.n, x2, y2, isDf ? 12 : 10, isDf ? "ring2 ans" : "ring2", 'data-p="' + e.n.id + '"'); edges += gEdge(key, [x, y], key2, [x2, y2], "faint" + (e2.n.k === "df" ? " df" : e2.how === "works" ? " works" : ""), e2.n.k === "fin" || e2.how === "works" ? "var(--ok)" : nodeColor(e2.n)); });
    if (nextOf(e.n).length > next2.length) { const a3 = (deg + sector / 2 + 10) * Math.PI / 180; nodesOut += '<text class="more" x="' + (Math.cos(a3) * (r1 + 92)).toFixed(1) + '" y="' + (Math.sin(a3) * (r1 + 92) + 4).toFixed(1) + '" text-anchor="middle">+' + (nextOf(e.n).length - next2.length) + "</text>"; }
  });
  put("c", cur, 0, 0, 26, "cur");
  if (hubs && !R.grp) nodesOut += '<text class="more" x="0" y="52" text-anchor="middle">tap a group to see the moves</text>';
  if (!n1) nodesOut += '<text class="more" x="70" y="4">no next step written · add one or tap “Elsewhere”</text>';
  return canvasHtml("roll", edges + nodesOut, { x: minX, y: minY, w: maxX - minX, h: maxY - minY }, "", true);
}
/* animate nodes from where they were in the previous frame */
function animateRoll(el) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; const prev = UI.graph.rollPrev || {}; const now = {}; const items = [];
  el.querySelectorAll(".rn").forEach((g) => { const key = g.dataset.k, id = g.dataset.id, to = [+g.dataset.x, +g.dataset.y]; const from = prev[key] || prev["id:" + id] || null; now[key] = to; now["id:" + id] = to; items.push({ g, key, from, to }); });
  UI.graph.rollPrev = now; if (reduced) return;
  const lines = [...el.querySelectorAll("line.g-edge")]; const cur = {}; const t0 = performance.now(), D = 460;
  for (const it of items) if (!it.from) { it.g.style.opacity = "0"; }
  const frame = (t) => {
    const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
    for (const it of items) { const p = it.from ? [it.from[0] + (it.to[0] - it.from[0]) * e, it.from[1] + (it.to[1] - it.from[1]) * e] : it.to; cur[it.key] = p; it.g.style.transform = "translate(" + p[0].toFixed(1) + "px," + p[1].toFixed(1) + "px)"; if (!it.from) it.g.style.opacity = String(Math.max(0, (k - 0.3) / 0.7)); }
    for (const l of lines) { const a = cur[l.dataset.a], b = cur[l.dataset.b]; if (a) { l.setAttribute("x1", a[0]); l.setAttribute("y1", a[1]); } if (b) { l.setAttribute("x2", b[0]); l.setAttribute("y2", b[1]); } }
    if (k < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
function rollTap(g) {
  const role = g.dataset.role, id = g.dataset.id;
  if (role === "start") { rollStart(id); return; }
  const R = UI.roll; if (!R) return;
  if (role === "trail") { rollRewind(+g.dataset.i); return; }
  if (role === "cur") { quickSheet(id); return; }
  if (role.indexOf("group") === 0) { R.grp = R.grp === g.dataset.t ? null : g.dataset.t; render(); return; }
  if (role.indexOf("next") === 0 && g.dataset.how === "works" && R.cur !== id) { /* an outcome: the move worked and we landed here */ }
  if (role.indexOf("ring2") === 0) { rollStepTo(g.dataset.p); if (UI.roll && UI.roll.cur === g.dataset.p) rollStepTo(id); return; }
  rollStepTo(id);
}
function rollStepTo(id) {
  const R = UI.roll; if (!R) return;
  if (id === "finish") { R.finished = true; rollEndSheet(true); return; }
  const n = node(id); if (!n) return;
  if (n.k === "pos") rollGoto(id, "worked"); else rollPick(id);
}
function rollRewind(i) { const R = UI.roll; if (!R || i >= R.steps.length - 1) return; R.steps = R.steps.slice(0, i + 1); const last = R.steps[i]; R.cur = last.id; const lp = R.steps.slice().reverse().find((x) => x.k === "pos"); R.pos = lp ? lp.id : R.pos; R.finished = false; render(); toast("Back to " + last.n); }
function quickSheet(id) {
  const n = node(id); if (!n) return;
  const b = '<div class="actions" style="align-items:center"><span class="pict" style="color:' + nodeColor(n) + '">' + iconFor(n) + "</span>" + tbadge(n) + metaBadges(n, true) + "</div>" + (n.k === "pos" && n.them ? '<p class="small"><span class="muted">Them:</span> ' + esc(n.them) + "</p>" : "") + (n.when ? '<p class="small"><span class="muted">Opens when:</span> ' + esc(n.when) + "</p>" : "") + (n.bait ? '<div class="tip"><b>Trap:</b> ' + esc(n.bait) + "</div>" : "") + (n.s && n.s.length ? '<ol class="steps">' + n.s.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ol>" : "") + (n.x ? '<p class="small">' + esc(n.x) + "</p>" : "") + (!n.s.length && !n.x ? '<p class="muted small">No steps written yet.</p>' : "") + '<button class="btn ghost wide" data-act="open" data-id="' + n.id + '">Open & edit</button>';
  openSheet(n.n, b, {});
}
/* --- technique mind map: root on the left, branches to the right (2 levels, tap +N for more) --- */
function mindMapSvg(root) {
  const gid = "n:" + root.id, st = gState(gid); const R = 15, RR = 24, GAPX = 44, ROW = 40, DEPTH = 2;
  function build(n, depth) { const all = kids(n.id); const ch = depth < DEPTH || st.open[n.id] ? all : []; const node = { n, w: R * 2 + 8 + TW(wrapText(n.n, 22)[0], 11) + 8, ch: ch.map((c) => build(c, depth + 1)), hidden: ch.length ? 0 : all.length }; node.inner = node.ch.reduce((a, c) => a + c.height, 0); node.height = Math.max(ROW, node.inner); return node; }
  const top = kids(root.id).map((c) => build(c, 1)); const total = top.reduce((a, c) => a + c.height, 0);
  let edges = "", nodesOut = "", minX = -RR - 10, maxX = RR, minY = -RR - 10, maxY = RR + 24;
  function place(list, x0, yTop, color, px, py) {
    let y = yTop;
    for (const nd of list) {
      const cy = y + nd.height / 2, cx = x0 + R; const col = nd.n.k === "df" ? "var(--df-ink)" : color || typeColor(nd.n.t);
      edges += '<path class="g-edge' + (nd.n.k === "df" ? " df" : "") + '" style="stroke:' + col + '" d="M' + px + " " + py + " C" + (px + GAPX * 0.55) + " " + py + "," + (cx - R - GAPX * 0.55) + " " + cy + "," + (cx - R) + " " + cy + '"/>';
      nodesOut += iconNode(nd.n, cx, cy, R, { color: col, side: true, max: 22, cls: st.sel === nd.n.id ? "sel" : "", badge: nd.hidden || 0 });
      maxX = Math.max(maxX, x0 + nd.w + 10); minY = Math.min(minY, cy - ROW / 2); maxY = Math.max(maxY, cy + ROW / 2);
      if (nd.ch.length) place(nd.ch, x0 + nd.w + GAPX, cy - nd.inner / 2, col, x0 + nd.w - 6, cy);
      y += nd.height;
    }
  }
  place(top, RR + GAPX, -total / 2, null, RR, 0);
  const rootSvg = iconNode(root, 0, 0, RR, { color: nodeColor(root), cls: "root" + (st.sel === root.id ? " sel" : ""), max: 18, fs: 12 });
  const legend = '<div class="legend" style="padding-top:10px"><span><i style="background:var(--t-sub)"></i>Submission</span><span><i style="background:var(--t-sweep)"></i>Sweep</span><span><i style="background:var(--t-pass)"></i>Pass</span><span><i style="background:var(--t-td)"></i>Takedown</span><span><i style="background:var(--t-esc)"></i>Escape</span><span><i style="background:var(--t-trans)"></i>Transition · grip · control</span><span><i class="dash"></i>Their defense</span></div>';
  return canvasHtml(gid, edges + nodesOut + rootSvg, { x: minX, y: minY, w: maxX - minX, h: maxY - minY }, legend);
}

/* --- canvas behaviour: pan, pinch, wheel, tap, momentum --- */
function initGraphs() {
  document.querySelectorAll(".canvas[data-graph]").forEach((el) => {
    if (el.dataset.ready) return; el.dataset.ready = "1";
    const id = el.dataset.graph, st = gState(id), vp = el.querySelector(".vp"), bgp = el.querySelector(".bgp");
    const bx = +el.dataset.x0, by = +el.dataset.y0, bw = +el.dataset.w, bh = +el.dataset.h; const S0 = 1;
    if (id !== "roll") el.style.height = Math.min(460, Math.max(220, Math.round(bh * S0 + 70))) + "px";
    const W = el.clientWidth || 358, H = el.clientHeight || 440;
    const apply = () => { vp.setAttribute("transform", "translate(" + st.tx + " " + st.ty + ") scale(" + st.s + ")"); bgp.setAttribute("transform", "translate(" + (st.tx % (22 * st.s)) + " " + (st.ty % (22 * st.s)) + ") scale(" + st.s + ")"); };
    const fit = () => { const s = Math.min(1.2, Math.max(0.5, Math.min((W - 24) / bw, (H - 24) / bh))); st.s = s; st.tx = (W - bw * s) / 2 - bx * s; st.ty = bh * s > H - 24 ? 12 - by * s : (H - bh * s) / 2 - by * s; apply(); };
    const zoomAt = (f, cx, cy) => { const ns = Math.min(3, Math.max(0.35, st.s * f)); const k = ns / st.s; st.tx = cx - (cx - st.tx) * k; st.ty = cy - (cy - st.ty) * k; st.s = ns; apply(); };
    const home = () => { const s = Math.min(S0, Math.max(0.8, (W - 16) / bw)); st.s = s; st.tx = bw * s <= W - 16 ? (W - bw * s) / 2 - bx * s : 8 - bx * s; st.ty = bh * s <= H - 24 ? (H - bh * s) / 2 - by * s : H / 2; apply(); };
    const centerOn = (nid) => { const g = el.querySelector('.g-node[data-id="' + nid + '"] circle.b'); if (!g) return; const cx = +g.getAttribute("cx"), cy = +g.getAttribute("cy"); st.tx = W / 2 - cx * st.s; st.ty = H / 2 - cy * st.s; apply(); };
    if (id === "roll") { el.style.height = (UI.roll ? 420 : 400) + "px"; const W2 = el.clientWidth || 358, H2 = el.clientHeight || 420; if (!st.s || !UI.roll) st.s = UI.roll ? 1 : Math.min(1, (W2 - 16) / bw); st.tx = UI.roll ? W2 * 0.42 : W2 / 2; st.ty = H2 / 2 - (UI.roll ? 14 : 0); apply(); if (UI.roll) el.querySelector(".ctl").hidden = true; animateRoll(el); }
    else { if (!st.s) home(); else apply(); updateChip(id, el.querySelector(".gchip")); }
    if (st.focus) { centerOn(st.focus); st.focus = null; }
    const ptrs = new Map(); let moved = false, down = null, lastT = 0, vx = 0, vy = 0, raf = 0, pinch0 = null;
    el.addEventListener("pointerdown", (e) => { if (e.target.closest(".ctl,.gchip,.fbar,.gtog")) return; cancelAnimationFrame(raf); el.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 1) { down = { x: e.clientX, y: e.clientY, t: Date.now(), target: e.target }; moved = false; vx = vy = 0; lastT = performance.now(); } else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), s: st.s }; } });
    el.addEventListener("pointermove", (e) => {
      if (!ptrs.has(e.pointerId)) return; const prev = ptrs.get(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) { const dx = e.clientX - prev.x, dy = e.clientY - prev.y; if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) moved = true; if (moved) { st.tx += dx; st.ty += dy; const now = performance.now(), dt = Math.max(1, now - lastT); vx = dx / dt; vy = dy / dt; lastT = now; apply(); } }
      else if (ptrs.size === 2 && pinch0) { moved = true; const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); const r = el.getBoundingClientRect(); zoomAt((pinch0.s * d / pinch0.d) / st.s, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); }
    });
    const up = (e) => {
      if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = null;
      if (ptrs.size === 0 && down) {
        if (!moved && Date.now() - down.t < 600) { const g = down.target.closest ? down.target.closest(".g-node") : null; if (id === "roll") { if (g) rollTap(g); } else tapNode(id, g ? g.dataset.id : null, el); }
        else if (moved && Math.hypot(vx, vy) > 0.08 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) { let last = performance.now(); const step = (t) => { const dt = Math.min(40, t - last); last = t; st.tx += vx * dt; st.ty += vy * dt; const k = Math.pow(0.93, dt / 16); vx *= k; vy *= k; apply(); if (Math.hypot(vx, vy) > 0.01) raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); }
        down = null;
      }
    };
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", (e) => { e.preventDefault(); const r = el.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 0.87, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    el.querySelectorAll(".ctl button").forEach((b) => b.addEventListener("click", () => { if (b.dataset.g === "fit") fit(); else zoomAt(b.dataset.g === "in" ? 1.25 : 0.8, W / 2, H / 2); }));
  });
}
function tapNode(gid, nid, el) {
  const st = gState(gid);
  if (!nid) { if (st.sel) { st.sel = null; refreshGraph(gid, el); } return; }
  { const g = el.querySelector('.g-node[data-id="' + nid + '"] .g-badge'); if (g) st.open[nid] = true; else if (st.sel === nid && kids(nid).length) st.open[nid] = !st.open[nid]; }
  st.sel = nid; refreshGraph(gid, el);
}
function refreshGraph(gid, el) {
  const html = mindMapSvg(node(gid.slice(2)));
  const tmp = document.createElement("div"); tmp.innerHTML = html; const fresh = tmp.querySelector(".canvas");
  el.replaceWith(fresh); initGraphs();
}
function updateChip(gid, chip) {
  const st = gState(gid); const n = st.sel ? node(st.sel) : null;
  if (!n) { chip.classList.remove("on"); chip.innerHTML = ""; return; }
  let sub = (n.k === "df" ? "Their defense" : n.k === "pos" ? "Position" : TNAME[n.t] || "Option") + (kids(n.id).length ? " · " + kids(n.id).length + (n.k === "mv" ? " defenses" : " answers") : "") + (n.to && node(n.to) ? " · → " + node(n.to).n : ""); const btns = '<button class="btn" data-act="open" data-id="' + n.id + '">Open</button>';
  chip.innerHTML = '<span class="pict" style="color:' + nodeColor(n) + '">' + iconFor(n) + '</span><div class="txt"><b>' + esc(n.n) + "</b><small>" + esc(sub) + "</small></div>" + btns;
  chip.classList.add("on");
}

/* ======================= ROLL (step through a live roll) ======================= */
/* UI.roll = { pos, cur, steps:[{id,k,n,t,how}], t0 } · cur is the node whose options are shown */
function rollStart(posId) {
  const p = node(posId) || positions()[0]; if (!p) return;
  UI.roll = { pos: p.id, cur: p.id, steps: [{ id: p.id, k: "pos", n: p.n, t: "" }], t0: Date.now() };
  UI.tech.id = null; UI.tech.view = "pos"; UI.tech.q = ""; UI.walkCat = null; { const pv = UI.graph.rollPrev && UI.graph.rollPrev["id:" + p.id]; const np = {}; np["id:" + p.id] = pv || [0, 0]; UI.graph.rollPrev = np; } render();
}
function rollGoto(posId, how) {
  const R = UI.roll, p = node(posId); if (!R || !p) return;
  const times = R.steps.filter((x) => x.k === "pos" && x.id === p.id).length;
  R.pos = p.id; R.cur = p.id; R.grp = null; R.steps.push({ id: p.id, k: "pos", n: p.n, t: "", how: how || "" }); UI.walkCat = null; render();
  if (times) toast("Back in " + p.n + " (" + (times + 1) + (times === 1 ? "nd" : times === 2 ? "rd" : "th") + " time)");
}
function rollPick(nid) {
  const R = UI.roll, n = node(nid); if (!R || !n) return;
  R.steps.push({ id: n.id, k: n.k, n: n.n, t: n.t || "" }); R.cur = n.id; R.grp = null;
  if (n.k === "mv" && !kids(n.id).length) { if (n.to && node(n.to)) { rollGoto(n.to, "auto"); return; } if (n.t === "sub") { R.cur = n.id; } }
  if (n.k === "df" && !kids(n.id).length && n.to && node(n.to)) { rollGoto(n.to, "they"); return; }
  render();
}
function rollOtherSheet() {
  const b = '<p class="small muted">Pick the position you ended up in. The step is marked as a gap so you can add what happened to your tree later.</p>' + field("f-pos", "Now I’m in", '<select id="f-pos">' + positions().map((p) => '<option value="' + p.id + '">' + esc(p.n) + "</option>").join("") + "</select>");
  openSheet("Something else happened", b, { saveLabel: "Continue", onSave() { rollGoto(sv("f-pos"), "gap"); return true; } });
}
function rollEndSheet(finished) {
  const R = UI.roll; if (!R) return;
  const b = '<div class="field"><span class="lbl">How did it end?</span>' + chips("res", [["sub", "I finished a sub"], ["points", "Won on points"], ["tapped", "I got tapped"], ["time", "Time ran out"], ["drill", "Just drilling"]], finished ? "sub" : "time") + "</div>" + field("f-note", "Note", ta("f-note", "", "What worked, what to fix…")) + '<div class="field"><span class="lbl">Date</span>' + inp("f-d", todayIso(), "date", 'max="' + todayIso() + '"') + "</div>" + (R.steps.length >= 2 ? '<div class="field"><span class="lbl">Keep this path as a setup</span>' + chips("mk", [["no", "No"], ["yes", "Yes"]], "no") + "</div>" : "");
  openSheet("End roll", b, { state: { picks: { res: finished ? "sub" : "time", mk: "no" } }, saveLabel: "Save roll", delLabel: "Discard", onDelete() { UI.roll = null; render(); return true; }, onSave() { const rec = { id: uid(), d: sv("f-d") || todayIso(), res: pickVal("res", "time"), note: sv("f-note").trim(), steps: R.steps, sec: Math.round((Date.now() - R.t0) / 1000) }; S.rolls.items.push(rec); save("rolls"); if (pickVal("mk", "no") === "yes") { const st = R.steps.filter((s) => s.id !== "finish"); S.plans.setups.push({ id: uid(), n: setupName(st), steps: st.map((s) => ({ id: s.id, k: s.k, n: s.n, t: s.t || "" })), x: "" }); save("plans"); } UI.roll = null; UI.tech.view = "rolls"; UI.rollId = rec.id; render(); toast("Roll saved"); return true; } });
}
function rollStatsFor(nid) { let used = 0; for (const r of S.rolls.items) if (r.steps.some((s) => s.id === nid)) used++; return { used }; }
const RES_NAME = { sub: "Finished with a submission", points: "Won on points", tapped: "Got tapped", time: "Time ran out", drill: "Drilling" };
function rollSummary(r) {
  const ps = r.steps.filter((s) => s.k === "pos"), mv = r.steps.filter((s) => s.k === "mv"), df = r.steps.filter((s) => s.k === "df"), gaps = r.steps.filter((s) => s.how === "gap");
  const subs = mv.filter((s) => s.t === "sub").length; const counts = {}; for (const s of ps) counts[s.n] = (counts[s.n] || 0) + 1; const most = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return { ps, mv, df, gaps, subs, most, uniq: new Set(ps.map((s) => s.id)).size };
}
function vRolls() {
  const items = S.rolls.items.slice().sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0));
  if (UI.rollId) { const r = items.find((x) => x.id === UI.rollId); if (r) return vRoll(r); UI.rollId = null; }
  let h = "";
  if (!items.length) return '<div class="card"><p class="empty">No rolls yet. Go to Positions, tap “Start a roll” and walk through a round step by step. Every roll is saved here for analysis.</p><button class="btn wide" data-act="roll-start" data-pos="st">Start a roll</button></div>';
  // aggregate
  const posC = {}, mvC = {}, gapC = {}, endC = {}; let subs = 0;
  for (const r of items) { endC[r.res] = (endC[r.res] || 0) + 1; for (const s of r.steps) { if (s.k === "pos") posC[s.n] = (posC[s.n] || 0) + 1; if (s.k === "mv") mvC[s.n] = (mvC[s.n] || 0) + 1; if (s.how === "gap") { const prev = r.steps[r.steps.indexOf(s) - 1]; if (prev) gapC[prev.n] = (gapC[prev.n] || 0) + 1; } } subs += rollSummary(r).subs; }
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n || 5);
  const bars = (arr, color) => { const mx = Math.max(1, ...arr.map((x) => x[1])); return arr.map((x) => '<div class="row"><div class="txt"><b>' + esc(x[0]) + '</b><div class="bar"><i style="width:' + Math.round((x[1] / mx) * 100) + "%;background:" + color + '"></i></div></div><span class="num">' + x[1] + "</span></div>").join(""); };
  h += '<div class="card"><div class="summary four"><div class="stat"><b>' + items.length + '</b><span>rolls</span></div><div class="stat"><b>' + (endC.sub || 0) + '</b><span>finished</span></div><div class="stat"><b>' + (endC.tapped || 0) + '</b><span>tapped</span></div><div class="stat"><b>' + Object.keys(gapC).length + '</b><span>gaps</span></div></div></div>';
  h += '<div class="card"><h3>Where you spend your rolls</h3><div class="list">' + bars(top(posC), "var(--accent)") + "</div></div>";
  h += '<div class="card"><h3>Moves you reach for</h3><div class="list">' + bars(top(mvC), "var(--t-sweep)") + "</div></div>";
  if (Object.keys(gapC).length) h += '<div class="card"><h3>Gaps in your tree</h3><p class="muted small">Places where “something else happened”. Add what the opponent did and your answer.</p><div class="list">' + bars(top(gapC), "var(--warn)") + "</div></div>";
  h += '<div class="card"><div class="card-head"><h3>Rolls</h3><button class="btn" data-act="roll-start" data-pos="st">Start a roll</button></div><div class="list">' + items.slice(0, 40).map((r) => { const s = rollSummary(r); return '<button class="row" data-act="roll-open" data-id="' + r.id + '"><span class="pill ' + (r.res === "sub" ? "ok" : r.res === "tapped" ? "bad" : "na") + '">' + (r.res === "sub" ? "Sub" : r.res === "tapped" ? "Tapped" : r.res === "drill" ? "Drill" : "Time") + '</span><div class="txt"><b>' + fmtD(r.d) + " · " + s.uniq + (s.uniq === 1 ? " position, " : " positions, ") + s.mv.length + (s.mv.length === 1 ? " move</b><small>" : " moves</b><small>") + esc(s.ps.map((p) => p.n).slice(0, 4).join(" → ")) + (s.ps.length > 4 ? " → …" : "") + "</small></div>" + CHEV + "</button>"; }).join("") + "</div></div>";
  return h;
}
function vRoll(r) {
  const s = rollSummary(r);
  let h = '<button class="back" data-act="roll-close"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Rolls</button>';
  h += '<div class="card"><h2>' + fmtLong(r.d) + '</h2><p class="muted small">' + RES_NAME[r.res] + (r.sec ? " · " + (r.sec < 90 ? r.sec + " s" : Math.round(r.sec / 60) + " min") : "") + "</p>" + (r.note ? '<p class="small">' + esc(r.note) + "</p>" : "") +
    '<div class="summary four"><div class="stat"><b>' + s.uniq + '</b><span>positions</span></div><div class="stat"><b>' + s.mv.length + '</b><span>moves</span></div><div class="stat"><b>' + s.df.length + '</b><span>defended</span></div><div class="stat"><b>' + s.gaps.length + '</b><span>gaps</span></div></div>' +
    (s.most && s.most[1] > 1 ? '<p class="small">You kept coming back to <b>' + esc(s.most[0]) + "</b> (" + s.most[1] + " times).</p>" : "") + "</div>";
  h += '<div class="card"><h3>Step by step</h3><div class="path">' + r.steps.map((st, i) => { const n = node(st.id); const gap = st.how === "gap"; return '<button class="pn ' + st.k + (i === r.steps.length - 1 ? " cur" : "") + '" data-act="open" data-id="' + st.id + '"' + (n ? "" : " disabled") + '><span class="rail"><i></i></span><span class="pt"><span class="k">' + (st.k === "pos" ? (gap ? "ended up in (gap)" : i ? "now in" : "start") : st.k === "df" ? "they" : TNAME[st.t] || "me") + '</span><span class="nm">' + esc(st.n) + "</span></span></button>"; }).join("") + "</div></div>";
  if (s.gaps.length) h += '<div class="card"><h3>Fill the gaps</h3><p class="muted small">At these steps the tree had no answer. Add the defense or the follow-up so the next roll has one.</p><div class="list">' + s.gaps.map((g) => { const i = r.steps.indexOf(g); const prev = r.steps[i - 1]; return prev && node(prev.id) ? '<button class="row" data-act="open" data-id="' + prev.id + '"><div class="txt"><b>' + esc(prev.n) + "</b><small>then you ended up in " + esc(g.n) + "</small></div>" + CHEV + "</button>" : ""; }).join("") + "</div></div>";
  h += '<div class="actions"><button class="btn" data-act="roll-start" data-pos="' + (r.steps[0] ? r.steps[0].id : "st") + '">Roll again from the start</button>' + delBtn("roll:" + r.id, "roll-del", 'data-id="' + r.id + '"') + "</div>";
  return h;
}
/* Setup entry: a new move under another position whose result is this one. */
function entrySheet(posId) {
  const target = node(posId); if (!target) return;
  const srcs = positions().filter((p) => p.id !== posId);
  const b = field("f-n", "Move", inp("f-n", "", "text", 'autofocus placeholder="e.g. Pull guard from collar grip"')) +
    field("f-from", "Starting position", '<select id="f-from">' + srcs.map((p) => '<option value="' + p.id + '">' + esc(p.n) + "</option>").join("") + "</select>") +
    '<div class="field"><span class="lbl">Type</span>' + chips("t", TYPES.filter((t) => ["td", "sweep", "pass", "esc", "trans"].includes(t[0])), "trans") + "</div>" +
    field("f-when", "Opens when (situation)", inp("f-when", "", "text", 'placeholder="They push / they stand up"')) +
    field("f-s", "Steps (one per line)", ta("f-s", "", "Step 1\nStep 2"));
  openSheet("Entry into " + target.n, b, { state: { picks: { t: "trans" } }, onSave() {
    const name = sv("f-n").trim(); if (!name) { $("f-n").focus(); return false; }
    const from = sv("f-from"); if (!node(from)) return false;
    const t = pickVal("t", "trans");
    nodes().push({ id: uid(), k: "mv", p: from, n: name, en: "", t, s: lines(sv("f-s")), x: "", to: posId, cat: "", gi: "both", belt: "white", pts: t === "td" || t === "sweep" ? 2 : t === "pass" ? 3 : 0, energy: 2, when: sv("f-when").trim(), bait: "", kids: true, oc: [{ to: posId, f: "common" }] });
    save("tree"); toast("Entry added"); render(); return true;
  } });
}
function nodeSheet(id, parentId) {
  const n = id ? node(id) : null; const parent = parentId ? node(parentId) : null;
  const kind = n ? n.k : parent ? (parent.k === "mv" ? "df" : "mv") : "pos";
  const title = n ? "Edit" : kind === "pos" ? "New position" : kind === "df" ? "How does the opponent defend" : parent && parent.k === "df" ? "Then what do I do" : "New option";
  let b = field("f-n", "Name", inp("f-n", n ? n.n : "", "text", 'autofocus placeholder="' + (kind === "df" ? "e.g. They post a hand" : "e.g. Armbar") + '"'));
  b += field("f-en", "Mongolian name (optional)", inp("f-en", n ? n.en : "", "text", 'placeholder="armbar"'));
  if (kind === "pos") b += '<div class="field"><span class="lbl">Category</span>' + chips("cat", CATS, n ? n.cat : "guard") + "</div>";
  if (kind === "mv") b += '<div class="field"><span class="lbl">Type</span>' + chips("t", TYPES, n ? n.t : "sub") + "</div>";
  if (kind !== "df") b += field("f-s", "Steps (one per line)", ta("f-s", (n ? n.s : []).join("\n"), "Step 1\nStep 2"));
  b += field("f-x", kind === "df" ? "Note" : "Notes, tips", ta("f-x", n ? n.x : "", ""));
  if (kind === "mv") b += field("f-to", "Usual result (position)", '<select id="f-to"><option value="">—</option>' + positions().map((p) => '<option value="' + p.id + '"' + (n && n.to === p.id ? " selected" : "") + ">" + esc(p.n) + "</option>").join("") + "</select>");
  if (kind === "mv") b += field("f-when", "Opens when (situation)", inp("f-when", n ? n.when : "", "text", 'placeholder="They push / they extend an arm / they stand up"')) +
    '<div class="grid2"><div class="field"><span class="lbl">Gi / no-gi</span>' + chips("gi", [["both", "Both"], ["gi", "Gi"], ["nogi", "No-gi"]], n ? n.gi || "both" : "both") + '</div><div class="field"><span class="lbl">From belt</span>' + chips("belt", [["white", "White"], ["blue", "Blue"], ["purple", "Purple"], ["brown", "Brown"]], n ? n.belt || "white" : "white") + "</div></div>" +
    '<div class="grid2">' + field("f-pts", "IBJJF points", inp("f-pts", n ? n.pts || 0 : 0, "number", 'inputmode="numeric" min="0" max="4"')) + '<div class="field"><span class="lbl">Energy (1–3)</span>' + scale("energy", n ? n.energy || 2 : 2, 1, 3) + "</div></div>" +
    field("f-bait", "Trap (what you offer, what you want them to do)", inp("f-bait", n ? n.bait : "", "text", 'placeholder="Leave the arm loose so they reach…"')) +
    '<div class="field"><span class="lbl">Kids rules</span>' + chips("kids", [["ok", "Allowed"], ["no", "Not for kids"]], n && n.kids === false ? "no" : "ok") + "</div>";
  if (kind === "df") b += field("f-dto", "They end up in (position, optional)", '<select id="f-dto"><option value="">— I answer from here</option>' + positions().map((p) => '<option value="' + p.id + '"' + (n && n.to === p.id ? " selected" : "") + ">" + esc(p.n) + "</option>").join("") + "</select>") + '<div class="field"><span class="lbl">How common</span>' + chips("f", [["common", "Common"], ["rare", "Rare"]], n ? n.f || "common" : "common") + "</div>" + field("f-bait", "Their trap (what they bait with)", inp("f-bait", n ? n.bait : "", "text", 'placeholder="They offer the underhook to…"'));
  if (kind === "pos") b += field("f-them", "Them (where the opponent is)", inp("f-them", n ? n.them || "" : "", "text", 'placeholder="On top, inside your locked legs…"'));
  if (kind === "pos") b += '<div class="field"><span class="lbl">Position quality</span>' + chips("rank", [["-2", "Hard"], ["-1", "Tough"], ["0", "Neutral"], ["1", "Good"], ["2", "Dominant"]], n ? String(n.rank || 0) : "0") + "</div>";
  openSheet(title, () => b + (kind === "mv" ? picker("oc", "Can also land in (tap + to mark rare)", "pos", { ph: "Position…", counts: true }) : ""), {
    state: { picks: { cat: n ? n.cat : "guard", t: n ? n.t : "sub", gi: n ? n.gi || "both" : "both", belt: n ? n.belt || "white" : "white", energy: n ? n.energy || 2 : 2, kids: n && n.kids === false ? "no" : "ok", f: n ? n.f || "common" : "common", rank: n ? String(n.rank || 0) : "0" }, pk: { oc: kind === "mv" && n && n.oc ? n.oc.filter((o) => node(o.to)).map((o) => ({ id: o.to, n: node(o.to).n, c: o.f === "rare" ? 2 : 1 })) : [] } },
    onSave() {
      const name = sv("f-n").trim(); if (!name) { $("f-n").focus(); return false; }
      const rec = n || { id: uid(), k: kind, p: parentId || null };
      rec.n = name; rec.en = sv("f-en").trim(); rec.x = sv("f-x").trim();
      if (kind === "pos") { rec.cat = pickVal("cat", "guard"); rec.rank = +pickVal("rank", "0"); rec.them = sv("f-them").trim(); }
      if (kind === "mv") { rec.t = pickVal("t", "sub"); rec.to = sv("f-to"); rec.when = sv("f-when").trim(); rec.gi = pickVal("gi", "both"); rec.belt = pickVal("belt", "white"); rec.pts = +sv("f-pts") || 0; rec.energy = pickVal("energy", 2); rec.bait = sv("f-bait").trim(); rec.kids = pickVal("kids", "ok") === "no" ? false : true; rec.oc = (UI.sheet.pk.oc || []).filter((x) => x.id).map((x) => ({ to: x.id, f: x.c >= 2 ? "rare" : "common" })); if (!rec.to && rec.oc.length) rec.to = rec.oc[0].to; }
      if (kind === "df") { rec.f = pickVal("f", "common"); rec.bait = sv("f-bait").trim(); rec.to = sv("f-dto"); }
      if (kind !== "df") rec.s = lines(sv("f-s"));
      if (!n) { nodes().push(rec); if (kind === "pos") UI.tech.id = null; else UI.tech.id = parentId; }
      save("tree"); toast(n ? "Saved" : "Added"); render(); return true;
    },
    onDelete: n ? () => { const ids = subtreeIds(n.id); S.tree.nodes = nodes().filter((x) => !ids.includes(x.id)); UI.tech.id = n.p || null; save("tree"); toast("Deleted"); go("enter-r"); return true; } : null,
  });
}
/* ======================= SETUPS (my own chain to a submission) ======================= */
function setupById(id) { return S.plans.setups.find((x) => x.id === id); }
function setupName(steps) { const last = steps[steps.length - 1]; const first = steps[0]; return (first ? first.n : "Setup") + " → " + (last ? last.n : "…"); }
function setupHasTrap(sp) { return sp.steps.some((s) => { const n = node(s.id); return n && n.bait; }); }
function setupEnds(sp) { const last = sp.steps[sp.steps.length - 1]; return last && last.k === "mv" && last.t === "sub"; }
function setupPath(sp) { return sp.steps.map((s, i) => '<span class="sp ' + s.k + '">' + (s.k === "df" ? "they: " : "") + esc(s.n) + "</span>").join('<span class="sep">›</span>'); }
function setupRow(sp) {
  return '<div class="plan"><button class="row" data-act="edit-setup" data-id="' + sp.id + '"><div class="txt"><b>' + esc(sp.n) + '</b><small class="spath">' + setupPath(sp) + "</small></div>" + CHEV + '</button><div class="refs">' +
    (setupEnds(sp) ? '<span class="pill ok">ends in a sub</span>' : '<span class="pill warn">no finish yet</span>') + (setupHasTrap(sp) ? '<span class="pill na">trap</span>' : "") + '<button class="chip" data-act="setup-roll" data-id="' + sp.id + '">Roll it</button></div></div>';
}
function vSetups() {
  let h = vRoute();
  h += '<div class="card"><div class="card-head"><h3>Setups</h3><span class="muted small">my paths to a submission</span></div>';
  if (!S.plans.setups.length) h += '<p class="empty">A setup is the chain you choose yourself: position → my move → their likely reaction → my answer … → submission. Build one, then roll it and the next planned step is starred on the graph.</p>';
  else h += '<div class="list">' + S.plans.setups.map(setupRow).join("") + "</div>";
  h += '<button class="btn ghost wide" data-act="add-setup">+ New setup</button></div>';
  return h;
}
function setupEdit(id, posId) {
  const sp = id ? setupById(id) : null;
  UI.setupEd = sp ? { id: sp.id, n: sp.n, x: sp.x || "", steps: sp.steps.slice() } : { id: null, n: "", x: "", steps: posId && node(posId) ? [{ id: posId, k: "pos", n: node(posId).n, t: "" }] : [] };
  UI.tech.id = null; UI.tech.q = ""; render();
}
function vSetupEdit() {
  const E = UI.setupEd; const last = E.steps[E.steps.length - 1]; const lastN = last ? node(last.id) : null;
  let h = '<button class="back" data-act="setup-cancel"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Setups</button>';
  h += '<div class="card"><h2>' + (E.id ? "Edit setup" : "New setup") + '</h2>' + field("f-sn", "Name", inp("f-sn", E.n, "text", 'placeholder="' + esc(setupName(E.steps)) + '"'));
  h += '<div class="path">' + E.steps.map((s, i) => '<div class="pn ' + s.k + (i === E.steps.length - 1 ? " cur" : "") + '"><span class="rail"><i></i></span><span class="pt"><span class="k">' + (s.k === "pos" ? (i ? "now in" : "start") : s.k === "df" ? "they" : TNAME[s.t] || "me") + '</span><span class="nm">' + esc(s.n) + "</span>" + (keyOf(node(s.id)) ? '<span class="key">' + esc(keyOf(node(s.id))) + "</span>" : "") + "</span></div>").join("") + "</div>";
  if (!E.steps.length) h += '<p class="muted small">Where does it start?</p><div class="chips">' + positions().map((p) => '<button class="chip pchip" data-act="setup-step" data-id="' + p.id + '" style="color:' + CAT_COLOR[p.cat] + '">' + iconFor(p) + "<span>" + esc(p.n) + "</span></button>").join("") + "</div>";
  else {
    const opts = nextOf(lastN).filter((e) => e.n.k !== "fin"); const me = opts.filter((e) => e.n.k === "mv"), they = opts.filter((e) => e.n.k === "df"), land = opts.filter((e) => e.n.k === "pos");
    const chip = (e) => '<button class="chip pchip' + (e.f === "rare" ? " rare" : "") + '" data-act="setup-step" data-id="' + e.n.id + '" style="color:' + nodeColor(e.n) + '">' + iconFor(e.n) + "<span>" + esc(e.n.n) + "</span>" + (e.n.bait ? ' <span class="pill na">trap</span>' : "") + "</button>";
    if (setupEnds(E)) h += '<div class="tip"><b>Ends in ' + esc(last.n) + '.</b> Save it, or keep going with how they defend it.</div>';
    if (me.length) h += '<p class="muted small">' + (lastN.k === "df" ? "My answer" : "My move") + '</p><div class="chips">' + me.map(chip).join("") + "</div>";
    if (they.length) h += '<p class="muted small">Their likely reaction</p><div class="chips">' + they.map(chip).join("") + "</div>";
    if (land.length) h += '<p class="muted small">Lands in</p><div class="chips">' + land.map(chip).join("") + "</div>";
    if (!opts.length) h += '<p class="empty">Nothing written after this step yet. Add it on the technique page first.</p>';
  }
  h += field("f-sx", "Note (why this works, the trap)", ta("f-sx", E.x, ""));
  h += '<div class="actions">' + (E.id ? delBtn("setup:" + E.id, "setup-del") : "") + '<button class="btn ghost" data-act="setup-undo"' + (E.steps.length ? "" : " disabled") + '>↶ Undo</button><button class="btn" data-act="setup-save" style="flex:1">Save setup</button></div></div>';
  return h;
}
/* ======================= ROUTES (from one position to another) ======================= */
function keyOf(n) { if (!n) return ""; if (n.bait) return "Trap: " + n.bait; if (n.s && n.s.length) return n.s[0]; return n.x || n.when || ""; }
function posEdges() {
  const E = {};
  for (const m of nodes()) { if (m.k !== "mv" || !allowed(m)) continue; const from = posOf(m.id); if (!from) continue;
    const oc = m.oc && m.oc.length ? m.oc : m.to ? [{ to: m.to, f: "common" }] : [];
    for (const o of oc) { if (!node(o.to) || o.to === from.id) continue; (E[from.id] = E[from.id] || []).push({ to: o.to, m, rare: o.f === "rare" }); } }
  return E;
}
function findRoutes(from, to, max) {
  const E = posEdges(); const out = [];
  const walk = (pos, path, cost, seen) => { if (path.length > 9 || out.length > 400) return; for (const e of E[pos] || []) { if (seen.has(e.to)) continue; const p = path.concat([{ id: e.m.id, k: "mv", n: e.m.n, t: e.m.t }, { id: e.to, k: "pos", n: node(e.to).n, t: "" }]); const c = cost + 1 + (e.rare ? 1.5 : 0); if (e.to === to) { out.push({ p, c }); continue; } const s2 = new Set(seen); s2.add(e.to); walk(e.to, p, c, s2); } };
  walk(from, [{ id: from, k: "pos", n: node(from).n, t: "" }], 0, new Set([from]));
  out.sort((a, b) => a.c - b.c || a.p.length - b.p.length);
  const seen = new Set(), res = []; for (const r of out) { const k = r.p.map((s) => s.id).join(">"); if (seen.has(k)) continue; seen.add(k); res.push(r.p); if (res.length >= (max || 3)) break; }
  return res;
}
function vRoute() {
  const ps = positions(); const r = UI.route || { from: "cg_b", to: "mt_t" };
  const sel = (id, cur) => '<select id="' + id + '">' + ps.map((p) => '<option value="' + p.id + '"' + (p.id === cur ? " selected" : "") + ">" + esc(p.n) + "</option>").join("") + "</select>";
  let h = '<div class="card"><div class="card-head"><h3>Find a route</h3><span class="muted small">from here to there</span></div><div class="grid2">' + field("f-rfrom", "From", sel("f-rfrom", r.from)) + field("f-rto", "To", sel("f-rto", r.to)) + '</div><button class="btn wide" data-act="route-find">Show the ways</button>';
  if (UI.route) {
    const routes = UI.route.from === UI.route.to ? [] : findRoutes(UI.route.from, UI.route.to, 3); UI.routeList = routes;
    if (!routes.length) h += '<p class="empty">' + (UI.route.from === UI.route.to ? "Pick two different positions." : "No written path yet. Add a move whose result is that position, or go through another position.") + "</p>";
    else h += routes.map((p, i) => '<div class="route"><div class="path">' + p.map((s, j) => '<div class="pn ' + s.k + (j === p.length - 1 ? " cur" : "") + '"><span class="rail"><i></i></span><span class="pt"><span class="k">' + (s.k === "pos" ? (j ? "then in" : "start") : TNAME[s.t] || "me") + '</span><span class="nm">' + esc(s.n) + "</span>" + (s.k === "mv" && keyOf(node(s.id)) ? '<span class="key">' + esc(keyOf(node(s.id))) + "</span>" : "") + "</span></div>").join("") + '</div><div class="actions"><span class="muted small" style="flex:1">' + ((p.length - 1) / 2) + " move" + (p.length > 3 ? "s" : "") + '</span><button class="btn ghost" data-act="route-save" data-i="' + i + '">Make it a setup</button></div></div>').join("");
  }
  return h + "</div>";
}

/* ======================= LEARN (quiz with spaced repetition) ======================= */
function learnDb() { S.settings.learn = S.settings.learn || { cards: {} }; return S.settings.learn; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pickN(arr, n, not) { return shuffle(arr.filter((x) => !not.has(x.id))).slice(0, n); }
function learnCards() {
  const out = []; const today = todayIso();
  for (const n of nodes()) { if (n.k !== "mv" || !allowed(n)) continue; const pos = posOf(n.id); if (!pos) continue; const par = node(n.p);
    if (n.when && par.k === "pos") out.push({ id: "when:" + n.id, type: "when", n, pos });
    if (par && par.k === "df") out.push({ id: "ans:" + n.id, type: "ans", n, pos, df: par, mv: node(par.p) });
    if (n.to && node(n.to) && par.k === "pos") out.push({ id: "land:" + n.id, type: "land", n, pos });
    if (n.s && n.s.length > 1 && par.k === "pos") out.push({ id: "key:" + n.id, type: "key", n, pos }); }
  const db = learnDb().cards; for (const c of out) { const d = db[c.id]; c.due = !d || d.due <= today; c.new = !d; c.f = d ? d.f || 0 : 0; }
  return out;
}
function learnQ(card) {
  const n = card.n, pos = card.pos; const sib = nodes().filter((m) => m.k === "mv" && m.id !== n.id && posOf(m.id) && posOf(m.id).id === pos.id && node(m.p).k === "pos");
  const opt = (x) => ({ id: x.id, n: x.n });
  if (card.type === "when") { const others = pickN(sib.filter((m) => m.when !== n.when), 3, new Set([n.id])); if (others.length < 2) return null; return { prompt: "In <b>" + esc(pos.n) + "</b>: " + esc(n.when) + ". What do you go for?", options: shuffle([opt(n)].concat(others.map(opt))), correct: n.id, tag: "Situation" }; }
  if (card.type === "ans") { const others = pickN(sib, 3, new Set([n.id, ...kids(card.df.id).map((k) => k.id)])); if (others.length < 2) return null; return { prompt: "<b>" + esc(pos.n) + "</b>: you go for <b>" + esc(card.mv.n) + "</b>, they <b>" + esc(card.df.n.replace(/^They /, "")) + "</b>. Your answer?", options: shuffle([opt(n)].concat(others.map(opt))), correct: n.id, tag: "Counter" }; }
  if (card.type === "land") { const others = pickN(positions().filter((p) => p.id !== n.to && p.id !== pos.id), 3, new Set()); return { prompt: "<b>" + esc(pos.n) + "</b> · <b>" + esc(n.n) + "</b> usually lands you in…", options: shuffle([opt(node(n.to))].concat(others.map(opt))), correct: n.to, tag: "Where it lands" }; }
  if (card.type === "key") { const others = pickN(sib.filter((m) => m.s && m.s.length && m.s[0] !== n.s[0]), 3, new Set([n.id])); if (others.length < 2) return null; return { prompt: "<b>" + esc(pos.n) + "</b> · <b>" + esc(n.n) + "</b>. The first thing to do?", options: shuffle([{ id: n.id, n: n.s[0] }].concat(others.map((m) => ({ id: m.id, n: m.s[0] })))), correct: n.id, tag: "Key point" }; }
  return null;
}
function learnStart() {
  const cards = learnCards(); const due = shuffle(cards.filter((c) => c.due && !c.new)), fresh = shuffle(cards.filter((c) => c.new)), rest = shuffle(cards.filter((c) => !c.due));
  const deck = due.concat(fresh, rest).slice(0, 40); const qs = []; const used = new Set();
  for (const c of deck) { if (qs.length >= 10 || used.has(c.n.id)) continue; const q = learnQ(c); if (q) { q.card = c; qs.push(q); used.add(c.n.id); } }
  if (!qs.length) { toast("Not enough written moves to quiz yet"); return; }
  UI.learn = { qs, i: 0, picked: null, right: 0, wrong: [] }; render(); window.scrollTo({ top: 0, behavior: "instant" });
}
function learnPick(i) {
  const L = UI.learn; if (!L || L.picked != null) return; const q = L.qs[L.i]; L.picked = i; const ok = q.options[i].id === q.correct;
  const db = learnDb().cards; const d = db[q.card.id] || { iv: 0, due: todayIso(), n: 0, f: 0 };
  if (ok) { L.right++; d.iv = d.iv ? Math.round(d.iv * 2.2) : 1; d.n++; d.due = addDays(todayIso(), d.iv); } else { L.wrong.push(q); d.iv = 0; d.f = (d.f || 0) + 1; d.due = todayIso(); }
  db[q.card.id] = d; save("settings"); render();
}
function learnNext() { const L = UI.learn; if (!L) return; L.i++; L.picked = null; render(); window.scrollTo({ top: 0, behavior: "instant" }); }
function vLearn() {
  const L = UI.learn;
  if (!L) {
    const cards = learnCards(); const due = cards.filter((c) => c.due && !c.new).length, seen = cards.filter((c) => !c.new).length; const weak = cards.filter((c) => c.f >= 2).sort((a, b) => b.f - a.f).slice(0, 6);
    let h = '<div class="card"><div class="card-head"><h3>Learn</h3><span class="muted small">quiz yourself on your own tree</span></div><p class="small">Ten questions from your positions: which move fits the situation, what you answer when they defend, where a move lands, and the first thing to do. Right answers come back later, wrong ones tomorrow.</p>' +
      '<div class="summary"><div class="stat"><b>' + due + '</b><span>due today</span></div><div class="stat"><b>' + seen + '</b><span>seen</span></div><div class="stat"><b>' + cards.length + '</b><span>cards</span></div></div><button class="btn wide" data-act="learn-start">Start · 10 questions</button></div>';
    if (weak.length) h += '<div class="card"><h3>Weak spots</h3><div class="list">' + weak.map((c) => '<button class="node-row" data-act="open" data-id="' + c.n.id + '"><span class="pict" style="color:' + nodeColor(c.n) + '">' + iconFor(c.n) + '</span><div class="txt"><b>' + esc(c.n.n) + "</b><small>" + esc(c.pos.n) + " · missed " + c.f + "×</small></div>" + CHEV + "</button>").join("") + "</div></div>";
    return h;
  }
  if (L.i >= L.qs.length) {
    return '<div class="card"><h2>' + L.right + " / " + L.qs.length + '</h2><p class="small">' + (L.right === L.qs.length ? "Clean sweep." : L.right >= 7 ? "Solid. The misses come back tomorrow." : "Open the misses and read the steps once.") + "</p>" + (L.wrong.length ? '<div class="list">' + L.wrong.map((q) => '<button class="node-row" data-act="open" data-id="' + q.card.n.id + '"><span class="pict" style="color:' + nodeColor(q.card.n) + '">' + iconFor(q.card.n) + '</span><div class="txt"><b>' + esc(q.card.n.n) + "</b><small>" + esc(q.card.pos.n) + "</small></div>" + CHEV + "</button>").join("") + "</div>" : "") + '<div class="actions"><button class="btn ghost" data-act="learn-stop">Done</button><button class="btn" style="flex:1" data-act="learn-start">Again</button></div></div>';
  }
  const q = L.qs[L.i]; const n = q.card.n; const done = L.picked != null;
  let h = '<div class="card"><div class="card-head"><span class="pill na">' + q.tag + '</span><span class="muted small">' + (L.i + 1) + " / " + L.qs.length + '</span></div><p class="qprompt">' + q.prompt + '</p><div class="opts">' + q.options.map((o, i) => '<button class="opt' + (done ? (o.id === q.correct ? " ok" : i === L.picked ? " bad" : " off") : "") + '" data-act="learn-pick" data-i="' + i + '"' + (done ? " disabled" : "") + ">" + esc(o.n) + "</button>").join("") + "</div>";
  if (done) h += '<div class="tip' + (q.options[L.picked].id === q.correct ? " good" : "") + '"><b>' + (q.options[L.picked].id === q.correct ? "Yes." : "Not quite.") + "</b> " + esc(n.n) + (n.when ? " · " + esc(n.when) : "") + (n.s && n.s.length ? '<ol class="steps">' + n.s.slice(0, 3).map((x) => "<li>" + esc(x) + "</li>").join("") + "</ol>" : "") + (n.bait ? '<p class="small"><b>Trap:</b> ' + esc(n.bait) + "</p>" : "") + '</div><div class="actions"><button class="btn ghost" data-act="open" data-id="' + n.id + '">Open</button><button class="btn" style="flex:1" data-act="learn-next">' + (L.i + 1 < L.qs.length ? "Next" : "Finish") + "</button></div>";
  else h += '<div class="actions"><button class="btn ghost" data-act="learn-stop">Stop</button></div>';
  return h + "</div>";
}
function vPlans() {
  let h = '<div class="card"><div class="card-head"><h3>Game plans by opponent</h3></div>';
  if (!S.plans.items.length) h += '<p class="empty">No game plans yet. Add one per type of opponent.</p>';
  else h += S.plans.items.map((p) => '<div class="plan"><button class="row" data-act="edit-plan" data-id="' + p.id + '"><div class="txt"><b>' + esc(p.n) + '</b><small>' + esc(p.x) + "</small></div>" + CHEV + '</button><div class="refs">' + (p.tags || []).filter((t) => node(t)).map((t) => '<button class="chip" data-act="open" data-id="' + t + '">' + esc(node(t).n) + "</button>").join("") + "</div></div>").join("");
  h += '<button class="btn ghost wide" data-act="add-plan">+ Add game plan</button></div>';
  return h;
}
function planSheet(id) {
  const p = id ? S.plans.items.find((x) => x.id === id) : null;
  let b = field("f-n", "Against whom", inp("f-n", p ? p.n : "", "text", 'autofocus placeholder="e.g. Against a big, strong opponent"'));
  b += field("f-x", "How to fight", ta("f-x", p ? p.x : "", "Never flat on the bottom, half guard…"));
  openSheet(p ? "Edit game plan" : "New game plan", () => b + picker("pos", "Related positions", "pos", { ph: "Search positions…" }), {
    state: { pk: { pos: (p ? p.tags : []).filter((t) => node(t)).map((t) => ({ id: t, n: node(t).n, c: 1 })) } },
    onSave() {
      const name = sv("f-n").trim(); if (!name) { $("f-n").focus(); return false; }
      const rec = p || { id: uid() }; rec.n = name; rec.x = sv("f-x").trim(); rec.tags = (UI.sheet.pk.pos || []).map((x) => x.id).filter(Boolean);
      if (!p) S.plans.items.push(rec); save("plans"); render(); return true;
    },
    onDelete: p ? () => { S.plans.items = S.plans.items.filter((x) => x.id !== p.id); save("plans"); render(); return true; } : null,
  });
}

/* ======================= TRAINING ======================= */
const STYPES = [["gi", "Gi"], ["nogi", "No-gi"], ["open", "Open mat"], ["priv", "Private"], ["drill", "Drilling"], ["comp", "Compete"]];
const SNAME = Object.fromEntries(STYPES);
/* ======================= STREAKS & SHARE CARD ======================= */
function trainedDays() { const d = new Set(S.log.items.map((s) => s.d)); for (const x of S.body.items) if (x.cat === "drill") d.add(x.d); if (CLUB.id && CLUB.attMonth) for (const k in CLUB.attMonth.days) if (CLUB.attMonth.days[k].includes(myUid())) d.add(k); return d; }
function streaks() {
  const days = trainedDays(); const today = todayIso(); let weeks = 0; let ws = mondayOf(today);
  for (let i = 0; i < 520; i++) { let hit = false; for (let j = 0; j < 7; j++) if (days.has(addDays(ws, j))) { hit = true; break; } if (!hit) { if (i === 0) { ws = addDays(ws, -7); continue; } break; } weeks++; ws = addDays(ws, -7); }
  let classes = 0; const sched = mySchedule(); const cdays = new Set(sched.map((x) => x.d));
  if (cdays.size) { let d = today; for (let i = 0; i < 400; i++) { const dow = (new Date(d + "T12:00:00").getDay() + 6) % 7; if (cdays.has(dow)) { if (days.has(d)) classes++; else if (d !== today) break; } d = addDays(d, -1); } }
  let run = 0; { let d = today; if (!days.has(d)) d = addDays(d, -1); while (days.has(d)) { run++; d = addDays(d, -1); } }
  return { weeks, classes, run, total: days.size };
}
function streakLine() { const st = streaks(); const bits = []; if (st.weeks) bits.push(st.weeks + " week streak"); if (st.classes) bits.push(st.classes + " classes without a miss"); return bits.length ? '<p class="streak">🔥 ' + bits.join(" · ") + "</p>" : ""; }
/* Share card: a photo (or the mat) with the session, the roll path and the streak on top, like a run on Strava. */
const SHARE = { img: null, tpl: "photo", sess: null, fmt: "post" }; /* fmt: post = 4:5 1080×1350, story = 9:16 1080×1920 */
function shareSize() { return SHARE.fmt === "story" ? [1080, 1920] : [1080, 1350]; }
function shareSheet(sessId, fmt) {
  const s = sessId ? S.log.items.find((x) => x.id === sessId) : sessionsSorted()[0]; if (!s) { toast("Log a training first"); return; }
  SHARE.sess = s; SHARE.img = null; SHARE.tpl = "photo"; SHARE.fmt = fmt === "story" ? "story" : "post"; const sz0 = shareSize();
  const b = '<p class="small">Add a photo from the mat and share the session with its stats, your roll path and your streak.</p>' +
    '<div class="field"><label for="sh-photo" class="btn ghost" style="display:flex;align-items:center;justify-content:center">Choose a photo<input id="sh-photo" type="file" accept="image/*" hidden></label></div>' +
    '<div class="field"><span class="lbl">Look</span>' + chips("tpl", [["photo", "Photo"], ["mat", "Mat"], ["light", "Light"]], "photo") + "</div>" +
    '<div class="field"><span class="lbl">Format</span>' + chips("fmt", [["post", "Post 4:5"], ["story", "Story 9:16"]], SHARE.fmt) + "</div>" +
    '<canvas id="sh-cv" width="' + sz0[0] + '" height="' + sz0[1] + '" class="sharecv"></canvas>' +
    '<div class="actions"><button class="btn ghost" data-act="share-save">Save image</button><button class="btn" data-act="share-send">Share</button></div>' +
    '<p class="small muted" style="text-align:center;margin:0">Share → Instagram → Story</p>';
  openSheet("Share the session", b, { state: { picks: { tpl: "photo", fmt: SHARE.fmt } } });
  const inp0 = $("sh-photo"); inp0.addEventListener("change", () => { const f = inp0.files && inp0.files[0]; if (!f) return; const url = URL.createObjectURL(f); const im = new Image(); im.onload = () => { SHARE.img = im; URL.revokeObjectURL(url); drawShare(); }; im.src = url; });
  drawShare();
}
function drawShare() { drawShareNow(); const cv = $("sh-cv"); if (cv) { SHARE.blob = null; const tok = (SHARE.tok = (SHARE.tok || 0) + 1); cv.toBlob((b) => { if (tok === SHARE.tok) SHARE.blob = b; }, "image/png"); } }
function drawShareNow() {
  const cv = $("sh-cv"); if (!cv) return; const s = SHARE.sess; const g = cv.getContext("2d"); const W = cv.width, H = cv.height; const tpl = SHARE.tpl; const dark = tpl !== "light"; const story = SHARE.fmt === "story";
  g.clearRect(0, 0, W, H);
  if (SHARE.img && tpl === "photo") { const im = SHARE.img; const r = Math.max(W / im.width, H / im.height); const w = im.width * r, h = im.height * r; g.drawImage(im, (W - w) / 2, (H - h) / 2, w, h); const gr = g.createLinearGradient(0, H * (story ? 0.45 : 0.35), 0, H); gr.addColorStop(0, "rgba(10,13,20,0)"); gr.addColorStop(1, "rgba(10,13,20,.92)"); g.fillStyle = gr; g.fillRect(0, 0, W, H); const gt = g.createLinearGradient(0, 0, 0, H * (story ? 0.22 : 0.3)); gt.addColorStop(0, "rgba(10,13,20,.6)"); gt.addColorStop(1, "rgba(10,13,20,0)"); g.fillStyle = gt; g.fillRect(0, 0, W, H); }
  else { g.fillStyle = dark ? "#161b26" : "#eef0f4"; g.fillRect(0, 0, W, H); g.strokeStyle = dark ? "rgba(255,255,255,.035)" : "rgba(15,20,25,.05)"; g.lineWidth = 2; for (let i = -H; i < W + H; i += 44) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + H, H); g.stroke(); g.beginPath(); g.moveTo(i, H); g.lineTo(i + H, 0); g.stroke(); } }
  const ink = dark ? "#f3f5f9" : "#0f1419", mute = dark ? "rgba(243,245,249,.72)" : "rgba(15,20,25,.6)"; const disp = "700 %dpx 'Bricolage Grotesque', system-ui, sans-serif", body = "500 %dpx 'IBM Plex Sans', system-ui, sans-serif";
  const F = (t, px) => t.replace("%d", px); const pad = 64;
  // story (9:16): Instagram's own header and reply bar cover ~220px at the top and ~250px at the bottom, so everything sits inside those
  const top = story ? 220 : pad, bot = story ? 250 : pad; const clubName = (CLUB.profile ? CLUB.profile.n : "Jiu-jitsu").toUpperCase();
  // header: club + date (story: the date only, the club name goes to the bottom)
  g.textBaseline = "top"; let hy = top;
  if (!story) { g.fillStyle = mute; g.font = F(body, 34); g.fillText(clubName, pad, top); hy = top + 46; }
  g.fillStyle = ink; g.font = F(disp, story ? 52 : 44); g.fillText(s.d, pad, hy);
  // belt bar top right
  { const bw = 260, bh = 28, x = W - pad - bw, y = top + 10; const b = beltDef(S.belt.track, S.belt.belt); g.fillStyle = b.c || "#999"; g.fillRect(x, y, bw, bh); g.fillStyle = "#111"; g.fillRect(x + bw * 0.66, y, bw * 0.34, bh); g.fillStyle = "#fff"; for (let i = 0; i < (S.belt.stripes || 0); i++) g.fillRect(x + bw * 0.66 + 14 + i * 18, y, 8, bh); g.strokeStyle = "rgba(0,0,0,.25)"; g.strokeRect(x, y, bw, bh); }
  // roll path baseline; the stats block sits 380px above it (post: 706px from the top, story: 1040px, leaving the photo room)
  const ry = story ? H - bot - 250 : H - pad - 200;
  // big numbers
  let y = ry - 380;
  const stats = [[String(s.min || 0), "min"], [String(s.rolls || 0), "rounds"], [String((s.tech || []).length + (s.subs || []).reduce((a, x) => a + (x.c || 1), 0)), "moves"]];
  stats.forEach((st, i) => { const x = pad + i * 300; g.fillStyle = ink; g.font = F(disp, 120); g.fillText(st[0], x, y); g.fillStyle = mute; g.font = F(body, 34); g.fillText(tr(st[1]), x + 6, y + 126); });
  // type + what went well
  y += 200; g.fillStyle = ink; g.font = F(disp, 48); g.fillText(tr(SNAME[s.type] || "Training"), pad, y);
  if (s.good) { g.fillStyle = mute; g.font = F(body, 32); const words = s.good.split(" "); let line = "", ly = y + 64; for (const w of words) { const t = line ? line + " " + w : w; if (g.measureText(t).width > W - pad * 2) { g.fillText(line, pad, ly); line = w; ly += 40; if (ly > y + 110) break; } else line = t; } if (line && ly <= y + 110) g.fillText(line, pad, ly); }
  // roll path (the "route"): last saved roll of that day, else the week's dots
  const roll = S.rolls.items.filter((r) => r.d === s.d).sort((a, b) => (a.id < b.id ? 1 : -1))[0] || S.rolls.items.slice().sort((a, b) => (a.d < b.d ? 1 : -1))[0];
  if (roll && roll.steps.length > 1) {
    const st = roll.steps.filter((x) => x.k !== "fin").slice(0, 9); const gap = Math.min(120, (W - pad * 2) / Math.max(1, st.length - 1)); const x0 = pad + 12;
    g.strokeStyle = dark ? "#5b8dff" : "#1f56d9"; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); st.forEach((x, i) => { const px = x0 + i * gap, py = ry + (i % 2 ? 0 : 34); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke();
    st.forEach((x, i) => { const px = x0 + i * gap, py = ry + (i % 2 ? 0 : 34); g.beginPath(); g.arc(px, py, x.k === "pos" ? 16 : 11, 0, Math.PI * 2); g.fillStyle = x.k === "pos" ? (dark ? "#5b8dff" : "#1f56d9") : x.k === "df" ? "#e2a04a" : (dark ? "#161b26" : "#fff"); g.fill(); g.lineWidth = 4; g.strokeStyle = dark ? "#5b8dff" : "#1f56d9"; g.stroke(); });
    g.fillStyle = mute; g.font = F(body, 28); g.fillText(tr("Roll") + " · " + st.filter((x) => x.k === "pos").map((x) => { const n = node(x.id); return n ? dn(n) : x.n; }).join(" › ").slice(0, 60), pad, ry + 70);
  } else { const days = trainedDays(); const wk = mondayOf(s.d); for (let i = 0; i < 7; i++) { const d = addDays(wk, i); const on = days.has(d); g.beginPath(); g.arc(pad + 24 + i * 60, ry + 20, 20, 0, Math.PI * 2); g.fillStyle = on ? (dark ? "#3ddc6a" : "#1f9a48") : (dark ? "rgba(255,255,255,.12)" : "rgba(15,20,25,.1)"); g.fill(); } g.fillStyle = mute; g.font = F(body, 28); g.fillText(tr("This week"), pad, ry + 60); }
  // streak + brand
  const sk = streaks(); const parts = []; if (sk.weeks) parts.push(sk.weeks + " " + tr("week streak")); if (sk.classes) parts.push(sk.classes + " " + tr("classes without a miss"));
  g.fillStyle = dark ? "#ffa531" : "#c25e00"; g.font = F(disp, 36); g.textBaseline = "bottom"; if (parts.length) g.fillText("🔥 " + parts.join("  ·  "), pad, story ? H - bot - 56 : H - pad + 6);
  g.fillStyle = mute; g.font = F(body, 28); if (story) g.fillText(clubName, pad, H - bot + 2);
  g.textAlign = "right"; g.fillText("Arrow", W - pad, H - bot + 2); g.textAlign = "left"; g.textBaseline = "top";
}
async function shareSend(save) {
  const cv = $("sh-cv"); if (!cv) return; const s = SHARE.sess; const name = "jiu-jitsu-" + s.d + (SHARE.fmt === "story" ? "-story" : "") + ".png";
  const blob = SHARE.blob || (await new Promise((res) => cv.toBlob(res, "image/png"))); if (!blob) return;
  const file = new File([blob], name, { type: "image/png" });
  if (!save && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: "Arrow", text: fmtLong(s.d) + " · " + (s.min || 0) + " min" }); shareMark(); return; } catch (e) { if (e.name === "AbortError") return; } }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast("Image saved"); shareMark();
}
function sessionsSorted() { return S.log.items.slice().sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0)); }
VIEWS.log = function () {
  const today = todayIso(), items = sessionsSorted();
  const wk = mondayOf(today); const thisWk = items.filter((s) => s.d >= wk); const mo = today.slice(0, 7); const thisMo = items.filter((s) => s.d.startsWith(mo));
  const totalMin = items.reduce((a, s) => a + (+s.min || 0), 0);
  const sk = streaks();
  let h = liveCard() + '<div class="card"><div class="summary"><div class="stat"><b>' + thisWk.length + '</b><span>this week</span></div><div class="stat"><b>' + sk.weeks + '</b><span>week streak</span></div><div class="stat"><b>' + (totalMin / 60).toFixed(totalMin >= 600 ? 0 : 1) + '</b><span>total hours</span></div></div>' + streakLine();
  // minutes per week, 8 weeks
  const bars = []; let maxM = 1;
  for (let i = 7; i >= 0; i--) { const ws = addDays(wk, -7 * i); const we = addDays(ws, 7); const m = items.filter((s) => s.d >= ws && s.d < we).reduce((a, s) => a + (+s.min || 0), 0); maxM = Math.max(maxM, m); bars.push([ws, m]); }
  h += '<div class="bars">' + bars.map((b) => '<div class="b"><i style="height:' + Math.round((b[1] / maxM) * 100) + '%" title="' + b[1] + ' min"></i><span>' + b[0].slice(5).replace("-", "/") + "</span></div>").join("") + '</div><p class="muted small">Minutes per week</p>' + (items.length ? '<button class="btn ghost wide" data-act="share" data-id="' + items[0].id + '">Share the last session</button>' : "") + "</div>";
  h += '<button class="btn big wide" data-act="add-sess">+ Log training</button>';
  h += timerCard();
  // submission stats
  const given = {}, got = {};
  for (const s of items) { for (const x of s.subs || []) given[x.n] = (given[x.n] || 0) + (+x.c || 1); for (const x of s.taps || []) got[x.n] = (got[x.n] || 0) + (+x.c || 1); }
  const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const tg = top(given), tt = top(got);
  if (tg.length || tt.length) {
    const mx = Math.max(1, ...tg.map((x) => x[1]), ...tt.map((x) => x[1]));
    const rows = (arr, cls) => arr.map((x) => '<div class="row"><div class="txt"><b>' + esc(x[0]) + '</b><div class="bar"><i style="width:' + Math.round((x[1] / mx) * 100) + "%;background:var(--" + cls + ')"></i></div></div><span class="num">' + x[1] + "</span></div>").join("");
    h += '<div class="card"><div class="grid2"><div><h3>I finished</h3><div class="list">' + (rows(tg, "ok") || '<p class="empty">—</p>') + '</div></div><div><h3>Caught me</h3><div class="list">' + (rows(tt, "bad") || '<p class="empty">—</p>') + "</div></div></div></div>";
  }
  // history
  h += '<div class="card"><h3>Log</h3>';
  if (!items.length) h += '<p class="empty">No sessions yet. Start by logging today’s training.</p>';
  else {
    let lastMo = ""; h += '<div class="list">';
    for (const s of items.slice(0, 60)) {
      const m = s.d.slice(0, 7); if (m !== lastMo) { lastMo = m; h += '<div class="group-label">' + MON[+m.slice(5) - 1] + " " + m.slice(0, 4) + "</div>"; }
      const bits = [s.min + " min"]; if (s.rolls) bits.push(s.rolls + " rounds"); const sg = (s.subs || []).reduce((a, x) => a + (+x.c || 1), 0), st = (s.taps || []).reduce((a, x) => a + (+x.c || 1), 0); if (sg || st) bits.push(sg + " / " + st);
      h += '<button class="row" data-act="edit-sess" data-id="' + s.id + '"><div class="txt"><b>' + fmtD(s.d) + ' <span class="pill na">' + (SNAME[s.type] || s.type) + "</span></b><small>" + bits.join(" · ") + ((s.tech || []).length ? " · " + esc(s.tech.map((t) => t.n).join(", ")) : "") + "</small></div>" + CHEV + "</button>";
    }
    h += "</div>";
  }
  return h + "</div>";
};
function sessSheet(id, prefill) {
  /* prefill: a session-shaped object (from the live tracker, `live: true`) that fills a new session's form. */
  const s = id ? S.log.items.find((x) => x.id === id) : null; const f = s || prefill || {}; const fromLive = !s && !!(prefill && prefill.live);
  const body = () => {
  let b = '<div class="finish-overview"><div><b id="finish-minutes">' + esc(f.min || 60) + '</b><span>minutes on the mat</span></div><div><b id="finish-rounds">' + (+f.rolls || 0) + '</b><span>rounds</span></div></div><section class="training-section"><div class="grid2">' + field("f-d", "Training date", inp("f-d", f.d || todayIso(), "date", 'max="' + todayIso() + '"')) + sessionNumber('f-min','Duration (min)',f.min || 60,5) + '</div><span class="lbl">Training type</span>' + trainingChoices(f.type || 'gi') + '</section>';
  b += '<section class="training-section">' + sessionNumber('f-rolls','Sparring rounds',f.rolls != null ? f.rolls : 0,1) + '<span class="lbl">Effort</span>' + effortChoices(f.rpe ? +f.rpe : 0) + '</section>';
  b += '<section class="training-section"><div class="finish-counts">' + [['subs','Submissions'],['taps','Taps'],['tech','Techniques']].map(([key,label]) => sessionCounter(key,label)).join('') + '</div></section><details class="edit-details"><summary>Techniques, partners and notes</summary>';
  if (CLUB.id && CLUB.members) { const me = myUid(); const ms = (CLUB.members.list || []).filter((m) => attKey(m) !== me).sort((a, b) => String(a.n || "").localeCompare(String(b.n || ""))); const sel = (UI.sheet && UI.sheet.with) || f.with || []; if (ms.length) b += '<div class="field"><span class="lbl">Rolled with</span><div class="chips">' + ms.map((m) => '<button type="button" class="chip' + (sel.includes(attKey(m)) ? " on" : "") + '" data-act="with-toggle" data-who="' + attKey(m) + '">' + esc(m.n || m.email || "Member") + "</button>").join("") + "</div></div>"; }
  b += picker("tech", "Techniques drilled", "mv", { ph: "Search techniques…" });
  b += picker("subs", "I finished", "sub", { ph: "Add a submission…", counts: true });
  b += picker("taps", "Caught me", "sub", { ph: "What caught you…", counts: true });
  b += field("f-good", "What went well", ta("f-good", f.good || "", ""));
  b += field("f-bad", "What did not work, what to fix", ta("f-bad", f.bad || "", ""));
  b += field("f-note", "Notes", ta("f-note", f.note || "", ""));
  b += "</details>" + (socialOn() ? '<section class="training-section audience-panel"><span class="lbl">Who can see this?</span>' + audienceChoices(f.audience || 'public') + '</section>' : "");
  return b; };
  openSheet(s ? "Edit training" : fromLive ? "Finish training" : "Log training", body, {
    saveLabel: "Save session", state: { picks: { type: f.type || "gi", rpe: f.rpe ? +f.rpe : 0, audience: f.audience || "public" }, with: clone(f.with || []), pk: { tech: clone(f.tech || []), subs: clone(f.subs || []), taps: clone(f.taps || []) } },
    async onSave() {
      const d = sv("f-d"); if (!d || d > todayIso()) { toast("Check the date"); return false; }
      const min = +sv("f-min"); if (!Number.isFinite(min) || min <= 0 || min > 1440) { $("f-min").focus(); return false; }
      const rec = s || S.log.items.find(x=>x.id===UI.sheet.savedId) || { id: uid(), createdAt:Date.now() }; const old = s ? s.d : "";
      rec.d = d; rec.min = min; rec.type = pickVal("type", "gi"); rec.rolls = Math.min(999,Math.max(0,Math.round(+sv("f-rolls") || 0))); rec.rpe = pickVal("rpe", 0);
      rec.tech = UI.sheet.pk.tech || []; rec.subs = UI.sheet.pk.subs || []; rec.taps = UI.sheet.pk.taps || [];
      rec.audience = socialOn() ? pickVal("audience", "public") : "private";
      rec.good = sv("f-good").trim(); rec.bad = sv("f-bad").trim(); rec.note = sv("f-note").trim(); rec.with = (UI.sheet.with || []).slice();
      if (!S.log.items.includes(rec)) S.log.items.push(rec); UI.sheet.savedId=rec.id; save("log"); await flush("log"); if (fromLive) liveClear(); if (CLUB.id) { await feedPost(rec,old); await rollsShare(rec); } toast("Training saved"); render(); return true;
    },
    onDelete: s ? () => { S.log.items = S.log.items.filter((x) => x.id !== s.id); save("log"); feedRemove(s.id, s.d); toast("Deleted"); render(); return true; } : null,
  });
}

/* ---------- round timer ---------- */
const T = { on: false, phase: "work", round: 1, end: 0, left: 0, tick: null, ctx: null, lock: null };
function timerCard() {
  const c = S.settings.timer;
  return '<div class="card timer" id="timer"><div class="ph" id="t-ph"></div><div class="big" id="t-big"></div><div class="actions" style="width:100%"><button class="btn" data-act="t-start" id="t-start">Start</button><button class="btn ghost" data-act="t-reset">Reset</button></div>' +
    '<div class="cfg">' + field("t-work", "Round, min", inp("t-work", c.work, "number", 'inputmode="numeric" min="1" max="60" data-tcfg="work"')) + field("t-rest", "Rest, min", inp("t-rest", c.rest, "number", 'inputmode="numeric" min="0" max="30" data-tcfg="rest"')) + field("t-rounds", "Rounds", inp("t-rounds", c.rounds, "number", 'inputmode="numeric" min="1" max="30" data-tcfg="rounds"')) + "</div></div>";
}
function fmtT(sec) { sec = Math.max(0, Math.ceil(sec)); return pad(Math.floor(sec / 60)) + ":" + pad(sec % 60); }
function renderTimer() {
  const el = $("timer"); if (!el) return; const c = S.settings.timer;
  const left = T.on ? Math.max(0, (T.end - Date.now()) / 1000) : T.left || c.work * 60;
  $("t-big").textContent = fmtT(left); $("t-big").className = "big" + (T.phase === "rest" ? " rest" : "");
  $("t-ph").textContent = (T.phase === "rest" ? "Rest" : "Round") + " " + T.round + " / " + c.rounds + (T.on ? "" : T.left ? " · paused" : "");
  $("t-start").textContent = T.on ? "Pause" : T.left ? "Resume" : "Start";
}
function beep(n) {
  try { T.ctx = T.ctx || new (window.AudioContext || window.webkitAudioContext)(); const ctx = T.ctx; for (let i = 0; i < n; i++) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); const t = ctx.currentTime + i * 0.35; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28); o.start(t); o.stop(t + 0.3); } } catch (e) {}
  if (navigator.vibrate) navigator.vibrate(n === 1 ? 200 : [300, 150, 300, 150, 300]);
}
function tStart() {
  const c = S.settings.timer;
  if (T.on) { T.on = false; T.left = Math.max(0, (T.end - Date.now()) / 1000); clearInterval(T.tick); if (T.lock) { T.lock.release().catch(() => {}); T.lock = null; } renderTimer(); return; }
  if (!T.left) { T.phase = "work"; T.round = 1; T.left = c.work * 60; }
  T.end = Date.now() + T.left * 1000; T.on = true; beep(1);
  if (navigator.wakeLock) navigator.wakeLock.request("screen").then((l) => (T.lock = l)).catch(() => {});
  clearInterval(T.tick); T.tick = setInterval(tTick, 250); renderTimer();
}
function tTick() {
  const c = S.settings.timer; if (!T.on) return;
  if (Date.now() < T.end) { renderTimer(); return; }
  if (T.phase === "work") { if (T.round >= c.rounds) { beep(3); tReset(); toast("Done. Well done!"); return; } if (c.rest > 0) { T.phase = "rest"; T.end = Date.now() + c.rest * 60000; beep(2); } else { T.round++; T.end = Date.now() + c.work * 60000; beep(2); } }
  else { T.phase = "work"; T.round++; T.end = Date.now() + c.work * 60000; beep(1); }
  renderTimer();
}
function tReset() { T.on = false; T.left = 0; T.phase = "work"; T.round = 1; clearInterval(T.tick); if (T.lock) { T.lock.release().catch(() => {}); T.lock = null; } renderTimer(); }

/* ======================= BODY ======================= */
const BCATS = [["warm", "Warm-up"], ["str", "Stretch"], ["sc", "Strength"], ["cardio", "Cardio"]];
const BNAME = Object.fromEntries(BCATS);
VIEWS.body = function () {
  const cat = UI.body.cat; const today = todayIso(), wk = mondayOf(today);
  const rs = S.body.routines.filter((r) => r.cat === cat); const logs = S.body.items.filter((x) => x.cat === cat).sort((a, b) => (a.d < b.d ? 1 : -1));
  const wkN = logs.filter((x) => x.d >= wk).length, moN = logs.filter((x) => x.d.startsWith(today.slice(0, 7))).length, moMin = logs.filter((x) => x.d.startsWith(today.slice(0, 7))).reduce((a, x) => a + (+x.min || 0), 0);
  let h = seg(BCATS, cat, "bodycat");
  h += '<div class="card"><div class="summary"><div class="stat"><b>' + wkN + '</b><span>this week</span></div><div class="stat"><b>' + moN + '</b><span>this month</span></div><div class="stat"><b>' + moMin + '</b><span>min this month</span></div></div>' + bodyTip(cat) + "</div>";
  for (const r of rs) {
    const open = UI.body.open === r.id;
    h += '<div class="card"><button class="row" data-act="body-open" data-id="' + r.id + '" aria-expanded="' + open + '"><div class="txt"><b>' + esc(r.n) + "</b><small>" + (r.min ? r.min + " min · " : "") + (r.items || []).length + " exercises</small></div>" + CHEV + "</button>";
    if (open) {
      h += '<div class="list">' + (r.items || []).map((it, i) => { const on = (UI.body.done[r.id] || {})[i]; return '<div class="row' + (on ? " done" : "") + '"><button class="check' + (on ? " on" : "") + '" data-act="body-check" data-id="' + r.id + '" data-i="' + i + '" aria-pressed="' + !!on + '">' + CHECK + '</button><div class="txt">' + esc(it) + "</div></div>"; }).join("") + "</div>";
      h += '<div class="actions"><button class="btn" data-act="body-log" data-id="' + r.id + '">Done, log it</button><button class="btn ghost" data-act="edit-routine" data-id="' + r.id + '">Edit</button></div>';
    }
    h += "</div>";
  }
  h += '<button class="btn ghost wide" data-act="add-routine">+ Add routine</button>';
  if (cat === "cardio") h += timerCard();
  h += '<div class="card"><h3>' + BNAME[cat] + " log</h3>";
  if (!logs.length) h += '<p class="empty">No entries yet. Open a routine and tap “Done, log it”.</p>';
  else h += '<div class="list">' + logs.slice(0, 20).map((x) => '<button class="row" data-act="edit-blog" data-id="' + x.id + '"><div class="txt"><b>' + fmtD(x.d) + " · " + esc(x.n) + "</b><small>" + (x.min ? x.min + " min" : "") + (x.note ? " · " + esc(x.note) : "") + "</small></div>" + CHEV + "</button>").join("") + "</div>";
  h += '<button class="btn ghost wide" data-act="body-log" data-id="">+ Log something else</button></div>';
  return h;
};
UI.body.done = {};
function bodyTip(cat) {
  return '<p class="muted small">' + { warm: "5–10 min before every session. Shrimps, bridges and stand-ups are the base of technique.", str: "After training or before bed. No pain, just a stretch you can feel.", sc: "Twice a week is enough. Keep a day between lifting and jiu-jitsu.", cardio: "1–2 times a week. Round intervals before competitions, long easy runs otherwise." }[cat] + "</p>";
}
function routineSheet(id) {
  const r = id ? S.body.routines.find((x) => x.id === id) : null;
  let b = field("f-n", "Name", inp("f-n", r ? r.n : "", "text", "autofocus"));
  b += '<div class="field"><span class="lbl">Category</span>' + chips("cat", BCATS, r ? r.cat : UI.body.cat) + "</div>";
  b += field("f-min", "Duration, min", inp("f-min", r ? r.min : 10, "number", 'inputmode="numeric" min="0"'));
  b += field("f-items", "Exercises (one per line)", ta("f-items", (r ? r.items : []).join("\n"), "Shrimps · 2×20\nBridges · 15"));
  openSheet(r ? "Edit routine" : "New routine", b, {
    state: { picks: { cat: r ? r.cat : UI.body.cat } },
    onSave() { const n = sv("f-n").trim(); if (!n) { $("f-n").focus(); return false; } const rec = r || { id: uid() }; rec.n = n; rec.cat = pickVal("cat", UI.body.cat); rec.min = +sv("f-min") || 0; rec.items = lines(sv("f-items")); if (!r) S.body.routines.push(rec); UI.body.cat = rec.cat; UI.body.open = rec.id; save("body"); render(); return true; },
    onDelete: r ? () => { S.body.routines = S.body.routines.filter((x) => x.id !== r.id); save("body"); render(); return true; } : null,
  });
}
function blogSheet(id, rid) {
  const x = id ? S.body.items.find((i) => i.id === id) : null; const r = rid ? S.body.routines.find((i) => i.id === rid) : null;
  let b = '<div class="grid2">' + field("f-d", "Date", inp("f-d", x ? x.d : todayIso(), "date", 'max="' + todayIso() + '"')) + field("f-min", "Minutes", inp("f-min", x ? x.min : r ? r.min : 20, "number", 'inputmode="numeric" min="0"')) + "</div>";
  b += field("f-n", "What did you do", inp("f-n", x ? x.n : r ? r.n : "", "text", r ? "" : "autofocus"));
  b += '<div class="field"><span class="lbl">Category</span>' + chips("cat", BCATS, x ? x.cat : r ? r.cat : UI.body.cat) + "</div>";
  b += field("f-note", "Notes", ta("f-note", x ? x.note : "", "Weight, reps, how it felt…"));
  openSheet(x ? "Edit entry" : "Log it", b, {
    state: { picks: { cat: x ? x.cat : r ? r.cat : UI.body.cat } },
    onSave() { const n = sv("f-n").trim(); if (!n) { $("f-n").focus(); return false; } const rec = x || { id: uid(), rid: rid || "" }; rec.d = sv("f-d") || todayIso(); rec.min = +sv("f-min") || 0; rec.n = n; rec.cat = pickVal("cat", UI.body.cat); rec.note = sv("f-note").trim(); if (!x) S.body.items.push(rec); if (r) UI.body.done[r.id] = {}; UI.body.cat = rec.cat; save("body"); toast("Logged"); render(); return true; },
    onDelete: x ? () => { S.body.items = S.body.items.filter((i) => i.id !== x.id); save("body"); render(); return true; } : null,
  });
}

/* ======================= RANK ======================= */
VIEWS.belt = function () {
  const track = S.belt.track; const ladder = SEED.belts[track]; const cur = beltDef(track, S.belt.belt);
  const idx = ladder.findIndex((b) => b.id === S.belt.belt);
  let h = '<button class="card beltcard" data-act="belt-page" aria-expanded="' + !!UI.beltPage + '"><div class="belt big" role="img" aria-label="' + esc(cur.n) + ' belt">' + beltHtml(true) + '</div><div class="card-head"><div><h2>' + esc(cur.n) + " belt" + (S.belt.stripes ? ", " + S.belt.stripes + " stripes" : "") + "</h2>" + (S.belt.since ? '<p class="muted small">' + fmtLong(S.belt.since) + " · " + monthsSince(S.belt.since) + " months" + (S.belt.byCoach ? " · set by your coach" : "") + "</p>" : '<p class="muted small">Tap to log when you got it.</p>') + "</div>" + CHEV + "</div></button>";
  if (!UI.beltPage) return h + vBeltGoalsHistory(track, cur);
  if (cur.min) h += '<div class="card"><p class="small">' + esc(cur.min) + " (IBJJF).</p>" + '<div class="actions"><button class="btn" data-act="add-promo">Log a promotion</button><button class="btn ghost" data-act="edit-belt">Edit current belt</button></div></div>';
  else h += '<div class="card"><div class="actions"><button class="btn" data-act="add-promo">Log a promotion</button><button class="btn ghost" data-act="edit-belt">Edit current belt</button></div></div>';
  h += seg([["kids", "Kids 4–15"], ["adult", "Adult 16+"]], track, "belttrack");
  h += '<div class="card"><h3>Ladder</h3><div class="ladder">' + ladder.map((b, i) => '<div class="rung' + (i === idx ? " cur" : i < idx ? " past" : "") + '"><span class="sw">' + beltSwatch(b) + '</span><span style="flex:1">' + esc(b.n) + (i === idx ? ' <span class="pill ok">now</span>' : "") + '</span><span class="muted small">' + esc(b.age) + " yrs</span></div>").join("") + "</div>" +
    '<p class="muted small">' + (track === "kids" ? "Kids belts run to age 15, then the adult ladder." : "0–4 stripes per belt. Times are minimums.") + "</p></div>";
  return h;
};
function vBeltGoalsHistory(track, cur) {
  let h = "";
  const goals = S.belt.goals[S.belt.belt] || [];
  const done = goals.filter((g) => g.done).length;
  h += '<div class="card"><div class="card-head"><h3>Things to learn at this belt</h3><span class="muted small num">' + done + " / " + goals.length + "</span></div>";
  if (goals.length) h += '<div class="bar"><i style="width:' + Math.round((done / goals.length) * 100) + '%"></i></div>';
  h += '<div class="list">' + goals.map((g) => '<div class="row' + (g.done ? " done" : "") + '"><button class="check' + (g.done ? " on" : "") + '" data-act="goal-toggle" data-id="' + g.id + '" aria-pressed="' + !!g.done + '">' + CHECK + '</button><div class="txt">' + esc(g.t) + "</div>" + delBtn("g:" + g.id, "del-goal", 'data-id="' + g.id + '"') + "</div>").join("") + "</div>";
  h += '<form class="actions" id="goal-form" style="align-items:stretch"><input id="goal-t" type="text" placeholder="New goal…" style="flex:1" aria-label="New goal"><button class="btn" type="submit" style="flex:none">Add</button></form>';
  if (!goals.length && SEED.beltGoals[S.belt.belt.split("-")[0]]) h += '<button class="btn ghost wide" data-act="seed-goals">Add example goals</button>';
  h += "</div>";
  // history
  const hist = S.belt.history.slice().sort((a, b) => (a.d < b.d ? 1 : -1));
  h += '<div class="card"><h3>Promotion history</h3>' + (hist.length ? '<div class="list">' + hist.map((x) => '<button class="row" data-act="edit-promo" data-id="' + x.id + '"><span class="sw ladder" style="display:flex;width:40px;height:12px;border:1px solid var(--line);border-radius:2px;overflow:hidden">' + beltSwatch(beltDef(x.track || track, x.belt)) + '</span><div class="txt"><b>' + esc(beltDef(x.track || track, x.belt).n) + (x.stripes ? ", " + x.stripes + " stripes" : "") + "</b><small>" + fmtLong(x.d) + (x.note ? " · " + esc(x.note) : "") + "</small></div>" + CHEV + "</button>").join("") + "</div>" : '<p class="empty">No promotions logged.</p>') + "</div>";
  return h;
};
function promoSheet(id) {
  if (!isAdmin()) return;
  const x = S.belt.history.find((h) => h.id === id); if (!x) return;
  openSheet("Promotion", field("f-d", "Date", inp("f-d", x.d, "date", 'max="' + todayIso() + '"')) + field("f-note", "Note", inp("f-note", x.note || "", "text")), {
    onSave() { x.d = sv("f-d") || x.d; x.note = sv("f-note").trim(); save("belt"); render(); return true; },
    onDelete() { S.belt.history = S.belt.history.filter((h) => h.id !== x.id); save("belt"); render(); return true; },
  });
}
function beltSheet(promo) {
  if (!isAdmin()) { toast("Your coach manages your belt"); return; }
  const track = S.belt.track; const ladder = SEED.belts[track];
  const b = () => '<div class="field"><span class="lbl">Ladder</span>' + chips("track", [["kids", "Kids"], ["adult", "Adult"]], pickVal("track", track)) + "</div>" +
    field("f-belt", "Belt", '<select id="f-belt">' + SEED.belts[pickVal("track", track)].map((x) => '<option value="' + x.id + '"' + (x.id === S.belt.belt ? " selected" : "") + ">" + esc(x.n) + "</option>").join("") + "</select>") +
    '<div class="field"><span class="lbl">Stripes</span>' + scale("stripes", promo ? Math.min(4, (+S.belt.stripes || 0) + 1) : +S.belt.stripes || 0, 0, 4) + "</div>" +
    field("f-d", promo ? "When" : "Date you got the belt", inp("f-d", promo ? todayIso() : S.belt.since, "date", 'max="' + todayIso() + '"')) +
    (promo ? field("f-note", "Note (coach, club)", inp("f-note", "", "text")) : "");
  openSheet(promo ? "Log a promotion" : "Current belt", b, {
    state: { picks: { track, stripes: promo ? Math.min(4, (+S.belt.stripes || 0) + 1) : +S.belt.stripes || 0 }, rerender: "belt" },
    onSave() {
      const t = pickVal("track", track); const belt = sv("f-belt"); const stripes = pickVal("stripes", 0); const d = sv("f-d");
      const beltChanged = belt !== S.belt.belt;
      S.belt.track = t; S.belt.belt = belt; S.belt.stripes = stripes;
      if (promo) { if (beltChanged || !S.belt.since) S.belt.since = d || todayIso(); S.belt.history.push({ id: uid(), d: d || todayIso(), track: t, belt, stripes, note: sv("f-note").trim() }); toast("Congratulations!"); }
      else S.belt.since = d;
      save("belt"); render(); return true;
    },
  });
}

/* ======================= WEIGHT ======================= */
VIEWS.weight = function () {
  const items = S.weight.items.slice().sort((a, b) => (a.d < b.d ? -1 : 1)); const last = items[items.length - 1];
  const cls = SEED.weightClasses[S.weight.cls] || SEED.weightClasses.adult_m; const tgt = cls.c.find((c) => c[0] === S.weight.target); const lim = tgt ? tgt[1] : null;
  let h = '<div class="card"><form class="grid2" id="w-form" style="align-items:end">' + field("w-kg", "Today’s weight, kg", inp("w-kg", "", "number", 'inputmode="decimal" step="0.1" min="10" max="200" placeholder="' + (last ? last.kg : "45.0") + '"')) + field("w-d", "Date", inp("w-d", todayIso(), "date", 'max="' + todayIso() + '"')) + '<button class="btn" type="submit" style="grid-column:1/-1">Log it</button></form></div>';
  if (last) {
    const wkAgo = items.filter((x) => x.d <= addDays(last.d, -7)).pop(); const diff = wkAgo ? (last.kg - wkAgo.kg) : null;
    const rng = UI.wRange || "90"; const from = rng === "all" ? "" : addDays(todayIso(), -+rng); const shown = items.filter((x) => x.d >= from);
    h += '<div class="card"><div class="summary"><div class="stat"><b>' + last.kg + '</b><span>latest, kg</span></div><div class="stat"><b>' + (diff == null ? "—" : (diff > 0 ? "+" : "") + diff.toFixed(1)) + '</b><span>7 days</span></div><div class="stat"><b>' + (lim == null ? "—" : (lim - last.kg).toFixed(1)) + '</b><span>' + (lim == null ? "no limit set" : "to the limit") + "</span></div></div>" + '<div class="chips">' + [["30", "30 days"], ["90", "3 months"], ["365", "Year"], ["all", "All"]].map((r) => '<button type="button" class="chip' + (rng === r[0] ? " on" : "") + '" data-act="w-range" data-v="' + r[0] + '">' + r[1] + "</button>").join("") + "</div>" + weightChart(shown.length ? shown : items.slice(-1), lim) + "</div>";
  }
  h += '<div class="card"><h3>Competition weight class</h3>' + field("w-cls", "Category", '<select id="w-cls" data-act-change="w-cls">' + Object.entries(SEED.weightClasses).map(([k, v]) => '<option value="' + k + '"' + (k === S.weight.cls ? " selected" : "") + ">" + esc(v.n) + "</option>").join("") + "</select>") +
    '<div class="list">' + cls.c.map((c) => '<button class="row" data-act="w-target" data-v="' + esc(c[0]) + '"><span class="check' + (S.weight.target === c[0] ? " on" : "") + '">' + CHECK + '</span><div class="txt"><b>' + esc(c[0]) + "</b></div><span class=\"num\">" + (c[1] == null ? "no limit" : c[1] + " kg limit") + "</span></button>").join("") + "</div>" +
    '<p class="muted small">IBJJF weighs you in the gi (about 1–1.5 kg extra). Kids divisions differ per event.</p></div>';
  if (items.length) h += '<div class="card"><h3>Log</h3><div class="list">' + items.slice().reverse().slice(0, 30).map((x) => '<button class="row" data-act="edit-weight" data-id="' + x.id + '"><div class="txt"><b>' + x.kg + ' kg</b><small>' + fmtLong(x.d) + "</small></div>" + CHEV + "</button>").join("") + "</div></div>";
  return h;
};
function weightSheet(id) {
  const x = S.weight.items.find((w) => w.id === id); if (!x) return;
  openSheet("Weight entry", '<div class="grid2">' + field("f-kg", "Weight, kg", inp("f-kg", x.kg, "number", 'inputmode="decimal" step="0.1"')) + field("f-d", "Date", inp("f-d", x.d, "date", 'max="' + todayIso() + '"')) + "</div>", {
    onSave() { const kg = +sv("f-kg"); if (!kg) return false; x.kg = kg; x.d = sv("f-d") || x.d; save("weight"); render(); return true; },
    onDelete() { S.weight.items = S.weight.items.filter((w) => w.id !== x.id); save("weight"); render(); return true; },
  });
}
function weightChart(items, lim) {
  if (items.length === 1) items = [{ d: addDays(items[0].d, -1), kg: items[0].kg, ghost: true }, items[0]];
  if (!items.length) return "";
  const W = 320, H = 160, px = 28, py = 14; const vals = items.map((x) => +x.kg); let lo = Math.min(...vals, lim == null ? Infinity : lim), hi = Math.max(...vals, lim == null ? -Infinity : lim); if (hi - lo < 2) { lo -= 1; hi += 1; } lo = Math.floor(lo - 0.5); hi = Math.ceil(hi + 0.5);
  const x = (i) => px + (i / (items.length - 1)) * (W - px - 6), y = (v) => py + (1 - (v - lo) / (hi - lo)) * (H - py * 2);
  const d = items.map((it, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(it.kg).toFixed(1)).join(" ");
  let h = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img" aria-label="Weight chart">';
  h += '<text x="2" y="' + (py + 4) + '">' + hi + '</text><text x="2" y="' + (H - py + 4) + '">' + lo + "</text>";
  if (lim != null) h += '<line class="lim" x1="' + px + '" x2="' + W + '" y1="' + y(lim).toFixed(1) + '" y2="' + y(lim).toFixed(1) + '"/>';
  h += '<path class="l" d="' + d + '"/>' + items.map((it, i) => '<circle class="d" r="3" cx="' + x(i).toFixed(1) + '" cy="' + y(it.kg).toFixed(1) + '"/>').join("");
  h += '<text x="' + px + '" y="' + (H - 2) + '">' + fmtD(items[0].d) + '</text><text x="' + (W - 6) + '" y="' + (H - 2) + '" text-anchor="end">' + fmtD(items[items.length - 1].d) + "</text></svg>";
  return h;
}

/* ======================= COMPETITION ======================= */
const RES = [["w", "Win"], ["l", "Loss"], ["d", "Draw"]];
const HOW = [["sub", "Submission"], ["pts", "Points"], ["adv", "Advantage"], ["ref", "Referee decision"], ["dq", "DQ"], ["wo", "Walkover"]];
const HNAME = Object.fromEntries(HOW);
const MEDALS = [["", "No medal"], ["gold", "Gold"], ["silver", "Silver"], ["bronze", "Bronze"]];
const MNAME = { gold: "Gold", silver: "Silver", bronze: "Bronze" };
VIEWS.comp = function () {
  if (UI.comp.id) { const ev = S.comp.events.find((e) => e.id === UI.comp.id); if (ev) return vEvent(ev); UI.comp.id = null; }
  const today = todayIso(); const evs = S.comp.events.slice().sort((a, b) => (a.d < b.d ? 1 : -1));
  const all = evs.flatMap((e) => e.matches || []); const w = all.filter((m) => m.res === "w").length, l = all.filter((m) => m.res === "l").length, subs = all.filter((m) => m.res === "w" && m.how === "sub").length;
  const medals = evs.filter((e) => e.medal).length;
  let h = '<div class="card"><div class="summary four"><div class="stat"><b>' + w + '</b><span>wins</span></div><div class="stat"><b>' + l + '</b><span>losses</span></div><div class="stat"><b>' + subs + '</b><span>by sub</span></div><div class="stat"><b>' + medals + '</b><span>medals</span></div></div></div>';
  h += '<button class="btn big wide" data-act="add-event">+ Add competition</button>';
  const up = evs.filter((e) => e.d >= today).reverse(), past = evs.filter((e) => e.d < today);
  const row = (e) => { const ms = e.matches || []; const ww = ms.filter((m) => m.res === "w").length; const dd = daysBetween(today, e.d); return '<button class="row" data-act="open-event" data-id="' + e.id + '"><div class="txt"><b>' + esc(e.n) + (e.medal ? ' <span class="pill ' + (e.medal === "gold" ? "warn" : "na") + '">' + MNAME[e.medal] + "</span>" : "") + "</b><small>" + fmtLong(e.d) + (e.div ? " · " + esc(e.div) : "") + (e.d >= today ? ' · <span class="pill ok">' + (dd === 0 ? "today" : dd + " days left") + "</span>" : ms.length ? " · " + ww + "–" + (ms.length - ww) : "") + "</small></div>" + CHEV + "</button>"; };
  if (up.length) h += '<div class="card"><h3>Upcoming</h3><div class="list">' + up.map(row).join("") + "</div></div>";
  h += '<div class="card"><h3>Past competitions</h3>' + (past.length ? '<div class="list">' + past.map(row).join("") + "</div>" : '<p class="empty">No competitions logged.</p>') + "</div>";
  return h;
};
function vEvent(e) {
  const today = todayIso(); const ms = e.matches || []; const ww = ms.filter((m) => m.res === "w").length;
  let h = '<button class="back" data-act="close-event"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Compete</button>';
  h += '<div class="card"><h2>' + esc(e.n) + '</h2><p class="muted small">' + fmtLong(e.d) + (e.org ? " · " + esc(e.org) : "") + (e.place ? " · " + esc(e.place) : "") + "</p>";
  const bits = []; if (e.div) bits.push(e.div); bits.push(e.gi === false ? "No-gi" : "Gi"); if (e.target) bits.push("Weight " + e.target + " kg limit"); h += '<p class="small">' + esc(bits.join(" · ")) + "</p>";
  if (e.d >= today) { const dd = daysBetween(today, e.d); const lw = S.weight.items.slice().sort((a, b) => (a.d < b.d ? 1 : -1))[0]; h += '<div class="tip">' + (dd === 0 ? "Today!" : dd + " days to go.") + (e.target && lw ? " Last weight " + lw.kg + " kg, " + (e.target - lw.kg).toFixed(1) + " kg to the limit." : "") + "</div>"; }
  if (e.plan && S.plans.items.find((p) => p.id === e.plan)) { const p = S.plans.items.find((x) => x.id === e.plan); h += '<p class="small"><b>Game plan:</b> ' + esc(p.n) + " — " + esc(p.x) + "</p>"; }
  h += '<div class="field"><span class="lbl">Result</span>' + chips("medal", MEDALS, e.medal || "") + "</div>";
  { const r = CLUB.id && CLUB.results && CLUB.results.list.find((x) => x.uid === myUid() && x.evId === e.id); if (r) h += '<p class="small"><span class="pill ' + (r.status === "ok" ? "ok" : "na") + '">' + (r.status === "ok" ? "Approved by your coach" : "Waiting for your coach") + "</span></p>"; }
  h += '<div class="actions"><button class="btn ghost" data-act="edit-event" data-id="' + e.id + '">Edit</button></div></div>';
  h += '<div class="card"><div class="card-head"><h3>Matches</h3>' + (ms.length ? '<span class="muted small">' + ww + " wins · " + (ms.length - ww) + " losses</span>" : "") + "</div>";
  h += ms.length ? '<div class="list">' + ms.map((m, i) => '<button class="row" data-act="edit-match" data-id="' + e.id + '" data-i="' + i + '"><span class="pill ' + (m.res === "w" ? "ok" : m.res === "l" ? "bad" : "na") + '">' + (m.res === "w" ? "Win" : m.res === "l" ? "Loss" : "Draw") + '</span><div class="txt"><b>' + (i + 1) + ". " + esc(m.opp || "Opponent") + "</b><small>" + [HNAME[m.how], m.tech, m.score].filter(Boolean).map(esc).join(" · ") + (m.note ? " · " + esc(m.note) : "") + "</small></div>" + CHEV + "</button>").join("") + "</div>" : '<p class="empty">One row per match. Write what won and what lost.</p>';
  h += '<button class="btn ghost wide" data-act="add-match" data-id="' + e.id + '">+ Add match</button></div>';
  return h;
}
function eventSheet(id) {
  const e = id ? S.comp.events.find((x) => x.id === id) : null;
  const b = () => field("f-n", "Competition name", inp("f-n", e ? e.n : "", "text", "autofocus")) + '<div class="grid2">' + field("f-d", "Date", inp("f-d", e ? e.d : todayIso(), "date")) + field("f-org", "Organizer", inp("f-org", e ? e.org : "", "text", 'placeholder="IBJJF, federation, club"')) + "</div>" +
    '<div class="grid2">' + field("f-place", "Where", inp("f-place", e ? e.place : "", "text")) + field("f-div", "Division (age, belt, weight)", inp("f-div", e ? e.div : "", "text", 'placeholder="Kids 12, grey, 45 kg"')) + "</div>" +
    '<div class="grid2"><div class="field"><span class="lbl">Uniform</span>' + chips("gi", [["1", "Gi"], ["0", "No-gi"]], e && e.gi === false ? "0" : "1") + "</div>" + field("f-target", "Weight limit, kg", inp("f-target", e ? e.target : "", "number", 'inputmode="decimal" step="0.1"')) + "</div>" +
    field("f-plan", "Game plan", '<select id="f-plan"><option value="">—</option>' + S.plans.items.map((p) => '<option value="' + p.id + '"' + (e && e.plan === p.id ? " selected" : "") + ">" + esc(p.n) + "</option>").join("") + "</select>");
  openSheet(e ? "Edit competition" : "New competition", b, {
    state: { picks: { gi: e && e.gi === false ? "0" : "1" } },
    onSave() { const n = sv("f-n").trim(); if (!n) { $("f-n").focus(); return false; } const rec = e || { id: uid(), matches: [], medal: "" }; rec.n = n; rec.d = sv("f-d") || todayIso(); rec.org = sv("f-org").trim(); rec.place = sv("f-place").trim(); rec.div = sv("f-div").trim(); rec.gi = pickVal("gi", "1") === "1"; rec.target = +sv("f-target") || ""; rec.plan = sv("f-plan"); if (!e) { S.comp.events.push(rec); UI.comp.id = rec.id; } save("comp"); render(); return true; },
    onDelete: e ? () => { S.comp.events = S.comp.events.filter((x) => x.id !== e.id); UI.comp.id = null; save("comp"); go("enter-r"); return true; } : null,
  });
}
function matchSheet(eid, i) {
  const e = S.comp.events.find((x) => x.id === eid); if (!e) return; e.matches = e.matches || []; const m = i != null ? e.matches[i] : null;
  const b = () => field("f-opp", "Opponent", inp("f-opp", m ? m.opp : "", "text", 'autofocus placeholder="Name, club"')) +
    '<div class="field"><span class="lbl">Result</span>' + chips("res", RES, m ? m.res : "w") + '</div><div class="field"><span class="lbl">How</span>' + chips("how", HOW, m ? m.how : "sub") + "</div>" +
    picker("tech", "Which technique", "sub", { ph: "Submission, sweep…" }) +
    '<div class="grid2">' + field("f-score", "Points", inp("f-score", m ? m.score : "", "text", 'placeholder="4–2"')) + field("f-note", "Notes", inp("f-note", m ? m.note : "", "text")) + "</div>";
  openSheet(m ? "Edit match" : "Add match", b, {
    state: { picks: { res: m ? m.res : "w", how: m ? m.how : "sub" }, pk: { tech: m && m.tech ? [{ id: m.techId || "", n: m.tech, c: 1 }] : [] } },
    onSave() { const rec = m || {}; rec.opp = sv("f-opp").trim(); rec.res = pickVal("res", "w"); rec.how = pickVal("how", "sub"); const t = (UI.sheet.pk.tech || [])[0]; rec.tech = t ? t.n : ""; rec.techId = t ? t.id : ""; rec.score = sv("f-score").trim(); rec.note = sv("f-note").trim(); if (!m) e.matches.push(rec); save("comp"); render(); return true; },
    onDelete: m ? () => { e.matches.splice(i, 1); save("comp"); render(); return true; } : null,
  });
}

/* ======================= SETTINGS ======================= */
function settingsSheet() {
  const b = field("f-name", "Your name (shown to your club)", inp("f-name", S.settings.name || "", "text", 'placeholder="Name"')) + '<div class="field"><span class="lbl">Language</span>' + chips("lang", [["mn", "Монгол"], ["en", "English"]], I18N.lang) + "</div>" + '<div class="field"><span class="lbl">Theme</span>' + chips("theme", [["system", "Device"], ["light", "Light"], ["dark", "Dark"]], S.settings.theme || "system") + "</div>" +
    '<div class="field"><span class="lbl">Ruleset</span>' + chips("rules", [["both", "Gi & no-gi"], ["gi", "Gi only"], ["nogi", "No-gi only"]], S.settings.rules || "both") + '</div><div class="field"><span class="lbl">Belt filter</span>' + chips("beltf", [["0", "Show all"], ["1", "Only up to my belt"]], S.settings.beltFilter ? "1" : "0") + "</div>" +
    '<div class="field"><span class="lbl">Technique library</span><button class="btn ghost' + (UI.confirm === "reset" ? " danger" : "") + '" data-act="reset-seed">' + (UI.confirm === "reset" ? "Really reset? Everything you added will be lost" : "Reload the starter library") + "</button></div>" +
    '<p class="muted small">' + (mode === "cloud" ? "Signed in: " + esc(loginName((SB.session || {}).email || "")) : "Local mode: data stays on this device only.") + "</p>" + ((isSuper() || isAdmin()) && mode === "cloud" ? '<a class="btn ghost" href="admin.html" style="display:flex;align-items:center;justify-content:center;text-decoration:none">Open the admin console</a>' : "");
  openSheet("Settings", b, { state: { picks: { theme: S.settings.theme || "system", rules: S.settings.rules || "both", beltf: S.settings.beltFilter ? "1" : "0" } }, onSave() { S.settings.name = sv("f-name").trim(); save("settings"); if (CLUB.id) clubUpdateMe(); render(); return true; } });
}
/* Menu (☰ in the header): the places that are not a tab, plus settings and sign out. */
function menuSheet() {
  const row = (act, ic, t, sub, cls, attrs) => '<button class="mrow' + (cls ? " " + cls : "") + '" data-act="' + act + '"' + (attrs ? " " + attrs : "") + '><span class="mic">' + ic + '</span><span class="txt"><b>' + t + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + "</span>" + CHEV + "</button>";
  const b = beltDef(S.belt.track, S.belt.belt); const sk = streaks();
  let h = '<div class="menu">' + row("profile", menuIcon("profile"), "My profile", esc(myName())) + row("menu-go", menuIcon("progress"), "Progress", "Level " + levelOf(xpTotal()) + (sk.weeks ? " · " + sk.weeks + " week streak" : ""), "", 'data-v="prog"') +
    row("menu-go", menuIcon("club"), "My club", CLUB.profile ? esc(CLUB.profile.n) : "", "", 'data-v="club"') + row("menu-go", menuIcon("map"), "Technique map", "", "", 'data-v="map"') + row("menu-go", menuIcon("belt"), "Belt and rank", esc(b.n) + " belt" + (S.belt.stripes ? ", " + S.belt.stripes + " stripes" : ""), "", 'data-v="belt"') +
    (S.log.items.length ? row("menu-share", menuIcon("share"), "Share the last session") : "") + row("menu-lang", menuIcon("language"), "Language", I18N.lang === "mn" ? "Монгол → English" : "English → Монгол") + row("menu-settings", menuIcon("settings"), "Settings") +
    ((isSuper() || isAdmin()) && mode === "cloud" ? '<a class="mrow" href="admin.html" data-act="menu-admin"><span class="mic">' + menuIcon("coach") + '</span><span class="txt"><b>Coach console</b></span>' + CHEV + "</a>" : "") +
    (mode === "cloud" ? row("logout", menuIcon("logout"), UI.confirm === "logout" ? "Sign out?" : "Sign out", esc(loginName((SB.session || {}).email || "")), "danger") : "") + "</div>";
  openSheet("Menu", h, {});
}
/* Social profile: my page (VIEWS.profile, opened from the avatar) and a teammate's sheet (profileSheet). */
function myHandle() { return mode === "cloud" ? loginName((SB.session || {}).email || "") || "me" : "local"; }
function kudosFor(uidv) { return (CLUB.feed || []).filter((p) => p.uid === uidv).reduce((a, p) => a + ((p.kudos || []).length), 0); }
function subCounts() { const c = {}; let n = 0; for (const s of S.log.items) for (const x of s.subs || []) { const nm = x && typeof x === "object" ? x.n : x; if (!nm) continue; const k = +x.c || 1; n += k; c[nm] = (c[nm] || 0) + k; } return { n, top: Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5) }; }
VIEWS.profile = function () {
  const name = myName(); const b = beltDef(S.belt.track, S.belt.belt); const sk = streaks(); const lv = levelOf(xpTotal()); const items = sessionsSorted(); const sc = subCounts();
  let h = '<div class="pf-nav"><button class="icon-btn" data-act="profile-back">‹ Back</button></div>';
  h += '<div class="card profile pf">' + avatarHtml(name, S.settings.avatar, "xl") + '<div><h2>' + esc(name) + '</h2><p class="handle-name">@' + esc(myHandle()) + '</p></div><span class="pill ok">Level ' + lv + "</span>" +
    '<div class="pf-row"><span><i>👊</i> ' + kudosFor(myUid()) + " Oss</span><span><i>🔥</i> " + sk.weeks + " week streak</span></div>" +
    '<div class="belt big" role="img" aria-label="' + esc(b.n) + ' belt">' + beltHtml(true) + '</div><p class="muted small">' + esc(b.n) + " belt" + (S.belt.stripes ? ", " + S.belt.stripes + " stripes" : "") + "</p></div>";
  h += '<div class="card"><div class="pf-kv"><span class="lbl">Gym / Academy</span><b>' + (CLUB.profile ? esc(CLUB.profile.n) : "—") + '</b></div><div class="pf-kv"><span class="lbl">Bio</span>' + (S.settings.bio ? "<p>" + esc(S.settings.bio) + "</p>" : '<p class="muted">No bio yet</p>') + '</div><button class="btn ghost wide" data-act="profile-edit">Edit</button></div>';
  h += '<div class="card"><div class="summary"><div class="stat"><b>' + items.length + '</b><span>sessions</span></div><div class="stat"><b>' + sc.n + '</b><span>submissions</span></div><div class="stat"><b>' + (S.settings.mine || []).length + "</b><span>techniques</span></div></div></div>";
  h += '<div class="pf-cols"><div class="card"><h3>Recent sessions</h3>' + (items.length ? '<div class="list">' + items.slice(0, 5).map((s) => '<button class="row" data-act="edit-sess" data-id="' + s.id + '"><div class="txt"><b>' + fmtD(s.d) + "</b><small>" + (SNAME[s.type] || s.type) + " · " + (+s.min || 0) + " min</small></div></button>").join("") + "</div>" : '<p class="empty">No sessions yet</p>') + "</div>" +
    '<div class="card"><h3>Top submissions</h3>' + (sc.top.length ? '<div class="list">' + sc.top.map((x) => '<div class="row"><div class="txt"><b>' + esc(x[0]) + '</b></div><span class="cnt">' + x[1] + "</span></div>").join("") + "</div>" : '<p class="empty">No submissions yet</p>') + "</div></div>";
  return h;
};
function profileEditSheet() {
  const b = '<div class="avpick"><span class="av xl" id="pf-av">' + avatarInner(myName(), S.settings.avatar) + '</span><div class="avpick-b"><label for="pf-photo" class="btn ghost" style="display:flex;align-items:center;justify-content:center">Choose a photo<input id="pf-photo" type="file" accept="image/*" hidden></label><button type="button" class="btn ghost" data-act="avatar-rm"' + (S.settings.avatar ? "" : " hidden") + '>Remove photo</button></div></div>' +
    field("f-name", "Your name (shown to your club)", inp("f-name", S.settings.name || "", "text", 'placeholder="Name"')) + field("f-bio", "Bio", ta("f-bio", S.settings.bio || "", "A few words about you: since when you train, what you like…"));
  openSheet("Edit profile", b, { state: { av: S.settings.avatar || "" }, onSave() { S.settings.name = sv("f-name").trim(); S.settings.bio = sv("f-bio").trim().slice(0, 300); S.settings.avatar = (UI.sheet && UI.sheet.av) || ""; if (!S.settings.avatar) delete S.settings.avatar; save("settings"); if (CLUB.id) clubUpdateMe(); render(); return true; } });
  const inp0 = $("pf-photo"); inp0.addEventListener("change", () => { const f = inp0.files && inp0.files[0]; if (!f) return; avatarFromFile(f).then((d) => { if (!UI.sheet) return; UI.sheet.av = d; avatarPreview(); }, () => toast("Could not read the photo")); inp0.value = ""; });
}
/* Avatar: a 96×96 centre-cropped JPEG data URL (≈3–5 KB) in S.settings.avatar, mirrored to the member record (av) and feed posts. */
function avatarFromFile(f) {
  return new Promise((res, rej) => { const url = URL.createObjectURL(f); const im = new Image(); im.onload = () => { URL.revokeObjectURL(url); try { const N = 50, cv = document.createElement("canvas"); cv.width = N; cv.height = N; const g = cv.getContext("2d"); const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height; const c = Math.min(w, h); g.drawImage(im, (w - c) / 2, (h - c) / 2, c, c, 0, 0, N, N); res(cv.toDataURL("image/jpeg", 0.75)); } catch (e) { rej(e); } }; im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("bad image")); }; im.src = url; });
}
function avatarPreview() { const el = $("pf-av"); if (!el || !UI.sheet) return; el.innerHTML = avatarInner(sv("f-name") || myName(), UI.sheet.av); const rm = document.querySelector('#sheet-body [data-act="avatar-rm"]'); if (rm) rm.hidden = !UI.sheet.av; }
function avatarInner(name, av) { return av ? '<img src="' + esc(av) + '" alt="">' : esc(initials(name)); }
function avatarHtml(name, av, cls, attrs) { const t = attrs ? "button" : "span"; return "<" + t + ' class="av' + (cls ? " " + cls : "") + '"' + (attrs ? " " + attrs : "") + ">" + avatarInner(name, av) + "</" + t + ">"; }
function memAv(uidv) { const m = ((CLUB.members && CLUB.members.list) || []).find((x) => x.uid === uidv); return (m && m.av) || ""; }
function profileSheet(uidv) {
  const m = ((CLUB.members && CLUB.members.list) || []).find((x) => x.uid === uidv || x.id === uidv); const posts = (CLUB.feed || []).filter((p) => p.uid === uidv);
  const name = socialName(m); const bid = (m && m.belt) || (posts[0] && posts[0].belt); const b = bid ? beltDef((m && m.track) || "adult", bid) : null; const wk = posts.length ? +posts[0].weeks || 0 : 0;
  let h = '<div class="pf"><div class="prow" style="flex-direction:column;text-align:center;gap:6px">' + avatarHtml(name, (m && m.av) || (posts[0] && posts[0].av) || "", "xl") + '<h2 style="font-size:1.3rem">' + esc(name) + "</h2>" + (b ? '<p class="muted small">' + esc(b.n) + " belt" + (m && m.stripes ? ", " + m.stripes + " stripes" : "") + "</p>" : "") +
    '<div class="pf-row"><span><i>👊</i> ' + kudosFor(uidv) + " Oss</span><span><i>🥋</i> " + posts.length + " sessions</span>" + (wk ? "<span><i>🔥</i> " + wk + " week streak</span>" : "") + "</div></div></div>";
  h += '<div class="list">' + (posts.length ? posts.slice(0, 3).map((p) => '<div class="row"><div class="txt"><b>' + (FEED_TITLE[p.type] || "Training") + "</b><small>" + fmtLong(p.d) + " · " + (+p.min || 0) + " min" + (p.rounds ? " · " + p.rounds + " rounds" : "") + "</small></div>" + ((p.kudos || []).length ? '<span class="muted small">👊 ' + p.kudos.length + "</span>" : "") + "</div>").join("") : '<p class="empty">No training posted yet</p>') + "</div>";
  openSheet("Profile", h, {});
}
function applyTheme() { const t = S.settings.theme || "system"; if (t === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; try { localStorage.setItem("bjj-theme", t); } catch (e) {} }
function download(name, text) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
async function importBackup(file) {
  try { const o = JSON.parse(await file.text()); if (!o || !o.tree || !o.log) throw 0; for (const k of KEYS) if (o[k]) S[k] = o[k]; normalize(); for (const k of KEYS) save(k); applyTheme(); closeSheet(); render(); toast("Restored"); } catch (e) { toast("That file does not match"); }
}


/* ======================= TRAIN / ME (grouped tabs) ======================= */
VIEWS.train = function () { return VIEWS.me(); };

/* ======================= DRILLS ======================= */
const DKIND = [["all", "All"], ["solo", "Solo"], ["partner", "Partner"], ["sub", "Submissions"], ["td", "Takedowns"], ["esc", "Escapes"], ["flow", "Sparring"]];
const DKNAME = Object.fromEntries(DKIND);
function allDrills() { return (SEED.drills || []).concat(S.body.drills || []); }
function findTech(name) { const q = name.toLowerCase(); return nodes().find((n) => n.k === "mv" && n.n.toLowerCase() === q) || nodes().find((n) => n.k === "mv" && n.n.toLowerCase().includes(q)); }
function drillCount(id, since) { return S.body.items.filter((x) => x.cat === "drill" && x.drill === id && (!since || x.d >= since)).length; }
function suggestDrills() {
  const weak = (typeof learnCards === "function" ? learnCards() : []).filter((c) => c.f >= 2).map((c) => c.n.n.toLowerCase());
  const all = allDrills(); const hits = all.filter((d) => (d.tech || []).some((t) => weak.some((w) => w.includes(t.toLowerCase()) || t.toLowerCase().includes(w))));
  if (hits.length >= 3) return { why: "from your Learn misses", list: hits.slice(0, 3) };
  const day = Math.floor(Date.now() / 86400000); const kinds = ["solo", "partner", "sub", "td", "esc"]; const out = []; for (let i = 0; i < 3; i++) { const ks = all.filter((d) => d.kind === kinds[(day + i) % kinds.length]); if (ks.length) out.push(ks[(day + i * 7) % ks.length]); }
  return { why: "today’s rotation", list: hits.concat(out).slice(0, 3) };
}
function vDrills() {
  const f = UI.drillF || "all"; const today = todayIso(), wk = mondayOf(today), mo = today.slice(0, 7);
  const logs = S.body.items.filter((x) => x.cat === "drill"); const wkN = logs.filter((x) => x.d >= wk).length, moN = logs.filter((x) => x.d.startsWith(mo)).length;
  const list = allDrills().filter((d) => f === "all" || d.kind === f);
  let h = '<div class="card"><div class="summary"><div class="stat"><b>' + wkN + '</b><span>drills this week</span></div><div class="stat"><b>' + moN + '</b><span>this month</span></div><div class="stat"><b>' + allDrills().length + '</b><span>in the library</span></div></div>';
  const sg = suggestDrills(); h += '<p class="muted small">Today · ' + esc(sg.why) + '</p><div class="chips">' + sg.list.map((d) => '<button class="chip" data-act="drill-open" data-id="' + d.id + '">' + esc(dn(d)) + "</button>").join("") + "</div></div>";
  h += '<div class="chips">' + DKIND.map((k) => '<button type="button" class="chip' + (f === k[0] ? " on" : "") + '" data-act="drillf" data-v="' + k[0] + '">' + k[1] + "</button>").join("") + "</div>";
  const order = ["solo", "partner", "sub", "td", "esc", "flow"];
  for (const k of order) { const ds = list.filter((d) => d.kind === k); if (!ds.length) continue;
    h += '<div class="card"><div class="card-head"><h3>' + DKNAME[k] + "</h3><span class=\"muted small\">" + ds.length + "</span></div><div class=\"list\">" + ds.map((d) => {
      const open = UI.drillOpen === d.id; const n = drillCount(d.id); const ok = allowed({ belt: d.lvl || "white", gi: "both", kids: true });
      let r = '<button class="row" data-act="drill-open" data-id="' + d.id + '" aria-expanded="' + open + '"><span class="pict dk ' + d.kind + '"><svg viewBox="0 0 24 24">' + (d.kind === "solo" ? PICT.stand : d.kind === "sub" ? TICON.sub : d.kind === "td" ? TICON.td : d.kind === "esc" ? TICON.esc : d.kind === "flow" ? TICON.trans : TICON.ctl) + '</svg></span><div class="txt"><b>' + esc(dn(d)) + "</b><small>" + esc(d.dose || "") + (d.lvl && d.lvl !== "white" ? " · from " + d.lvl : "") + (n ? " · done " + n + "×" : "") + "</small></div>" + CHEV + "</button>";
      if (open) r += '<div class="dbody"><ol class="steps">' + (d.cues || []).map((c) => "<li>" + esc(c) + "</li>").join("") + "</ol>" + ((d.tech || []).length ? '<div class="chips">' + d.tech.map((t) => { const nd = findTech(t); return nd ? '<button class="chip pchip" data-act="open" data-id="' + nd.id + '">' + iconFor(nd) + "<span>" + esc(nd.n) + "</span></button>" : ""; }).join("") + "</div>" : "") + '<div class="actions"><button class="btn" data-act="drill-done" data-id="' + d.id + '">Done today</button>' + (d.custom ? '<button class="btn ghost" data-act="drill-edit" data-id="' + d.id + '">Edit</button>' : "") + "</div></div>";
      return r; }).join("") + "</div></div>"; }
  h += '<button class="btn ghost wide" data-act="drill-add">+ Add my own drill</button>';
  const recent = logs.sort((a, b) => (a.d < b.d ? 1 : -1)).slice(0, 10);
  if (recent.length) h += '<div class="card"><h3>Drill log</h3><div class="list">' + recent.map((x) => '<button class="row" data-act="edit-blog" data-id="' + x.id + '"><div class="txt"><b>' + fmtD(x.d) + " · " + esc(x.n) + "</b><small>" + (x.min ? x.min + " min" : "") + (x.note ? " · " + esc(x.note) : "") + "</small></div>" + CHEV + "</button>").join("") + "</div></div>";
  return h;
}
function drillSheet(id) {
  const d = id ? (S.body.drills || []).find((x) => x.id === id) : null;
  const b = field("d-n", "Drill", inp("d-n", d ? d.n : "", "text", "autofocus")) + '<div class="field"><span class="lbl">Kind</span>' + chips("kind", DKIND.slice(1), d ? d.kind : "partner") + "</div>" + '<div class="grid2">' + field("d-dose", "Reps or time", inp("d-dose", d ? d.dose || "" : "", "text", 'placeholder="10 each side"')) + '<div class="field"><span class="lbl">From belt</span>' + chips("lvl", [["white", "White"], ["blue", "Blue"], ["purple", "Purple"]], d ? d.lvl || "white" : "white") + "</div></div>" + field("d-cues", "Cues (one per line)", ta("d-cues", (d ? d.cues || [] : []).join("\n"), "")) + field("d-tech", "Techniques it trains (names, one per line)", ta("d-tech", (d ? d.tech || [] : []).join("\n"), "Armbar"));
  openSheet(d ? "Edit drill" : "My drill", b, { state: { picks: { kind: d ? d.kind : "partner", lvl: d ? d.lvl || "white" : "white" } }, onDelete: d ? () => { S.body.drills = S.body.drills.filter((x) => x.id !== d.id); save("body"); render(); return true; } : null, onSave() {
    const n = sv("d-n").trim(); if (!n) return false; const rec = d || { id: "u_" + uid(), custom: true }; rec.n = n; rec.kind = pickVal("kind", "partner"); rec.lvl = pickVal("lvl", "white"); rec.dose = sv("d-dose").trim(); rec.cues = lines(sv("d-cues")); rec.tech = lines(sv("d-tech"));
    S.body.drills = S.body.drills || []; if (!d) S.body.drills.push(rec); save("body"); UI.drillOpen = rec.id; render(); return true;
  } });
}
function drillDone(id) {
  const d = allDrills().find((x) => x.id === id); if (!d) return;
  const b = '<div class="grid2">' + field("f-d", "Date", inp("f-d", todayIso(), "date", 'max="' + todayIso() + '"')) + field("f-min", "Minutes", inp("f-min", "", "number", 'inputmode="numeric"')) + "</div>" + field("f-note", "Note", inp("f-note", "", "text", 'placeholder="felt the timing / still slow on the left"'));
  openSheet(dn(d), b, { saveLabel: "Log it", onSave() { const rec = { id: uid(), d: sv("f-d") || todayIso(), cat: "drill", drill: d.id, n: dn(d), min: +sv("f-min") || 0, note: sv("f-note").trim() }; S.body.items.push(rec); save("body"); if (CLUB.id) attMark(rec.d, true); toast("Logged"); render(); return true; } });
}
function initials(n) { const w = String(n || "").trim().split(/\s+/).filter(Boolean); return (w.length > 1 ? w[0][0] + w[w.length - 1][0] : (w[0] || "?").slice(0, 2)).toUpperCase(); }
function hoursFmt(min) { return (min / 60).toFixed(min >= 600 ? 0 : 1); }
/* ======================= PROGRESS (XP, calendar, analytics, weekly challenges, achievements) ======================= */
/* Nothing here is stored: XP, levels and achievements are recomputed from the log, drills, rolls, check-ins and Mine. */
const XP_LEVEL = 300;
function mineList() { return Array.isArray(S.settings.mine) ? S.settings.mine : []; }
function checkinDays() { if (!CLUB.id) return []; const me = myUid(); const out = new Set(attDays(CLUB.attMonth, me)); if (CLUB.att && CLUB.att.doc && CLUB.att.doc !== CLUB.attMonth) for (const d of attDays(CLUB.att.doc, me)) out.add(d); return [...out]; }
function ymShift(ym, n) { const d = new Date(+ym.slice(0, 4), +ym.slice(5) - 1 + n, 1); return d.getFullYear() + "-" + pad(d.getMonth() + 1); }
function monthTitle(ym) { return MON[+ym.slice(5) - 1] + " " + ym.slice(0, 4); }
function progCounts() {
  const sess = S.log.items; const subs = sess.reduce((a, s) => a + ((s.subs || []).length), 0);
  return { sess: sess.length, drills: S.body.items.filter((x) => x.cat === "drill").length, checkins: checkinDays().length, rolls: S.rolls.items.length, mine: mineList().length, subs, weeks: streaks().weeks, shared: S.settings.shared || S.settings.sharedWk ? 1 : 0 };
}
/* [id, icon, title, requirement, xp, counter, target] */
const ACHIEVEMENTS = [
  ["s1", "🥋", "First session", "Log your first training", 20, "sess", 1], ["s10", "📘", "10 sessions", "Log 10 trainings", 50, "sess", 10], ["s50", "📗", "50 sessions", "Log 50 trainings", 150, "sess", 50], ["s100", "🏆", "100 sessions", "Log 100 trainings", 300, "sess", 100],
  ["w4", "🔥", "4-week streak", "Train 4 weeks in a row", 80, "weeks", 4], ["w12", "🌋", "12-week streak", "Train 12 weeks in a row", 200, "weeks", 12],
  ["m10", "⭐", "10 in Mine", "Keep 10 techniques in Mine", 40, "mine", 10], ["m25", "🌟", "25 in Mine", "Keep 25 techniques in Mine", 80, "mine", 25], ["m50", "💫", "50 in Mine", "Keep 50 techniques in Mine", 150, "mine", 50],
  ["r10", "🔄", "10 rolls", "Log 10 rolls", 40, "rolls", 10], ["r50", "🌀", "50 rolls", "Log 50 rolls", 120, "rolls", 50],
  ["sub25", "🎯", "25 submissions", "Finish 25 submissions in training", 100, "subs", 25],
  ["d20", "🔁", "20 drills", "Do 20 drills", 60, "drills", 20], ["c10", "✅", "10 check-ins", "Check in to 10 classes", 60, "checkins", 10],
  ["sh1", "📸", "First share", "Share a session", 20, "shared", 1],
];
function achievements(c) { c = c || progCounts(); return ACHIEVEMENTS.map((a) => ({ id: a[0], ic: a[1], t: a[2], req: a[3], xp: a[4], have: c[a[5]] || 0, n: a[6], on: (c[a[5]] || 0) >= a[6] })); }
/* [id, icon, title, subtitle, target, xp, counter(wk, weekEnd) · the first three can be scored for past weeks too, the rest only for the current week] */
const CHALLENGES = [
  ["train", "🥋", "Train 3 times", "Sessions this week", 3, 30, (wk, we) => S.log.items.filter((s) => s.d >= wk && s.d < we).length],
  ["rounds", "⏱️", "10 sparring rounds", "Rounds across your sessions", 10, 30, (wk, we) => S.log.items.filter((s) => s.d >= wk && s.d < we).reduce((a, s) => a + (+s.rolls || 0), 0)],
  ["drills", "🔁", "Do 2 drills", "Any drill from the library", 2, 20, (wk, we) => S.body.items.filter((x) => x.cat === "drill" && x.d >= wk && x.d < we).length],
  ["checkin", "✅", "Check in to 2 classes", "Scan the club QR at the door", 2, 20, (wk, we) => checkinDays().filter((d) => d >= wk && d < we).length, "club"],
  ["mine", "⭐", "Add 3 techniques to Mine", "Save moves you want to keep", 3, 15, (wk) => { const m = S.settings.mineWeek; if (!m || m.wk !== wk) { S.settings.mineWeek = { wk, n: mineList().length }; save("settings"); } return Math.max(0, mineList().length - S.settings.mineWeek.n); }],
  ["share", "📸", "Share a session", "Post your training card", 1, 15, (wk) => (S.settings.sharedWk === wk ? 1 : 0)],
];
function weekChallenges(wk) { const we = addDays(wk, 7); return CHALLENGES.filter((c) => c[7] !== "club" || CLUB.id).map((c) => { const have = Math.min(c[4], c[6](wk, we)); return { id: c[0], ic: c[1], t: c[2], s: c[3], n: c[4], xp: c[5], have, on: have >= c[4] }; }); }
function challengeXp() {
  const wk = mondayOf(todayIso()); let xp = weekChallenges(wk).filter((c) => c.on).reduce((a, c) => a + c.xp, 0);
  const days = S.log.items.map((s) => s.d).concat(S.body.items.filter((x) => x.cat === "drill").map((x) => x.d)).filter(Boolean); if (!days.length) return xp;
  let w = mondayOf(days.reduce((a, d) => (d < a ? d : a))); for (let i = 0; i < 520 && w < wk; i++, w = addDays(w, 7)) { const we = addDays(w, 7); for (const c of CHALLENGES.slice(0, 3)) if (c[6](w, we) >= c[4]) xp += c[5]; }
  return xp;
}
function shareMark() { S.settings.sharedWk = mondayOf(todayIso()); S.settings.shared = 1; save("settings"); }
function xpTotal(c) { c = c || progCounts(); return c.sess * 20 + c.drills * 10 + c.checkins * 10 + c.rolls * 5 + c.mine * 5 + achievements(c).filter((a) => a.on).reduce((s, a) => s + a.xp, 0) + challengeXp(); }
function levelOf(xp) { return Math.floor(xp / XP_LEVEL) + 1; }
function xpCard() { const xp = xpTotal(); const lv = levelOf(xp); const into = xp - (lv - 1) * XP_LEVEL; return '<div class="xp"><div class="xprow"><b>Level ' + lv + '</b><span>' + xp + ' XP</span></div><div class="pbar"><i style="width:' + Math.round((into / XP_LEVEL) * 100) + '%"></i></div><p class="muted small">' + (XP_LEVEL - into) + " XP to level " + (lv + 1) + "</p></div>"; }
function pbar(have, n) { return '<div class="pbar"><i style="width:' + Math.round((Math.min(have, n) / Math.max(1, n)) * 100) + '%"></i></div>'; }
function progCalendar(ym) {
  const days = trainedDays(); const today = todayIso(); const y = +ym.slice(0, 4), mo = +ym.slice(5); const lead = (new Date(y, mo - 1, 1).getDay() + 6) % 7; const dim = new Date(y, mo, 0).getDate();
  let cells = ""; for (let i = 0; i < lead; i++) cells += "<i></i>"; let n = 0;
  for (let d = 1; d <= dim; d++) { const iso = ym + "-" + pad(d); const on = days.has(iso); if (on) n++; cells += '<b class="' + (on ? "on" : "") + (iso === today ? " today" : "") + '">' + d + "</b>"; }
  return { html: '<div class="cal"><div class="dow">' + DAYS.map((x) => "<span>" + x[0] + "</span>").join("") + '</div><div class="grid">' + cells + "</div></div>", n, dim };
}
VIEWS.prog = function () {
  const today = todayIso(); const wk = mondayOf(today); let h = "";
  // training calendar
  const ym = UI.calYm || today.slice(0, 7); const cal = progCalendar(ym);
  h += '<div class="card"><div class="card-head"><h3>Training calendar</h3></div><div class="calnav"><button class="icon-btn" data-act="cal-nav" data-v="-1" aria-label="Previous month">‹</button><b>' + monthTitle(ym) + '</b><button class="icon-btn" data-act="cal-nav" data-v="1" aria-label="Next month"' + (ym >= today.slice(0, 7) ? " disabled" : "") + ">›</button></div>" + cal.html + '<p class="muted small">Trained ' + cal.n + " out of " + cal.dim + " days</p></div>";
  // analytics
  const r = UI.anaRange || "month"; const from = r === "month" ? today.slice(0, 7) + "-01" : r === "30" ? addDays(today, -29) : "";
  const sess = S.log.items.filter((s) => s.d >= from); const subs = sess.reduce((a, s) => a + A.count(s.subs), 0), taps = sess.reduce((a, s) => a + A.count(s.taps), 0), min = sess.reduce((a, s) => a + (+s.min || 0), 0), rounds = sess.reduce((a, s) => a + (+s.rolls || 0), 0);
  const tech = new Set(); for (const s of sess) for (const t of s.tech || []) tech.add(t.n || t.id || t);
  h += '<div class="card"><h3>Analytics</h3>' + seg([["month", "This month"], ["30", "Last 30 days"], ["all", "All time"]], r, "anarange") +
    '<div class="summary four"><div class="stat"><b>' + subs + '</b><span>submissions</span></div><div class="stat"><b>' + taps + '</b><span>taps</span></div><div class="stat"><b>' + sess.length + '</b><span>sessions</span></div><div class="stat"><b>' + tech.size + '</b><span>techniques</span></div></div>' +
    '<div class="summary two"><div class="stat"><b>' + hoursFmt(min) + '</b><span>hours trained</span></div><div class="stat"><b>' + rounds + '</b><span>rounds</span></div></div></div>';
  // weekly challenges
  const ch = weekChallenges(wk); const done = ch.filter((c) => c.on).length;
  h += '<div class="card"><div class="card-head"><h3>Weekly challenges</h3><span class="muted small"><span>' + done + " / " + ch.length + " completed</span> · <span>" + Math.round((done / Math.max(1, ch.length)) * 100) + "%</span></span></div><div class=\"chals\">" +
    ch.map((c) => '<div class="chal' + (c.on ? " done" : "") + '"><div class="chrow"><span class="chic">' + c.ic + '</span><span class="chxp">+' + c.xp + ' XP</span></div><b>' + c.t + "</b><small>" + c.s + "</small>" + pbar(c.have, c.n) + '<div class="chfoot"><span>' + c.have + " / " + c.n + "</span>" + (c.on ? '<span class="pill ok">Done</span>' : "") + "</div></div>").join("") + "</div></div>";
  // achievements
  const ac = achievements(); const got = ac.filter((a) => a.on).length;
  h += '<div class="card"><div class="card-head"><h3>Achievements</h3><span class="muted small"><span>' + got + " / " + ac.length + " unlocked</span> · <span>" + Math.round((got / ac.length) * 100) + '%</span></span></div><div class="list">' +
    ac.map((a) => '<div class="row ach' + (a.on ? "" : " locked") + '"><span class="achic">' + a.ic + '</span><div class="txt"><b>' + a.t + "</b><small>" + a.req + "</small></div><span class=\"pill " + (a.on ? "ok" : "na") + '">+' + a.xp + " XP</span></div>").join("") + "</div></div>";
  return h;
};
/* You: profile header (avatar, club, belt, membership) + totals, then the personal sections. */
function profileHead() {
  const name = myName(); const b = beltDef(S.belt.track, S.belt.belt); const items = S.log.items; const totalMin = items.reduce((a, x) => a + (+x.min || 0), 0); const sk = streaks();
  const ms = CLUB.id && !clubNeeds() ? membership(myUid()) : null;
  return '<div class="card profile"><div class="prow">' + avatarHtml(name, S.settings.avatar) + '<div class="pinfo"><h2>' + esc(name) + '</h2><p class="muted small">' + (CLUB.profile ? esc(CLUB.profile.n) + " · " : "") + esc(b.n) + " belt" + (S.belt.stripes ? " · " + S.belt.stripes + " stripes" : "") + "</p></div>" +
    (ms && ms.state !== "none" ? '<span class="pill ' + (ms.state === "active" ? "ok" : "bad") + '">' + (ms.coach ? "Coach · Active" : ms.state === "active" ? "Active" : "Expired") + "</span>" : "") + "</div>" +
    '<div class="summary"><div class="stat"><b>' + items.length + '</b><span>sessions</span></div><div class="stat"><b>' + hoursFmt(totalMin) + '</b><span>hours</span></div><div class="stat"><b>' + sk.weeks + '</b><span>week streak</span></div></div>' + xpCard() + "</div>";
}
VIEWS.me = function () { const v = UI.seg.me || "prog"; const map = { prog: VIEWS.prog, log: VIEWS.log, drills: vDrills, body: VIEWS.body, belt: VIEWS.belt, weight: VIEWS.weight, comp: VIEWS.comp }; return profileHead() + seg(SEGS.me, v, "segview", true) + (map[v] || VIEWS.prog)(); };

/* ======================= HOME (club feed) ======================= */
/* club/<id>/feed/<yyyy-mm> = { list: [post] } · one post per saved training: who, when, type, minutes, rounds, techniques, roll path, streak, kudos. */
function memName(k) { const m = ((CLUB.members && CLUB.members.list) || []).find((x) => attKey(x) === k); return m ? m.n || m.email || "Member" : "Someone"; }
function feedPostOf(rec) {
  const roll = S.rolls.items.filter((r) => r.d === rec.d).sort((a, b) => (a.id < b.id ? 1 : -1))[0];
  return { id: rec.id, uid: myUid(), n: "@" + myHandle(), av: S.settings.avatar || "", belt: S.belt.belt, d: rec.d, type: rec.type, min: +rec.min || 0, rounds: +rec.rolls || 0, tech: (rec.tech || []).slice(0, 5).map((t) => t.n || t), subs: A.count(rec.subs), good: rec.good || "", with: [], weeks: streaks().weeks, path: roll ? roll.steps.filter((x) => x.k !== "fin" && x.id !== "finish").map((x) => x.n).slice(0, 8) : [], kudos: [], t: Date.now() };
}
const FEED = { club: null, raw: new Map(), cursor: null, done: false, busy: false, ready: false, error: false, generation: 0, observer: null };
function feedReset(club) { if (FEED.observer) FEED.observer.disconnect(); Object.assign(FEED, { club, raw: new Map(), cursor: null, done: false, busy: false, ready: false, error: false, generation: FEED.generation + 1 }); CLUB.feed = []; }
function feedMerged() { return [...FEED.raw.values()].sort(window.ARROW_FEED.compare); }
function feedCache(ym, doc) {
  CLUB.feedDocs = CLUB.feedDocs || {}; CLUB.feedDocs[ym] = doc;
  const posts = new Map((doc.list || []).map(p => [p.id, p]));
  for (const [id, post] of FEED.raw) if (String(post.d).slice(0, 7) === ym) { if (posts.has(id)) FEED.raw.set(id, posts.get(id)); else FEED.raw.delete(id); }
  CLUB.feed = (CLUB.feed || []).filter(p => FEED.raw.has(p.id)).map(p => Object.assign({}, p, { kudos: (FEED.raw.get(p.id).kudos || []) }));
}
async function feedPost(rec) {
  if (!CLUB.id) return; const ym = rec.d.slice(0, 7); const doc = (await cget("club/" + CLUB.id + "/feed/" + ym)) || { list: [] };
  const old = doc.list.find((x) => x.id === rec.id); const p = feedPostOf(rec); if (old) { p.kudos = old.kudos || []; p.t = old.t || p.t; }
  doc.list = doc.list.filter((x) => x.id !== rec.id); doc.list.push(p); if (doc.list.length > 400) doc.list = doc.list.slice(-400);
  await cset("club/" + CLUB.id + "/feed/" + ym, doc); feedCache(ym, doc); if (UI.tab === "home") render();
}
async function feedRemove(id, d) {
  if (!CLUB.id || !d) return; const ym = d.slice(0, 7); const doc = await cget("club/" + CLUB.id + "/feed/" + ym); if (!doc) return;
  doc.list = (doc.list || []).filter((x) => x.id !== id); await cset("club/" + CLUB.id + "/feed/" + ym, doc); feedCache(ym, doc); await decryptFeed(); if(UI.tab === "home")render();
}
async function feedKudos(id, d) {
  if (!CLUB.id) { toast("Join a club to give Oss"); return; } const ym = d.slice(0, 7); const doc = (await cget("club/" + CLUB.id + "/feed/" + ym)) || { list: [] }; const p = doc.list.find((x) => x.id === id); if (!p) return;
  p.kudos = p.kudos || []; const me = myUid(); const i = p.kudos.indexOf(me); if (i >= 0) p.kudos.splice(i, 1); else p.kudos.push(me);
  await cset("club/" + CLUB.id + "/feed/" + ym, doc); feedCache(ym, doc); render();
}
function weekCard() {
  const today = todayIso(), wk = mondayOf(today); const days = trainedDays(); const items = S.log.items.filter((s) => s.d >= wk); const min = items.reduce((a, s) => a + (+s.min || 0), 0); const sk = streaks();
  let dots = ""; for (let i = 0; i < 7; i++) { const d = addDays(wk, i); dots += '<span class="' + (days.has(d) ? "on" : "") + (d === today ? " today" : "") + '"><i></i>' + DAYS[i][0] + "</span>"; }
  return '<div class="card week"><div class="card-head"><h3>Your week</h3>' + (sk.weeks ? '<span class="streak">🔥 ' + sk.weeks + " week streak</span>" : "") + '</div><div class="wdots">' + dots + '</div><div class="summary"><div class="stat"><b>' + items.length + '</b><span>sessions</span></div><div class="stat"><b>' + min + '</b><span>minutes</span></div><div class="stat"><b>' + items.reduce((a, s) => a + (+s.rolls || 0), 0) + "</b><span>rounds</span></div></div></div>";
}
/* ======================= LIVE TRAINING (Strava-style) =======================
   S.settings.live = { t0 (ms), type, rolls, subs:[names], taps:[names], tech:[names], good, with:[] } while a session
   runs (saved on every change, so it survives reloads), null otherwise. Finish opens sessSheet(null, prefill) and the
   share card in story format; Discard needs two taps. The clock ticks only while #live-time is on screen. */
const LIVE = { tick: null };
function liveOn() { const l = S.settings.live; return l && l.t0 ? l : null; }
function liveClear() { S.settings.live = null; save("settings"); }
function liveElapsed() { const l = liveOn(); return l ? Math.max(0, Math.floor(((l.stoppedAt||Date.now()) - l.t0) / 1000)) : 0; }
function liveTick() { const el = $("live-time"); if (!el || !liveOn()) { clearInterval(LIVE.tick); LIVE.tick = null; return; } el.textContent = fmtT(liveElapsed()); }
function fmtClock(ms) { const d = new Date(ms); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
function liveNames(list) { const out = []; for (const n of list || []) { const ex = out.find((x) => x.n === n); if (ex) ex.c++; else out.push({ n, c: 1 }); } return out; }
function liveCard() {
  const l = liveOn();
  if (!l) return '<button class="btn big wide live-start" data-act="live-start"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><span>Start training</span></button>';
  if (!LIVE.tick) LIVE.tick = setInterval(liveTick, 1000);
  const ctr = (key, label, pick) => { const list = pick ? liveNames(l[key]) : null; return '<div class="lctr"><span class="lbl">' + label + '</span><div class="lcnt"><button type="button" class="lbtn" data-act="live-dec" data-k="' + key + '" aria-label="Remove one"' + ((pick ? l[key].length : l[key]) ? "" : " disabled") + '>−</button><b>' + (pick ? l[key].length : l[key]) + '</b><button type="button" class="lbtn plus" data-act="' + (pick ? "live-pick" : "live-inc") + '" data-k="' + key + '" aria-label="Add one">+</button></div>' +
    (pick && list.length ? '<div class="lnames">' + list.map((x) => '<button type="button" class="chip on" data-act="live-rm" data-k="' + key + '" data-n="' + esc(x.n) + '" aria-label="Remove">' + esc(x.n) + (x.c > 1 ? " <b>×" + x.c + "</b>" : "") + "<i>×</i></button>").join("") + "</div>" : "") + "</div>"; };
  return '<div class="card live"><div class="card-head"><h3><i class="ldot"></i>Training in progress</h3><span class="pill ok">' + esc(SNAME[l.type] || l.type) + '</span></div><div class="ltime" id="live-time">' + fmtT(liveElapsed()) + '</div><p class="muted small lstart">Started ' + fmtClock(l.t0) + "</p>" +
    '<div class="lgrid">' + ctr("rolls", "Rounds") + ctr("subs", "Submissions", true) + ctr("taps", "Taps", true) + ctr("tech", "Techniques", true) + "</div>" +
    '<div class="actions"><button class="btn ghost' + (UI.confirm === "live" ? " danger" : "") + '" data-act="live-discard">' + (UI.confirm === "live" ? "Discard?" : "Discard") + '</button><button class="btn" style="flex:2" data-act="live-finish">Finish</button></div></div>';
}
function liveRender() { const c = document.querySelector(".card.live"); if (c && liveOn()) c.outerHTML = liveCard(); else render(); }
function liveStartSheet() {
  if (liveOn()) { render(); return; }
  const b = '<div class="training-type-field"><span class="lbl">Training type</span>' + trainingChoices("gi") + '</div>';
  openSheet("Start training", b, { state: { picks: { type: "gi" } }, saveLabel: "Start training", onSave() { S.settings.live = { t0: Date.now(), type: pickVal("type", "gi"), rolls: 0, subs: [], taps: [], tech: [], good: "", with: [] }; save("settings"); render(); return true; } });
  $('sheet').classList.add('modern-sheet','training-sheet','start-sheet');

}
function liveStep(key, d) { const l = liveOn(); if (!l) return; if (key === "rolls") l.rolls = Math.max(0, (+l.rolls || 0) + d); else if (d < 0) (l[key] = l[key] || []).pop(); if (navigator.vibrate && d > 0) navigator.vibrate(10); save("settings"); liveRender(); }
function liveAdd(key, n) { const l = liveOn(); n = String(n || "").trim(); if (!l || !n) return; (l[key] = l[key] || []).push(n); if (navigator.vibrate) navigator.vibrate(10); save("settings"); if (UI.sheet) closeSheet(); liveRender(); }
function liveRm(key, n) { const l = liveOn(); if (!l) return; const i = (l[key] || []).lastIndexOf(n); if (i >= 0) l[key].splice(i, 1); else if (n === "Unspecified") { const empty = (l[key] || []).lastIndexOf(""); if (empty >= 0) l[key].splice(empty, 1); } save("settings"); liveRender(); }
function liveRecent(key) {
  const cnt = {}; for (const s of S.log.items) for (const x of s[key] || []) cnt[x.n] = (cnt[x.n] || 0) + (+x.c || 1);
  let names = Object.entries(cnt).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
  if (names.length < 6) { const seen = new Set(names); for (const x of pkSource(key === "tech" ? "mv" : "sub").map((x) => x.n).filter((n) => !/[→›]/.test(n)).sort((a, b) => a.length - b.length)) { if (!seen.has(x)) { seen.add(x); names.push(x); } if (names.length >= 12) break; } }
  return names.slice(0, 12);
}
function livePickSheet(key) {
  if (!liveOn()) return;
  const title = key === "subs" ? "Add a submission" : key === "taps" ? "Add a tap" : "Add a technique"; const src = key === "tech" ? "mv" : "sub"; const ph = key === "subs" ? "Add a submission…" : key === "taps" ? "What caught you…" : "Search techniques…";
  const recent = liveRecent(key);
  const b = '<div class="field"><label for="pki-live-' + key + '">Name</label><input id="pki-live-' + key + '" type="text" placeholder="' + ph + '" data-pk="live-' + key + '" data-src="' + src + '" data-counts="0" autocomplete="off" autofocus><div class="sugg" id="pks-live-' + key + '" hidden></div></div>' +
    (recent.length ? '<p class="lbl">Recent</p><div class="chips">' + recent.map((n) => '<button type="button" class="chip" data-act="live-add" data-k="' + key + '" data-n="' + esc(n) + '">' + esc(n) + "</button>").join("") + "</div>" : "") + '<p class="muted small">Type a name and pick it from the list, or add it as new.</p>';
  openSheet(title, b, {});
}
function liveFinish() {
  const l = liveOn(); if (!l) return;
  l.stoppedAt=l.stoppedAt||Date.now();const stoppedAt=l.stoppedAt, elapsedSeconds=Math.max(1,Math.round(liveElapsed())), min=+(elapsedSeconds/60).toFixed(2);
  const idOf = (n) => { const q = n.toLowerCase(); const m = nodes().find((x) => x.k === "mv" && x.n.toLowerCase() === q); return m ? m.id : ""; };
  const toPk = (names) => liveNames(names).map((x) => ({ id: idOf(x.n), n: x.n, c: x.c }));
  sessSheet(null, { live: true, startedAt:l.t0, stoppedAt, elapsedSeconds, stoppedDuration:+(elapsedSeconds/60).toFixed(2), d: todayIso(), min, type: l.type, rolls: +l.rolls || 0, tech: toPk(l.tech), subs: toPk(l.subs), taps: toPk(l.taps), good: l.good || "", with: (l.with || []).slice() });
}
const FEED_TITLE = { gi: "Gi training", nogi: "No-gi training", open: "Open mat", priv: "Private lesson", drill: "Drilling session", comp: "Competition day" };
function feedCard(p) {
  const me = myUid(); const ks = p.kudos || []; const mine = ks.includes(me); const tn = FEED_TITLE[p.type] || "Training";
  let h = '<article class="card feed" data-post-id="' + esc(p.id) + '"><div class="prow">' + avatarHtml(p.n, p.av || memAv(p.uid), "sm", 'data-act="member-profile" data-uid="' + esc(p.uid || "") + '" aria-label="Open profile"') + '<div class="pinfo"><b>' + esc(p.n || "Member") + '</b><p class="muted small">' + postTime(p) + "</p></div>" + (p.weeks > 1 ? '<span class="streak" title="Week streak">🔥 ' + p.weeks + "</span>" : "") + "</div>";
  h += '<div class="post-title"><h3>' + esc(tn) + "</h3>" + postAudience(p) + "</div>" + (p.good ? '<p class="small">' + esc(p.good) + "</p>" : "");
  h += '<div class="summary"><div class="stat"><b>' + (+p.min || 0) + '</b><span>minutes</span></div><div class="stat"><b>' + (+p.rounds || 0) + '</b><span>rounds</span></div><div class="stat"><b>' + ((p.tech && p.tech.length) || 0) + "</b><span>techniques</span></div></div>";
  if (p.path && p.path.length) h += '<div class="fpath">' + p.path.map((n) => "<span>" + esc(n) + "</span>").join("<i>›</i>") + "</div>";
  if (p.with && p.with.length) h += '<p class="muted small">Rolled with · ' + p.with.map(esc).join(", ") + "</p>";
  h += '<div class="kudos"><button class="kbtn' + (mine ? " on" : "") + '" data-act="kudos" data-id="' + esc(p.id) + '" data-d="' + esc(p.d) + '"' + (p.uid === me ? " disabled" : "") + '><i>👊</i> ' + (mine ? "Oss given" : "Oss!") + '</button><span class="muted small">' + ks.length + " Oss</span></div></article>";
  return h;
}
/* Leaderboard: CLUB.feed aggregated per member. UI.leadBy = metric, UI.leadPer = month | all (this and last month, everything loaded). */
UI.homeSeg = "feed"; UI.leadBy = "sessions"; UI.leadPer = "month";
const LEAD_BY = [["sessions", "Sessions", "sessions"], ["min", "Minutes", "minutes"], ["rounds", "Rounds", "rounds"], ["subs", "Submissions", "submissions"], ["kudos", "Oss", "Oss"], ["streak", "Streak", "weeks"]];
function leadRows() {
  const by = UI.leadBy, mo = thisMonth(); const posts = (CLUB.feed || []).filter((p) => p.uid && (UI.leadPer === "all" || String(p.d || "").startsWith(mo)));
  const M = {}; const later = (p, r) => !r.d || p.d > r.d || (p.d === r.d && (p.t || 0) > (r.t || 0));
  for (const p of posts) {
    const r = M[p.uid] || (M[p.uid] = { uid: p.uid, n: "", belt: "", av: "", v: 0, d: "", t: 0 });
    if (by === "streak") { if (later(p, r)) r.v = +p.weeks || 0; } else r.v += by === "sessions" ? 1 : by === "kudos" ? (p.kudos || []).length : +p[by] || 0;
    if (later(p, r)) { r.d = p.d; r.t = p.t || 0; if (p.n) r.n = p.n; if (p.belt) r.belt = p.belt; if (p.av) r.av = p.av; }
  }
  const mem = (CLUB.members && CLUB.members.list) || [];
  const rows = Object.values(M).map((r) => { const m = mem.find((x) => x.uid === r.uid); if (m) { if (!r.n) r.n = m.n || ""; if (!r.belt) r.belt = m.belt || ""; if (m.av) r.av = m.av; } r.n = r.n || "Member"; return r; });
  rows.sort((a, b) => b.v - a.v || a.n.localeCompare(b.n)); let rank = 0;
  rows.forEach((r, i) => { if (!i || r.v !== rows[i - 1].v) rank = i + 1; r.rank = rank; });
  return rows;
}
function leadRow(r, me, unit) {
  const b = r.belt ? beltDef("adult", r.belt) : null; const cls = r.rank <= 3 ? " r" + r.rank : "";
  return '<div class="lrow' + (r.uid === me ? " me" : "") + '"><span class="rank' + cls + '">' + r.rank + '</span>' + avatarHtml(r.n, r.av, "sm", 'data-act="member-profile" data-uid="' + esc(r.uid) + '" aria-label="Open profile"') + '<div class="txt"><b>' + esc(r.n) + "</b>" + (b ? '<span class="bsw" title="' + esc(b.n) + '">' + beltSwatch(b) + "</span>" : "") + '</div><span class="val"><b>' + r.v + "</b><small>" + unit + "</small></span></div>";
}
function vLeaderboard() {
  if (!CLUB.id) return '<div class="card"><h3>Club leaderboard</h3><p class="small muted">Join your club to see who trains the most: sessions, minutes, rounds, submissions, Oss and streaks.</p><button class="btn wide" data-act="tab" data-v="club">Find my club</button></div>';
  const rows = leadRows(); const me = myUid(); const mine = rows.find((r) => r.uid === me); const unit = (LEAD_BY.find((x) => x[0] === UI.leadBy) || LEAD_BY[0])[2];
  let h = '<div class="card lead"><div class="chips">' + LEAD_BY.map((x) => '<button type="button" class="chip' + (UI.leadBy === x[0] ? " on" : "") + '" data-act="leadby" data-v="' + x[0] + '">' + x[1] + "</button>").join("") + "</div>" + seg([["month", "This month"], ["all", "2 months"]], UI.leadPer, "leadper") + "</div>";
  h += '<div class="card yrank"><span class="lbl">Your rank</span>' + (mine ? '<div class="yr"><b class="rk' + (mine.rank <= 3 ? " r" + mine.rank : "") + '">#' + mine.rank + '</b><div class="stat"><b>' + mine.v + "</b><span>" + unit + '</span></div><span class="muted small of">out of ' + rows.length + " teammates</span></div>" : '<p class="muted small" style="margin-top:4px">Not ranked yet · log a training to appear</p>') + "</div>";
  h += '<div class="card"><h3>' + esc(CLUB.profile ? CLUB.profile.n : "Club") + "</h3>" + (rows.length ? '<div class="llist">' + rows.map((r) => leadRow(r, me, unit)).join("") + "</div>" : '<p class="empty">No training in the club for this period yet.</p>') + "</div>";
  return h;
}
VIEWS.home = function () {
  let h = liveOn() ? liveCard() + weekCard() : weekCard() + liveCard();
  if (S.settings.clubId && clubNeeds()) { if (!CLUB.busy) clubLoad(); return h + '<div class="card"><p class="empty"></p></div>'; }
  h += seg([["feed", "Feed"], ["lead", "Leaderboard"]], UI.homeSeg, "homeseg");
  if (UI.homeSeg === "lead") return h + vLeaderboard();
  const posts = CLUB.id ? CLUB.feed || [] : sessionsSorted().slice(0, 20).map(feedPostOf);
  if (!posts.length) h += '<div class="card"><p class="empty">' + (CLUB.id ? "No training in the club yet. Log the first one!" : "Join a club to see your teammates' training here.") + "</p>" + (CLUB.id ? '<button class="btn wide" data-act="add-sess">+ Log training</button>' : '<button class="btn wide" data-act="tab" data-v="club">Find my club</button>') + "</div>";
  else h += posts.slice(0, 40).map(feedCard).join("");
  return h;
};
/* Record: the orange button in the middle of the tab bar. */
function recordSheet() {
  const opt = (v, ic, t, sub) => '<button class="rec-opt" data-act="rec-go" data-v="' + v + '"><span class="ric">' + ic + "</span><span><b>" + t + "</b><small>" + sub + "</small></span></button>";
  const b = '<div class="reclist">' + opt("sess", "📝", "Log training", "Time, rounds, techniques, partners") + opt("roll", "🥋", "Start a roll", "Pick a position and roll on the graph") +
    opt("att", "✅", "Check in", "Scan the club QR or type the club code") + opt("drill", "🔁", "Do a drill", "Solo and partner drills") + (S.log.items.length ? opt("share", "📸", "Share the last session", "Photo, stats, roll path and streak") : "") + "</div>";
  openSheet("Record", b, {});
}

/* ======================= CLUB ======================= */
/* Shared docs: clubs/index, club/<id>/profile, club/<id>/members, club/<id>/pay/<uid>. Local mode keeps them in localStorage. */
const CLUB = { id: null, profile: null, members: null, pay: {}, index: null, busy: false, err: "" };
const CLKEY = "bjj-club-local";
function clocal() { try { return JSON.parse(localStorage.getItem(CLKEY) || "{}"); } catch (e) { return {}; } }
async function cget(path) { if (mode === "cloud") return SB.get(path); return clocal()[path] || null; }
async function cset(path, data) { if (mode === "cloud") return SB.set(path, data); const m = clocal(); m[path] = data; localStorage.setItem(CLKEY, JSON.stringify(m)); }
async function clist(prefix) { if (mode === "cloud") return SB.list(prefix); const m = clocal(); return Object.keys(m).filter((k) => k.startsWith(prefix)).map((k) => ({ path: k, data: m[k] })); }
function myUid() { return mode === "cloud" ? SB.uid() : "local"; }
function myName() { return S.settings.name || (SB.session && (SB.session.name || SB.session.email)) || "Me"; }
function isAdmin() { return !!(CLUB.profile && (CLUB.profile.admins || []).includes(myUid())); }
function isSuper() { const em = mode === "cloud" ? (SB.session && SB.session.email || "").toLowerCase() : "local"; const list = (CFG.admins || []).concat((CLUB.app && CLUB.app.admins) || []).map((x) => String(x).toLowerCase()); return mode === "local" || list.includes(em); }
function genCode(n) { const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < n; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }
function proUntil() { const p = CLUB.pro && CLUB.pro.u && CLUB.pro.u[myUid()]; return p ? p.until : ""; }
function memberPaid() { return CLUB.id && paidThisMonth(myUid()); }
function unlocked() { return isSuper() || isAdmin() || (proUntil() && proUntil() >= thisMonth()) || memberPaid(); }
function lockCard(what) {
  return '<div class="card lock"><h3>' + esc(what) + ' is part of the full app</h3><p class="small">Everything on the mat stays free: the roll graph, your technique library and the training log. Setups, routes, Learn, game plans and roll history open when your club membership for this month is confirmed by your coach, or with an upgrade.</p>' +
    '<div class="actions">' + (CLUB.id ? '<button class="btn" data-act="tab" data-v="club">Pay my club</button>' : '<button class="btn" data-act="tab" data-v="club">Join club</button>') + '<button class="btn ghost" data-act="upgrade">Upgrade</button></div>' + (proUntil() ? '<p class="muted small">Upgraded until ' + esc(proUntil()) + ".</p>" : "") + "</div>";
}
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const KIND = { gi: "Gi", nogi: "No-gi", open: "Open mat", kids: "Kids", comp: "Comp class", sc: "S&C" };
function thisMonth() { return todayIso().slice(0, 7); }
async function clubLoad() {
  const id = S.settings.clubId; CLUB.busy = true; CLUB.err = "";
  try {
    CLUB.app = (await cget("app/config")) || { admins: [], pay: {}, pro: {} }; CLUB.pro = (await cget("app/pro")) || { u: {} };
    let idx = await cget("clubs/index");
    if (!idx || !idx.seeded) { idx = idx || { list: [] }; for (const c of SEED.clubs || []) { if (idx.list.some((x) => x.id === c.id)) continue; const prof = Object.assign({ admins: [], schedule: [], status: "approved", seed: true, open: true, code: genCode(6), coachCode: genCode(8), fee: { month: 0, drop: 0 }, created: todayIso() }, c); if (!(await cget("club/" + c.id + "/profile"))) await cset("club/" + c.id + "/profile", prof); idx.list.push({ id: c.id, n: c.n, city: c.city, status: "approved", open: true }); } idx.seeded = true; await cset("clubs/index", idx); }
    CLUB.index = idx;
    if (isSuper()) { CLUB.upgrades = (await cget("app/upgrades")) || { list: [] }; CLUB.pending = []; for (const row of idx.list.filter((x) => x.status === "pending")) { const p = await cget("club/" + row.id + "/profile"); if (p) CLUB.pending.push(p); } }
    if (!id) { CLUB.id = null; CLUB.profile = null; CLUB.members = null; CLUB.pay = {}; CLUB.feed = null; CLUB.feedDocs = {}; }
    else {
      CLUB.profile = await cget("club/" + id + "/profile");
      if (!CLUB.profile) { S.settings.clubId = ""; save("settings"); CLUB.id = null; CLUB.index = (await cget("clubs/index")) || { list: [] }; }
      else { CLUB.id = id; CLUB.members = (await cget("club/" + id + "/members")) || { list: [] }; CLUB.pay = {}; const rows = await clist("club/" + id + "/pay/"); for (const r of rows) CLUB.pay[r.path.split("/").pop()] = r.data;
        if(CLUB.members.removed?.[myUid()]&&!CLUB.members.list.some(m=>m.uid===myUid())){S.settings.clubId="";save("settings");CLUB.id=null;CLUB.profile=null;toast("Your club membership was removed");} CLUB.attMonth = (await cget("club/" + id + "/att/" + thisMonth())) || { days: {} }; CLUB.rolls = (await cget("club/" + id + "/rolls/" + thisMonth())) || { list: [] }; CLUB.att = { ym: thisMonth(), doc: CLUB.attMonth }; CLUB.results = (await cget("club/" + id + "/results")) || { list: [] }; CLUB.notes = (await cget("club/" + id + "/notes")) || { list: [] }; CLUB.events = (await cget("club/" + id + "/events")) || { list: [] }; CLUB.feedDocs = CLUB.feedDocs || {}; }
    }
  } catch (e) { CLUB.err = "Could not load the club"; console.warn(e); }
  CLUB.busy = false; CLUB.loadedFor = S.settings.clubId || "-"; if (["club","home","me","tech"].includes(UI.tab)) render();
}
function clubNeeds() { return CLUB.loadedFor !== (S.settings.clubId || "-"); }
async function clubUpdateMe() {
  if (!CLUB.id || !CLUB.members) return; const me = myUid(); const email = (SB.session && SB.session.email || "").toLowerCase(); let m = CLUB.members.list.find((x) => x.uid === me);
  if (!m && email) { m = CLUB.members.list.find((x) => !x.uid && (x.email || "").toLowerCase() === email); if (m) m.uid = me; }
  if (!m) { m = { id: uid(), uid: me, since: todayIso() }; CLUB.members.list.push(m); }
  if (!m.id) m.id = uid();
  if (m.coachSet || !isAdmin()) { // only a coach may assign belts
    if (m.belt) S.belt.belt = m.belt; S.belt.stripes = +m.stripes || 0; if (m.track) S.belt.track = m.track; if (m.beltSince) S.belt.since = m.beltSince; S.belt.byCoach = true; save("belt");
  } else { m.belt = S.belt.belt; m.stripes = S.belt.stripes; m.track = S.belt.track; }
  if (!m.coachSet || !m.n) m.n = myName(); m.av = S.settings.avatar || ""; m.email = SB.session ? SB.session.email : (m.email || "");
  await cset("club/" + CLUB.id + "/members", CLUB.members);
}
function memberSheet(id) {
  const m = id ? CLUB.members.list.find((x) => x.id === id || x.uid === id) : null; const track = m && m.track || "adult";
  const b = field("m-n", "Name", inp("m-n", m ? m.n || "" : "", "text", 'autofocus placeholder="Full name"')) + '<div class="grid2">' + field("m-email", "Email (links their account)", inp("m-email", m ? m.email || "" : "", "email")) + field("m-phone", "Phone", inp("m-phone", m ? m.phone || "" : "", "tel")) + "</div>" +
    '<div class="field"><span class="lbl">Age group</span>' + chips("track", [["kids", "Kids 4–15"], ["adult", "Adult 16+"]], track) + "</div>" + field("m-belt", "Belt", '<select id="f-belt">' + SEED.belts[track].map((x) => '<option value="' + x.id + '"' + (m && m.belt === x.id ? " selected" : "") + ">" + esc(x.n) + "</option>").join("") + "</select>") +
    '<div class="grid2"><div class="field"><span class="lbl">Stripes</span>' + scale("stripes", m ? +m.stripes || 0 : 0, 0, 4) + "</div>" + field("m-since", "Belt since", inp("m-since", m ? m.beltSince || "" : "", "date")) + "</div>" + field("m-joined", "Member since", inp("m-joined", m ? m.since || todayIso() : todayIso(), "date")) +
    '<div class="field"><span class="lbl">Competition team</span>' + chips("comp", [["no", "No"], ["yes", "Yes"]], m && m.comp ? "yes" : "no") + "</div>" +
    (m && m.uid ? '<p class="muted small">Login: ' + esc(loginName(m.email)) + "</p>" : (mode === "cloud" ? '<p class="lbl" style="margin-top:4px">Create their login (optional)</p><div class="grid2">' + field("m-login", "Username", inp("m-login", "", "text", 'autocapitalize="none" placeholder="bat"')) + field("m-pw", "Password (6+)", inp("m-pw", "", "text", 'autocomplete="new-password"')) + "</div>" + field("m-dob", "Date of birth (private)", inp("m-dob", "", "date", 'max="' + todayIso() + '"')) : ""));
  openSheet(m ? "Edit member" : "Add a member", b, { state: { picks: { track, stripes: m ? +m.stripes || 0 : 0, comp: m && m.comp ? "yes" : "no" } }, onDelete: m ? async () => { CLUB.members.list = CLUB.members.list.filter((x) => x !== m); await cset("club/" + CLUB.id + "/members", CLUB.members); render(); return true; } : null, async onSave() {
    const n = sv("m-n").trim(); if (!n) { $("m-n").focus(); return false; }
    const rec = m || { id: uid(), uid: null }; rec.n = n; rec.email = sv("m-email").trim(); const phone = sv("m-phone").trim(); if (phone) { const old = await A.openPayload(rec.privateProfile,myUid(),((S.settings.coachAgeKeys||{})[CLUB.id]||{}).privateKey)||{}; rec.privateProfile = await A.sealPayload(Object.assign(old,{phone}),coachPublicKeys()); } delete rec.phone; rec.track = pickVal("track", "adult"); rec.belt = sv("f-belt"); rec.stripes = +pickVal("stripes", 0); rec.beltSince = sv("m-since"); rec.since = sv("m-joined") || todayIso(); rec.comp = pickVal("comp", "no") === "yes"; rec.coachSet = true; rec.setBy = myUid();
    const login = sv("m-login").trim(), pw = sv("m-pw"); if (!(m && m.uid) && login && mode === "cloud") { if (pw.length < 6) { toast("Password needs 6+ characters"); return false; } try { rec.email = emailOf(login); const dob = sv("m-dob"); if (A.age(dob) === null || !A.validUsername(login)) { toast("Enter a valid username and date of birth"); return false; } const u = await SB.createUser(rec.email, pw, n, dob, A.username(login)); rec.uid = u.id; rec.username = A.username(login); rec.socialAllowed = A.age(dob) >= 13; await sealMemberAge(rec, dob); } catch (e) { toast("Could not create the login: " + e.message); return false; } }
    if (!m) CLUB.members.list.push(rec); await cset("club/" + CLUB.id + "/members", CLUB.members); await readPrivateProfiles(); toast(m ? "Saved" : "Member added · they sign up with this email and the club code"); if (rec.uid === myUid()) { S.belt.belt = rec.belt; S.belt.stripes = rec.stripes; S.belt.track = rec.track; S.belt.byCoach = true; save("belt"); } render(); return true;
  } });
}
/* attendance: club/<id>/att/<yyyy-mm> = { days: { "2026-10-06": [uid, …] } } */
function attKey(m) { return m.uid || m.id; }
async function attMark(date, on, who) {
  if (!CLUB.id) return; const ym = date.slice(0, 7); who = who || myUid();
  if (!CLUB.att || CLUB.att.ym !== ym) CLUB.att = { ym, doc: (await cget("club/" + CLUB.id + "/att/" + ym)) || { days: {} } };
  const d = CLUB.att.doc.days; d[date] = d[date] || []; const i = d[date].indexOf(who); if (on && i < 0) d[date].push(who); if (!on && i >= 0) d[date].splice(i, 1); if (!d[date].length) delete d[date];
  await cset("club/" + CLUB.id + "/att/" + ym, CLUB.att.doc); if (ym === thisMonth()) CLUB.attMonth = CLUB.att.doc;
}
function attDays(doc, who) { const out = []; for (const d in (doc && doc.days) || {}) if (doc.days[d].includes(who)) out.push(d); return out.sort(); }
function classDays(ym) { const sched = mySchedule(); const days = new Set(sched.map((x) => x.d)); const y = +ym.slice(0, 4), mo = +ym.slice(5); const out = []; for (let d = 1; d <= 31; d++) { const dt = new Date(y, mo - 1, d); if (dt.getMonth() !== mo - 1) break; if (days.has((dt.getDay() + 6) % 7)) out.push(ym + "-" + pad(d)); } return out; }
function attCalendar(who, ym) {
  const doc = ym === thisMonth() ? CLUB.attMonth : (CLUB.att && CLUB.att.ym === ym ? CLUB.att.doc : null); const went = new Set(attDays(doc, who)); const cls = new Set(classDays(ym)); const today = todayIso();
  const y = +ym.slice(0, 4), mo = +ym.slice(5); const first = new Date(y, mo - 1, 1); const lead = (first.getDay() + 6) % 7; let cells = ""; for (let i = 0; i < lead; i++) cells += "<i></i>";
  let n = 0, missed = 0; for (let d = 1; d <= 31; d++) { const dt = new Date(y, mo - 1, d); if (dt.getMonth() !== mo - 1) break; const iso = ym + "-" + pad(d); let c = ""; if (went.has(iso)) { c = "on"; n++; } else if (cls.has(iso) && iso < today) { c = "miss"; missed++; } else if (cls.has(iso)) c = "cls"; cells += '<b class="' + c + (iso === today ? " today" : "") + '">' + d + "</b>"; }
  return { html: '<div class="cal"><div class="dow">' + DAYS.map((x) => "<span>" + x[0] + "</span>").join("") + '</div><div class="grid">' + cells + "</div></div>", n, missed };
}
async function clubJoin(id, code, asCoach) {
  const p = await cget("club/" + id + "/profile"); if (!p) { toast("Club not found"); return; }
  if (asCoach) { if ((code || "").trim().toUpperCase() !== p.coachCode) { toast("Wrong coach code"); return; } p.admins = p.admins || []; if (!p.admins.includes(myUid())) p.admins.push(myUid()); p.open = false; await cset("club/" + id + "/profile", p); const idx = (await cget("clubs/index")) || { list: [] }; const r = idx.list.find((x) => x.id === id); if (r) { r.open = false; await cset("clubs/index", idx); } }
  else if (!p.open && (code || "").trim().toUpperCase() !== p.code) { toast("Wrong club code"); return; }
  S.settings.clubId = id; save("settings"); CLUB.loadedFor = null; await clubLoad(); await clubUpdateMe(); toast("Welcome to " + CLUB.profile.n); render();
}
function joinSheet(id, asCoach) {
  const row = (CLUB.index.list || []).find((x) => x.id === id) || {};
  const b = '<p class="small">' + (asCoach ? "Enter the coach code for <b>" + esc(row.n) + "</b>. You get it from the app admin; it makes you a coach of this club." : "Ask your coach for the club code of <b>" + esc(row.n) + "</b>.") + "</p>" + field("j-code", asCoach ? "Coach code" : "Club code", inp("j-code", "", "text", 'autofocus autocapitalize="characters" autocomplete="off" placeholder="' + (asCoach ? "8 characters" : "6 characters") + '"'));
  openSheet(asCoach ? "I am the coach" : "Join " + (row.n || "club"), b, { saveLabel: "Join", onSave() { clubJoin(id, sv("j-code"), asCoach); return true; } });
}
async function clubLeave() {
  if (CLUB.id && CLUB.members) { CLUB.members.list = CLUB.members.list.filter((x) => x.uid !== myUid()); await cset("club/" + CLUB.id + "/members", CLUB.members); }
  S.settings.clubId = ""; save("settings"); CLUB.loadedFor = null; await clubLoad(); render();
}
function fmtMoney(v) { v = +v || 0; return v.toLocaleString("en-US") + "₮"; }
function lastPaid(uid) { const p = CLUB.pay[uid]; if (!p || !p.items.length) return null; return p.items.slice().sort((a, b) => (a.per < b.per ? 1 : -1))[0]; }
function membership(uid) {
  const p = CLUB.pay[uid]; const ok = p ? p.items.filter((x) => x.status !== "pending" && !x.drop).map((x) => x.per).sort() : []; const last = ok[ok.length - 1]; const today = todayIso();
  if (!last) return { state: "none", text: "No payment yet", days: null };
  const y = +last.slice(0, 4), m = +last.slice(5); const end = new Date(y, m, 0); const endIso = end.getFullYear() + "-" + pad(end.getMonth() + 1) + "-" + pad(end.getDate()); const days = daysBetween(today, endIso);
  if (days >= 0) return { state: "active", text: days === 0 ? "Expires today" : "Expires in " + days + " day" + (days > 1 ? "s" : ""), days, until: endIso };
  return { state: "expired", text: "Expired " + (-days) + " day" + (days < -1 ? "s" : "") + " ago", days, until: endIso };
}
function paidThisMonth(uid) { const p = CLUB.pay[uid]; return !!(p && p.items.some((x) => x.per === thisMonth() && x.status !== "pending")); }
function pendingPay(uid) { const p = CLUB.pay[uid]; return p ? p.items.filter((x) => x.status === "pending") : []; }
/* subscription options: P.plans [{id, n, months, price, kind sub|drop}] or defaults from fee */
function clubPlans(P) {
  P = P || {}; if (P.plans && P.plans.length) return P.plans.filter((p) => +p.price > 0);
  const fee = P.fee || {}; const m = +fee.month || 0; const r = (v) => Math.round(v / 1000) * 1000; const out = [];
  if (m > 0) out.push({ id: "m1", n: "", months: 1, price: m, kind: "sub" }, { id: "m3", n: "", months: 3, price: r(3 * m * 0.9), kind: "sub" }, { id: "m6", n: "", months: 6, price: r(6 * m * 0.85), kind: "sub" });
  if (+fee.drop > 0) out.push({ id: "drop", n: "", months: 0, price: +fee.drop, kind: "drop" });
  return out.filter((p) => p.price > 0);
}
function planName(p) { return (p && p.n) || (!p || p.kind === "drop" || !p.months ? "Drop-in" : p.months === 1 ? "Monthly" : p.months + " months"); }
function planOf(id) { return clubPlans(CLUB.profile).find((p) => p.id === id) || null; }
function addMonth(ym, n) { const d = new Date(+ym.slice(0, 4), +ym.slice(5) - 1 + n, 1); return d.getFullYear() + "-" + pad(d.getMonth() + 1); }
/* one label for a payment item or a group of items: Drop-in · 3 months · plan name */
function payLabel(x, n) { if (x.drop) return "Drop-in"; if (n > 1) return n + " months"; const p = x.plan && planOf(x.plan); return p ? planName(p) : ""; }
function payGroups(items) { const out = []; items.forEach((x) => { const g = x.group && out.find((o) => o.group === x.group); if (g) { g.items.push(x); g.amt += +x.amt || 0; if (x.per > g.to) g.to = x.per; if (x.per < g.per) g.per = x.per; } else out.push({ id: x.id, group: x.group, items: [x], amt: +x.amt || 0, per: x.per, to: x.per, d: x.d, note: x.note, status: x.status, drop: x.drop, plan: x.plan, start: x.start, end: x.end }); }); return out; }
/* bank details block (.payhow); copy = add the "Copy account" button */
function payHow(P, copy) {
  const pay = P.pay || {}; if (!(pay.bank || pay.account || pay.qpay)) return '<p class="small muted">The coach has not added payment details yet. Pay at the club, then tap “I have paid” so it shows up here.</p>';
  return '<div class="payhow">' + (pay.bank ? "<div><span>Bank</span><b>" + esc(pay.bank) + "</b></div>" : "") + (pay.account ? '<div class="acc"><span>Account</span><b>' + esc(pay.account) + "</b></div>" : "") + (pay.holder ? "<div><span>Name</span><b>" + esc(pay.holder) + "</b></div>" : "") + (pay.qpay ? "<div><span>QPay</span><b>" + esc(pay.qpay) + "</b></div>" : "") + (pay.note ? '<p class="small muted">' + esc(pay.note) + "</p>" : "") + (copy && pay.account ? '<button type="button" class="btn ghost" data-act="pay-copy" data-v="' + esc(pay.account) + '">Copy account</button>' : "") + "</div>";
}
function nextOpenMat(sched) {
  const d = new Date(); const dow = (d.getDay() + 6) % 7; const open = (sched || []).filter((x) => x.kind === "open");
  if (!open.length) return null; let best = null; for (const x of open) { let diff = (x.d - dow + 7) % 7; if (diff === 0 && x.t < d.toTimeString().slice(0, 5)) diff = 7; if (!best || diff < best.diff) best = { diff, x }; }
  return best ? (best.diff === 0 ? "Today " : best.diff === 1 ? "Tomorrow " : DAYS[best.x.d] + " ") + best.x.t : null;
}
VIEWS.club = function () {
  if (clubNeeds()) { if (!CLUB.busy) clubLoad(); return '<div class="card"><p class="empty"></p></div>'; }
  if (CLUB.err) return '<div class="card"><p class="empty">' + esc(CLUB.err) + '</p><button class="btn ghost wide" data-act="club-reload">Try again</button></div>';
  let h = isSuper() ? vAppAdmin() : "";
  if (!CLUB.id) {
    const list = ((CLUB.index && CLUB.index.list) || []).filter((c) => c.status !== "pending" || c.by === myUid());
    h += '<div class="card"><h2>Your club</h2><p class="small">Join your academy to see its schedule and open mats, keep your membership payments in one place, and let the coach see who is on the mat.</p>';
    if (list.length) h += '<div class="list">' + list.map((c) => '<div class="row"><div class="txt"><b>' + esc(c.n) + "</b><small>" + [c.city, c.status === "pending" ? "waiting for approval" : c.open ? "open to join" : "needs the club code"].filter(Boolean).map(esc).join(" · ") + "</small></div>" + (c.status === "pending" ? "" : '<button class="btn ghost" style="flex:none" data-act="club-join" data-id="' + c.id + '" data-open="' + (c.open ? "1" : "") + '">Join</button><button class="x" data-act="club-coach" data-id="' + c.id + '">Coach?</button>') + "</div>").join("") + "</div>";
    else h += '<p class="empty">No club registered yet. Create yours and your training partners can join.</p>';
    h += '<button class="btn wide" data-act="club-new">+ Register a club</button></div>';
    return h;
  }
  const P = CLUB.profile; const adm = isAdmin(); const nom = nextOpenMat(P.schedule);
  if (P.status === "pending") h += '<div class="tip"><b>Waiting for approval.</b> The app admin checks every new club once. You can already fill in the schedule and fees.</div>';
  h += '<div class="card clubhead"><div class="card-head"><h2>' + esc(P.n) + "</h2>" + (adm ? '<button class="btn ghost" data-act="club-edit">Edit</button>' : "") + "</div>" +
    '<p class="muted small">' + [P.city, P.coach ? "Coach " + P.coach : ""].filter(Boolean).map(esc).join(" · ") + "</p>" + (P.about ? '<p class="small">' + esc(P.about) + "</p>" : "") +
    '<div class="facts">' + (P.addr ? '<span>' + esc(P.addr) + "</span>" : "") + (P.phone ? '<a href="tel:' + esc(P.phone) + '">' + esc(P.phone) + "</a>" : "") + (P.ig ? '<a href="https://instagram.com/' + esc(P.ig.replace(/^@/, "")) + '" target="_blank" rel="noopener">@' + esc(P.ig.replace(/^@/, "")) + "</a>" : "") + "</div>" +
    (function () { const ms = membership(myUid()); const pend = pendingPay(myUid()).length; const act = (CLUB.members.list || []).filter((m) => membership(m.uid || m.id).state === "active").length; return '<div class="mstat ' + ms.state + '"><span class="pill ' + (ms.state === "active" ? "ok" : ms.state === "expired" ? "bad" : "na") + '">' + (ms.coach ? "Coach" : ms.state === "active" ? "Active" : ms.state === "expired" ? "Expired" : "Not a paying member") + "</span><b>" + esc(pend && ms.state !== "active" ? "Waiting for the coach to confirm" : ms.text) + "</b>" + (adm ? '<span class="muted small">' + act + " of " + (CLUB.members.list || []).length + " members active</span>" : "") + "</div>"; })() +
    '<div class="summary"><div class="stat"><b>' + (nom || "—") + '</b><span>next open mat</span></div><div class="stat"><b>' + ((P.schedule || []).length) + '</b><span>classes a week</span></div><div class="stat"><b>' + ((CLUB.members.list || []).length) + '</b><span>members</span></div></div>' +
    (adm ? '<details class="club-codes"><summary>Show club codes</summary><div class="codes"><span>Club code <b>' + esc(P.code || "—") + '</b></span><span>Coach code <b>' + esc(P.coachCode || "—") + "</b></span></div></details>" : "") + ((adm || isSuper()) && P.code ? '<button class="btn ghost wide" data-act="club-qr">Club QR for the door</button>' : "") + "</div>";
  h += seg([["today", "Today"], ["sched", "Schedule"], ["members", "Members"], ["pay", "Pay"]], UI.clubSeg, "clubseg");
  if (UI.clubSeg === "sched") h += vClubSched(P, adm);
  else if (UI.clubSeg === "pay") h += vClubPay(P, adm);
  else if (UI.clubSeg === "members") h += vClubMembers(P, adm);
  else h += vClubToday(P, adm);
  return h;
};
function vClubSched(P, adm) {
  const sched = (P.schedule || []).slice().sort((a, b) => a.d - b.d || (a.t < b.t ? -1 : 1)); const today = (new Date().getDay() + 6) % 7;
  let h = '<div class="card"><div class="card-head"><h3>Weekly schedule</h3><span class="muted small">' + sched.length + " classes</span></div>";
  if (!sched.length) h += '<p class="empty">' + (adm ? "Add the week’s classes and open mats." : "The coach has not added the schedule yet.") + "</p>";
  else h += '<div class="week">' + DAYS.map((dn, d) => { const xs = sched.filter((x) => x.d === d); if (!xs.length) return ""; return '<div class="day' + (d === today ? " today" : "") + '"><div class="dn">' + dn + (d === today ? " · today" : "") + '</div>' + xs.map((x, i) => '<button class="sess ' + x.kind + '" data-act="' + (adm ? "club-sess" : "none") + '" data-i="' + sched.indexOf(x) + '"><span class="t">' + esc(x.t) + '</span><span class="nm">' + esc(x.n || KIND[x.kind] || "Class") + '</span><span class="pill ' + (x.kind === "open" ? "ok" : "na") + '">' + (KIND[x.kind] || x.kind) + "</span></button>").join("") + "</div>"; }).join("") + "</div>";
  if (adm) h += '<button class="btn ghost wide" data-act="club-sess">+ Add a class or open mat</button>';
  h += "</div>" + vOpenMats(P.id) + vCompCal(adm);
  return h;
}
/* open mats across every club in the index */
function vOpenMats(skipId) {
  if (!CLUB.all) { if (!CLUB.allBusy) { CLUB.allBusy = true; (async () => { const out = []; for (const row of ((CLUB.index && CLUB.index.list) || []).filter((x) => x.status !== "pending")) { const p = await cget("club/" + row.id + "/profile"); if (p) out.push(p); } CLUB.all = out; CLUB.allBusy = false; if (UI.tab === "club") render(); })(); } return '<div class="card"><div class="card-head"><h3>Open mats around town</h3></div><p class="empty"></p></div>'; }
  const today = (new Date().getDay() + 6) % 7; const items = []; for (const p of CLUB.all) for (const x of p.schedule || []) if (x.kind === "open") items.push({ p, x });
  items.sort((a, b) => ((a.x.d - today + 7) % 7) - ((b.x.d - today + 7) % 7) || (a.x.t < b.x.t ? -1 : 1));
  let h = '<div class="card"><div class="card-head"><h3>Open mats around town</h3><span class="muted small">' + items.length + " this week</span></div>";
  if (!items.length) h += '<p class="empty">No club has posted an open mat yet. Coaches add them on their schedule and they show up here for everyone.</p>';
  else h += '<div class="list">' + items.map((it) => '<div class="row"><div class="om"><b>' + (it.x.d === today ? "Today" : DAYS[it.x.d]) + "</b><span>" + esc(it.x.t) + '</span></div><div class="txt"><b>' + esc(it.p.n) + (it.p.id === skipId ? ' <span class="pill ok">yours</span>' : "") + "</b><small>" + esc([it.x.n, it.p.addr || it.p.city].filter(Boolean).join(" · ")) + "</small></div></div>").join("") + "</div>";
  return h + "</div>";
}
function vCompCal(adm) {
  const evs = ((CLUB.events && CLUB.events.list) || []).slice().sort((a, b) => (a.d < b.d ? -1 : 1)); const today = todayIso(); const up = evs.filter((e) => e.d >= today);
  let h = '<div class="card"><div class="card-head"><h3>Competitions</h3><span class="muted small">' + up.length + " coming up</span></div>";
  if (!up.length) h += '<p class="empty">' + (adm ? "Add the next competition so everyone can plan." : "Nothing announced yet.") + "</p>";
  else h += '<div class="list">' + up.map((e) => { const dd = daysBetween(today, e.d); return '<button class="row" data-act="' + (adm ? "club-event" : "none") + '" data-id="' + e.id + '"><div class="om"><b>' + dd + "</b><span>days</span></div><div class=\"txt\"><b>" + esc(e.n) + "</b><small>" + fmtLong(e.d) + (e.place ? " · " + esc(e.place) : "") + (e.deadline ? " · register by " + fmtD(e.deadline) : "") + "</small></div>" + (e.url ? '<a class="to-link sm" href="' + esc(e.url) + '" target="_blank" rel="noopener">Info</a>' : "") + "</button>"; }).join("") + "</div>";
  if (adm) h += '<button class="btn ghost wide" data-act="club-event">+ Add a competition</button>';
  return h + "</div>";
}
function clubEventSheet(id) {
  const e = id ? CLUB.events.list.find((x) => x.id === id) : null;
  const b = field("e-n", "Competition", inp("e-n", e ? e.n : "", "text", "autofocus")) + '<div class="grid2">' + field("e-d", "Date", inp("e-d", e ? e.d : todayIso(), "date")) + field("e-dl", "Register by", inp("e-dl", e ? e.deadline || "" : "", "date")) + "</div>" + field("e-place", "Where", inp("e-place", e ? e.place || "" : "", "text")) + field("e-url", "Link", inp("e-url", e ? e.url || "" : "", "url", 'placeholder="https://"'));
  openSheet(e ? "Edit competition" : "Add a competition", b, { onDelete: e ? async () => { CLUB.events.list = CLUB.events.list.filter((x) => x.id !== e.id); await cset("club/" + CLUB.id + "/events", CLUB.events); render(); return true; } : null, async onSave() { const n = sv("e-n").trim(); if (!n) return false; const rec = e || { id: uid() }; rec.n = n; rec.d = sv("e-d") || todayIso(); rec.deadline = sv("e-dl"); rec.place = sv("e-place").trim(); rec.url = sv("e-url").trim(); if (!e) CLUB.events.list.push(rec); await cset("club/" + CLUB.id + "/events", CLUB.events); render(); return true; } });
}
/* Today: notices, check-in, my month, medals */
function vClubToday(P, adm) {
  const me = myUid(); const today = todayIso(); const dow = (new Date().getDay() + 6) % 7; const todays = mySchedule().filter((x) => x.d === dow).sort((a, b) => (a.t < b.t ? -1 : 1));
  const here = !!(CLUB.attMonth && CLUB.attMonth.days[today] && CLUB.attMonth.days[today].includes(me)); const cal = attCalendar(me, thisMonth());
  let h = '<div class="card"><div class="card-head"><h3>Today</h3><span class="muted small">' + (todays.length ? todays.map((x) => x.t + " " + (x.n || KIND[x.kind])).join(" · ") : "no class scheduled") + "</span></div>" +
    (here ? '<div class="tip good">Checked in today</div>' : '<button class="btn wide" data-act="record">Scan club QR</button>') + attendanceCount(today,((CLUB.attMonth&&CLUB.attMonth.days[today])||[]).length) + streakLine() + "</div>";
  { const mine = (CLUB.members.list || []).find((m) => attKey(m) === me); if (mine && mine.comp) { const ev = ((CLUB.events && CLUB.events.list) || []).filter((e) => e.d >= today).sort((a, b) => (a.d < b.d ? -1 : 1))[0]; h += '<div class="tip"><b>You are on the competition team.</b> ' + (ev ? esc(ev.n) + " in " + daysBetween(today, ev.d) + " days" + (ev.deadline ? " · register by " + fmtD(ev.deadline) : "") : "No competition announced yet.") + "</div>"; } }
  const notes = ((CLUB.notes && CLUB.notes.list) || []).slice().sort((a, b) => (a.d < b.d ? 1 : -1)).slice(0, 5);
  h += '<div class="card"><div class="card-head"><h3>Notices</h3>' + (adm ? '<button class="btn ghost" data-act="club-note">+ Post</button>' : "") + "</div>" + (notes.length ? '<div class="list">' + notes.map((n) => '<div class="row"><div class="txt"><b>' + esc(n.text) + "</b><small>" + fmtD(n.d) + " · " + esc(n.by || "coach") + "</small></div>" + (adm ? '<button class="x" data-act="club-note-del" data-id="' + n.id + '">✕</button>' : "") + "</div>").join("") + "</div>" : '<p class="empty">No notices. ' + (adm ? "Schedule changes, open mats, seminars: post them here." : "Your coach posts changes and news here.") + "</p>") + "</div>";
  h += '<div class="card"><div class="card-head"><h3>My month</h3><span class="muted small">' + cal.n + " on the mat · " + cal.missed + " missed</span></div>" + cal.html + '<p class="muted small">Green = club attendance. Red = a class day you missed.</p></div>';
  const mine = ((CLUB.results && CLUB.results.list) || []).filter((r) => r.uid === me);
  if (mine.length) h += '<div class="card"><h3>My medals</h3><div class="list">' + mine.map((r) => '<div class="row"><span class="medal ' + r.medal + '"></span><div class="txt"><b>' + esc(r.event) + "</b><small>" + fmtD(r.d) + " · " + r.medal + "</small></div><span class=\"pill " + (r.status === "ok" ? "ok" : "na") + '">' + (r.status === "ok" ? "approved" : "waiting for coach") + "</span></div>").join("") + "</div></div>";
  const ps = partnerStats(); if (ps.my.length || ps.top.length) h += '<div class="card"><div class="card-head"><h3>Training partners</h3><span class="muted small">' + (ps.people ? "you rolled with " + ps.people + (ps.people > 1 ? " people" : " person") : "") + "</span></div>" + (ps.my.length ? '<div class="chips">' + ps.my.slice(0, 8).map((x) => '<span class="chip">' + esc(x.n) + " · " + x.c + "×</span>").join("") + "</div>" : '<p class="muted small">Tick who you rolled with when you log training.</p>') + (ps.top.length ? '<p class="muted small" style="margin-top:6px">Most rounds together this month</p><div class="list">' + ps.top.map((x) => '<div class="row' + (x.me ? " me" : "") + '"><div class="txt"><b>' + esc(x.a) + " &amp; " + esc(x.b) + "</b></div><span class=\"muted small\">" + x.c + " rounds</span></div>").join("") + "</div>" : "") + "</div>";
  const lb = leaderboard(); if (lb.length) h += '<div class="card"><div class="card-head"><h3>Mat time · ' + thisMonth() + '</h3></div><div class="list">' + lb.map((x, i) => '<div class="row"><b class="rankn">' + (i + 1) + '</b><div class="txt"><b>' + esc(x.n) + "</b></div><span class=\"muted small\">" + x.n0 + " days</span></div>").join("") + "</div></div>";
  return h;
}
/* who rolled with whom: club/<id>/rolls/<yyyy-mm> = { list: [{ d, a, b }] } */
async function rollsShare(rec) {
  if (!CLUB.id) return; const ym = rec.d.slice(0, 7); const doc = (await cget("club/" + CLUB.id + "/rolls/" + ym)) || { list: [] }; const me = myUid();
  doc.list = doc.list.filter((x) => !(x.sid === rec.id && x.a === me)); for (const w of rec.with || []) doc.list.push({ sid: rec.id, d: rec.d, a: me, b: w }); await cset("club/" + CLUB.id + "/rolls/" + ym, doc); if (ym === thisMonth()) CLUB.rolls = doc;
}
function partnerStats() {
  const me = myUid(); const mine = {}; for (const s of S.log.items) for (const w of s.with || []) mine[w] = (mine[w] || 0) + 1;
  const name = (k) => { const m = (CLUB.members.list || []).find((x) => attKey(x) === k); return m ? m.n || m.email || "Member" : "Someone"; };
  const my = Object.keys(mine).map((k) => ({ n: name(k), c: mine[k] })).sort((a, b) => b.c - a.c);
  const pairs = {}; for (const r of (CLUB.rolls && CLUB.rolls.list) || []) { const k = [r.a, r.b].sort().join("|"); pairs[k] = (pairs[k] || 0) + 1; }
  const top = Object.keys(pairs).map((k) => { const [a, b] = k.split("|"); return { a: name(a), b: name(b), c: pairs[k], me: a === me || b === me }; }).sort((a, b) => b.c - a.c).slice(0, 5);
  return { my, top, people: my.length };
}
function leaderboard() { const doc = CLUB.attMonth; if (!doc) return []; const c = {}; for (const d in doc.days) for (const w of doc.days[d]) c[w] = (c[w] || 0) + 1; return Object.keys(c).map((w) => { const m = (CLUB.members.list || []).find((x) => attKey(x) === w); return { n: m ? m.n || m.email || "Member" : "Member", n0: c[w] }; }).sort((a, b) => b.n0 - a.n0).slice(0, 5); }
function noteSheet() { openSheet("Post a notice", field("n-t", "Notice", ta("n-t", "", "Open mat moved to 13:00 on Saturday…")), { saveLabel: "Post", async onSave() { const t = sv("n-t").trim(); if (!t) return false; CLUB.notes.list.push({ id: uid(), d: todayIso(), by: myName(), text: t }); await cset("club/" + CLUB.id + "/notes", CLUB.notes); render(); return true; } }); }
/* medals: a member's competition result waits for the coach */
async function resultSubmit(ev) {
  if (!CLUB.id || !CLUB.results) return; const me = myUid(); let r = CLUB.results.list.find((x) => x.uid === me && x.evId === ev.id);
  if (!ev.medal) { if (r) { CLUB.results.list = CLUB.results.list.filter((x) => x !== r); await cset("club/" + CLUB.id + "/results", CLUB.results); } return; }
  if (!r) { r = { id: uid(), uid: me, evId: ev.id, n: myName(), status: "pending" }; CLUB.results.list.push(r); }
  if (r.medal !== ev.medal) r.status = "pending"; r.medal = ev.medal; r.event = ev.n; r.d = ev.d; r.div = ev.div || "";
  await cset("club/" + CLUB.id + "/results", CLUB.results);
}
function vClubPay(P, adm) {
  const me = myUid(); const mine = payGroups((CLUB.pay[me] && CLUB.pay[me].items || []).slice().sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : a.per < b.per ? -1 : 1))); const pend = pendingPay(me).some((x) => x.per === thisMonth());
  const ms = membership(me); const plans = clubPlans(P); const sel = plans.find((p) => p.id === UI.payPlan) || plans[0];
  let h = '';
  if (isClubCoach(me)) h = coachMembershipCard();
  else {
  h = '<div class="card"><div class="card-head"><h3>My membership</h3><span class="pill ' + (ms.state === "active" ? "ok" : pend ? "na" : "warn") + '">' + (ms.state === "active" ? ms.text : pend ? "Waiting for the coach" : ms.state === "expired" ? ms.text : "Not paid yet") + "</span></div>";
  if (plans.length) h += '<div class="plans">' + plans.map((p) => '<button type="button" class="planc' + (sel && sel.id === p.id ? " on" : "") + '" data-act="pay-plan" data-v="' + esc(p.id) + '" aria-pressed="' + (sel && sel.id === p.id) + '"><b>' + esc(planName(p)) + "</b>" + (() => { const ml = p.kind === "drop" || !p.months ? "1 class" : p.months === 1 ? "1 month" : p.months + " months"; return p.n ? "<small>" + ml + "</small>" : p.months > 1 ? "" : "<small>" + ml + "</small>"; })() + '<span class="price">' + fmtMoney(p.price) + "</span>" + (p.months > 1 ? "<small>per month ≈ " + fmtMoney(Math.round(p.price / p.months)) + "</small>" : "") + "</button>").join("") + "</div>";
  else h += '<p class="muted small">The coach has not set the fee yet.</p>';
  if (!mine.length) h += '<p class="empty">No payments yet. Pay the monthly fee here and your coach confirms it.</p>';
  else h += '<div class="list">' + mine.map((x) => { const n = x.items.length; const lb = payLabel(x, n); return '<button class="row" data-act="club-pay" data-id="' + x.id + '"><span class="pill ' + (x.status === "pending" ? "na" : "ok") + '">' + (x.status === "pending" ? "sent" : "confirmed") + '</span><div class="txt"><b>' + fmtMoney(x.amt) + " · " + (x.drop ? esc(tr(lb)) : n > 1 ? esc(tr(lb)) : esc(x.per)) + "</b><small>" + (n > 1 ? esc(x.per) + " → " + esc(x.to) + " · " : "") + (x.start ? esc(x.start) + " → " + esc(x.end) : fmtD(x.d)) + (lb && !x.drop && n === 1 ? " · " + esc(tr(lb)) : "") + (x.note ? " · " + esc(x.note) : "") + "</small></div>" + CHEV + "</button>"; }).join("") + "</div>";
  if (sel) h += '<button class="btn wide" data-act="club-paynow">' + "Pay " + fmtMoney(sel.price) + " · " + esc(tr(planName(sel))) + "</button>";
  h += "</div>";
  h += '<div class="card"><div class="card-head"><h3>Bank details</h3></div>' + payHow(P, true) + "</div>";
  }
  if (adm) {
    const ms = (CLUB.members.list || []).slice().sort((a, b) => (paidThisMonth(a.uid) === paidThisMonth(b.uid) ? 0 : paidThisMonth(a.uid) ? 1 : -1));
    h += '<div class="card"><div class="card-head"><h3>Membership status · ' + thisMonth() + '</h3><span class="muted small">' + ms.filter((m) => paidThisMonth(m.uid)).length + " / " + ms.length + "</span></div><div class=\"list\">" + ms.map((m) => { const lp = lastPaid(m.uid); const ok = paidThisMonth(m.uid); const pp = pendingPay(m.uid); const pg = pp.length ? payGroups(pp)[0] : null; const lb = pg ? payLabel(pg, pg.items.length) : ""; return '<div class="row"><span class="pill ' + (ok ? "ok" : pp.length ? "warn" : "bad") + '">' + (isClubCoach(m.uid) ? "Coach · Active" : ok ? "paid" : pp.length ? "check" : "due") + '</span><div class="txt"><b>' + esc(m.n || m.email || "Member") + "</b><small>" + (isClubCoach(m.uid) ? "Payment exempt" : pg ? "says paid " + (pg.drop ? fmtD(pg.d) : esc(pg.per) + (pg.items.length > 1 ? " → " + esc(pg.to) : "")) + " · " + fmtMoney(pg.amt) + (lb ? " · " + esc(tr(lb)) : "") + (pg.note ? " · " + esc(pg.note) : "") : lp ? "last: " + esc(lp.per) + " · " + fmtMoney(lp.amt) : "never") + "</small></div>" + (isClubCoach(m.uid) ? "" : pg ? '<button class="btn" style="flex:none" data-act="club-confirm" data-uid="' + m.uid + '" data-id="' + pg.id + '">Confirm</button>' : '<button class="btn ghost" style="flex:none" data-act="club-pay" data-uid="' + m.uid + '">Log fee</button>') + "</div>"; }).join("") + "</div></div>";
  }
  return h;
}
function payNowSheet() {
  const P = CLUB.profile; const me = myUid(); const plans = clubPlans(P); const plan = plans.find((p) => p.id === UI.payPlan) || plans[0] || { id: "m1", n: "", months: 1, price: (P.fee && P.fee.month) || 0, kind: "sub" };
  const drop = plan.kind === "drop" || !plan.months; const items = (CLUB.pay[me] && CLUB.pay[me].items) || []; const pers = items.filter((x) => !x.drop && x.per >= thisMonth()).map((x) => x.per).sort(); const start = pers.length ? addMonth(pers[pers.length - 1], 1) : thisMonth();
  const b = '<p class="small">Transfer <b>' + fmtMoney(plan.price) + "</b> · <b>" + esc(tr(planName(plan))) + "</b>, then confirm below. Your coach checks it and marks it as paid.</p>" + payHow(P, true) +
    (drop ? '<div class="field"><label>For</label><p class="small" style="margin:0"><b>Drop-in · ' + fmtD(todayIso()) + "</b></p></div>" : '<div class="grid2">' + field("p-per", "For month", inp("p-per", start, "month")) + field("p-months", "Months", inp("p-months", plan.months, "number", 'inputmode="numeric" min="1" max="24"')) + "</div>") +
    '<div class="grid2">' + field("p-amt", "Amount (₮)", inp("p-amt", plan.price, "number", 'inputmode="numeric"')) + field("p-note", "Note", inp("p-note", "", "text", 'placeholder="transfer / cash / QPay"')) + "</div>";
  openSheet("Pay " + P.n, b, { saveLabel: "I have paid", async onSave() {
    const doc = CLUB.pay[me] || { items: [] }; const months = drop ? 1 : Math.min(24, Math.max(1, Math.round(+sv("p-months") || plan.months || 1))); const total = +sv("p-amt") || plan.price || 0; const per0 = drop ? thisMonth() : sv("p-per") || start; const group = uid(); const each = Math.floor(total / months); const note = sv("p-note").trim(); const d = todayIso();
    for (let i = 0; i < months; i++) { const it = { id: uid(), d, per: drop ? per0 : addMonth(per0, i), amt: i ? each : total - each * (months - 1), note, by: me, status: "pending", plan: plan.id, group }; if (drop) it.drop = true; doc.items.push(it); }
    CLUB.pay[me] = doc; await cset("club/" + P.id + "/pay/" + me, doc); toast("Sent to your coach"); render(); return true;
  } });
}
async function confirmPay(uidFor, id) {
  const doc = CLUB.pay[uidFor]; if (!doc) return; const x = doc.items.find((y) => y.id === id); if (!x) return; const all = x.group ? doc.items.filter((y) => y.group === x.group && y.status === "pending") : [x]; all.forEach((y) => { y.status = "ok"; y.okBy = myUid(); y.okAt = todayIso(); }); await cset("club/" + CLUB.id + "/pay/" + uidFor, doc); toast("Confirmed"); render();
}
function vAppAdmin() {
  const A = CLUB.app || {}; const pend = CLUB.pending || []; const ups = ((CLUB.upgrades && CLUB.upgrades.list) || []).filter((u) => u.status === "pending");
  let h = '<div class="card admin"><div class="card-head"><h3>App admin</h3><button class="btn ghost" data-act="app-settings">Payment settings</button></div>';
  h += '<p class="muted small">New clubs · ' + pend.length + "</p>" + (pend.length ? '<div class="list">' + pend.map((p) => '<div class="row"><div class="txt"><b>' + esc(p.n) + "</b><small>" + esc([p.city, p.coach].filter(Boolean).join(" · ")) + '</small></div><button class="btn" style="flex:none" data-act="club-approve" data-id="' + p.id + '">Approve</button><button class="x" data-act="club-reject" data-id="' + p.id + '">Reject</button></div>').join("") + "</div>" : '<p class="empty">Nothing waiting.</p>');
  h += '<p class="muted small">Upgrades · ' + ups.length + "</p>" + (ups.length ? '<div class="list">' + ups.map((u) => '<div class="row"><div class="txt"><b>' + esc(u.n || u.email || u.uid) + "</b><small>" + fmtD(u.d) + (u.note ? " · " + esc(u.note) : "") + '</small></div><button class="btn" style="flex:none" data-act="up-ok" data-id="' + u.id + '" data-m="1">1 mo</button><button class="btn ghost" style="flex:none" data-act="up-ok" data-id="' + u.id + '" data-m="12">1 yr</button><button class="x" data-act="up-no" data-id="' + u.id + '">✕</button></div>').join("") + "</div>" : '<p class="empty">No upgrade requests.</p>');
  h += '<details class="fold"><summary><span class="muted small">Club codes (hand the coach code to each club)</span></summary><div class="list">' + ((CLUB.index && CLUB.index.list) || []).map((c) => '<div class="row"><div class="txt"><b>' + esc(c.n) + '</b><small>' + (c.status || "approved") + '</small></div><button class="x" data-act="club-codes" data-id="' + c.id + '">Codes</button></div>').join("") + "</div></details></div>";
  return h;
}
function appSettingsSheet() {
  const A = CLUB.app || {}; const p = A.pay || {};
  const b = '<p class="small muted">Shown to members who upgrade the app. Club fees use each club’s own details.</p><div class="grid2">' + field("a-price", "Upgrade price / month (₮)", inp("a-price", (A.pro && A.pro.price) || "", "number", 'inputmode="numeric"')) + field("a-bank", "Bank", inp("a-bank", p.bank || "", "text")) + "</div><div class=\"grid2\">" + field("a-acc", "Account", inp("a-acc", p.account || "", "text")) + field("a-holder", "Name", inp("a-holder", p.holder || "", "text")) + "</div>" + field("a-qpay", "QPay (link or text)", inp("a-qpay", p.qpay || "", "text")) + field("a-note", "Note", ta("a-note", p.note || "", "")) + field("a-admins", "Admin emails (one per line)", ta("a-admins", (A.admins || []).join("\n"), ""));
  openSheet("Payment settings", b, { async onSave() { const rec = { admins: lines(sv("a-admins")), pay: { bank: sv("a-bank").trim(), account: sv("a-acc").trim(), holder: sv("a-holder").trim(), qpay: sv("a-qpay").trim(), note: sv("a-note").trim() }, pro: { price: +sv("a-price") || 0 } }; await cset("app/config", rec); CLUB.app = rec; toast("Saved"); render(); return true; } });
}
/* In-app purchase bridge. Inside a Capacitor shell with RevenueCat (window.Capacitor.Plugins.Purchases) or a custom
   window.IAP = { available, buy(productId) → Promise<{until}> } the store handles the upgrade; on the plain web we fall back to a transfer. */
const IAP = {
  available() { return !!(window.IAP && window.IAP.buy) || !!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Purchases); },
  store() { const ua = navigator.userAgent; return /iPhone|iPad|Macintosh/.test(ua) ? "App Store" : "Google Play"; },
  async buy(productId) {
    if (window.IAP && window.IAP.buy) return window.IAP.buy(productId);
    const P = window.Capacitor.Plugins.Purchases; const offs = await P.getOfferings(); const pkg = offs.current && offs.current.availablePackages.find((x) => x.product.identifier === productId) || (offs.current && offs.current.availablePackages[0]); if (!pkg) throw new Error("no package");
    const r = await P.purchasePackage({ aPackage: pkg }); const ent = r.customerInfo && r.customerInfo.entitlements.active.pro; return { until: ent ? (ent.expirationDate || "").slice(0, 7) : thisMonth() };
  },
};
async function iapBuy() {
  try { const r = await IAP.buy((CLUB.app && CLUB.app.pro && CLUB.app.pro.product) || "bjj.pro.month"); const pro = (await cget("app/pro")) || { u: {} }; pro.u[myUid()] = { until: r.until || thisMonth(), n: myName(), via: "store" }; await cset("app/pro", pro); CLUB.pro = pro; closeSheet(); toast("Upgraded"); render(); } catch (e) { toast("Purchase did not go through"); }
}
function upgradeSheet() {
  const A = CLUB.app || {}; const p = A.pay || {}; const price = (A.pro && A.pro.price) || 0;
  const how = p.bank || p.account || p.qpay ? '<div class="payhow">' + (p.bank ? "<div><span>Bank</span><b>" + esc(p.bank) + "</b></div>" : "") + (p.account ? "<div><span>Account</span><b>" + esc(p.account) + "</b></div>" : "") + (p.holder ? "<div><span>Name</span><b>" + esc(p.holder) + "</b></div>" : "") + (p.qpay ? "<div><span>QPay</span><b>" + esc(p.qpay) + "</b></div>" : "") + (p.note ? '<p class="small muted">' + esc(p.note) + "</p>" : "") + "</div>" : '<p class="small muted">Payment details are being set up. Send the request anyway and the admin will get back to you.</p>';
  const b = '<p class="small">The upgrade opens Setups, routes, Learn, game plans and roll history' + (price ? " for <b>" + fmtMoney(price) + "</b> a month" : "") + ". Club members with a confirmed monthly fee get it included.</p>" + (IAP.available() ? '<button class="btn wide" data-act="iap-buy">Subscribe with ' + IAP.store() + "</button><p class=\"muted small\">Or pay by transfer:</p>" : '<p class="muted small">In the App Store and Google Play version this is a one-tap subscription. On the web, pay by transfer:</p>') + how + field("u-note", "Note (your name on the transfer)", inp("u-note", "", "text"));
  openSheet("Upgrade", b, { saveLabel: "I have paid", async onSave() { if (mode !== "cloud" && !isSuper()) return true; const doc = (await cget("app/upgrades")) || { list: [] }; doc.list.push({ id: uid(), uid: myUid(), n: myName(), email: SB.session ? SB.session.email : "", d: todayIso(), note: sv("u-note").trim(), status: "pending" }); await cset("app/upgrades", doc); CLUB.upgrades = doc; toast("Request sent"); render(); return true; } });
}
/* payment status of a roster member, for the coach's list: a payment waiting for confirmation wins, then membership() */
function payState(m) {
  const k = attKey(m); if(isClubCoach(k))return{k:'coach',cls:'ok',text:'Coach · Active'}; const pp = pendingPay(k); if (pp.length) return { k: "pend", cls: "pend", text: "Pending", uid: k, id: pp[0].id };
  const ms = membership(k); if (ms.state === "none") return { k: "none", cls: "na", text: "No payment" };
  if (ms.state === "expired") return { k: "over", cls: "bad", text: "Overdue " + (-ms.days) + " day" + (ms.days < -1 ? "s" : "") };
  if (ms.days <= 7) return { k: "exp", cls: "warn", text: ms.text };
  return { k: "ok", cls: "ok", text: "Paid · " + ms.days + " day" + (ms.days > 1 ? "s" : "") + " left" };
}
function payPill(ps) { if(ps.k==='coach')return '<span class="pill payp ok">Coach · Active</span>'; return '<span class="pill payp ' + ps.cls + '" role="button" data-act="' + (ps.k === "pend" ? "club-confirm" : "clubseg") + '" ' + (ps.k === "pend" ? 'data-uid="' + esc(ps.uid) + '" data-id="' + esc(ps.id) + '"' : 'data-v="pay"') + ">" + ps.text + "</span>"; }
function vClubMembers(P, adm) {
  const all = (CLUB.members.list || []); const f = UI.memF || "all"; const today = todayIso();
  const attN = (m) => attDays(CLUB.attMonth, attKey(m)).length;
  let ms = all.filter((m) => f === "kids" ? m.track === "kids" : f === "adult" ? m.track !== "kids" : f === "comp" ? !!m.comp : f === "due" ? !paidThisMonth(m.uid || m.id) : f === "exp" ? payState(m).k === "exp" : f === "over" ? payState(m).k === "over" : f === "quiet" ? attN(m) === 0 : f === "new" ? !m.uid : true);
  ms = ms.slice().sort((a, b) => BELT_ORDER.indexOf((b.belt || "white").split("-")[0]) - BELT_ORDER.indexOf((a.belt || "white").split("-")[0]) || (b.stripes || 0) - (a.stripes || 0) || String(a.n || "").localeCompare(String(b.n || "")));
  let h = '<div class="card"><div class="card-head"><h3>Members</h3><span class="muted small">' + ms.length + " of " + all.length + "</span></div>";
  if (adm) h += '<div class="chips">' + [["all", "All"], ["kids", "Kids"], ["adult", "Adults"], ["comp", "Comp team"], ["due", "Fee due"], ["exp", "Expiring"], ["over", "Overdue"], ["quiet", "Not seen this month"], ["new", "No account yet"]].map((i) => '<button type="button" class="chip' + (f === i[0] ? " on" : "") + '" data-act="memf" data-v="' + i[0] + '">' + i[1] + "</button>").join("") + "</div>";
  const groups = {}; for (const m of ms) { const b = (m.belt || "white").split("-")[0]; (groups[b] = groups[b] || []).push(m); }
  const order = Object.keys(groups).sort((a, b) => BELT_ORDER.indexOf(b) - BELT_ORDER.indexOf(a));
  if (!ms.length) h += '<p class="empty">Nobody here' + (f !== "all" ? " with this filter" : "") + ".</p>";
  else h += '<div class="list">' + order.map((b) => '<div class="group-label" style="color:' + (BELT_COLOR[b] || "var(--muted)") + '">' + b + " · " + groups[b].length + "</div>" + groups[b].map((m) => { const isA = (P.admins || []).includes(m.uid); const medals = ((CLUB.results && CLUB.results.list) || []).filter((r) => r.uid === m.uid && r.status === "ok").length; return '<button class="row" data-act="' + (adm ? "club-member" : "none") + '" data-id="' + m.id + '"><span class="bdot" style="background:' + (BELT_COLOR[b] || "#999") + '"></span><div class="txt"><b>' + esc(m.n || m.email || "Member") + (isA ? ' <span class="pill na">coach</span>' : "") + (m.comp ? ' <span class="pill ok">comp</span>' : "") + (!m.uid ? ' <span class="pill warn">no account</span>' : "") + "</b><small>" + (m.track === "kids" ? "kids · " : "") + (m.stripes ? m.stripes + " stripes · " : "") + attN(m) + " days this month" + (adm && (CLUB.privateAges || {})[m.uid || m.id] != null ? " · " + privateAgeSummary(m) : "") + (medals ? " · " + medals + " medal" + (medals > 1 ? "s" : "") : "") + "</small></div>" + (adm ? payPill(payState(m)) + CHEV : "") + "</button>"; }).join("")).join("") + "</div>";
  if (adm) h += '<button class="btn ghost wide" data-act="club-member">+ Add a member</button>';
  h += "</div>";
  if (adm) {
    const date = UI.attDate || today; const ym = date.slice(0, 7); const doc = ym === thisMonth() ? CLUB.attMonth : (CLUB.att && CLUB.att.ym === ym ? CLUB.att.doc : null); const here = (doc && doc.days[date]) || [];
    h += '<div class="card attendance-card"><div class="card-head"><h3>Attendance</h3><input id="att-date" type="date" value="' + date + '" max="' + today + '" style="width:auto;min-height:36px;padding:4px 8px"></div>' + (doc ? attendanceCount(date,here.length) : '<p class="empty"></p>') + '</div>';
    const pend = ((CLUB.results && CLUB.results.list) || []).filter((r) => r.status !== "ok");
    if (pend.length) h += '<div class="card"><div class="card-head"><h3>Medals to approve</h3><span class="muted small">' + pend.length + '</span></div><div class="list">' + pend.map((r) => '<div class="row"><span class="medal ' + r.medal + '"></span><div class="txt"><b>' + esc(r.n) + " · " + r.medal + "</b><small>" + esc(r.event) + " · " + fmtD(r.d) + (r.div ? " · " + esc(r.div) : "") + '</small></div><button class="btn" style="flex:none" data-act="res-ok" data-id="' + r.id + '">Approve</button><button class="x" data-act="res-no" data-id="' + r.id + '">✕</button></div>').join("") + "</div></div>";
    const board = ((CLUB.results && CLUB.results.list) || []).filter((r) => r.status === "ok").sort((a, b) => (a.d < b.d ? 1 : -1)).slice(0, 10);
    if (board.length) h += '<div class="card"><h3>Club medals</h3><div class="list">' + board.map((r) => '<div class="row"><span class="medal ' + r.medal + '"></span><div class="txt"><b>' + esc(r.n) + "</b><small>" + esc(r.event) + " · " + fmtD(r.d) + "</small></div></div>").join("") + "</div></div>";
    h += '<div class="card"><div class="list">' + all.filter((m) => m.uid && m.uid !== myUid()).map((m) => { const isA = (P.admins || []).includes(m.uid); return '<div class="row"><div class="txt"><b>' + esc(m.n || m.email) + "</b></div><button class=\"x\" data-act=\"club-admin\" data-uid=\"" + m.uid + '">' + (isA ? "Remove coach" : "Make coach") + "</button></div>"; }).join("") + "</div></div>";
  }
  h += '<div class="card"><div class="actions"><button class="btn ghost danger" data-act="club-leave">' + (UI.confirm === "leave" ? "Leave " + esc(P.n) + "?" : "Leave club") + "</button></div></div>";
  return h;
}
function clubSheet(edit) {
  const P = edit ? CLUB.profile : {}; const fee = P.fee || {};
  const b = field("c-n", "Club name", inp("c-n", P.n || "", "text", 'autofocus placeholder="e.g. Ulaanbaatar BJJ"')) + '<div class="grid2">' + field("c-city", "City", inp("c-city", P.city || "", "text")) + field("c-coach", "Head coach", inp("c-coach", P.coach || "", "text")) + "</div>" +
    field("c-addr", "Address", inp("c-addr", P.addr || "", "text")) + '<div class="grid2">' + field("c-phone", "Phone", inp("c-phone", P.phone || "", "tel")) + field("c-ig", "Instagram", inp("c-ig", P.ig || "", "text", 'placeholder="@club"')) + "</div>" +
    '<div class="grid2">' + field("c-fm", "Monthly fee (₮)", inp("c-fm", fee.month || "", "number", 'inputmode="numeric"')) + field("c-fd", "Adult drop-in (₮)", inp("c-fd", fee.drop || "", "number", 'inputmode="numeric"')) + "</div><div class=\"grid2\">" + field("c-km", "Kids monthly fee (₮)", inp("c-km", fee.kidsMonth || "", "number")) + field("c-kd", "Kids drop-in (₮)", inp("c-kd", fee.kidsDrop || "", "number")) + "</div>" + field("c-about", "About", ta("c-about", P.about || "", "Style, who trains here, what to bring…")) +
    '<p class="lbl" style="margin-top:4px">How members pay you</p><div class="grid2">' + field("c-bank", "Bank", inp("c-bank", (P.pay || {}).bank || "", "text")) + field("c-acc", "Account", inp("c-acc", (P.pay || {}).account || "", "text")) + "</div><div class=\"grid2\">" + field("c-holder", "Name on account", inp("c-holder", (P.pay || {}).holder || "", "text")) + field("c-qpay", "QPay", inp("c-qpay", (P.pay || {}).qpay || "", "text")) + "</div>" + field("c-pnote", "Payment note", inp("c-pnote", (P.pay || {}).note || "", "text", 'placeholder="Write your name in the transfer"')) +
    '<p class="lbl" style="margin-top:4px">Subscription options</p><p class="small muted" style="margin:0">Name, months and price. 0 months = drop-in. Leave empty to offer 1, 3 and 6 months from the monthly fee.</p><div id="c-plans"></div>';
  openSheet(edit ? "Edit club" : "Register a club", b, { state: { plans: (P.plans || []).map((p) => Object.assign({}, p)) }, saveLabel: edit ? "Save" : "Create club", async onSave() {
    const n = sv("c-n").trim(); if (!n) { $("c-n").focus(); return false; }
    const rec = Object.assign(edit ? CLUB.profile : { id: uid(), admins: [myUid()], schedule: [], created: todayIso(), status: isSuper() ? "approved" : "pending", by: myUid(), code: genCode(6), coachCode: genCode(8), open: false }, { n, city: sv("c-city").trim(), coach: sv("c-coach").trim(), addr: sv("c-addr").trim(), phone: sv("c-phone").trim(), ig: sv("c-ig").trim(), about: sv("c-about").trim(), fee: { month: +sv("c-fm") || 0, drop: +sv("c-fd") || 0, kidsMonth: +sv("c-km") || 0, kidsDrop: +sv("c-kd") || 0 }, pay: { bank: sv("c-bank").trim(), account: sv("c-acc").trim(), holder: sv("c-holder").trim(), qpay: sv("c-qpay").trim(), note: sv("c-pnote").trim() }, plans: planRead().filter((p) => p.price > 0) });
    try {
      await cset("club/" + rec.id + "/profile", rec);
      const idx = (await cget("clubs/index")) || { list: [] }; const i = idx.list.findIndex((x) => x.id === rec.id); const row = { id: rec.id, n: rec.n, city: rec.city, logo:rec.logo||"", status: rec.status || "approved", by: rec.by, open: !!rec.open }; if (i >= 0) idx.list[i] = row; else idx.list.push(row); await cset("clubs/index", idx);
      if (!edit) { S.settings.clubId = rec.id; save("settings"); CLUB.loadedFor = null; await clubLoad(); await clubUpdateMe(); } else CLUB.profile = rec;
      toast(edit ? "Saved" : "Club created"); render();
    } catch (e) { toast("Could not save the club"); }
    return true;
  } });
  planRows();
}
function classSheet(i) {
  const P = CLUB.profile; const sched = (P.schedule || []).slice().sort((a, b) => a.d - b.d || String(a.t).localeCompare(String(b.t))); const x = i != null ? sched[i] : null;
  const b = '<div class="field"><span class="lbl">Day</span>' + chips("d", DAYS.map((d, j) => [String(j), d]), x ? String(x.d) : "0") + "</div>" + '<div class="grid2">' + field("s-t", "Starts", inp("s-t", x ? x.t : "18:00", "time")) + field("s-n", "Name", inp("s-n", x ? x.n : "", "text", 'placeholder="Fundamentals"')) + "</div>" +
    '<div class="field"><span class="lbl">Kind</span>' + chips("kind", Object.entries(KIND), x ? x.kind : "gi") + "</div>";
  openSheet(x ? "Edit class" : "Add a class", b, { state: { picks: { d: x ? String(x.d) : "0", kind: x ? x.kind : "gi" } }, onDelete: x ? async () => { P.schedule = P.schedule.filter((y) => y !== x); await cset("club/" + P.id + "/profile", P); render(); return true; } : null, async onSave() {
    const rec = x || {}; rec.d = +pickVal("d", "0"); rec.t = sv("s-t") || "18:00"; rec.n = sv("s-n").trim(); rec.kind = pickVal("kind", "gi");
    if (!x) (P.schedule = P.schedule || []).push(rec); await cset("club/" + P.id + "/profile", P); toast("Saved"); render(); return true;
  } });
}
/* plan editor rows inside clubSheet (UI.sheet.plans) */
function planRows() {
  const el = $("c-plans"); if (!el || !UI.sheet) return; const ps = UI.sheet.plans || (UI.sheet.plans = []);
  el.innerHTML = (ps.length ? '<div class="planrow head"><span>Name</span><span>Months</span><span>Price (₮)</span><span></span></div>' : "") + ps.map((p, i) => '<div class="planrow">' + inp("c-plan-n-" + i, p.n || "", "text", 'placeholder="' + esc(planName(p)) + '" aria-label="Name"') + inp("c-plan-m-" + i, p.months == null ? 1 : p.months, "number", 'inputmode="numeric" min="0" max="24" aria-label="Months"') + inp("c-plan-p-" + i, p.price || "", "number", 'inputmode="numeric" aria-label="Price (₮)"') + '<button type="button" class="x" data-act="plan-rm" data-i="' + i + '" aria-label="Remove">✕</button></div>').join("") + '<button type="button" class="btn ghost" data-act="plan-add">+ Add option</button>';
}
function planRead() { const ps = (UI.sheet && UI.sheet.plans) || []; return ps.map((p, i) => { const months = Math.min(24, Math.max(0, Math.round(+sv("c-plan-m-" + i) || 0))); return { id: p.id || uid(), n: sv("c-plan-n-" + i).trim(), months, price: +sv("c-plan-p-" + i) || 0, kind: months ? "sub" : "drop" }; }); }
function paySheet(id, forUid) {
  const me = myUid(); const uidFor = forUid || me; const doc = CLUB.pay[uidFor] || { items: [] }; const x = id ? doc.items.find((y) => y.id === id) : null; const P = CLUB.profile;
  const who = forUid && forUid !== me ? (CLUB.members.list.find((m) => m.uid === forUid) || {}).n : "";
  const b = (who ? '<p class="small muted">For ' + esc(who) + "</p>" : "") + '<div class="grid2">' + field("p-d", "Paid on", inp("p-d", x ? x.d : todayIso(), "date", 'max="' + todayIso() + '"')) + field("p-per", "For month", inp("p-per", x ? x.per : thisMonth(), "month")) + "</div>" +
    '<div class="grid2">' + field("p-amt", "Amount (₮)", inp("p-amt", x ? x.amt : (P.fee && P.fee.month) || "", "number", 'inputmode="numeric"')) + field("p-note", "Note", inp("p-note", x ? x.note : "", "text", 'placeholder="cash / transfer"')) + "</div>";
  openSheet(x ? "Edit payment" : "Log a payment", b, { onDelete: x ? async () => { doc.items = doc.items.filter((y) => y.id !== id && !(x.group && y.group === x.group)); CLUB.pay[uidFor] = doc; await cset("club/" + P.id + "/pay/" + uidFor, doc); render(); return true; } : null, async onSave() {
    const rec = x || { id: uid() }; rec.d = sv("p-d") || todayIso(); rec.per = sv("p-per") || thisMonth(); rec.amt = +sv("p-amt") || 0; rec.note = sv("p-note").trim(); rec.by = me;
    if (!x) doc.items.push(rec); CLUB.pay[uidFor] = doc; await cset("club/" + P.id + "/pay/" + uidFor, doc); toast("Payment logged"); render(); return true;
  } });
}
/* ======================= ACTIONS ======================= */
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-act]"); if (!el) return; const act = el.dataset.act, ds = el.dataset;
  if (act === "sheet-close") { closeSheet(); return; }
  if (act === "sheet-save") { await finishSheetSave(el); return; }
  if (act === "sheet-del") { if (armConfirmSheet(el) && UI.sheetDel) { const sheet = UI.sheet; try { if (await UI.sheetDel() !== false && UI.sheet === sheet) closeSheet(); } catch (err) { toast("Could not save: " + err.message); } } return; }
  if (act === "pick") { if (UI.sheet) UI.sheet.picks[ds.group] = ds.group === "rpe" || ds.group === "stripes" ? +ds.v : ds.v; const g = (el.parentElement || el).closest("[data-group]"); if (g) g.querySelectorAll("[data-act=pick]").forEach((b) => (b.classList.toggle("on", b === el), b.getAttribute("role") === "radio" ? b.setAttribute("aria-checked",String(b === el)) : b.setAttribute("aria-pressed",String(b === el)))); if (ds.group === "theme") { S.settings.theme = ds.v; applyTheme(); save("settings"); } if (ds.group === "tpl") { SHARE.tpl = ds.v; drawShare(); } if (ds.group === "fmt") { SHARE.fmt = ds.v; const cv = $("sh-cv"); if (cv) { const sz = shareSize(); cv.width = sz[0]; cv.height = sz[1]; } drawShare(); } if (ds.group === "lang") { S.settings.lang = ds.v; save("settings"); I18N.set(ds.v); closeSheet(); render(); } if (ds.group === "rules") { S.settings.rules = ds.v; save("settings"); } if (ds.group === "beltf") { S.settings.beltFilter = ds.v === "1"; save("settings"); } if (ds.group === "medal" && UI.comp.id) { const ev = S.comp.events.find((x) => x.id === UI.comp.id); if (ev) { ev.medal = ds.v; save("comp"); if (CLUB.id) resultSubmit(ev).then(() => { toast(ds.v ? "Sent to your coach to approve" : "Result cleared"); render(); }); } } if (ds.group === "track" && UI.sheet) { const sel = $("f-belt"); if (sel) sel.innerHTML = SEED.belts[ds.v].map((x) => '<option value="' + x.id + '">' + esc(x.n) + "</option>").join(""); } return; }
  if (act === "pk-add") { pkAdd(ds.pk, ds.id, ds.n); return; }
  if (act === "pk-inc") { pkChange(ds.pk, +ds.i, 1); return; }
  if (act === "pk-dec") { pkChange(ds.pk, +ds.i, -1); return; }
  if (act === "pk-rm") { pkChange(ds.pk, +ds.i, 0); return; }
  switch (act) {
    case "tab": { const order = TABS.map((t) => t[0]); const anim = order.indexOf(ds.v) > order.indexOf(UI.tab) ? "enter-l" : "enter-r"; UI.tab = ds.v; try { localStorage.setItem("bjj-tab", ds.v); } catch (x) {} go(anim); break; }
    case "settings": settingsSheet(); break;
    case "avatar-rm": if (UI.sheet) { UI.sheet.photoVersion = (UI.sheet.photoVersion || 0) + 1; UI.sheet.photoLoading = false; UI.sheet.av = ""; const crop = $("pf-crop"); if (crop) crop.replaceChildren(); avatarPreview(); } break;
    case "menu": menuSheet(); break;
    case "profile": if (UI.sheet) closeSheet(); if (UI.tab !== "profile") { UI.prevTab = UI.tab; UI.tab = "profile"; go("enter-l"); } break;
    case "profile-back": UI.tab = UI.prevTab && VIEWS[UI.prevTab] && UI.prevTab !== UI.tab ? UI.prevTab : "home"; UI.prevTab = null; go("enter-r"); break;
    case "profile-edit": profileEditSheet(); break;
    case "member-profile": if (UI.sheet) closeSheet(); if (!ds.uid || ds.uid === myUid()) { if (UI.tab !== "profile") { UI.prevTab = UI.tab; UI.tab = "profile"; go("enter-l"); } } else profileSheet(ds.uid); break;
    case "menu-go": closeSheet(); if (ds.v === "prog") { UI.tab = "me"; UI.seg.me = "prog"; } else if (ds.v === "club") UI.tab = "club"; else if (ds.v === "map") { UI.tab = "tech"; UI.tech.q = ""; UI.tech.view = "pos"; UI.setupEd = null; UI.tech.map = true; if (!(UI.tech.id && node(UI.tech.id))) UI.tech.id = (positions()[0] || {}).id || null; try { localStorage.setItem("bjj-map", "1"); } catch (x) {} } else if (ds.v === "belt") { UI.tab = "me"; UI.seg.me = "belt"; UI.beltPage = true; } try { localStorage.setItem("bjj-tab", UI.tab); } catch (x) {} go("enter"); break;
    case "menu-share": closeSheet(); shareSheet(null); break;
    case "menu-lang": { const l = I18N.lang === "mn" ? "en" : "mn"; S.settings.lang = l; save("settings"); I18N.set(l); closeSheet(); render(); break; }
    case "menu-settings": closeSheet(); settingsSheet(); break;
    case "menu-admin": closeSheet(); break;
    case "record": checkinSheet(true); break;
    case "rec-go": closeSheet(); if (ds.v === "sess") sessSheet(); else if (ds.v === "roll") { UI.tab = "tech"; UI.tech.id = null; UI.tech.q = ""; UI.tech.view = "pos"; UI.setupEd = null; go("enter"); } else if (ds.v === "att") checkinSheet(true); else if (ds.v === "drill") { UI.tab = "me"; UI.seg.me = "drills"; go("enter"); } else if (ds.v === "share") shareSheet(null); break;
    case "kudos": feedKudos(ds.id, ds.d); break;
    case "live-start": liveStartSheet(); break;
    case "live-inc": liveStep(ds.k, 1); break;
    case "live-dec": liveStep(ds.k, -1); break;
    case "live-pick": livePickSheet(ds.k); break;
    case "live-add": liveAdd(ds.k, ds.n); break;
    case "live-rm": liveRm(ds.k, ds.n); break;
    case "live-finish": liveFinish(); break;
    case "live-discard": if (armConfirm("live")) { liveClear(); toast("Session discarded"); render(); } break;
    case "homeseg": UI.homeSeg = ds.v; render(); break;
    case "leadby": UI.leadBy = ds.v; render(); break;
    case "leadper": UI.leadPer = ds.v; render(); break;
    case "mine-toggle": { const on = ds.on === "1"; mineToggle(ds.ids.split(","), on); toast(on ? "Added to my list" : "Removed from my list"); render(); break; }
    case "mine-rm": mineToggle(ds.ids.split(","), false); render(); break;
    case "disc-cat": { const o = (UI.discOpen = UI.discOpen || new Set()); if (o.has(ds.v)) o.delete(ds.v); else o.add(ds.v); render(); break; }
    case "mine-learn": UI.tech.view = "learn"; UI.tech.id = null; UI.rollId = null; go("enter-l"); break;
    case "auth-mode": showLogin("", ds.v === "up"); break;
    case "club-reload": CLUB.loadedFor = null; render(); break;
    case "club-new": clubSheet(false); break;
    case "club-edit": clubSheet(true); break;
    case "pay-plan": UI.payPlan = ds.v; render(); break;
    case "pay-copy": { const v = ds.v; if (navigator.clipboard) navigator.clipboard.writeText(v).then(() => toast("Copied"), () => toast(v)); else toast(v); break; }
    case "plan-add": { if (!UI.sheet) break; const ps = planRead(); const fee = (CLUB.profile && CLUB.profile.fee) || {}; if (!ps.length) ps.push(...clubPlans({ fee: { month: +sv("c-fm") || fee.month, drop: +sv("c-fd") || fee.drop } })); else ps.push({ id: uid(), n: "", months: 1, price: +sv("c-fm") || fee.month || 0, kind: "sub" }); UI.sheet.plans = ps; planRows(); break; }
    case "plan-rm": { if (!UI.sheet) break; const ps = planRead(); ps.splice(+ds.i, 1); UI.sheet.plans = ps; planRows(); break; }
    case "club-join": if (ds.open) clubJoin(ds.id, "", false); else joinSheet(ds.id, false); break;
    case "club-coach": joinSheet(ds.id, true); break;
    case "club-paynow": payNowSheet(); break;
    case "w-range": UI.wRange = ds.v; render(); break;
    case "share": shareSheet(ds.id || null); break;
    case "club-qr": qrSheet(); break;
    case "scan-start": scanStart(); break;
    case "qr-copy": { const u = ds.url; if (navigator.clipboard) navigator.clipboard.writeText(u).then(() => toast("Link copied"), () => toast(u)); else toast(u); break; }
    case "qr-share": if (navigator.share) navigator.share({ title: CLUB.profile.n, url: ds.url }).catch(() => {}); else { navigator.clipboard && navigator.clipboard.writeText(ds.url); toast("Link copied"); } break;
    case "qr-save": qrSend(true); break;
    case "share-save": shareSend(true); break;
    case "share-send": shareSend(false); break;
    case "with-toggle": if (UI.sheet) { UI.sheet.with = UI.sheet.with || []; const i = UI.sheet.with.indexOf(ds.who); if (i >= 0) UI.sheet.with.splice(i, 1); else UI.sheet.with.push(ds.who); el.classList.toggle("on", i < 0); } break;
    case "belt-page": UI.tab = "me"; UI.seg.me = "belt"; UI.beltPage = ds.v === "open" ? true : !UI.beltPage; go(UI.beltPage ? "enter-l" : "enter-r"); break;
    case "drillf": UI.drillF = ds.v; render(); break;
    case "drill-open": UI.drillOpen = UI.drillOpen === ds.id ? null : ds.id; if (UI.tab !== "me" || UI.seg.me !== "drills") { UI.tab = "me"; UI.seg.me = "drills"; UI.drillOpen = ds.id; go("enter-l"); } else render(); break;
    case "drill-done": drillDone(ds.id); break;
    case "drill-add": drillSheet(null); break;
    case "drill-edit": drillSheet(ds.id); break;
    case "club-member": if (isAdmin()) memberSheet(ds.id || null); break;
    case "memf": UI.memF = ds.v; render(); break;
    case "att-me": checkinSheet(true); break;
    case "att-tick": if (isAdmin()) { const doc = ds.date.slice(0, 7) === thisMonth() ? CLUB.attMonth : CLUB.att && CLUB.att.doc; const on = !(doc && doc.days[ds.date] && doc.days[ds.date].includes(ds.who)); attMark(ds.date, on, ds.who).then(()=>{render();attendanceSheet(ds.date,true);}); } break;
    case "club-note": if (isAdmin()) noteSheet(); break;
    case "club-note-del": if (isAdmin()) { CLUB.notes.list = CLUB.notes.list.filter((n) => n.id !== ds.id); cset("club/" + CLUB.id + "/notes", CLUB.notes).then(render); } break;
    case "club-event": if (isAdmin()) clubEventSheet(ds.id || null); break;
    case "res-ok": case "res-no": if (isAdmin()) { const r = CLUB.results.list.find((x) => x.id === ds.id); if (r) { if (act === "res-ok") { r.status = "ok"; r.okBy = myUid(); } else CLUB.results.list = CLUB.results.list.filter((x) => x !== r); cset("club/" + CLUB.id + "/results", CLUB.results).then(render); } } break;
    case "iap-buy": iapBuy(); break;
    case "club-confirm": if (isAdmin()) confirmPay(ds.uid, ds.id); break;
    case "upgrade": if (clubNeeds()) { clubLoad().then(upgradeSheet); } else upgradeSheet(); break;
    case "app-settings": if (isSuper()) appSettingsSheet(); break;
    case "club-approve": case "club-reject": if (isSuper()) { (async () => { const p = await cget("club/" + ds.id + "/profile"); const idx = (await cget("clubs/index")) || { list: [] }; if (act === "club-approve") { if (p) { p.status = "approved"; await cset("club/" + ds.id + "/profile", p); } const r = idx.list.find((x) => x.id === ds.id); if (r) r.status = "approved"; } else { idx.list = idx.list.filter((x) => x.id !== ds.id); if (p) { p.status = "rejected"; await cset("club/" + ds.id + "/profile", p); } } await cset("clubs/index", idx); CLUB.loadedFor = null; toast(act === "club-approve" ? "Approved" : "Rejected"); render(); })(); } break;
    case "up-ok": case "up-no": if (isSuper()) { (async () => { const doc = (await cget("app/upgrades")) || { list: [] }; const u = doc.list.find((x) => x.id === ds.id); if (!u) return; if (act === "up-ok") { const pro = (await cget("app/pro")) || { u: {} }; const cur = pro.u[u.uid] && pro.u[u.uid].until >= thisMonth() ? pro.u[u.uid].until : thisMonth(); const y = +cur.slice(0, 4), m = +cur.slice(5) + (+ds.m || 1); const until = (y + Math.floor((m - 1) / 12)) + "-" + pad(((m - 1) % 12) + 1); pro.u[u.uid] = { until, n: u.n }; await cset("app/pro", pro); CLUB.pro = pro; u.status = "ok"; u.until = until; } else u.status = "no"; await cset("app/upgrades", doc); CLUB.upgrades = doc; toast(act === "up-ok" ? "Upgraded" : "Rejected"); render(); })(); } break;
    case "club-codes": if (isSuper()) { (async () => { const p = await cget("club/" + ds.id + "/profile"); if (!p) return; if (!p.code) { p.code = genCode(6); p.coachCode = genCode(8); await cset("club/" + ds.id + "/profile", p); } openSheet(p.n, '<div class="codes big"><span>Club code <b>' + esc(p.code) + '</b></span><span>Coach code <b>' + esc(p.coachCode) + '</b></span></div><p class="small muted">Give the coach code to the head coach only. Members join with the club code' + (p.open ? ", or without one until a coach claims the club" : "") + ".</p>", {}); })(); } break;
    case "club-sess": if (isAdmin()) classSheet(ds.i != null && ds.i !== "" ? +ds.i : null); break;
    case "club-pay": paySheet(ds.id || null, ds.uid || null); break;
    case "club-admin": if (isAdmin()) { const P = CLUB.profile; P.admins = P.admins || []; const i = P.admins.indexOf(ds.uid); if (i >= 0) P.admins.splice(i, 1); else P.admins.push(ds.uid); cset("club/" + P.id + "/profile", P).then(render); } break;
    case "club-leave": if (UI.confirm === "leave") { UI.confirm = null; clubLeave(); } else { UI.confirm = "leave"; render(); setTimeout(() => { if (UI.confirm === "leave") { UI.confirm = null; render(); } }, 3000); } break;
    case "techview": UI.tech.view = ds.v; UI.rollId = null; render(); break;
    case "segview": UI.seg[UI.tab] = ds.v; render(); break;
    case "cal-nav": UI.calYm = ymShift(UI.calYm || todayIso().slice(0, 7), +ds.v); render(); break;
    case "anarange": UI.anaRange = ds.v; render(); break;
    case "clubseg": UI.clubSeg = ds.v; render(); break;
    case "roll-start": rollStart(ds.pos); break;
    case "roll-by": if (UI.roll) { UI.roll.by = ds.v; UI.roll.grp = null; render(); } break;
    case "add-setup": setupEdit(null, ds.pos || null); break;
    case "route-find": UI.route = { from: sv("f-rfrom"), to: sv("f-rto") }; render(); break;
    case "route-save": { const r = (UI.routeList || [])[+ds.i]; if (!r) break; UI.setupEd = { id: null, n: node(r[0].id).n + " → " + node(r[r.length - 1].id).n, x: "", steps: r.map((s) => ({ id: s.id, k: s.k, n: s.n, t: s.t || "" })) }; UI.tech.id = null; render(); break; }
    case "learn-start": learnStart(); break;
    case "learn-pick": learnPick(+ds.i); break;
    case "learn-next": learnNext(); break;
    case "learn-stop": UI.learn = null; render(); break;
    case "edit-setup": setupEdit(ds.id); break;
    case "setup-roll": { const sp = setupById(ds.id); if (sp && sp.steps[0]) { rollStart(sp.steps[0].id); UI.roll.plan = sp.id; render(); } break; }
    case "setup-step": { const E = UI.setupEd; if (!E) break; E.n = sv("f-sn"); E.x = sv("f-sx"); const n = node(ds.id); if (n) E.steps.push({ id: n.id, k: n.k, n: n.n, t: n.t || "" }); render(); break; }
    case "setup-undo": { const E = UI.setupEd; if (!E) break; E.n = sv("f-sn"); E.x = sv("f-sx"); E.steps.pop(); render(); break; }
    case "setup-cancel": UI.setupEd = null; render(); break;
    case "setup-del": { const E = UI.setupEd; if (E && E.id && armConfirm("setup:" + E.id)) { S.plans.setups = S.plans.setups.filter((x) => x.id !== E.id); save("plans"); UI.setupEd = null; toast("Deleted"); } render(); break; }
    case "setup-save": { const E = UI.setupEd; if (!E) break; E.n = sv("f-sn").trim(); E.x = sv("f-sx").trim(); if (E.steps.length < 2) { toast("Add at least one move"); break; } const rec = { id: E.id || uid(), n: E.n || setupName(E.steps), steps: E.steps, x: E.x }; const i = S.plans.setups.findIndex((x) => x.id === rec.id); if (i >= 0) S.plans.setups[i] = rec; else S.plans.setups.push(rec); save("plans"); UI.setupEd = null; UI.tech.view = "setups"; toast("Setup saved"); render(); break; }
    case "walk-phase": UI.walkCat = UI.walkCat === ds.cat && !UI.roll ? null : ds.cat; render(); break;
    case "walk-pos": if (UI.roll) rollGoto(ds.id, "gap"); else rollStart(ds.id); break;
    case "roll-pick": rollPick(ds.id); break;
    case "roll-goto": rollGoto(ds.pos, "worked"); break;
    case "roll-other": rollOtherSheet(); break;
    case "roll-rewind": rollRewind(+ds.i); break;
    case "roll-undo": if (UI.roll && UI.roll.steps.length > 1) { UI.roll.steps.pop(); const last = UI.roll.steps[UI.roll.steps.length - 1]; UI.roll.cur = last.id; const lp = UI.roll.steps.slice().reverse().find((x) => x.k === "pos"); UI.roll.pos = lp ? lp.id : UI.roll.pos; render(); } break;
    case "roll-finish": UI.roll.finished = true; rollEndSheet(true); break;
    case "roll-end": rollEndSheet(false); break;
    case "roll-cancel": if (armConfirm("roll-cancel")) { UI.roll = null; render(); } break;
    case "roll-open": UI.rollId = ds.id; go("enter-l"); break;
    case "roll-close": UI.rollId = null; go("enter-r"); break;
    case "roll-del": if (armConfirm(ds.key)) { S.rolls.items = S.rolls.items.filter((x) => x.id !== ds.id); UI.rollId = null; save("rolls"); go("enter-r"); } break;
    case "techmap": UI.tech.map = ds.v === "map"; try { localStorage.setItem("bjj-map", UI.tech.map ? "1" : "0"); } catch (x) {} render(); break;
    case "open": UI.tab = "tech"; UI.tech.id = ds.id; UI.tech.q = ""; UI.rollId = null; { const g = UI.graph["n:" + ds.id]; if (g) g.sel = null; } go("enter-l"); break;
    case "back": UI.tech.id = ds.id || null; go("enter-r"); break;
    case "add-node": nodeSheet(null, ds.p || null); break;
    case "add-entry": entrySheet(ds.id); break;
    case "edit-node": nodeSheet(ds.id); break;
    case "del-node": if (armConfirm(ds.key)) { const ids = subtreeIds(ds.id); const n = node(ds.id); S.tree.nodes = nodes().filter((x) => !ids.includes(x.id)); UI.tech.id = n && n.p ? n.p : null; save("tree"); toast("Deleted"); go("enter-r"); } break;
    case "add-plan": planSheet(); break;
    case "edit-plan": planSheet(ds.id); break;
    case "del-plan": if (armConfirm(ds.key)) { S.plans.items = S.plans.items.filter((p) => p.id !== ds.id); save("plans"); render(); } break;
    case "add-sess": sessSheet(); break;
    case "edit-sess": sessSheet(ds.id); break;
    case "t-start": tStart(); break;
    case "t-reset": tReset(); break;
    case "bodycat": UI.body.cat = ds.v; UI.body.open = null; render(); break;
    case "body-open": UI.body.open = UI.body.open === ds.id ? null : ds.id; render(); break;
    case "body-check": { const d = (UI.body.done[ds.id] = UI.body.done[ds.id] || {}); d[ds.i] = !d[ds.i]; render(); break; }
    case "body-log": blogSheet(null, ds.id); break;
    case "edit-blog": blogSheet(ds.id); break;
    case "add-routine": routineSheet(); break;
    case "edit-routine": routineSheet(ds.id); break;
    case "del-routine": if (armConfirm(ds.key)) { S.body.routines = S.body.routines.filter((r) => r.id !== ds.id); save("body"); render(); } break;
    case "belttrack": if (!isAdmin()) break; S.belt.track = ds.v; if (!SEED.belts[ds.v].some((b) => b.id === S.belt.belt)) S.belt.belt = "white"; save("belt"); render(); break;
    case "add-promo": if (isAdmin()) memberSheet(myUid()); break;
    case "edit-promo": promoSheet(ds.id); break;
    case "edit-weight": weightSheet(ds.id); break;
    case "edit-belt": if (isAdmin()) memberSheet(myUid()); break;
    case "del-promo": if (armConfirm(ds.key)) { S.belt.history = S.belt.history.filter((x) => x.id !== ds.id); save("belt"); render(); } break;
    case "goal-toggle": { const g = (S.belt.goals[S.belt.belt] || []).find((x) => x.id === ds.id); if (g) { g.done = !g.done; save("belt"); render(); } break; }
    case "del-goal": if (armConfirm(ds.key)) { S.belt.goals[S.belt.belt] = (S.belt.goals[S.belt.belt] || []).filter((x) => x.id !== ds.id); save("belt"); render(); } break;
    case "seed-goals": S.belt.goals[S.belt.belt] = (SEED.beltGoals[S.belt.belt.split("-")[0]] || []).map((t) => ({ id: uid(), t, done: false })); save("belt"); render(); break;
    case "w-target": S.weight.target = S.weight.target === ds.v ? "" : ds.v; save("weight"); render(); break;
    case "del-weight": if (armConfirm(ds.key)) { S.weight.items = S.weight.items.filter((x) => x.id !== ds.id); save("weight"); render(); } break;
    case "add-event": eventSheet(); break;
    case "edit-event": eventSheet(ds.id); break;
    case "open-event": UI.comp.id = ds.id; go("enter-l"); break;
    case "close-event": UI.comp.id = null; go("enter-r"); break;
    case "del-event": if (armConfirm(ds.key)) { S.comp.events = S.comp.events.filter((x) => x.id !== ds.id); UI.comp.id = null; save("comp"); go("enter-r"); } break;
    case "add-match": matchSheet(ds.id, null); break;
    case "edit-match": matchSheet(ds.id, +ds.i); break;
    case "backup": download("bjj-backup-" + todayIso() + ".json", JSON.stringify(S, null, 2)); break;
    case "reset-seed": if (UI.confirm === "reset") { UI.confirm = null; seedAll(true); save("tree"); save("plans"); save("body"); UI.tech.id = null; closeSheet(); render(); toast("Starter library loaded"); } else { UI.confirm = "reset"; settingsSheet(); setTimeout(() => { if (UI.confirm === "reset") { UI.confirm = null; if (UI.sheet) settingsSheet(); } }, 3500); } break;
    case "logout": if (UI.confirm === "logout") { SB.storeSession(null); location.reload(); } else { UI.confirm = "logout"; menuSheet(); setTimeout(() => { if (UI.confirm === "logout") { UI.confirm = null; if (UI.sheet) menuSheet(); } }, 3500); } break;
  }
});
function armConfirmSheet(btn) { if (btn.dataset.armed) return true; btn.dataset.armed = "1"; btn.textContent = "Delete?"; setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = "Delete"; } }, 3500); return false; }
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id === "tq") { UI.tech.q = t.value; const m = $("main"); const h = VIEWS.tech(); m.innerHTML = h; initGraphs(); const q = $("tq"); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } return; }
  if (t.id === "dq") { UI.discQ = t.value; const m = $("main"); m.innerHTML = VIEWS.tech(); initGraphs(); const q = $("dq"); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } return; }
  if (t.dataset.pk) { pkSuggest(t); return; }
  if (t.dataset.tcfg) { const v = +t.value; if (v >= 0) { S.settings.timer[t.dataset.tcfg] = v; save("settings"); if (!T.on && !T.left) renderTimer(); } return; }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.id === "w-cls") { S.weight.cls = t.value; S.weight.target = ""; save("weight"); render(); }
  if (t.id === "imp-file" && t.files[0]) importBackup(t.files[0]);
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "goal-form") { e.preventDefault(); const v = sv("goal-t").trim(); if (!v) return; (S.belt.goals[S.belt.belt] = S.belt.goals[S.belt.belt] || []).push({ id: uid(), t: v, done: false }); save("belt"); render(); }
  if (e.target.id === "w-form") { e.preventDefault(); const kg = +sv("w-kg"); const d = sv("w-d") || todayIso(); if (!kg) { $("w-kg").focus(); return; } const ex = S.weight.items.find((x) => x.d === d); if (ex) ex.kg = kg; else S.weight.items.push({ id: uid(), d, kg }); save("weight"); toast("Weight logged"); render(); }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && UI.sheet) closeSheet(); });
document.addEventListener("change", async (e) => { if (e.target.id === "att-date" && isAdmin()) { UI.attDate = e.target.value; const ym = UI.attDate.slice(0, 7); if (ym !== thisMonth() && !(CLUB.att && CLUB.att.ym === ym)) CLUB.att = { ym, doc: (await cget("club/" + CLUB.id + "/att/" + ym)) || { days: {} } }; render(); } });
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && UI.sheet && e.target.tagName === "INPUT" && String(e.target.dataset.pk || "").startsWith("live-") && e.target.value.trim()) { e.preventDefault(); liveAdd(e.target.dataset.pk.slice(5), e.target.value); return; } if (e.key === "Enter" && UI.sheet && e.target.tagName === "INPUT" && !e.target.dataset.pk && e.target.type !== "textarea") { e.preventDefault(); finishSheetSave(); } });

/* ---------- Arrow: identity, privacy, friends, notices and mobile flows ---------- */
const A = window.ARROW;
function myAge() { return A.age(S.settings.birthDate, todayIso()); }
function socialOn() { const n = myAge(); return n !== null && n >= 13; }
function socialName(m) { return m && m.username ? '@' + m.username : 'Member'; }
function ageFields(prefix) { return field(prefix + '-dob', 'Date of birth', inp(prefix + '-dob', S.settings.birthDate || '', 'date', 'required max="' + todayIso() + '"')) + '<p class="muted small">Your age is private. Only you and your coaches can see it.</p>'; }
function ageGate() { return '<form id="arrow-age" class="card"><h2>Complete your profile</h2><p>Enter your date of birth to continue.</p>' + ageFields('age') + '<button class="btn wide" type="submit">Continue</button></form>'; }
const normalizeBase = normalize;
normalize = function () { normalizeBase(); const ss = SB.session || {}; if (!S.settings.name && ss.name) S.settings.name = ss.name; if (!S.settings.birthDate && ss.birthDate) S.settings.birthDate = ss.birthDate; if (!S.settings.username) S.settings.username = ss.username || A.username(loginName(ss.email || '')); };
myHandle = function () { return S.settings.username || A.username(loginName((SB.session || {}).email || '')) || 'me'; };
const renderBase = render;
render = function (anim) { if (myAge() === null || !contactComplete()) { renderHeader(); renderTabs(); $('main').innerHTML = onboardingForm(); return; } if (clubNeeds() && !CLUB.busy) clubLoad(); renderBase(anim); updateNoticeBadge(); };
renderHeader = function () { const el = $('hdr-av'); if (el) el.innerHTML = avatarInner(myName(), S.settings.avatar); $('title').textContent = 'Arrow'; };
const syncBase = setSync;
setSync = function () { const el = $('sync'); if (el) el.remove(); };
function privateAgeSummary(m) { const n = CLUB.privateAges && CLUB.privateAges[m.uid || m.id]; return n == null ? 'Age not shared yet' : n + ' нас'; }
async function prepareCoachAgeKey() {
  if (!isAdmin()) return;
  S.settings.coachAgeKeys = S.settings.coachAgeKeys || {};
  let k = S.settings.coachAgeKeys[CLUB.id];
  if (!k) { k = await A.newAgeKey(); S.settings.coachAgeKeys[CLUB.id] = k; if (mode === 'cloud') await SB.set(NS() + 'settings', clone(S.settings)); else save('settings'); }
  CLUB.profile.ageKeys = CLUB.profile.ageKeys || {};
  if (!CLUB.profile.ageKeys[myUid()]) { CLUB.profile.ageKeys[myUid()] = k.publicKey; await cset('club/' + CLUB.id + '/profile', CLUB.profile); }
}
async function sealMemberAge(m, dob) {
  m.ageSealed = m.ageSealed || {};
  for (const coach of CLUB.profile.admins || []) { const key = (CLUB.profile.ageKeys || {})[coach]; if (key) m.ageSealed[coach] = await A.sealAge(dob, key); }
}
async function readCoachAges() {
  CLUB.privateAges = {};
  if (!isAdmin()) return;
  const key = ((S.settings.coachAgeKeys || {})[CLUB.id] || {}).privateKey;
  for (const m of CLUB.members.list || []) { const n = await A.openAge((m.ageSealed || {})[myUid()], key); if (n !== null) CLUB.privateAges[m.uid || m.id] = n; }
}
const updateMeBase = clubUpdateMe;
clubUpdateMe = async function () {
  if (!CLUB.id || !CLUB.members) return;
  await updateMeBase();
  const m = CLUB.members.list.find((x) => x.uid === myUid()); if (!m) return;
  m.username = myHandle(); m.socialAllowed = socialOn();
  if (myAge() !== null) await sealMemberAge(m, S.settings.birthDate);
  m.track = myTrack();
  if (contactComplete()) m.privateProfile = await A.sealPayload({phone:S.settings.phone,address:S.settings.address,social:S.settings.socialAddress || ''}, coachPublicKeys());
  if (socialOn()) { if (!S.settings.socialKey) { S.settings.socialKey = await A.newAgeKey(); save('settings'); } m.socialPublicKey = S.settings.socialKey.publicKey; }
  await cset('club/' + CLUB.id + '/members', CLUB.members);
};
const clubLoadBase = clubLoad;
clubLoad = async function () {
  if (FEED.club !== (S.settings.clubId || null)) feedReset(S.settings.clubId || null);
  await clubLoadBase();
  if (!CLUB.id || CLUB.err) return;
  try {
    await prepareCoachAgeKey();
    if (myAge() !== null) await clubUpdateMe();
    await readCoachAges(); await readPrivateProfiles();
    CLUB.friends = socialOn() ? (await cget('club/' + CLUB.id + '/friends')) || { list: [] } : { list: [] };
    await decryptFeed(); FEED.ready = true; checkNotices(); render();
  } catch (e) { toast('Could not update your club profile'); console.warn(e); }
};
profileEditSheet = function () {
  const body = '<div class="avpick"><span class="av xl" id="pf-av">' + avatarInner(myName(), S.settings.avatar) + '</span><div class="avpick-b"><label for="pf-photo" class="btn ghost">Choose a photo</label><input id="pf-photo" type="file" accept="image/*" hidden><button class="btn ghost" data-act="avatar-rm"' + (S.settings.avatar ? '' : ' hidden') + '>Remove photo</button></div></div>' +
    '<div id="pf-crop" class="profile-crop"></div>' + field('f-name', 'Real name', inp('f-name', S.settings.name || '', 'text', 'required autocomplete="name" placeholder="Бат-Эрдэнэ"')) +
    field('f-username', 'Social username', inp('f-username', myHandle(), 'text', 'required autocapitalize="none" pattern="[a-z0-9][a-z0-9._-]{2,29}"')) + ageFields('pf') + field('f-bio', 'Bio', ta('f-bio', S.settings.bio || '', '')) + contactFields();
  openSheet('Edit profile', body, { state: { av: S.settings.avatar || '' }, saveLabel: 'Done', async onSave() {
    if (UI.sheet.photoLoading) return false;
    const name = sv('f-name').trim(), username = A.username(sv('f-username')), dob = sv('pf-dob');
    if (!name || !A.validUsername(username) || A.age(dob, todayIso()) === null || !validContact(sv('pf-phone'),sv('pf-address'))) { toast('Check your name, username, birth date and contact details'); return false; }
    if (((CLUB.members || {}).list || []).some((m) => m.uid !== myUid() && m.username === username)) { toast('This username is already used in your club'); return false; }
    Object.assign(S.settings, { name, username, birthDate: dob, bio: sv('f-bio').trim().slice(0, 300), avatar: UI.sheet.av || '', phone: sv('pf-phone').trim(), address: sv('pf-address').trim(), socialAddress: sv('pf-social').trim(), onboardingComplete: true }); save('settings');
    if (CLUB.id) { const member = (CLUB.members.list || []).find((m)=>m.uid===myUid()); if (member) member.n = name; await clubUpdateMe(); } render(); return true;
  }});
  $('pf-photo').addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; const sheet = UI.sheet, version = sheet.photoVersion = (sheet.photoVersion || 0) + 1; sheet.photoLoading = true; try { await window.ARROW_PHOTO.crop($('pf-crop'), f, (av) => { if (UI.sheet === sheet && sheet.photoVersion === version) { sheet.photoLoading = false; sheet.av = av; avatarPreview(); } }, () => UI.sheet === sheet && sheet.photoVersion === version); } catch (_) { toast('Could not read the photo'); } finally { if (UI.sheet === sheet && sheet.photoVersion === version) sheet.photoLoading = false; } e.target.value = ''; });
};
const memberSheetBase = memberSheet;
memberSheet = function (id) {
  if (!isAdmin()) return;
  memberSheetBase(id);
  const m = ((CLUB.members || {}).list || []).find((x) => x.id === id || x.uid === id);
  const h = document.createElement('p'); h.className = 'tip'; h.textContent = m ? privateAgeSummary(m) : 'Age is shared privately after the member completes their profile.'; $('sheet-body').insertBefore(h, $('sheet-body').querySelector('.foot'));
  const oldSave = UI.sheetSave;
  UI.sheetSave = async function () { const done = await oldSave(); if (done) await readCoachAges(); return done; };
};
const profileViewBase = VIEWS.profile;
VIEWS.profile = function () { let h = profileViewBase(); if (!socialOn()) h = h.replace(/<div class="pf-row">[\s\S]*?<\/div>/, ''); else h = h.replace('<h2>' + esc(myName()) + '</h2>', '<h2>@' + esc(myHandle()) + '</h2>'); h=h.replace(/<p class="handle-name">[\s\S]*?<\/p>/,''); return h; };
const profileSheetBase = profileSheet;
profileSheet = function (id) { if (!socialOn()) return; const m = (CLUB.members.list || []).find((x) => x.uid === id); if (!m || m.socialAllowed !== true) return; profileSheetBase(id); const title = $('sheet-body').querySelector('.pf h2'); if (title) title.textContent = socialName(m); const foot = $('sheet-body').querySelector('.foot'); foot.insertAdjacentHTML('beforebegin', friendButton(id)); };
const feedPostBase = feedPost;
feedPost = async function (rec) { if (!socialOn()) return; return feedPostBase(rec); };
const feedKudosBase = feedKudos;
feedKudos = async function (id, d) { if (!socialOn()) return; return feedKudosBase(id, d); };
function eligiblePosts() { const ids = new Set(((CLUB.members || {}).list || []).filter((m) => m.socialAllowed === true).map((m) => m.uid)); return (CLUB.feed || []).filter((p) => ids.has(p.uid)); }
const feedCardBase = feedCard;
feedCard = function (p) { const m = ((CLUB.members || {}).list || []).find((m) => m.uid === p.uid); return feedCardBase(Object.assign({}, p, { n: p.uid === myUid() ? '@' + myHandle() : socialName(m), with: [] })); };
const leadRowsBase = leadRows;
leadRows = function () { if (!socialOn()) return []; const old = CLUB.feed; CLUB.feed = eligiblePosts(); const rows = leadRowsBase(); CLUB.feed = old; return rows.map((r) => Object.assign(r, { n: r.uid === myUid() ? '@' + myHandle() : socialName((CLUB.members.list || []).find((m) => m.uid === r.uid)) })); };
VIEWS.home = function () {
  let h = liveOn() ? liveCard() + weekCard() : weekCard() + liveCard();
  if (!socialOn()) return h + '<div class="card"><h3>My training</h3><p class="muted small">Your training stays private.</p></div>';
  if (clubNeeds()) return h;
  if (!CLUB.id) return h + '<div class="card"><p class="empty">Join a club to see your teammates’ training.</p><button class="btn wide" data-act="tab" data-v="club">Find my club</button></div>';
  if (!FEED.ready) return h;
  return h + suggestedFriends() + '<div class="feed-heading"><h3>Training feed</h3></div><section id="feed-list" aria-label="Training feed">' + unifiedPosts().map(feedCard).join('') + '</section><div id="feed-tail"></div>';
};
function unifiedPosts() { const friends=new Set(acceptedFriends()); return eligiblePosts().filter(p => p.audience !== 'private' && (p.audience !== 'friends' || p.uid === myUid() || friends.has(p.uid))).sort(window.ARROW_FEED.compare); }
function friendship(id) { return (((CLUB.friends || {}).list) || []).find((r) => (r.from === myUid() && r.to === id) || (r.to === myUid() && r.from === id)); }
function friendButton(id) { const r = friendship(id); const act = r && r.status === 'accepted' ? 'remove' : r ? (r.to === myUid() ? 'accept' : 'cancel') : 'request'; return '<button class="btn ghost" data-act="arrow-friend" data-uid="' + esc(id) + '" data-v="' + act + '">' + ({remove:'Remove friend',accept:'Accept friend',cancel:'Cancel request',request:'Add friend'})[act] + '</button>'; }
function friendsView() { if (!CLUB.id) return '<div class="card"><p>Join a club to add friends.</p></div>'; const members = (CLUB.members.list || []).filter((m) => m.uid && m.uid !== myUid() && m.socialAllowed === true); return '<div class="card"><h3>Friends</h3><div class="list">' + (members.length ? members.map((m) => { const r = friendship(m.uid); return '<div class="row">' + avatarHtml(socialName(m), m.av, 'sm') + '<div class="txt"><b>' + esc(socialName(m)) + '</b><small>' + (r ? r.status === 'accepted' ? 'Friends' : 'Friend request' : 'Club member') + '</small></div>' + friendButton(m.uid) + '</div>'; }).join('') : '<p class="empty">No members available yet.</p>') + '</div></div>'; }
async function friendAction(id, action) {
  if (!socialOn() || !CLUB.id || id === myUid()) return;
  const target = (CLUB.members.list || []).find((m) => m.uid === id && m.socialAllowed === true); if (!target) return;
  const path = 'club/' + CLUB.id + '/friends', doc = await cget(path) || { list: [] };
  const r = doc.list.find((r) => (r.from === myUid() && r.to === id) || (r.to === myUid() && r.from === id));
  if (action === 'accept') { if (!r || r.to !== myUid() || r.status !== 'pending') return; r.status = 'accepted'; }
  else if (action === 'remove' || action === 'cancel') doc.list = doc.list.filter((x) => x !== r);
  else if (!r) doc.list.push({ id: uid(), from: myUid(), to: id, status: 'pending', at: Date.now() });
  const discovering=$('sheet').classList.contains('discover-sheet'); await cset(path, doc); CLUB.friends = doc; if (UI.sheet) closeSheet(); render(); if(discovering)openDiscover();
}
function unreadNotices() { const seen = ((S.settings.noticeSeen || {})[CLUB.id]) || []; return ((CLUB.notes || {}).list || []).filter((n) => !seen.includes(n.id)); }
function updateNoticeBadge() { const b = $('arrow-notices'); if (!b) return; const n = unreadNotices().length; b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>' + (n ? '<span class="notice-count">' + n + '</span>' : ''); b.setAttribute('aria-label', 'Club notifications' + (n ? ': ' + n : '')); }
let noticePoll = null;
function checkNotices() { updateNoticeBadge(); if (!noticePoll) noticePoll = setInterval(async () => { if (!CLUB.id || document.hidden) return; try { const old = new Set(((CLUB.notes || {}).list || []).map((n)=>n.id)); CLUB.notes = await cget('club/' + CLUB.id + '/notes') || { list: [] }; if (isAdmin()) { const rows=await clist('club/'+CLUB.id+'/pay/'); for(const row of rows) CLUB.pay[row.path.split('/').pop()]=row.data; } const fresh = CLUB.notes.list.filter((n)=>!old.has(n.id)); if ('Notification' in window && Notification.permission === 'granted') for (const n of fresh) new Notification('Arrow · ' + ((CLUB.profile || {}).n || 'Club'), { body: n.text, tag: n.id }); updateNoticeBadge(); } catch (_) {} }, 30000); }
function noticesSheet() { const notes = ((CLUB.notes || {}).list || []).slice().reverse(); openSheet('Club notifications', ('Notification' in window ? '<button class="btn ghost wide" data-act="arrow-notify-enable">Enable phone notifications</button>' : '') + '<div class="list">' + (notes.length ? notes.map((n) => '<div class="row"><div class="txt"><b>' + esc(n.text) + '</b><small>' + fmtD(n.d) + '</small></div></div>').join('') : '<p class="empty">No notices yet.</p>') + '</div>', {saveLabel:'Done',onSave(){ S.settings.noticeSeen = S.settings.noticeSeen || {}; S.settings.noticeSeen[CLUB.id] = notes.map((n) => n.id); save('settings'); updateNoticeBadge(); return true; }}); }
const refreshBase = refresh;
refresh = async function () { await refreshBase(); if (S.settings.clubId && !CLUB.busy) await clubLoad(); };
const liveAddBase = liveAdd;
liveAdd = function (key, name) { const l = liveOn(); const n = String(name || '').trim(); if (!l || !n) return; const items = l[key] || []; const i = items.lastIndexOf(''); if (i >= 0) { items[i] = n; save('settings'); closeSheet(); liveRender(); } else liveAddBase(key, n); };
const liveStepBase = liveStep;
liveStep = function (key, d) { if (key !== 'rolls' && d > 0) { const l = liveOn(); if (!l || !['subs','taps','tech'].includes(key)) return; (l[key] = l[key] || []).push(''); save('settings'); liveRender(); return; } return liveStepBase(key, d); };
const liveCardBase = liveCard;
liveCard = function () { let h = liveCardBase(); for (const key of ['subs','taps','tech']) { h = h.replace('data-act="live-pick" data-k="' + key + '" aria-label="Add one"', 'data-act="live-inc" data-k="' + key + '" aria-label="Add one"'); const marker = '<span class="lbl">' + ({subs:'Submissions',taps:'Taps',tech:'Techniques'})[key] + '</span>'; h = h.replace(marker, marker + '<button class="live-detail" data-act="live-pick" data-k="' + key + '">Choose technique</button>'); } return h; };
const liveNamesBase = liveNames;
liveNames = function (list) { return liveNamesBase(list).map((x) => x.n ? x : Object.assign(x, { n: 'Unspecified' })); };
// Keep unspecified counts through the finish editor; analytics counts quantities, not distinct names.
const liveFinishBase = liveFinish;
liveFinish = function () { const l = liveOn(); if (!l) return; for (const k of ['subs','taps','tech']) l[k] = (l[k] || []).map((n) => n || 'Unspecified'); liveFinishBase(); };
function scheduleGroup(x) { return x.group || (x.kind === 'kids' ? 'kids' : x.kind === 'open' ? 'all' : 'adult'); }
function scheduleFor(date) { const d = (new Date(date + 'T12:00:00').getDay() + 6) % 7; return ((CLUB.profile || {}).schedule || []).filter((x) => +x.d === d && (scheduleGroup(x) === 'all' || scheduleGroup(x) === myTrack())); }
function calendarEvents(date) { const xs = scheduleFor(date); return '<div class="cal-marks">' + (xs.some((x) => x.kind === 'open') ? '<i class="openmat" title="Open mat"></i>' : '') + (xs.some((x) => x.kind !== 'open' && scheduleGroup(x) === 'kids') ? '<i class="kids" title="Kids class"></i>' : '') + (xs.some((x) => x.kind !== 'open' && scheduleGroup(x) !== 'kids') ? '<i class="adult" title="Adult class"></i>' : '') + '</div>'; }
function calendarLegend() { return '<p class="cal-legend"><span class="'+myTrack()+'">'+(myTrack()==='kids'?'Kids':'Adults')+'</span><span class="openmat">Open mat</span></p>'; }
const progCalendarBase = progCalendar;
progCalendar = function (ym) { const c = progCalendarBase(ym); c.html = c.html.replace(/<b class="([^"]*)">(\d+)<\/b>/g, (_, cls, day) => '<button class="cal-date ' + cls + '" data-act="arrow-day" data-d="' + ym + '-' + pad(day) + '">' + day + calendarEvents(ym + '-' + pad(day)) + '</button>'); c.html += calendarLegend(); return c; };
const attCalendarBase = attCalendar;
attCalendar = function (who, ym) { const cal = attCalendarBase(who, ym); cal.html = cal.html.replace(/<b class="([^"]*)">(\d+)<\/b>/g, (_, cls, day) => '<button class="cal-date ' + cls + '" data-act="arrow-day" data-d="' + ym + '-' + pad(day) + '">' + day + calendarEvents(ym + '-' + pad(day)) + '</button>') + calendarLegend(); return cal; };
function calendarDay(date) { const xs = scheduleFor(date).sort((a,b)=>String(a.t).localeCompare(String(b.t))); openSheet(fmtLong(date), '<div class="list">' + (xs.length ? xs.map((x) => '<div class="row"><b>' + esc(x.t) + '</b><div class="txt"><b>' + esc(x.n || KIND[x.kind]) + '</b><small>' + (x.kind === 'open' ? 'Open mat' : scheduleGroup(x) === 'kids' ? 'Kids' : scheduleGroup(x) === 'all' ? 'All ages' : 'Adults') + '</small></div></div>').join('') : '<p class="empty">No class scheduled.</p>') + '</div>', {}); }
vClubSched = function (P, adm) { const all = (P.schedule || []).slice().sort((a,b)=>a.d-b.d || String(a.t).localeCompare(String(b.t))); let h = ''; for (const [group,title] of [['kids','Kids classes'],['adult','Adult classes'],['all','Open mats / all ages']]) { if(!adm && group!==myTrack() && group!=='all')continue; const xs = all.filter((x)=>scheduleGroup(x)===group); h += '<div class="card"><h3>' + title + '</h3><div class="list">' + (xs.length ? xs.map((x) => '<button class="row" data-act="' + (adm?'club-sess':'none') + '" data-i="' + all.indexOf(x) + '"><div class="txt"><b>' + DAYS[x.d] + ' ' + esc(x.t) + '</b><small>' + esc(x.n || KIND[x.kind]) + '</small></div>' + CHEV + '</button>').join('') : '<p class="empty">No classes yet.</p>') + '</div></div>'; } return h + (adm?'<button class="btn ghost wide" data-act="club-sess">+ Add a class or open mat</button>':'') + vOpenMats(P.id) + vCompCal(adm); };
const classSheetBase = classSheet;
classSheet = function (i) { if (!isAdmin()) return; const all = (CLUB.profile.schedule || []).slice().sort((a,b)=>a.d-b.d || String(a.t).localeCompare(String(b.t))); const x = i == null ? null : all[i]; classSheetBase(i); const extra = document.createElement('div'); extra.innerHTML = '<div class="field"><span class="lbl">Class group</span>' + chips('agegroup', [['kids','Kids'],['adult','Adults'],['all','All ages']], x ? scheduleGroup(x) : 'adult') + '</div>'; $('sheet-body').insertBefore(extra,$('sheet-body').querySelector('.foot')); UI.sheet.picks.agegroup = x ? scheduleGroup(x) : 'adult'; const old = UI.sheetSave; UI.sheetSave = async function () { const group = pickVal('agegroup','adult'); const result = await old(); if (result) { const rec = x || CLUB.profile.schedule[CLUB.profile.schedule.length-1]; rec.group = rec.kind === 'kids' ? 'kids' : rec.kind === 'open' ? 'all' : group; await cset('club/' + CLUB.id + '/profile',CLUB.profile); render(); } return result; }; };
const shareSheetBase = shareSheet;
shareSheet = function (id, fmt) { shareSheetBase(id, fmt); if (!$('sh-cv')) return; const foot = $('sheet-body').querySelector('.foot'); foot.innerHTML = '<button class="btn wide" data-act="sheet-close">Done</button>'; };
document.addEventListener('submit', async (e) => { if (e.target.id !== 'arrow-age') return; e.preventDefault(); const dob = sv('age-dob'); if (A.age(dob,todayIso()) === null) { toast('Enter a valid date of birth'); return; } if (!validContact(sv('pf-phone'),sv('pf-address')) || !(sv('on-name').trim()||S.settings.name) || !A.validUsername(sv('on-user')||S.settings.username)) { toast('Complete your name and contact details'); return; } Object.assign(S.settings,{birthDate:dob,name:sv('on-name').trim()||S.settings.name,username:A.username(sv('on-user')||S.settings.username),phone:sv('pf-phone').trim(),address:sv('pf-address').trim(),socialAddress:sv('pf-social').trim(),onboardingComplete:true}); const button=e.target.querySelector('button[type="submit"]'); if(button?.disabled)return;buttonBusy(button,true,'Хадгалж байна…');try{save('settings');await flush('settings'); if (CLUB.id) { await clubUpdateMe(); await readPrivateProfiles(); } else if (S.settings.clubId) await clubLoad(); await window.ARROW_UI.wait(button);render();}catch(err){toast('Could not save: '+err.message);}finally{buttonBusy(button,false);} });
document.addEventListener('click', (e) => { const b=e.target.closest('[data-act]'); if (!b) return; if (b.dataset.act === 'arrow-notify-enable' && 'Notification' in window) Notification.requestPermission().then((p)=>toast(p === 'granted' ? 'Notifications enabled' : 'Allow notifications in your browser')); if (b.dataset.act === 'arrow-friend') friendAction(b.dataset.uid,b.dataset.v).catch(()=>toast('Could not save your friend request')); if (b.dataset.act === 'arrow-day') calendarDay(b.dataset.d); if (b.dataset.act === 'arrow-notices') noticesSheet(); });

/* Arrow mobile refresh: membership, onboarding and audience-aware social. */
function myTrack() { const n = myAge(); return n !== null && n < 16 ? 'kids' : 'adult'; }
function mySchedule() { return ((CLUB.profile || {}).schedule || []).filter(x=>scheduleGroup(x)==='all'||scheduleGroup(x)===myTrack()); }
function validContact(phone,address) { return String(phone||'').replace(/\D/g,'').length>=8 && String(address||'').trim().length>=5; }
function contactComplete() { return validContact(S.settings.phone,S.settings.address); }
function contactFields() { return '<section class="form-section"><h3>Contact details</h3><p class="muted small">Private to you and your coaches</p>' + field('pf-phone','Phone number',inp('pf-phone',S.settings.phone||'','tel','required autocomplete="tel" placeholder="99112233"')) + field('pf-address','Home address',ta('pf-address',S.settings.address||'','Дүүрэг, хороо, гудамж, байр — кириллээр бичнэ үү')) + field('pf-social','Social profile (optional)',inp('pf-social',S.settings.socialAddress||'','text','placeholder="Instagram / Facebook"')) + '</section>'; }
function onboardingForm() { return '<form id="arrow-age" class="card onboarding"><span class="eyebrow">WELCOME TO ARROW</span><h2>Your first step onto the mat</h2><p class="muted">Complete your member details so your coach can help you.</p>' + (S.settings.name?'':field('on-name','Real name',inp('on-name','','text','required autocomplete="name"'))+'<p class="muted small">Нэрээ кирилл үсгээр бичнэ үү.</p>') + (S.settings.username?'':field('on-user','Social username',inp('on-user','','text','required autocapitalize="none"'))) + ageFields('age') + contactFields() + '<button class="btn wide" type="submit">Complete profile</button></form>'; }
function coachPublicKeys() { const keys={}; for (const id of (CLUB.profile||{}).admins||[]) if ((CLUB.profile.ageKeys||{})[id]) keys[id]=CLUB.profile.ageKeys[id]; return keys; }
async function readPrivateProfiles() { CLUB.privateProfiles={}; if (!isAdmin()) return; const key=((S.settings.coachAgeKeys||{})[CLUB.id]||{}).privateKey; for (const m of CLUB.members.list||[]) { const value=await A.openPayload(m.privateProfile,myUid(),key); if(value) CLUB.privateProfiles[m.uid||m.id]=value; } }
function acceptedFriends() { return (((CLUB.friends||{}).list)||[]).filter(r=>r.status==='accepted'&&(r.from===myUid()||r.to===myUid())).map(r=>r.from===myUid()?r.to:r.from); }
async function decryptFeed() { const rows=[]; for(const post of feedMerged()) { if(!post.sealed){rows.push(post);continue;} const body=await A.openPayload(post.sealed,myUid(),(S.settings.socialKey||{}).privateKey); if(body) rows.push(Object.assign(body,{kudos:post.kudos||[]})); } CLUB.feed=rows; }
feedPost = async function(rec, previousDate) {
  if(!socialOn()||!CLUB.id) return;
  if (previousDate && previousDate.slice(0,7) !== rec.d.slice(0,7)) await feedRemove(rec.id,previousDate);
  const path='club/'+CLUB.id+'/feed/'+rec.d.slice(0,7), doc=await cget(path)||{list:[]}; const old=doc.list.find(p=>p.id===rec.id); doc.list=doc.list.filter(p=>p.id!==rec.id);
  if(rec.audience==='private') { FEED.raw.delete(rec.id); await cset(path,doc); feedCache(rec.d.slice(0,7),doc); await decryptFeed(); if(UI.tab==='home')render(); return; }
  let post=feedPostOf(rec); post.audience=rec.audience||'public'; post.kudos=old&&old.kudos||[]; post.t=old&&old.t||post.t;
  if(post.audience==='friends') {
    CLUB.friends=await cget('club/'+CLUB.id+'/friends')||{list:[]};
    const keys={}; keys[myUid()]=S.settings.socialKey.publicKey;
    const ids=new Set(acceptedFriends()); for(const m of CLUB.members.list) if(ids.has(m.uid)&&m.socialAllowed&&m.socialPublicKey) keys[m.uid]=m.socialPublicKey;
    post={id:post.id,uid:post.uid,d:post.d,t:post.t,audience:'friends',kudos:post.kudos,sealed:await A.sealPayload(post,keys)};
  }
  doc.list.push(post); doc.list=doc.list.slice(-400); await cset(path,doc); FEED.raw.set(post.id,post); feedCache(rec.d.slice(0,7),doc); await decryptFeed(); if(UI.tab==='home')render();
};
const ossSave=feedKudos;
feedKudos=async function(id,d){await ossSave(id,d);await decryptFeed();render();};
const beltView=VIEWS.belt;
VIEWS.belt=function(){ let h=beltView(); if(!isAdmin()) h=h.replace(/<div class="actions"><button class="btn" data-act="add-promo">[\s\S]*?<\/div>/g,'<p class="muted small">Your coach manages your belt</p>').replace(/data-act="edit-promo"/g,'data-act="none"').replace(/data-act="belttrack"/g,'data-act="none"'); return h; };
const profileSheetEdit=profileEditSheet;
profileEditSheet=function(){profileSheetEdit();$('sheet').classList.add('modern-sheet');$('sheet-body').querySelector('h2').insertAdjacentHTML('afterend','<p class="muted small">Your identity on and off the mat.</p>');};
const closeOld=closeSheet;
closeSheet=function(){closeOld();$('sheet').classList.remove('modern-sheet','share-sheet','training-sheet','start-sheet','discover-sheet');};
const sessionEdit=sessSheet;
sessSheet=function(id,prefill){sessionEdit(id,prefill);$('sheet').classList.add('modern-sheet','training-sheet');};
const memberEdit=memberSheet;
memberSheet=function(id){memberEdit(id);if(!UI.sheet||!isAdmin())return;const m=CLUB.members.list.find(m=>m.id===id||m.uid===id);if(!m)return;const info=(CLUB.privateProfiles||{})[m.uid||m.id];if(info&&$('m-phone'))$('m-phone').value=info.phone||'';const foot=$('sheet-body').querySelector('.foot');foot.insertAdjacentHTML('beforebegin',(info?'<section class="private-contact"><h3>Member details</h3><p>'+esc(info.phone)+'<br>'+esc(info.address||'')+(info.social?'<br>'+esc(info.social):'')+'</p></section>':'')+(isClubCoach(m.uid)?'':'<button class="btn ghost wide" data-act="coach-record-payment" data-uid="'+esc(m.uid||m.id)+'">Record payment</button>'));};
const plansLegacy=clubPlans;
clubPlans=function(P,track){P=P||{};track=track||myTrack();const custom=(P.plans||[]).filter(p=>(p.group||'adult')===track||p.group==='all');if(custom.length)return custom.filter(p=>+p.price>0);const fee=P.fee||{};return plansLegacy({fee:{month:track==='kids'?fee.kidsMonth:fee.month,drop:track==='kids'?fee.kidsDrop:fee.drop}}).map(p=>Object.assign({},p,{id:track+'-'+p.id,group:track}));};
function paymentUntil(x){if(x.end)return x.end;if(x.drop)return x.d;return addDays(addMonth(x.per,1)+'-01',-1);}
function isClubCoach(id) { return !!(CLUB.profile && (CLUB.profile.admins || []).includes(id)); }
membership=function(id){if(isClubCoach(id))return{state:'active',text:'Coach · Active',coach:true,days:Infinity};const items=((CLUB.pay[id]||{}).items||[]).filter(x=>x.status!=='pending'&&!x.drop);if(!items.length)return{state:'none',text:'No payment yet',days:null};const until=items.map(paymentUntil).sort().pop(),days=daysBetween(todayIso(),until);return{state:days>=0?'active':'expired',text:(days>=0?'Valid until ':'Expired on ')+until,days,until};};
paidThisMonth=function(id){return membership(id).state==='active';};
function paymentSummary(plan,date){return '<div class="payment-hero"><span class="eyebrow">'+(plan.group==='kids'?'KIDS MEMBERSHIP':'ADULT MEMBERSHIP')+'</span><h3>'+fmtMoney(plan.price)+'</h3><p>'+esc(tr(planName(plan)))+'</p><div class="period"><span>Starts <b>'+date+'</b></span><span>Valid until <b>'+A.periodEnd(date,plan.months||0)+'</b></span></div></div>';}
payNowSheet=function(){if(isClubCoach(myUid())){toast("Coach membership is active. No payment required.");return;}const P=CLUB.profile,plans=clubPlans(P),plan=plans.find(p=>p.id===UI.payPlan)||plans[0];if(!plan)return;const d=todayIso();openSheet('Confirm your payment',paymentSummary(plan,d)+'<p class="muted small">Transfer the exact amount. Your coach will approve your payment.</p>'+payHow(P,true)+field('p-note','Transfer note (optional)',inp('p-note','','text','placeholder="Bank reference"')),{saveLabel:'I have paid',async onSave(){const path='club/'+P.id+'/pay/'+myUid(),doc=await cget(path)||{items:[]};if(doc.items.some(x=>x.status==='pending')){toast('Your previous payment is waiting for approval');return false;}const rec={id:uid(),d,per:d.slice(0,7),start:d,end:A.periodEnd(d,plan.months||0),months:plan.months||0,amt:+plan.price,note:sv('p-note').trim(),by:myUid(),status:'pending',plan:plan.id,track:myTrack(),drop:plan.kind==='drop'||!plan.months};doc.items.push(rec);await cset(path,doc);CLUB.pay[myUid()]=doc;toast('Sent to your coach');render();return true;}});$('sheet').classList.add('modern-sheet');};
const confirmPayment=confirmPay;
confirmPay=async function(id,payment){if(!isAdmin())return;const fresh=await cget('club/'+CLUB.id+'/pay/'+id);if(fresh)CLUB.pay[id]=fresh;await confirmPayment(id,payment);if(UI.sheet)closeSheet();updateNoticeBadge();};
paySheet=function(id,forUid){if(!isAdmin()){const x=((CLUB.pay[myUid()]||{}).items||[]).find(x=>x.id===id);if(x)openSheet('Payment receipt','<div class="payment-hero"><h3>'+fmtMoney(x.amt)+'</h3><p>'+esc(x.status==='pending'?'Waiting for coach approval':'Approved')+'</p><p>'+esc(x.start||x.d)+' → '+esc(paymentUntil(x))+'</p></div>',{});return;}const who=forUid||myUid();if(isClubCoach(who)&&!id){toast('Coach membership is active. No payment required.');return;}const m=CLUB.members.list.find(m=>(m.uid||m.id)===who)||{},track=(CLUB.privateAges||{})[who]!=null?(CLUB.privateAges[who]<16?'kids':'adult'):m.track||myTrack();const plans=clubPlans(CLUB.profile,track),doc=CLUB.pay[who]||{items:[]},x=doc.items.find(p=>p.id===id);const plan=plans.find(p=>p.id===(x||{}).plan)||plans[0];openSheet('Record member payment','<div class="payment-member"><b>'+esc(m.n||myName())+'</b><span class="pill">'+(track==='kids'?'Kids':'Adults')+'</span></div>'+field('coach-plan','Membership plan','<select id="coach-plan">'+plans.map(p=>'<option value="'+esc(p.id)+'">'+esc(planName(p))+' · '+fmtMoney(p.price)+'</option>').join('')+'</select>')+'<div class="grid2">'+field('p-d','Paid on',inp('p-d',x?x.d:todayIso(),'date','max="'+todayIso()+'"'))+field('p-months','Months',inp('p-months',x?x.months||1:plan?plan.months:1,'number','min="0" max="24"'))+'</div>'+field('p-amt','Amount (₮)',inp('p-amt',x?x.amt:plan?plan.price:'','number','min="1" inputmode="numeric"'))+field('p-note','Transfer note (optional)',inp('p-note',x?x.note:'','text')),{saveLabel:'Record payment',async onSave(){const d=sv('p-d'),amt=+sv('p-amt'),months=Math.max(0,Math.min(24,+sv('p-months')||0));if(!d||d>todayIso()||amt<=0){toast('Check the payment details');return false;}const fresh=await cget('club/'+CLUB.id+'/pay/'+who)||{items:[]};const rec=fresh.items.find(p=>p.id===id)||{id:uid()};Object.assign(rec,{d,start:d,end:A.periodEnd(d,months),months,per:d.slice(0,7),amt,note:sv('p-note').trim(),plan:sv('coach-plan'),track,status:'ok',okBy:myUid(),okAt:todayIso(),by:myUid(),drop:months===0});if(!id)fresh.items.push(rec);await cset('club/'+CLUB.id+'/pay/'+who,fresh);CLUB.pay[who]=fresh;toast('Payment recorded');render();return true;}});$('sheet').classList.add('modern-sheet');$('coach-plan').onchange=()=>{const p=plans.find(p=>p.id===sv('coach-plan'));if(p){$('p-amt').value=p.price;$('p-months').value=p.months;}};};
const payView=vClubPay;
vClubPay=function(P,admin){if(isClubCoach(myUid()))return payView(P,admin);return '<div class="track-label">'+(myTrack()==='kids'?'Kids membership':'Adult membership')+'</div>'+payView(P,admin);};
function pendingPaymentNotices(){if(!isAdmin())return[];const out=[];for(const m of (CLUB.members.list||[]).filter(m=>!isClubCoach(m.uid)))for(const x of pendingPay(m.uid||m.id))out.push({id:'payment:'+x.id,d:x.d,text:(m.n||'Member')+' · '+fmtMoney(x.amt),who:m.uid||m.id,payment:x.id});return out;}
const unreadClub=unreadNotices;
unreadNotices=function(){return unreadClub().concat(pendingPaymentNotices());};
noticesSheet=function(){const notes=((CLUB.notes||{}).list||[]).slice().reverse(),payments=pendingPaymentNotices();openSheet('Club notifications',('Notification' in window ? '<button class="btn ghost wide" data-act="arrow-notify-enable">Enable phone notifications</button>' : '')+'<div class="list">'+payments.map(n=>'<div class="row"><div class="txt"><b>'+esc(n.text)+'</b><small>Payment awaiting approval</small></div><button class="btn" data-act="club-confirm" data-uid="'+esc(n.who)+'" data-id="'+esc(n.payment)+'">Approve</button></div>').join('')+notes.map(n=>'<div class="row"><div class="txt"><b>'+esc(n.text)+'</b><small>'+fmtD(n.d)+'</small></div></div>').join('')+(!payments.length&&!notes.length?'<p class="empty">No notices yet.</p>':'')+'</div>',{saveLabel:'Done',onSave(){S.settings.noticeSeen=S.settings.noticeSeen||{};S.settings.noticeSeen[CLUB.id]=notes.map(n=>n.id);save('settings');updateNoticeBadge();return true;}});};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act="coach-record-payment"]');if(b&&isAdmin()){closeSheet();paySheet(null,b.dataset.uid);}});

shareSheet=function(id,fmt){const s=id?S.log.items.find(x=>x.id===id):sessionsSorted()[0];if(!s){toast('Log a training first');return;}Object.assign(SHARE,{sess:s,img:null,tpl:'mat',fmt:fmt==='post'?'post':'story',frame:'mat'});const size=shareSize();const body='<div class="share-top"><div><span class="eyebrow">ARROW · JIU-JITSU</span><h2>Share your session</h2></div><button class="btn ghost compact" data-act="sheet-close">Done</button></div><div class="share-preview"><canvas id="sh-cv" width="'+size[0]+'" height="'+size[1]+'" class="sharecv"></canvas><label class="photo-overlay" for="sh-photo">+ Add photo<input id="sh-photo" type="file" accept="image/*" hidden></label></div><div class="frame-options" role="group" aria-label="Story frame">'+[['mat','The mat'],['belt','Jiu-jitsu'],['ticket','Training receipt']].map(([key,name])=>'<button class="frame-option '+(key==='mat'?'on':'')+'" data-act="arrow-frame" data-v="'+key+'" aria-pressed="'+(key==='mat')+'"><span class="frame-art '+key+'">'+(key==='mat'?'🥋':key==='belt'?'柔術':'ARROW')+'</span><span>'+name+'</span></button>').join('')+'</div><div class="share-format">'+chips('fmt',[['story','Story 9:16'],['post','Post 4:5']],SHARE.fmt)+'</div><div class="share-export"><button class="btn ghost" data-act="share-save">Save image</button><button class="btn" data-act="share-send">Share</button></div>';openSheet('',body,{state:{picks:{fmt:SHARE.fmt}}});$('sheet').classList.add('share-sheet');$('sheet-body').querySelector(':scope > h2').remove();$('sheet-body').querySelector('.foot').remove();$('sh-photo').onchange=async(e)=>{const f=e.target.files[0];if(!f)return;const sheet=UI.sheet,url=URL.createObjectURL(f),im=new Image();try{im.src=url;await im.decode();if(UI.sheet!==sheet)return;SHARE.img=im;drawShare();}catch(_){toast('Could not read the photo');}finally{URL.revokeObjectURL(url);e.target.value='';}};drawShare();};
drawShareNow=function(){const cv=$('sh-cv');if(!cv)return;const s=SHARE.sess;window.ARROW_FRAME.draw(cv,{frame:SHARE.frame||'mat',image:SHARE.img,date:s.d,club:(CLUB.profile||{}).n||'',type:SNAME[s.type]||'Training',minutes:s.min||0,rounds:s.rolls||0,submissions:A.count(s.subs),username:myHandle(),beltColor:beltDef(S.belt.track,S.belt.belt).c,stripes:+S.belt.stripes||0});};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act="arrow-frame"]');if(!b)return;SHARE.frame=b.dataset.v;$('sheet-body').querySelectorAll('.frame-option').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',String(x===b));});drawShare();});

planRows=function(){const el=$('c-plans');if(!el||!UI.sheet)return;const ps=UI.sheet.plans||[];el.innerHTML=ps.map((p,i)=>'<section class="plan-editor"><div class="grid2">'+field('c-plan-n-'+i,'Plan name',inp('c-plan-n-'+i,p.n||'','text'))+field('c-plan-g-'+i,'Age group','<select id="c-plan-g-'+i+'">'+[['adult','Adults'],['kids','Kids'],['all','All ages']].map(([k,n])=>'<option value="'+k+'"'+((p.group||'adult')===k?' selected':'')+'>'+n+'</option>').join('')+'</select>')+'</div><div class="grid2">'+field('c-plan-m-'+i,'Months',inp('c-plan-m-'+i,p.months==null?1:p.months,'number','min="0" max="24"'))+field('c-plan-p-'+i,'Price (₮)',inp('c-plan-p-'+i,p.price||'','number','min="1"'))+'</div><button class="btn ghost" data-act="plan-rm" data-i="'+i+'">Remove plan</button></section>').join('')+'<button class="btn ghost wide" data-act="plan-add">+ Add option</button>';};
const planReadOld=planRead;
planRead=function(){return planReadOld().map((p,i)=>Object.assign(p,{group:sv('c-plan-g-'+i)||'adult'}));};

/* Training choices, discovery and one progressively fetched social timeline. */
const TRAINING_ICONS = {
 gi: '<path d="m8 3 4 3 4-3 5 5-3 3-2-2v12H8V9l-2 2-3-3zM8 15h8M9 4l6 10M15 4l-3 6"/>',
 nogi: '<path d="M8 3h8l5 4-3 4-2-2v12H8V9l-2 2-3-4zM9 3c0 4 6 4 6 0"/>',
 open: '<path d="M3 6h18v15H3zM3 11h18M8 3v6M16 3v6M8 16h8M12 13v6"/>',
 priv: '<circle cx="8" cy="6" r="3"/><circle cx="17" cy="8" r="2"/><path d="M2 21v-4a6 6 0 0 1 12 0v4M14 13a5 5 0 0 1 8 4v4"/>',
 drill: '<path d="M5 7a8 8 0 0 1 14 1M19 3v5h-5M19 17a8 8 0 0 1-14-1M5 21v-5h5"/>',
 comp: '<path d="M7 3h10v5a5 5 0 0 1-10 0zM7 5H3v3a4 4 0 0 0 5 4M17 5h4v3a4 4 0 0 1-5 4M12 13v7M7 21h10"/>'
};
const AUDIENCE_ICONS = {
 public: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c6 6 6 12 0 18-6-6-6-12 0-18z"/>',
 friends: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2"/><path d="M2 21v-3a6 6 0 0 1 12 0v3M15 14a5 5 0 0 1 7 5v2"/>',
 private: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>'
};
function optionIcon(paths) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + paths + '</svg>'; }
function trainingChoices(current) {
 return '<div class="training-options" data-group="type" role="radiogroup" aria-label="Training type">' + STYPES.map(([key,name]) => '<button type="button" class="training-option' + (current===key?' on':'') + '" role="radio" aria-checked="' + (current===key) + '" data-act="pick" data-group="type" data-v="' + key + '">' + optionIcon(TRAINING_ICONS[key]) + '<span>' + esc(name) + '</span><i aria-hidden="true">✓</i></button>').join('') + '</div>';
}
function effortChoices(current) {
 return '<div class="effort-options" data-group="rpe" role="radiogroup" aria-label="Effort">' + ['Easy','Steady','Moderate','Hard','All out'].map((name,i)=>'<button type="button" class="effort-option' + (current===i+1?' on':'') + '" role="radio" aria-checked="' + (current===i+1) + '" data-act="pick" data-group="rpe" data-v="' + (i+1) + '"><b>' + (i+1) + '</b><span>' + name + '</span></button>').join('') + '</div>';
}
function audienceChoices(current) {
 return '<div class="audience-options" data-group="audience" role="radiogroup" aria-label="Who can see this?">' + [['public','Public','Your club'],['friends','Friends','Accepted friends'],['private','Only me','Private training log']].map(([key,label,hint])=>'<button type="button" class="audience-option' + (current===key?' on':'') + '" role="radio" aria-checked="' + (current===key) + '" data-act="pick" data-group="audience" data-v="' + key + '">' + optionIcon(AUDIENCE_ICONS[key]) + '<span><b>' + label + '</b><small>' + hint + '</small></span><i aria-hidden="true"></i></button>').join('') + '</div>';
}
function sessionNumber(id,label,value,step) {
 return '<div class="field"><label for="' + id + '">' + label + '</label><div class="session-number"><button type="button" data-act="session-step" data-target="' + id + '" data-step="-' + step + '" aria-label="Decrease">−</button><input id="' + id + '" type="number" inputmode="numeric" min="' + (id==='f-min'?1:0) + '" max="' + (id==='f-min'?1440:999) + '" value="' + esc(value) + '"><button type="button" data-act="session-step" data-target="' + id + '" data-step="' + step + '" aria-label="Increase">+</button></div></div>';
}
function sessionCounter(key,label) {
 const count=A.count(UI.sheet.pk[key]);
 return '<div class="finish-counter"><span>' + label + '</span><div><button type="button" data-act="session-count" data-k="' + key + '" data-step="-1" aria-label="Decrease ' + label + '">−</button><b id="finish-count-' + key + '">' + count + '</b><button type="button" data-act="session-count" data-k="' + key + '" data-step="1" aria-label="Increase ' + label + '">+</button></div><button type="button" class="detail-link" data-act="session-detail" data-k="' + key + '">Details</button></div>';
}
function updateFinishStats() {
 if (!UI.sheet || !document.querySelector('.training-sheet')) return;
 for (const key of ['subs','taps','tech']) { const el=$('finish-count-'+key); if(el)el.textContent=A.count(UI.sheet.pk[key]); }
 if($('finish-minutes'))$('finish-minutes').textContent=sv('f-min') || 0;
 if($('finish-rounds'))$('finish-rounds').textContent=sv('f-rolls') || 0;
}
function postTime(p) {
 const posted=new Date(+p.t);
 if(!p.t || Number.isNaN(posted.getTime()))return '<span>' + tr('Training date') + ' ' + fmtLong(p.d) + '</span>';
 const locale=I18N.lang==='mn'?'mn-MN':'en-GB';
 return '<time class="post-time" datetime="' + posted.toISOString() + '" title="' + esc(posted.toLocaleString(locale)) + '">' + tr('Posted') + ' ' + posted.toLocaleDateString(locale,{month:'numeric',day:'numeric'}) + ' · ' + posted.toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit',hour12:false}) + '</time>';
}
function postAudience(p) {
 const key=p.audience==='friends'?'friends':'public', label=key==='friends'?'Friends':'Public · club';
 return '<span class="post-audience" role="img" title="' + label + '" aria-label="' + label + '">' + optionIcon(AUDIENCE_ICONS[key]) + '</span>';
}
function discoverMembers() { return ((CLUB.members||{}).list||[]).filter(m=>m.uid&&m.uid!==myUid()&&m.socialAllowed===true); }
function suggestedFriends() {
 const members=discoverMembers().filter(m=>{const r=friendship(m.uid);return !r || r.status==='pending'&&r.to===myUid();}).sort((a,b)=>Number(!!friendship(b.uid))-Number(!!friendship(a.uid))).slice(0,5);
 return '<section class="card suggested"><div class="card-head"><h3>People you may know</h3><button type="button" class="text-button" data-act="discover">More</button></div>' + (members.length?'<div class="suggested-strip">' + members.map(m=>'<div class="suggestion"><button type="button" class="suggestion-profile" data-act="member-profile" data-uid="' + esc(m.uid) + '">' + avatarHtml(socialName(m),m.av,'sm') + '<b>' + esc(socialName(m)) + '</b></button>' + friendButton(m.uid) + '</div>').join('') + '</div>':'<p class="muted small">Discover your club members</p>') + '</section>';
}
function discoverRows(query) {
 const q=String(query||'').trim().toLocaleLowerCase();
 const members=discoverMembers().filter(m=>[m.username,m.n].some(v=>String(v||'').toLocaleLowerCase().includes(q))).sort((a,b)=>{const pending=m=>{const r=friendship(m.uid);return r&&r.status==='pending'&&r.to===myUid();};return Number(!!pending(b))-Number(!!pending(a));});
 return members.length?members.map(m=>{const r=friendship(m.uid);return '<div class="row discover-row"><button type="button" class="discover-person" data-act="member-profile" data-uid="' + esc(m.uid) + '">' + avatarHtml(socialName(m),m.av,'sm') + '<span><b>' + esc(socialName(m)) + '</b><small>' + (r?(r.status==='accepted'?'Friends':r.to===myUid()?'Friend request':'Request sent'):'Club member') + '</small></span></button>' + friendButton(m.uid) + '</div>';}).join(''):'<p class="empty">No people found.</p>';
}
function openDiscover() {
 if(!socialOn()||!CLUB.id)return;
 openSheet('Discover','<div class="discover-search"><label for="discover-search" class="sr-only">Search people</label><input id="discover-search" type="search" placeholder="Search people" autocomplete="off"></div><div id="discover-people" class="list">' + discoverRows('') + '</div>',{});
 $('sheet').classList.add('modern-sheet','discover-sheet');
 $('sheet-body').querySelector('.foot').innerHTML='<button type="button" class="btn wide" data-act="sheet-close">Done</button>';
}
function localFeedPage(cursor) {
 const paging=window.ARROW_FEED, all=clocal(), prefix='club/'+CLUB.id+'/feed/';
 const months=Object.keys(all).filter(k=>k.startsWith(prefix)&&/^\d{4}-\d{2}$/.test(k.slice(prefix.length))).map(k=>k.slice(prefix.length)).filter(m=>!cursor||m<=cursor.month).sort().reverse();
 const asOf=cursor?cursor.asOf:Date.now(), posts=[];let next=null;
 for(let i=0;i<Math.min(months.length,3);i++){
  const month=months[i], result=paging.page(all[prefix+month].list,cursor&&cursor.month===month?cursor.before:null,asOf,paging.size-posts.length);
  posts.push(...result.posts);
  if(result.more){next={month,before:result.before,asOf};break;}
  next=i+1<months.length?{month:months[i+1],before:null,asOf}:null;
  if(posts.length>=paging.size)break;
 }
 return {posts,next};
}
function paintFeed() {
 const list=$('feed-list'),tail=$('feed-tail');if(!list||!tail)return;
 const posts=unifiedPosts(), existing=new Map([...list.querySelectorAll('article[data-post-id]')].map(el=>[el.dataset.postId,el]));
 for(const p of posts){let el=existing.get(p.id);if(!el){const tmp=document.createElement('div');tmp.innerHTML=feedCard(p);el=tmp.firstElementChild;}list.appendChild(el);existing.delete(p.id);}
 existing.forEach(el=>el.remove());
 let empty=list.querySelector('.feed-empty');if(empty)empty.remove();
 if(!posts.length&&FEED.done)list.insertAdjacentHTML('beforeend','<div class="card feed-empty"><p class="empty">No training in the club yet. Log the first one!</p><button class="btn wide" data-act="add-sess">+ Log training</button></div>');
 tail.innerHTML=FEED.error?'<button class="btn ghost wide" data-act="feed-more">Try again</button>':FEED.done?(posts.length?'<p class="feed-end">You’re all caught up</p>':''):'<button type="button" class="text-button feed-more" data-act="feed-more"'+(FEED.busy?' disabled':'')+'>More training</button>';
}
async function loadFeedPage() {
 if(FEED.busy||FEED.done||!FEED.ready||!socialOn()||UI.tab!=='home'||!CLUB.id)return;
 FEED.busy=true;FEED.error=false;const progressButton=document.querySelector('[data-act="feed-more"]');buttonBusy(progressButton,true);const generation=FEED.generation,club=CLUB.id;
 try{
  let result;
  if(mode==='local')result=localFeedPage(FEED.cursor);
  else{const query=new URLSearchParams({club});if(FEED.cursor)query.set('cursor',JSON.stringify(FEED.cursor));const r=await fetch('/api/feed?'+query,{headers:{Authorization:'Bearer '+await SB.token()},cache:'no-store',signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error('Feed request failed');result=await r.json();}
  if(generation!==FEED.generation||club!==CLUB.id)return;
  for(const post of result.posts||[])if(post&&post.id)FEED.raw.set(post.id,post);
  FEED.cursor=result.next;FEED.done=!result.next;await decryptFeed();
 }catch(e){if(generation===FEED.generation)FEED.error=true;}
 finally{await window.ARROW_UI.wait(progressButton);buttonBusy(progressButton,false);if(generation===FEED.generation){FEED.busy=false;if(UI.tab==='home'){paintFeed();observeFeed();}}}
}
function observeFeed() {
 if(FEED.observer)FEED.observer.disconnect();
 const tail=$('feed-tail');if(!tail||FEED.done||FEED.error||!FEED.ready||UI.tab!=='home')return;
 if(!FEED.raw.size&&!FEED.busy){loadFeedPage();return;}
 if('IntersectionObserver' in window){FEED.observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))loadFeedPage();},{rootMargin:'0px 0px 220px 0px'});FEED.observer.observe(tail);}
}
const renderTimeline=render;
render=function(anim){renderTimeline(anim);if(UI.tab==='home'&&$('feed-list')){paintFeed();observeFeed();}else if(FEED.observer)FEED.observer.disconnect();};
document.addEventListener('input',e=>{if(e.target.id==='discover-search')$('discover-people').innerHTML=discoverRows(e.target.value);if(['f-min','f-rolls'].includes(e.target.id))updateFinishStats();});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b)return;
 if(b.dataset.act==='discover')openDiscover();
 if(b.dataset.act==='feed-more')loadFeedPage();
 if(b.dataset.act==='session-step'&&UI.sheet){const input=$(b.dataset.target);if(input){input.value=Math.min(+input.max,Math.max(+input.min,(+input.value||0)+(+b.dataset.step)));updateFinishStats();}}
 if(b.dataset.act==='session-count'&&UI.sheet){const key=b.dataset.k,list=UI.sheet.pk[key]||[];if(+b.dataset.step>0){const empty=list.find(x=>!x.n);if(empty)empty.c=(empty.c||1)+1;else list.push({id:'',n:'',c:1});}else{const item=list[list.length-1];if(item){if((item.c||1)>1)item.c--;else list.pop();}}UI.sheet.pk[key]=list;const picked=$('pkp-'+key);if(picked)picked.innerHTML=pickedHtml(key,key!=='tech');updateFinishStats();}
 if(b.dataset.act==='session-detail'){const details=document.querySelector('.training-sheet .edit-details');if(details){details.open=true;const input=$('pki-'+b.dataset.k);if(input){input.scrollIntoView({block:'center',behavior:'smooth'});input.focus({preventScroll:true});}}}
 if(b.dataset.act.startsWith('pk-'))queueMicrotask(updateFinishStats);
});

function coachMembershipCard() { return '<div class="card coach-membership"><div class="card-head"><h3>Coach membership</h3><span class="pill ok">Coach · Active</span></div><p class="muted small">Coaches do not pay membership fees.</p></div>'; }
function menuIcon(name) {
 const paths={profile:'<circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',progress:'<path d="M4 3v17h17M7 14l4-4 4 2 6-7"/>',club:'<path d="m3 11 9-8 9 8v10H3zM9 21v-7h6v7"/>',map:'<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-5h14v5"/>',belt:'<path d="M3 9h18v5H3zM10 9l5 5M14 9l-5 5M9 14l-3 7 4 1 3-8M15 14l3 6-4 2-3-8"/>',share:'<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7l2-4h4l2 4"/><circle cx="12" cy="14" r="4"/>',language:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c6 6 6 12 0 18-6-6-6-12 0-18z"/>',settings:'<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',coach:'<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M7 7h10M7 11h6M12 16v5M8 21h8"/>',logout:'<path d="M9 3H3v18h6M9 12h12M17 8l4 4-4 4"/>'};
 return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(paths[name]||paths.profile)+'</svg>';
}
function attendanceCount(date,count) { return '<button type="button" class="attendance-count" data-act="attendance-open" data-date="'+esc(date)+'"><span><b>'+count+'</b><small>Checked in</small></span><span class="attendance-count-detail">View names '+CHEV+'</span></button>'; }
async function attendanceSheet(date,manage) {
 if(!CLUB.id)return;
 try{
  const ym=date.slice(0,7),doc=ym===thisMonth()?CLUB.attMonth:(CLUB.att&&CLUB.att.ym===ym?CLUB.att.doc:await cget('club/'+CLUB.id+'/att/'+ym));
  const ids=new Set((doc&&doc.days[date])||[]),members=(CLUB.members.list||[]).slice().sort((a,b)=>String(a.n||'').localeCompare(String(b.n||'')));
  const present=members.filter(m=>ids.has(attKey(m)));
  const row=m=>'<div class="row"><span class="bdot" style="background:'+(BELT_COLOR[(m.belt||'white').split('-')[0]]||'#999')+'"></span><div class="txt"><b>'+esc(m.n||m.email||'Member')+'</b>'+(isClubCoach(m.uid)?'<small>Coach</small>':'')+'</div></div>';
  let html='<div class="attendance-summary"><b>'+ids.size+'</b><span>Checked in</span></div><div class="list">'+(present.length?present.map(row).join(''):'<p class="empty">No check-ins yet.</p>')+'</div>';
  if(isAdmin())html+='<details class="edit-details attendance-manage"'+(manage?' open':'')+'><summary>Manage attendance</summary><div class="list">'+members.map(m=>'<button type="button" class="row" data-act="att-tick" data-who="'+esc(attKey(m))+'" data-date="'+esc(date)+'"><span class="check'+(ids.has(attKey(m))?' on':'')+'">'+CHECK+'</span><span class="txt"><b>'+esc(m.n||m.email||'Member')+'</b></span></button>').join('')+'</div></details>';
  openSheet('Attendance · '+fmtLong(date),html,{});$('sheet').classList.add('modern-sheet');$('sheet-body').querySelector('.foot').innerHTML='<button type="button" class="btn wide" data-act="sheet-close">Done</button>';
 }catch(e){toast('Could not load attendance');}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act="attendance-open"]');if(b)attendanceSheet(b.dataset.date);});

/* Arrow community and mobile navigation refresh. */
const COMMUNITY={profiles:new Map(),lead:new Map(),partners:[],partnerNext:null,partnerBusy:false,partnerLoaded:false,club:null};
function shimmer(kind){const bar=(w='100%')=>'<span class="skeleton-line" style="width:'+w+'"></span>';return '<div class="layout-skeleton" role="status" aria-label="'+esc(tr('Loading content'))+'">'+(kind==='profile'?'<div class="card skeleton-profile"><span class="skeleton-circle"></span>'+bar('45%')+bar('65%')+'</div>':'')+(kind==='score'?[0]:[0,1,2]).map(()=>'<div class="card skeleton-card"><div class="skeleton-row"><span class="skeleton-circle"></span><div>'+bar('60%')+bar('35%')+'</div></div>'+bar()+bar('80%')+'<div class="skeleton-stats">'+bar()+bar()+bar()+'</div></div>').join('')+'</div>';}
function communityReset(){if(COMMUNITY.club===CLUB.id)return;COMMUNITY.club=CLUB.id;COMMUNITY.profiles.clear();COMMUNITY.lead.clear();COMMUNITY.partners=[];COMMUNITY.partnerNext=null;COMMUNITY.partnerLoaded=false;}
async function communityRequest(action,body,params={}){
 if(mode==='local')return localCommunity(action,body,params);
 const query=new URLSearchParams({action,club:CLUB.id,...params});const r=await fetch('/api/community?'+query,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+await SB.token(),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify({...body,club:CLUB.id,action})}:{}),cache:'no-store',signal:AbortSignal.timeout(25000)});const j=await r.json();if(!r.ok)throw new Error(j.error||'Request failed');return j;
}
function profileVisibility(){return {workouts:true,scores:true,competition:true,friends:true,...S.settings.profileVisibility};}
async function localCommunity(action,body,params){
 const base='club/'+CLUB.id+'/';
 if(action==='publish'){const show=profileVisibility();await cset(base+'profiles/'+myUid(),{uid:myUid(),show,bio:S.settings.bio||'',featuredMedal:profileAwards().find(a=>a.key===S.settings.featuredMedal)||null,...(show.workouts?{workouts:sessionsSorted().filter(s=>(s.audience||'public')==='public').slice(0,30).map(s=>({id:s.id,d:s.d,type:s.type,min:s.min,rounds:s.rolls||0}))}:{}),...(show.competition?{competition:S.comp.events.map(e=>({n:e.n,d:e.d,medal:e.medal||'',div:e.div||''}))}:{})});return {ok:true};}
 if(action==='profile'){const m=CLUB.members.list.find(m=>m.uid===params.uid&&m.socialAllowed);if(!m)throw new Error('Profile unavailable');const p=await cget(base+'profiles/'+m.uid)||{};const show={workouts:true,scores:true,competition:true,friends:true,...p.show};return {profile:{uid:m.uid,username:m.username||'member',av:m.av||'',club:CLUB.profile.n,belt:m.belt||'white',stripes:m.stripes||0,bio:p.bio||'',show,featuredMedal:p.featuredMedal||null,...(show.workouts?{workouts:p.workouts||[]}:{}),...(show.competition?{competition:p.competition||[]}:{}),...(show.friends?{friends:friendMembers(m.uid)}:{})}};}
 if(action==='leaderboard'){const list=[];for(const ym of params.period==='all'?[thisMonth(),addMonth(thisMonth(),-1)]:[thisMonth()]){const feed=await cget(base+'feed/'+ym);list.push(...feed?.list||[]);}const totals=new Map();for(const p of list){const m=CLUB.members.list.find(m=>m.uid===p.uid&&m.socialAllowed);const published=await cget(base+'profiles/'+p.uid);if(!m||published?.show?.scores===false||p.sealed||['private','friends'].includes(p.audience))continue;const r=totals.get(p.uid)||{uid:p.uid,n:socialName(m),av:m.av||'',belt:m.belt,sessions:0,min:0,rounds:0,subs:0,kudos:0,streak:0};r.sessions++;for(const k of ['min','rounds','subs'])r[k]+=+p[k]||0;r.kudos+=(p.kudos||[]).length;r.streak=Math.max(r.streak,+p.weeks||0);totals.set(p.uid,r);}return {rows:[...totals.values()]};}
 if(action==='partner-save'){const s=body.session;await cset(base+'partner-sessions/'+myUid()+'_'+s.id,{id:s.id,owner:myUid(),participants:s.with||[],d:s.d,min:s.min,type:s.type,rounds:s.rolls||0,t:Date.now()});return {ok:true};}
 if(action==='partners'){const stored=clocal();const rows=Object.entries(stored).filter(([k])=>k.startsWith(base+'partner-sessions/')).map(([,v])=>v).filter(s=>s.owner!==myUid()&&s.participants?.includes(myUid()));return {items:rows,next:null};}
 if(action==='remove'){const path=base+'feed/'+body.d.slice(0,7),doc=await cget(path)||{list:[]};if(doc.list.some(p=>p.id===body.id&&p.uid!==myUid()))throw new Error('Not permitted');doc.list=doc.list.filter(p=>p.id!==body.id);await cset(path,doc);if(!body.keepPartners)await cset(base+'partner-sessions/'+myUid()+'_'+body.id,{id:body.id,owner:myUid(),participants:[]});return {ok:true};}
}
async function publishProfile(){if(!CLUB.id||!socialOn())return;for(const k of ['settings','log','comp'])if(dirty[k])await flush(k);await communityRequest('publish',{});COMMUNITY.profiles.delete(myUid());COMMUNITY.lead.clear();}
const communityClubLoad=clubLoad;
clubLoad=async function(){await communityClubLoad();communityReset();if(CLUB.id&&!CLUB.err&&socialOn()){try{await publishProfile();}catch(_){/* Existing public profile remains available during temporary failures. */}}};
const removeCommunityFeed=feedRemove;
feedRemove=async function(id,d){if(!CLUB.id||!d)return;await communityRequest('remove',{id,d,keepPartners:true});FEED.raw.delete(id);await decryptFeed();COMMUNITY.lead.clear();if(UI.tab==='home')render();};
const sharePartnerRounds=rollsShare;
rollsShare=async function(rec){await communityRequest('partner-save',{session:rec});await sharePartnerRounds(rec);COMMUNITY.partnerLoaded=false;};
async function deleteTraining(id,d){if(CLUB.id){await communityRequest('remove',{id,d});const ym=d.slice(0,7),rolls=await cget('club/'+CLUB.id+'/rolls/'+ym);if(rolls){rolls.list=(rolls.list||[]).filter(r=>!(r.sid===id&&r.a===myUid()));await cset('club/'+CLUB.id+'/rolls/'+ym,rolls);if(ym===thisMonth())CLUB.rolls=rolls;}}S.log.items=S.log.items.filter(s=>s.id!==id);save('log');await flush('log');FEED.raw.delete(id);await decryptFeed();COMMUNITY.lead.clear();await publishProfile();render();toast('Training deleted');return true;}
const communityCard=feedCard;
feedCard=function(p){let h=communityCard(p);h=h.replace('<div class="pinfo"><b>','<div class="pinfo"><button type="button" class="post-author" data-act="member-profile" data-uid="'+esc(p.uid)+'">').replace('</b><p class="muted small">','</button><p class="muted small">');if(p.uid===myUid())h=h.replace('</article>','<div class="post-owner-actions">'+(S.log.items.some(s=>s.id===p.id)?'<button type="button" class="text-button" data-act="edit-sess" data-id="'+esc(p.id)+'">Edit training</button>':'')+'<button type="button" class="text-button danger" data-act="delete-training" data-id="'+esc(p.id)+'" data-d="'+esc(p.d)+'">Delete training</button></div></article>');return h;};
function friendMembers(id=myUid()){const ids=new Set((CLUB.friends?.list||[]).filter(r=>r.status==='accepted'&&(r.from===id||r.to===id)).map(r=>r.from===id?r.to:r.from));return (CLUB.members?.list||[]).filter(m=>ids.has(m.uid)&&m.socialAllowed===true).map(m=>({uid:m.uid,username:m.username||'member',av:m.av||''}));}
function profileFriends(rows,own){return '<section class="card"><div class="card-head"><h3>Friends <span class="muted small">'+rows.length+'</span></h3>'+(own?'<button class="text-button" data-act="discover">Discover</button>':'')+'</div>'+(rows.length?'<div class="profile-friends">'+rows.map(m=>'<button type="button" class="profile-friend" data-act="member-profile" data-uid="'+esc(m.uid)+'">'+avatarHtml('@'+m.username,m.av,'sm')+'<span>@'+esc(m.username)+'</span></button>').join('')+'</div>':'<p class="empty">No friends yet.</p>')+'</section>';}
function competitionRows(rows){return '<section class="card"><h3>Competition</h3>'+(rows.length?'<div class="list">'+rows.map(e=>'<div class="row"><div class="txt"><b>'+esc(e.n||e.event||'Competition')+'</b><small>'+esc(e.d||'')+(e.div?' · '+esc(e.div):'')+'</small></div>'+(e.medal?'<span class="pill">'+esc(e.medal)+'</span>':'')+'</div>').join('')+'</div>':'<p class="empty">No competitions yet.</p>')+'</section>';}
function workoutRows(rows,own){return '<section class="card"><div class="card-head"><h3>'+(own?'My training':'Public workouts')+'</h3>'+(own&&UI.tab!=='myWorkouts'?'<button type="button" class="text-button" data-act="my-workouts">View all</button>':'')+'</div>'+(rows.length?'<div class="list">'+rows.map(s=>'<'+(own?'button':'div')+' class="row"'+(own?' data-act="edit-sess" data-id="'+esc(s.id)+'"':'')+'><div class="txt"><b>'+esc(SNAME[s.type]||s.type||'Training')+'</b><small>'+esc(s.d)+' · '+(+s.min||0)+' min · '+(+s.rounds||+s.rolls||0)+' rounds</small></div>'+(own?CHEV:'')+'</'+(own?'button':'div')+'>').join('')+'</div>':'<p class="empty">No training yet.</p>')+'</section>';}
function scoreCard(uid){if(uid===myUid()&&profileVisibility().scores===false){const points=S.log.items.filter(s=>s.d.startsWith(thisMonth())&&(s.audience||'public')==='public').length;return '<section class="card profile-score"><span class="lbl">Leaderboard · This month</span><div class="stat"><b>'+points+'</b><span>points</span></div><p class="muted small">Hidden on public profile</p></section>';}const state=COMMUNITY.lead.get(CLUB.id+':month');if(!state){queueMicrotask(()=>loadLeaderboard('month'));return shimmer('score');}if(state.error)return '<div class="card"><button class="text-button" data-act="lead-retry">Retry score</button></div>';if(state.busy)return shimmer('score');const rows=rankRows(state.rows,'sessions'),r=rows.find(r=>r.uid===uid);return '<section class="card profile-score"><span class="lbl">Leaderboard · This month</span><div class="summary"><div class="stat"><b>'+(r?r.sessions:0)+'</b><span>points</span></div><div class="stat"><b>'+(r?'#'+r.rank:'—')+'</b><span>rank</span></div></div><p class="muted small">1 public training = 1 point</p></section>';}
const ownProfileCommunity=VIEWS.profile;
VIEWS.profile=function(){let h=ownProfileCommunity();h=h.replace('<h3>Recent sessions</h3>','<div class="card-head"><h3>Recent sessions</h3><button class="text-button" data-act="my-workouts">View all</button></div>');if(socialOn()){if(CLUB.id)h+=scoreCard(myUid());h+=competitionRows(S.comp.events)+profileFriends(friendMembers(),true);}else h+=competitionRows(S.comp.events);if(CLUB.id){const linked=COMMUNITY.partners.filter(s=>!(S.settings.hiddenPartnerSessions||[]).includes(s.owner+':'+s.id));if(!COMMUNITY.partnerLoaded&&!COMMUNITY.partnerBusy)queueMicrotask(()=>loadPartners());if(linked.length)h+='<section class="card"><div class="card-head"><h3>Added by training partners</h3><button class="text-button" data-act="my-workouts">View all</button></div><div class="list">'+linked.slice(0,4).map(s=>'<div class="row"><div class="txt"><b>'+esc(SNAME[s.type]||s.type)+' · '+(+s.min||0)+' min</b><small>'+esc(s.d)+'</small></div></div>').join('')+'</div></section>';}return h+'<button type="button" class="btn ghost wide" data-act="my-workouts">My training history</button>';};
profileSheet=function(id){if(!socialOn())return;if(!(CLUB.members?.list||[]).some(m=>m.uid===id&&m.socialAllowed===true))return;UI.prevTab=UI.tab==='memberProfile'?UI.prevTab:UI.tab;UI.profileUid=id;UI.tab='memberProfile';COMMUNITY.profiles.delete(id);go('enter-l');loadMemberProfile(id);};
async function loadMemberProfile(id,retry=false){communityReset();if(COMMUNITY.profiles.has(id)&&!retry)return;COMMUNITY.profiles.set(id,{busy:true});try{const j=await communityRequest('profile',null,{uid:id});COMMUNITY.profiles.set(id,{profile:j.profile});}catch(_){COMMUNITY.profiles.set(id,{error:true});}if(UI.tab==='memberProfile'&&UI.profileUid===id)render();}
VIEWS.memberProfile=function(){const id=UI.profileUid,state=COMMUNITY.profiles.get(id);let h='<div class="pf-nav"><button class="icon-btn" data-act="profile-back">‹ Back</button></div>';if(!state||state.busy)return h+shimmer('profile');if(state.error)return h+'<div class="card"><p class="empty">Could not open profile.</p><button class="btn ghost" data-act="profile-retry">Try again</button></div>';const p=state.profile;h+='<section class="card profile pf">'+avatarHtml('@'+p.username,p.av,'xl')+'<h2>@'+esc(p.username)+'</h2><span class="public-belt"><i style="background:'+(BELT_COLOR[p.belt.split('-')[0]]||'#999')+'"></i>'+esc(p.belt)+' · '+(+p.stripes||0)+' stripes</span><div class="profile-club"><span class="lbl">Club</span><b>'+esc(p.club)+'</b></div>'+(p.bio?'<p class="profile-bio">'+esc(p.bio)+'</p>':'')+friendButton(id)+'</section>';if(p.show.scores)h+=scoreCard(id);if(p.show.workouts)h+=workoutRows(p.workouts||[],false);if(p.show.competition)h+=competitionRows(p.competition||[]);if(p.show.friends)h+=profileFriends(p.friends||[],false);return h;};
const visibilityEditor=profileEditSheet;
profileEditSheet=function(){visibilityEditor();$('sheet').classList.add('profile-edit-sheet');const show=profileVisibility();$('sheet-body').querySelector('.foot').insertAdjacentHTML('beforebegin','<section class="form-section profile-visibility"><h3>Public profile</h3><p class="muted small">Club and belt are always visible. Contact details and birth date stay private.</p>'+[['workouts','Public workouts'],['scores','Leaderboard points'],['competition','Competition'],['friends','Friends']].map(([key,label])=>'<label class="visibility-toggle"><span>'+label+'</span><input type="checkbox" id="visible-'+key+'"'+(show[key]?' checked':'')+' role="switch"></label>').join('')+'</section>');const original=UI.sheetSave;UI.sheetSave=async function(){const selected=Object.fromEntries(Object.keys(show).map(k=>[k,$('visible-'+k)?.checked!==false]));const result=await original();if(result!==false){S.settings.profileVisibility=selected;save('settings');await publishProfile();render();}return result;};};
async function loadPartners(more=false){if(!CLUB.id||COMMUNITY.partnerBusy)return;const club=CLUB.id;COMMUNITY.partnerBusy=true;if(!more)COMMUNITY.partnerLoaded=false;try{const j=await communityRequest('partners',null,more&&COMMUNITY.partnerNext?{before:COMMUNITY.partnerNext}:{});if(CLUB.id!==club)return;const items=more?[...COMMUNITY.partners,...j.items]:j.items;COMMUNITY.partners=[...new Map(items.map(s=>[s.owner+':'+s.id,s])).values()];COMMUNITY.partnerNext=j.next;COMMUNITY.partnerLoaded=true;COMMUNITY.partnerError=false;}catch(_){COMMUNITY.partnerError=true;COMMUNITY.partnerLoaded=true;}finally{COMMUNITY.partnerBusy=false;if(['myWorkouts','profile'].includes(UI.tab))render();}}
VIEWS.myWorkouts=function(){const ignored=new Set(S.settings.hiddenPartnerSessions||[]),linked=COMMUNITY.partners.filter(s=>!ignored.has(s.owner+':'+s.id));let h='<div class="card-head"><button class="icon-btn" data-act="profile-back">‹ Back</button><button class="text-button" data-act="partner-refresh">Refresh</button></div>'+workoutRows(sessionsSorted(),true)+'<section class="card"><h3>Added by training partners</h3><p class="muted small">Linked sessions stay separate from your own records and leaderboard points.</p>';
 if(!CLUB.id)return h+'<p class="empty">Join a club to train with partners.</p></section>';
 if(!COMMUNITY.partnerLoaded)return h+'</section>'+shimmer('feed');if(COMMUNITY.partnerError)return h+'<button class="btn ghost" data-act="partner-refresh">Try again</button></section>';
 h+=linked.length?'<div class="list">'+linked.map(s=>{const m=CLUB.members.list.find(m=>m.uid===s.owner);return '<div class="row"><div class="txt"><b>'+esc(SNAME[s.type]||s.type)+' · '+(+s.min||0)+' min</b><small>'+esc(s.d)+' · '+esc(m?.socialAllowed?socialName(m):'Training partner')+' · '+(+s.rounds||0)+' rounds</small></div><button type="button" class="text-button" data-act="partner-hide" data-key="'+esc(s.owner+':'+s.id)+'">Remove</button></div>';}).join('')+'</div>':'<p class="empty">No linked sessions yet.</p>';if(COMMUNITY.partnerNext)h+='<button class="btn ghost wide" data-act="partners-more">More training</button>';return h+'</section>';};
function rankRows(rows,metric){const sorted=(rows||[]).map(r=>({...r,v:r[metric]||0})).sort((a,b)=>b.v-a.v||a.n.localeCompare(b.n));let rank=0;sorted.forEach((r,i)=>{if(!i||r.v!==sorted[i-1].v)rank=i+1;r.rank=rank;});return sorted;}
async function loadLeaderboard(period,retry=false){communityReset();const key=CLUB.id+':'+period;if(COMMUNITY.lead.has(key)&&!retry)return;COMMUNITY.lead.set(key,{busy:true});try{const j=await communityRequest('leaderboard',null,{period});COMMUNITY.lead.set(key,{rows:j.rows});}catch(_){COMMUNITY.lead.set(key,{error:true});}if(['home','profile','memberProfile'].includes(UI.tab))render();}
leadRows=function(){return rankRows(COMMUNITY.lead.get(CLUB.id+':'+UI.leadPer)?.rows,UI.leadBy);};
LEAD_BY[0]=['sessions','Points','points'];
const leaderboardCommunity=vLeaderboard;
vLeaderboard=function(){if(!CLUB.id)return leaderboardCommunity();const state=COMMUNITY.lead.get(CLUB.id+':'+UI.leadPer);if(!state){queueMicrotask(()=>loadLeaderboard(UI.leadPer));return shimmer('feed');}if(state.busy)return shimmer('feed');if(state.error)return '<div class="card"><button class="btn ghost" data-act="lead-retry">Try again</button></div>';return '<p class="leaderboard-note muted small">Public club training · 1 session = 1 point</p>'+leaderboardCommunity();};
const loadingClubView=VIEWS.club;VIEWS.club=function(){return clubNeeds()?shimmer('club'):loadingClubView();};
const homeCommunity=VIEWS.home;
VIEWS.home=function(){let h=homeCommunity();if(!socialOn())return h;if(clubNeeds())return h+shimmer('feed');if(!CLUB.id)return h;const tabs=seg([['feed','Feed'],['lead','Leaderboard']],UI.homeSeg,'homeseg');if(UI.homeSeg==='lead')return (liveOn()?liveCard()+weekCard():weekCard()+liveCard())+tabs+vLeaderboard();h=h.replace('<div class="feed-heading">',tabs+'<div class="feed-heading">');if(!FEED.ready)h+=tabs+shimmer('feed');else if(!unifiedPosts().length&&!FEED.done)h=h.replace('<section id="feed-list" aria-label="Training feed">','<section id="feed-list" aria-label="Training feed">'+shimmer('feed'));return h;};
const paintCommunityFeed=paintFeed;
paintFeed=function(){if(FEED.raw.size||FEED.done||FEED.error)$('feed-list')?.querySelector('.layout-skeleton')?.remove();paintCommunityFeed();};
function partnerPicker(f){const selected=UI.sheet?.with||f.with||[],friends=new Set(acceptedFriends());const members=(CLUB.members?.list||[]).filter(m=>m.uid&&m.uid!==myUid()).sort((a,b)=>Number(friends.has(b.uid))-Number(friends.has(a.uid))||String(a.username||a.n).localeCompare(String(b.username||b.n)));return !members.length?'':'<section class="training-section partner-section"><span class="lbl">Training partners</span><div class="partner-strip" data-scroll-key="training-partners">'+members.map(m=>'<button type="button" class="partner-tile'+(selected.includes(m.uid)?' on':'')+'" data-act="with-toggle" data-who="'+esc(m.uid)+'" aria-pressed="'+selected.includes(m.uid)+'">'+avatarHtml(m.username||m.n,m.av,'sm')+'<span>'+esc(m.username?'@'+m.username:m.n||'Member')+'</span><i>'+CHECK+'</i></button>').join('')+'</div><p class="muted small">Selected partners also get a linked session in their training history.</p></section>';}
effortChoices=function(value){const labels=['Easy','Light','Moderate','Hard','All out'],v=Math.max(1,Math.min(5,+value||1));return '<div class="effort-slider" data-effort="'+v+'"><div><strong id="effort-label">'+esc(value?tr(labels[v-1]):tr('Not set'))+'</strong><span id="effort-value">'+(value?v+'/5':'—')+'</span></div><input id="f-effort" type="range" min="1" max="5" step="1" value="'+v+'" aria-label="Effort"><div class="effort-ends"><span>Easy</span><span>All out</span></div></div>';};
const mobileSession=sessSheet;
sessSheet=function(id,prefill){mobileSession(id,prefill);const f=(id?S.log.items.find(s=>s.id===id):prefill)||{};const section=$('sheet-body').querySelector('.training-section');if(CLUB.id)section.insertAdjacentHTML('beforebegin',partnerPicker(f));const oldPartners=$('sheet-body').querySelector('.edit-details [data-act="with-toggle"]');if(oldPartners)oldPartners.closest('.field').remove();$('sheet-body').querySelector('.edit-details summary').textContent=tr('Techniques and notes');const min=$('f-min');min.min=.01;min.step=.01;min.closest('.field').insertAdjacentHTML('afterend','<div class="duration-presets">'+(f.stoppedDuration?'<button type="button" class="chip" data-act="duration-preset" data-min="'+f.stoppedDuration+'">Stopped · '+fmtT(f.elapsedSeconds)+'</button>':'')+[30,45,60,90,120].map(v=>'<button type="button" class="chip'+(+min.value===v?' on':'')+'" data-act="duration-preset" data-min="'+v+'">'+v+' min</button>').join('')+'</div>');const saveSession=UI.sheetSave;UI.sheetSave=async function(){const result=await saveSession();if(result!==false){if(f.stoppedAt){const rec=S.log.items.find(s=>s.id===(id||UI.sheet?.savedId));if(rec){rec.startedAt=f.startedAt;rec.stoppedAt=f.stoppedAt;rec.elapsedSeconds=f.elapsedSeconds;save('log');}}await publishProfile();const saved=UI.sheet?.savedId;if(saved)setTimeout(()=>shareSheet(saved,f.live?'story':null),450);}return result;};UI.sheetDel=id?()=>deleteTraining(id,f.d):null;};
/* Preserve each horizontal menu's position; reset document scroll only when the route changes. */
const scrollMenus=new Map();let lastRoute='',lastScope='';
function routeKey(){return UI.tab+':'+(UI.tab==='me'?UI.seg.me+':'+(UI.seg.me==='body'?UI.body.cat:UI.seg.me==='comp'?UI.comp.id||'list':''):UI.tab==='club'?UI.clubSeg:UI.tab==='home'?UI.homeSeg:UI.tab==='profile'?UI.profileSection:UI.tab==='clubProfile'?UI.publicClubId:UI.tab==='memberProfile'?UI.profileUid+':'+UI.profileSection:UI.tab==='tech'?(UI.tech.id||'root')+':'+UI.tech.view:'');}
function scrollKey(el,index){return UI.tab+':'+(el.dataset.scrollKey||el.dataset.group||el.querySelector('[data-act]')?.dataset.act||el.className.split(' ')[0])+':'+index;}
const renderMobile=render;
render=function(anim){const route=routeKey();document.querySelectorAll('#main .seg,#main .chips,#main .suggested-strip').forEach((el,i)=>scrollMenus.set(lastScope+':'+(el.dataset.scrollKey||el.dataset.group||el.querySelector('[data-act]')?.dataset.act||el.className.split(' ')[0])+':'+i,el.scrollLeft));renderMobile(anim);document.querySelectorAll('#main .seg,#main .chips,#main .suggested-strip').forEach((el,i)=>{const x=scrollMenus.get(scrollKey(el,i));if(x!==undefined)el.scrollLeft=x;});if(route!==lastRoute&&!(UI.tab==='me'&&lastScope==='me')){window.scrollTo({top:0,behavior:'instant'});$('main').scrollTop=0;}lastRoute=route;lastScope=UI.tab;$('boot-splash')?.remove();};
const closeCommunitySheet=closeSheet;
closeSheet=function(){if($('sheet').classList.contains('training-sheet')&&liveOn()){delete S.settings.live.stoppedAt;save('settings');}closeCommunitySheet();$('sheet').classList.remove('profile-edit-sheet');};
function rememberMenuScroll(e){const el=e.target;if(el.matches?.('#main .seg,#main .chips,#main .suggested-strip')){const els=[...document.querySelectorAll('#main .seg,#main .chips,#main .suggested-strip')];scrollMenus.set(scrollKey(el,els.indexOf(el)),el.scrollLeft);}}
document.addEventListener('scroll',rememberMenuScroll,true);
document.addEventListener('input',e=>{if(e.target.id==='f-effort'&&UI.sheet){const v=+e.target.value;UI.sheet.picks.rpe=v;document.querySelector('.effort-slider').dataset.effort=v;$('effort-label').textContent=tr(['Easy','Light','Moderate','Hard','All out'][v-1]);$('effort-value').textContent=v+'/5';}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const d=b.dataset;
 if(d.act==='logout'){scanStop();releaseCamera();}
 if(d.act==='boot-retry')startCloud();
 if(d.act==='my-workouts'){if(UI.tab!=='myWorkouts')UI.prevTab=UI.tab;UI.tab='myWorkouts';go('enter-l');loadPartners();}
 if(d.act==='delete-training')openSheet('Delete training?','<p>This removes your session from your history, the feed and your partners’ linked history.</p>',{saveLabel:'Delete training',onSave:()=>deleteTraining(d.id,d.d)});
 if(d.act==='profile-retry')loadMemberProfile(UI.profileUid,true);
 if(d.act==='lead-retry'){COMMUNITY.lead.delete(CLUB.id+':'+(UI.tab==='home'?UI.leadPer:'month'));render();}
 if(d.act==='partner-refresh')loadPartners();if(d.act==='partners-more')loadPartners(true);
 if(d.act==='partner-hide'){S.settings.hiddenPartnerSessions=[...new Set([...(S.settings.hiddenPartnerSessions||[]),d.key])];save('settings');render();}
 if(d.act==='duration-preset'){const input=$('f-min');input.value=d.min;document.querySelectorAll('[data-act="duration-preset"]').forEach(el=>el.classList.toggle('on',el===b));updateFinishStats();}
 if(d.act==='with-toggle')b.setAttribute('aria-pressed',b.classList.contains('on'));
});
setInterval(()=>{if(document.visibilityState==='visible'&&['myWorkouts','profile'].includes(UI.tab)&&CLUB.id&&!COMMUNITY.partnerBusy)loadPartners();},30000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&['myWorkouts','profile'].includes(UI.tab)&&CLUB.id)loadPartners();});

/* V10: onboarding, complete technique entitlement and account settings. */
ageFields=function(prefix){return window.ARROW_DOB.html(prefix+'-dob',S.settings.birthDate||'')+'<p class="muted small">Your age is private. Only you and your coaches can see it.</p>';};
onboardingForm=function(){return '<form id="arrow-age" class="card onboarding kyc-card"><span class="eyebrow">MEMBER PROFILE · 2 / 2</span><h2>Ready for the mat</h2><p class="muted">Complete your member details once.</p><section class="kyc-section"><h3>About you</h3>'+(S.settings.name?'':field('on-name','Real name',inp('on-name','','text','required autocomplete="name"'))+'<p class="muted small">Нэрээ кирилл үсгээр бичнэ үү.</p>')+(S.settings.username?'':field('on-user','Social username',inp('on-user','','text','required autocapitalize="none"')))+ageFields('age')+'</section>'+contactFields()+'<div class="kyc-privacy">'+menuIcon('profile')+'<p>Your birth date and contact details stay private to you and your coaches.</p></div><button class="btn wide" type="submit">Complete profile</button></form>';};
const paidTechniqueView=VIEWS.tech;
VIEWS.tech=function(){if(clubNeeds()){if(!CLUB.busy)clubLoad();return shimmer('technique');}if(!(isSuper()||isAdmin()||(proUntil()&&proUntil()>=thisMonth())))return lockCard('Technique');return paidTechniqueView();};
lockCard=function(what){return '<section class="card technique-lock"><span class="lock-symbol">'+menuIcon('map')+'</span><span class="eyebrow">ARROW UPGRADE</span><h2>'+esc(what)+'</h2><p>The complete technique library, maps, routes and game plans require a paid Upgrade.</p><div class="actions"><button class="btn wide" data-act="upgrade">Upgrade</button><button class="btn ghost wide" data-act="tab" data-v="club">Join club</button></div><p class="muted small">Your personal training log stays free.</p></section>';};
settingsSheet=function(){const section=(title,body)=>'<section class="settings-section"><h3>'+title+'</h3>'+body+'</section>';const row=(act,title,sub,icon='profile')=>'<button type="button" class="settings-row" data-act="'+act+'">'+menuIcon(icon)+'<span><b>'+title+'</b><small>'+sub+'</small></span>'+CHEV+'</button>';let h='<div class="settings-account">'+avatarHtml(myHandle(),S.settings.avatar,'sm')+'<div><b>@'+esc(myHandle())+'</b><small>'+esc(S.settings.name||'')+'</small></div></div>';
 h+=section('Account',row('settings-profile','Edit profile','Identity, photo and public information')+row('settings-password','Password and recovery','Recover access to your account','settings'));
 h+=section('Preferences','<span class="lbl">Language</span>'+chips('lang',[['mn','Монгол'],['en','English']],I18N.lang)+'<span class="lbl">Appearance</span>'+chips('theme',[['system','Device'],['light','Light'],['dark','Dark']],S.settings.theme||'system'));
 h+=section('Technique preferences','<span class="lbl">Ruleset</span>'+chips('rules',[['both','Gi & no-gi'],['gi','Gi only'],['nogi','No-gi only']],S.settings.rules||'both')+'<span class="lbl">Belt filter</span>'+chips('beltf',[['0','Show all'],['1','Only up to my belt']],S.settings.beltFilter?'1':'0'));
 h+=section('Library','<details><summary>Library tools</summary><button class="btn ghost wide" data-act="reset-seed">Reload the starter library</button></details>')+(mode==='cloud'?'<p class="muted small">'+esc(SB.session?.email||'')+'</p>':'')+((isAdmin()||isSuper())&&mode==='cloud'?'<a class="btn ghost wide" href="admin.html">Coach console</a>':'');
 openSheet('Settings',h,{saveLabel:'Done',state:{picks:{lang:I18N.lang,theme:S.settings.theme||'system',rules:S.settings.rules||'both',beltf:S.settings.beltFilter?'1':'0'}},onSave(){Object.assign(S.settings,{lang:pickVal('lang',I18N.lang),theme:pickVal('theme','system'),rules:pickVal('rules','both'),beltFilter:pickVal('beltf','0')==='1'});save('settings');I18N.set(S.settings.lang);applyTheme();render();return true;}});$('sheet').classList.add('settings-sheet','modern-sheet');};
const removeTrainingActions=feedCard;
feedCard=function(p){return removeTrainingActions(p).replace(/<div class="post-owner-actions">[\s\S]*?<\/div>/,'').replace('<div class="prow">','<div class="prow">'+(p.uid===myUid()?'<button type="button" class="post-menu-button" data-act="post-options" data-id="'+esc(p.id)+'" data-d="'+esc(p.d)+'" aria-label="Training options">⋯</button>':''));};
function postOptions(id,d){const exists=S.log.items.some(s=>s.id===id);openSheet('Training options','<div class="post-options">'+(exists?'<button class="settings-row" data-act="edit-sess" data-id="'+esc(id)+'">'+menuIcon('settings')+'<span><b>Edit training</b></span>'+CHEV+'</button>':'')+'<button class="settings-row danger" data-act="delete-training" data-id="'+esc(id)+'" data-d="'+esc(d)+'">'+menuIcon('logout')+'<span><b>Delete training</b></span>'+CHEV+'</button></div>',{});$('sheet-body').querySelector('.foot').innerHTML='<button type="button" class="btn ghost wide" data-act="sheet-close">Done</button>';}
function trainingDatePicker(value){const date=value||todayIso();return '<div class="training-date-field"><span class="lbl">Training date</span><input type="hidden" id="f-d" value="'+esc(date)+'"><button type="button" class="date-select-button" data-act="session-date-open">'+menuIcon('progress')+'<span id="session-date-label">'+esc(fmtLong(date))+'</span>'+CHEV+'</button><div id="session-date-calendar" hidden></div></div>';}
function sessionCalendar(month){const chosen=sv('f-d'),now=todayIso();UI.sheet.calendarMonth=month;const count=new Date(+month.slice(0,4),+month.slice(5),0).getDate(),start=(new Date(month+'-01T12:00:00').getDay()+6)%7;let cells='<span></span>'.repeat(start);for(let day=1;day<=count;day++){const d=month+'-'+pad(day);cells+='<button type="button" class="'+(chosen===d?'selected':'')+'" data-act="session-date-pick" data-d="'+d+'"'+(d>now?' disabled':'')+'>'+day+'</button>';}$('session-date-calendar').innerHTML='<div class="calendar-month"><button type="button" data-act="session-calendar-month" data-step="-1" aria-label="Previous month">‹</button><b>'+month+'</b><button type="button" data-act="session-calendar-month" data-step="1" aria-label="Next month"'+(month>=now.slice(0,7)?' disabled':'')+'>›</button></div><div class="session-date-grid">'+['M','T','W','T','F','S','S'].map(d=>'<small>'+d+'</small>').join('')+cells+'</div>';}
const cleanTrainingTime=sessSheet;
sessSheet=function(id,prefill){cleanTrainingTime(id,prefill);const min=+sv('f-min'),d=sv('f-d'),grid=$('f-min').closest('.grid2'),presets=document.querySelector('.duration-presets');const presetHtml=presets?presets.outerHTML:'';grid.outerHTML='<div class="training-time-editor">'+trainingDatePicker(d)+'<div class="duration-editor"><span class="lbl">Duration</span><input type="hidden" id="f-min" value="'+min+'">'+presetHtml+'<div class="duration-custom"><label>Hours<input id="duration-hours" type="number" inputmode="numeric" min="0" max="24" value="'+Math.floor(min/60)+'"></label><label>Minutes<input id="duration-minutes" type="number" inputmode="numeric" min="0" max="59" value="'+Math.floor(min%60)+'"></label></div><span class="duration-exact" id="duration-exact">'+esc(fmtT(Math.round(min*60)))+'</span></div></div>';const previousSave=UI.sheetSave;UI.sheetSave=async()=>{const m=+sv('f-min');if(!(m>0&&m<=1440)){toast('Choose a valid duration');$('duration-hours').focus();return false;}return previousSave();};};
function syncDurationFields(){const min=+sv('f-min');$('duration-hours').value=Math.floor(min/60);$('duration-minutes').value=Math.floor(min%60);$('duration-exact').textContent=fmtT(Math.round(min*60));document.querySelectorAll('[data-act="duration-preset"]').forEach(b=>b.classList.toggle('on',Math.abs(+b.dataset.min-min)<.001));}
function profileAwards(){const awards=(S.comp.events||[]).filter(e=>e.medal).map(e=>({key:'comp:'+e.id,n:e.n,medal:e.medal,d:e.d}));for(const r of CLUB.results?.list||[])if(r.uid===myUid()&&r.status==='ok'&&r.medal)awards.push({key:'club:'+r.id,n:r.event,medal:r.medal,d:r.d});return awards;}
function medalIcon(medal){const color={gold:'#d7a52f',silver:'#8592a5',bronze:'#bd783e'}[medal]||'#d7a52f';return '<svg viewBox="0 0 32 40" aria-hidden="true"><path d="M5 0h8l9 18-7 4z" fill="#fc5200"/><path d="M19 0h8L17 22l-7-4z" fill="#2464d6"/><circle cx="16" cy="26" r="12" fill="'+color+'"/><circle cx="16" cy="26" r="8" fill="none" stroke="#fff" opacity=".6"/><path d="m16 20 1.7 3.5 3.8.5-2.8 2.7.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.7 3.8-.5z" fill="#fff"/></svg>';}
function featuredMedalHtml(m){return m?'<span class="featured-medal" title="'+esc((m.n||m.name||'')+' · '+m.medal)+'">'+medalIcon(m.medal)+'<span>'+esc(m.n||m.name||'')+'</span></span>':'';}
const medalProfileEdit=profileEditSheet;
profileEditSheet=function(){medalProfileEdit();const awards=profileAwards();$('sheet-body').querySelector('.profile-visibility').insertAdjacentHTML('beforebegin','<section class="form-section"><h3>Featured medal</h3><p class="muted small">Choose a medal from your recorded achievements.</p>'+field('featured-medal','Medal','<select id="featured-medal"><option value="">None</option>'+awards.map(a=>'<option value="'+esc(a.key)+'"'+(S.settings.featuredMedal===a.key?' selected':'')+'>'+esc(a.medal+' · '+a.n)+'</option>').join('')+'</select>')+'</section>');const saveProfile=UI.sheetSave;UI.sheetSave=async()=>{S.settings.featuredMedal=sv('featured-medal');const saved=await saveProfile();if(saved!==false)await publishProfile();return saved;};};
UI.profileSection='workouts';UI.profileCount=12;
function profileMenu(own,show){const tabs=[['workouts','Workouts'],['leaderboard','Leaderboard'],['competition','Competition'],['friends','Friends']].filter(([key])=>(!own||socialOn()||!['leaderboard','friends'].includes(key))&&(own||(show||{})[key==='leaderboard'?'scores':key]!==false));if(!tabs.some(t=>t[0]===UI.profileSection))UI.profileSection=tabs[0]?.[0]||'none';return tabs.length?seg(tabs,UI.profileSection,'profile-section',true):'';}
function ownProfilePost(s){const published=(CLUB.feed||[]).find(p=>p.uid===myUid()&&p.id===s.id);return published||{...feedPostOf(s),audience:s.audience||'public',t:s.postedAt||s.createdAt||0};}
VIEWS.profile=function(){const award=profileAwards().find(a=>a.key===S.settings.featuredMedal),belt=beltDef(S.belt.track,S.belt.belt);let h='<div class="pf-nav"><button class="icon-btn" data-act="profile-back">‹ Back</button><button class="icon-btn profile-edit-small" data-act="profile-edit" aria-label="Edit profile">'+menuIcon('settings')+'</button></div><section class="card profile profile-hero">'+avatarHtml('@'+myHandle(),S.settings.avatar,'xl')+'<h2>@'+esc(myHandle())+'</h2>'+featuredMedalHtml(award)+'<div class="public-belt"><i style="background:'+(BELT_COLOR[S.belt.belt.split('-')[0]]||'#999')+'"></i>'+esc(belt.n)+' · '+S.belt.stripes+' stripes</div><button type="button" class="profile-club club-link" data-act="club-profile" data-id="'+esc(CLUB.id||'')+'"><span class="lbl">Club</span><b>'+esc(CLUB.profile?.n||'—')+'</b></button>'+(S.settings.bio?'<p class="profile-bio">'+esc(S.settings.bio)+'</p>':'')+'</section>'+profileMenu(true);
 if(UI.profileSection==='leaderboard')h+=CLUB.id?scoreCard(myUid()):'<div class="card"><p class="empty">Join a club to see the leaderboard.</p></div>';
 if(UI.profileSection==='competition')h+=competitionRows(S.comp.events);
 if(UI.profileSection==='friends')h+=socialOn()?profileFriends(friendMembers(),true):'<div class="card"><p class="empty">Social is unavailable for accounts under 13.</p></div>';
 if(UI.profileSection==='workouts'){const rows=sessionsSorted();h+='<section class="profile-workouts">'+(rows.length?rows.slice(0,UI.profileCount).map(ownProfilePost).map(feedCard).join(''):'<div class="card"><p class="empty">No training yet.</p></div>')+'</section>'+(rows.length>UI.profileCount?'<button class="btn ghost wide" data-act="profile-more">More training</button>':'')+'<button class="text-button wide" data-act="my-workouts">My training history</button>';}
 return h;
};
/* A revoked membership must not be recreated automatically from an old saved clubId. */
const removedMemberSync=clubUpdateMe;
clubUpdateMe=async function(){if(CLUB.id){const current=await cget('club/'+CLUB.id+'/members');if(current?.removed?.[myUid()]&&!(current.list||[]).some(m=>m.uid===myUid())){S.settings.clubId='';save('settings');await clubLoad();return;}if(current)CLUB.members=current;}return removedMemberSync();};
const joiningAfterRemoval=clubJoin;
clubJoin=async function(id,code,coach){const roster=await cget('club/'+id+'/members');if(roster?.removed?.[myUid()]&&!(roster.list||[]).some(m=>m.uid===myUid())){toast('Ask your coach to restore your club membership');return;}return joiningAfterRemoval(id,code,coach);};
const closeV10=closeSheet;
closeSheet=function(){closeV10();$('sheet').classList.remove('settings-sheet','club-profile-editor');};
document.addEventListener('input',e=>{if(['duration-hours','duration-minutes'].includes(e.target.id)){const h=Math.min(24,Math.max(0,+sv('duration-hours')||0)),m=Math.min(59,Math.max(0,+sv('duration-minutes')||0));$('f-min').value=h*60+m;$('duration-exact').textContent=fmtT((h*60+m)*60);updateFinishStats();}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const d=b.dataset;
 if(d.act==='post-options')postOptions(d.id,d.d);
 if(d.act==='settings-profile'){closeSheet();profileEditSheet();}
 if(d.act==='settings-password'){closeSheet();recoverySheet('password');}
 if(d.act==='profile-section'){UI.profileSection=d.v;UI.profileCount=12;render();}
 if(d.act==='profile-more'){UI.profileCount+=12;render();}
 if(d.act==='session-date-open'){const calendar=$('session-date-calendar');calendar.hidden=!calendar.hidden;if(!calendar.hidden)sessionCalendar(sv('f-d').slice(0,7));}
 if(d.act==='session-calendar-month')sessionCalendar(addMonth(UI.sheet.calendarMonth,+d.step));
 if(d.act==='session-date-pick'){$('f-d').value=d.d;$('session-date-label').textContent=fmtLong(d.d);$('session-date-calendar').hidden=true;}
 if(d.act==='duration-preset')syncDurationFields();
});

/* Club discovery, public profiles, compact images and coach-editable media. */
const PUBLIC_CLUBS=new Map();UI.publicClubId=null;
function clubLogo(p,size=''){return '<span class="club-logo '+size+'">'+(p.logo?'<img src="'+esc(p.logo)+'" alt="'+esc(p.n||'Club')+' logo">':'<span>'+esc((p.n||'Club').slice(0,2).toUpperCase())+'</span>')+'</span>';}
async function clubApi(action,id,body){
 if(mode==='local'){
  const path='club/'+id+'/profile',p=await cget(path);if(!p)throw Error('Club unavailable');const roster=await cget('club/'+id+'/members')||{list:[]};
  if(action==='profile'){const records=await clist('club/'+id+'/reviews/'),reviews=records.map(r=>r.data).filter(r=>r.rating>0);return {profile:{...window.ARROW_CLUB.project(p),open:!!p.open},canEdit:isSuper()||(p.admins||[]).includes(myUid()),canReview:roster.list.some(m=>m.uid===myUid()),reviews,reviewCount:reviews.length,rating:reviews.length?reviews.reduce((n,r)=>n+r.rating,0)/reviews.length:0,myReview:reviews.find(r=>r.uid===myUid()),version:'local'};}
  if(action==='update'){Object.assign(p,window.ARROW_CLUB.clean(body.profile));await cset(path,p);const index=await cget('clubs/index');if(index){const row=index.list.find(c=>c.id===id);if(row)row.logo=p.logo;await cset('clubs/index',index);}return {ok:true};}
  if(action==='review'){await cset('club/'+id+'/reviews/'+myUid(),{uid:myUid(),username:myHandle(),rating:+body.rating,comment:body.comment,t:Date.now()});return {ok:true};}
  if(action==='review-remove'){await cset('club/'+id+'/reviews/'+myUid(),{rating:0});return {ok:true};}
  if(action==='member-remove'){const member=roster.list.find(m=>m.uid===body.id||m.id===body.id);if(!member)return {ok:true};if((p.admins||[]).includes(member.uid))throw Error('Remove coach role before removing this member');roster.list=roster.list.filter(m=>m!==member);roster.removed={...roster.removed,[member.uid||member.id]:{at:Date.now(),by:myUid(),member}};await cset('club/'+id+'/members',roster);return {ok:true};}
 }
 const query=new URLSearchParams({action,club:id}),r=await fetch('/api/club?'+query,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+await SB.token(),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify({...body,action,club:id})}:{}),cache:'no-store',signal:AbortSignal.timeout(30000)}),j=await r.json();if(!r.ok)throw Error(j.error||'Could not load club');return j;
}
async function loadPublicClub(id,reload=false){if(PUBLIC_CLUBS.has(id)&&!reload)return;PUBLIC_CLUBS.set(id,{busy:true});try{const result=await clubApi('profile',id);PUBLIC_CLUBS.set(id,result);}catch(e){PUBLIC_CLUBS.set(id,{error:e.message});}if(UI.tab==='clubProfile'&&UI.publicClubId===id)render();}
function openPublicClub(id){if(!id){UI.tab='club';go();return;}UI.clubOrigin=UI.tab==='clubProfile'?UI.clubOrigin:UI.tab;UI.publicClubId=id;UI.tab='clubProfile';go('enter-l');loadPublicClub(id,true);}
function clubExternal(url,label){const safe=window.ARROW_CLUB.url(url);return safe?'<a class="club-contact-link" href="'+esc(safe)+'" target="_blank" rel="noopener noreferrer">'+label+' ↗</a>':'';}
VIEWS.clubProfile=function(){const state=PUBLIC_CLUBS.get(UI.publicClubId);let h='<div class="pf-nav"><button class="icon-btn" data-act="club-profile-back">‹ Back</button></div>';if(!state||state.busy)return h+shimmer('profile');if(state.error)return h+'<div class="card"><p>'+esc(state.error)+'</p><button class="btn ghost" data-act="club-profile-retry">Try again</button></div>';const p=state.profile;
 h+='<section class="card club-public-hero">'+clubLogo(p,'large')+'<span class="eyebrow">JIU-JITSU ACADEMY</span><h2>'+esc(p.n)+'</h2><p class="muted">'+esc(p.city||'')+'</p><div class="club-rating"><b>★ '+(state.reviewCount?state.rating.toFixed(1):'—')+'</b><span>'+state.reviewCount+' reviews</span></div><div class="actions">'+(CLUB.id===p.id?'<button class="btn wide" data-act="tab" data-v="club">Open my club</button>':'<button class="btn wide" data-act="club-profile-join" data-id="'+esc(p.id)+'">Join club</button>')+(state.canEdit?'<button class="btn ghost" data-act="club-public-edit">Edit club profile</button>':'')+'</div></section>';
 h+='<section class="card"><h3>About the club</h3><p class="club-copy">'+esc(p.about||'')+'</p>'+(p.amenities?'<div class="club-amenities">'+p.amenities.split(',').map(s=>'<span class="chip">'+esc(s.trim())+'</span>').join('')+'</div>':'')+(p.visitorInfo?'<div class="club-visitor"><h3>First visit</h3><p>'+esc(p.visitorInfo)+'</p></div>':'')+'</section>';
 if(p.gallery?.length)h+='<section class="card"><h3>Gym & team</h3><div class="club-gallery">'+p.gallery.map((photo,i)=>'<button type="button" data-act="club-photo-view" data-i="'+i+'"><img src="'+esc(photo.photo)+'" alt="'+esc(photo.caption||photo.kind)+'" loading="lazy"><span>'+esc(photo.caption||(photo.kind==='team'?'Team':'Gym'))+'</span></button>').join('')+'</div></section>';
 if(p.teachers?.length)h+='<section class="card"><h3>Coaches</h3><div class="public-teachers">'+p.teachers.map(t=>'<article class="public-teacher"><div>'+avatarHtml(t.name,t.photo,'sm')+'<span><b>'+esc(t.name)+'</b><small>'+esc(t.belt)+'</small></span></div><p>'+esc(t.bio)+'</p>'+(t.achievements?'<small>'+esc(t.achievements)+'</small>':'')+'</article>').join('')+'</div></section>';
 if(p.achievements)h+='<section class="card"><h3>Club achievements</h3><p class="club-copy">'+esc(p.achievements)+'</p></section>';
 h+='<section class="card"><h3>Classes</h3>'+(p.schedule?.length?'<div class="list">'+p.schedule.slice().sort((a,b)=>a.d-b.d||String(a.t).localeCompare(b.t)).map(s=>'<div class="row"><div class="txt"><b>'+esc(s.n||KIND[s.kind]||'Training')+'</b><small>'+esc(DAYS[s.d]||'')+' · '+esc(s.t||'')+' · '+esc(s.group==='kids'?'Kids':s.group==='all'?'All ages':'Adults')+'</small></div></div>').join('')+'</div>':'<p class="empty">Ask the club for the current schedule.</p>')+'</section>';
 h+='<section class="card"><h3>Membership fees</h3><div class="club-public-fees">'+[['Adults',p.fee?.month],['Kids',p.fee?.kidsMonth],['Drop-in',p.fee?.drop]].map(([label,amount])=>'<span>'+label+'<b>'+(+amount>0?fmtMoney(amount):tr('Ask the club'))+'</b></span>').join('')+'</div></section>';
 h+='<section class="card"><h3>Visit & contact</h3><p>'+esc(p.addr||'')+'</p><div class="club-links">'+(p.phone?'<a class="club-contact-link" href="tel:'+esc(p.phone.replace(/[^+\d]/g,''))+'">'+esc(p.phone)+'</a>':'')+clubExternal(p.website,'Website')+clubExternal(p.facebook,'Facebook')+(p.ig?clubExternal('https://instagram.com/'+p.ig.replace(/^@/,'').replace(/[^a-zA-Z0-9._]/g,''),'Instagram'):'')+clubExternal(p.mapUrl||'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([p.n,p.addr,p.city].filter(Boolean).join(' ')),'Open map')+'</div></section>';
 h+='<section class="card"><div class="card-head"><h3>Reviews</h3>'+((state.canReview&&socialOn())?'<button class="text-button" data-act="club-review">'+(state.myReview?'Edit review':'Write review')+'</button>':'')+'</div>'+(state.reviews?.length?'<div class="list">'+state.reviews.map(r=>'<article class="club-review"><div><b>@'+esc(r.username||'member')+'</b><span class="review-stars">'+'★'.repeat(r.rating)+'</span></div><p>'+esc(r.comment||'')+'</p><small>'+new Date(r.t).toLocaleDateString()+'</small></article>').join('')+'</div>':'<p class="empty">No reviews yet.</p>')+'</section>';return h;
};
async function resizeClubPhoto(file,max=960){if(file.size>20*1024*1024)throw Error('Choose a photo under 20 MB');const url=URL.createObjectURL(file),img=new Image();try{img.src=url;await img.decode();const canvas=document.createElement('canvas');let scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));let photo='';for(let attempt=0;attempt<8;attempt++){canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);photo=canvas.toDataURL('image/jpeg',.74);if(photo.length<=180000)return photo;scale*=.8;}throw Error('Could not resize the photo');}finally{URL.revokeObjectURL(url);}}
function clubMediaRows(){const data=UI.sheet?.clubDraft;if(!data)return;$('club-gallery-editor').innerHTML=data.gallery.map((x,i)=>'<div class="club-photo-editor"><img src="'+esc(x.photo)+'" alt="Club photo"><input data-gallery-caption="'+i+'" aria-label="Photo caption" value="'+esc(x.caption||'')+'" placeholder="Photo caption"><button type="button" class="text-button danger" data-act="club-photo-remove" data-i="'+i+'">Remove</button></div>').join('');$('club-teachers-editor').innerHTML=data.teachers.map((t,i)=>'<section class="teacher-editor"><div class="card-head"><h3>Coach '+(i+1)+'</h3><button type="button" class="text-button danger" data-act="club-teacher-remove" data-i="'+i+'">Remove</button></div><div class="teacher-photo-row">'+avatarHtml(t.name,t.photo,'sm')+'<label class="btn ghost">Choose a photo<input type="file" accept="image/*" data-teacher-photo="'+i+'" hidden></label></div>'+[['name','Name'],['belt','Belt / rank'],['bio','Introduction'],['achievements','Achievements']].map(([key,label])=>'<label class="field">'+label+(key==='bio'||key==='achievements'?'<textarea data-teacher-field="'+key+'" data-i="'+i+'">'+esc(t[key]||'')+'</textarea>':'<input data-teacher-field="'+key+'" data-i="'+i+'" value="'+esc(t[key]||'')+'">')+'</label>').join('')+'</section>').join('');}
function clubPublicEditor(){const state=PUBLIC_CLUBS.get(UI.publicClubId);if(!state?.canEdit)return;const p=state.profile,draft=window.ARROW_CLUB.clean(p);let h='<section class="form-section"><h3>Club logo</h3><div id="club-logo-preview">'+clubLogo(p,'large')+'</div><label class="btn ghost">Choose a logo<input id="club-logo-file" type="file" accept="image/*" hidden></label><button class="text-button danger" data-act="club-logo-remove">Remove logo</button><div id="club-logo-crop"></div></section>'+field('cp-about','About the club',ta('cp-about',p.about||'',''));
 h+='<section class="form-section"><h3>Gym & team photos</h3><div id="club-gallery-editor"></div><select id="club-gallery-kind" aria-label="Photo category"><option value="gym">Gym</option><option value="team">Team</option></select><label class="btn ghost wide">Add photos<input id="club-gallery-files" type="file" accept="image/*" multiple hidden></label><p class="muted small">Up to 6 compressed photos.</p></section><section class="form-section"><h3>Coaches</h3><div id="club-teachers-editor"></div><button type="button" class="btn ghost wide" data-act="club-teacher-add">Add coach introduction</button></section>';
 h+=field('cp-achievements','Club achievements',ta('cp-achievements',p.achievements||'',''))+field('cp-visitorInfo','First visit',ta('cp-visitorInfo',p.visitorInfo||'','What to bring, beginner trial, visiting athletes…'))+field('cp-amenities','Facilities',inp('cp-amenities',p.amenities||'','text','placeholder="Showers, changing rooms, parking"'))+field('cp-website','Website',inp('cp-website',p.website||'','url'))+field('cp-facebook','Facebook',inp('cp-facebook',p.facebook||'','url'))+field('cp-mapUrl','Map link',inp('cp-mapUrl',p.mapUrl||'','url'));
 openSheet('Edit club profile',h,{saveLabel:'Save club profile',state:{clubDraft:draft,mediaBusy:0},async onSave(){if(UI.sheet.mediaBusy){toast('Wait for your photos to finish');return false;}const data={...UI.sheet.clubDraft};for(const k of ['about','achievements','visitorInfo','amenities','website','facebook','mapUrl'])data[k]=sv('cp-'+k);await clubApi('update',p.id,{version:state.version,profile:data});if(CLUB.id===p.id){CLUB.profile={...CLUB.profile,...data};const row=CLUB.index?.list.find(c=>c.id===p.id);if(row)row.logo=data.logo;}await loadPublicClub(p.id,true);toast('Club profile saved');return true;}});$('sheet').classList.add('club-profile-editor','modern-sheet');clubMediaRows();
}
function clubReviewSheet(){const state=PUBLIC_CLUBS.get(UI.publicClubId);if(!state?.canReview||!socialOn())return;const r=state.myReview||{};openSheet('Your club review','<div class="review-rating">'+[1,2,3,4,5].map(v=>'<button type="button" class="'+(v<=(r.rating||5)?'on':'')+'" data-act="review-star" data-v="'+v+'" aria-label="'+v+' stars">★</button>').join('')+'</div>'+field('club-review-comment','Review',ta('club-review-comment',r.comment||'','Share your experience')),{state:{rating:r.rating||5},saveLabel:'Save review',async onSave(){await clubApi('review',UI.publicClubId,{rating:UI.sheet.rating,comment:sv('club-review-comment')});await loadPublicClub(UI.publicClubId,true);return true;},onDelete:r.uid?async()=>{await clubApi('review-remove',UI.publicClubId,{});await loadPublicClub(UI.publicClubId,true);return true;}:null});}
const clubLogoView=VIEWS.club;
VIEWS.club=function(){let h=clubLogoView();if(CLUB.profile){h=h.replace('<h2>'+esc(CLUB.profile.n)+'</h2>','<button type="button" class="club-banner" data-act="club-profile" data-id="'+esc(CLUB.id)+'">'+clubLogo(CLUB.profile)+'<h2>'+esc(CLUB.profile.n)+'</h2>'+CHEV+'</button>');}else for(const c of CLUB.index?.list||[])h=h.replace('<div class="txt"><b>'+esc(c.n)+'</b>','<div class="txt"><button type="button" class="club-directory-title" data-act="club-profile" data-id="'+esc(c.id)+'">'+clubLogo(c)+'<b>'+esc(c.n)+'</b></button>');return h;};
const feedWithPostTimes=feedPost;
feedPost=async function(rec,previous){await feedWithPostTimes(rec,previous);const published=FEED.raw.get(rec.id);if(published?.t){rec.postedAt=published.t;save('log');}};
let pendingClubProfile=new URLSearchParams(location.search).get('club');if(pendingClubProfile&&!/^[a-zA-Z0-9_-]{1,100}$/.test(pendingClubProfile))pendingClubProfile=null;
const renderClubProfiles=render;
render=function(anim){if(pendingClubProfile&&myAge()!==null&&contactComplete()){const id=pendingClubProfile;pendingClubProfile=null;openPublicClub(id);return;}renderClubProfiles(anim);};
document.addEventListener('input',e=>{if(!UI.sheet?.clubDraft)return;const d=e.target.dataset;if(d.galleryCaption!==undefined)UI.sheet.clubDraft.gallery[+d.galleryCaption].caption=e.target.value;if(d.teacherField)UI.sheet.clubDraft.teachers[+d.i][d.teacherField]=e.target.value;});
document.addEventListener('change',async e=>{const sheet=UI.sheet;if(!sheet?.clubDraft)return;const file=e.target.files?.[0];if(!file)return;sheet.mediaBusy++;try{
 if(e.target.id==='club-logo-file'){const version=sheet.logoVersion=(sheet.logoVersion||0)+1;await window.ARROW_PHOTO.crop($('club-logo-crop'),file,photo=>{if(UI.sheet!==sheet||sheet.logoVersion!==version)return;sheet.clubDraft.logo=photo;$('club-logo-preview').innerHTML=clubLogo({logo:photo,n:CLUB.profile?.n},'large');},()=>UI.sheet===sheet&&sheet.logoVersion===version,128);}
 if(e.target.id==='club-gallery-files'){for(const f of e.target.files){if(sheet.clubDraft.gallery.length>=6){toast('Up to 6 photos');break;}const photo=await resizeClubPhoto(f);if(UI.sheet!==sheet)return;sheet.clubDraft.gallery.push({id:uid(),photo,kind:sv('club-gallery-kind')||'gym',caption:''});}clubMediaRows();}
 if(e.target.dataset.teacherPhoto!==undefined){const photo=await resizeClubPhoto(file,128);if(UI.sheet!==sheet)return;sheet.clubDraft.teachers[+e.target.dataset.teacherPhoto].photo=photo;clubMediaRows();}
 }catch(err){toast(err.message||'Could not read photo');}finally{sheet.mediaBusy--;if(e.target.isConnected)e.target.value='';}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const d=b.dataset;
 if(d.act==='club-profile')openPublicClub(d.id);
 if(d.act==='club-profile-back'){UI.tab=UI.clubOrigin&&VIEWS[UI.clubOrigin]?UI.clubOrigin:'club';go('enter-r');}
 if(d.act==='club-profile-retry')loadPublicClub(UI.publicClubId,true);
 if(d.act==='club-public-edit')clubPublicEditor();
 if(d.act==='club-profile-join'){const p=PUBLIC_CLUBS.get(d.id)?.profile;if(p?.open)clubJoin(d.id,'',false);else joinSheet(d.id,false);}
 if(d.act==='club-photo-view'){const p=PUBLIC_CLUBS.get(UI.publicClubId)?.profile?.gallery[+d.i];if(p){openSheet(p.caption||'Club photo','<img class="club-full-photo" src="'+esc(p.photo)+'" alt="'+esc(p.caption||'Club photo')+'">',{});$('sheet-body').querySelector('.foot').innerHTML='<button class="btn wide" data-act="sheet-close">Done</button>';}}
 if(d.act==='club-teacher-add'&&UI.sheet?.clubDraft){if(UI.sheet.clubDraft.teachers.length>=12)return;UI.sheet.clubDraft.teachers.push({id:uid(),name:'',belt:'',bio:'',photo:'',achievements:''});clubMediaRows();}
 if(d.act==='club-teacher-remove'){UI.sheet?.clubDraft?.teachers.splice(+d.i,1);clubMediaRows();}
 if(d.act==='club-photo-remove'){UI.sheet?.clubDraft?.gallery.splice(+d.i,1);clubMediaRows();}
 if(d.act==='club-logo-remove'&&UI.sheet?.clubDraft){UI.sheet.logoVersion=(UI.sheet.logoVersion||0)+1;UI.sheet.clubDraft.logo='';$('club-logo-preview').innerHTML=clubLogo({n:PUBLIC_CLUBS.get(UI.publicClubId)?.profile?.n},'large');$('club-logo-crop').innerHTML='';}
 if(d.act==='club-review')clubReviewSheet();
 if(d.act==='review-star'&&UI.sheet){UI.sheet.rating=+d.v;document.querySelectorAll('[data-act="review-star"]').forEach(x=>x.classList.toggle('on',+x.dataset.v<=+d.v));}
});

const PROFILE_FEEDS=new Map();let profileFeedObserver=null;
function profileFeedState(id){const key=CLUB.id+':'+id;if(!PROFILE_FEEDS.has(key))PROFILE_FEEDS.set(key,{posts:[],cursor:null,done:false,busy:false,error:false});return PROFILE_FEEDS.get(key);}
async function loadProfileFeed(id){const state=profileFeedState(id),club=CLUB.id;if(state.busy||state.done)return;state.busy=true;state.error=false;try{let j;if(mode==='local'){const doc=await clist('club/'+CLUB.id+'/feed/');const friends=new Set(acceptedFriends());const all=doc.flatMap(r=>r.data.list||[]).filter(p=>p.uid===id&&p.audience!=='private'&&(p.audience!=='friends'||id===myUid()||friends.has(id))).sort(window.ARROW_FEED.compare);const offset=state.cursor?.offset||0;j={posts:all.slice(offset,offset+12),next:offset+12<all.length?{offset:offset+12}:null};}else j=await communityRequest('profile-feed',null,{uid:id,...(state.cursor?{cursor:JSON.stringify(state.cursor)}:{})});if(CLUB.id!==club)return;const posts=[];for(const p of j.posts||[]){if(p.sealed){const opened=await A.openPayload(p.sealed,myUid(),S.settings.socialKey?.privateKey);if(opened)posts.push({...opened,kudos:p.kudos||[]});}else posts.push(p);}state.posts=[...new Map([...state.posts,...posts].map(p=>[p.id,p])).values()].sort(window.ARROW_FEED.compare);state.cursor=j.next;state.done=!j.next;}catch(_){state.error=true;}finally{state.busy=false;if(UI.tab==='memberProfile'&&UI.profileUid===id)render();}}
function publicWorkoutFeed(id){const state=profileFeedState(id);if(!state.posts.length&&!state.done&&!state.busy&&!state.error)queueMicrotask(()=>loadProfileFeed(id));let h='<section class="profile-workouts">'+state.posts.map(feedCard).join('')+'</section>';if(!state.posts.length&&!state.done&&!state.error)h+=shimmer('feed');if(state.error)h+='<button class="btn ghost wide" data-act="public-profile-more">Try again</button>';else if(!state.done)h+='<button class="text-button wide" id="public-profile-tail" data-act="public-profile-more"'+(state.busy?' disabled':'')+'>More training</button>';else if(!state.posts.length)h+='<div class="card"><p class="empty">No training yet.</p></div>';return h;}
VIEWS.memberProfile=function(){const id=UI.profileUid,state=COMMUNITY.profiles.get(id);let h='<div class="pf-nav"><button class="icon-btn" data-act="profile-back">‹ Back</button></div>';if(!state||state.busy)return h+shimmer('profile');if(state.error)return h+'<div class="card"><p class="empty">Could not open profile.</p><button class="btn ghost" data-act="profile-retry">Try again</button></div>';const p=state.profile;h+='<section class="card profile profile-hero">'+avatarHtml('@'+p.username,p.av,'xl')+'<h2>@'+esc(p.username)+'</h2>'+featuredMedalHtml(p.featuredMedal)+'<span class="public-belt"><i style="background:'+(BELT_COLOR[p.belt.split('-')[0]]||'#999')+'"></i>'+esc(p.belt)+' · '+(+p.stripes||0)+' stripes</span><button type="button" class="profile-club club-link" data-act="club-profile" data-id="'+esc(CLUB.id)+'"><span class="lbl">Club</span><b>'+esc(p.club)+'</b></button>'+(p.bio?'<p class="profile-bio">'+esc(p.bio)+'</p>':'')+friendButton(id)+'</section>'+profileMenu(false,p.show);if(UI.profileSection==='leaderboard')h+=scoreCard(id);if(UI.profileSection==='workouts')h+=publicWorkoutFeed(id);if(UI.profileSection==='competition')h+=competitionRows(p.competition||[]);if(UI.profileSection==='friends')h+=profileFriends(p.friends||[],false);return h;};
const viewOtherProfile=profileSheet;
profileSheet=function(id){UI.profileSection='workouts';PROFILE_FEEDS.delete(CLUB.id+':'+id);viewOtherProfile(id);};
const decorateProfiles=render;
render=function(anim){decorateProfiles(anim);document.body.dataset.page=UI.tab;if(profileFeedObserver)profileFeedObserver.disconnect();const tail=UI.tab==='memberProfile'?$('public-profile-tail'):UI.tab==='profile'&&UI.profileSection==='workouts'?document.querySelector('[data-act="profile-more"]'):null;if(tail&&'IntersectionObserver'in window){profileFeedObserver=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;if(UI.tab==='memberProfile'){const state=profileFeedState(UI.profileUid);if(!state.error)loadProfileFeed(UI.profileUid);}else{UI.profileCount+=12;render();}},{rootMargin:'0px 0px 180px 0px'});profileFeedObserver.observe(tail);}};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b?.dataset.act==='public-profile-more')loadProfileFeed(UI.profileUid);});

/* ---------- boot ---------- */
try { const t = localStorage.getItem("bjj-theme"); if (t && t !== "system") document.documentElement.dataset.theme = t; } catch (e) {}
try { const l = localStorage.getItem("bjj-lang"); I18N.lang = l === "en" ? "en" : "mn"; } catch (e) { I18N.lang = "mn"; }
if (I18N.lang === "mn") I18N.start();
try { const u = new URLSearchParams(location.search); const pj = parseJoinParams(u); if (pj) { localStorage.setItem("bjj-join", JSON.stringify(pj)); history.replaceState(null, "", location.pathname + location.hash); } } catch (e) {}
if (SB.configured()) { resetPasswordFromLink().then(handled=>{if(handled)return; SB.loadSession(); if (SB.session) { setSync("saving", ""); startCloud(); } else showLogin("", !!pendingJoin()); }); } else startLocal();
})();
