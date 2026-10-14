/* ============================================================
   KruNoiNa Math — หมวดต่าง ๆ ของเว็บไซต์
   ------------------------------------------------------------
   แต่ละฟังก์ชันคือหนึ่งหมวด รับกล่อง host มาวาดเนื้อหาลงไป
   ไม่มีการโหลดหน้าใหม่ สลับหมวดได้ทันที
   ============================================================ */

import {
  KN, one, list, esc, lightbox, requestDownload, downloadCounts, getStats,
  dlIndex, getMedia, fillMedia, renderMath, submitScore, navigate
} from "./app.js";

const num = n => Number(n || 0).toLocaleString("th-TH");

const H = (strings, ...v) => strings.reduce((a, s, i) => a + s + (v[i] ?? ""), "");

/* ============================================================
   หน้าหลัก
   ============================================================ */
export async function home(host){
  const [site, t, dls, news, grades, quizzes, awards] = await Promise.all([
    one("site"), one("teacher"), dlIndex(), list("news"),
    list("grades"), list("quiz"), list("awards")
  ]);
  /* ตัวเลขทั้งหมดนับจากข้อมูลจริง เพิ่ม/ลบในระบบแอดมินแล้วเปลี่ยนตามเอง */
  const nGrades = grades.length;
  const nTopics = grades.reduce((a, g) => a + (g.topics || []).length, 0);
  const nQuiz   = quizzes.length;
  const nQs     = quizzes.reduce((a, q) => a + (q.qs || []).length, 0);
  const perQuiz = nQuiz && quizzes.every(q => (q.qs || []).length === quizzes[0].qs.length)
    ? `เรื่องละ ${quizzes[0].qs.length} ข้อ ` : "";

  const chans = [
    { k:"contactEmail",    ic:"✉️", label:"อีเมลถึงครู",             pre:"mailto:" },
    { k:"contactLine",     ic:"💬", label:"LINE Official",           pre:"" },
    { k:"contactYoutube",  ic:"▶️", label:"ช่อง YouTube บทเรียน",    pre:"" },
    { k:"contactFacebook", ic:"📘", label:"เพจ Facebook ครูน้อยหน่า", pre:"" }
  ].filter(c => site[c.k]);

  host.innerHTML = H`
  <div class="hero">
    <svg class="glyphs" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <text x="215" y="110" font-size="30">y = x²</text>
      <text x="960" y="150" font-size="46">π</text>
      <text x="220" y="450" font-size="26">c = √(a² + b²)</text>
      <text x="930" y="440" font-size="36">Σ</text>
      <text x="600" y="80" font-size="24">sin θ</text>
      <text x="820" y="480" font-size="24">f ′(x)</text>
      <path d="M230 300 Q350 190 470 300 T710 300" fill="none" stroke="currentColor" stroke-width="2" opacity=".10" style="color:var(--royal)"></path>
    </svg>
    <div class="wrap">
      <div class="pop pop-1">
        <div class="path"><span>Learn</span><span>Think</span><span>Solve</span><span>Create</span></div>
        <h1 class="hero-t">${esc(site.heroLine1)}<br><em>${esc(site.heroLine2)}</em></h1>
        <p class="lead">${esc(site.heroLead)}</p>
        <p class="byline">โดย ${esc(t.name)} (${esc(t.nickname)}) · ${esc(t.position)}</p>
        <div class="cta">
          <a class="btn btn-gold" href="#/lessons">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16H6.5A2.5 2.5 0 0 0 4 21.5Z"></path></svg>
            เริ่มเรียน</a>
          <a class="btn btn-navy" href="#/quiz">ทำแบบทดสอบ →</a>
        </div>
        <div class="hero-stats">
          <div><b>${num(nGrades)}</b><small>ระดับชั้น ม.1–ม.6</small></div>
          <div><b>${num(nTopics)}</b><small>หัวข้อบทเรียน</small></div>
          <div><b>${num(nQs)}</b><small>ข้อ แบบทดสอบออนไลน์</small></div>
        </div>
      </div>
      <div class="portrait pop pop-2">
        <img src="${esc(t.photo || "teacher.jpg")}" alt="${esc(t.name)} (${esc(t.nickname)})" width="896" height="1200">
        <div class="ribbon">
          <span><b>${esc(t.name)}</b><small>${esc(t.nickname)} · กลุ่มสาระการเรียนรู้คณิตศาสตร์</small></span>
          <span class="tag">M.1–M.6</span>
        </div>
      </div>
    </div>
  </div>

  <section>
    <div class="wrap">
      <div class="sec-head center pop pop-1">
        <span class="eyebrow">Explore</span>
        <h2>เลือกสิ่งที่ต้องการ</h2>
        <p>เว็บไซต์แบ่งเป็น 4 หมวดใหญ่ เพื่อให้หาสิ่งที่ต้องการได้เร็วที่สุด</p>
      </div>
      <div class="hubs stagger">
        <a class="hub" href="#/lessons" style="--hc:#1D5BD6">
          <span class="count">${num(nGrades)} ระดับชั้น</span><span class="ic">📘</span>
          <h3>บทเรียน</h3>
          <p>เนื้อหาคณิตศาสตร์ ม.1–ม.6 ตามหลักสูตรแกนกลาง พร้อมคณิตศาสตร์รอบตัวและโซนคิดสนุก</p>
          <span class="go">เข้าสู่บทเรียน →</span></a>
        <a class="hub" href="#/quiz" style="--hc:#0E9F6E">
          <span class="count">${num(nQs)} ข้อ</span><span class="ic">📝</span>
          <h3>แบบทดสอบออนไลน์</h3>
          <p>${num(nQuiz)} เรื่อง ${perQuiz}เลือกคำตอบแล้วเฉลยพร้อมคำอธิบายวิธีคิดทันที</p>
          <span class="go">เริ่มทำข้อสอบ →</span></a>
        <a class="hub" href="#/downloads" style="--hc:#B4880B">
          <span class="count">${dls.length ? dls.length + " รายการ" : "แจกฟรี"}</span><span class="ic">📦</span>
          <h3>แจกไฟล์</h3>
          <p>แผนการจัดการเรียนรู้ ใบงาน สื่อการสอน และข้อสอบพร้อมเฉลย ให้เพื่อนครูและนักเรียนดาวน์โหลด</p>
          <span class="go">ดูไฟล์ทั้งหมด →</span></a>
        <a class="hub" href="#/about" style="--hc:#8B5CF6">
          <span class="count">${num(awards.length)} รางวัล</span><span class="ic">👩‍🏫</span>
          <h3>ประวัติและผลงาน</h3>
          <p>ประวัติครูน้อยหน่า เส้นทางการทำงาน รางวัล ผลงานนักเรียน และการพัฒนาตนเอง</p>
          <span class="go">รู้จักครู →</span></a>
      </div>
    </div>
  </section>

  <section style="background:var(--surface-2); border-block:1px solid var(--line)">
    <div class="wrap">
      <div class="sec-head pop pop-1">
        <span class="eyebrow">Our approach</span>
        <h2>มากกว่าการจำสูตร คือการเข้าใจคณิตศาสตร์</h2>
        <p>ทุกบทเรียนออกแบบตามลำดับการคิด 4 ขั้น ให้ผู้เรียนเดินจากความเข้าใจไปสู่การใช้จริง</p>
      </div>
      <div class="pillars stagger">
        <div class="pillar"><span class="num">ขั้นที่ 01</span><h3 class="en">Understand</h3><span class="th">เข้าใจแนวคิด</span><p>เริ่มจากความหมายและที่มาของแนวคิด ไม่เริ่มจากการท่องสูตร</p></div>
        <div class="pillar"><span class="num">ขั้นที่ 02</span><h3 class="en">Think</h3><span class="th">คิดวิเคราะห์</span><p>ฝึกแยกโจทย์ ตั้งสมมติฐาน และเลือกวิธีการอย่างเป็นระบบ</p></div>
        <div class="pillar"><span class="num">ขั้นที่ 03</span><h3 class="en">Solve</h3><span class="th">แก้ปัญหา</span><p>ลงมือแก้โจทย์จากง่ายไปยาก พร้อมตรวจสอบความสมเหตุสมผลของคำตอบ</p></div>
        <div class="pillar"><span class="num">ขั้นที่ 04</span><h3 class="en">Apply</h3><span class="th">ประยุกต์ใช้</span><p>เชื่อมโยงสู่สถานการณ์จริง ทั้งการเงิน การเกษตร ข้อมูล และเทคโนโลยี</p></div>
      </div>
    </div>
  </section>

  <section>
    <div class="wrap tail">
      <div class="panel pop pop-1">
        <div class="sec-head" style="margin-bottom:8px">
          <span class="eyebrow">Latest updates</span>
          <h2 style="font-size:23px">ข่าวสารและบทเรียนล่าสุด</h2>
        </div>
        <ul class="news">${
          news.length ? news.map(n => `<li><time>${esc(n.date)}</time>
            <span class="t">${esc(n.title)}</span>${n.chip ? `<span class="chip">${esc(n.chip)}</span>` : ""}</li>`).join("")
          : `<li><span class="t" style="color:var(--muted)">ยังไม่มีข่าวสาร</span></li>`}</ul>
      </div>
      <div class="contact pop pop-2">
        <h3>ติดต่อครูน้อยหน่า</h3>
        <p>มีคำถามเกี่ยวกับบทเรียน ต้องการเอกสารเพิ่มเติม หรืออยากเสนอแนะเว็บไซต์ ทักมาได้เลยค่ะ</p>
        <div class="chan">${
          chans.length ? chans.map(c => `<a href="${esc(c.pre + site[c.k])}" target="_blank" rel="noopener">
            <span class="ic">${c.ic}</span> ${c.label}</a>`).join("")
          : `<p style="font-size:13.5px;opacity:.85">ยังไม่ได้ใส่ช่องทางติดต่อ — เพิ่มได้ในระบบจัดการเว็บไซต์</p>`}</div>
      </div>
    </div>
  </section>

  <section class="stats-sec" id="stats" aria-labelledby="stats-h">
    <div class="wrap">
      <div class="sec-head pop pop-1">
        <span class="eyebrow">Website statistics</span>
        <h2 id="stats-h">สถิติเว็บไซต์</h2>
        <p>ตัวเลขอัปเดตอัตโนมัติทุกครั้งที่มีผู้เข้าชมและดาวน์โหลดไฟล์</p>
      </div>
      <div class="st-tiles" id="stTiles">
        ${["ผู้เข้าชมวันนี้","ผู้เข้าชมเดือนนี้","ผู้เข้าชมทั้งหมด","ดาวน์โหลดทั้งหมด"].map(l =>
          `<div class="st-tile"><small>${l}</small><b><span class="skel" style="display:inline-block;width:70px;height:30px"></span></b></div>`).join("")}
      </div>
      <div class="st-grid">
        <div class="st-card">
          <div class="st-card-h">
            <div><h3>ผู้เข้าชม 14 วันล่าสุด</h3><p>จำนวนครั้งที่เปิดเว็บไซต์ในแต่ละวัน</p></div>
            <button class="st-toggle" type="button" id="stView" aria-pressed="false">ดูเป็นตาราง</button>
          </div>
          <div id="stChart" class="st-chart"><div class="skel" style="height:180px"></div></div>
        </div>
        <div class="st-card">
          <div class="st-card-h">
            <div><h3>ไฟล์ยอดนิยม</h3><p>ไฟล์ที่ถูกดาวน์โหลดมากที่สุด</p></div>
          </div>
          <div id="stTop"><div class="skel" style="height:180px"></div></div>
        </div>
      </div>
      <p class="st-note" id="stNote"></p>
    </div>
  </section>`;

  mountStats(host, dls);
}

