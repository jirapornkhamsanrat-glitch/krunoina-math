/* ============================================================
   KruNoiNa Math — ระบบจัดการเว็บไซต์ (หมวดแอดมิน)
   ------------------------------------------------------------
   โหลดเฉพาะเมื่อเข้าหมวด #/admin เท่านั้น
   ผู้ใช้ทั่วไปจึงไม่ต้องดาวน์โหลดไฟล์นี้
   ============================================================ */

import {
  KN, one, list, esc, toast, login, logout, onAuth, navigate,
  saveItem, removeItem, saveDoc, seed, clearCache, compress, lightbox
} from "./app.js";

const $ = id => document.getElementById(id);
let CUR = "site";          // แผงที่เปิดอยู่
let bound = false;         // ผูกตัวเฝ้าสถานะล็อกอินแล้วหรือยัง

/* ============================================================
   จุดเริ่มต้นของหมวดนี้
   ============================================================ */
export async function render(host){
  host.innerHTML = `
  <div id="loginView" class="login-wrap">
    <form class="login-box pop pop-1" id="loginForm">
      <div class="lock">🔐</div>
      <h1>ระบบจัดการเว็บไซต์</h1>
      <p class="sub">KruNoiNa Math · สำหรับครูผู้ดูแลเท่านั้น</p>
      <div id="loginErr"></div>
      <div class="field">
        <label for="u">ชื่อผู้ใช้</label>
        <input id="u" type="text" autocomplete="username" required placeholder="noi_admin">
      </div>
      <div class="field">
        <label for="p">รหัสผ่าน</label>
        <input id="p" type="password" autocomplete="current-password" required placeholder="••••••••">
      </div>
      <button class="btn btn-navy" type="submit" id="loginBtn">เข้าสู่ระบบ</button>
      <p style="font-size:12.5px;color:var(--muted);text-align:center;margin-top:16px">
        <a href="#/home" style="color:var(--royal)">← กลับหน้าเว็บไซต์</a></p>
    </form>
  </div>

  <div id="adminView" hidden>
    <div class="page-head">
      <div class="wrap pop pop-1">
        <p class="crumb"><a href="#/home">หน้าหลัก</a> &#8250; ระบบจัดการ</p>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap">
          <div>
            <span class="eyebrow">Admin</span>
            <h1>ระบบจัดการเว็บไซต์</h1>
            <p class="sub">แก้ไขข้อมูลทุกส่วนของเว็บได้จากที่นี่ ไม่ต้องแตะโค้ด · บันทึกแล้วเว็บอัปเดตทันที</p>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <span class="admin-badge" id="who">● เข้าสู่ระบบแล้ว</span>
            <button class="btn btn-ghost" type="button" id="logoutBtn">ออกจากระบบ</button>
          </div>
        </div>
      </div>
    </div>
    <section>
      <div class="wrap admin-shell">
        <nav class="admin-nav" id="anav">
          <button type="button" data-p="site" aria-current="true">⚙️ ตั้งค่าเว็บไซต์</button>
          <button type="button" data-p="teacher">👩‍🏫 ข้อมูลครู</button>
          <span class="sep"></span>
          <button type="button" data-p="downloads">📦 แจกไฟล์</button>
          <button type="button" data-p="news">📢 ข่าวสาร</button>
          <span class="sep"></span>
          <button type="button" data-p="awards">🏅 รางวัล</button>
          <button type="button" data-p="students">🎒 ผลงานนักเรียน</button>
          <button type="button" data-p="trainings">📚 การพัฒนาตนเอง</button>
          <button type="button" data-p="innovations">💡 นวัตกรรม</button>
          <button type="button" data-p="career">🧭 เส้นทางการทำงาน</button>
          <button type="button" data-p="education">🎓 วุฒิการศึกษา</button>
          <button type="button" data-p="roles">⭐ บทบาท</button>
          <button type="button" data-p="certs">📜 เกียรติบัตร</button>
          <span class="sep"></span>
          <button type="button" data-p="grades">📘 บทเรียน ม.1–ม.6</button>
          <button type="button" data-p="reallife">🌏 คณิตศาสตร์รอบตัว</button>
          <button type="button" data-p="quiz">📝 แบบทดสอบ</button>
        </nav>
        <div id="panel"></div>
      </div>
    </section>
  </div>`;

  $("loginForm").addEventListener("submit", doLogin);
  $("logoutBtn").addEventListener("click", async () => {
    await logout(); clearCache(); toast("ออกจากระบบแล้ว", "ok"); navigate("home");
  });
  $("anav").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $("anav").querySelectorAll("button").forEach(x => x.setAttribute("aria-current", x === b));
    openPanel(b.dataset.p);
  });

  await KN.ready;
  if (!KN.online){
    $("loginErr").innerHTML = `<div class="login-err">
      <b>ยังไม่ได้ตั้งค่า Firebase</b><br>
      เปิดไฟล์ <code>firebase-config.js</code> แล้วใส่ค่าจาก Firebase Console ก่อนค่ะ<br>
      ขั้นตอนทั้งหมดอยู่ในไฟล์ <code>SETUP.md</code></div>`;
  }

  if (!bound){ bound = true; onAuth(applyAuth); }
  applyAuth(KN.user);
}

/* สลับระหว่างหน้าล็อกอินกับแผงจัดการ (เรียกได้หลายครั้ง) */
function applyAuth(u){
  const lv = $("loginView"), av = $("adminView");
  if (!lv || !av) return;        // ผู้ใช้ออกจากหมวดนี้ไปแล้ว
  if (u){
    lv.hidden = true; av.hidden = false;
    $("who").textContent = "● " + (u.email || "").split("@")[0];
    openPanel(CUR);
  }else{
    lv.hidden = false; av.hidden = true;
  }
}

