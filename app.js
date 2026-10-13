/* ============================================================
   KruNoiNa Math — แกนกลางของเว็บไซต์
   ------------------------------------------------------------
   · เชื่อม Firebase (ถ้าตั้งค่าแล้ว) · ถ้ายังไม่ตั้งค่าจะใช้เนื้อหาตั้งต้น
   · เมนู / โลโก้ / ฟุตเตอร์ / สลับโหมดสว่าง-มืด
   · กล่องขยายรูป · ประตูฝากกดติดตามเพจก่อนดาวน์โหลด
   ============================================================ */

import { firebaseConfig, ADMIN_DOMAIN, FACEBOOK_URL, FOLLOW_GATE } from "./firebase-config.js";
import * as D from "./data-defaults.js";

const SDK = "https://www.gstatic.com/firebasejs/10.14.1";

/* ---------- สถานะส่วนกลาง ---------- */
export const KN = {
  ready: null,
  online: false,     // เชื่อม Firebase ได้หรือไม่
  user: null,        // ผู้ใช้แอดมินที่ล็อกอินอยู่
  fb: null,          // { app, auth, db, fns }
  D                  // เนื้อหาตั้งต้น
};
window.KN = KN;

const cache = new Map();
const isConfigured = () =>
  firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).includes("ใส่ค่า");

