/* =========================================================
   QR page: owner details -> link -> QR sticker (canvas)
   No database: the details travel inside the QR link itself
   ========================================================= */

setupTopbar();

const user = currentUser();
// har user ka sticker alag save hota hai (purane login me username nahi tha)
const userKey = user.username || user.phone;
const form = document.getElementById("qrForm");
const canvas = document.getElementById("stickerCanvas");
const errorEl = document.getElementById("qrError");

let vehicleType = "car";
let ownerLink = "";

/* ---------- Encode details into the link ---------- */

// object -> URL-safe base64 (works with Hindi names too)
function encodeData(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildLink(data) {
  const url = new URL("owner.html", location.href);
  url.search = "?d=" + encodeData(data);
  return url.href;
}

/* ---------- Draw sticker ---------- */

function drawSticker(data, link) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const font = "Manrope, sans-serif";

  // background + border
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#0f1e3d";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, W - 6, H - 6);

  // top band
  // peeli patti (door se dikhe, warning sign jaisi) + navy text
  ctx.fillStyle = "#ffc233";
  ctx.fillRect(6, 6, W - 12, 150);

  ctx.fillStyle = "#0f1e3d";
  ctx.textAlign = "center";
  ctx.font = "800 38px " + font;
  ctx.fillText(data.t === "bike" ? "BLOCKING YOUR BIKE?" : "BLOCKING YOUR CAR?", W / 2, 72);
  ctx.font = "600 24px " + font;
  ctx.fillText("Scan to contact the owner", W / 2, 114);

  // QR code
  const qr = qrcode(0, "M");
  qr.addData(link);
  qr.make();

  const count = qr.getModuleCount();
  const size = 400;
  const cell = Math.floor(size / count);
  const qrSize = cell * count;
  const x0 = (W - qrSize) / 2;
  const y0 = 190 + (size - qrSize) / 2;

  ctx.fillStyle = "#0f1e3d";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) ctx.fillRect(x0 + c * cell, y0 + r * cell, cell, cell);
    }
  }

  // number plate box
  const plateText = formatPlate(data.v);
  ctx.font = "800 40px " + font;
  const plateW = Math.max(320, ctx.measureText(plateText).width + 90);
  const plateX = (W - plateW) / 2;
  ctx.lineWidth = 4;
  ctx.strokeRect(plateX, 628, plateW, 72);
  ctx.fillText(plateText, W / 2 + 17, 678);

  // HSRP jaisi blue "IND" patti
  ctx.fillStyle = "#0b4ea2";
  ctx.fillRect(plateX + 2, 630, 34, 68);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 13px " + font;
  ctx.fillText("IND", plateX + 19, 688);

  // footer
  ctx.fillStyle = "#5d6470";
  ctx.font = "600 20px " + font;
  ctx.fillText("ParkSathi · Your number stays on your sticker only", W / 2, 770);
}

/* ---------- Form ---------- */

document.querySelectorAll("[data-type]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-type]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    vehicleType = btn.dataset.type;
  });
});

document.getElementById("qrPhone").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "");
});

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

async function generate(data) {
  ownerLink = buildLink(data);

  // wait for Manrope so canvas text uses the right font
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  drawSticker(data, ownerLink);

  document.getElementById("qrEmpty").classList.add("hidden");
  document.getElementById("qrReady").classList.remove("hidden");
  // file:// or 127.0.0.1 / localhost links only open on this computer, not on a phone
  const isLocal = location.protocol === "file:" || ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  document.getElementById("localNotice").classList.toggle("hidden", !isLocal);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  errorEl.classList.add("hidden");

  const data = {
    t: vehicleType,
    v: cleanPlate(document.getElementById("qrPlate").value),
    m: document.getElementById("qrModel").value.trim(),
    n: document.getElementById("qrName").value.trim(),
    p: document.getElementById("qrPhone").value.trim()
  };

  if (!isValidPlate(data.v)) return showError("Enter a valid vehicle number, e.g. MH12AB1234");
  if (data.n.length < 2) return showError("Enter owner name.");
  if (!isValidPhone(data.p)) return showError("Enter a valid 10 digit mobile number.");

  // remember per user so the sticker is there next time
  const saved = Store.get(KEYS.myQr, {});
  saved[userKey] = data;
  Store.set(KEYS.myQr, saved);

  generate(data).then(() => {
    toast("Sticker saved");
    // on mobile, scroll down to the sticker
    if (window.innerWidth < 768) {
      document.querySelector(".qr-result").scrollIntoView({ behavior: "smooth" });
    }
  });
});

/* ---------- Live preview: type karte hi sticker update ---------- */

let liveTimer;

function livePreview() {
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => {
    const data = {
      t: vehicleType,
      v: cleanPlate(document.getElementById("qrPlate").value),
      m: document.getElementById("qrModel").value.trim(),
      n: document.getElementById("qrName").value.trim(),
      p: document.getElementById("qrPhone").value.trim()
    };
    // sab sahi ho tabhi QR banta hai
    if (isValidPlate(data.v) && data.n.length >= 2 && isValidPhone(data.p)) generate(data);
  }, 250);
}

form.addEventListener("input", livePreview);
document.querySelectorAll("[data-type]").forEach((btn) => btn.addEventListener("click", livePreview));

/* ---------- Actions ---------- */

document.getElementById("downloadBtn").addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = "parksathi-qr-" + cleanPlate(document.getElementById("qrPlate").value) + ".png";
  a.href = canvas.toDataURL("image/png");
  a.click();
});

document.getElementById("printBtn").addEventListener("click", () => window.print());

document.getElementById("testBtn").addEventListener("click", () => {
  if (ownerLink) window.open(ownerLink, "_blank");
});

/* ---------- Load saved sticker or prefill ---------- */

const allSaved = Store.get(KEYS.myQr, {});
const saved = allSaved[userKey] || allSaved[user.phone];

if (saved) {
  document.getElementById("qrPlate").value = saved.v;
  document.getElementById("qrModel").value = saved.m || "";
  document.getElementById("qrName").value = saved.n;
  document.getElementById("qrPhone").value = saved.p;
  document.querySelector('[data-type="' + saved.t + '"]').click();
  generate(saved);
} else {
  document.getElementById("qrName").value = user.name;
  document.getElementById("qrPhone").value = user.phone;
}