/* ============================================================
   แดชบอร์ดสถิติ (ท้ายหน้าหลัก)
   โหลดข้อมูลเมื่อเลื่อนลงมาใกล้ถึงเท่านั้น จะได้ประหยัดโควตาฟรี
   ============================================================ */
const fmtShort = new Intl.DateTimeFormat("th-TH", { day:"numeric", month:"short", timeZone:"Asia/Bangkok" });
const fmtLong  = new Intl.DateTimeFormat("th-TH", { weekday:"short", day:"numeric", month:"short", timeZone:"Asia/Bangkok" });
const keyToDate = k => new Date(k + "T12:00:00+07:00");

function mountStats(host, dls){
  const sec = host.querySelector("#stats");
  if (!sec) return;
  let loaded = false;
  const go = () => { if (loaded) return; loaded = true; loadStats(sec, dls); };
  if (!("IntersectionObserver" in window)) return go();
  const io = new IntersectionObserver(es => {
    if (es.some(e => e.isIntersecting)){ io.disconnect(); go(); }
  }, { rootMargin:"300px 0px" });
  io.observe(sec);
}

async function loadStats(sec, dls){
  const S = await getStats(14);
  if (!sec.isConnected) return;
  const $ = id => sec.querySelector("#" + id);
  const today = S.days[S.days.length - 1] || { visits:0 };

  /* ---- ตัวเลขสรุป 4 ช่อง ---- */
  const tiles = [
    { l:"ผู้เข้าชมวันนี้",   n:today.visits,      ic:"👀" },
    { l:"ผู้เข้าชมเดือนนี้", n:S.month.visits,     ic:"📅" },
    { l:"ผู้เข้าชมทั้งหมด", n:S.total.visits,     ic:"🌐" },
    { l:"ดาวน์โหลดทั้งหมด", n:S.total.downloads,  ic:"⬇️" }
  ];
  $("stTiles").innerHTML = tiles.map(t =>
    `<div class="st-tile"><small><span aria-hidden="true">${t.ic}</span> ${t.l}</small>
      <b data-n="${S.online ? t.n : ""}">${S.online ? "0" : "—"}</b></div>`).join("");
  if (S.online) countUp($("stTiles"));

  /* ---- กราฟแท่ง 14 วัน ---- */
  const chart = $("stChart");
  const max = Math.max(...S.days.map(d => d.visits), 0);
  const top = niceMax(max);
  const drawChart = () => {
    chart.innerHTML = `
      <div class="bars" role="img" aria-label="กราฟผู้เข้าชม 14 วันล่าสุด วันนี้ ${today.visits} ครั้ง สูงสุด ${max} ครั้ง">
        <div class="grid" aria-hidden="true">
          <span style="bottom:100%"><i>${num(top)}</i></span>
          <span style="bottom:50%"><i>${num(top/2)}</i></span>
          <span style="bottom:0"><i>0</i></span>
        </div>
        <div class="cols">${S.days.map((d, i) => {
          const h = top ? (d.visits / top) * 100 : 0;
          const isToday = i === S.days.length - 1;
          const dt = keyToDate(d.key);
          return `<div class="col${isToday ? " today" : ""}" tabindex="0"
              data-tip="${esc(fmtLong.format(dt))}" data-v="${d.visits}" data-d="${d.downloads}">
            ${isToday ? `<em style="bottom:calc(${h}% + 6px)">${num(d.visits)}</em>` : ""}
            <span class="st-bar" style="height:${h}%${d.visits ? ";min-height:3px" : ""}"></span>
          </div>`;
        }).join("")}</div>
      </div>
      <div class="xlab" aria-hidden="true">${S.days.map((d, i) =>
        `<span>${i === S.days.length - 1 ? "วันนี้" : ((S.days.length - 1 - i) % 2 === 1 ? "" : fmtShort.format(keyToDate(d.key)))}</span>`).join("")}</div>
      <div class="st-tip" hidden></div>`;

    const tip = chart.querySelector(".st-tip");
    const show = col => {
      tip.innerHTML = `<b>${col.dataset.tip}</b><span>ผู้เข้าชม <b>${num(col.dataset.v)}</b> ครั้ง</span>
        <span>ดาวน์โหลด <b>${num(col.dataset.d)}</b> ครั้ง</span>`;
      tip.hidden = false;
      const cr = chart.getBoundingClientRect(), r = col.getBoundingClientRect();
      const w = tip.offsetWidth;
      let x = r.left - cr.left + r.width / 2 - w / 2;
      x = Math.max(0, Math.min(x, cr.width - w));
      tip.style.left = x + "px";
      chart.querySelectorAll(".col").forEach(c => c.classList.toggle("on", c === col));
    };
    const hide = () => { tip.hidden = true; chart.querySelectorAll(".col.on").forEach(c => c.classList.remove("on")); };
    chart.querySelectorAll(".col").forEach(c => {
      c.addEventListener("mouseenter", () => show(c));
      c.addEventListener("focus", () => show(c));
      c.addEventListener("click", () => show(c));
    });
    chart.querySelector(".cols").addEventListener("mouseleave", hide);
    chart.addEventListener("focusout", e => { if (!chart.contains(e.relatedTarget)) hide(); });
  };
  const drawTable = () => {
    chart.innerHTML = `<div class="st-table-wrap"><table class="st-table">
      <thead><tr><th>วันที่</th><th>ผู้เข้าชม</th><th>ดาวน์โหลด</th></tr></thead>
      <tbody>${S.days.slice().reverse().map(d =>
        `<tr><td>${esc(fmtLong.format(keyToDate(d.key)))}</td><td>${num(d.visits)}</td><td>${num(d.downloads)}</td></tr>`).join("")}</tbody>
    </table></div>`;
  };
  let asTable = false;
  drawChart();
  $("stView").onclick = e => {
    asTable = !asTable;
    e.currentTarget.setAttribute("aria-pressed", asTable);
    e.currentTarget.textContent = asTable ? "ดูเป็นกราฟ" : "ดูเป็นตาราง";
    asTable ? drawTable() : drawChart();
  };

  /* ---- ไฟล์ยอดนิยม ---- */
  const ranked = dls.filter(d => d.id)
    .map(d => ({ id:d.id, title:d.title, n:S.files[d.id] || 0, cat:d.category }))
    .sort((a, b) => b.n - a.n).slice(0, 5);
  const topN = Math.max(...ranked.map(r => r.n), 0);
  $("stTop").innerHTML = !dls.length
    ? `<div class="st-empty">ยังไม่มีไฟล์ให้ดาวน์โหลด</div>`
    : `<ol class="st-rank">${ranked.map((r, i) => `
        <li><a href="#/downloads">
          <span class="rk">${i + 1}</span>
          <span class="nm"><b>${esc(r.title)}</b>
            <span class="track"><span class="fill" style="width:${topN ? Math.max(r.n / topN * 100, r.n ? 3 : 0) : 0}%"></span></span></span>
          <span class="ct">${num(r.n)}<small>ครั้ง</small></span>
        </a></li>`).join("")}</ol>
      <a class="st-more" href="#/downloads">ดูไฟล์ทั้งหมด →</a>`;

  $("stNote").textContent = !S.online
    ? "ระบบนับสถิติจะเริ่มทำงานเมื่อเชื่อมต่อ Firebase แล้ว"
    : S.error
      ? "ยังอ่านสถิติไม่ได้ในขณะนี้ ลองรีเฟรชหน้าอีกครั้งนะคะ"
      : "นับ 1 ครั้งต่อการเปิดเว็บ 1 รอบ · ยึดเวลาประเทศไทย";
}

