const API_BASE = "http://127.0.0.1:8000/api";

function setStatus(element, message, type = "") {
  if (!element) return;
  element.className = `status-box ${type}`;
  element.textContent = message;
  element.classList.remove("hidden");
}

async function getCsrfToken() {
  const response = await fetch(`${API_BASE}/auth/csrf-token`, {
    credentials: "include",
  });
  const payload = await response.json();
  return payload.csrf_token;
}

async function postJson(url, payload) {
  const csrfToken = await getCsrfToken();
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(payload),
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.detail || json.error || "Server error");
  }
  return json;
}

const registerForm = document.querySelector("[data-register-form]");
const loginForm = document.querySelector("[data-login-form]");
const mobileSendForm = document.querySelector("[data-mobile-send-form]");
const mobileLoginForm = document.querySelector("[data-mobile-login-form]");

function setAuthenticatedState(authenticated) {
  localStorage.setItem("lendswift.authenticated", authenticated ? "true" : "false");
}

async function refreshAuthStatus() {
  try {
    const response = await fetch(`${API_BASE}/auth/status`, {
      credentials: "include",
    });
    const json = await response.json();
    setAuthenticatedState(json.authenticated);
  } catch (err) {
    setAuthenticatedState(false);
  }
}

refreshAuthStatus();

if (registerForm) {
  const status = document.querySelector("[data-register-status]");
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(registerForm).entries());
    setStatus(status, "Registering account...");
    try {
      const result = await postJson(`${API_BASE}/auth/register`, data);
      setAuthenticatedState(true);
      setStatus(status, "Registration successful. Logged in.", "success");
    } catch (error) {
      setStatus(status, error.message, "error");
    }
  });
}

if (loginForm) {
  const status = document.querySelector("[data-login-status]");
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm).entries());
    setStatus(status, "Logging in...");
    try {
      await postJson(`${API_BASE}/auth/login`, data);
      setAuthenticatedState(true);
      setStatus(status, "Login successful.", "success");
    } catch (error) {
      setStatus(status, error.message, "error");
    }
  });
}

if (mobileSendForm) {
  const status = document.querySelector("[data-mobile-send-status]");
  mobileSendForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const mobile = new FormData(mobileSendForm).get("mobile");
    setStatus(status, "Sending OTP...");
    try {
      const result = await postJson(`${API_BASE}/auth/send-otp`, { mobile });
      localStorage.setItem("lendswift.mobile", mobile);
      const otpNote = result.dev_otp ? ` Dev OTP: ${result.dev_otp}` : "";
      setStatus(status, `OTP sent to ${mobile}.${otpNote}`, "success");
    } catch (error) {
      setStatus(status, error.message, "error");
    }
  });
}

if (mobileLoginForm) {
  const status = document.querySelector("[data-mobile-login-status]");
  mobileLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(mobileLoginForm);
    const data = {
      mobile: form.get("mobile"),
      otp: form.get("otp"),
    };
    setStatus(status, "Verifying OTP and logging in...");
    try {
      await postJson(`${API_BASE}/auth/mobile-login`, data);
      setAuthenticatedState(true);
      setStatus(status, "Mobile login successful.", "success");
    } catch (error) {
      setStatus(status, error.message, "error");
    }
  });
}
