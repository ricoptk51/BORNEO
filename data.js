// ============================================================
// PO. BORNEO TRANS MANDIRI - CENTRAL DATA STORE (data.js)
// ============================================================

const BTM = {
  // ---- APP CONSTANTS ----
  COMPANY: {
    name: "PT. Borneo Trans Mandiri",
    brandName: "PO. BORNEO TRANS",
    shortName: "BTM",
    tagline: "Aman • Nyaman • Tepat Waktu",
    subTagline: "Bus Listrik Antar Kota — Pontianak ↔ Sintang",
    headlineKemudahan: "Hubungi & Pesan Tiket",
    subKemudahan: "Chat kami di WhatsApp atau datang ke kantor terdekat. Kami siap membantu setiap hari.",
    phone: "0823-9539-2233",
    whatsapp: "6282395392233",
    phonePontianak: "0823-9539-2233",
    whatsappPontianak: "6282395392233",
    phoneSintang: "0823-9539-2229",
    whatsappSintang: "6282395392229",
    email: "info@borneotrans.co.id",
    instagram: "@borneo_trans_kalbar",
    instagramSintang: "@borneotrans.stg",
    tiktok: "@borneo_trans_kalbar",
    tiktokSintang: "@borneotrans.stg",
    addressPontianak: "Jl. Sungai Raya Ruko 1-5 Depan RS Sudarso Samping Terminal Sudarso, Kubu Raya",
    addressSintang: "Jl. PKP Mujahidin (Sebelum Tugu BI Samping Kopi Aceh)",
    address: "Jl. Sungai Raya Ruko 1-5 Depan RS Sudarso Samping Terminal Sudarso, Kubu Raya, Kalimantan Barat",
  },
  ROUTES: [
    { id: "PNK-STG", name: "Pontianak → Sintang", from: "Pontianak", to: "Sintang", duration: "10 Jam", distance: "400 km" },
    { id: "STG-PNK", name: "Sintang → Pontianak", from: "Sintang", to: "Pontianak", duration: "10 Jam", distance: "400 km" },
  ],
  SCHEDULES: [
    { id: "SCH-001", routeId: "PNK-STG", departure: "08:00", arrival: "18:00" },
    { id: "SCH-002", routeId: "PNK-STG", departure: "20:00", arrival: "06:00+1" },
    { id: "SCH-003", routeId: "STG-PNK", departure: "08:00", arrival: "18:00" },
    { id: "SCH-004", routeId: "STG-PNK", departure: "20:00", arrival: "06:00+1" },
  ],
  BOARDING_POINTS: {
    "PNK": [
      "Kantor Pemasaran Pontianak (Jl. Sungai Raya Ruko 1-5 Depan RS Sudarso / Samping Terminal Sudarso)",
      "Terminal ALBN Sei Ambawang (Pontianak)"
    ],
    "STG": [
      "Kantor Pemasaran Sintang (Jl. PKP Mujahidin Sebelum Tugu BI Samping Kopi Aceh)",
      "Terminal Sungai Durian (Sintang)"
    ],
  },
  DROPOFF_POINTS: {
    "PNK": [
      "Kantor Pemasaran Pontianak (Jl. Sungai Raya Ruko 1-5 Depan RS Sudarso / Samping Terminal Sudarso)",
      "Terminal ALBN Sei Ambawang (Pontianak)"
    ],
    "STG": [
      "Kantor Pemasaran Sintang (Jl. PKP Mujahidin Sebelum Tugu BI Samping Kopi Aceh)",
      "Terminal Sungai Durian (Sintang)"
    ],
  },
  PRICES: {
    "PNK-STG": { solitaire: 350000, sleeper: 350000, royal: 200000, vip: 200000 },
    "STG-PNK": { solitaire: 350000, sleeper: 350000, royal: 200000, vip: 200000 },
  },
  SEATS: {
    solitaire: ["A1", "A2"],
    sleeper: ["A1", "A2"], // alias
    royal: ["B1", "B2", "B3", "C1", "C2", "C3", "D1", "D2", "D3", "E1", "E2", "E3", "F1", "F2", "F3"],
    vip: ["B1", "B2", "B3", "C1", "C2", "C3", "D1", "D2", "D3", "E1", "E2", "E3", "F1", "F2", "F3"], // alias
    all: ["A1", "A2", "B1", "B2", "B3", "C1", "C2", "C3", "D1", "D2", "D3", "E1", "E2", "E3", "F1", "F2", "F3"]
  },
  CLASSES: {
    solitaire: {
      id: "solitaire",
      name: "Solitaire Business Class",
      shortName: "Solitaire",
      badge: "👑 Solitaire Business Class",
      tag: "Kabin Sleeper (bisa rebah)",
      price: 350000,
      seats: ["A1", "A2"],
      capacity: 2,
      features: [
        "Kursi bisa rebah rata",
        "Layar hiburan pribadi",
        "Selimut & bantal empuk",
        "Tirai penutup untuk privasi",
        "Interior kulit & kayu"
      ]
    },
    royal: {
      id: "royal",
      name: "Vip Royal Class",
      shortName: "Vip Royal",
      badge: "👑 Vip Royal Class",
      tag: "Kursi Eksekutif",
      price: 200000,
      seats: ["B1", "B2", "B3", "C1", "C2", "C3", "D1", "D2", "D3", "E1", "E2", "E3", "F1", "F2", "F3"],
      capacity: 15,
      features: [
        "Kursi kulit bisa direbahkan",
        "Sandaran kaki (leg rest)",
        "Layar hiburan tiap kursi",
        "Bantal & selimut",
        "Pilih kursi sendiri atau berdua"
      ]
    }
  },
  USERS: [
    { id: "USR-001", username: "superadmin", password: "admin123", role: "superadmin", name: "Admin BTM", branch: "Kantor Pusat Pontianak" },
  ],
  GALLERY: [
    { src: "assets/images/armada-depan-perak.jpeg", cat: "armada", title: "Bus dari depan", desc: "Bus listrik Borneo Trans warna perak dengan aksen kuning." },
    { src: "assets/images/armada-depan-hitam.jpeg", cat: "armada", title: "Pintu penumpang", desc: "Kaca depan bertuliskan Bus Listrik, pintu penumpang di sisi kiri." },
    { src: "assets/images/armada-belakang-samping-1.jpeg", cat: "armada", title: "Bagian belakang kiri", desc: "Logo Zero Emission dan tulisan The First in Borneo Island." },
    { src: "assets/images/armada-belakang-samping-2.jpeg", cat: "armada", title: "Bagian belakang kanan", desc: "Livery hitam, perak, dan kuning di sisi kanan bus." },
    { src: "assets/images/armada-belakang.jpeg", cat: "armada", title: "Belakang bus", desc: "Bus listrik Borneo Trans, bus antar kota pertama di Kalimantan." },
    { src: "assets/images/interior-solitaire.jpeg", cat: "interior", title: "Kabin Solitaire Business Class", desc: "Kabin privat dengan kursi rebah, bantal, dan selimut." },
    { src: "assets/images/interior-royal-seat.jpeg", cat: "interior", title: "Kursi Vip Royal Class", desc: "Kursi kulit dengan sandaran kaki, tempat gelas, bantal, dan selimut." },
    { src: "assets/images/interior-kursi-royal.jpeg", cat: "interior", title: "Deretan kursi Vip Royal", desc: "Kursi kulit berlapis dengan bantal leher dan tirai jendela." },
    { src: "assets/images/interior-kabin-royal.jpeg", cat: "interior", title: "Kabin Vip Royal Class", desc: "Layar hiburan pribadi di sandaran setiap kursi." },
    { src: "assets/images/interior-layar-hiburan.jpeg", cat: "interior", title: "Layar hiburan", desc: "Layar sentuh di belakang kursi dengan menu hiburan." },
  ],
  TESTIMONIALS: [
    { id: 1, name: "Budi Santoso", city: "Pontianak", rating: 5, text: "Busnya nyaman dan tidak berisik, jadi bisa tidur selama perjalanan. Kursi Solitaire bisa rebah rata, sampai Sintang tidak terasa capek.", avatar: "BS" },
    { id: 2, name: "Siti Rahayu", city: "Sintang", rating: 5, text: "AC-nya sejuk dan kursinya empuk, leg rest-nya enak. Kru bus ramah, jadi perjalanan jadi menyenangkan.", avatar: "SR" },
    { id: 3, name: "Ahmad Fauzi", city: "Pontianak", rating: 5, text: "Bayar lewat Virtual Account gampang dan cepat. Begitu bayar, saya langsung bisa pilih kursi sendiri. Mantap.", avatar: "AF" },
    { id: 4, name: "Dewi Lestari", city: "Sintang", rating: 5, text: "Perjalanan 10 jam dari Pontianak ke Sintang tidak terasa capek. Busnya nyaman, kru ramah, dan tepat waktu.", avatar: "DL" },
    { id: 5, name: "Rizky Pratama", city: "Kubu Raya", rating: 5, text: "Bus listriknya sejuk dan tenang, berangkat dan sampai sesuai jadwal. Harga pas, pelayanannya bagus. Sukses selalu Borneo Trans!", avatar: "RP" },
  ],
  FAQS: [
    {
      q: "Apa bedanya Solitaire dan Vip Royal?",
      a: "Solitaire hanya 2 kursi di baris depan, bisa rebah rata seperti tempat tidur (A1 & A2). Vip Royal 15 kursi di baris B sampai F, kursi kulit yang bisa direbahkan, tersedia kursi tunggal dan berdua."
    },
    {
      q: "Bagaimana cara memesan tiket?",
      a: "Cari jadwal, isi nama dan nomor HP, bayar lewat Virtual Account, lalu pilih kursi. Tiket (e-tiket) langsung terbit dan bisa disimpan di HP."
    },
    {
      q: "Metode pembayaran apa saja yang diterima?",
      a: "Hanya Virtual Account: BCA, Mandiri, BRI, BNI, dan Permata."
    },
    {
      q: "Jam berapa saya harus hadir?",
      a: "Hadir di titik naik paling lambat 30 menit sebelum bus berangkat."
    },
    {
      q: "Berapa bagasi yang boleh dibawa?",
      a: "Maksimal 20 kg per penumpang, gratis, disimpan di bagasi bus."
    },
    {
      q: "Kalau ada masalah, hubungi siapa?",
      a: "Hubungi WhatsApp Pontianak 0823-9539-2233 atau Sintang 0823-9539-2229, atau datang ke kantor kami."
    },
  ],
};