/* ปัดเพดานแกนให้เป็นเลขกลม ๆ */
function niceMax(v){
  if (v <= 4) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const ms = p === 1 ? [6, 8, 10] : [1, 2, 4, 5, 10];
  for (const m of ms) if (m * p >= v) return m * p;
  return 10 * p;
}

/* ตัวเลขวิ่งขึ้นตอนแสดง (ปิดอัตโนมัติถ้าผู้ใช้ตั้งค่าลดการเคลื่อนไหว) */
function countUp(root){
  const els = [...root.querySelectorAll("b[data-n]")];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  els.forEach(el => {
    const to = Number(el.dataset.n) || 0;
    if (still || to === 0){ el.textContent = num(to); return; }
    const t0 = performance.now(), dur = 900;
    const step = t => {
      const k = Math.min((t - t0) / dur, 1);
      el.textContent = num(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

/* ============================================================
   บทเรียน
   ============================================================ */
const GICON = {
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M9 7h6"/></svg>',
  tri:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 4 21 20H3Z"/></svg>',
  calc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3.5-4L14 14l4-6"/></svg>',
  cube:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>',
  target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/></svg>'
};

export async function lessons(host){
  const [grades, rls, quizzes] = await Promise.all([list("grades"), list("reallife"), list("quiz")]);

  host.innerHTML = H`
  <div class="page-head">
    <div class="wrap pop pop-1">
      <p class="crumb"><a href="#/home">หน้าหลัก</a> &#8250; บทเรียน</p>
      <span class="eyebrow">Mathematics Learning</span>
      <h1>บทเรียนคณิตศาสตร์ ม.1–ม.6</h1>
      <p class="sub">จัดหัวข้อตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน กดที่การ์ดระดับชั้นเพื่อดูหัวข้อบทเรียนทั้งหมด</p>
      <label class="search" style="margin-top:18px;max-width:340px;width:100%">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="color:var(--muted);flex:0 0 auto">
          <circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
        <input id="q" type="search" placeholder="ค้นหาบทเรียน… เช่น พีทาโกรัส" autocomplete="off">
      </label>
    </div>
  </div>

  <div class="wrap"><div class="results" id="results" hidden>
    <h3>ผลการค้นหาบทเรียน</h3><ul id="rlist"></ul></div></div>

  <section id="levels">
    <div class="wrap">
      <div class="sec-head pop pop-1"><span class="eyebrow">Choose your level</span>
        <h2>เลือกเส้นทางการเรียนรู้ของคุณ</h2></div>
      <div class="grades stagger" id="grades">${grades.map((d, i) => {
        const topics = d.topics || [];
        return `<div class="gcell" style="--gc:${esc(d.color || "#1D5BD6")}">
          <button class="grade" style="--gc:${esc(d.color || "#1D5BD6")}" aria-expanded="false" aria-controls="tp${i}">
            <span class="top"><span class="badge">${GICON[d.icon] || GICON.book}</span>
              <span><span class="gt">${esc(d.g)}</span><span class="sub">${esc(d.sub || "")}</span></span></span>
            <span class="meta"><span>${topics.length} หัวข้อบทเรียน</span><span class="go">ดูหัวข้อ →</span></span>
          </button>
          <ul class="topics" id="tp${i}">${topics.map((t, k) => {
            const r = lessonRes(d, t, quizzes);
            return `<li><button class="topic${r.any ? " has" : ""}" type="button" data-gi="${i}" data-k="${k}">
              <i>${String(k+1).padStart(2,"0")}</i><span class="tt">${esc(t)}</span>
              <span class="tic" aria-hidden="true">${r.video ? "▶️" : ""}${r.sheet ? "📄" : ""}${r.quiz ? "📝" : ""}</span>
            </button></li>`;
          }).join("")}</ul></div>`;
      }).join("")}</div>
    </div>
  </section>

  <section style="background:var(--surface-2); border-block:1px solid var(--line)">
    <div class="wrap">
      <div class="sec-head pop pop-1"><span class="eyebrow">How to learn</span>
        <h2>เรียนรู้ได้หลายรูปแบบ</h2>
        <p>เลือกรูปแบบที่เหมาะกับตัวเอง เรียนซ้ำได้ ไม่จำกัดจำนวนครั้ง</p></div>
      <div class="modes stagger">
        <div class="mode"><span class="ic">📖</span><h3>บทเรียน</h3><p>เนื้อหาอธิบายเป็นขั้นตอน พร้อมตัวอย่างโจทย์ที่แสดงวิธีคิดทีละบรรทัด</p><span class="steps">อ่าน → ทำตาม → สรุปเอง</span></div>
        <div class="mode"><span class="ic">🎬</span><h3>วิดีโอ</h3><p>คลิปสั้นอธิบายแนวคิดหลัก และคลิปเฉลยโจทย์ที่นักเรียนถามบ่อย</p><span class="steps">คลิปละ 5–12 นาที</span></div>
        <div class="mode"><span class="ic">✏️</span><h3>แบบฝึกหัด</h3><p>ชุดฝึกไล่ระดับความยาก มีเฉลยพร้อมคำอธิบายทุกข้อ</p><span class="steps">ง่าย → ปานกลาง → ท้าทาย</span></div>
        <div class="mode"><span class="soon">เร็ว ๆ นี้</span><span class="ic">🧩</span><h3>Interactive</h3><p>กิจกรรมโต้ตอบ กราฟเลื่อนค่าได้ และเกมฝึกคิดที่ให้ผลทันที</p><span class="steps">ลองเล่น → เห็นผลทันที</span></div>
      </div>
    </div>
  </section>

  <section id="fun">
    <div class="wrap">
      <div class="fun pop pop-1">
        <div class="sec-head"><span class="eyebrow">Math Fun Zone</span>
          <h2>คิดสนุกกับคณิตศาสตร์</h2>
          <p>พื้นที่ฝึกคิดแบบไม่กดดัน เล่นได้ทุกวัน ไม่มีคะแนนเก็บ</p></div>
        <div class="fun-grid">
          <div class="fcard"><span class="soon">เร็ว ๆ นี้</span><span class="ic">🔢</span><h3>Sudoku</h3><p>ฝึกการให้เหตุผลและการตัดตัวเลือก 3 ระดับความยาก</p></div>
          <div class="fcard"><span class="soon">เร็ว ๆ นี้</span><span class="ic">🧩</span><h3>Math Puzzle</h3><p>ปริศนาตัวเลข ลำดับซ่อนกฎ และโจทย์เรขาคณิตพลิกแพลง</p></div>
          <div class="fcard"><span class="ic">⚡</span><h3>Quick Quiz</h3><p>ตอบให้ทันใน 60 วินาที ฝึกความแม่นในการคิดเลขเร็ว</p></div>
          <div class="fcard"><span class="ic">🏆</span><h3>Challenge</h3><p>โจทย์ท้าทายประจำสัปดาห์ ส่งคำตอบขึ้นกระดานผู้ตอบถูก</p></div>
        </div>
        <div class="challenge">
          <div><span class="lab">Challenge of the week</span>
            <p class="qq">ผลบวกของจำนวนเต็มบวกสามจำนวนเรียงติดกันเท่ากับ 315 จำนวนที่มากที่สุดคือเท่าใด</p>
            <p class="ans" id="cans">พิมพ์คำตอบเป็นตัวเลขแล้วกดตรวจ</p></div>
          <form id="cform">
            <input id="cin" type="text" inputmode="numeric" placeholder="คำตอบ" aria-label="คำตอบโจทย์ประจำสัปดาห์">
            <button class="btn btn-gold" type="submit">ตรวจคำตอบ</button>
          </form>
        </div>
      </div>
    </div>
  </section>

  <section id="real" style="background:var(--surface-2); border-block:1px solid var(--line)">
    <div class="wrap">
      <div class="sec-head pop pop-1"><span class="eyebrow">Math in Real Life</span>
        <h2>คณิตศาสตร์รอบตัวเรา</h2>
        <p>ชุดสถานการณ์จริงที่ใช้ต่อยอดในชั้นเรียน เชื่อมเนื้อหากับบริบทของชุมชนและชีวิตประจำวัน</p></div>
      <div class="real stagger">${rls.map(r =>
        `<div class="rcard"><span class="ic">${esc(r.icon)}</span><div>
          <h3>${esc(r.title)}</h3><p>${esc(r.detail)}</p>
          ${r.use ? `<p class="use">${esc(r.use)}</p>` : ""}</div></div>`).join("")}</div>
    </div>
  </section>`;

  const $ = id => host.querySelector("#" + id);

  const openFrom = el => {
    const d = grades[+el.dataset.gi], t = (d.topics || [])[+el.dataset.k];
    if (d && t) openLesson(d, t, quizzes);
  };
  $("grades").addEventListener("click", e => {
    const tp = e.target.closest(".topic"); if (tp) return openFrom(tp);
    const b = e.target.closest(".grade"); if (!b) return;
    const open = b.getAttribute("aria-expanded") === "true";
    b.setAttribute("aria-expanded", open ? "false" : "true");
    b.querySelector(".go").textContent = open ? "ดูหัวข้อ →" : "ซ่อนหัวข้อ ↑";
  });

  const INDEX = [];
  grades.forEach((d, gi) => (d.topics || []).forEach((t, k) => INDEX.push({ g:d.g, t, gi, k, c:d.color || "#1D5BD6" })));
  $("q").addEventListener("input", e => {
    const v = e.target.value.trim();
    const box = $("results"), rl = $("rlist");
    if (!v){ box.hidden = true; return; }
    const hit = INDEX.filter(r => (r.t + " " + r.g).toLowerCase().includes(v.toLowerCase()));
    rl.innerHTML = hit.length
      ? hit.slice(0,30).map(r => `<li><button class="topic-hit" type="button" data-gi="${r.gi}" data-k="${r.k}">
          <span class="g" style="background:${esc(r.c)}">${esc(r.g)}</span>${esc(r.t)}<span class="go">เปิดบทเรียน →</span></button></li>`).join("")
      : `<li class="none">ไม่พบบทเรียนที่ตรงกับ “${esc(v)}” ลองค้นด้วยชื่อเรื่อง เช่น พหุนาม เมทริกซ์ สถิติ</li>`;
    box.hidden = false;
  });
  $("rlist").addEventListener("click", e => {
    const b = e.target.closest(".topic-hit"); if (b) openFrom(b);
  });

  $("cform").addEventListener("submit", e => {
    e.preventDefault();
    const v = $("cin").value.trim().replace(/[^0-9-]/g, "");
    const out = $("cans");
    if (!v) return out.textContent = "กรอกคำตอบเป็นตัวเลขก่อนกดตรวจนะคะ";
    out.textContent = (+v === 106)
      ? "✅ ถูกต้อง! ให้ n คือจำนวนกลาง จะได้ 3n = 315 → n = 105 ดังนั้นจำนวนที่มากที่สุดคือ 106"
      : "ยังไม่ใช่ค่ะ ลองตั้งจำนวนกลางเป็น n แล้วเขียนผลบวกเป็น (n−1) + n + (n+1) ดูนะคะ";
  });
}

/* ============================================================
   สื่อประจำบทเรียน (วิดีโอ · ใบงาน · แบบทดสอบ)
   เก็บในข้อมูลระดับชั้น  grade.res = { "ชื่อหัวข้อ": { video, sheet, quiz, note } }
   ============================================================ */
function lessonRes(d, title, quizzes){
  const r = { ...((d.res || {})[title] || {}) };
  // ถ้ายังไม่ได้เลือกแบบทดสอบ ให้จับคู่อัตโนมัติจากชื่อเรื่องที่ตรงกัน
  if (!r.quiz){
    const m = quizzes.find(q => q.g === d.g && String(q.topic).trim() === String(title).trim());
    if (m) r.quiz = m.id;
  }
  if (r.quiz && !quizzes.some(q => q.id === r.quiz)) r.quiz = "";
  r.any = !!(r.video || r.sheet || r.quiz || r.note);
  return r;
}

export function youtubeId(url){
  const u = String(url || "").trim();
  const m = u.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1] : "";
}

function openLesson(d, title, quizzes){
  const r = lessonRes(d, title, quizzes);
  const yt = youtubeId(r.video);
  const qz = quizzes.find(q => q.id === r.quiz);
  const el = document.createElement("div");
  el.className = "lesson-modal";
  el.innerHTML = `
    <div class="lm-box" role="dialog" aria-modal="true" aria-labelledby="lm-t" style="--gc:${esc(d.color || "#1D5BD6")}">
      <button class="lm-close" type="button" aria-label="ปิด">&#10005;</button>
      <span class="lm-g">${esc(d.g)} · ${esc(d.sub || "")}</span>
      <h3 id="lm-t">${esc(title)}</h3>
      ${r.note ? `<p class="lm-note">${esc(r.note)}</p>` : ""}
      ${yt ? `<div class="lm-video"><iframe src="https://www.youtube-nocookie.com/embed/${yt}?rel=0"
            title="วิดีโอบทเรียน ${esc(title)}" loading="lazy" allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`
        : r.video ? `<a class="lm-link" href="${esc(r.video)}" target="_blank" rel="noopener">▶️ เปิดวิดีโอบทเรียน</a>` : ""}
      ${r.any ? `<div class="lm-acts">
          ${r.sheet ? `<button class="btn btn-gold" type="button" id="lm-sheet">📄 ดาวน์โหลดใบงาน / เอกสาร</button>` : ""}
          ${qz ? `<a class="btn btn-navy" href="#/quiz/${esc(qz.id)}">📝 ทำแบบทดสอบเรื่องนี้ (${(qz.qs || []).length} ข้อ)</a>` : ""}
        </div>`
      : `<div class="lm-soon"><span>🛠️</span><b>ครูกำลังเตรียมสื่อของเรื่องนี้อยู่ค่ะ</b>
           <p>ระหว่างนี้ลองดูไฟล์แจกฟรี หรือทำแบบทดสอบเรื่องอื่นไปก่อนนะคะ</p>
           <a class="btn btn-ghost" href="#/downloads">ดูไฟล์แจกฟรี →</a></div>`}
    </div>`;
  document.body.appendChild(el);
  document.body.classList.add("no-scroll");

  const onKey = e => { if (e.key === "Escape") close(); };
  const close = () => {
    document.removeEventListener("keydown", onKey);
    removeEventListener("hashchange", close);
    document.body.classList.remove("no-scroll");
    el.remove();
  };
  document.addEventListener("keydown", onKey);
  addEventListener("hashchange", close);
  el.querySelector(".lm-close").addEventListener("click", close);
  el.addEventListener("click", e => { if (e.target === el) close(); });
  const sh = el.querySelector("#lm-sheet");
  if (sh) sh.addEventListener("click", () => requestDownload(r.sheet, `ใบงาน · ${d.g} ${title}`));
  el.querySelector(".lm-close").focus();
  renderMath(el);
}

/* ============================================================
   แบบทดสอบออนไลน์
   ============================================================ */
export async function quiz(host, sub){
  const BANK = await list("quiz");
  const LT = ["ก","ข","ค","ง"];
  let curG = "", curI = 0, answered = [], revealed = false, sent = false;

  const total = BANK.reduce((a,t) => a + (t.qs||[]).length, 0);

  host.innerHTML = H`
  <div class="page-head">
    <div class="wrap pop pop-1">
      <p class="crumb"><a href="#/home">หน้าหลัก</a> &#8250; แบบทดสอบออนไลน์</p>
      <span class="eyebrow">Practice &amp; Test</span>
      <h1>แบบทดสอบออนไลน์ ม.1–ม.6</h1>
      <p class="sub">${BANK.length ? `แบบทดสอบ ${BANK.length} เรื่อง รวม ${total} ข้อ เลือกคำตอบแล้วระบบเฉลยพร้อมคำอธิบายวิธีคิดทันที`
        : "ยังไม่มีแบบทดสอบในระบบ"}</p>
      <div class="howto" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;font-size:13.5px;color:var(--ink-2)">
        <span style="background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:6px 14px">1 · เลือกระดับชั้น</span>
        <span style="background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:6px 14px">2 · เลือกเรื่อง</span>
        <span style="background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:6px 14px">3 · ทำให้ครบแล้วดูคะแนน</span>
      </div>
    </div>
  </div>

  <section><div class="wrap">
    <ul class="plist strip pop pop-1">
      <li><span class="k">✏️</span> แบบฝึกหัดตามบทเรียน <span class="lv easy">ง่าย–ท้าทาย</span></li>
      <li><span class="k">🧪</span> แบบทดสอบก่อน–หลังเรียน <span class="lv easy">ง่าย</span></li>
      <li><span class="k">📄</span> ข้อสอบกลางภาค <span class="lv mid">ปานกลาง</span></li>
      <li><span class="k">📝</span> ข้อสอบปลายภาค <span class="lv mid">ปานกลาง</span></li>
      <li><span class="k">🎯</span> ชุดเตรียมสอบ TGAT / A-Level <span class="lv hard">ท้าทาย</span></li>
      <li><span class="k">🔑</span> เฉลยพร้อมคำอธิบายวิธีคิด <span class="lv easy">ทุกชุด</span></li>
    </ul>
    ${BANK.length ? `
    <div class="panel quiz pop pop-2">
      <div class="qtop">
        <div><span class="eyebrow">Online quiz</span>
          <h3 id="qtitle">แบบทดสอบออนไลน์</h3>
          <p class="qmeta" id="qsub"></p></div>
        <div class="qprog">
          <span class="pn"><b id="pdone">0</b> / <span id="ptot">10</span> ข้อ</span>
          <span class="meter"><i id="pbar" style="width:0%"></i></span>
          <span class="pc">ถูก <b id="pright">0</b> ข้อ</span>
        </div>
      </div>
      <div class="picker">
        <div class="gtabs" id="gtabs" role="tablist" aria-label="เลือกระดับชั้น"></div>
        <div class="tchips" id="tchips"></div>
      </div>
      <div id="qbox"></div>
      <div class="score" id="score" hidden>
        <div><span class="n" id="sn">0 / 10</span><small id="sp">0%</small></div>
        <div class="msg" id="smsg"></div>
      </div>
      <div class="send" id="send" hidden></div>
      <div class="qacts">
        <button class="btn btn-navy" type="button" id="reset">ทำแบบทดสอบชุดนี้ใหม่</button>
        <button class="btn btn-ghost" type="button" id="revealAll">เฉลยทั้งชุด</button>
      </div>
    </div>` : `
    <div class="empty"><div class="ic">📝</div><b>ยังไม่มีแบบทดสอบ</b>
      <p>คุณครูเพิ่มได้ที่ระบบจัดการเว็บไซต์ เมนู “แบบทดสอบ”</p></div>`}
  </div></section>`;

  if (!BANK.length) return;
  const $ = id => host.querySelector("#" + id);

  const grades = [...new Set(BANK.map(t => t.g))];
  curG = grades[0]; curI = 0;
  // ลิงก์ตรงไปยังเรื่อง เช่น #/quiz/q05 (มาจากหน้าบทเรียน)
  const deep = sub ? BANK.findIndex(t => t.id === sub) : -1;
  if (deep >= 0){ curI = deep; curG = BANK[deep].g; }

  $("gtabs").innerHTML = grades.map(g =>
    `<button type="button" role="tab" data-g="${esc(g)}" aria-selected="${g===curG}">${esc(g)}</button>`).join("");

  $("gtabs").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    curG = b.dataset.g;
    $("gtabs").querySelectorAll("button").forEach(el => el.setAttribute("aria-selected", el === b));
    curI = BANK.findIndex(t => t.g === curG);
    drawChips(); drawQuiz();
  });
  $("tchips").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    curI = +b.dataset.i;
    $("tchips").querySelectorAll("button").forEach(el => el.setAttribute("aria-pressed", el === b));
    drawQuiz();
  });
  $("qbox").addEventListener("click", e => {
    const b = e.target.closest(".opt"); if (!b) return;
    const i = +b.dataset.q; if (answered[i] !== undefined) return;
    answered[i] = (+b.dataset.k === BANK[curI].qs[i].a);
    mark(i, +b.dataset.k); progress();
  });
  $("reset").addEventListener("click", drawQuiz);
  $("revealAll").addEventListener("click", () => {
    revealed = true;
    BANK[curI].qs.forEach((d, i) => { if (answered[i] === undefined){ answered[i] = false; mark(i, -1); } });
    progress();
  });

  function drawChips(){
    $("tchips").innerHTML = BANK.map((t, i) => ({ t, i })).filter(x => x.t.g === curG)
      .map(x => `<button type="button" data-i="${x.i}" aria-pressed="${x.i===curI}">${esc(x.t.topic)}
        <small>${(x.t.qs||[]).length} ข้อ</small></button>`).join("");
  }
  function drawQuiz(){
    const set = BANK[curI]; if (!set) return;
    const qs = set.qs || [];
    answered = []; revealed = false; sent = false;
    $("qtitle").textContent = `แบบทดสอบ ${set.g} · ${set.topic}`;
    $("qsub").textContent = `จำนวน ${qs.length} ข้อ · เลือกคำตอบแล้วระบบเฉลยพร้อมคำอธิบายทันที`;
    $("ptot").textContent = qs.length;
    $("qbox").innerHTML = qs.map((d, i) =>
      `<div class="q"><p class="stem"><span>ข้อ ${i+1}</span>${esc(d.s)}</p>${
        d.img ? `<figure class="q-img"><img data-media="${esc(d.img)}" alt="รูปประกอบข้อ ${i+1}"></figure>` : ""
      }<div class="opts">${
        (d.o||[]).map((o, k) =>
          `<button class="opt" type="button" data-q="${i}" data-k="${k}"><span class="l">${LT[k]}</span>${esc(o)}</button>`
        ).join("")}</div><p class="expl" id="ex${i}" hidden></p></div>`).join("");
    $("score").hidden = true;
    $("send").hidden = true;
    progress();
    fillMedia($("qbox"));
    renderMath($("qbox"));
    if (deep >= 0 && curI === deep && !drawQuiz.jumped){
      drawQuiz.jumped = true;
      setTimeout(() => host.querySelector(".quiz")?.scrollIntoView({ behavior:"smooth", block:"start" }), 120);
    }
  }
  function mark(i, picked){
    const d = BANK[curI].qs[i];
    $("qbox").querySelectorAll(`.opt[data-q="${i}"]`).forEach(el => {
      const kk = +el.dataset.k;
      if (kk === d.a) el.dataset.state = "right";
      else if (kk === picked) el.dataset.state = "wrong";
      el.disabled = true;
    });
    const ex = $("ex" + i);
    ex.innerHTML = `<b>เฉลย ข้อ ${i+1} : ${LT[d.a]}</b> — ${esc(d.e || "")}`;
    ex.hidden = false;
    renderMath(ex);
  }
  function progress(){
    const tot = (BANK[curI].qs || []).length;
    const done = answered.filter(x => x !== undefined).length;
    const right = answered.filter(Boolean).length;
    $("pdone").textContent = done;
    $("pright").textContent = right;
    $("pbar").style.width = tot ? Math.round(done/tot*100) + "%" : "0%";
    if (done === tot && tot){
      const p = Math.round(right/tot*100);
      $("sn").textContent = `${right} / ${tot}`;
      $("sp").textContent = p + "%";
      $("smsg").textContent =
        p === 100 ? "🎉 ยอดเยี่ยม ทำได้ครบทุกข้อ พร้อมไปต่อเรื่องถัดไปได้เลย"
        : p >= 80 ? "👏 เก่งมาก เข้าใจเนื้อหาแล้ว ลองทบทวนข้อที่ผิดอีกนิดเดียว"
        : p >= 50 ? "👍 มาถูกทางแล้ว อ่านคำอธิบายข้อที่ผิด แล้วลองทำใหม่อีกครั้ง"
        : "💪 ไม่เป็นไร กลับไปทบทวนบทเรียนเรื่องนี้ก่อน แล้วกลับมาทำใหม่ได้เสมอ";
      $("score").hidden = false;
      drawSend(right, tot);
    }
  }

  /* ---------- ส่งคะแนนให้ครู ---------- */
  function drawSend(right, tot){
    const box = $("send");
    if (!KN.online){ box.hidden = true; return; }
    box.hidden = false;
    if (sent){
      box.innerHTML = `<p class="send-ok">✅ ส่งคะแนนให้ครูเรียบร้อยแล้ว</p>`;
      return;
    }
    if (revealed){
      box.innerHTML = `<p class="send-note">ชุดนี้กด “เฉลยทั้งชุด” แล้ว จึงส่งคะแนนไม่ได้ · กด “ทำแบบทดสอบชุดนี้ใหม่” เพื่อทำอีกครั้ง</p>`;
      return;
    }
    let me = {};
    try{ me = JSON.parse(localStorage.getItem("kn-student") || "{}"); }catch(e){}
    box.innerHTML = `
      <form class="send-form" id="sendForm" novalidate>
        <b>📤 ส่งคะแนนให้ครู</b>
        <div class="send-row">
          <label><span>ชื่อ–สกุล</span><input id="sName" required maxlength="60" autocomplete="name" value="${esc(me.name || "")}" placeholder="เช่น ด.ญ.ใจดี มีสุข"></label>
          <label class="sm"><span>ชั้น/ห้อง</span><input id="sRoom" required maxlength="20" value="${esc(me.room || "")}" placeholder="ม.1/2"></label>
          <label class="xs"><span>เลขที่</span><input id="sNo" required maxlength="5" inputmode="numeric" value="${esc(me.no || "")}" placeholder="12"></label>
          <button class="btn btn-gold" type="submit" id="sBtn">ส่งคะแนน ${right}/${tot}</button>
        </div>
        <p class="send-err" id="sErr" hidden></p>
      </form>`;
    box.querySelector("#sendForm").addEventListener("submit", async e => {
      e.preventDefault();
      const name = box.querySelector("#sName").value.trim();
      const room = box.querySelector("#sRoom").value.trim();
      const no   = box.querySelector("#sNo").value.trim();
      const err  = box.querySelector("#sErr");
      if (!name || !room || !no){ err.textContent = "กรอกชื่อ ชั้น/ห้อง และเลขที่ให้ครบก่อนนะคะ"; err.hidden = false; return; }
      try{ localStorage.setItem("kn-student", JSON.stringify({ name, room, no })); }catch(e){}
      const btn = box.querySelector("#sBtn");
      btn.disabled = true; btn.textContent = "กำลังส่ง…";
      try{
        const set = BANK[curI];
        await submitScore({ name, room, no, g:set.g, topic:set.topic, quiz:set.id || "", score:right, total:tot });
        sent = true; drawSend(right, tot);
      }catch(ex){
        err.textContent = "ส่งไม่สำเร็จ ลองใหม่อีกครั้งนะคะ (" + (ex.message || ex) + ")"; err.hidden = false;
        btn.disabled = false; btn.textContent = `ส่งคะแนน ${right}/${tot}`;
      }
    });
  }

  drawChips(); drawQuiz();
}