async function doLogin(e){
  e.preventDefault();
  const btn = $("loginBtn");
  btn.disabled = true; btn.textContent = "กำลังเข้าสู่ระบบ…";
  try{
    await login($("u").value, $("p").value);
    if ($("loginErr")) $("loginErr").innerHTML = "";
  }catch(err){
    const m = String(err.code || err.message);
    const th = m.includes("invalid-credential") || m.includes("wrong-password") || m.includes("user-not-found")
      ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
      : m.includes("too-many-requests") ? "ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่"
      : m.includes("unauthorized-domain") ? "ยังไม่ได้เพิ่มโดเมนนี้ใน Authorized domains ของ Firebase"
      : m.includes("network") ? "เชื่อมต่ออินเทอร์เน็ตไม่ได้"
      : err.message;
    if ($("loginErr")) $("loginErr").innerHTML = `<div class="login-err">${esc(th)}</div>`;
  }finally{
    if ($("loginBtn")){ btn.disabled = false; btn.textContent = "เข้าสู่ระบบ"; }
  }
}

/* ============================================================
   นิยามแต่ละหมวดข้อมูล
   ============================================================ */
const FIELD = {
  text: (k, l, h) => ({ k, l, h, t:"text" }),
  area: (k, l, h) => ({ k, l, h, t:"area" }),
  url:  (k, l, h) => ({ k, l, h, t:"url" }),
  img:  (k, l, h) => ({ k, l, h, t:"img" }),
  imgs: (k, l, h) => ({ k, l, h, t:"imgs" }),
  sel:  (k, l, o) => ({ k, l, t:"sel", o }),
  num:  (k, l)    => ({ k, l, t:"num" })
};

