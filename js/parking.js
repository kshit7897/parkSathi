/* =========================================================
   Parking page: slot grid, park, exit, ticket, search, filter
   ========================================================= */

setupTopbar();

let slots = getSlots();
let filter = "all";
let activeSlotId = null;
let pending = null; // sheet band hone pe kaunsa animation chalana hai

const zonesEl = document.getElementById("zones");
const sheet = document.getElementById("sheet");
const parkForm = document.getElementById("parkForm");
const plateInput = document.getElementById("plateInput");
const plateField = plateInput.closest(".plate-field");
const phoneInput = document.getElementById("phoneInput");
const plateError = document.getElementById("plateError");
const searchInput = document.getElementById("searchInput");

/* ---------- Vehicle drawings (top view, SVG) ---------- */

const COLORS = ["#f1f3f5", "#c0c6cd", "#d64545", "#2f6fd6", "#8a9099", "#e0b341", "#3b8c5a", "#b45a2a"];

// same number = same colour every time
function colorFor(plate) {
  let sum = 0;
  for (const ch of plate) sum += ch.charCodeAt(0);
  return COLORS[sum % COLORS.length];
}

function carSVG(color) {
  return (
    '<svg class="veh" viewBox="0 0 40 72" aria-hidden="true">' +
    '<rect x="1" y="21" width="5" height="7" rx="2" fill="' + color + '"/>' +            // mirrors
    '<rect x="34" y="21" width="5" height="7" rx="2" fill="' + color + '"/>' +
    '<rect x="4" y="2" width="32" height="68" rx="10" fill="' + color + '" stroke="rgba(0,0,0,.3)"/>' + // body
    '<path d="M9 23 Q20 17 31 23 L29 32 Q20 30 11 32 Z" fill="#1c2733"/>' +               // front glass
    '<rect x="11" y="34" width="18" height="17" rx="3" fill="rgba(0,0,0,.12)"/>' +        // roof
    '<path d="M11 54 Q20 56 29 54 L30 61 Q20 64 10 61 Z" fill="#1c2733"/>' +              // rear glass
    '<rect x="8" y="3" width="7" height="3" rx="1.5" fill="#fff8d6"/>' +                  // headlights
    '<rect x="25" y="3" width="7" height="3" rx="1.5" fill="#fff8d6"/>' +
    '<rect x="8" y="66" width="6" height="2.5" rx="1" fill="#ff5a4e"/>' +                 // tail lights
    '<rect x="26" y="66" width="6" height="2.5" rx="1" fill="#ff5a4e"/>' +
    "</svg>"
  );
}

function bikeSVG(color) {
  return (
    '<svg class="veh" viewBox="0 0 24 60" aria-hidden="true">' +
    '<rect x="9" y="1" width="6" height="13" rx="3" fill="#0e1013"/>' +                   // front wheel
    '<rect x="9" y="45" width="6" height="14" rx="3" fill="#0e1013"/>' +                  // rear wheel
    '<rect x="7" y="11" width="10" height="36" rx="5" fill="' + color + '" stroke="rgba(0,0,0,.3)"/>' + // body
    '<rect x="1" y="14" width="22" height="3" rx="1.5" fill="#3a3f47"/>' +                // handle
    '<rect x="8.5" y="27" width="7" height="15" rx="3" fill="#1b1d21"/>' +                // seat
    '<circle cx="12" cy="11" r="2" fill="#fff8d6"/>' +                                    // headlight
    '<rect x="10" y="45" width="4" height="2" rx="1" fill="#ff5a4e"/>' +                  // tail light
    "</svg>"
  );
}

/* ---------- Render grid ---------- */

function slotHTML(slot) {
  if (!slot.plate) {
    return (
      '<button class="slot" data-id="' + slot.id + '" aria-label="Slot ' + slot.id + ' free">' +
      '<span class="slot-paint">' + slot.id + "</span>" +
      '<span class="slot-free">FREE</span>' +
      '<span class="slot-hint"><i class="ri-add-line"></i>Park</span>' +
      "</button>"
    );
  }

  const color = colorFor(slot.plate);
  return (
    '<button class="slot busy" data-id="' + slot.id + '" aria-label="Slot ' + slot.id + " occupied by " + esc(slot.plate) + '">' +
    '<span class="slot-time">' + formatDuration(Date.now() - slot.inTime) + "</span>" +
    (slot.type === "bike" ? bikeSVG(color) : carSVG(color)) +
    '<span class="slot-plate">' + esc(slot.plate) + "</span>" +
    '<span class="slot-id">' + slot.id + "</span>" +
    "</button>"
  );
}