/* ============================================================
   แจกไฟล์
   ============================================================ */
export async function downloads(host){
  const [ITEMS, COUNTS] = await Promise.all([list("downloads"), downloadCounts()]);
  let cat = "ทั้งหมด";

  host.innerHTML = H`
  <div class="page-head">
    <div class="wrap pop pop-1">
      <p class="crumb"><a href="#/home">หน้าหลัก</a> &#8250; แจกไฟล์</p>
      <span class="eyebrow">Free downloads</span>
      <h1>แจกไฟล์งาน</h1>
      <p class="sub">แผนการจัดการเรียนรู้ ใบงาน สื่อการสอน และข้อสอบพร้อมเฉลย ที่ครูน้อยหน่าจัดทำขึ้น เปิดให้เพื่อนครูและนักเรียนดาวน์โหลดไปใช้ได้ฟรี</p>
    </div>
  </div>
  <section><div class="wrap">
    <div class="dl-filters pop pop-1" id="filters"></div>
    <div class="dl-grid stagger" id="grid"></div>
  </div></section>`;

  const grid = host.querySelector("#grid");
  const fw   = host.querySelector("#filters");

  function draw(){
    if (!ITEMS.length){
      fw.innerHTML = "";
      grid.style.display = "block";
      grid.innerHTML = `<div class="empty"><div class="ic">📦</div>
        <b>ยังไม่มีไฟล์ให้ดาวน์โหลด</b>
        <p>คุณครูสามารถเพิ่มไฟล์ได้ที่ <a href="#/admin" style="color:var(--royal);font-weight:600">ระบบจัดการเว็บไซต์</a><br>
           เมนู “แจกไฟล์” → เพิ่มรายการใหม่</p></div>`;
      return;
    }
    grid.style.display = "";
    const cats = ["ทั้งหมด", ...new Set(ITEMS.map(i => i.category).filter(Boolean))];
    fw.innerHTML = cats.map(c =>
      `<button type="button" data-c="${esc(c)}" aria-pressed="${c===cat}">${esc(c)}</button>`).join("");

    const show = cat === "ทั้งหมด" ? ITEMS : ITEMS.filter(i => i.category === cat);
    grid.innerHTML = show.map((it, idx) => {
      const g = galleryOf(it);
      const cover = g.cover
        ? `<img src="${g.cover}" alt="ตัวอย่าง ${esc(it.title)}" loading="lazy">`
        : `<span class="ph">📄</span>`;
      const more = g.n > 1 ? `<span class="n">${g.n} รูป</span>` : "";
      const thumbs = g.small.length > 1
        ? `<div class="dl-thumbs">${g.small.slice(1,6).map((s,k) =>
            `<img src="${s}" alt="" data-i="${idx}" data-k="${k+1}" loading="lazy">`).join("")}</div>` : "";
      return `<article class="dl-card">
        <div class="dl-cover" data-i="${idx}" data-k="0">${cover}${more}</div>${thumbs}
        <div class="dl-body">
          ${it.category ? `<span class="cat">${esc(it.category)}</span>` : ""}
          <h3>${esc(it.title)}</h3><p>${esc(it.detail || "")}</p>
          <div class="dl-meta">
            ${it.date ? `<span>📅 ${esc(it.date)}</span>` : ""}
            ${it.fileType ? `<span>🗂️ ${esc(it.fileType)}</span>` : ""}
            ${KN.online && it.id ? `<span class="dl-count" data-c="${esc(it.id)}">⬇️ ดาวน์โหลดแล้ว <b>${num(COUNTS[it.id])}</b> ครั้ง</span>` : ""}
          </div>
          <button class="btn btn-gold dl-btn" type="button" data-i="${idx}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 19h16"/></svg>
            ดาวน์โหลดไฟล์</button>
        </div></article>`;
    }).join("");

    grid.onclick = e => {
      const show2 = cat === "ทั้งหมด" ? ITEMS : ITEMS.filter(i => i.category === cat);
      const dl = e.target.closest(".dl-btn");
      if (dl){
        const it = show2[+dl.dataset.i];
        return requestDownload(it.fileUrl, it.title, it.id, () => {
          COUNTS[it.id] = (COUNTS[it.id] || 0) + 1;
          const b = grid.querySelector(`.dl-count[data-c="${CSS.escape(it.id || "")}"] b`);
          if (b) b.textContent = num(COUNTS[it.id]);
        });
      }
      const im = e.target.closest("[data-k]");
      if (im){
        const it = show2[+im.dataset.i];
        openGallery(it, +im.dataset.k);
      }
    };
  }
  fw.onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    cat = b.dataset.c; draw();
  };
  draw();
}

