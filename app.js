// ============================================================
// PO. BORNEO TRANS — MAIN APP.JS (Public Frontend)
// Alur pemesanan: 1 Cari Jadwal → 2 Data Penumpang & Kelas →
// 3 Bayar Virtual Account → 4 Pilih Kursi → 5 E-Tiket
// ============================================================

// ---- GLOBAL STATE ----
function newBooking() {
  return {
    route: null, schedule: null, date: null, unit: 1, numSeats: 1,
    passengers: [],            // { name, phone, seatClass, seat, bookingId }
    activePassenger: 0,
    boardingPoint: "", dropoffPoint: "",
    bank: "BCA", vaNumber: "", bookingIds: [], groupId: null,
  };
}
let currentBooking = newBooking();
let vaTimerInterval = null;
let vaTimerExpiry = null;

const VA_BANKS = {
  BCA: { name: "BCA Virtual Account", prefix: "39158" },
  Mandiri: { name: "Mandiri Virtual Account", prefix: "88908" },
  BRI: { name: "BRI Virtual Account", prefix: "26215" },
  BNI: { name: "BNI Virtual Account", prefix: "8808" },
  Permata: { name: "Permata Virtual Account", prefix: "8528" },
};
const SEAT_ROWS = [
  { left: "B1", right: ["B2", "B3"] }, { left: "C1", right: ["C2", "C3"] },
  { left: "D1", right: ["D2", "D3"] }, { left: "E1", right: ["E2", "E3"] },
  { left: "F1", right: ["F2", "F3"] },
];

// ---- INIT ----
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  populateRouteSelects();
  setMinDate();
  renderHeroParticles();
  renderTestimonials();
  renderFAQ();
  renderGallery();
  const wa = document.getElementById("waFloat");
  if (wa) wa.href = `https://wa.me/${BTM.COMPANY.whatsapp}?text=${encodeURIComponent("Halo Borneo Trans, saya ingin bertanya tentang tiket bis listrik.")}`;
  initBookingPage();
});

// ---- HALAMAN PEMESANAN (pesan.html) ----
// Mengisi form dari parameter URL (pencarian cepat di beranda) atau melanjutkan pilih kursi (?resume=KODE)
function initBookingPage() {
  if (!document.getElementById("searchForm")) return;
  const q = new URLSearchParams(window.location.search);
  const resume = q.get("resume");
  if (resume) { resumeSeatSelection(resume.toUpperCase()); return; }
  const routeId = q.get("route"), date = q.get("date"), seats = q.get("seats");
  if (!routeId || !DB.getRouteById(routeId)) return;
  document.getElementById("searchRoute").value = routeId;
  updateBoardingDropoff(routeId, "searchBoarding", "searchDropoff", true);
  if (date && date >= Utils.toLocalDate()) document.getElementById("searchDate").value = date;
  if (seats && ["1", "2", "3", "4"].includes(seats)) document.getElementById("searchSeats").value = seats;
  if (document.getElementById("searchDate").value) searchSchedules(null);
}

// ---- NAVBAR ----
function initNavbar() {
  window.addEventListener("scroll", () => {
    const nb = document.getElementById("navbar");
    if (!nb || nb.dataset.fixed) return;
    if (window.scrollY > 50) nb.classList.add("scrolled"); else nb.classList.remove("scrolled");
    updateActiveNav();
  });
}
function updateActiveNav() {
  const sections = ["beranda", "pemesanan", "menjangkau-kami", "fasilitas", "cek-tiket", "faq"];
  const y = window.scrollY + 100;
  sections.forEach(id => {
    const el = document.getElementById(id);
    const link = document.querySelector(`[data-nav="${id}"]`);
    if (!el || !link) return;
    link.classList.toggle("active", y >= el.offsetTop && y < el.offsetTop + el.offsetHeight);
  });
}
function toggleMobileMenu() { document.getElementById("mobileMenu").classList.toggle("open"); }
function closeMobileMenu() { document.getElementById("mobileMenu").classList.remove("open"); }
function goToAdmin() { window.location.href = "admin.html"; }

