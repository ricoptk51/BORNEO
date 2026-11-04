// ============================================================
// PO. BORNEO TRANS MANDIRI — ADMIN.JS (Back-Office)
// ============================================================

let currentAdmin = null;
let currentSection = "overview";
let offlineSelectedSeat = null;
let editorSelectedSeats = []; // up to 2 for swap
let detailBookingId = null;

// ---- INIT ----
document.addEventListener("DOMContentLoaded", () => {
  const user = DB.getCurrentUser();
  // Sesi lama (mis. akun kasir yang sudah dihapus) tidak dipakai lagi
  const validUser = user && BTM.USERS.find(u => u.username === user.username);
  if (validUser) {
    currentAdmin = validUser;
    showAdminPanel();
  } else if (user) {
    DB.setCurrentUser(null);
  }
  // Populate route selects
  populateAdminRoutes();
  setMinDates();
});

function setMinDates() {
  const today = Utils.toLocalDate();
  const dateFields = ["crewDate", "overrideDate", "offDate", "editorDate", "sjDate", "manifestDate"];
  dateFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = today; }
  });
}

function populateAdminRoutes() {
  const routeSelects = ["crewRoute", "overrideRoute", "editorRoute", "sjRoute", "offRouteId", "manifestRoute"];
  routeSelects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = id === "manifestRoute" ? '<option value="">Semua Rute</option>' : '';
    BTM.ROUTES.forEach(r => {
      el.innerHTML += `<option value="${r.id}">${r.name}</option>`;
    });
  });
  // Populate schedule selects based on first route
  updateAdminSchedules();
  updateOfflineForm();
}

function updateAdminSchedules() {
  // Tiap select jadwal mengikuti select rute miliknya sendiri
  const pairs = [["overrideRoute", "overrideSchedule"], ["editorRoute", "editorSchedule"], ["sjRoute", "sjSchedule"]];
  pairs.forEach(([routeSel, schedSel]) => {
    const el = document.getElementById(schedSel);
    if (!el) return;
    const routeId = document.getElementById(routeSel)?.value || BTM.ROUTES[0]?.id;
    const prev = el.value;
    const scheds = BTM.SCHEDULES.filter(x => x.routeId === routeId);
    el.innerHTML = scheds.map(x => `<option value="${x.id}">${x.departure} → ${x.arrival}</option>`).join("");
    if (scheds.some(x => x.id === prev)) el.value = prev;
  });
}

document.addEventListener("change", (e) => {
  if (["overrideRoute", "sjRoute"].includes(e.target.id)) updateAdminSchedules();
  if (e.target.id === "editorRoute") { updateAdminSchedules(); loadEditorSeatMap(); }
});

// ---- AUTH ----
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("loginUser").value.trim();
  const password = document.getElementById("loginPass").value.trim();
  const user = BTM.USERS.find(u => u.username === username && u.password === password);

  if (!user) {
    adminToast("Username atau password salah!", "error");
    return;
  }

  currentAdmin = user;
  DB.setCurrentUser(user);
  DB.addAuditLog(user.username, `Login ke sistem back-office`, "system");
  showAdminPanel();
}

function showAdminPanel() {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("adminLayout").classList.remove("hidden");
  document.getElementById("adminUserName").textContent = currentAdmin.name;
  document.getElementById("adminUserBranch").textContent = currentAdmin.branch;
  document.getElementById("adminUserAvatar").textContent = currentAdmin.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  document.getElementById("adminRoleBadge").textContent = "⭐ Admin";

  showSection("overview");
}

function handleLogout() {
  if (!confirm("Yakin ingin keluar?")) return;
  DB.addAuditLog(currentAdmin.username, "Logout dari back-office", "system");
  DB.setCurrentUser(null);
  currentAdmin = null;
  document.getElementById("loginPage").classList.remove("hidden");
  document.getElementById("adminLayout").classList.add("hidden");
}

function togglePassVis() {
  const inp = document.getElementById("loginPass");
  inp.type = inp.type === "password" ? "text" : "password";
}

// ---- SECTION NAVIGATION ----
const sectionTitles = {
  overview: "📊 Ringkasan & Statistik",
  manifest: "📋 Daftar Penumpang",
  bookingOffline: "🎫 Pesan di Loket",
  schedule: "📅 Jadwal & Bus",
  seatEditor: "🗺️ Atur Denah Kursi",
  refund: "💰 Pengembalian Uang",
  suratJalan: "📄 Surat Jalan",
  keuangan: "💵 Laporan Uang",
  auditLog: "🔍 Riwayat Aktivitas",
};

function showSection(section) {
  currentSection = section;
  document.getElementById("adminSidebar")?.classList.remove("mobile-open");
  document.querySelectorAll(".page-section").forEach(el => el.classList.remove("active"));
  document.getElementById(`section-${section}`)?.classList.add("active");
  document.querySelectorAll(".admin-nav-item").forEach(el => el.classList.remove("active"));
  document.querySelector(`[onclick="showSection('${section}')"]`)?.classList.add("active");
  document.getElementById("adminPageTitle").textContent = sectionTitles[section] || section;

  // Lazy load section
  if (section === "overview") renderOverview();
  if (section === "manifest") renderManifest();
  if (section === "refund") renderRefundHistory();
  if (section === "keuangan") renderKeuangan();
  if (section === "auditLog") renderAuditLog();
  if (section === "schedule") renderScheduleTable();
}

function toggleSidebar() {
  if (window.matchMedia("(max-width: 1024px)").matches) {
    document.getElementById("adminSidebar").classList.toggle("mobile-open");
  } else {
    document.body.classList.toggle("admin-sidebar-collapsed");
  }
}

// ---- OVERVIEW ----
function renderOverview() {
  const bookings = DB.getBookings();
  const today = Utils.toLocalDate();

  const todayBookings = bookings.filter(b => b.bookedAt && Utils.toLocalDate(b.bookedAt) === today && b.bookingStatus !== "cancelled" && b.bookingStatus !== "refunded");
  const totalRevToday = todayBookings.reduce((a, b) => a + (b.paymentStatus === "paid" ? b.price : 0), 0);
  const confirmedTotal = bookings.filter(b => b.bookingStatus === "confirmed").length;
  const pendingTotal = bookings.filter(b => b.paymentStatus === "pending" && b.bookingStatus !== "cancelled").length;
  const totalRevAll = bookings.filter(b => b.paymentStatus === "paid").reduce((a,b) => a+b.price, 0);

  document.getElementById("statsGrid").innerHTML = `
    <div class="stat-card" style="color:var(--magenta-500)">
      <div class="stat-icon magenta">🎫</div>
      <div class="stat-value">${confirmedTotal}</div>
      <div class="stat-label">Total Tiket Terkonfirmasi</div>
      <div class="stat-trend trend-up">↑ ${todayBookings.length} hari ini</div>
    </div>
    <div class="stat-card" style="color:var(--gold-500)">
      <div class="stat-icon gold">💵</div>
      <div class="stat-value" style="font-size:1.2rem">${Utils.formatCurrency(totalRevToday)}</div>
      <div class="stat-label">Pendapatan Hari Ini</div>
      <div class="stat-trend trend-up">↑ Lunas</div>
    </div>
    <div class="stat-card" style="color:var(--success)">
      <div class="stat-icon success">💰</div>
      <div class="stat-value" style="font-size:1.2rem">${Utils.formatCurrency(totalRevAll)}</div>
      <div class="stat-label">Total Pendapatan</div>
      <div class="stat-trend trend-up">↑ Semua waktu</div>
    </div>
    <div class="stat-card" style="color:var(--warning)">
      <div class="stat-icon" style="background:#FEF3C7">⏳</div>
      <div class="stat-value">${pendingTotal}</div>
      <div class="stat-label">Tiket Menunggu Bayar</div>
      <div class="stat-trend" style="color:var(--warning)">Perlu dikonfirmasi</div>
    </div>`;

  renderRevenueChart(bookings);
  renderPaymentDonut(bookings);
  renderBranchChart(bookings);
}

function renderRevenueChart(bookings) {
  const chartEl = document.getElementById("revenueChart");
  const labelsEl = document.getElementById("chartLabels");
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(Utils.toLocalDate(d));
  }
  const maxVal = Math.max(...days.map(d => bookings.filter(b => b.bookedAt && Utils.toLocalDate(b.bookedAt) === d && b.paymentStatus === "paid").reduce((a,b)=>a+b.price,0)), 1);

  chartEl.innerHTML = days.map(d => {
    const rev = bookings.filter(b => b.bookedAt && Utils.toLocalDate(b.bookedAt) === d && b.paymentStatus === "paid").reduce((a,b)=>a+b.price,0);
    const pct = Math.max((rev/maxVal)*100, 4);
    const short = new Date(d+"T00:00:00").toLocaleDateString("id-ID",{month:"short",day:"numeric"});
    return `<div style="flex:1;position:relative;height:100%;display:flex;flex-direction:column;justify-content:flex-end">
      <div class="chart-bar" style="height:${(pct * 0.85).toFixed(1)}%">
        <div class="chart-bar-val">${rev > 0 ? Utils.formatCurrency(rev).replace("Rp","").trim() : ""}</div>
      </div>
      <div class="chart-bar-label">${short}</div>
    </div>`;
  }).join("");
}

