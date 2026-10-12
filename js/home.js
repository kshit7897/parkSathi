/* =========================================================
   Home page: summary of slots, today's numbers, activity
   ========================================================= */

setupTopbar();

const user = currentUser();
const hour = new Date().getHours();
const part = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

document.getElementById("greeting").textContent = part + ", " + user.name.split(" ")[0];
document.getElementById("today").textContent = new Date().toLocaleDateString("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long"
});

/* ---------- Slot summary ---------- */

const slots = getSlots();

// Ring chart: gol line utni bharti hai jitne slots khaali hain
const RING = 326.7; // 2 x 3.14 x 52 (circle ki lambai)

function fillRing(type) {
  const all = slots.filter((s) => s.type === type);
  const free = all.filter((s) => !s.plate).length;
  const ring = document.getElementById(type + "Ring");
  const num = document.getElementById(type + "Free");

  document.getElementById(type + "Total").textContent = free === 0 ? "Parking full" : "of " + all.length + " free";
  ring.classList.toggle("full", free === 0);
  ring.classList.toggle("low", free > 0 && free / all.length <= 0.25);

  // thodi der baad bharna shuru, taaki animation dikhe
  setTimeout(() => {
    ring.style.strokeDashoffset = RING * (1 - free / all.length);
  }, 100);

  // number 0 se ginti karke aata hai
  let n = 0;
  const timer = setInterval(() => {
    num.textContent = n;
    if (n >= free) clearInterval(timer);
    n++;
  }, 700 / Math.max(free, 1));
}

fillRing("car");
fillRing("bike");

/* ---------- Today's numbers ---------- */

const history = getHistory();
const todayEntries = history.filter((h) => h.action === "in" && isToday(h.time));
const todayExits = history.filter((h) => h.action === "out" && isToday(h.time));
const amount = todayExits.reduce((sum, h) => sum + h.fee, 0);

document.getElementById("todayCount").textContent = todayEntries.length;
document.getElementById("todayAmount").textContent = "₹" + amount;

/* ---------- Recent activity ---------- */

const list = document.getElementById("activity");
const recent = history.slice(0, 6);

if (recent.length === 0) {
  list.innerHTML =
    '<li class="empty" style="display:block"><i class="ri-history-line"></i>No vehicles parked yet.</li>';
} else {
  list.innerHTML = recent
    .map((h) => {
      const icon = h.type === "bike" ? "ri-motorbike-line" : "ri-car-line";
      const text = h.action === "in" ? "Parked in " + h.slot : "Left " + h.slot + " · " + formatDuration(h.duration);
      const right =
        '<div class="act-right">' +
        (h.action === "in" ? '<span class="tag tag-in">IN</span>' : '<span class="tag tag-out">OUT</span>') +
        (h.action === "out" ? '<span class="act-amount">₹' + h.fee + "</span>" : "") +
        "</div>";
      return (
        "<li>" +
        '<i class="act-icon ' + icon + '"></i>' +
        '<div class="act-main"><strong>' + esc(formatPlate(h.plate)) + "</strong>" +
        "<span>" + esc(text) + " · " + formatClock(h.time) + "</span></div>" +
        right +
        "</li>"
      );
    })
    .join("");
}