// ---- PARTICLES ----
function renderHeroParticles() {
  const container = document.getElementById("heroParticles");
  if (!container) return;
  const colors = ["rgba(37,99,235,0.35)", "rgba(29,78,216,0.25)", "rgba(255,255,255,0.15)", "rgba(30,64,175,0.2)"];
  for (let i = 0; i < 20; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 60 + 10;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;background:${colors[Math.floor(Math.random() * colors.length)]};animation-delay:${Math.random() * 8}s;animation-duration:${Math.random() * 6 + 6}s;`;
    container.appendChild(p);
  }
}

// ---- ROUTE SELECT ----
function populateRouteSelects() {
  ["heroRoute", "searchRoute"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option value="">— Pilih Rute —</option>' +
      BTM.ROUTES.map(r => `<option value="${r.id}">${r.name} (${r.duration})</option>`).join("");
  });
  const sr = document.getElementById("searchRoute");
  if (sr) sr.addEventListener("change", e => {
    updateBoardingDropoff(e.target.value, "searchBoarding", "searchDropoff", true);
  });
}

// Isi daftar titik naik/turun sesuai rute; kosongkan pilihan lama bila rute berganti
function updateBoardingDropoff(routeId, boardingId, dropoffId, reset = false) {
  const route = DB.getRouteById(routeId);
  if (!route) return;
  const bEl = document.getElementById(boardingId), dEl = document.getElementById(dropoffId);
  if (!bEl || !dEl) return;
  const from = BTM.BOARDING_POINTS[route.fromCode] || [];
  const to = BTM.DROPOFF_POINTS[route.toCode] || [];
  const bList = document.getElementById(boardingId === "searchBoarding" ? "boardingList" : boardingId + "List");
  const dList = document.getElementById(dropoffId === "searchDropoff" ? "dropoffList" : dropoffId + "List");
  if (bList) bList.innerHTML = from.map(p => `<option value="${Utils.esc(p)}">`).join("");
  if (dList) dList.innerHTML = to.map(p => `<option value="${Utils.esc(p)}">`).join("");
  if (reset || !from.includes(bEl.value)) bEl.value = from[0] || "";
  if (reset || !to.includes(dEl.value)) dEl.value = to[0] || "";
}

function setMinDate() {
  const today = Utils.toLocalDate();
  ["heroDate", "searchDate"].forEach(id => { const el = document.getElementById(id); if (el) el.min = today; });
}

// ---- HERO SEARCH ----
function handleHeroSearch(e) {
  e.preventDefault();
  const routeId = document.getElementById("heroRoute").value;
  const date = document.getElementById("heroDate").value;
  const seats = document.getElementById("heroSeats").value;
  if (!routeId || !date) { showToast("Pilih rute dan tanggal perjalanan!", "error"); return; }
  const params = new URLSearchParams({ route: routeId, date, seats });
  window.location.href = `pesan.html?${params.toString()}`;
}

// ---- KETERSEDIAAN PER KELAS ----
// Pesanan yang sudah dibayar tetapi belum memilih kursi tetap dihitung memakai kapasitas kelasnya.
function classCapacityLeft(routeId, scheduleId, date, cls) {
  const total = (BTM.CLASSES[cls]?.seats || []).length;
  let left = 0;
  [1, 2].forEach(unit => {
    if (unit === 2 && !DB.isUnit2Unlocked(routeId, scheduleId, date)) return;
    left += Math.max(0, total - DB.countActive(routeId, scheduleId, date, unit, cls));
  });
  return left;
}

// ---- SEARCH SCHEDULES ----
function searchSchedules(e) {
  if (e) e.preventDefault();
  DB.expirePending();
  const routeId = document.getElementById("searchRoute").value;
  const date = document.getElementById("searchDate").value;
  const seats = parseInt(document.getElementById("searchSeats").value) || 1;
  if (!routeId || !date) { showToast("Pilih rute dan tanggal!", "error"); return; }

  stopVATimer();
  TempLock.unlockSession(Utils.getSessionId());
  currentBooking = newBooking();
  currentBooking.route = DB.getRouteById(routeId);
  currentBooking.date = date;
  currentBooking.numSeats = seats;
  currentBooking.boardingPoint = document.getElementById("searchBoarding").value;
  currentBooking.dropoffPoint = document.getElementById("searchDropoff").value;

  const schedules = BTM.SCHEDULES.filter(s => s.routeId === routeId);
  const resultsEl = document.getElementById("scheduleResults");
  const listEl = document.getElementById("scheduleList");
  document.getElementById("scheduleResultTitle").textContent =
    `${schedules.length} Jadwal Tersedia — ${currentBooking.route.name}, ${Utils.formatDate(date)}`;
  listEl.innerHTML = "";

  if (!schedules.length) {
    listEl.innerHTML = `<div style="text-align:center;padding:40px;color:var(--silver-400)">😕 Tidak ada jadwal tersedia untuk rute ini</div>`;
    resultsEl.classList.remove("hidden");
    return;
  }

  const price = BTM.PRICES[routeId] || {};
  schedules.forEach(sch => {
    const sol = classCapacityLeft(routeId, sch.id, date, "solitaire");
    const roy = classCapacityLeft(routeId, sch.id, date, "royal");
    const total = sol + roy;
    const availClass = total > 10 ? "avail-high" : total > 4 ? "avail-mid" : "avail-low";
    const card = document.createElement("div");
    card.className = "schedule-card";
    card.dataset.scheduleId = sch.id;
    card.onclick = () => selectScheduleById(sch.id);
    card.innerHTML = `
      <div class="schedule-time"><div class="time-big">${sch.departure}</div><div class="time-label">Berangkat</div></div>
      <div class="time-divider"><div class="time-line"></div><div class="time-duration">🚌 ${currentBooking.route.duration}</div><div class="time-line"></div></div>
      <div class="schedule-time"><div class="time-big">${Utils.fmtTime(sch.arrival)}</div><div class="time-label">Tiba</div></div>
      <div style="flex:1;padding:0 16px">
        <div style="font-weight:600;font-size:0.875rem">${currentBooking.route.name}</div>
        <div style="font-size:0.8rem;color:var(--silver-400)">${Utils.formatDate(date)}</div>
        <div class="availability-chip ${availClass}" style="margin-top:8px">💺 ${total} kursi tersedia (Solitaire: ${sol}, Royal: ${roy})</div>
      </div>
      <div class="schedule-price">
        <div class="price-class">Vip Royal / Solitaire</div>
        <div class="price-main">${Utils.formatCurrency(price.royal || 0)}</div>
        <div class="price-sub">Solitaire ${Utils.formatCurrency(price.solitaire || 0)}</div>
      </div>
      <div><button class="btn btn-primary" ${total < 1 ? "disabled" : ""} onclick="event.stopPropagation(); selectScheduleById('${sch.id}')">${total < 1 ? "Penuh" : "Pilih"}</button></div>`;
    listEl.appendChild(card);
  });
  resultsEl.classList.remove("hidden");
}

function selectScheduleById(id) {
  const sch = BTM.SCHEDULES.find(x => x.id === id);
  if (!sch || !currentBooking.route) return;
  const total = classCapacityLeft(currentBooking.route.id, id, currentBooking.date, "solitaire") +
                classCapacityLeft(currentBooking.route.id, id, currentBooking.date, "royal");
  if (total < currentBooking.numSeats) { showToast(`Kursi tersisa ${total}, kurang untuk ${currentBooking.numSeats} penumpang.`, "warning"); return; }
  currentBooking.schedule = sch;
  currentBooking.boardingPoint = document.getElementById("searchBoarding").value;
  currentBooking.dropoffPoint = document.getElementById("searchDropoff").value;
  document.querySelectorAll(".schedule-card").forEach(c => c.classList.toggle("selected", c.dataset.scheduleId === id));
  setTimeout(() => goToStep(2), 250);
}

// ---- STEP NAVIGATION ----
function goToStep(step) {
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`bookingStep${i}`);
    if (el) el.classList.toggle("hidden", i !== step);
    const ind = document.getElementById(`step${i}Indicator`);
    if (ind) { ind.classList.remove("active", "done"); if (i === step) ind.classList.add("active"); else if (i < step) ind.classList.add("done"); }
    const div = document.getElementById(`div${i}`);
    if (div) div.classList.toggle("done", i < step);
  }
  if (step !== 3) stopVATimer();
  if (step === 2) renderPassengerForms();
  if (step === 3) renderPaymentStep();
  if (step === 4) renderSeatMap();
  if (step === 5) TempLock.unlockSession(Utils.getSessionId());
  document.getElementById("pemesanan")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ============================================================
// STEP 2 — DATA PENUMPANG & PILIHAN KELAS
// ============================================================
function collectPassengerInputs() {
  const list = [];
  for (let i = 0; i < currentBooking.numSeats; i++) {
    const prev = currentBooking.passengers[i] || {};
    const nameEl = document.getElementById(`pName_${i}`);
    const phoneEl = document.getElementById(`pPhone_${i}`);
    const clsEl = document.querySelector(`input[name="pClass_${i}"]:checked`);
    list.push({
      ...prev,
      name: nameEl ? nameEl.value : (prev.name || ""),
      phone: phoneEl ? phoneEl.value : (prev.phone || ""),
      seatClass: clsEl ? clsEl.value : (prev.seatClass || "royal"),
    });
  }
  currentBooking.passengers = list;
}

function renderPassengerForms() {
  const { route, schedule, date, numSeats } = currentBooking;
  if (!route || !schedule) return;
  if (!currentBooking.passengers.length) collectPassengerInputs();
  else collectPassengerInputs();

  document.getElementById("step2ScheduleSummary").textContent =
    `${route.name} • ${Utils.formatDate(date)} • ${schedule.departure} → ${Utils.fmtTime(schedule.arrival)} • ${numSeats} penumpang`;

  const price = BTM.PRICES[route.id] || {};
  const solLeft = classCapacityLeft(route.id, schedule.id, date, "solitaire");
  const royLeft = classCapacityLeft(route.id, schedule.id, date, "royal");

  document.getElementById("passengerForms").innerHTML = currentBooking.passengers.map((p, i) => {
    const opt = (cls, label, icon, left, pr) => `
      <label style="flex:1;min-width:210px;display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border:2px solid ${p.seatClass === cls ? "#C9971C" : "#E2E8F0"};border-radius:12px;cursor:${left < 1 ? "not-allowed" : "pointer"};opacity:${left < 1 ? 0.5 : 1};background:${p.seatClass === cls ? "#FFF9E6" : "white"}">
        <input type="radio" name="pClass_${i}" value="${cls}" ${p.seatClass === cls ? "checked" : ""} ${left < 1 ? "disabled" : ""} onchange="onClassChange()" style="margin-top:4px" />
        <span><strong>${icon} ${label}</strong><br/>
        <span style="font-size:0.8rem;color:var(--silver-500)">${Utils.formatCurrency(pr)} • sisa ${left} kursi</span></span>
      </label>`;
    return `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header" style="background:var(--silver-50);color:var(--silver-900);border:1px solid var(--silver-200)">
        <h4 style="font-weight:700;font-size:0.95rem;color:var(--silver-900);margin:0">Penumpang ${i + 1}</h4>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
          <div class="form-group"><label class="form-label">Nama Lengkap *</label>
            <input type="text" class="form-input" id="pName_${i}" placeholder="Sesuai KTP" value="${Utils.esc(p.name || "")}" oninput="refreshSummaries()" /></div>
          <div class="form-group"><label class="form-label">Nomor HP *</label>
            <input type="tel" class="form-input" id="pPhone_${i}" placeholder="08xxxxxxxxxx" value="${Utils.esc(p.phone || "")}" /></div>
        </div>
        <label class="form-label">Pilih Kelas *</label>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          ${opt("royal", "Vip Royal Class", "👑", royLeft, price.royal || 0)}
          ${opt("solitaire", "Solitaire Business Class", "👑", solLeft, price.solitaire || 0)}
        </div>
      </div>
    </div>`;
  }).join("");

  const cb = document.getElementById("checkoutBoarding"), cd = document.getElementById("checkoutDropoff");
  const fromPts = BTM.BOARDING_POINTS[route.fromCode] || [], toPts = BTM.DROPOFF_POINTS[route.toCode] || [];
  document.getElementById("checkoutBoardingList").innerHTML = fromPts.map(x => `<option value="${Utils.esc(x)}">`).join("");
  document.getElementById("checkoutDropoffList").innerHTML = toPts.map(x => `<option value="${Utils.esc(x)}">`).join("");
  cb.value = currentBooking.boardingPoint || fromPts[0] || "";
  cd.value = currentBooking.dropoffPoint || toPts[0] || "";
  renderOrderSummary("orderSummaryStep2");
}

function onClassChange() { collectPassengerInputs(); renderPassengerForms(); }
function refreshSummaries() { collectPassengerInputs(); renderOrderSummary("orderSummaryStep2"); }

function calcTotal() {
  const { route, passengers } = currentBooking;
  return passengers.reduce((sum, p) => sum + DB.getPriceByRouteAndClass(route.id, p.seatClass), 0);
}

function proceedToPayment() {
  collectPassengerInputs();
  const { route, schedule, date, passengers } = currentBooking;
  for (const [i, p] of passengers.entries()) {
    p.name = Utils.cleanText(p.name); p.phone = Utils.cleanPhone(p.phone);
    if (!p.name || p.phone.replace(/\D/g, "").length < 9) { showToast(`Isi nama dan nomor HP penumpang ${i + 1}.`, "error"); return; }
  }
  currentBooking.boardingPoint = Utils.cleanText(document.getElementById("checkoutBoarding").value);
  currentBooking.dropoffPoint = Utils.cleanText(document.getElementById("checkoutDropoff").value);
  if (!currentBooking.boardingPoint) { showToast("Isi titik naik!", "error"); return; }
  if (!currentBooking.dropoffPoint) { showToast("Isi titik turun!", "error"); return; }

  // Cek kapasitas tiap kelas untuk pesanan ini
  for (const cls of ["solitaire", "royal"]) {
    const need = passengers.filter(p => p.seatClass === cls).length;
    if (need && need > classCapacityLeft(route.id, schedule.id, date, cls)) {
      showToast(`Kursi ${BTM.CLASSES[cls].name} kurang untuk ${need} penumpang.`, "error"); return;
    }
  }
  goToStep(3);
}

// ---- RINGKASAN PESANAN ----
function renderOrderSummary(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const { route, schedule, date, passengers, boardingPoint, dropoffPoint } = currentBooking;
  if (!route || !schedule) return;
  const total = calcTotal();
  el.innerHTML = `
  <div class="card order-summary-card">
    <div class="card-header"><h4 style="font-weight:700;font-size:1rem">📋 Ringkasan Pesanan</h4></div>
    <div class="card-body" style="padding:16px 20px">
      <div class="order-row"><span class="order-label">Rute</span><span class="order-value">${route.name}</span></div>
      <div class="order-row"><span class="order-label">Tanggal</span><span class="order-value">${Utils.formatDate(date)}</span></div>
      <div class="order-row"><span class="order-label">Jam Berangkat</span><span class="order-value">${schedule.departure}</span></div>
      <div class="order-row"><span class="order-label">Titik Naik</span><span class="order-value">${Utils.esc(boardingPoint || "—")}</span></div>
      <div class="order-row"><span class="order-label">Titik Turun</span><span class="order-value">${Utils.esc(dropoffPoint || "—")}</span></div>
      ${passengers.map((p, i) => `
        <div style="border-top:1px solid var(--silver-100);margin-top:8px;padding-top:8px">
          <div class="order-row"><span class="order-label">Penumpang ${i + 1}</span><span class="order-value">${Utils.esc(p.name || "—")}</span></div>
          <div class="order-row"><span class="order-label">Kelas</span><span class="order-value">👑 ${Utils.getSeatClassName(p.seatClass)}</span></div>
          <div class="order-row"><span class="order-label">Kursi</span><span class="order-value">${p.seat ? Utils.esc(p.seat) : "Dipilih setelah bayar"}</span></div>
          <div class="order-row"><span class="order-label">Harga</span><span class="order-value">${Utils.formatCurrency(DB.getPriceByRouteAndClass(route.id, p.seatClass))}</span></div>
        </div>`).join("")}
      <div class="order-row order-total"><span class="order-label">Total Bayar</span><span class="order-value">${Utils.formatCurrency(total)}</span></div>
    </div>
  </div>`;
}

// ============================================================
// STEP 3 — PEMBAYARAN VIRTUAL ACCOUNT (satu-satunya metode)
// ============================================================
function renderPaymentStep() {
  renderOrderSummary("orderSummaryStep3");
  if (!currentBooking.vaSeed) currentBooking.vaSeed = String(Math.floor(Math.random() * 1e8)).padStart(8, "0");
  selectVABank(currentBooking.bank || "BCA");
  document.getElementById("vaAmountDisplay").textContent = Utils.formatCurrency(calcTotal());
  startVATimer();
}

function buildVANumber(bank) {
  const prefix = VA_BANKS[bank].prefix;
  const digits = (prefix + "9539" + currentBooking.vaSeed).slice(0, 16).padEnd(16, "0");
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function selectVABank(bank) {
  if (!VA_BANKS[bank]) return;
  currentBooking.bank = bank;
  currentBooking.vaNumber = buildVANumber(bank);
  document.querySelectorAll(".va-bank-btn").forEach(b => b.classList.toggle("selected", b.dataset.bank === bank));
  document.getElementById("vaBankNameDisplay").textContent = VA_BANKS[bank].name;
  document.getElementById("vaNumberDisplay").textContent = currentBooking.vaNumber;
  const t = document.getElementById("vaNumberText1"); if (t) t.textContent = currentBooking.vaNumber;
}

function copyVANumber() { copyText(currentBooking.vaNumber.replace(/\s/g, ""), "Nomor Virtual Account sudah disalin!"); }
function copyVAAmount() { copyText(String(calcTotal()), "Nominal tagihan sudah disalin!"); }

function toggleVAInstruction(key) {
  const body = document.getElementById(key === "atm" ? "vaBodyAtm" : "vaBodyMbanking");
  const icon = document.getElementById(key === "atm" ? "vaIconAtm" : "vaIconMbanking");
  const hide = !body.classList.contains("hidden");
  body.classList.toggle("hidden", hide);
  if (icon) icon.textContent = hide ? "▶" : "▼";
}

function startVATimer() {
  stopVATimer();
  vaTimerExpiry = Date.now() + 15 * 60 * 1000;
  const el = document.getElementById("vaTimerDisplay");
  const tick = () => {
    const left = vaTimerExpiry - Date.now();
    if (left <= 0) {
      stopVATimer();
      showToast("⏰ Waktu bayar habis. Silakan pesan ulang.", "warning");
      goToStep(2);
      return;
    }
    const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    el.textContent = `Batas Bayar: ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };
  tick();
  vaTimerInterval = setInterval(tick, 1000);
}
function stopVATimer() { if (vaTimerInterval) clearInterval(vaTimerInterval); vaTimerInterval = null; }