const VA_BANK_LIST = ["BCA", "Mandiri", "BRI", "BNI", "Permata"];
// Pembayaran: tiap bank Virtual Account + Tunai (Cash)
const CASH_LABEL = "Tunai (Cash)";
function payMethodLabel(b) {
  if (b.paymentMethod === "cash") return "Tunai (Cash)";
  return "Virtual Account" + (b.vaBank ? " " + b.vaBank : "");
}
function vaBankRevenue(paid) {
  const va = paid.filter(x => x.paymentMethod !== "cash");
  const rows = VA_BANK_LIST.map(b => ({ label: b, text: `🏦 ${b} VA`, count: va.filter(x => x.vaBank === b).length, rev: va.filter(x => x.vaBank === b).reduce((a, x) => a + x.price, 0) }));
  const other = va.filter(x => !VA_BANK_LIST.includes(x.vaBank));
  if (other.length) rows.push({ label: "Lainnya", text: "🏦 VA Lainnya", count: other.length, rev: other.reduce((a, x) => a + x.price, 0) });
  const cash = paid.filter(x => x.paymentMethod === "cash");
  rows.push({ label: CASH_LABEL, text: "💵 " + CASH_LABEL, count: cash.length, rev: cash.reduce((a, x) => a + x.price, 0) });
  return rows;
}
function renderPaymentDonut(bookings) {
  const el = document.getElementById("paymentDonut");
  const paid = bookings.filter(b => b.paymentStatus === "paid");
  const rows = vaBankRevenue(paid).filter(r => r.count > 0);
  const total = paid.length || 1;
  const colors = ["#2563EB", "#0284C7", "#10B981", "#EA580C", "#64748B", "#93C5FD"];
  let offset = 0;
  const segs = rows.map((r, i) => {
    const v = (r.count / total) * 100;
    const c = `<circle cx="21" cy="21" r="15.9" fill="none" stroke="${colors[i % colors.length]}" stroke-width="5" stroke-dasharray="${v} ${100 - v}" stroke-dashoffset="${-offset + 25}" />`;
    offset += v; return c;
  });
  el.innerHTML = `
    <svg viewBox="0 0 42 42" class="donut-svg" style="width:100px;height:100px;flex-shrink:0">
      <circle cx="21" cy="21" r="15.9" fill="none" stroke="#E2E8F0" stroke-width="5" />${segs.join("")}
    </svg>
    <div class="donut-legend">
      <div style="font-size:0.75rem;color:var(--silver-500);margin-bottom:6px">Virtual Account &amp; Tunai</div>
      ${rows.length ? rows.map((r, i) => `<div class="donut-legend-item"><div class="donut-dot" style="background:${colors[i % colors.length]}"></div><div>${r.label}: <strong>${Math.round(r.count / total * 100)}%</strong></div></div>`).join("") : '<div style="font-size:0.8rem;color:var(--silver-400)">Belum ada pembayaran</div>'}
    </div>`;
}

function renderBranchChart(bookings) {
  const el = document.getElementById("branchChart");
  const branches = ["Online", "Loket"];
  const isCh = (bk, b) => b === "Online" ? bk.kasir === "Online" : bk.kasir !== "Online";
  const max = Math.max(...branches.map(b => bookings.filter(bk => isCh(bk, b) && bk.paymentStatus === "paid").reduce((a,bk)=>a+bk.price,0)), 1);

  el.innerHTML = branches.map(b => {
    const rev = bookings.filter(bk => isCh(bk, b) && bk.paymentStatus === "paid").reduce((a,bk)=>a+bk.price,0);
    const pct = Math.round((rev/max)*100);
    const short = b === "Online" ? "Online" : "Loket (Admin)";
    return `<div class="bar-row">
      <div class="bar-label">${short}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div class="bar-val">${Utils.formatCurrency(rev)}</div>
    </div>`;
  }).join("");
}

// ---- MANIFEST ----
function getManifestBookings() {
  const v = id => document.getElementById(id)?.value || "";
  const date = v("manifestDate"), route = v("manifestRoute"), unit = v("manifestUnit"), agent = v("manifestAgent");
  let list = DB.getBookings().filter(b => !["cancelled", "refunded"].includes(b.bookingStatus));
  if (date) list = list.filter(b => b.date === date);
  if (route) list = list.filter(b => b.routeId === route);
  if (unit) list = list.filter(b => String(b.unit) === unit);
  if (agent) list = list.filter(b => agent === "Online" ? b.kasir === "Online" : b.kasir !== "Online");
  return list;
}
function renderManifest() {
  const dateVal = document.getElementById("manifestDate")?.value || "";
  const routeVal = document.getElementById("manifestRoute")?.value || "";
  const unitVal = document.getElementById("manifestUnit")?.value || "";
  const agentVal = document.getElementById("manifestAgent")?.value || "";

  const bookings = getManifestBookings();

  const bodyEl = document.getElementById("manifestBody");
  const summaryEl = document.getElementById("manifestSummary");

  if (bookings.length === 0) {
    bodyEl.innerHTML = `<tr><td colspan="11" style="text-align:center;color:var(--silver-400);padding:40px">Tidak ada data penumpang untuk filter ini</td></tr>`;
    summaryEl.textContent = "Tidak ada data";
    return;
  }

  summaryEl.textContent = `${bookings.length} penumpang | Total: ${Utils.formatCurrency(bookings.filter(b=>b.paymentStatus==="paid").reduce((a,b)=>a+b.price,0))}`;

  bodyEl.innerHTML = bookings.map((b, i) => {
    const route = DB.getRouteById(b.routeId);
    return `<tr>
      <td>${i+1}</td>
      <td><span style="font-family:monospace;font-size:0.78rem;font-weight:700">${b.id}</span></td>
      <td><strong>${Utils.esc(b.passengerName)}</strong></td>
      <td>${b.phone}</td>
      <td style="font-size:0.8rem">${b.boardingPoint||"—"} → ${b.dropoffPoint||"—"}</td>
      <td><span class="badge ${b.seatClass==="solitaire"?"badge-magenta":"badge-gold"}">👑 ${Utils.getSeatClassName(b.seatClass)}</span></td>
      <td><strong>${b.seatNumber||"—"}</strong></td>
      <td>Unit ${b.unit}</td>
      <td><span class="badge ${Utils.statusBadgeClass(b.paymentStatus)}">${Utils.statusLabel(b.paymentStatus)}</span></td>
      <td style="font-size:0.8rem">${b.kasir||"—"}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-sm btn-ghost" onclick="openBookingDetail('${b.id}')" title="Detail">👁</button>
          ${b.paymentStatus === "pending" ? `<button class="btn btn-sm btn-success" onclick="quickMarkPaid('${b.id}')" title="Tandai Lunas">✅</button>` : ""}
        </div>
      </td>
    </tr>`;
  }).join("");
}