const SPEC = {
  downloads: {
    title:"แจกไฟล์", icon:"📦",
    desc:"เพิ่มไฟล์งานให้ผู้ใช้ดาวน์โหลด ใส่รูปตัวอย่างได้สูงสุด 6 รูป",
    label: it => it.title,
    sub:   it => `${it.category || "ไม่ระบุหมวด"} · ${(it.images||[]).length} รูป`,
    badge: it => it.date || "",
    fields: [
      FIELD.text("title", "ชื่อไฟล์งาน *"),
      FIELD.area("detail", "รายละเอียด", "อธิบายว่าไฟล์นี้คืออะไร ใช้กับระดับชั้นไหน มีอะไรอยู่ข้างในบ้าง"),
      FIELD.sel("category", "หมวดหมู่", KN.D.DL_CATEGORIES),
      FIELD.text("fileType", "ชนิดไฟล์", "เช่น PDF · Word · PowerPoint · ZIP"),
      FIELD.text("date", "วันที่เผยแพร่", "เช่น 12 ต.ค. 2569"),
      FIELD.url("fileUrl", "ลิงก์ดาวน์โหลด *", "วางลิงก์ Google Drive / OneDrive ที่ตั้งค่าเป็น “ทุกคนที่มีลิงก์” แล้ว"),
      FIELD.imgs("images", "รูปตัวอย่าง (สูงสุด 6 รูป)", "ลากรูปมาวาง หรือกดเพื่อเลือกไฟล์")
    ]
  },
  news: {
    title:"ข่าวสาร", icon:"📢", desc:"ข่าวสารและบทเรียนล่าสุดที่แสดงบนหน้าแรก",
    label: it => it.title, sub: it => it.chip || "", badge: it => it.date || "",
    fields:[ FIELD.text("date","วันที่","เช่น 15 ก.ย. 2569"), FIELD.text("title","หัวข้อข่าว *"),
             FIELD.text("chip","ป้ายหมวด","เช่น แบบฝึกหัด · ข้อสอบ · Fun Zone") ]
  },
  awards: {
    title:"รางวัลและเกียรติยศ", icon:"🏅", desc:"รางวัลที่ได้รับ แสดงในหน้าประวัติและผลงาน",
    label: it => it.title, sub: it => it.org || "", badge: it => it.year || "",
    fields:[ FIELD.text("year","ปี พ.ศ. *","เช่น 2569"), FIELD.area("title","ชื่อรางวัล *"),
             FIELD.text("org","หน่วยงานที่มอบ / รายละเอียด"),
             FIELD.sel("level","ระดับ",["nation","area"]),
             FIELD.text("tag","ป้ายกำกับ","เช่น คุรุสภา · สพฐ. · เขตพื้นที่") ]
  },
  students: {
    title:"ผลงานนักเรียน", icon:"🎒", desc:"ผลการแข่งขันของนักเรียนที่อยู่ในความดูแล",
    label: it => it.title, sub: it => it.detail || "", badge: it => it.level || "",
    fields:[ FIELD.area("title","ชื่อรายการและผลรางวัล *"), FIELD.text("detail","รายละเอียดงาน/ปี/สถานที่"),
             FIELD.sel("medal","เหรียญ",["gold","silver","bronze"]),
             FIELD.text("level","ระดับ","เช่น ระดับชาติ · เขตพื้นที่") ]
  },
  trainings: {
    title:"การพัฒนาตนเอง", icon:"📚", desc:"การประชุม อบรม และสัมมนาทางวิชาการ",
    label: it => it.title, sub: it => it.org || "", badge: it => it.date || "",
    fields:[ FIELD.text("yr","ปีงบประมาณ *","เช่น 2569"), FIELD.text("date","วันที่ *","เช่น 6 มิ.ย. 2569"),
             FIELD.area("title","ชื่อหลักสูตร/กิจกรรม *"), FIELD.text("org","หน่วยงาน/รายละเอียด") ]
  },
  innovations: {
    title:"นวัตกรรม", icon:"💡", desc:"นวัตกรรมและแนวทางการจัดการเรียนรู้",
    label: it => it.title, sub: it => it.note || "", badge: it => it.icon || "",
    fields:[ FIELD.text("icon","ไอคอน (อีโมจิ)","เช่น ⚡ 📐 🧮 🤖"), FIELD.text("title","ชื่อนวัตกรรม *"),
             FIELD.area("detail","รายละเอียด *"), FIELD.text("note","หมายเหตุ/ผลลัพธ์") ]
  },
  career: {
    title:"เส้นทางการทำงาน", icon:"🧭", desc:"ไทม์ไลน์ตำแหน่งและวิทยฐานะ",
    label: it => it.title, sub: it => it.detail || "", badge: it => it.when || "",
    fields:[ FIELD.text("when","ช่วงเวลา *","เช่น 17 มิ.ย. 2560 — ปัจจุบัน"), FIELD.text("title","ตำแหน่ง *"),
             FIELD.area("detail","รายละเอียด"), FIELD.sel("current","เป็นตำแหน่งปัจจุบัน",["false","true"]) ]
  },
  education: {
    title:"วุฒิการศึกษา", icon:"🎓", desc:"ระดับการศึกษาและสถาบัน",
    label: it => it.degree, sub: it => it.institute || "", badge: it => it.year || "",
    fields:[ FIELD.text("year","ปี พ.ศ. ที่สำเร็จ *"), FIELD.text("degree","วุฒิการศึกษา *"),
             FIELD.text("institute","สถาบัน *") ]
  },
  roles: {
    title:"บทบาทและความเชี่ยวชาญ", icon:"⭐", desc:"บทบาทหน้าที่นอกเหนือจากการสอน",
    label: it => it.title, sub: it => it.detail || "", badge: it => it.icon || "",
    fields:[ FIELD.text("icon","ไอคอน (อีโมจิ)"), FIELD.text("title","ชื่อบทบาท *"),
             FIELD.area("detail","รายละเอียด *") ]
  },
  certs: {
    title:"เกียรติบัตร", icon:"📜", desc:"รูปเกียรติบัตรและประกาศที่แสดงในหน้าประวัติ",
    label: it => it.title, sub: it => it.detail || "", badge: () => "",
    thumb: it => it.img,
    fields:[ FIELD.img("img","รูปเกียรติบัตร *"), FIELD.text("title","ชื่อเกียรติบัตร *"),
             FIELD.text("detail","รายละเอียด") ]
  },
  reallife: {
    title:"คณิตศาสตร์รอบตัว", icon:"🌏", desc:"ตัวอย่างการใช้คณิตศาสตร์ในชีวิตจริง",
    label: it => it.title, sub: it => it.detail || "", badge: it => it.icon || "",
    fields:[ FIELD.text("icon","ไอคอน (อีโมจิ)"), FIELD.text("title","หัวข้อ *"),
             FIELD.area("detail","รายละเอียด *"), FIELD.text("use","เชื่อมกับบทเรียน") ]
  },
  grades: {
    title:"บทเรียน ม.1–ม.6", icon:"📘", desc:"ชื่อระดับชั้นและหัวข้อบทเรียนในแต่ละชั้น",
    label: it => `${it.g} — ${it.sub || ""}`, sub: it => `${(it.topics||[]).length} หัวข้อ`, badge: it => it.g,
    fields:[ FIELD.text("g","ระดับชั้น *","เช่น ม.1"), FIELD.text("sub","คำอธิบายสั้น *","เช่น พื้นฐานคณิตศาสตร์"),
             FIELD.text("color","สีประจำชั้น","เช่น #3B82F6"),
             FIELD.sel("icon","ไอคอน",["book","tri","calc","chart","cube","target"]),
             FIELD.area("topicsText","หัวข้อบทเรียน (บรรทัดละ 1 หัวข้อ) *") ]
  }
};

/* ============================================================
   เปิดแต่ละแผง
   ============================================================ */
async function openPanel(p){
  CUR = p;
  const el = $("panel"); if (!el) return;
  el.innerHTML = `<div class="card"><div class="skel" style="height:20px;width:40%"></div>
    <div class="skel" style="height:14px;margin-top:14px"></div>
    <div class="skel" style="height:14px;margin-top:8px;width:70%"></div></div>`;

  if (p === "site")    return panelSite(el);
  if (p === "teacher") return panelTeacher(el);
  if (p === "quiz")    return panelQuiz(el);
  return panelList(el, p);
}