// Simulasi pembayaran lunas. Pada produksi, status "paid" datang dari callback payment gateway.
function confirmVAPayment() {
  if (!document.getElementById("termsAgree")?.checked) { showToast("Centang Syarat & Ketentuan dulu.", "error"); return; }
  const { route, schedule, date, passengers, boardingPoint, dropoffPoint } = currentBooking;

  for (const cls of ["solitaire", "royal"]) {
    const need = passengers.filter(p => p.seatClass === cls).length;
    if (need && need > classCapacityLeft(route.id, schedule.id, date, cls)) {
      showToast(`Maaf, kursi ${BTM.CLASSES[cls].name} baru saja habis. Pilih kelas lain.`, "error");
      goToStep(2); return;
    }
  }

  const groupId = passengers.length > 1 ? DB.generateBookingId().replace("BTM-", "GRP-") : null;
  const ids = [];
  passengers.forEach(p => {
    const id = DB.generateBookingId();
    DB.addBooking({
      id, passengerName: p.name, phone: p.phone,
      routeId: route.id, scheduleId: schedule.id, date,
      boardingPoint, dropoffPoint,
      seatNumber: null, seatClass: p.seatClass, unit: 1,
      price: DB.getPriceByRouteAndClass(route.id, p.seatClass),
      paymentMethod: "virtual_account", vaBank: currentBooking.bank, vaNumber: currentBooking.vaNumber,
      paymentStatus: "paid", bookingStatus: "confirmed", paidAt: new Date().toISOString(),
      groupId, bookedBy: "online", bookedAt: new Date().toISOString(), kasir: "Online",
    });
    p.bookingId = id; ids.push(id);
  });
  currentBooking.bookingIds = ids;
  currentBooking.groupId = groupId;
  currentBooking.activePassenger = 0;
  stopVATimer();
  showToast("✅ Bayar via Virtual Account berhasil. Silakan pilih kursi.", "success");
  goToStep(4);
}