// Kode kota untuk lookup titik naik/turun (BOARDING_POINTS & DROPOFF_POINTS memakai kode)
const CITY_CODES = { Pontianak: "PNK", Sintang: "STG" };
BTM.ROUTES.forEach(r => { r.fromCode = CITY_CODES[r.from]; r.toCode = CITY_CODES[r.to]; });

// Jadwal & harga yang diubah admin disimpan di localStorage
(function applyConfig() {
  try {
    const cfg = JSON.parse(localStorage.getItem("btm_config") || "{}");
    if (cfg.schedules) BTM.SCHEDULES = cfg.schedules;
    if (cfg.prices) Object.assign(BTM.PRICES, cfg.prices);
  } catch (e) { }
})();
function saveConfig() { localStorage.setItem("btm_config", JSON.stringify({ schedules: BTM.SCHEDULES, prices: BTM.PRICES })); }

// ---- LOCALSTORAGE HELPERS ----
const DEFAULT_CREW = { driver: "Slamet Riyadi", pramugari: "Nadia Putri" };

const DB = {
  init() {
    if (!localStorage.getItem("btm_bookings")) localStorage.setItem("btm_bookings", JSON.stringify(this._getSampleBookings()));
    if (!localStorage.getItem("btm_schedules_seats")) localStorage.setItem("btm_schedules_seats", JSON.stringify({}));
    if (!localStorage.getItem("btm_audit_log")) localStorage.setItem("btm_audit_log", JSON.stringify(this._getSampleLogs()));
    if (!localStorage.getItem("btm_unit_config")) localStorage.setItem("btm_unit_config", JSON.stringify({}));
    if (!localStorage.getItem("btm_crew")) localStorage.setItem("btm_crew", JSON.stringify({}));
    if (!localStorage.getItem("btm_current_user")) localStorage.setItem("btm_current_user", JSON.stringify(null));
  },

  _getSampleBookings() {
    const today = new Date();
    const fmt = (d) => d.toISOString().split("T")[0];
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);

    return [
      { id: "BTM-2026100101", passengerName: "Andi Wijaya", phone: "081234567890", routeId: "PNK-STG", scheduleId: "SCH-001", date: fmt(tomorrow), boardingPoint: "Kantor Pemasaran Pontianak (Terminal Sudarso)", dropoffPoint: "Kantor Pemasaran Sintang (Tugu BI)", seatNumber: "B1", seatClass: "royal", unit: 1, price: 200000, paymentMethod: "virtual_account", vaBank: "BCA", paymentStatus: "paid", bookingStatus: "confirmed", bookedBy: "superadmin", bookedAt: new Date(today.getTime() - 3600000).toISOString(), kasir: "Loket" },
      { id: "BTM-2026100102", passengerName: "Rini Susanti", phone: "082345678901", routeId: "PNK-STG", scheduleId: "SCH-001", date: fmt(tomorrow), boardingPoint: "Kantor Pemasaran Pontianak (Terminal Sudarso)", dropoffPoint: "Terminal Sungai Durian (Sintang)", seatNumber: "B2", seatClass: "royal", unit: 1, price: 200000, paymentMethod: "virtual_account", vaBank: "Mandiri", paymentStatus: "paid", bookingStatus: "confirmed", bookedBy: "online", bookedAt: new Date(today.getTime() - 7200000).toISOString(), kasir: "Online" },
      { id: "BTM-2026100103", passengerName: "Hendra Kusuma", phone: "083456789012", routeId: "PNK-STG", scheduleId: "SCH-001", date: fmt(tomorrow), boardingPoint: "Kantor Pemasaran Pontianak (Terminal Sudarso)", dropoffPoint: "Kantor Pemasaran Sintang (Tugu BI)", seatNumber: "A1", seatClass: "solitaire", unit: 1, price: 350000, paymentMethod: "virtual_account", vaBank: "BCA", paymentStatus: "paid", bookingStatus: "confirmed", bookedBy: "online", bookedAt: new Date(today.getTime() - 10800000).toISOString(), kasir: "Online" },
      { id: "BTM-2026100104", passengerName: "Maya Putri", phone: "084567890123", routeId: "PNK-STG", scheduleId: "SCH-002", date: fmt(dayAfter), boardingPoint: "Terminal ALBN Sei Ambawang (Pontianak)", dropoffPoint: "Kantor Pemasaran Sintang (Tugu BI)", seatNumber: "C1", seatClass: "royal", unit: 1, price: 200000, paymentMethod: "virtual_account", vaBank: "BRI", paymentStatus: "paid", bookingStatus: "confirmed", bookedBy: "online", bookedAt: new Date(today.getTime() - 1800000).toISOString(), kasir: "Online" },
      { id: "BTM-2026100105", passengerName: "Doni Firmansyah", phone: "085678901234", routeId: "PNK-STG", scheduleId: "SCH-001", date: fmt(tomorrow), boardingPoint: "Kantor Pemasaran Pontianak (Terminal Sudarso)", dropoffPoint: "Kantor Pemasaran Sintang (Tugu BI)", seatNumber: "B3", seatClass: "royal", unit: 1, price: 200000, paymentMethod: "virtual_account", vaBank: "BNI", paymentStatus: "paid", bookingStatus: "confirmed", bookedBy: "superadmin", bookedAt: new Date(today.getTime() - 14400000).toISOString(), kasir: "Loket" },
    ];
  },

  _getSampleLogs() {
    return [
      { id: 1, user: "superadmin", action: "Sistem Bis Listrik Borneo Trans diinisialisasi", timestamp: new Date().toISOString(), type: "system" },
      { id: 2, user: "superadmin", action: "Memesan tiket BTM-2026100101 untuk Andi Wijaya (B1, PNK→STG)", timestamp: new Date(Date.now() - 3600000).toISOString(), type: "booking" },
      { id: 3, user: "online", action: "Memesan tiket BTM-2026100102 untuk Rini Susanti (B2, PNK→STG)", timestamp: new Date(Date.now() - 7200000).toISOString(), type: "booking" },
      { id: 4, user: "online", action: "Memesan tiket BTM-2026100103 untuk Hendra Kusuma (A1, PNK→STG) - Solitaire Business Class", timestamp: new Date(Date.now() - 10800000).toISOString(), type: "booking" },
    ];
  },

  // Pesanan online yang belum dibayar > N jam dibatalkan otomatis agar kursi bebas
  expirePending(hours = 2) {
    const limit = Date.now() - hours * 3600000;
    let changed = 0;
    const all = this.getBookings().map(b => {
      if (b.bookedBy === "online" && b.paymentStatus === "pending" && b.bookingStatus !== "cancelled" && new Date(b.bookedAt).getTime() < limit) {
        changed++; return { ...b, bookingStatus: "cancelled", paymentStatus: "cancelled" };
      }
      return b;
    });
    if (changed) {
      this.saveBookings(all);
      this.addAuditLog("system", `${changed} pesanan online belum dibayar > ${hours} jam dibatalkan otomatis`, "system");
    }
  },
  getBookings() { return JSON.parse(localStorage.getItem("btm_bookings") || "[]"); },
  saveBookings(data) { localStorage.setItem("btm_bookings", JSON.stringify(data)); },
  getAuditLog() { return JSON.parse(localStorage.getItem("btm_audit_log") || "[]"); },
  addAuditLog(user, action, type = "info") {
    const logs = this.getAuditLog();
    logs.unshift({ id: Date.now(), user, action, timestamp: new Date().toISOString(), type });
    if (logs.length > 200) logs.splice(200);
    localStorage.setItem("btm_audit_log", JSON.stringify(logs));
  },
  getUnitConfig() { return JSON.parse(localStorage.getItem("btm_unit_config") || "{}"); },
  saveUnitConfig(data) { localStorage.setItem("btm_unit_config", JSON.stringify(data)); },
  getCrew() { return JSON.parse(localStorage.getItem("btm_crew") || "{}"); },
  saveCrew(data) { localStorage.setItem("btm_crew", JSON.stringify(data)); },
  getCurrentUser() { return JSON.parse(localStorage.getItem("btm_current_user") || "null"); },
  setCurrentUser(user) { localStorage.setItem("btm_current_user", JSON.stringify(user)); },

  getBookedSeats(routeId, scheduleId, date, unit) {
    const bookings = this.getBookings();
    return bookings
      .filter(b => b.seatNumber && b.routeId === routeId && b.scheduleId === scheduleId && b.date === date && b.unit === unit && b.bookingStatus !== "cancelled" && b.bookingStatus !== "refunded")
      .map(b => b.seatNumber);
  },

  // Jumlah pesanan aktif (termasuk yang sudah dibayar tetapi belum memilih kursi); cls opsional
  countActive(routeId, scheduleId, date, unit, cls = null) {
    return this.getBookings().filter(b => b.routeId === routeId && b.scheduleId === scheduleId && b.date === date
      && (b.unit || 1) === unit && (!cls || b.seatClass === cls)
      && b.bookingStatus !== "cancelled" && b.bookingStatus !== "refunded").length;
  },

  generateBookingId() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `BTM-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;
  },

  isUnit2Unlocked(routeId, scheduleId, date) {
    // Check manual override first
    const cfg = this.getUnitConfig();
    const key = `${routeId}_${scheduleId}_${date}`;
    if (cfg[key] !== undefined) return cfg[key] === true;
    // Auto-unlock if unit 1 is full
    return this.countActive(routeId, scheduleId, date, 1) >= 17;
  },

  forceSetUnit2(routeId, scheduleId, date, unlocked) {
    const cfg = this.getUnitConfig();
    const key = `${routeId}_${scheduleId}_${date}`;
    cfg[key] = unlocked;
    this.saveUnitConfig(cfg);
  },

  addBooking(booking) {
    const bookings = this.getBookings();
    bookings.unshift(booking);
    this.saveBookings(bookings);
    this.addAuditLog(booking.bookedBy || "online", `Tiket ${booking.id} dipesan untuk ${booking.passengerName} (Kursi ${booking.seatNumber}, ${booking.routeId})`, "booking");
  },

  updateBooking(id, updates) {
    const bookings = this.getBookings();
    const idx = bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      bookings[idx] = { ...bookings[idx], ...updates };
      this.saveBookings(bookings);
      return bookings[idx];
    }
    return null;
  },

  getBookingById(id) {
    return this.getBookings().find(b => b.id === id) || null;
  },

  getBookingByCodeAndPhone(code, phone) {
    return this.getBookings().find(b => b.id === code.toUpperCase() && b.phone === phone.replace(/\D/g, "").replace(/^0/, "62").replace(/^62/, "0"))
      || this.getBookings().find(b => b.id === code.toUpperCase() && b.phone.replace(/\D/g, "") === phone.replace(/\D/g, ""));
  },

  getRouteById(id) { return BTM.ROUTES.find(r => r.id === id); },
  getScheduleById(id) { return BTM.SCHEDULES.find(s => s.id === id); },
  getPriceByRouteAndClass(routeId, cls) { return BTM.PRICES[routeId]?.[cls] || 0; },
};

// LOCKED SEATS (temp locks during booking, 10-min TTL)
const TempLock = {
  STORAGE_KEY: "btm_temp_locks",
  DURATION: 10 * 60 * 1000, // 10 minutes

  getLocks() { return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]"); },
  saveLocks(data) { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data)); },

  lock(routeId, scheduleId, date, unit, seat, sessionId) {
    this.cleanup();
    const locks = this.getLocks();
    locks.push({ routeId, scheduleId, date, unit, seat, sessionId, expiresAt: Date.now() + this.DURATION });
    this.saveLocks(locks);
  },

  unlock(seat, sessionId) {
    const locks = this.getLocks().filter(l => !(l.seat === seat && l.sessionId === sessionId));
    this.saveLocks(locks);
  },

  unlockSession(sessionId) {
    const locks = this.getLocks().filter(l => l.sessionId !== sessionId);
    this.saveLocks(locks);
  },

  isLocked(routeId, scheduleId, date, unit, seat, excludeSession = null) {
    this.cleanup();
    return this.getLocks().some(l =>
      l.routeId === routeId && l.scheduleId === scheduleId &&
      l.date === date && l.unit === unit && l.seat === seat &&
      l.sessionId !== excludeSession
    );
  },

  getLockedSeats(routeId, scheduleId, date, unit, excludeSession = null) {
    this.cleanup();
    return this.getLocks()
      .filter(l => l.routeId === routeId && l.scheduleId === scheduleId && l.date === date && l.unit === unit && l.sessionId !== excludeSession)
      .map(l => l.seat);
  },

  cleanup() {
    const locks = this.getLocks().filter(l => l.expiresAt > Date.now());
    this.saveLocks(locks);
  },

  getTimeLeft(seat, sessionId) {
    const lock = this.getLocks().find(l => l.seat === seat && l.sessionId === sessionId);
    if (!lock) return 0;
    return Math.max(0, lock.expiresAt - Date.now());
  }
};

// UTILS
const Utils = {
  formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
  },
  formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  },
  formatDateTime(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  },
  // Tanggal lokal (YYYY-MM-DD), bukan UTC seperti toISOString()
  toLocalDate(d = new Date()) {
    const x = d instanceof Date ? d : new Date(d);
    const p = (n) => String(n).padStart(2, "0");
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  },
  esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },
  cleanText(s) { return String(s ?? "").replace(/[<>"`]/g, "").replace(/\s+/g, " ").trim(); },
  cleanPhone(s) { return String(s ?? "").replace(/[^0-9+\-\s]/g, "").trim(); },
  fmtTime(t) { return String(t).replace("+1", " (+1 hari)"); },
  getSeatClass(seatNum) {
    if (!seatNum) return "royal";
    if (["A1", "A2", "S1", "S2"].includes(seatNum) || (BTM.SEATS.solitaire && BTM.SEATS.solitaire.includes(seatNum))) {
      return "solitaire";
    }
    return "royal";
  },
  getSeatClassName(cls) {
    if (cls === "solitaire" || cls === "sleeper") return "Solitaire Business Class";
    return "Vip Royal Class";
  },
  generateQRData(bookingId) {
    return `BTM:${bookingId}:${Date.now()}`;
  },
  slugify(str) {
    return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  },
  getSessionId() {
    if (!sessionStorage.getItem("btm_session")) {
      sessionStorage.setItem("btm_session", "SES-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9));
    }
    return sessionStorage.getItem("btm_session");
  },
  statusBadgeClass(status) {
    const map = { confirmed: "badge-success", paid: "badge-success", pending: "badge-warning", cancelled: "badge-danger", refunded: "badge-info", locked: "badge-warning" };
    return map[status] || "badge-secondary";
  },
  statusLabel(status) {
    const map = { confirmed: "Terkonfirmasi", paid: "Lunas", pending: "Menunggu", cancelled: "Dibatalkan", refunded: "Direfund", locked: "Terkunci" };
    return map[status] || status;
  },
};

// Auto version migration for updated dataset
try {
  if (localStorage.getItem("btm_data_version") !== "4.0") {
    localStorage.removeItem("btm_config");
    localStorage.removeItem("btm_bookings");
    localStorage.removeItem("btm_temp_locks");
    localStorage.setItem("btm_data_version", "4.0");
  }
} catch(e) {}

// Initialize
DB.init();
DB.expirePending();