/* ---------- ตั้งค่าเว็บไซต์ ---------- */
async function panelSite(el){
  const s = await one("site");
  if (!el.isConnected) return;
  el.innerHTML = `
    <div class="panel-head"><div><h2>⚙️ ตั้งค่าเว็บไซต์</h2>
      <p>ชื่อแบรนด์ โลโก้ ข้อความหน้าแรก และช่องทางติดต่อ</p></div></div>
    <div class="card">
      <div class="field"><label>โลโก้เว็บไซต์ <span class="hint">· ใช้เป็นไอคอนมุมซ้ายบนและไอคอนบนแท็บเบราว์เซอร์ แนะนำรูปสี่เหลี่ยมจัตุรัส</span></label>
        <div id="logoSlot"></div></div>
      <div class="grid2">
        <div class="field"><label>ชื่อแบรนด์</label><input type="text" id="f_brand" value="${esc(s.brand||"")}"></div>
        <div class="field"><label>คำบรรยายใต้ชื่อ</label><input type="text" id="f_brandSub" value="${esc(s.brandSub||"")}"></div>
      </div>
      <div class="field"><label>คำขวัญ (แสดงในฟุตเตอร์)</label><input type="text" id="f_tagline" value="${esc(s.tagline||"")}"></div>
      <div class="grid2">
        <div class="field"><label>หัวข้อหน้าแรก บรรทัดที่ 1</label><input type="text" id="f_heroLine1" value="${esc(s.heroLine1||"")}"></div>
        <div class="field"><label>หัวข้อหน้าแรก บรรทัดที่ 2 <span class="hint">· จะเน้นสี</span></label><input type="text" id="f_heroLine2" value="${esc(s.heroLine2||"")}"></div>
      </div>
      <div class="field"><label>ข้อความแนะนำหน้าแรก</label><textarea id="f_heroLead">${esc(s.heroLead||"")}</textarea></div>
      <div class="field"><label>หมายเหตุท้ายฟุตเตอร์</label><input type="text" id="f_footerNote" value="${esc(s.footerNote||"")}"></div>
      <h3 style="font-size:17px;margin:22px 0 12px">ช่องทางติดต่อ</h3>
      <div class="grid2">
        <div class="field"><label>อีเมล</label><input type="text" id="f_contactEmail" value="${esc(s.contactEmail||"")}" placeholder="krunoina@example.com"></div>
        <div class="field"><label>ลิงก์ LINE</label><input type="url" id="f_contactLine" value="${esc(s.contactLine||"")}" placeholder="https://line.me/..."></div>
        <div class="field"><label>ลิงก์ YouTube</label><input type="url" id="f_contactYoutube" value="${esc(s.contactYoutube||"")}" placeholder="https://youtube.com/@..."></div>
        <div class="field"><label>ลิงก์ Facebook</label><input type="url" id="f_contactFacebook" value="${esc(s.contactFacebook||"")}"></div>
      </div>
      <button class="btn btn-navy" type="button" id="saveSite">💾 บันทึกการตั้งค่า</button>
    </div>`;

  const slot = $("logoSlot");
  let logo = s.logo || "";
  const drawLogo = () => {
    slot.innerHTML = logo
      ? `<div class="thumbs"><div class="thumb"><img src="${logo}" alt="โลโก้"><button type="button" title="ลบ">&#10005;</button></div></div>`
      : `<div class="drop" tabindex="0"><div class="ic">🖼️</div><b>กดเพื่อเลือกรูปโลโก้</b><small>หรือลากไฟล์มาวาง · ระบบจะย่อขนาดให้อัตโนมัติ</small></div>`;
    if (logo) slot.querySelector("button").onclick = () => { logo = ""; drawLogo(); };
    else attachDrop(slot.querySelector(".drop"), async files => {
      try{ logo = await compress(files[0], 400, .9); drawLogo(); }
      catch(e){ toast(e.message, "err"); }
    }, false);
  };
  drawLogo();

  $("saveSite").onclick = async () => {
    const keys = ["brand","brandSub","tagline","heroLine1","heroLine2","heroLead","footerNote",
                  "contactEmail","contactLine","contactYoutube","contactFacebook"];
    const data = { logo };
    keys.forEach(k => data[k] = $("f_"+k).value.trim());
    await guard(() => saveDoc("site", data), "บันทึกการตั้งค่าแล้ว · รีเฟรชหน้าเพื่อดูโลโก้ใหม่");
  };
}