// ============================================================
// STEP 4 — PILIH KURSI (SETELAH BAYAR)
// ============================================================
function renderSeatMap() {
  const { route, schedule, date, unit } = currentBooking;
  if (!route || !schedule) return;
  document.getElementById("selectedScheduleInfoSeat").textContent =
    `${route.name} | ${schedule.departure} → ${Utils.fmtTime(schedule.arrival)} | ${Utils.formatDate(date)} | Unit ${unit}`;

  const u2 = DB.isUnit2Unlocked(route.id, schedule.id, date);
  const u1Btn = document.getElementById("unit1Btn"), u2Btn = document.getElementById("unit2Btn");
  u1Btn.classList.toggle("active", unit === 1);
  u2Btn.classList.toggle("active", unit === 2);
  u2Btn.disabled = !u2;
  u2Btn.classList.toggle("locked", !u2);
  u2Btn.textContent = u2 ? "🚌 Unit 2" : "🔒 Unit 2 (Terkunci)";

  const sid = Utils.getSessionId();
  const booked = DB.getBookedSeats(route.id, schedule.id, date, unit);
  const locked = TempLock.getLockedSeats(route.id, schedule.id, date, unit, sid);
  document.getElementById("seatMapContainer").innerHTML = buildBusHTML(booked, locked);
  updateSeatSidebar();
}