// ---- EXPORT CSV ----
function exportManifestCSV() {
  const dateVal = document.getElementById("manifestDate")?.value || "";
  const routeVal = document.getElementById("manifestRoute")?.value || "";
  const unitVal = document.getElementById("manifestUnit")?.value || "";
  const bookings = getManifestBookings();

  const headers = ["No","No. Tiket","Nama Penumpang","No. Telepon","Rute","Titik Naik","Titik Turun","Kelas","Kursi","Unit","Status Bayar","Metode Bayar","Harga","Channel","Tanggal Pesan"];
  const rows = bookings.map((b, i) => [
    i+1, b.id, b.passengerName, `="${b.phone}"`, b.routeId,
    b.boardingPoint, b.dropoffPoint, Utils.getSeatClassName(b.seatClass), b.seatNumber || "",
    `Unit ${b.unit}`, b.paymentStatus, payMethodLabel(b), b.price,
    b.kasir, b.bookedAt
  ]);

  const safe = (c) => { let t = String(c ?? ""); if (/^[=+\-@]/.test(t) && !t.startsWith('="')) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
  const csv = [headers, ...rows].map(r => r.map(safe).join(",")).join("\n");
  const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `manifest_btm_${dateVal||"all"}.csv`;
  a.click();
  adminToast("📥 File CSV berhasil diunduh!", "success");
  DB.addAuditLog(currentAdmin.username, `Export manifest CSV (filter: date=${dateVal}, route=${routeVal})`, "admin");
}

// ---- BOOKING DETAIL ----
function openBookingDetail(id) {
  const b = DB.getBookingById(id);
  if (!b) return;
  detailBookingId = id;
  const route = DB.getRouteById(b.routeId);
  const sched = DB.getScheduleById(b.scheduleId);

  document.getElementById("bookingDetailBody").innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:0.875rem">
      <div><strong>ID Booking:</strong><br/><span style="font-family:monospace;color:var(--magenta-600);font-weight:700">${b.id}</span></div>
      <div><strong>Status:</strong><br/><span class="badge ${Utils.statusBadgeClass(b.bookingStatus)}">${Utils.statusLabel(b.bookingStatus)}</span></div>
      <div><strong>Nama:</strong><br/>${b.passengerName}</div>
      <div><strong>No. HP:</strong><br/>${b.phone}</div>
      <div><strong>Rute:</strong><br/>${route?.name||b.routeId}</div>
      <div><strong>Tanggal:</strong><br/>${Utils.formatDate(b.date)}</div>
      <div><strong>Jam:</strong><br/>${sched?.departure||"—"}</div>
      <div><strong>Kursi:</strong><br/><strong>${b.seatNumber||"Belum dipilih"}</strong> (${Utils.getSeatClassName(b.seatClass)})</div>
      <div><strong>Unit:</strong><br/>Unit ${b.unit}</div>
      <div><strong>Titik Naik:</strong><br/>${b.boardingPoint||"—"}</div>
      <div><strong>Titik Turun:</strong><br/>${b.dropoffPoint||"—"}</div>
      <div><strong>Metode Bayar:</strong><br/>${payMethodLabel(b)}</div>
      <div><strong>Status Bayar:</strong><br/><span class="badge ${Utils.statusBadgeClass(b.paymentStatus)}">${Utils.statusLabel(b.paymentStatus)}</span></div>
      <div><strong>Harga:</strong><br/><span style="color:var(--magenta-600);font-weight:700">${Utils.formatCurrency(b.price)}</span></div>
      <div><strong>Channel:</strong><br/>${b.kasir||"—"}</div>
      <div><strong>Waktu Pesan:</strong><br/>${Utils.formatDateTime(b.bookedAt)}</div>
    </div>`;

  const markPaidBtn = document.getElementById("markPaidBtn");
  const cancelBtn = document.getElementById("cancelBookingBtn");
  markPaidBtn.style.display = b.paymentStatus === "pending" ? "" : "none";
  cancelBtn.style.display = b.bookingStatus === "confirmed" || b.bookingStatus === "pending" ? "" : "none";

  document.getElementById("bookingDetailModal").classList.add("open");
}

function markAsPaid() {
  if (!detailBookingId) return;
  const b = DB.getBookingById(detailBookingId);
  if (!b) return;
  DB.updateBooking(detailBookingId, { paymentStatus: "paid", bookingStatus: "confirmed" });
  DB.addAuditLog(currentAdmin.username, `Menandai tiket ${detailBookingId} (${b.passengerName}) sebagai LUNAS`, "admin");
  adminToast("✅ Tiket berhasil ditandai LUNAS!", "success");
  closeAdminModal("bookingDetailModal");
  renderManifest();
}

function quickMarkPaid(id) {
  const b = DB.getBookingById(id);
  if (!b) return;
  if (!confirm(`Tandai ${b.passengerName} (${b.id}) sebagai LUNAS?`)) return;
  DB.updateBooking(id, { paymentStatus: "paid", bookingStatus: "confirmed" });
  DB.addAuditLog(currentAdmin.username, `Tandai cepat LUNAS tiket ${id} (${b.passengerName})`, "admin");
  adminToast("✅ Tiket ditandai LUNAS!", "success");
  renderManifest();
}

function cancelBooking() {
  if (!detailBookingId) return;
  const pb = DB.getBookingById(detailBookingId);
  if (pb && pb.paymentStatus === "paid") { closeAdminModal("bookingDetailModal"); showSection("refund"); processRefund(detailBookingId); return; }
  if (!confirm("Yakin batalkan tiket ini? Kursi akan dibebaskan.")) return;
  const b = DB.getBookingById(detailBookingId);
  DB.updateBooking(detailBookingId, { bookingStatus: "cancelled", paymentStatus: b?.paymentStatus === "paid" ? "refunded" : "cancelled" });
  DB.addAuditLog(currentAdmin.username, `Membatalkan tiket ${detailBookingId} (${b?.passengerName}, kursi ${b?.seatNumber})`, "refund");
  adminToast("❌ Tiket berhasil dibatalkan!", "info");
  closeAdminModal("bookingDetailModal");
  renderManifest();
}

// ---- PRINT MANIFEST ----
function printManifest() {
  const dateVal = document.getElementById("manifestDate")?.value || "";
  const routeVal = document.getElementById("manifestRoute")?.value || "";
  const bookings = getManifestBookings();

  const route = routeVal ? DB.getRouteById(routeVal) : null;
  const printArea = document.getElementById("print-area");
  printArea.innerHTML = `
    <div class="print-header">
      <h1 style="font-size:16pt">PO. BORNEO TRANS MANDIRI</h1>
      <h2 style="font-size:12pt;font-weight:normal">Manifest Penumpang</h2>
      <div style="font-size:10pt">Rute: ${route?.name||"Semua Rute"} | Tanggal: ${dateVal||"Semua Tanggal"}</div>
      <div style="font-size:9pt;color:#666">Dicetak: ${new Date().toLocaleString("id-ID")}</div>
    </div>
    <table class="print-manifest">
      <thead><tr><th>No</th><th>No. Tiket</th><th>Nama</th><th>No. HP</th><th>Naik → Turun</th><th>Kelas</th><th>Kursi</th><th>Status</th></tr></thead>
      <tbody>
        ${bookings.map((b,i) => `<tr>
          <td>${i+1}</td><td>${b.id}</td><td>${b.passengerName}</td><td>${b.phone}</td>
          <td>${b.boardingPoint||"—"} → ${b.dropoffPoint||"—"}</td>
          <td>${Utils.getSeatClassName(b.seatClass)}</td><td>${b.seatNumber||"—"}</td><td>${b.paymentStatus}</td>
        </tr>`).join("")}
      </tbody>
    </table>
    <div style="margin-top:20px;font-size:9pt">
      <strong>Total Penumpang:</strong> ${bookings.length} | 
      <strong>Total Lunas:</strong> ${Utils.formatCurrency(bookings.filter(b=>b.paymentStatus==="paid").reduce((a,b)=>a+b.price,0))}
    </div>`;
  printArea.style.display = "block";
  window.print();
  setTimeout(() => { printArea.style.display = "none"; }, 500);
}

// ---- OFFLINE BOOKING ----
function updateOfflineForm() {
  const routeId = document.getElementById("offRouteId").value;
  const route = DB.getRouteById(routeId);
  if (!route) return;

  // Schedules
  const schedSel = document.getElementById("offScheduleId");
  const scheds = BTM.SCHEDULES.filter(s => s.routeId === routeId);
  schedSel.innerHTML = scheds.map(s => `<option value="${s.id}">${s.departure} → ${s.arrival}</option>`).join("");

  // Boarding/Dropoff
  const boardingList = document.getElementById("offBoardingList");
  const dropoffList = document.getElementById("offDropoffList");
  if (boardingList) {
    boardingList.innerHTML = (BTM.BOARDING_POINTS[route.fromCode]||[]).map(p => `<option value="${p}">`).join("");
  } else {
    document.getElementById("offBoarding").innerHTML = (BTM.BOARDING_POINTS[route.fromCode]||[]).map(p => `<option value="${p}">${p}</option>`).join("");
  }
  if (dropoffList) {
    dropoffList.innerHTML = (BTM.DROPOFF_POINTS[route.toCode]||[]).map(p => `<option value="${p}">`).join("");
  } else {
    document.getElementById("offDropoff").innerHTML = (BTM.DROPOFF_POINTS[route.toCode]||[]).map(p => `<option value="${p}">${p}</option>`).join("");
  }
}

function loadOfflineSeatMap() {
  const routeId = document.getElementById("offRouteId").value;
  const scheduleId = document.getElementById("offScheduleId").value;
  const date = document.getElementById("offDate").value;
  const unit = parseInt(document.getElementById("offUnit").value);

  if (!routeId || !scheduleId || !date) { adminToast("Pilih rute, jadwal, dan tanggal!", "error"); return; }

  offlineSelectedSeat = null; updateOfflineChange();
  document.getElementById("offSelectedSeat").textContent = "Belum ada kursi dipilih";
  document.getElementById("offPriceDisplay").textContent = "Harga akan muncul setelah kursi dipilih";

  const booked = DB.getBookedSeats(routeId, scheduleId, date, unit);
  const container = document.getElementById("offlineBusMap");
  container.innerHTML = buildAdminBusMap(booked, [], routeId, "offline", { scheduleId, date, unit });
  document.getElementById("offlineSeatMapContainer").classList.remove("hidden");
}

function buildAdminBusMap(booked, selected, routeId, mode, ctx = {}) {
  const activeBookings = DB.getBookings().filter(b =>
    b.seatNumber && b.routeId === routeId && b.scheduleId === ctx.scheduleId && b.date === ctx.date && b.unit === ctx.unit &&
    !["cancelled", "refunded"].includes(b.bookingStatus));
  const rows = [{ left: "B1", right: ["B2", "B3"] }, { left: "C1", right: ["C2", "C3"] }, { left: "D1", right: ["D2", "D3"] },
                { left: "E1", right: ["E2", "E3"] }, { left: "F1", right: ["F2", "F3"] }];

  function seatHTML(seatNum) {
    const isBooked = booked.includes(seatNum), isSelected = selected.includes(seatNum);
    const booking = isBooked ? activeBookings.find(b => b.seatNumber === seatNum) : null;
    const isSol = Utils.getSeatClass(seatNum) === "solitaire";
    const state = isBooked ? "booked" : isSelected ? "selected" : "available";
    const clickFn = mode === "offline" ? `onOfflineSeatClick('${seatNum}')` : `onEditorSeatClick('${seatNum}')`;
    return `<div class="seat ${isSol ? "solitaire-seat" : ""} ${state}" onclick="${clickFn}" title="${booking ? Utils.esc(booking.passengerName) : seatNum}">
      <div class="seat-num">${seatNum}</div>
      ${booking ? `<div class="passenger-name-tag">${Utils.esc(booking.passengerName.split(" ")[0])}</div>` : `<div class="seat-class-label">${isSol ? "SOL" : "ROY"}</div>`}
    </div>`;
  }

  return `<div class="seat-bus-frame" style="max-width:440px">
    <div class="bus-front-header"><span class="bus-badge-pintu">PINTU</span><span class="bus-badge-driver">🧑‍✈️ DRIVER</span></div>
    <div class="class-divider sleeper-div">👑 Solitaire Business Class</div>
    <div class="seat-row">${seatHTML("A1")}<div class="aisle">||</div>${seatHTML("A2")}</div>
    <div class="class-divider royal-div" style="margin-top:12px">👑 Vip Royal Class</div>
    ${rows.map(r => `<div class="seat-row">${seatHTML(r.left)}<div class="aisle">||</div>${r.right.map(seatHTML).join("")}</div>`).join("")}
    <div class="bus-rear-footer"><span class="bus-badge-bagasi">🧳 BAGASI</span><span class="bus-badge-toilet">🚽 TOILET</span></div>
  </div>`;
}

let offlineRouteId, offlineScheduleId, offlineDate, offlineUnit;

function onOfflineSeatClick(seatNum) {
  offlineRouteId = document.getElementById("offRouteId").value;
  offlineScheduleId = document.getElementById("offScheduleId").value;
  offlineDate = document.getElementById("offDate").value;
  offlineUnit = parseInt(document.getElementById("offUnit").value);

  if (!document.getElementById("offVAPaid").checked) { adminToast("Konfirmasi pembayaran (lunas) terlebih dahulu sebelum memilih kursi.", "warning"); return; }
  const booked = DB.getBookedSeats(offlineRouteId, offlineScheduleId, offlineDate, offlineUnit);
  if (booked.includes(seatNum)) { adminToast("Kursi sudah terpesan!", "warning"); return; }

  offlineSelectedSeat = seatNum;
  const cls = Utils.getSeatClass(seatNum);
  const price = DB.getPriceByRouteAndClass(offlineRouteId, cls);
  document.getElementById("offSelectedSeat").innerHTML = `<span class="badge ${cls==="solitaire"?"badge-magenta":"badge-gold"}">${seatNum}</span> — ${Utils.getSeatClassName(cls)}`;
  document.getElementById("offPriceDisplay").innerHTML = `Harga: <strong style="color:var(--magenta-600)">${Utils.formatCurrency(price)}</strong>`;
  updateOfflineChange();

  // Re-render map
  document.getElementById("offlineBusMap").innerHTML = buildAdminBusMap(booked, [seatNum], offlineRouteId, "offline", { scheduleId: offlineScheduleId, date: offlineDate, unit: offlineUnit });
}

function onOfflinePayMethodChange() {
  const m = document.getElementById("offPayMethod").value;
  document.getElementById("offVABankGroup").style.display = m === "virtual_account" ? "" : "none";
  document.getElementById("offCashGroup").style.display = m === "cash" ? "" : "none";
  document.getElementById("offPaidLabel").innerHTML = m === "cash"
    ? "<strong>Uang tunai sudah diterima (lunas).</strong> Bayar dulu, baru pilih kursi — centang ini sebelum memilih kursi di denah."
    : "<strong>Pembayaran VA sudah diterima (lunas).</strong> Bayar dulu, baru pilih kursi — centang ini sebelum memilih kursi di denah.";
  updateOfflineChange();
}

function updateOfflineChange() {
  const el = document.getElementById("offCashChange");
  if (!el) return;
  if (!offlineSelectedSeat) { el.textContent = "Kembalian akan muncul setelah kursi dipilih"; el.style.color = "var(--silver-600)"; return; }
  const price = DB.getPriceByRouteAndClass(offlineRouteId, Utils.getSeatClass(offlineSelectedSeat));
  const recv = parseInt(document.getElementById("offCashReceived").value) || 0;
  if (recv < price) { el.innerHTML = `Harga tiket ${Utils.formatCurrency(price)} — uang diterima masih kurang`; el.style.color = "#B91C1C"; }
  else { el.innerHTML = `Kembalian: <strong>${Utils.formatCurrency(recv - price)}</strong>`; el.style.color = "#047857"; }
}

function submitOfflineBooking() {
  if (!offlineSelectedSeat) { adminToast("Pilih kursi terlebih dahulu!", "error"); return; }
  const name = Utils.cleanText(document.getElementById("offPassengerName").value);
  const phone = Utils.cleanPhone(document.getElementById("offPassengerPhone").value);
  const boarding = document.getElementById("offBoarding").value;
  const dropoff = document.getElementById("offDropoff").value;
  const payMethod = document.getElementById("offPayMethod").value;
  const vaBank = payMethod === "virtual_account" ? document.getElementById("offVABank").value : null;
  if (!document.getElementById("offVAPaid").checked) { adminToast("Pembayaran harus lunas sebelum tiket dibuat.", "error"); return; }

  if (!name || !phone) { adminToast("Isi nama dan nomor HP penumpang!", "error"); return; }
  if (DB.getBookedSeats(offlineRouteId, offlineScheduleId, offlineDate, offlineUnit).includes(offlineSelectedSeat)) {
    adminToast("Kursi baru saja dipesan orang lain, pilih kursi lain.", "error");
    loadOfflineSeatMap();
    return;
  }

  const cls = Utils.getSeatClass(offlineSelectedSeat);
  const price = DB.getPriceByRouteAndClass(offlineRouteId, cls);
  const id = DB.generateBookingId();
  let cashReceived = null, cashChange = null;
  if (payMethod === "cash") {
    cashReceived = parseInt(document.getElementById("offCashReceived").value) || 0;
    if (cashReceived < price) { adminToast(`Uang diterima kurang dari harga tiket (${Utils.formatCurrency(price)})!`, "error"); return; }
    cashChange = cashReceived - price;
  }
  DB.addBooking({
    id, passengerName: name, phone, routeId: offlineRouteId,
    scheduleId: offlineScheduleId, date: offlineDate,
    boardingPoint: boarding, dropoffPoint: dropoff,
    seatNumber: offlineSelectedSeat, seatClass: cls,
    unit: offlineUnit, price, paymentMethod: payMethod, vaBank, cashReceived, cashChange,
    paymentStatus: "paid", bookingStatus: "confirmed", paidAt: new Date().toISOString(),
    bookedBy: currentAdmin.username, bookedAt: new Date().toISOString(),
    kasir: "Loket",
    admin: currentAdmin.name,
  });
  DB.addAuditLog(currentAdmin.username, `Tiket offline ${id} untuk ${name} (kursi ${offlineSelectedSeat}) dibuat di loket`, "booking");

  // Print receipt
  printOfflineTicket(id);
  adminToast(`✅ Tiket ${id} berhasil dibuat untuk ${name}!`, "success");

  // Reset form
  offlineSelectedSeat = null;
  document.getElementById("offVAPaid").checked = false;
  const cr = document.getElementById("offCashReceived"); if (cr) cr.value = "";
  updateOfflineChange();
  document.getElementById("offPassengerName").value = "";
  document.getElementById("offPassengerPhone").value = "";
  document.getElementById("offSelectedSeat").textContent = "Belum ada kursi dipilih";
  document.getElementById("offPriceDisplay").textContent = "Harga akan muncul setelah kursi dipilih";
  loadOfflineSeatMap();
}

function printOfflineTicket(id) {
  const b = DB.getBookingById(id);
  if (!b) return;
  const route = DB.getRouteById(b.routeId);
  const sched = DB.getScheduleById(b.scheduleId);
  const printArea = document.getElementById("print-area");
  printArea.innerHTML = `
    <div style="max-width:350px;margin:0 auto;font-family:monospace">
      <div style="text-align:center;border-bottom:2px dashed black;padding-bottom:10px;margin-bottom:10px">
        <h2 style="font-size:14pt;margin:0">PO. BORNEO TRANS MANDIRI</h2>
        <p style="margin:4px 0;font-size:9pt">TIKET PENUMPANG</p>
      </div>
      <div style="font-size:10pt;line-height:2">
        <div>No. Tiket: <strong>${b.id}</strong></div>
        <div>Nama: <strong>${b.passengerName}</strong></div>
        <div>HP: ${b.phone}</div>
        <div>Rute: ${route?.name||b.routeId}</div>
        <div>Tgl: ${b.date} Pukul: ${sched?.departure||"—"}</div>
        <div>Naik: ${b.boardingPoint}</div>
        <div>Turun: ${b.dropoffPoint}</div>
        <div>Kursi: <strong>${b.seatNumber||"-"}</strong> (${Utils.getSeatClassName(b.seatClass)})</div>
        <div>Unit: Unit ${b.unit}</div>
        <div>Harga: <strong>${Utils.formatCurrency(b.price)}</strong></div>
        <div>Bayar: ${payMethodLabel(b)} - ${b.paymentStatus}</div>
        ${b.paymentMethod === "cash" && b.cashReceived ? `<div>Tunai: ${Utils.formatCurrency(b.cashReceived)} | Kembali: ${Utils.formatCurrency(b.cashChange || 0)}</div>` : ""}
        <div>Dilayani: ${b.admin || b.kasir}</div>
      </div>
      <div style="text-align:center;border-top:2px dashed black;margin-top:10px;padding-top:10px;font-size:8pt">
        Tunjukkan tiket ini saat boarding | Hadir 30 menit sebelum berangkat
      </div>
    </div>`;
  printArea.style.display = "block";
  window.print();
  setTimeout(() => { printArea.style.display = "none"; }, 500);
}

// ---- SCHEDULE TABLE ----
function renderScheduleTable() {
  const body = document.getElementById("scheduleTableBody");
  body.innerHTML = BTM.SCHEDULES.map(s => {
    const route = DB.getRouteById(s.routeId);
    return `<tr>
      <td>${route?.name||s.routeId}</td>
      <td>${s.departure}</td>
      <td>${s.arrival}</td>
      <td><span style="font-family:monospace;font-size:0.8rem">${s.id}</span></td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteSchedule('${s.id}')">🗑</button></td>
    </tr>`;
  }).join("");

  // Populate crew/override route selects
  document.getElementById("crewRoute").innerHTML = BTM.ROUTES.map(r => `<option value="${r.id}">${r.name}</option>`).join("");
  document.getElementById("overrideRoute").innerHTML = BTM.ROUTES.map(r => `<option value="${r.id}">${r.name}</option>`).join("");
  const cfg = document.getElementById("cfgRoute");
  if (cfg && !cfg.options.length) { cfg.innerHTML = BTM.ROUTES.map(r => `<option value="${r.id}">${r.name}</option>`).join(""); loadPriceForm(); }
  updateAdminSchedules();
}

// ---- KELOLA JADWAL & HARGA ----
function loadPriceForm() {
  const p = BTM.PRICES[document.getElementById("cfgRoute").value] || {};
  document.getElementById("cfgSolitaire").value = p.solitaire || "";
  document.getElementById("cfgRoyal").value = p.royal || "";
}
function addSchedule() {
  const routeId = document.getElementById("cfgRoute").value;
  const dep = document.getElementById("cfgDep").value, arr = document.getElementById("cfgArr").value;
  if (!routeId || !dep || !arr) { adminToast("Isi rute, jam berangkat, dan jam tiba!", "error"); return; }
  if (BTM.SCHEDULES.some(x => x.routeId === routeId && x.departure === dep)) { adminToast("Jadwal dengan jam itu sudah ada.", "warning"); return; }
  const next = Math.max(0, ...BTM.SCHEDULES.map(x => parseInt(x.id.split("-")[1]))) + 1;
  const id = "SCH-" + String(next).padStart(3, "0");
  BTM.SCHEDULES.push({ id, routeId, departure: dep, arrival: arr + (arr <= dep ? "+1" : "") });
  saveConfig();
  DB.addAuditLog(currentAdmin.username, `Menambah jadwal ${id} (${routeId} ${dep}→${arr})`, "admin");
  adminToast(`Jadwal ${id} ditambahkan.`, "success");
  renderScheduleTable();
}
function deleteSchedule(id) {
  const today = Utils.toLocalDate();
  if (DB.getBookings().some(b => b.scheduleId === id && b.date >= today && !["cancelled", "refunded"].includes(b.bookingStatus))) {
    adminToast("Jadwal masih punya tiket aktif — batalkan dulu sebelum menghapus.", "error"); return;
  }
  if (!confirm(`Hapus jadwal ${id}?`)) return;
  BTM.SCHEDULES = BTM.SCHEDULES.filter(x => x.id !== id);
  saveConfig();
  DB.addAuditLog(currentAdmin.username, `Menghapus jadwal ${id}`, "admin");
  renderScheduleTable();
}
function savePrices() {
  const routeId = document.getElementById("cfgRoute").value;
  const solitaire = parseInt(document.getElementById("cfgSolitaire").value), royal = parseInt(document.getElementById("cfgRoyal").value);
  if (!(solitaire > 0 && royal > 0)) { adminToast("Harga harus berupa angka lebih dari 0.", "error"); return; }
  BTM.PRICES[routeId] = { solitaire, sleeper: solitaire, royal, vip: royal };
  saveConfig();
  DB.addAuditLog(currentAdmin.username, `Mengubah harga ${routeId}: Solitaire ${solitaire}, Vip Royal ${royal}`, "admin");
  adminToast("Harga disimpan. Tiket yang sudah terbit tidak berubah.", "success");
}

// ---- CREW MANAGEMENT ----
function saveCrew() {
  const routeId = document.getElementById("crewRoute").value;
  const date = document.getElementById("crewDate").value;
  const unit = document.getElementById("crewUnit").value;
  const driver = document.getElementById("crewDriver").value.trim();
  const pramugari = document.getElementById("crewPramugari").value.trim();

  if (!date || !driver || !pramugari) { adminToast("Isi tanggal, sopir, dan pramugari!", "error"); return; }

  const crew = DB.getCrew();
  const key = `${routeId}_${unit}_${date}`;
  crew[key] = { driver, pramugari, routeId, unit, date };
  DB.saveCrew(crew);
  DB.addAuditLog(currentAdmin.username, `Menyimpan data kru Unit ${unit} rute ${routeId} tanggal ${date}: Sopir ${driver} / Pramugari ${pramugari}`, "admin");
  adminToast("✅ Data kru berhasil disimpan!", "success");
}

// Kru per rute/unit/tanggal. Jika belum diinput, pakai data kru dummy (1 sopir + 1 pramugari).
function getCrew(routeId, unit, date) {
  const c = DB.getCrew()[`${routeId}_${unit}_${date}`];
  if (!c) return { ...DEFAULT_CREW };
  return { driver: c.driver || c.driver1 || DEFAULT_CREW.driver, pramugari: c.pramugari || DEFAULT_CREW.pramugari };
}

// ---- UNIT 2 OVERRIDE ----
function forceUnit2(unlock) {
  const routeId = document.getElementById("overrideRoute").value;
  const scheduleId = document.getElementById("overrideSchedule").value;
  const date = document.getElementById("overrideDate").value;
  if (!routeId || !date) { adminToast("Pilih rute dan tanggal!", "error"); return; }

  DB.forceSetUnit2(routeId, scheduleId, date, unlock);
  const action = unlock ? "Membuka Unit 2" : "Mengunci Unit 2";
  DB.addAuditLog(currentAdmin.username, `${action} untuk rute ${routeId} (${scheduleId}) tanggal ${date}`, "admin");
  document.getElementById("overrideStatus").innerHTML = `<span class="badge ${unlock ? "badge-success" : "badge-danger"}">${unlock ? "🔓 Unit 2 TERBUKA" : "🔒 Unit 2 TERKUNCI"}</span> — ${Utils.formatDateTime(new Date().toISOString())}`;
  adminToast(`${unlock ? "🔓 Unit 2 berhasil dibuka!" : "🔒 Unit 2 berhasil dikunci!"}`, "success");
}

// ---- SEAT EDITOR ----
let editorRouteId, editorScheduleId, editorDate, editorUnit;
let editorSelectedA = null, editorSelectedB = null;

function loadEditorSeatMap() {
  editorRouteId = document.getElementById("editorRoute").value;
  editorScheduleId = document.getElementById("editorSchedule").value;
  editorDate = document.getElementById("editorDate").value;
  editorUnit = parseInt(document.getElementById("editorUnit").value);
  if (!editorRouteId || !editorScheduleId || !editorDate) return;

  editorSelectedA = null; editorSelectedB = null;
  renderEditorMap();
  document.getElementById("editorActionPanel").innerHTML = `<p style="color:var(--silver-400);font-size:0.875rem;text-align:center;padding:20px 0">Klik kursi di peta untuk memulai</p>`;
  document.getElementById("editorSeatInfo").textContent = "Pilih kursi untuk melihat detail";
}

function renderEditorMap() {
  const booked = DB.getBookedSeats(editorRouteId, editorScheduleId, editorDate, editorUnit);
  const selected = [editorSelectedA, editorSelectedB].filter(Boolean);
  document.getElementById("editorSeatMap").innerHTML = buildAdminBusMap(booked, selected, editorRouteId, "editor", { scheduleId: editorScheduleId, date: editorDate, unit: editorUnit });
}

function onEditorSeatClick(seatNum) {
  const booked = DB.getBookedSeats(editorRouteId, editorScheduleId, editorDate, editorUnit);
  const isBooked = booked.includes(seatNum);
  const booking = isBooked ? DB.getBookings().find(b =>
    b.seatNumber === seatNum && b.routeId === editorRouteId &&
    b.scheduleId === editorScheduleId && b.date === editorDate &&
    b.unit === editorUnit && !["cancelled", "refunded"].includes(b.bookingStatus)
  ) : null;

  // Show seat info
  if (booking) {
    document.getElementById("editorSeatInfo").innerHTML = `
      <div style="display:flex;flex-direction:column;gap:6px;font-size:0.85rem">
        <div><strong>Kursi:</strong> ${seatNum} (${Utils.getSeatClassName(booking.seatClass)})</div>
        <div><strong>Penumpang:</strong> ${booking.passengerName}</div>
        <div><strong>No. HP:</strong> ${booking.phone}</div>
        <div><strong>Tiket:</strong> <span style="font-family:monospace">${booking.id}</span></div>
        <div><strong>Harga:</strong> ${Utils.formatCurrency(booking.price)}</div>
      </div>`;
  } else {
    document.getElementById("editorSeatInfo").innerHTML = `<div style="font-size:0.875rem">Kursi <strong>${seatNum}</strong> — <span class="badge badge-success">Kosong</span></div>`;
  }

  // Handle selection logic
  if (!editorSelectedA) {
    editorSelectedA = seatNum;
    renderEditorMap();
    updateEditorPanel();
  } else if (editorSelectedA === seatNum) {
    editorSelectedA = null;
    renderEditorMap();
    updateEditorPanel();
  } else if (!editorSelectedB) {
    editorSelectedB = seatNum;
    renderEditorMap();
    updateEditorPanel();
  } else {
    editorSelectedA = seatNum;
    editorSelectedB = null;
    renderEditorMap();
    updateEditorPanel();
  }
}

function updateEditorPanel() {
  const panel = document.getElementById("editorActionPanel");
  const booked = DB.getBookedSeats(editorRouteId, editorScheduleId, editorDate, editorUnit);
  const isABooked = booked.includes(editorSelectedA);
  const isBBooked = editorSelectedB ? booked.includes(editorSelectedB) : false;

  if (!editorSelectedA) {
    panel.innerHTML = `<p style="color:var(--silver-400);font-size:0.875rem;text-align:center;padding:20px 0">Klik kursi di peta untuk memulai</p>`;
    return;
  }

  const bookingA = isABooked ? DB.getBookings().find(b => b.seatNumber === editorSelectedA && b.routeId === editorRouteId && b.scheduleId === editorScheduleId && b.date === editorDate && b.unit === editorUnit && !["cancelled", "refunded"].includes(b.bookingStatus)) : null;

  if (editorSelectedA && !editorSelectedB) {
    if (isABooked && bookingA) {
      panel.innerHTML = `
        <div style="font-size:0.875rem;margin-bottom:12px">
          <strong>Dipilih:</strong> Kursi ${editorSelectedA} — ${bookingA.passengerName}
        </div>
        <p style="font-size:0.8rem;color:var(--silver-500)">Pilih kursi tujuan untuk memindahkan, atau pilih kursi berisi lain untuk menukar posisi.</p>`;
    } else {
      panel.innerHTML = `<div style="font-size:0.875rem"><strong>Dipilih:</strong> Kursi ${editorSelectedA} (Kosong) — Pilih kursi berisi untuk dipindahkan ke sini.</div>`;
    }
    return;
  }

  if (editorSelectedA && editorSelectedB) {
    const bookingB = isBBooked ? DB.getBookings().find(b => b.seatNumber === editorSelectedB && b.routeId === editorRouteId && b.scheduleId === editorScheduleId && b.date === editorDate && b.unit === editorUnit && !["cancelled", "refunded"].includes(b.bookingStatus)) : null;

    if (isABooked && !isBBooked) {
      // Move A to B
      showReassignModal(bookingA, editorSelectedA, editorSelectedB, "move");
    } else if (!isABooked && isBBooked) {
      // Move B to A
      showReassignModal(bookingB, editorSelectedB, editorSelectedA, "move");
    } else if (isABooked && isBBooked && bookingA && bookingB) {
      // Swap
      showReassignModal(bookingA, editorSelectedA, editorSelectedB, "swap", bookingB);
    } else {
      panel.innerHTML = `<p style="color:var(--silver-400);font-size:0.875rem">Pilih minimal 1 kursi terisi dan 1 kursi tujuan.</p>`;
    }
  }
}

function showReassignModal(bookingA, fromSeat, toSeat, type, bookingB = null) {
  const priceFrom = DB.getPriceByRouteAndClass(editorRouteId, Utils.getSeatClass(fromSeat));
  const priceTo = DB.getPriceByRouteAndClass(editorRouteId, Utils.getSeatClass(toSeat));
  const diff = priceTo - priceFrom;

  let html = "";
  if (type === "move") {
    html = `
      <div style="font-size:0.875rem;display:flex;flex-direction:column;gap:10px">
        <div class="flex gap-2" style="justify-content:space-between;padding:12px;background:var(--silver-50);border-radius:var(--radius-md)">
          <div><div style="font-weight:700">${bookingA.passengerName}</div><div style="color:var(--silver-500)">Kursi ${fromSeat} → Kursi ${toSeat}</div></div>
          <div style="text-align:right"><div>${Utils.getSeatClass(fromSeat)} → ${Utils.getSeatClass(toSeat)}</div></div>
        </div>
        ${diff !== 0 ? `<div style="padding:10px;background:${diff>0?"#D1FAE5":"#FEE2E2"};border-radius:var(--radius-md)">
          ${diff>0 ? "⬆️ Naik kelas" : "⬇️ Turun kelas"}: Selisih harga <strong>${Utils.formatCurrency(Math.abs(diff))}</strong> ${diff>0?"(ditambahkan)":"(dikembalikan)"}
        </div>` : "<div style='color:var(--silver-500)'>Tidak ada selisih harga (kelas sama)</div>"}
      </div>`;
    document.getElementById("confirmReassignBtn").onclick = () => executeReassign(bookingA.id, fromSeat, toSeat, "move");
  } else {
    html = `
      <div style="font-size:0.875rem;display:flex;flex-direction:column;gap:10px">
        <div style="padding:12px;background:var(--silver-50);border-radius:var(--radius-md)">
          Tukar kursi:<br/>
          <strong>${bookingA.passengerName}</strong> (${fromSeat}) ↔ <strong>${bookingB.passengerName}</strong> (${toSeat})
        </div>
        ${Utils.getSeatClass(fromSeat) !== Utils.getSeatClass(toSeat) ? `<div style="padding:10px;background:#FEF3C7;border-radius:var(--radius-md)">
          ⚠️ Kelas berbeda! Penyesuaian harga mungkin diperlukan.
        </div>` : ""}
      </div>`;
    document.getElementById("confirmReassignBtn").onclick = () => executeReassign(bookingA.id, fromSeat, toSeat, "swap", bookingB?.id, toSeat, fromSeat);
  }

  document.getElementById("reassignBody").innerHTML = html;
  document.getElementById("reassignModal").classList.add("open");
}

function executeReassign(bookingIdA, fromSeat, toSeat, type, bookingIdB, toSeatB, fromSeatB) {
  if (type === "move") {
    DB.updateBooking(bookingIdA, { seatNumber: toSeat, seatClass: Utils.getSeatClass(toSeat), price: DB.getPriceByRouteAndClass(editorRouteId, Utils.getSeatClass(toSeat)) });
    const b = DB.getBookingById(bookingIdA);
    DB.addAuditLog(currentAdmin.username, `Memindahkan kursi ${b.passengerName} dari ${fromSeat} ke ${toSeat} (${editorRouteId} ${editorDate})`, "admin");
    adminToast(`✅ ${b.passengerName} berhasil dipindahkan ke kursi ${toSeat}`, "success");
  } else {
    const bA = DB.getBookingById(bookingIdA);
    const bB = DB.getBookingById(bookingIdB);
    DB.updateBooking(bookingIdA, { seatNumber: toSeat, seatClass: Utils.getSeatClass(toSeat) });
    DB.updateBooking(bookingIdB, { seatNumber: fromSeatB, seatClass: Utils.getSeatClass(fromSeatB) });
    DB.addAuditLog(currentAdmin.username, `Menukar kursi: ${bA.passengerName} (${fromSeat}↔${toSeat}) dan ${bB.passengerName} (${toSeatB||toSeat}↔${fromSeatB})`, "admin");
    adminToast("✅ Posisi kursi berhasil ditukar!", "success");
  }

  closeAdminModal("reassignModal");
  editorSelectedA = null; editorSelectedB = null;
  loadEditorSeatMap();
}

// ---- REFUND MANAGEMENT ----
function searchRefundTicket() {
  const query = document.getElementById("refundSearch").value.trim().toUpperCase();
  if (!query) { adminToast("Masukkan kode booking atau nama penumpang!", "error"); return; }

  const bookings = DB.getBookings().filter(b =>
    b.id.includes(query) || b.passengerName.toUpperCase().includes(query)
  );

  const el = document.getElementById("refundResult");
  if (bookings.length === 0) {
    el.innerHTML = `<div class="card" style="padding:20px;text-align:center;color:var(--silver-400)">Tiket tidak ditemukan</div>`;
    return;
  }

  el.innerHTML = bookings.map(b => {
    const route = DB.getRouteById(b.routeId);
    return `
    <div class="refund-card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
        <div style="font-size:0.875rem">
          <div style="font-weight:700;font-size:1rem">${b.passengerName} <span style="font-family:monospace;font-size:0.8rem;color:var(--silver-400)">${b.id}</span></div>
          <div>${route?.name} | ${b.date} | Kursi ${b.seatNumber} | ${Utils.formatCurrency(b.price)}</div>
          <div style="margin-top:4px">
            Status: <span class="badge ${Utils.statusBadgeClass(b.bookingStatus)}">${Utils.statusLabel(b.bookingStatus)}</span>
            Bayar: <span class="badge ${Utils.statusBadgeClass(b.paymentStatus)}">${Utils.statusLabel(b.paymentStatus)}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          ${b.bookingStatus !== "cancelled" && b.bookingStatus !== "refunded" ? `<button class="btn btn-danger btn-sm" onclick="processRefund('${b.id}')">💰 Proses Pengembalian</button>` : `<span class="badge badge-secondary">Sudah diproses</span>`}
        </div>
      </div>
    </div>`;
  }).join("");
}

function processRefund(id) {
  const b = DB.getBookingById(id);
  if (!b) return;
  if (b.paymentStatus !== "paid") {
    if (!confirm("Tiket ini belum dibayar. Batalkan saja tanpa pengembalian uang?")) return;
    DB.updateBooking(id, { bookingStatus: "cancelled", paymentStatus: "cancelled" });
    DB.addAuditLog(currentAdmin.username, `Membatalkan tiket belum bayar ${id} (${b.passengerName})`, "refund");
    adminToast("Tiket dibatalkan, kursi tersedia kembali.", "info");
    document.getElementById("refundResult").innerHTML = "";
    renderRefundHistory();
    return;
  }
  const route = DB.getRouteById(b.routeId);

  let adminFee = 0.1;
  const depDate = new Date(b.date + "T" + DB.getScheduleById(b.scheduleId)?.departure?.replace(":",":") || "00:00");
  const hoursLeft = (depDate - Date.now()) / 3600000;
  if (hoursLeft < 2) adminFee = 1.0;
  else if (hoursLeft < 24) adminFee = 0.5;

  const refundAmount = Math.round(b.price * (1 - adminFee));

  document.getElementById("refundConfirmBody").innerHTML = `
    <div style="font-size:0.875rem;display:flex;flex-direction:column;gap:10px">
      <div style="padding:14px;background:var(--silver-50);border-radius:var(--radius-md)">
        <div><strong>Tiket:</strong> ${b.id}</div>
        <div><strong>Penumpang:</strong> ${b.passengerName}</div>
        <div><strong>Rute:</strong> ${route?.name}</div>
        <div><strong>Kursi:</strong> ${b.seatNumber}</div>
        <div><strong>Harga Tiket:</strong> ${Utils.formatCurrency(b.price)}</div>
      </div>
      <div style="padding:14px;background:#FEF3C7;border-radius:var(--radius-md)">
        <div><strong>Biaya Admin (${Math.round(adminFee*100)}%):</strong> ${Utils.formatCurrency(b.price * adminFee)}</div>
        <div><strong style="color:var(--success)">Pengembalian ke penumpang: ${Utils.formatCurrency(refundAmount)}</strong></div>
      </div>
      <div class="form-group">
        <label class="form-label">Nominal Pengembalian (dapat diubah)</label>
        <input type="number" class="form-input" id="customRefundAmount" value="${refundAmount}" />
      </div>
    </div>`;

  document.getElementById("confirmRefundBtn").onclick = () => confirmRefundProcess(id, b);
  document.getElementById("refundConfirmModal").classList.add("open");
}

function confirmRefundProcess(id, b) {
  const refundAmt = parseFloat(document.getElementById("customRefundAmount").value);
  if (!(refundAmt >= 0 && refundAmt <= b.price)) { adminToast("Nominal pengembalian harus antara 0 dan harga tiket.", "error"); return; }
  DB.updateBooking(id, { bookingStatus: "refunded", paymentStatus: "refunded", refundAmount: refundAmt });
  DB.addAuditLog(currentAdmin.username, `Memproses pengembalian uang tiket ${id} (${b.passengerName}, kursi ${b.seatNumber}) — Nominal: ${Utils.formatCurrency(refundAmt)}`, "refund");
  adminToast(`✅ Pengembalian ${Utils.formatCurrency(refundAmt)} berhasil diproses! Kursi ${b.seatNumber} kini tersedia.`, "success");
  closeAdminModal("refundConfirmModal");
  searchRefundTicket();
  renderRefundHistory();
}

function renderRefundHistory() {
  const bookings = DB.getBookings().filter(b => b.bookingStatus === "cancelled" || b.bookingStatus === "refunded");
  const body = document.getElementById("refundHistoryBody");
  if (bookings.length === 0) {
    body.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--silver-400);padding:30px">Belum ada riwayat pengembalian</td></tr>`;
    return;
  }
  const route = (id) => DB.getRouteById(id)?.name || id;
  body.innerHTML = bookings.map(b => `<tr>
    <td><span style="font-family:monospace;font-size:0.78rem">${b.id}</span></td>
    <td>${b.passengerName}</td>
    <td>${route(b.routeId)}</td>
    <td>${b.seatNumber}</td>
    <td>${Utils.formatCurrency(b.price)}</td>
    <td><span class="badge ${Utils.statusBadgeClass(b.bookingStatus)}">${Utils.statusLabel(b.bookingStatus)}</span></td>
    <td>${b.refundAmount ? Utils.formatCurrency(b.refundAmount) : "—"}</td>
  </tr>`).join("");
}