/* ---------- ข้อมูลครู ---------- */
async function panelTeacher(el){
  const t = await one("teacher");
  if (!el.isConnected) return;
  const stats = t.stats || [];
  el.innerHTML = `
    <div class="panel-head"><div><h2>👩‍🏫 ข้อมูลครู</h2>
      <p>ชื่อ ตำแหน่ง รูปภาพ และตัวเลขสรุปที่แสดงในหน้าประวัติ</p></div></div>
    <div class="card">
      <div class="field"><label>รูปครู <span class="hint">· ใช้ทั้งหน้าแรกและหน้าประวัติ แนะนำภาพครึ่งตัวแนวตั้ง</span></label>
        <div id="photoSlot"></div></div>
      <div class="grid2">
        <div class="field"><label>ชื่อ–สกุล *</label><input type="text" id="t_name" value="${esc(t.name||"")}"></div>
        <div class="field"><label>ชื่อเล่น</label><input type="text" id="t_nickname" value="${esc(t.nickname||"")}"></div>
      </div>
      <div class="grid2">
        <div class="field"><label>ตำแหน่ง/วิทยฐานะ</label><input type="text" id="t_position" value="${esc(t.position||"")}"></div>
        <div class="field"><label>กลุ่มสาระฯ / ระดับที่สอน</label><input type="text" id="t_subject" value="${esc(t.subject||"")}"></div>
      </div>
      <div class="field"><label>สถานศึกษา</label><input type="text" id="t_school" value="${esc(t.school||"")}"></div>
      <div class="field"><label>ที่อยู่สถานศึกษา</label><input type="text" id="t_address" value="${esc(t.address||"")}"></div>
      <div class="grid2">
        <div class="field"><label>สังกัด</label><input type="text" id="t_affiliation" value="${esc(t.affiliation||"")}"></div>
        <div class="field"><label>วันเริ่มรับราชการ</label><input type="text" id="t_startDate" value="${esc(t.startDate||"")}"></div>
      </div>
      <div class="field"><label>ใบอนุญาตประกอบวิชาชีพ</label><input type="text" id="t_license" value="${esc(t.license||"")}"></div>
      <div class="field"><label>คำแนะนำตัว (แสดงในหน้าประวัติ)</label><textarea id="t_bio">${esc(t.bio||"")}</textarea></div>
      <div class="field"><label>หมายเหตุใต้วุฒิการศึกษา</label><textarea id="t_eduNote">${esc(t.eduNote||"")}</textarea></div>

      <h3 style="font-size:17px;margin:22px 0 12px">แถบเกียรติยศ (แสดงใต้หัวหน้าประวัติ)</h3>
      <div class="field"><label>หัวข้อ <span class="hint">· เว้นว่างไว้ถ้าไม่ต้องการแสดง</span></label>
        <input type="text" id="t_honourTitle" value="${esc(t.honourTitle||"")}"></div>
      <div class="field"><label>รายละเอียด</label><input type="text" id="t_honourSub" value="${esc(t.honourSub||"")}"></div>

      <h3 style="font-size:17px;margin:22px 0 12px">ป้ายกำกับ (บรรทัดละ 1 ป้าย)</h3>
      <div class="field"><textarea id="t_chips">${esc((t.chips||[]).join("\n"))}</textarea></div>

      <h3 style="font-size:17px;margin:22px 0 12px">ตัวเลขสรุป 4 ช่อง</h3>
      <div class="grid2" id="statsBox">
        ${[0,1,2,3].map(i => `
          <div class="field"><label>ช่องที่ ${i+1}</label>
            <div style="display:grid;grid-template-columns:100px 1fr;gap:8px">
              <input type="text" id="st_n${i}" placeholder="ตัวเลข" value="${esc(stats[i]?.n||"")}">
              <input type="text" id="st_k${i}" placeholder="คำอธิบาย" value="${esc(stats[i]?.k||"")}">
            </div></div>`).join("")}
      </div>
      <button class="btn btn-navy" type="button" id="saveT">💾 บันทึกข้อมูลครู</button>
    </div>`;

  const slot = $("photoSlot");
  let photo = t.photo || "";
  const draw = () => {
    slot.innerHTML = photo
      ? `<div class="thumbs"><div class="thumb" style="width:110px;height:140px"><img src="${photo}" alt="รูปครู"><button type="button" title="ลบ">&#10005;</button></div></div>`
      : `<div class="drop" tabindex="0"><div class="ic">👩‍🏫</div><b>กดเพื่อเลือกรูปครู</b><small>หรือลากไฟล์มาวาง · ถ้าไม่ใส่จะใช้ไฟล์ teacher.jpg เดิม</small></div>`;
    if (photo) slot.querySelector("button").onclick = () => { photo = ""; draw(); };
    else attachDrop(slot.querySelector(".drop"), async f => {
      try{ photo = await compress(f[0], 1100, .8); draw(); }catch(e){ toast(e.message, "err"); }
    }, false);
  };
  draw();

  $("saveT").onclick = async () => {
    const keys = ["name","nickname","position","subject","school","address","affiliation",
                  "startDate","license","bio","eduNote","honourTitle","honourSub"];
    const data = { photo };
    keys.forEach(k => data[k] = $("t_"+k).value.trim());
    data.chips = $("t_chips").value.split("\n").map(s => s.trim()).filter(Boolean);
    data.stats = [0,1,2,3].map(i => ({ n:$("st_n"+i).value.trim(), k:$("st_k"+i).value.trim() }))
                          .filter(s => s.n || s.k);
    await guard(() => saveDoc("teacher", data), "บันทึกข้อมูลครูแล้ว");
  };
}