function buildBusHTML(booked, locked) {
  const price = BTM.PRICES[currentBooking.route.id] || {};
  const active = currentBooking.passengers[currentBooking.activePassenger];
  const activeCls = active?.seatClass;
  const mine = currentBooking.passengers.map(p => p.seat).filter(Boolean);

  const seatHTML = seatNum => {
    const cls = Utils.getSeatClass(seatNum);
    const isBooked = booked.includes(seatNum), isLocked = locked.includes(seatNum), isSel = mine.includes(seatNum);
    const wrongClass = !isSel && activeCls && cls !== activeCls;
    const state = isBooked ? "booked" : isLocked ? "temp-locked" : isSel ? "selected" : "available";
    const clickable = !isBooked && !isLocked && !wrongClass;
    const title = isBooked ? "Kursi sudah terisi" : isLocked ? "Sedang dipilih orang lain" : wrongClass ? "Kelas beda dengan tiket penumpang aktif" : isSel ? "Klik untuk batal pilih" : `Pilih kursi ${seatNum}`;
    return `<div class="seat ${cls === "solitaire" ? "solitaire-seat" : ""} ${state} ${wrongClass ? "disabled-class" : ""}"
      ${clickable ? `onclick="toggleSeat('${seatNum}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}"` : ""}
      title="${title} — ${Utils.formatCurrency(cls === "solitaire" ? price.solitaire : price.royal)}">
      <div class="seat-num">${seatNum}</div>
      <div class="seat-class-label">${cls === "solitaire" ? "Solitaire" : "Royal"}</div>
    </div>`;
  };

  return `
  <div class="bus-front-header">
    <span class="bus-badge-pintu">Pintu</span>
    <span class="bus-badge-driver">Pengemudi</span>
  </div>
  <div class="class-divider sleeper-div">👑 Solitaire Business Class</div>
  <div class="seat-row">${seatHTML("A1")}<div class="aisle">||</div>${seatHTML("A2")}</div>
  <div class="class-divider royal-div" style="margin-top:12px">👑 Vip Royal Class</div>
  ${SEAT_ROWS.map(r => `<div class="seat-row">${seatHTML(r.left)}<div class="aisle">||</div>${r.right.map(seatHTML).join("")}</div>`).join("")}
  <div class="bus-rear-footer">
    <span class="bus-badge-bagasi">Bagasi</span>
    <span class="bus-badge-pintu" style="background:#475569">Pintu</span>
    <span class="bus-badge-toilet">Toilet</span>
  </div>`;
}

function toggleSeat(seatNum) {
  const { route, schedule, date, unit, passengers } = currentBooking;
  const sid = Utils.getSessionId();
  const owner = passengers.findIndex(p => p.seat === seatNum);

  if (owner !== -1) {                       // klik kursi terpilih → batalkan
    passengers[owner].seat = null;
    TempLock.unlock(seatNum, sid);
    currentBooking.activePassenger = owner;
  } else {
    const p = passengers[currentBooking.activePassenger];
    if (!p) return;
    if (Utils.getSeatClass(seatNum) !== p.seatClass) { showToast(`Kursi ini bukan kelas tiket ${p.name} (${Utils.getSeatClassName(p.seatClass)}).`, "warning"); return; }
    if (p.seat) TempLock.unlock(p.seat, sid);
    p.seat = seatNum;
    TempLock.lock(route.id, schedule.id, date, unit, seatNum, sid);
    const next = passengers.findIndex(x => !x.seat);
    if (next !== -1) currentBooking.activePassenger = next;
  }
  renderSeatMap();
}

function setActivePassenger(i) { currentBooking.activePassenger = i; renderSeatMap(); }

function updateSeatSidebar() {
  const { passengers, route } = currentBooking;
  const price = BTM.PRICES[route.id] || {};
  document.getElementById("passengerSeatAssignmentList").innerHTML = passengers.map((p, i) => `
    <div onclick="setActivePassenger(${i})" style="cursor:pointer;padding:12px;margin-bottom:8px;border-radius:12px;border:2px solid ${i === currentBooking.activePassenger ? "#C9971C" : "#E2E8F0"};background:${i === currentBooking.activePassenger ? "#FFF9E6" : "white"}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <strong style="font-size:0.9rem">${i + 1}. ${Utils.esc(p.name)}</strong>
        ${p.seat ? `<span class="badge badge-gold">${p.seat}</span>` : `<span class="badge badge-secondary">Belum dipilih</span>`}
      </div>
      <div style="font-size:0.78rem;color:var(--silver-500);margin-top:4px">👑 ${Utils.getSeatClassName(p.seatClass)} • ${Utils.formatCurrency(p.seatClass === "solitaire" ? price.solitaire : price.royal)} (lunas)</div>
    </div>`).join("");

  const done = passengers.filter(p => p.seat).length;
  const all = done === passengers.length;
  const act = passengers[currentBooking.activePassenger];
  document.getElementById("seatSelectionStatusText").innerHTML = all
    ? "✅ Semua kursi sudah dipilih. Klik tombol di bawah untuk menerbitkan e-tiket."
    : `Pilih kursi untuk <strong>${Utils.esc(act?.name || "")}</strong> (${Utils.getSeatClassName(act?.seatClass)}). ${done}/${passengers.length} kursi terpilih.`;
  document.getElementById("confirmSeatsBtn").disabled = !all;
}

function selectUnit(unit) {
  const { route, schedule, date } = currentBooking;
  if (unit === 2 && !DB.isUnit2Unlocked(route.id, schedule.id, date)) { showToast("Unit 2 masih terkunci. Isi Unit 1 dulu.", "warning"); return; }
  if (unit === currentBooking.unit) return;
  currentBooking.unit = unit;
  currentBooking.passengers.forEach(p => p.seat = null);
  currentBooking.activePassenger = 0;
  TempLock.unlockSession(Utils.getSessionId());
  renderSeatMap();
}

