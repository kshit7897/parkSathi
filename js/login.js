/* =========================================================
   Login / Register
   Users are stored in localStorage (demo project, no server)
   ========================================================= */

// Already logged in? go to home
if (currentUser()) location.replace("home.html");

// Purane users (jinka username nahi tha): demo ko "admin", baaki ko unka mobile number
const users = Store.get(KEYS.users, []);
users.forEach((u) => {
  if (!u.username) u.username = u.phone === "9876543210" ? "admin" : u.phone;
});

// Demo account so the app can be shown without registering
if (!users.some((u) => u.username === "admin")) {
  users.push({ name: "Admin", username: "admin", phone: "9876543210", password: "admin123" });
}
Store.set(KEYS.users, users);

// small letters, numbers, _ aur . (3 se 20 characters)
function isValidUsername(name) {
  return /^[a-z0-9_.]{3,20}$/.test(name);
}

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const title = document.getElementById("formTitle");
const sub = document.getElementById("formSub");

/* ---------- Tabs ---------- */

document.querySelectorAll("[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const isLogin = btn.dataset.tab === "login";
    loginForm.classList.toggle("hidden", !isLogin);
    registerForm.classList.toggle("hidden", isLogin);
    title.textContent = isLogin ? "Welcome back" : "Create account";
    sub.textContent = isLogin
      ? "Login to manage parking slots and your car QR."
      : "Register once, then park and create your vehicle QR.";
  });
});

/* ---------- Show / hide password ---------- */

document.querySelectorAll(".toggle-pass").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = btn.parentElement.querySelector("input");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.innerHTML = show ? '<i class="ri-eye-off-line"></i>' : '<i class="ri-eye-line"></i>';
  });
});

// Only digits in phone fields
document.querySelectorAll('input[type="tel"]').forEach((input) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "");
  });
});

const gate = document.getElementById("gate");

function showError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.classList.remove("hidden");

  // barrier "na" me hilta hai (class hata ke dobara lagao taaki animation phir chale)
  gate.classList.remove("denied");
  void gate.offsetWidth;
  gate.classList.add("denied");
}

function startSession(user) {
  Store.set(KEYS.session, { name: user.name, username: user.username, phone: user.phone });
  document.querySelectorAll(".error").forEach((el) => el.classList.add("hidden"));

  // barrier upar uthta hai, gaadi andar jaati hai, phir Home khulta hai
  gate.classList.add("open");
  document.querySelectorAll("form button[type=submit]").forEach((b) => (b.disabled = true));
  setTimeout(() => location.replace("home.html"), 1200);
}

/* ---------- Login ---------- */

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // username me capital/small ka farak nahi
  const username = document.getElementById("loginUser").value.trim().toLowerCase();
  const password = document.getElementById("loginPass").value;

  if (!username) return showError("loginError", "Enter your username.");
  if (!password) return showError("loginError", "Enter your password.");

  const user = Store.get(KEYS.users, []).find((u) => u.username === username && u.password === password);
  if (!user) return showError("loginError", "Username or password is wrong.");

  startSession(user);
});

/* ---------- Register ---------- */

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const username = document.getElementById("regUser").value.trim().toLowerCase();
  const phone = document.getElementById("regPhone").value.trim();
  const password = document.getElementById("regPass").value;

  if (name.length < 2) return showError("registerError", "Enter your full name.");
  if (!isValidUsername(username)) {
    return showError("registerError", "Username: 3–20 characters, only small letters, numbers, _ or .");
  }
  if (!isValidPhone(phone)) return showError("registerError", "Enter a valid 10 digit mobile number.");
  if (password.length < 6) return showError("registerError", "Password must be at least 6 characters.");

  const list = Store.get(KEYS.users, []);
  if (list.some((u) => u.username === username)) {
    return showError("registerError", "This username is taken. Try another one.");
  }

  const user = { name, username, phone, password };
  list.push(user);
  Store.set(KEYS.users, list);
  startSession(user);
});
