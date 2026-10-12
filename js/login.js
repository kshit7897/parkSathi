/* =========================================================
   Login / Register
   Users are stored in localStorage (demo project, no server)
   ========================================================= */

// Already logged in? go to home
if (currentUser()) location.replace("home.html");

// Demo account so the app can be shown without registering
const users = Store.get(KEYS.users, []);
if (!users.some((u) => u.phone === "9876543210")) {
  users.push({ name: "Admin", phone: "9876543210", password: "admin123" });
  Store.set(KEYS.users, users);
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
  Store.set(KEYS.session, { name: user.name, phone: user.phone });
  document.querySelectorAll(".error").forEach((el) => el.classList.add("hidden"));

  // barrier upar uthta hai, gaadi andar jaati hai, phir Home khulta hai
  gate.classList.add("open");
  document.querySelectorAll("form button[type=submit]").forEach((b) => (b.disabled = true));
  setTimeout(() => location.replace("home.html"), 1200);
}

/* ---------- Login ---------- */

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const phone = document.getElementById("loginPhone").value.trim();
  const password = document.getElementById("loginPass").value;

  if (!isValidPhone(phone)) return showError("loginError", "Enter a valid 10 digit mobile number.");
  if (!password) return showError("loginError", "Enter your password.");

  const user = Store.get(KEYS.users, []).find((u) => u.phone === phone && u.password === password);
  if (!user) return showError("loginError", "Mobile number or password is wrong.");

  startSession(user);
});

/* ---------- Register ---------- */

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const password = document.getElementById("regPass").value;

  if (name.length < 2) return showError("registerError", "Enter your full name.");
  if (!isValidPhone(phone)) return showError("registerError", "Enter a valid 10 digit mobile number.");
  if (password.length < 6) return showError("registerError", "Password must be at least 6 characters.");

  const list = Store.get(KEYS.users, []);
  if (list.some((u) => u.phone === phone)) {
    return showError("registerError", "This number is already registered. Please login.");
  }

  const user = { name, phone, password };
  list.push(user);
  Store.set(KEYS.users, list);
  startSession(user);
});