// ---- SURAT JALAN ----
function generateSuratJalan() {
  const routeId = document.getElementById("sjRoute").value;
  const scheduleId = document.getElementById("sjSchedule").value;
  const date = document.getElementById("sjDate").value;
  const unit = parseInt(document.getElementById("sjUnit").value);
  if (!routeId || !date) { adminToast("Pilih rute dan tanggal!", "error"); return; }

  const route = DB.getRouteById(routeId);
  const sched = DB.getScheduleById(scheduleId);
  const crew = getCrew(routeId, unit, date);
  const bookings = DB.getBookings().filter(b =>
    b.routeId === routeId && b.scheduleId === scheduleId &&
    b.date === date && b.unit === unit && b.bookingStatus !== "cancelled" && b.bookingStatus !== "refunded"
  );

  const totalRev = bookings.filter(b => b.paymentStatus === "paid").reduce((a,b) => a+b.price, 0);

  // Build seat grid for print
  const allSeats = BTM.SEATS.all;
  const seatGrid = allSeats.map(s => {
    const b = bookings.find(bk => bk.seatNumber === s);
    const cls = Utils.getSeatClass(s);
    return `<div class="print-seat ${cls==="solitaire"?"sleeper-print":""}">
      <div class="print-seat-num">${s}</div>
      <div style="font-size:8px;color:#666">${Utils.getSeatClassName(cls)}</div>
      <div class="print-seat-name ${b?"":"print-seat-empty"}">${b ? b.passengerName : "— KOSONG —"}</div>
    </div>`;
  });

  const preview = document.getElementById("suratJalanPreview");
  preview.innerHTML = `
    <div class="card">
      <div class="card-header" style="display:flex;justify-content:space-between">
        <h3 style="font-size:1rem;font-weight:700">📄 Pratinjau Surat Jalan — Unit ${unit}</h3>
        <button class="btn btn-primary btn-sm" onclick="printSuratJalan('${routeId}','${scheduleId}','${date}',${unit})">🖨️ Cetak Surat Jalan</button>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;font-size:0.875rem">
          <div><strong>Rute:</strong> ${route?.name}</div>
          <div><strong>Tanggal:</strong> ${Utils.formatDate(date)}</div>
          <div><strong>Berangkat:</strong> ${sched?.departure}</div>
          <div><strong>Unit Bus:</strong> Unit ${unit}</div>
          <div><strong>Sopir:</strong> ${crew.driver}</div>
          <div><strong>Pramugari:</strong> ${crew.pramugari}</div>
          <div><strong>Total Penumpang:</strong> ${bookings.length} / 17</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
          ${seatGrid.join("")}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
          <div class="facility-box minibar-box" style="padding:12px;text-align:center">🧳 BAGASI</div>
          <div class="facility-box toilet-box" style="padding:12px;text-align:center">🚽 TOILET</div>
        </div>
        <div style="padding:16px;background:var(--silver-50);border-radius:var(--radius-md);margin-bottom:16px">
          <strong>💵 Rekap Keuangan:</strong><br/>
          Total Pendapatan (Lunas): <strong>${Utils.formatCurrency(totalRev)}</strong><br/>
          Belum bayar: ${bookings.filter(b=>b.paymentStatus==="pending").length} tiket
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center">
          <div style="padding:16px;border:1px solid var(--silver-300);border-radius:var(--radius-md)"><div style="font-size:0.75rem;color:var(--silver-400);margin-bottom:24px">Pengawas / Supervisor</div><div style="border-top:1px solid black;padding-top:4px;font-size:0.8rem">Tanda Tangan</div></div>
          <div style="padding:16px;border:1px solid var(--silver-300);border-radius:var(--radius-md)"><div style="font-size:0.75rem;color:var(--silver-400);margin-bottom:24px">Sopir</div><div style="border-top:1px solid black;padding-top:4px;font-size:0.8rem">${crew.driver}</div></div>
          <div style="padding:16px;border:1px solid var(--silver-300);border-radius:var(--radius-md)"><div style="font-size:0.75rem;color:var(--silver-400);margin-bottom:24px">Pramugari</div><div style="border-top:1px solid black;padding-top:4px;font-size:0.8rem">${crew.pramugari}</div></div>
        </div>
      </div>
    </div>`;
}