/* ---------- เชื่อม Firebase ---------- */
async function connect(){
  if (!isConfigured()) return false;
  try{
    const [appMod, authMod, dbMod] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-auth.js`),
      import(`${SDK}/firebase-firestore.js`)
    ]);
    const app  = appMod.initializeApp(firebaseConfig);
    const auth = authMod.getAuth(app);
    const db   = dbMod.getFirestore(app);
    KN.fb = { app, auth, db, A: authMod, F: dbMod };
    KN.online = true;

    await new Promise(res => {
      const off = authMod.onAuthStateChanged(auth, u => {
        KN.user = u || null;
        document.documentElement.classList.toggle("is-admin", !!u);
        window.dispatchEvent(new CustomEvent("kn:auth", { detail:{ user:u||null } }));
        off_once(); res();
      });
      function off_once(){ /* ปล่อยให้ listener ทำงานต่อ */ }
      setTimeout(res, 4000);
    });
    return true;
  }catch(err){
    console.warn("[KruNoiNa] เชื่อม Firebase ไม่สำเร็จ ใช้เนื้อหาตั้งต้นแทน:", err.message);
    KN.online = false;
    return false;
  }
}
KN.ready = connect();

/* ---------- ชั้นข้อมูล ---------- */
const DEFAULT_MAP = {
  education:D.EDUCATION, career:D.CAREER, roles:D.ROLES, awards:D.AWARDS,
  students:D.STUDENTS, innovations:D.INNOVATIONS, trainings:D.TRAININGS,
  certs:D.CERTS, grades:D.GRADES, reallife:D.REALLIFE, news:D.NEWS,
  downloads:D.DOWNLOADS, quiz:D.QUIZ
};
const DEFAULT_DOC = { site:D.SITE, teacher:D.TEACHER };

/** อ่านรายการ (array) — ใช้ของใน Firebase ถ้ามี ไม่งั้นใช้ของตั้งต้น */
export async function list(name){
  if (cache.has(name)) return cache.get(name);
  let out = (DEFAULT_MAP[name] || []).slice();
  await KN.ready;
  if (KN.online){
    try{
      const { collection, getDocs } = KN.fb.F;
      const snap = await getDocs(collection(KN.fb.db, name));
      if (!snap.empty){
        out = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      }
    }catch(e){ console.warn(`[KruNoiNa] อ่าน ${name} ไม่ได้:`, e.message); }
  }
  out.sort((a,b) => (a.order ?? 999) - (b.order ?? 999));
  cache.set(name, out);
  return out;
}

/** อ่านเอกสารเดี่ยว เช่น site / teacher */
export async function one(name){
  const key = "doc:"+name;
  if (cache.has(key)) return cache.get(key);
  let out = { ...(DEFAULT_DOC[name] || {}) };
  await KN.ready;
  if (KN.online){
    try{
      const { doc, getDoc } = KN.fb.F;
      const snap = await getDoc(doc(KN.fb.db, "site", name));
      if (snap.exists()) out = { ...out, ...snap.data() };
    }catch(e){ console.warn(`[KruNoiNa] อ่าน ${name} ไม่ได้:`, e.message); }
  }
  cache.set(key, out);
  return out;
}

/* ---------- เขียนข้อมูล (เฉพาะแอดมิน) ---------- */
export async function saveItem(name, item){
  if (!KN.online) throw new Error("ยังไม่ได้ตั้งค่า Firebase");
  const { doc, setDoc, collection } = KN.fb.F;
  const id = item.id || (name.slice(0,2) + Date.now().toString(36));
  const body = { ...item }; delete body.id;
  await setDoc(doc(collection(KN.fb.db, name), id), body, { merge:true });
  cache.delete(name);
  return id;
}
export async function removeItem(name, id){
  if (!KN.online) throw new Error("ยังไม่ได้ตั้งค่า Firebase");
  const { doc, deleteDoc, collection } = KN.fb.F;
  await deleteDoc(doc(collection(KN.fb.db, name), id));
  cache.delete(name);
}
export async function saveDoc(name, data){
  if (!KN.online) throw new Error("ยังไม่ได้ตั้งค่า Firebase");
  const { doc, setDoc } = KN.fb.F;
  await setDoc(doc(KN.fb.db, "site", name), data, { merge:true });
  cache.delete("doc:"+name);
}
/** คัดลอกเนื้อหาตั้งต้นขึ้น Firebase ครั้งแรก */
export async function seed(name){
  const src = DEFAULT_MAP[name] || [];
  for (const it of src) await saveItem(name, it);
  return src.length;
}
export function clearCache(){ cache.clear(); }

/* ---------- เข้าสู่ระบบ ---------- */
export async function login(username, password){
  await KN.ready;
  if (!KN.online) throw new Error("ยังไม่ได้ตั้งค่า Firebase — เปิดไฟล์ firebase-config.js แล้วใส่ค่าก่อนค่ะ");
  const email = username.includes("@") ? username : `${username.trim()}@${ADMIN_DOMAIN}`;
  const cred = await KN.fb.A.signInWithEmailAndPassword(KN.fb.auth, email, password);
  KN.user = cred.user;
  return cred.user;
}
export async function logout(){
  if (KN.online) await KN.fb.A.signOut(KN.fb.auth);
  KN.user = null;
}
export function onAuth(fn){
  KN.ready.then(() => {
    if (!KN.online) return fn(null);
    KN.fb.A.onAuthStateChanged(KN.fb.auth, u => { KN.user = u || null; fn(u || null); });
  });
}

/* ---------- รูปภาพ: ย่อ + บีบอัดในเบราว์เซอร์ ---------- */
export function compress(file, maxPx = 1280, quality = 0.76){
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("ไฟล์นี้ไม่ใช่รูปภาพ"));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width:w, height:h } = img;
      const scale = Math.min(1, maxPx / Math.max(w, h));
      w = Math.round(w * scale); h = Math.round(h * scale);
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      const cx = cv.getContext("2d");
      cx.fillStyle = "#fff"; cx.fillRect(0, 0, w, h);
      cx.drawImage(img, 0, 0, w, h);
      let out = cv.toDataURL("image/jpeg", quality);
      // ให้แน่ใจว่าเล็กกว่าขีดจำกัดของ Firestore (1 MB ต่อเอกสาร)
      let q = quality;
      while (out.length > 700000 && q > 0.35){ q -= 0.1; out = cv.toDataURL("image/jpeg", q); }
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("เปิดรูปไม่สำเร็จ")); };
    img.src = url;
  });
}

/* ---------- ส่วนประกอบหน้าเว็บ ---------- */
const PAGES = [
  { href:"index.html",     label:"หน้าหลัก" },
  { href:"lessons.html",   label:"บทเรียน ม.1–ม.6" },
  { href:"quiz.html",      label:"แบบทดสอบออนไลน์" },
  { href:"downloads.html", label:"แจกไฟล์" },
  { href:"about.html",     label:"ประวัติและผลงาน" },
  { href:"contact.html",   label:"ติดต่อครู" }
];

function here(){
  const p = location.pathname.split("/").pop();
  return (!p || p === "") ? "index.html" : p;
}

export async function mountChrome(){
  const site = await one("site");
  const cur  = here();

  const logo = site.logo
    ? `<img src="${site.logo}" alt="">`
    : `K&#8721;`;

  const nav = PAGES.map(p =>
    `<a href="${p.href}"${p.href===cur ? ' aria-current="page"' : ''}>${p.label}</a>`
  ).join("");

  const header = document.querySelector("header.site");
  if (header){
    header.innerHTML = `
      <div class="wrap bar">
        <a class="brand" href="index.html">
          <span class="mark">${logo}</span>
          <span><b>${esc(site.brand)}</b><small>${esc(site.brandSub)}</small></span>
        </a>
        <nav class="main">${nav}</nav>
        <div class="tools">
          <button class="icon-btn" id="kn-theme" type="button" aria-label="สลับโหมดสว่าง/มืด" title="สลับโหมดสว่าง/มืด">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"></path>
            </svg>
          </button>
        </div>
      </div>`;
    header.querySelector("#kn-theme").addEventListener("click", toggleTheme);
  }

  const footer = document.querySelector("footer.site");
  if (footer){
    footer.innerHTML = `
      <div class="wrap">
        <div class="fgrid">
          <div>
            <b class="n">${esc(site.brand)}</b>
            <small class="s">${esc(site.brandSub)}</small>
            <p class="tag">&ldquo;${esc(site.tagline)}&rdquo;</p>
            <p style="margin-top:12px;font-size:14px">${esc(D.TEACHER.name)} (${esc(D.TEACHER.nickname)})<br>
              <span style="opacity:.75">${esc(D.TEACHER.position)}</span></p>
            <div class="lts" style="margin-top:16px"><span>Learn</span><span>Think</span><span>Solve</span><span>Create</span></div>
          </div>
          <div>
            <h4>เมนู</h4>
            <ul>${PAGES.slice(0,4).map(p=>`<li><a href="${p.href}">${p.label}</a></li>`).join("")}</ul>
          </div>
          <div>
            <h4>เกี่ยวกับ</h4>
            <ul>
              <li><a href="about.html">ประวัติและผลงาน</a></li>
              <li><a href="about.html#awards">รางวัลและเกียรติยศ</a></li>
              <li><a href="contact.html">ติดต่อครู</a></li>
              <li><a href="admin.html">ระบบจัดการเว็บไซต์</a></li>
            </ul>
          </div>
        </div>
        <div class="rule">
          <span>&copy; 2026 ${esc(site.brand)}. All Rights Reserved.</span>
          <span>${esc(site.footerNote)}</span>
        </div>
      </div>`;
  }

  // ไอคอนเว็บไซต์ (favicon)
  setFavicon(site.logo);
  return site;
}

function setFavicon(logoDataUrl){
  let link = document.querySelector('link[rel="icon"]');
  if (!link){ link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
  if (logoDataUrl){ link.type = "image/jpeg"; link.href = logoDataUrl; return; }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="15" fill="#123A78"/>
    <text x="32" y="43" font-family="Poppins,Arial,sans-serif" font-size="27" font-weight="700"
      fill="#fff" text-anchor="middle">K&#8721;</text></svg>`;
  link.type = "image/svg+xml";
  link.href = "data:image/svg+xml," + encodeURIComponent(svg);
}

function toggleTheme(){
  const root = document.documentElement;
  const cur = root.getAttribute("data-theme");
  const dark = cur ? cur === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", dark ? "light" : "dark");
  try{ localStorage.setItem("kn-theme", dark ? "light" : "dark"); }catch(e){}
}
try{
  const saved = localStorage.getItem("kn-theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
}catch(e){}

/* ---------- เครื่องมือเล็ก ๆ ---------- */
export function esc(s){
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
export function toast(msg, kind=""){
  document.querySelectorAll(".toast").forEach(t => t.remove());
  const el = document.createElement("div");
  el.className = "toast " + kind;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---------- กล่องขยายรูป ---------- */
let lbState = null;
export function lightbox(images, start = 0){
  closeLightbox();
  const list = images.filter(Boolean);
  if (!list.length) return;
  let i = Math.max(0, Math.min(start, list.length - 1));

  const box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", "ภาพขนาดเต็ม");
  box.innerHTML = `
    <button class="close" type="button" aria-label="ปิด">&#10005;</button>
    ${list.length > 1 ? '<button class="nav prev" type="button" aria-label="ก่อนหน้า">&#8249;</button>' : ""}
    ${list.length > 1 ? '<button class="nav next" type="button" aria-label="ถัดไป">&#8250;</button>' : ""}
    <div><img alt=""><p class="cap"></p></div>`;
  document.body.appendChild(box);

  const img = box.querySelector("img"), cap = box.querySelector(".cap");
  const draw = () => {
    const it = list[i];
    img.src = typeof it === "string" ? it : it.src;
    const c = typeof it === "string" ? "" : (it.cap || "");
    cap.textContent = list.length > 1 ? `${c} ${c ? "·" : ""} ${i+1}/${list.length}`.trim() : c;
  };
  draw();

  const step = d => { i = (i + d + list.length) % list.length; draw(); };
  box.addEventListener("click", e => {
    if (e.target.closest(".next")) return step(1);
    if (e.target.closest(".prev")) return step(-1);
    if (e.target.closest(".close") || e.target === box) return closeLightbox();
  });
  const onKey = e => {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  };
  document.addEventListener("keydown", onKey);
  lbState = { box, onKey };
  box.querySelector(".close").focus();
}
export function closeLightbox(){
  if (!lbState) return;
  lbState.box.remove();
  document.removeEventListener("keydown", lbState.onKey);
  lbState = null;
}

/* ---------- ประตู "ฝากกดติดตามเพจ" ก่อนดาวน์โหลด ----------
   หมายเหตุตามจริง: เว็บไม่สามารถตรวจสอบได้ว่าผู้ใช้กดติดตามจริงหรือไม่
   ระบบนี้จึงเป็นการ "ขอความร่วมมือ" ไม่ใช่การบังคับหรือการยืนยัน
---------------------------------------------------------------- */
const GATE_KEY = "kn-followed";
const hasFollowed = () => { try{ return localStorage.getItem(GATE_KEY) === "1"; }catch(e){ return false; } };
const markFollowed = () => { try{ localStorage.setItem(GATE_KEY, "1"); }catch(e){} };

export function requestDownload(url, label){
  if (!url) return toast("ยังไม่ได้ใส่ลิงก์ไฟล์สำหรับรายการนี้", "err");
  if (!FOLLOW_GATE || hasFollowed()) return go(url);
  openGate(url, label);
}

function go(url){ window.open(url, "_blank", "noopener"); }

function openGate(url, label){
  const fb = FACEBOOK_URL;
  const el = document.createElement("div");
  el.className = "gate";
  el.innerHTML = `
    <div class="gate-box" role="dialog" aria-modal="true" aria-labelledby="gate-t">
      <button class="gate-close" type="button" aria-label="ปิด">&#10005;</button>
      <div class="fb">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z"/>
        </svg>
      </div>
      <h3 id="gate-t">ฝากกดติดตามเพจครูน้อยหน่าด้วยนะคะ 💙</h3>
      <p>${label ? "ไฟล์ที่กำลังจะดาวน์โหลด<br><b>"+esc(label)+"</b><br><br>" : ""}
         กำลังใจจากผู้ติดตามช่วยให้ครูมีแรงทำสื่อการเรียนรู้แจกฟรีต่อไปค่ะ</p>
      <div class="acts">
        <a class="btn btn-fb" id="gate-fb" href="${fb}" target="_blank" rel="noopener">
          ไปที่เพจ Kru Noina บน Facebook
        </a>
        <div id="gate-state"></div>
      </div>
      <p class="gate-note">กดปุ่มด้านบนเพื่อเปิดเพจ แล้วกลับมาที่หน้านี้ ปุ่มดาวน์โหลดจะพร้อมใช้งานทันที<br>
        ระบบนับเฉพาะการเปิดลิงก์ ไม่ได้ตรวจสอบการกดติดตาม — ครูขอเป็นความร่วมมือเท่านั้นค่ะ</p>
    </div>`;
  document.body.appendChild(el);

  const state = el.querySelector("#gate-state");
  let opened = 0, done = false;

  const close = () => { cleanup(); el.remove(); };
  const cleanup = () => {
    document.removeEventListener("visibilitychange", onBack);
    window.removeEventListener("focus", onBack);
    document.removeEventListener("keydown", onKey);
  };
  const onKey = e => { if (e.key === "Escape") close(); };

  el.querySelector(".gate-close").addEventListener("click", close);
  el.addEventListener("click", e => { if (e.target === el) close(); });
  document.addEventListener("keydown", onKey);

  el.querySelector("#gate-fb").addEventListener("click", () => {
    opened = Date.now();
    state.innerHTML = `<div class="gate-wait"><span class="spin"></span> กลับมาที่หน้านี้เมื่อกดติดตามเสร็จแล้วค่ะ</div>`;
  });

  function onBack(){
    if (done || !opened || document.hidden) return;
    const waited = Date.now() - opened;
    if (waited < 3000){
      const left = Math.ceil((3000 - waited) / 1000);
      state.innerHTML = `<div class="gate-wait"><span class="spin"></span> อีก ${left} วินาที…</div>`;
      setTimeout(onBack, 3000 - waited + 60);
      return;
    }
    done = true;
    markFollowed();
    // ใช้ลิงก์จริงให้ผู้ใช้กดเอง เพื่อไม่ให้เบราว์เซอร์บล็อกการเปิดหน้าต่างใหม่
    state.innerHTML = `
      <div class="gate-ok" style="margin-bottom:10px">ขอบคุณมากค่ะ 🙏 ปลดล็อกเรียบร้อย</div>
      <a class="btn btn-gold" id="gate-dl" href="${encodeURI(url)}" target="_blank" rel="noopener"
         style="justify-content:center;width:100%">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 19h16"/></svg>
        ดาวน์โหลดไฟล์เลย
      </a>`;
    el.querySelector("#gate-dl").addEventListener("click", () => setTimeout(close, 400));
    el.querySelector("#gate-dl").focus();
  }
  document.addEventListener("visibilitychange", onBack);
  window.addEventListener("focus", onBack);
}

/* ---------- เริ่มทำงาน ---------- */
export async function boot(){
  const site = await mountChrome();
  document.body.classList.add("kn-ready");
  return site;
}