/* รูปตัวอย่างของไฟล์แจก
   แบบใหม่: cover (รูปปก) + gallery [{ s:รูปจิ๋ว, m:รหัสรูปเต็มในคลัง media }]
   แบบเก่า: images [รูปเต็ม] — ยังรองรับ */
function galleryOf(it){
  const gal = (it.gallery || []).filter(x => x && (x.s || x.m));
  if (gal.length) return { n:gal.length, cover:it.cover || gal[0].s, small:gal.map(x => x.s), full:gal.map(x => x.m), legacy:false };
  const imgs = (it.images || []).filter(Boolean);
  return { n:imgs.length, cover:imgs[0] || "", small:imgs, full:imgs, legacy:true };
}
async function openGallery(it, start){
  const g = galleryOf(it);
  if (!g.n) return;
  if (g.legacy) return lightbox(g.full.map(s => ({ src:s, cap:it.title })), start);
  document.body.classList.add("busy");
  const srcs = await Promise.all(g.full.map((m, i) => getMedia(m).then(s => s || (i === 0 ? g.cover : g.small[i]))));
  document.body.classList.remove("busy");
  lightbox(srcs.map(s => ({ src:s, cap:it.title })), start);
}

/* ============================================================
   ประวัติและผลงาน
   ============================================================ */