function printSuratJalan(routeId, scheduleId, date, unit) {
  const route = DB.getRouteById(routeId);
  const sched = DB.getScheduleById(scheduleId);
  const crew = getCrew(routeId, unit, date);
  const bookings = DB.getBookings().filter(b =>
    b.routeId === routeId && b.scheduleId === scheduleId &&
    b.date === date && b.unit === unit && b.bookingStatus !== "cancelled" && b.bookingStatus !== "refunded"
  );

  const totalRev = bookings.filter(b => b.paymentStatus === "paid").reduce((a,b) => a+b.price, 0);
  const allSeats = BTM.SEATS.all;

  const printArea = document.getElementById("print-area");
  printArea.innerHTML = `
    <div class="print-header">
      <h1 style="font-size:14pt;margin:0">PO. BORNEO TRANS MANDIRI</h1>
      <h2 style="font-size:11pt;font-weight:normal;margin:4px 0">SURAT JALAN BUS</h2>
      <div style="font-size:9pt">
        Rute: ${route?.name} | Tgl: ${date} | Pukul: ${sched?.departure} | Unit: ${unit}
      </div>
      <div style="font-size:9pt">
        Sopir: ${crew.driver} | Pramugari: ${crew.pramugari}
      </div>
    </div>

    <h3 style="font-size:10pt;margin:10px 0 6px">DENAH KURSI BUS (${bookings.length}/17 TERISI)</h3>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
      ${allSeats.map(s => {
        const b = bookings.find(bk => bk.seatNumber === s);
        return `<div class="print-seat ${Utils.getSeatClass(s)==="solitaire"?"sleeper-print":""}">
          <div class="print-seat-num">${s}</div>
          <div style="font-size:7px">${Utils.getSeatClassName(Utils.getSeatClass(s))}</div>
          <div class="print-seat-name ${b?"":"print-seat-empty"}">${b ? b.passengerName : "KOSONG"}</div>
        </div>`;
      }).join("")}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px">
      <div class="print-facility">🧳 BAGASI</div>
      <div class="print-facility">🚽 TOILET</div>
    </div>

    <h3 style="font-size:10pt;margin:10px 0 6px">MANIFEST PENUMPANG</h3>
    <table class="print-manifest">
      <thead><tr><th>No</th><th>No. Tiket</th><th>Nama</th><th>No. HP</th><th>Naik</th><th>Turun</th><th>Kursi</th><th>Kelas</th><th>Status</th></tr></thead>
      <tbody>
        ${bookings.map((b,i)=>`<tr>
          <td>${i+1}</td><td>${b.id}</td><td>${b.passengerName}</td><td>${b.phone}</td>
          <td>${b.boardingPoint||"—"}</td><td>${b.dropoffPoint||"—"}</td>
          <td>${b.seatNumber}</td><td>${b.seatClass}</td><td>${b.paymentStatus}</td>
        </tr>`).join("")}
      </tbody>
    </table>

    <div style="margin-top:12px;font-size:9pt">
      <strong>Total Penumpang: ${bookings.length} | Total Pendapatan (Lunas): ${Utils.formatCurrency(totalRev)}</strong>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:20px;text-align:center">
      <div style="border:1px solid black;padding:12px"><div style="margin-bottom:30px;font-size:9pt">Pengawas / Supervisor</div><div style="border-top:1px solid black;padding-top:4px;font-size:9pt">Tanda Tangan</div></div>
      <div style="border:1px solid black;padding:12px"><div style="margin-bottom:30px;font-size:9pt">Sopir</div><div style="border-top:1px solid black;padding-top:4px;font-size:9pt">${crew.driver}</div></div>
      <div style="border:1px solid black;padding:12px"><div style="margin-bottom:30px;font-size:9pt">Pramugari</div><div style="border-top:1px solid black;padding-top:4px;font-size:9pt">${crew.pramugari}</div></div>
    </div>`;

  printArea.style.display = "block";
  DB.addAuditLog(currentAdmin.username, `Mencetak Surat Jalan Unit ${unit} rute ${routeId} tanggal ${date}`, "admin");
  window.print();
  setTimeout(() => { printArea.style.display = "none"; }, 500);
}