function confirmSeatSelection() {
  const { route, schedule, date, unit, passengers } = currentBooking;
  if (passengers.some(p => !p.seat)) { showToast("Pilih kursi untuk semua penumpang.", "error"); return; }
  const taken = DB.getBookedSeats(route.id, schedule.id, date, unit);
  const clash = passengers.filter(p => taken.includes(p.seat));
  if (clash.length) {
    clash.forEach(p => p.seat = null);
    showToast(`Kursi ${clash.map(p => p.seat || "").join("")}sudah diambil penumpang lain. Pilih kursi lain.`, "error");
    currentBooking.activePassenger = passengers.findIndex(p => !p.seat);
    renderSeatMap(); return;
  }
  passengers.forEach(p => {
    DB.updateBooking(p.bookingId, { seatNumber: p.seat, unit });
    DB.addAuditLog("online", `Kursi ${p.seat} (Unit ${unit}) dipilih untuk tiket ${p.bookingId} — ${p.name}`, "booking");
  });
  renderEticket();
  goToStep(5);
  showToast("🎉 Kursi tersimpan. E-tiket Anda sudah terbit!", "success");
}

// Lanjutkan memilih kursi untuk pesanan yang sudah dibayar (dari menu Cek Tiket)
function resumeSeatSelection(bookingId) {
  if (!document.getElementById("bookingStep4")) { window.location.href = `pesan.html?resume=${encodeURIComponent(bookingId)}`; return; }
  const b = DB.getBookingById(bookingId);
  if (!b || b.paymentStatus !== "paid" || b.seatNumber) {
    showToast("Tiket tidak ditemukan atau kursinya sudah dipilih.", "warning"); return;
  }
  const group = b.groupId ? DB.getBookings().filter(x => x.groupId === b.groupId && !x.seatNumber && x.paymentStatus === "paid" && x.bookingStatus !== "cancelled") : [b];
  stopVATimer();
  TempLock.unlockSession(Utils.getSessionId());
  currentBooking = newBooking();
  currentBooking.route = DB.getRouteById(b.routeId);
  currentBooking.schedule = DB.getScheduleById(b.scheduleId);
  currentBooking.date = b.date;
  currentBooking.numSeats = group.length;
  currentBooking.boardingPoint = b.boardingPoint;
  currentBooking.dropoffPoint = b.dropoffPoint;
  currentBooking.groupId = b.groupId || null;
  currentBooking.passengers = group.map(x => ({ name: x.passengerName, phone: x.phone, seatClass: x.seatClass, seat: null, bookingId: x.id }));
  currentBooking.bookingIds = group.map(x => x.id);
  goToStep(4);
}

// ============================================================
// STEP 5 — E-TIKET
// ============================================================
function ticketHTML(b, extra = "") {
  const route = DB.getRouteById(b.routeId), sched = DB.getScheduleById(b.scheduleId);
  return `
  <div class="eticket" style="margin-bottom:24px">
    <div class="eticket-header">
      <div style="font-size:1.5rem">⚡🚌</div>
      <h2>PO. Borneo Trans — PT. Borneo Trans Mandiri</h2>
      <p>Bus Listrik Antar Kota — Pontianak ↔ Sintang</p>
      <div class="eticket-booking-id">${b.id}</div>
      <span class="badge badge-success">✅ Lunas — Virtual Account</span>
    </div>
    <div class="eticket-body">
      ${b.groupId ? `<div class="eticket-row"><span class="eticket-lbl">Grup</span><span class="eticket-val">${b.groupId}</span></div>` : ""}
      <div class="eticket-row"><span class="eticket-lbl">Nama</span><span class="eticket-val">${Utils.esc(b.passengerName)}</span></div>
      <div class="eticket-row"><span class="eticket-lbl">No. HP</span><span class="eticket-val">${Utils.esc(b.phone)}</span></div>
      <div class="eticket-row"><span class="eticket-lbl">Rute</span><span class="eticket-val">${route?.name || b.routeId}</span></div>
      <div class="eticket-row"><span class="eticket-lbl">Tanggal</span><span class="eticket-val">${Utils.formatDate(b.date)}</span></div>
      <div class="eticket-row"><span class="eticket-lbl">Jam Berangkat</span><span class="eticket-val">${sched?.departure || "—"}</span></div>
      <div class="eticket-row"><span class="eticket-lbl">Titik Naik</span><span class="eticket-val">${Utils.esc(b.boardingPoint)}</span></div>
      <div class="eticket-row"><span class="eticket-lbl">Titik Turun</span><span class="eticket-val">${Utils.esc(b.dropoffPoint)}</span></div>
      <div class="eticket-row"><span class="eticket-lbl">Unit</span><span class="eticket-val">Unit ${b.unit}</span></div>
      <div class="eticket-row"><span class="eticket-lbl">Kursi</span><span class="eticket-val"><strong>${b.seatNumber || "Belum dipilih"}</strong></span></div>
      <div class="eticket-row"><span class="eticket-lbl">Kelas</span><span class="eticket-val">👑 ${Utils.getSeatClassName(b.seatClass)}</span></div>
      <div class="eticket-row"><span class="eticket-lbl">Cara Bayar</span><span class="eticket-val">🏦 Virtual Account${b.vaBank ? " " + b.vaBank : ""}</span></div>
      <div class="eticket-row"><span class="eticket-lbl">Total Bayar</span><span class="eticket-val" style="color:var(--magenta-600);font-size:1.1rem">${Utils.formatCurrency(b.price)}</span></div>
    </div>
    <div class="eticket-tear"><div class="dashes"></div></div>
    <div class="eticket-qr">
      <div style="margin-top:6px;font-size:0.78rem;color:var(--silver-500);text-align:center">
        Tunjukkan kode booking ini ke kru saat naik bus<br/>
        <span style="font-family:monospace;font-size:0.9rem;background:var(--silver-100);padding:4px 12px;border-radius:4px;display:inline-block;margin-top:6px;font-weight:700">${b.id}</span>
      </div>
      ${extra}
    </div>
  </div>`;
}