function render() {
  zonesEl.innerHTML = ZONES.filter((z) => filter === "all" || z.type === filter)
    .map((zone) => {
      const list = slots.filter((s) => s.type === zone.type);
      const free = list.filter((s) => !s.plate).length;
      const icon = zone.type === "bike" ? "ri-motorbike-line" : "ri-car-line";
      return (
        '<section class="zone">' +
        '<div class="zone-head"><h2><i class="' + icon + '"></i>' + zone.label + "</h2>" +
        "<span>" + free + " of " + list.length + " free</span></div>" +
        '<div class="lot"><div class="slots ' + zone.type + '">' + list.map(slotHTML).join("") + "</div>" +
        '<div class="lane"><span>ENTRY</span><i class="ri-arrow-right-line"></i><i class="ri-arrow-right-line"></i><i class="ri-arrow-right-line"></i><span>EXIT</span></div>' +
        "</div>" +
        "</section>"
      );
    })
    .join("");
  applySearch();
}

function slotEl(id) {
  return zonesEl.querySelector('[data-id="' + id + '"]');
}

/* ---------- Ticket & receipt ---------- */

function ticketHTML(slot) {
  const d = new Date(slot.inTime);
  return (
    '<div class="ticket">' +
    '<div class="ticket-head"><span class="ticket-p">P</span>ParkSathi · Parking ticket</div>' +
    '<div class="ticket-main">' +
    '<div class="ticket-slot"><small>SLOT</small><strong>' + slot.id + "</strong></div>" +
    '<span class="plate">' + esc(formatPlate(slot.plate)) + "</span>" +
    "</div>" +
    '<div class="ticket-cut"></div>' +
    '<ul class="ticket-rows">' +
    "<li><span>Entry</span><strong>" + formatClock(slot.inTime) + "</strong></li>" +
    "<li><span>Date</span><strong>" + d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + "</strong></li>" +
    "<li><span>Rate</span><strong>₹" + RATES[slot.type] + "/hr</strong></li>" +
    "</ul>" +
    '<div class="ticket-code"><span class="barcode"></span>#' + slot.id + "-" + String(slot.inTime).slice(-5) + "</div>" +
    "</div>"
  );
}

function receiptHTML(entry, slotId) {
  return (
    '<div class="ticket receipt">' +
    '<div class="ticket-head"><span class="ticket-p">P</span>ParkSathi · Receipt</div>' +
    '<div class="ticket-main">' +
    '<div class="ticket-slot"><small>SLOT</small><strong>' + slotId + "</strong></div>" +
    '<span class="plate">' + esc(formatPlate(entry.plate)) + "</span>" +
    "</div>" +
    '<div class="ticket-cut"></div>' +
    '<ul class="ticket-rows">' +
    "<li><span>Entry</span><strong>" + formatClock(entry.time - entry.duration) + "</strong></li>" +
    "<li><span>Exit</span><strong>" + formatClock(entry.time) + "</strong></li>" +
    "<li><span>Parked</span><strong>" + formatDuration(entry.duration) + "</strong></li>" +
    "</ul>" +
    '<div class="ticket-total"><span>Total paid</span><strong>₹' + entry.fee + "</strong></div>" +
    '<span class="stamp">PAID</span>' +
    "</div>"
  );
}

/* ---------- Bottom sheet ---------- */

const VIEWS = ["parkForm", "exitView", "ticketView", "receiptView"];

function showView(name, title, sub) {
  VIEWS.forEach((v) => document.getElementById(v).classList.toggle("hidden", v !== name));
  document.getElementById("sheetTitle").innerHTML = title;
  document.getElementById("sheetSub").textContent = sub;
}

function openSheet(slot) {
  activeSlotId = slot.id;
  const typeName = slot.type === "bike" ? "Bike" : "Car";

  if (!slot.plate) {
    showView("parkForm", "Park in " + slot.id, typeName + " bay · ₹" + RATES[slot.type] + " per hour");
    parkForm.reset();
    plateField.classList.remove("invalid");
    plateError.classList.add("hidden");
  } else {
    const fee = calcFee(slot.type, slot.inTime);
    showView("exitView", '<span class="plate">' + esc(formatPlate(slot.plate)) + "</span>", typeName + " in slot " + slot.id);
    document.getElementById("exitDetails").innerHTML =
      "<li><span>Entry time</span><span>" + formatClock(slot.inTime) + "</span></li>" +
      "<li><span>Parked for</span><span>" + formatDuration(Date.now() - slot.inTime) + "</span></li>" +
      (slot.phone ? "<li><span>Owner mobile</span><span>" + esc(slot.phone) + "</span></li>" : "") +
      "<li><span>Rate</span><span>₹" + RATES[slot.type] + " / hour</span></li>" +
      '<li class="total"><span>Amount to collect</span><span>₹' + fee + "</span></li>";
    document.querySelector("#exitBtn span").textContent = "Exit & collect ₹" + fee;
  }

  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden", "false");
  if (!slot.plate) setTimeout(() => plateInput.focus(), 250);
}