// ---- KEUANGAN ----
function renderKeuangan() {
  const bookings = DB.getBookings();
  const paid = bookings.filter(b => b.paymentStatus === "paid");
  const totalRev = paid.reduce((a,b) => a+b.price, 0);
  const refundedList = bookings.filter(b => b.bookingStatus === "refunded");
  const refunded = refundedList.reduce((a,b) => a+(b.refundAmount||0), 0);
  const feeIncome = refundedList.reduce((a,b) => a + Math.max(0, b.price - (b.refundAmount||0)), 0);
  const net = totalRev + feeIncome; // lunas aktif + biaya admin refund yang ditahan

  const now = new Date();
  const thisMonth = paid.filter(b => b.bookedAt && Utils.toLocalDate(b.bookedAt).startsWith(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`));
  const monthRev = thisMonth.reduce((a,b) => a+b.price, 0);

  document.getElementById("financeStatsGrid").innerHTML = `
    <div class="stat-card" style="color:var(--success)">
      <div class="stat-icon success">💰</div>
      <div class="stat-value" style="font-size:1.1rem">${Utils.formatCurrency(totalRev)}</div>
      <div class="stat-label">Total Pendapatan Kotor</div>
    </div>
    <div class="stat-card" style="color:var(--magenta-500)">
      <div class="stat-icon magenta">📅</div>
      <div class="stat-value" style="font-size:1.1rem">${Utils.formatCurrency(monthRev)}</div>
      <div class="stat-label">Pendapatan Bulan Ini</div>
    </div>
    <div class="stat-card" style="color:var(--danger)">
      <div class="stat-icon" style="background:#FEE2E2">💸</div>
      <div class="stat-value" style="font-size:1.1rem">${Utils.formatCurrency(refunded)}</div>
      <div class="stat-label">Total Pengembalian</div>
    </div>
    <div class="stat-card" style="color:var(--gold-500)">
      <div class="stat-icon gold">💵</div>
      <div class="stat-value" style="font-size:1.1rem">${Utils.formatCurrency(net)}</div>
      <div class="stat-label">Pendapatan Bersih</div>
    </div>`;

  const bankRows = vaBankRevenue(paid).filter(r => r.count > 0 || VA_BANK_LIST.includes(r.label) || r.label === CASH_LABEL);
  const maxBank = Math.max(...bankRows.map(r => r.rev), 1);
  document.getElementById("financeByMethod").innerHTML = `<div class="bar-chart-wrap">` +
    bankRows.map(r => `<div class="bar-row"><div class="bar-label">${r.text}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.round(r.rev / maxBank * 100)}%"></div></div>
        <div class="bar-val">${Utils.formatCurrency(r.rev)}</div></div>`).join("") + `</div>`;

  const agents = ["Online","Loket"];
  const inAgent = (b, a) => a === "Online" ? b.kasir === "Online" : b.kasir !== "Online";
  const maxAgent = Math.max(...agents.map(a => paid.filter(b=>inAgent(b,a)).reduce((x,b)=>x+b.price,0)), 1);
  document.getElementById("financeByAgent").innerHTML = `<div class="bar-chart-wrap">` +
    agents.map(a => {
      const rev = paid.filter(b=>inAgent(b,a)).reduce((x,b)=>x+b.price,0);
      const short = a === "Online" ? "Online" : "Loket (Admin)";
      return `<div class="bar-row"><div class="bar-label" style="font-size:0.75rem">${short}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.round(rev/maxAgent*100)}%"></div></div>
        <div class="bar-val">${Utils.formatCurrency(rev)}</div></div>`;
    }).join("") + `</div>`;
}

// ---- AUDIT LOG ----
function renderAuditLog() {
  const logs = DB.getAuditLog();
  const el = document.getElementById("auditLogList");
  if (logs.length === 0) {
    el.innerHTML = `<p style="text-align:center;color:var(--silver-400);padding:30px">Belum ada riwayat aktivitas</p>`;
    return;
  }
  el.innerHTML = logs.map(l => `
    <div class="audit-item">
      <div class="audit-dot audit-${l.type||"info"}"></div>
      <div class="audit-info">
        <div class="audit-action">${Utils.esc(l.action)}</div>
        <div class="audit-meta">👤 ${Utils.esc(l.user)} &nbsp;|&nbsp; 🕐 ${Utils.formatDateTime(l.timestamp)}</div>
      </div>
    </div>
  `).join("");
}

// ---- MODAL HELPERS ----
function closeAdminModal(id) {
  document.getElementById(id).classList.remove("open");
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("open");
  }
});

// ---- TOAST ----
function adminToast(message, type = "info") {
  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  const container = document.getElementById("adminToastContainer");
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
  }, 4500);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") document.querySelectorAll(".modal-overlay.open").forEach(m => m.classList.remove("open"));
});