function renderEticket() {
  const refund = id => `<button class="btn btn-outline-magenta btn-sm no-print" style="margin-top:12px" onclick="openRefundModal('${id}')">📋 Bantuan Refund / Pembatalan</button>`;
  const list = currentBooking.bookingIds.map(id => DB.getBookingById(id)).filter(Boolean);
  document.getElementById("eticketContainer").innerHTML = list.map(b => ticketHTML(b, refund(b.id))).join("");
  const names = list.map(b => `${b.passengerName} (${b.seatNumber})`).join(", ");
  const first = list[0];
  const msg = `Halo Borneo Trans, ini e-tiket saya.\nKode: ${list.map(b => b.id).join(", ")}\nRute: ${currentBooking.route.name}\nTanggal: ${currentBooking.date}\nJam: ${currentBooking.schedule.departure}\nPenumpang/Kursi: ${names}`;
  const wa = document.getElementById("shareEticketWABtn");
  if (wa && first) wa.href = `https://wa.me/${BTM.COMPANY.whatsapp}?text=${encodeURIComponent(msg)}`;
}

function preparePrint(html) {
  const area = document.getElementById("print-area");
  area.innerHTML = html; area.style.display = "block";
  window.print();
  setTimeout(() => { area.style.display = "none"; area.innerHTML = ""; }, 500);
}
function downloadEticket() { showToast("📥 Di jendela cetak, pilih \"Simpan sebagai PDF\".", "info"); preparePrint(document.getElementById("eticketContainer").innerHTML); }
function printEticket() { preparePrint(document.getElementById("eticketContainer").innerHTML); }
function printTicketStatus() { preparePrint(document.getElementById("ticketStatusResult").innerHTML); }
function resetBooking() {
  stopVATimer();
  TempLock.unlockSession(Utils.getSessionId());
  currentBooking = newBooking();
  document.getElementById("scheduleResults").classList.add("hidden");
  goToStep(1);
}

// ---- CHECK TICKET STATUS ----
function checkTicketStatus(e) {
  e.preventDefault();
  const code = document.getElementById("checkCode").value.trim().toUpperCase();
  const phone = document.getElementById("checkPhone").value.trim();
  const resultEl = document.getElementById("ticketStatusResult");
  const b = code && phone ? DB.getBookingByCodeAndPhone(code, phone) : null;

  if (!b) {
    resultEl.innerHTML = `<div class="card" style="text-align:center;padding:40px"><div style="font-size:3rem;margin-bottom:12px">😕</div>
      <h3 style="font-weight:700;margin-bottom:8px">Tiket Tidak Ditemukan</h3>
      <p style="color:var(--silver-500);font-size:0.9rem">Pastikan kode booking dan nomor HP sudah benar.</p></div>`;
    resultEl.classList.remove("hidden"); return;
  }
  const needSeat = b.paymentStatus === "paid" && !b.seatNumber && b.bookingStatus !== "cancelled" && b.bookingStatus !== "refunded";
  const actions = `<div class="no-print" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:12px">
      ${needSeat ? `<button class="btn btn-gold btn-sm" onclick="resumeSeatSelection('${b.id}')">💺 Pilih Kursi Sekarang</button>` : ""}
      <button class="btn btn-primary btn-sm" onclick="printTicketStatus()">🖨️ Cetak e-tiket</button>
      <button class="btn btn-outline-magenta btn-sm" onclick="openRefundModal('${b.id}')">💰 Bantuan Refund</button></div>`;
  resultEl.innerHTML = ticketHTML(b, actions).replace(/<span class="badge badge-success">✅ Lunas — Virtual Account<\/span>/,
    `<span class="badge ${Utils.statusBadgeClass(b.bookingStatus)}">${Utils.statusLabel(b.bookingStatus)}</span> <span class="badge ${Utils.statusBadgeClass(b.paymentStatus)}">${Utils.statusLabel(b.paymentStatus)}</span>`);
  resultEl.classList.remove("hidden");
  resultEl.scrollIntoView({ behavior: "smooth" });
}

// ---- GALERI ARMADA & INTERIOR ----
let galleryFilter = "all";
let lightboxIndex = 0;
function visibleGallery() { return BTM.GALLERY.filter(g => galleryFilter === "all" || g.cat === galleryFilter); }
function renderGallery() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;
  grid.innerHTML = visibleGallery().map((g, i) => `
    <figure class="gallery-card" tabindex="0" role="button" aria-label="Perbesar foto: ${Utils.esc(g.title)}"
      onclick="openLightbox(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openLightbox(${i})}">
      <img src="${Utils.esc(g.src)}" alt="${Utils.esc(g.title)} — Bis Listrik Borneo Trans" loading="lazy" />
      <figcaption>
        <span class="gallery-tag">${g.cat === "armada" ? "Armada" : "Interior"}</span>
        <strong>${Utils.esc(g.title)}</strong>
        <span>${Utils.esc(g.desc)}</span>
      </figcaption>
    </figure>`).join("");
}
function filterGallery(cat) {
  galleryFilter = cat;
  document.querySelectorAll("#galleryFilters .facility-tab").forEach(b => b.classList.toggle("active", b.dataset.filter === cat));
  renderGallery();
}
function openLightbox(i) {
  lightboxIndex = i;
  showLightbox();
  document.getElementById("lightbox").classList.add("open");
  document.body.style.overflow = "hidden";
}
function showLightbox() {
  const list = visibleGallery();
  const g = list[lightboxIndex];
  if (!g) return;
  const img = document.getElementById("lightboxImg");
  img.src = g.src; img.alt = g.title;
  document.getElementById("lightboxCaption").textContent = `${g.title} — ${g.desc} (${lightboxIndex + 1}/${list.length})`;
}
function stepLightbox(d) {
  const n = visibleGallery().length;
  lightboxIndex = (lightboxIndex + d + n) % n;
  showLightbox();
}
function closeLightbox() {
  const lb = document.getElementById("lightbox");
  if (lb) lb.classList.remove("open");
  document.body.style.overflow = "";
}
document.addEventListener("keydown", e => {
  const lb = document.getElementById("lightbox");
  if (!lb || !lb.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") stepLightbox(-1);
  if (e.key === "ArrowRight") stepLightbox(1);
});

// ---- FACILITY TABS ----
function switchFacility(type) {
  document.querySelectorAll(".facility-tab").forEach((tab, i) => tab.classList.toggle("active", ["sleeper", "royal", "general"][i] === type));
  document.querySelectorAll(".facility-content").forEach(el => el.classList.remove("active"));
  document.getElementById(`facility-${type}`)?.classList.add("active");
}

// ---- TESTIMONIALS ----
function renderTestimonials() {
  const grid = document.getElementById("testimonialsGrid");
  if (!grid) return;
  grid.innerHTML = BTM.TESTIMONIALS.map(t => `
    <div class="testimonial-card animate-fadeInUp">
      <div class="testimonial-stars">${"★".repeat(t.rating)}</div>
      <p class="testimonial-text">${t.text}</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${t.avatar}</div>
        <div>
          <div class="testimonial-name">${t.name}</div>
          <div class="testimonial-city">${t.city}</div>
        </div>
      </div>
    </div>
  `).join("");
}

// ---- FAQ ----
function renderFAQ() {
  const list = document.getElementById("faqList");
  if (!list) return;
  list.innerHTML = BTM.FAQS.map((faq, i) => `
    <div class="faq-item" id="faqItem${i}">
      <button class="faq-question" onclick="toggleFaq(${i})" id="faqQ${i}">
        <span>${faq.q}</span>
        <span class="faq-icon">+</span>
      </button>
      <div class="faq-answer" id="faqA${i}">
        <div class="faq-answer-inner">${faq.a}</div>
      </div>
    </div>
  `).join("");
}

function toggleFaq(i) {
  const q = document.getElementById(`faqQ${i}`);
  const a = document.getElementById(`faqA${i}`);
  const isOpen = q.classList.contains("open");
  // Close all
  document.querySelectorAll(".faq-question").forEach(el => { el.classList.remove("open"); el.setAttribute("aria-expanded", "false"); });
  document.querySelectorAll(".faq-answer").forEach(el => { el.style.maxHeight = "0"; });
  if (!isOpen) {
    q.classList.add("open");
    q.setAttribute("aria-expanded", "true");
    a.style.maxHeight = a.scrollHeight + "px";
  }
}

// ---- MODALS ----
function openVideoModal() {
  document.getElementById("videoModal").classList.add("open");
}
function closeVideoModal() {
  document.getElementById("videoModal").classList.remove("open");
  document.getElementById("youtubeFrame").src = "about:blank";
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

// Close modal on overlay click
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("open");
    const frame = document.getElementById("youtubeFrame");
    if (frame) frame.src = "about:blank";
  }
});