/* ---------- แผงรายการทั่วไป ---------- */
async function panelList(el, name){
  const spec = SPEC[name]; if (!spec) return;
  const items = await list(name);
  if (!el.isConnected) return;

  el.innerHTML = `
    <div class="panel-head">
      <div><h2>${spec.icon} ${esc(spec.title)}</h2><p>${esc(spec.desc)}</p></div>
      <div style="display:flex;gap:9px;flex-wrap:wrap">
        ${items.length === 0 && KN.D[name.toUpperCase()] && KN.D[name.toUpperCase()].length
          ? `<button class="btn btn-ghost" type="button" id="seedBtn">⬆️ นำเข้าเนื้อหาตั้งต้น</button>` : ""}
        <button class="btn btn-navy" type="button" id="addBtn">+ เพิ่มรายการใหม่</button>
      </div>
    </div>
    <div id="editor"></div>
    <div class="rows" id="rows"></div>`;

  const rows = $("rows");
  const draw = () => {
    if (!items.length){
      rows.innerHTML = `<div class="empty"><div class="ic">${spec.icon}</div>
        <b>ยังไม่มีรายการ</b><p>กด “เพิ่มรายการใหม่” เพื่อเริ่มต้น</p></div>`;
      return;
    }
    rows.innerHTML = items.map((it, i) => {
      const th = spec.thumb && spec.thumb(it)
        ? `<img src="${spec.thumb(it)}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:8px">`
        : `<span class="yr">${esc(spec.badge(it) || "")}</span>`;
      return `<div class="row-item">
        ${th}
        <span><b>${esc(spec.label(it) || "(ไม่มีชื่อ)")}</b><small>${esc(spec.sub(it) || "")}</small></span>
        <span class="row-acts">
          <button class="icon-sm" type="button" data-up="${i}" title="เลื่อนขึ้น">↑</button>
          <button class="icon-sm" type="button" data-dn="${i}" title="เลื่อนลง">↓</button>
          <button class="icon-sm" type="button" data-ed="${i}" title="แก้ไข">✏️</button>
          <button class="icon-sm danger" type="button" data-rm="${i}" title="ลบ">🗑️</button>
        </span></div>`;
    }).join("");
  };
  draw();

  if ($("seedBtn")) $("seedBtn").onclick = async () => {
    if (!confirm("นำเนื้อหาตั้งต้นทั้งหมดเข้าสู่ Firebase?\nทำครั้งเดียวพอ หลังจากนี้แก้ไขในระบบได้เลย")) return;
    await guard(async () => {
      const n = await seed(name);
      toast(`นำเข้า ${n} รายการแล้ว`, "ok");
      clearCache(); openPanel(name);
    });
  };

  $("addBtn").onclick = () => openEditor(name, spec, {}, items, draw);

  rows.onclick = async e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.ed != null) return openEditor(name, spec, items[+b.dataset.ed], items, draw);
    if (b.dataset.rm != null){
      const it = items[+b.dataset.rm];
      if (!confirm(`ลบ “${spec.label(it)}” ?\nลบแล้วกู้คืนไม่ได้`)) return;
      return guard(async () => {
        await removeItem(name, it.id);
        items.splice(+b.dataset.rm, 1); draw();
        toast("ลบแล้ว", "ok");
      });
    }
    const up = b.dataset.up != null ? +b.dataset.up : null;
    const dn = b.dataset.dn != null ? +b.dataset.dn : null;
    if (up !== null || dn !== null){
      const i = up ?? dn, j = up !== null ? i-1 : i+1;
      if (j < 0 || j >= items.length) return;
      [items[i], items[j]] = [items[j], items[i]];
      return guard(async () => {
        for (let k = 0; k < items.length; k++){
          items[k].order = k + 1;
          await saveItem(name, items[k]);
        }
        draw(); toast("เรียงลำดับใหม่แล้ว", "ok");
      });
    }
  };
}