export async function about(host){
  const [t, edu, car, roles, aw, st, inn, tr, certs] = await Promise.all([
    one("teacher"), list("education"), list("career"), list("roles"), list("awards"),
    list("students"), list("innovations"), list("trainings"), list("certs")
  ]);
  const MED = { gold:["m-gold","🥇"], silver:["m-silver","🥈"], bronze:["m-bronze","🥉"] };
  const years = [...new Set(tr.map(x => x.yr))].sort();

  host.innerHTML = H`
  <div class="phero">
    <div class="wrap">
      <div class="pshot pop pop-1"><img src="${esc(t.photo || "teacher.jpg")}" alt="${esc(t.name)}" width="896" height="1200"></div>
      <div class="pop pop-2">
        <p class="pcrumb"><a href="#/home">หน้าหลัก</a> &#8250; ประวัติและผลงาน</p>
        <span class="eyebrow" style="color:var(--gold)">Professional Profile</span>
        <h1>${esc(t.name)}</h1>
        <p class="prole">${esc(t.nickname)} · ${esc(t.position)}<br>กลุ่มสาระการเรียนรู้คณิตศาสตร์ ${esc(t.school)}</p>
        <div class="pchips">${(t.chips||[]).map(c => `<span>${esc(c)}</span>`).join("")}</div>
        <div class="pstats">${(t.stats||[]).map(s =>
          `<div class="pstat"><b>${esc(s.n)}</b><small>${esc(s.k)}</small></div>`).join("")}</div>
      </div>
    </div>
  </div>

  ${t.honourTitle ? `<div class="honour pop pop-3"><div class="wrap">
    <span class="seal">🏅</span>
    <span><b>${esc(t.honourTitle)}</b><p>${esc(t.honourSub || "")}</p></span>
  </div></div>` : ""}

  <nav class="snav" aria-label="หัวข้อในหน้านี้"><div class="wrap">
    <a href="#/about/profile">ประวัติ</a><a href="#/about/career">เส้นทางการทำงาน</a>
    <a href="#/about/roles">บทบาท</a><a href="#/about/awards">รางวัล</a>
    <a href="#/about/students">ผลงานนักเรียน</a><a href="#/about/innovation">นวัตกรรม</a>
    <a href="#/about/training">การพัฒนาตนเอง</a><a href="#/about/gallery">เกียรติบัตร</a>
  </div></nav>

  <section class="block" id="profile"><div class="wrap">
    <div class="sec-head"><span class="eyebrow">Section 01</span><h2>ประวัติและวุฒิการศึกษา</h2></div>
    <div class="two">
      <div class="card"><h3 style="font-size:17px;margin-bottom:10px">ข้อมูลทั่วไป</h3>
        <dl class="dl">${[
          ["ชื่อ–สกุล", t.name], ["ตำแหน่ง", t.position], ["กลุ่มสาระฯ", t.subject],
          ["สถานศึกษา", `${esc(t.school)}<br>${esc(t.address || "")}`],
          ["สังกัด", t.affiliation], ["เริ่มรับราชการ", t.startDate], ["ใบอนุญาต", t.license]
        ].filter(r => r[1]).map(r =>
          `<div><dt>${esc(r[0])}</dt><dd>${r[0]==="สถานศึกษา" ? r[1] : esc(r[1])}</dd></div>`).join("")}</dl></div>
      <div class="card"><h3 style="font-size:17px;margin-bottom:12px">วุฒิการศึกษา</h3>
        <ul class="edu">${edu.map(e =>
          `<li><span class="yr">${esc(e.year)}</span><span><b>${esc(e.degree)}</b>
            <span class="i">${esc(e.institute)}</span></span></li>`).join("")}</ul>
        <p class="note">${esc(t.eduNote || "")}</p></div>
    </div>
  </div></section>

  <section class="block alt" id="career"><div class="wrap">
    <div class="sec-head"><span class="eyebrow">Section 02</span><h2>เส้นทางการทำงาน</h2></div>
    <ul class="tl">${car.map(c =>
      `<li class="${c.current ? "now" : ""}"><span class="when">${esc(c.when)}</span>
        <b>${esc(c.title)}</b><p>${esc(c.detail || "")}</p></li>`).join("")}</ul>
  </div></section>

  <section class="block" id="roles"><div class="wrap">
    <div class="sec-head"><span class="eyebrow">Section 03</span><h2>บทบาทและความเชี่ยวชาญ</h2></div>
    <div class="roles stagger">${roles.map(r =>
      `<div class="role"><span class="ic">${esc(r.icon)}</span>
        <span><b>${esc(r.title)}</b><p>${esc(r.detail)}</p></span></div>`).join("")}</div>
  </div></section>

  <section class="block alt" id="awards"><div class="wrap">
    <div class="sec-head"><span class="eyebrow">Section 04</span><h2>รางวัลและเกียรติยศ</h2>
      <p>รางวัลที่ได้รับจากการปฏิบัติหน้าที่ครูผู้สอน รวม ${aw.length} รายการ</p></div>
    <div class="dl-filters" id="awFilter">
      <button type="button" data-f="all" aria-pressed="true">ทั้งหมด</button>
      <button type="button" data-f="nation" aria-pressed="false">ระดับชาติ / สพฐ.</button>
      <button type="button" data-f="area" aria-pressed="false">ระดับเขตพื้นที่</button>
    </div>
    <ul class="awards" id="awList">${aw.map(a =>
      `<li class="aw lv-${esc(a.level || "area")}" data-k="${esc(a.level || "area")}">
        <span class="yr">${esc(a.year)}</span>
        <span><b>${esc(a.title)}</b><p>${esc(a.org || "")}</p></span>
        <span class="tag">${esc(a.tag || "")}</span></li>`).join("")}</ul>
  </div></section>

  <section class="block" id="students"><div class="wrap">
    <div class="sec-head"><span class="eyebrow">Section 05</span><h2>ผลงานนักเรียนในฐานะครูผู้ฝึกสอน</h2></div>
    <ul class="sr">${st.map(s => {
      const m = MED[s.medal] || MED.gold;
      return `<li><span class="medal ${m[0]}">${m[1]}</span>
        <span><b>${esc(s.title)}</b><p>${esc(s.detail || "")}</p></span>
        <span class="lvl">${esc(s.level || "")}</span></li>`;
    }).join("")}</ul>
  </div></section>

  <section class="block alt" id="innovation"><div class="wrap">
    <div class="sec-head"><span class="eyebrow">Section 06</span><h2>นวัตกรรมและแนวทางการจัดการเรียนรู้</h2></div>
    <div class="inno stagger">${inn.map(i =>
      `<div class="icard"><span class="ic">${esc(i.icon)}</span><b>${esc(i.title)}</b>
        <p>${esc(i.detail)}</p>${i.note ? `<p class="use">${esc(i.note)}</p>` : ""}</div>`).join("")}</div>
  </div></section>

  <section class="block" id="training"><div class="wrap">
    <div class="sec-head"><span class="eyebrow">Section 07</span><h2>การพัฒนาตนเองทางวิชาชีพ</h2>
      <p>การประชุม อบรม และสัมมนาทางวิชาการ รวม ${tr.length} หลักสูตร/กิจกรรม</p></div>
    <div class="two">${years.map(y =>
      `<div class="card"><h3 style="font-size:16px;margin-bottom:10px">ปีงบประมาณ ${esc(y)}</h3>
        <ul class="train">${tr.filter(x => x.yr === y).map(x =>
          `<li><time>${esc(x.date)}</time><span>${esc(x.title)}
            ${x.org ? `<em>${esc(x.org)}</em>` : ""}</span></li>`).join("")}</ul></div>`).join("")}</div>
  </div></section>

  <section class="block alt" id="gallery"><div class="wrap">
    <div class="sec-head"><span class="eyebrow">Section 08</span><h2>เกียรติบัตรและประกาศ</h2>
      <p>หลักฐานอ้างอิงบางส่วนจากแฟ้มผลงาน · กดที่ภาพเพื่อดูขนาดเต็ม</p></div>
    <div class="gal stagger" id="gal">${certs.map((c, i) =>
      `<figure><img src="${esc(c.img)}" alt="${esc(c.title)}" data-i="${i}" loading="lazy">
        <figcaption><b>${esc(c.title)}</b>${esc(c.detail || "")}</figcaption></figure>`).join("")}</div>
    <div class="cta" style="margin-top:24px">
      <a class="btn btn-navy" href="#/home">← กลับหน้าหลัก</a>
      <a class="btn btn-ghost" href="#/downloads">ดูไฟล์แจกฟรี →</a>
    </div>
  </div></section>`;

  host.querySelector("#awFilter").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    host.querySelectorAll("#awFilter button").forEach(el => el.setAttribute("aria-pressed", el === b));
    const k = b.dataset.f;
    host.querySelectorAll("#awList .aw").forEach(li => li.hidden = (k !== "all" && li.dataset.k !== k));
  });
  host.querySelector("#gal").addEventListener("click", e => {
    const im = e.target.closest("img"); if (!im) return;
    lightbox(certs.map(c => ({ src:c.img, cap:c.title })), +im.dataset.i);
  });
}