function openRefundModal(bookingId) {
  const booking = bookingId ? DB.getBookingById(bookingId) : null;
  const waBtn = document.getElementById("refundWABtn");
  const infoEl = document.getElementById("refundBookingInfo");

  if (booking) {
    infoEl.innerHTML = `
    <div style="padding:12px 16px;background:var(--silver-50);border-radius:var(--radius-md);border:1px solid var(--silver-200);font-size:0.875rem">
      <strong>Tiket untuk pengajuan refund:</strong><br/>
      Kode: ${booking.id} | Penumpang: ${booking.passengerName} | Kursi: ${booking.seatNumber || "belum dipilih"}
    </div>`;
    const msg = `Halo Borneo Trans, saya ingin mengajukan refund untuk tiket:\n\nKode Booking: ${booking.id}\nNama: ${booking.passengerName}\nNo. HP: ${booking.phone}\nRute: ${booking.routeId}\nTanggal: ${booking.date}\nKursi: ${booking.seatNumber || "-"}\n\nMohon bantuannya. Terima kasih.`;
    waBtn.href = `https://wa.me/${BTM.COMPANY.whatsapp}?text=${encodeURIComponent(msg)}`;
  } else {
    infoEl.innerHTML = "";
    waBtn.href = `https://wa.me/${BTM.COMPANY.whatsapp}?text=${encodeURIComponent("Halo Borneo Trans, saya ingin mengajukan refund tiket.")}`;
  }

  document.getElementById("refundModal").classList.add("open");
}

// ---- TOAST ----
function showToast(message, type = "info") {
  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "slideOutRight 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ---- HELPERS ----
function copyText(text, msg = "Berhasil disalin!") {
  navigator.clipboard.writeText(text).then(() => showToast("✅ " + msg, "success"), () => showToast("Gagal menyalin. Silakan salin manual.", "error"));
}


// ---- LEGAL ----
const LEGAL = {
  terms: { title: "Syarat & Ketentuan", html: `<p style="font-size:0.8rem;color:var(--silver-500);margin-bottom:12px">Draf — mohon ditinjau pihak hukum sebelum dipublikasikan.</p>
    <ul style="display:flex;flex-direction:column;gap:8px;font-size:0.875rem;line-height:1.6">
      <li>• Pesan online dibayar dulu lewat Virtual Account (satu-satunya cara bayar), paling lambat 15 menit setelah tagihan dibuat.</li>
      <li>• Nomor kursi dipilih setelah bayar terkonfirmasi, sesuai kelas yang dibeli (Solitaire Business Class: A1–A2; Vip Royal Class: B1–F3).</li>
      <li>• Datang ke titik naik paling lambat 30 menit sebelum berangkat; terlambat bisa membuat tiket hangus.</li>
      <li>• Bagasi maksimal 20 kg per penumpang.</li>
      <li>• Refund hanya lewat Contact Center: biaya admin 10% (&gt;24 jam), 50% (2–24 jam), tiket hangus (&lt;2 jam).</li>
      <li>• Data penumpang harus benar; Borneo Trans tidak bertanggung jawab atas kesalahan data yang diisi pemesan.</li>
    </ul>` },
  privacy: { title: "Kebijakan Privasi", html: `<p style="font-size:0.8rem;color:var(--silver-500);margin-bottom:12px">Draf — mohon ditinjau pihak hukum sebelum dipublikasikan.</p>
    <ul style="display:flex;flex-direction:column;gap:8px;font-size:0.875rem;line-height:1.6">
      <li>• Data yang dikumpulkan: nama, nomor HP, dan rincian perjalanan untuk menerbitkan tiket dan manifest.</li>
      <li>• Data dipakai untuk layanan perjalanan, konfirmasi bayar, dan kewajiban hukum; tidak dijual ke pihak lain.</li>
      <li>• Anda bisa minta akses, koreksi, atau hapus data lewat Contact Center Borneo Trans.</li>
    </ul>` },
};
function openLegal(type) {
  document.getElementById("legalTitle").textContent = LEGAL[type].title;
  document.getElementById("legalBody").innerHTML = LEGAL[type].html;
  document.getElementById("legalModal").classList.add("open");
}
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  document.querySelectorAll(".modal-overlay.open").forEach(m => m.classList.remove("open"));
  const f = document.getElementById("youtubeFrame"); if (f) f.src = "about:blank";
});
