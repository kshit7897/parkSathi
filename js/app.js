/* =========================================================
   Common helpers used by every page
   ========================================================= */

const KEYS = {
  users: "pk_users",
  session: "pk_session",
  slots: "pk_slots",
  history: "pk_history",
  myQr: "pk_myqr"
};

const RATES = { car: 20, bike: 10 }; // rupees per hour

const Store = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage full or blocked - ignore */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }
};

/* ---------- Session ---------- */

function currentUser() {
  return Store.get(KEYS.session, null);
}

function requireLogin() {
  const user = currentUser();
  if (!user) {
    location.replace("index.html");
    return null;
  }
  return user;
}

function logout() {
  Store.remove(KEYS.session);
  location.replace("index.html");
}

/* Fills user name in top bar and wires the logout button */
function setupTopbar() {
  const user = currentUser();
  const chip = document.getElementById("userName");
  if (chip && user) chip.textContent = user.name;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Logout from ParkSathi?")) logout();
    });
  }
}

/* ---------- Vehicle number helpers ---------- */

// "mh 12-ab 1234" -> "MH12AB1234"
function cleanPlate(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Normal format (MH12AB1234) or Bharat series (22BH1234AB)
function isValidPlate(plate) {
  return /^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}$/.test(plate) || /^\d{2}BH\d{4}[A-Z]{1,2}$/.test(plate);
}

// "MH12AB1234" -> "MH 12 AB 1234"
function formatPlate(plate) {
  const m = plate.match(/^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{4})$/);
  if (!m) return plate;
  return [m[1], m[2], m[3], m[4]].filter(Boolean).join(" ");
}

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

/* ---------- Time & money ---------- */

function formatClock(ts) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function formatDuration(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return m + " min";
  return h + "h " + m + "m";
}

// Minimum 1 hour, then every started hour is charged
function calcFee(type, inTime, outTime = Date.now()) {
  const hours = Math.max(1, Math.ceil((outTime - inTime) / 3600000));
  return hours * RATES[type];
}

function isToday(ts) {
  return new Date(ts).toDateString() === new Date().toDateString();
}

/* ---------- Toast ---------- */

let toastTimer;

function toast(message, type = "success") {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  const icon = type === "error" ? "ri-error-warning-line" : "ri-checkbox-circle-line";
  el.className = "toast " + type;
  el.innerHTML = '<i class="' + icon + '"></i><span></span>';
  el.querySelector("span").textContent = message;

  requestAnimationFrame(() => el.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

/* ---------- Parking data (shared by home + parking page) ---------- */

const ZONES = [
  { id: "A", type: "car", label: "Zone A · Cars", count: 12 },
  { id: "B", type: "bike", label: "Zone B · Bikes", count: 16 }
];

function getSlots() {
  let slots = Store.get(KEYS.slots, null);
  if (!slots) {
    slots = [];
    ZONES.forEach((zone) => {
      for (let i = 1; i <= zone.count; i++) {
        slots.push({ id: zone.id + i, type: zone.type, plate: null, phone: "", inTime: null });
      }
    });
    Store.set(KEYS.slots, slots);
  }
  return slots;
}

function saveSlots(slots) {
  Store.set(KEYS.slots, slots);
}

function getHistory() {
  return Store.get(KEYS.history, []);
}

function addHistory(entry) {
  const list = getHistory();
  list.unshift(entry);
  Store.set(KEYS.history, list.slice(0, 100)); // keep last 100 only
}

/* Escapes text before putting it inside innerHTML */
function esc(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}