/* ---------- ฟอร์มแก้ไข 1 รายการ ---------- */
function openEditor(name, spec, item, items, redraw){
  const box = $("editor"); if (!box) return;
  const isNew = !item.id;
  const val = { ...item };
  if (name === "grades") val.topicsText = (item.topics || []).join("\n");

  box.innerHTML = `<div class="card pop pop-1" style="margin-bottom:18px;border-color:var(--royal)">
    <div class="panel-head" style="margin-bottom:12px">
      <h3 style="font-size:19px">${isNew ? "เพิ่ม" : "แก้ไข"}${esc(spec.title)}</h3>
      <button class="icon-sm" type="button" id="closeEd" title="ปิด">✕</button>
    </div>
    ${spec.fields.map(f => renderField(f, val)).join("")}
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">
      <button class="btn btn-navy" type="button" id="saveEd">💾 บันทึก</button>
      <button class="btn btn-ghost" type="button" id="cancelEd">ยกเลิก</button>
    </div></div>`;
  box.scrollIntoView({ behavior:"smooth", block:"start" });

  /* ตัวจัดการรูป */
  const media = {};
  spec.fields.filter(f => f.t === "img" || f.t === "imgs").forEach(f => {
    media[f.k] = f.t === "imgs" ? (val[f.k] || []).slice() : (val[f.k] ? [val[f.k]] : []);
    const slot = $("slot_" + f.k);
    const max  = f.t === "imgs" ? 6 : 1;
    const draw = () => {
      const canAdd = media[f.k].length < max;
      slot.innerHTML =
        (canAdd ? `<div class="drop" tabindex="0"><div class="ic">🖼️</div>
            <b>กดเพื่อเลือกรูป${max > 1 ? ` (เหลืออีก ${max - media[f.k].length} รูป)` : ""}</b>
            <small>หรือลากไฟล์มาวาง · ระบบย่อขนาดให้อัตโนมัติ</small></div>` : "") +
        (media[f.k].length ? `<div class="thumbs">${media[f.k].map((s, i) =>
            `<div class="thumb"><img src="${s}" alt="" data-i="${i}"><button type="button" data-rm="${i}">&#10005;</button></div>`
          ).join("")}</div>` : "");
      slot.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => {
        media[f.k].splice(+b.dataset.rm, 1); draw();
      });
      slot.querySelectorAll(".thumb img").forEach(im => im.onclick = () =>
        lightbox(media[f.k].map(s => ({ src:s })), +im.dataset.i));
      const d = slot.querySelector(".drop");
      if (d) attachDrop(d, async files => {
        for (const file of files){
          if (media[f.k].length >= max){ toast(`ใส่รูปได้สูงสุด ${max} รูป`, "err"); break; }
          try{ media[f.k].push(await compress(file)); }
          catch(err){ toast(err.message, "err"); }
        }
        draw();
      }, max > 1);
    };
    draw();
  });

  const close = () => { box.innerHTML = ""; };
  $("closeEd").onclick = close;
  $("cancelEd").onclick = close;

  $("saveEd").onclick = async () => {
    const data = { ...item };
    for (const f of spec.fields){
      if (f.t === "img")  { data[f.k] = media[f.k][0] || ""; continue; }
      if (f.t === "imgs") { data[f.k] = media[f.k]; continue; }
      const inp = $("ed_" + f.k);
      let v = inp.value.trim();
      if (f.t === "num") v = Number(v) || 0;
      if (f.k === "current") v = (v === "true");
      data[f.k] = v;
    }
    if (name === "grades"){
      data.topics = String(data.topicsText || "").split("\n").map(s => s.trim()).filter(Boolean);
      delete data.topicsText;
    }
    const titleField = spec.fields.find(f => f.l.includes("*"));
    if (titleField && !data[titleField.k] && titleField.t !== "img" && titleField.t !== "imgs"){
      return toast("กรุณากรอกช่องที่มีเครื่องหมาย * ให้ครบ", "err");
    }
    if (!data.order) data.order = (items.length ? Math.max(...items.map(x => x.order || 0)) : 0) + 1;

    await guard(async () => {
      await saveItem(name, data);
      toast(isNew ? "เพิ่มรายการแล้ว" : "บันทึกแล้ว", "ok");
      close(); clearCache(); openPanel(name);
    });
  };
}

function renderField(f, val){
  const v = val[f.k] ?? "";
  const hint = f.h ? `<span class="hint">· ${esc(f.h)}</span>` : "";
  if (f.t === "img" || f.t === "imgs")
    return `<div class="field"><label>${esc(f.l)} ${hint}</label><div id="slot_${f.k}"></div></div>`;
  if (f.t === "area")
    return `<div class="field"><label for="ed_${f.k}">${esc(f.l)} ${hint}</label>
      <textarea id="ed_${f.k}">${esc(v)}</textarea></div>`;
  if (f.t === "sel"){
    const LABELS = { nation:"ระดับชาติ / สพฐ. / คุรุสภา", area:"ระดับเขตพื้นที่",
      gold:"🥇 เหรียญทอง", silver:"🥈 เหรียญเงิน", bronze:"🥉 เหรียญทองแดง",
      "true":"ใช่ (ปัจจุบัน)", "false":"ไม่ใช่",
      book:"หนังสือ", tri:"สามเหลี่ยม", calc:"เครื่องคิดเลข", chart:"กราฟ", cube:"ทรงสามมิติ", target:"เป้า" };
    return `<div class="field"><label for="ed_${f.k}">${esc(f.l)}</label>
      <select id="ed_${f.k}">${f.o.map(o =>
        `<option value="${esc(o)}"${String(v)===String(o)?" selected":""}>${esc(LABELS[o] || o)}</option>`).join("")}</select></div>`;
  }
  const type = f.t === "url" ? "url" : f.t === "num" ? "number" : "text";
  return `<div class="field"><label for="ed_${f.k}">${esc(f.l)} ${hint}</label>
    <input type="${type}" id="ed_${f.k}" value="${esc(v)}"></div>`;
}

/* ---------- แบบทดสอบ ---------- */
async function panelQuiz(el){
  const topics = await list("quiz");
  if (!el.isConnected) return;
  el.innerHTML = `
    <div class="panel-head">
      <div><h2>📝 แบบทดสอบ</h2><p>เพิ่ม/แก้ไขเรื่องและคำถาม · ปัจจุบัน ${topics.length} เรื่อง
        รวม ${topics.reduce((a,t)=>a+(t.qs||[]).length,0)} ข้อ</p></div>
      <div style="display:flex;gap:9px;flex-wrap:wrap">
        ${topics.length === 0 ? `<button class="btn btn-ghost" type="button" id="seedQ">⬆️ นำเข้าข้อสอบตั้งต้น 120 ข้อ</button>` : ""}
        <button class="btn btn-navy" type="button" id="addQ">+ เพิ่มเรื่องใหม่</button>
      </div>
    </div>
    <div id="qEditor"></div>
    <div class="rows" id="qRows"></div>`;

  if ($("seedQ")) $("seedQ").onclick = () => guard(async () => {
    const n = await seed("quiz");
    toast(`นำเข้า ${n} เรื่องแล้ว`, "ok"); clearCache(); openPanel("quiz");
  });

  const rows = $("qRows");
  rows.innerHTML = topics.length ? topics.map((t, i) =>
    `<div class="row-item"><span class="yr">${esc(t.g)}</span>
      <span><b>${esc(t.topic)}</b><small>${(t.qs||[]).length} ข้อ</small></span>
      <span class="row-acts">
        <button class="icon-sm" type="button" data-ed="${i}" title="แก้ไข">✏️</button>
        <button class="icon-sm danger" type="button" data-rm="${i}" title="ลบ">🗑️</button>
      </span></div>`).join("")
    : `<div class="empty"><div class="ic">📝</div><b>ยังไม่มีแบบทดสอบ</b>
         <p>กด “นำเข้าข้อสอบตั้งต้น” เพื่อใช้ชุด 120 ข้อที่เตรียมไว้ หรือสร้างเรื่องใหม่เอง</p></div>`;

  $("addQ").onclick = () => editTopic({ g:"ม.1", topic:"", qs:[] }, topics);
  rows.onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.ed != null) return editTopic(topics[+b.dataset.ed], topics);
    if (b.dataset.rm != null){
      const t = topics[+b.dataset.rm];
      if (!confirm(`ลบเรื่อง “${t.topic}” พร้อมคำถามทั้งหมด?`)) return;
      guard(async () => { await removeItem("quiz", t.id); clearCache(); openPanel("quiz"); toast("ลบแล้ว", "ok"); });
    }
  };

  function editTopic(topic, all){
    const qs = (topic.qs || []).map(q => ({ ...q, o:(q.o||["","","",""]).slice() }));
    const box = $("qEditor");
    const drawQs = () => qs.map((q, i) => `
      <div class="card" style="margin-bottom:12px;background:var(--surface-2)">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px">
          <b style="font-size:15px">ข้อ ${i+1}</b>
          <button class="icon-sm danger" type="button" data-dq="${i}" title="ลบข้อนี้">🗑️</button>
        </div>
        <div class="field"><label>โจทย์ *</label><textarea data-q="${i}" data-f="s">${esc(q.s||"")}</textarea></div>
        <div class="grid2">
          ${[0,1,2,3].map(k => `<div class="field">
            <label>ตัวเลือก ${["ก","ข","ค","ง"][k]} ${q.a===k?"<span style='color:var(--ok)'>· เฉลย</span>":""}</label>
            <input type="text" data-q="${i}" data-f="o${k}" value="${esc(q.o?.[k]||"")}"></div>`).join("")}
        </div>
        <div class="grid2">
          <div class="field"><label>ข้อที่ถูก</label>
            <select data-q="${i}" data-f="a">${[0,1,2,3].map(k =>
              `<option value="${k}"${q.a===k?" selected":""}>${["ก","ข","ค","ง"][k]}</option>`).join("")}</select></div>
          <div class="field"><label>คำอธิบายเฉลย</label><input type="text" data-q="${i}" data-f="e" value="${esc(q.e||"")}"></div>
        </div>
      </div>`).join("");

    const draw = () => {
      box.innerHTML = `<div class="card pop pop-1" style="margin-bottom:18px;border-color:var(--royal)">
        <div class="panel-head" style="margin-bottom:12px">
          <h3 style="font-size:19px">${topic.id ? "แก้ไข" : "เพิ่ม"}เรื่องแบบทดสอบ</h3>
          <button class="icon-sm" type="button" id="qClose">✕</button></div>
        <div class="grid2">
          <div class="field"><label>ระดับชั้น *</label><input type="text" id="q_g" value="${esc(topic.g||"")}" placeholder="ม.1"></div>
          <div class="field"><label>ชื่อเรื่อง *</label><input type="text" id="q_t" value="${esc(topic.topic||"")}" placeholder="เช่น จำนวนเต็ม"></div>
        </div>
        <div id="qList">${drawQs()}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">
          <button class="btn btn-ghost" type="button" id="qAdd">+ เพิ่มคำถาม</button>
          <button class="btn btn-navy" type="button" id="qSave">💾 บันทึกเรื่องนี้</button>
        </div></div>`;
      box.scrollIntoView({ behavior:"smooth", block:"start" });

      $("qClose").onclick = () => box.innerHTML = "";
      $("qAdd").onclick = () => { collect(); qs.push({ s:"", o:["","","",""], a:0, e:"" }); draw(); };
      $("qList").onclick = e => {
        const b = e.target.closest("[data-dq]"); if (!b) return;
        collect(); qs.splice(+b.dataset.dq, 1); draw();
      };
      $("qSave").onclick = () => {
        collect();
        const g = $("q_g").value.trim(), tp = $("q_t").value.trim();
        if (!g || !tp) return toast("กรอกระดับชั้นและชื่อเรื่องก่อนค่ะ", "err");
        if (!qs.length) return toast("เพิ่มคำถามอย่างน้อย 1 ข้อ", "err");
        const bad = qs.findIndex(q => !String(q.s||"").trim() || q.o.some(o => !String(o||"").trim()));
        if (bad >= 0) return toast(`ข้อ ${bad+1} ยังกรอกไม่ครบ`, "err");
        guard(async () => {
          const data = { ...topic, g, topic:tp, qs };
          if (!data.order) data.order = (all.length ? Math.max(...all.map(x => x.order||0)) : 0) + 1;
          await saveItem("quiz", data);
          toast("บันทึกแบบทดสอบแล้ว", "ok");
          clearCache(); openPanel("quiz");
        });
      };
    };
    const collect = () => {
      box.querySelectorAll("[data-q]").forEach(inp => {
        const i = +inp.dataset.q, f = inp.dataset.f;
        if (!qs[i]) return;
        if (f === "a") qs[i].a = +inp.value;
        else if (f.startsWith("o")) qs[i].o[+f[1]] = inp.value;
        else qs[i][f] = inp.value;
      });
    };
    draw();
  }
}

/* ============================================================
   ตัวช่วย
   ============================================================ */
function attachDrop(el, onFiles, multiple){
  if (!el) return;
  const pick = () => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*"; inp.multiple = !!multiple;
    inp.onchange = () => inp.files.length && onFiles([...inp.files]);
    inp.click();
  };
  el.onclick = pick;
  el.onkeydown = e => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); pick(); } };
  el.ondragover = e => { e.preventDefault(); el.classList.add("over"); };
  el.ondragleave = () => el.classList.remove("over");
  el.ondrop = e => {
    e.preventDefault(); el.classList.remove("over");
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith("image/"));
    if (files.length) onFiles(multiple ? files : [files[0]]);
  };
}

async function guard(fn, okMsg){
  try{
    await fn();
    if (okMsg) toast(okMsg, "ok");
  }catch(err){
    const m = String(err.message || err);
    toast(m.includes("permission") ? "ไม่มีสิทธิ์เขียนข้อมูล — ตรวจ Security Rules ใน Firebase" : m, "err");
    console.error(err);
  }
}