/* ============================================================
   ติดต่อครู
   ============================================================ */
export async function contact(host){
  const [site, t] = await Promise.all([one("site"), one("teacher")]);

  const chans = [
    { k:"contactEmail",    ic:"✉️", label:"อีเมล",       sub:"ส่งคำถามหรือขอเอกสารเพิ่มเติม", pre:"mailto:" },
    { k:"contactLine",     ic:"💬", label:"LINE Official", sub:"สอบถามแบบรวดเร็ว",            pre:"" },
    { k:"contactYoutube",  ic:"▶️", label:"ช่อง YouTube",  sub:"คลิปบทเรียนและเฉลยโจทย์",      pre:"" },
    { k:"contactFacebook", ic:"📘", label:"เพจ Facebook",  sub:"ข่าวสารและกิจกรรมของครู",      pre:"" }
  ].filter(c => site[c.k]);

  host.innerHTML = H`
  <div class="page-head">
    <div class="wrap pop pop-1">
      <p class="crumb"><a href="#/home">หน้าหลัก</a> &#8250; ติดต่อครู</p>
      <span class="eyebrow">Contact</span>
      <h1>ติดต่อครูน้อยหน่า</h1>
      <p class="sub">มีคำถามเกี่ยวกับบทเรียน ต้องการเอกสารเพิ่มเติม อยากขอไฟล์งาน หรือมีข้อเสนอแนะเกี่ยวกับเว็บไซต์ ติดต่อได้ตามช่องทางด้านล่างค่ะ</p>
    </div>
  </div>
  <section><div class="wrap ct-grid">
    <div class="ct-card pop pop-1">
      <h2 style="font-size:20px">ช่องทางติดต่อ</h2>
      <p style="font-size:14.5px;color:var(--muted);margin-top:6px">เลือกช่องทางที่สะดวกที่สุด ครูจะตอบกลับโดยเร็วที่สุดค่ะ</p>
      <div class="ct-list">${chans.length
        ? chans.map(c => `<a href="${esc(c.pre + site[c.k])}" target="_blank" rel="noopener">
            <span class="ic">${c.ic}</span><span><b>${c.label}</b><small>${c.sub}</small></span></a>`).join("")
        : `<div class="empty"><div class="ic">📭</div><b>ยังไม่ได้ใส่ช่องทางติดต่อ</b>
             <p>เพิ่มได้ที่ <a href="#/admin" style="color:var(--royal);font-weight:600">ระบบจัดการเว็บไซต์</a> → ตั้งค่าเว็บไซต์</p></div>`}</div>
    </div>
    <div class="ct-card pop pop-2">
      <h2 style="font-size:20px">สถานที่ทำงาน</h2>
      <div class="ct-where">${[
        ["👩‍🏫", `${t.name} (${t.nickname})`], ["🎓", t.position], ["🏫", t.school],
        ["📍", t.address], ["🏛️", t.affiliation]
      ].filter(r => r[1]).map(r =>
        `<div><span class="i">${r[0]}</span><span>${esc(r[1])}</span></div>`).join("")}</div>
      <div class="cta" style="margin-top:22px">
        <a class="btn btn-ghost" href="#/about">ดูประวัติและผลงาน →</a>
      </div>
    </div>
  </div></section>`;
}
