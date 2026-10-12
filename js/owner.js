/* =========================================================
   Owner page: reads details from the QR link and shows
   Call / WhatsApp buttons
   ========================================================= */

// URL-safe base64 -> object
function decodeData(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

const MESSAGES = {
  block: "your vehicle is blocking mine. Please come and move it.",
  lights: "the lights of your vehicle are on.",
  window: "a window of your vehicle is open.",
  wrong: "your vehicle is parked in my spot. Please move it."
};

let data = null;
try {
  const param = new URLSearchParams(location.search).get("d");
  data = param ? decodeData(param) : null;
  if (!data || !isValidPhone(data.p) || !data.v) data = null;
} catch (e) {
  data = null;
}

if (!data) {
  document.getElementById("errorView").classList.remove("hidden");
} else {
  const plate = formatPlate(data.v);
  const isBike = data.t === "bike";

  document.getElementById("ownerType").innerHTML =
    '<i class="' + (isBike ? "ri-motorbike-line" : "ri-car-line") + '"></i>' + (isBike ? "Bike" : "Car");
  document.getElementById("ownerPlate").textContent = plate;
  document.getElementById("ownerModel").textContent = data.m || "";
  document.getElementById("ownerModel").classList.toggle("hidden", !data.m);
  document.getElementById("ownerName").textContent = data.n;
  document.getElementById("callBtn").href = "tel:+91" + data.p;
  document.title = plate + " · ParkSathi";

  function setMessage(key) {
    const text = "Hello " + data.n + ", " + MESSAGES[key] + " (Vehicle: " + plate + ")";
    document.getElementById("waBtn").href = "https://wa.me/91" + data.p + "?text=" + encodeURIComponent(text);
  }

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      setMessage(chip.dataset.msg);
    });
  });

  setMessage("block");
  document.getElementById("ownerView").classList.remove("hidden");
}