function closeSheet() {
  sheet.classList.remove("open");
  sheet.setAttribute("aria-hidden", "true");
  activeSlotId = null;

  if (!pending) return;
  const { type, id } = pending;
  pending = null;

  if (type === "arrive") {
    // gaadi lane se aage badh ke bay me aati hai
    render();
    const veh = slotEl(id) && slotEl(id).querySelector(".veh");
    if (veh) veh.classList.add("arrive");
  } else {
    // gaadi reverse hoke bahar jaati hai, phir slot khaali dikhta hai
    const el = slotEl(id);
    if (el) el.classList.add("leaving");
    setTimeout(() => {
      render();
      const free = slotEl(id);
      if (free) free.classList.add("just-freed");
    }, 550);
  }
}

/* ---------- Events ---------- */

zonesEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".slot");
  if (!btn) return;
  openSheet(slots.find((s) => s.id === btn.dataset.id));
});

document.getElementById("sheetClose").addEventListener("click", closeSheet);
document.querySelectorAll(".done-btn").forEach((b) => b.addEventListener("click", closeSheet));
sheet.addEventListener("click", (e) => {
  if (e.target === sheet) closeSheet();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sheet.classList.contains("open")) closeSheet();
});

phoneInput.addEventListener("input", () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, "");
});

// Park
parkForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const plate = cleanPlate(plateInput.value);
  const phone = phoneInput.value.trim();

  let error = "";
  if (!isValidPlate(plate)) error = "Enter a valid number, e.g. MH12AB1234";
  else if (slots.some((s) => s.plate === plate)) error = "This vehicle is already parked in " + slots.find((s) => s.plate === plate).id;
  else if (phone && !isValidPhone(phone)) error = "Mobile number should be 10 digits.";

  if (error) {
    plateError.textContent = error;
    plateError.classList.remove("hidden");
    plateField.classList.add("invalid");
    return;
  }

  const slot = slots.find((s) => s.id === activeSlotId);
  slot.plate = plate;
  slot.phone = phone;
  slot.inTime = Date.now();
  saveSlots(slots);
  addHistory({ action: "in", plate, slot: slot.id, type: slot.type, time: slot.inTime });

  // ticket print hota hai
  document.getElementById("ticketBox").innerHTML = ticketHTML(slot);
  showView("ticketView", "Vehicle parked", "Give this ticket to the driver");
  pending = { type: "arrive", id: slot.id };
});

// Exit
document.getElementById("exitBtn").addEventListener("click", () => {
  const slot = slots.find((s) => s.id === activeSlotId);
  const now = Date.now();
  const entry = {
    action: "out",
    plate: slot.plate,
    slot: slot.id,
    type: slot.type,
    time: now,
    duration: now - slot.inTime,
    fee: calcFee(slot.type, slot.inTime, now)
  };
  addHistory(entry);

  slot.plate = null;
  slot.phone = "";
  slot.inTime = null;
  saveSlots(slots);

  document.getElementById("receiptBox").innerHTML = receiptHTML(entry, slot.id);
  showView("receiptView", "Payment collected", "₹" + entry.fee + " received · slot " + slot.id + " is free now");
  pending = { type: "leave", id: slot.id };
});

// Filter
document.querySelectorAll("[data-filter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter;
    render();
  });
});

/* ---------- Live search ---------- */

// type karte hi matching gaadi highlight, baaki dim
function applySearch() {
  const query = cleanPlate(searchInput.value);
  zonesEl.classList.toggle("searching", query.length > 0);
  zonesEl.querySelectorAll(".slot").forEach((el) => {
    const slot = slots.find((s) => s.id === el.dataset.id);
    el.classList.toggle("match", query.length > 0 && !!slot.plate && slot.plate.includes(query));
  });
}

searchInput.addEventListener("input", applySearch);

// Enter dabane pe pehli matching gaadi tak scroll
document.getElementById("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const query = cleanPlate(searchInput.value);
  if (!query) return;

  const slot = slots.find((s) => s.plate && s.plate.includes(query));
  if (!slot) {
    toast("Vehicle not found in parking", "error");
    return;
  }

  if (filter !== "all" && filter !== slot.type) {
    document.querySelector('[data-filter="all"]').click();
  }

  const el = slotEl(slot.id);
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.remove("found");
  void el.offsetWidth; // animation dobara chalane ke liye
  el.classList.add("found");
  setTimeout(() => el.classList.remove("found"), 3000);
  toast(formatPlate(slot.plate) + " is in slot " + slot.id);
});

/* ---------- Start ---------- */

render();

// Har 30 second me parked time update
setInterval(() => {
  if (!sheet.classList.contains("open")) render();
}, 30000);
