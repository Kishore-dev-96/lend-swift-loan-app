const API_BASE = "/api";

function setStatus(element, message, type = "") {
  if (!element) return;
  element.className = `status-box ${type}`;
  element.textContent = message;
  element.classList.remove("hidden");
}

function saveProfile(payload) {
  localStorage.setItem("lendswift.kycProfile", JSON.stringify(payload));
}

function getProfile() {
  try {
    return JSON.parse(localStorage.getItem("lendswift.kycProfile") || "{}");
  } catch {
    return {};
  }
}

async function getCsrfToken() {
  const existing = localStorage.getItem("lendswift.csrfToken");
  if (existing) return existing;
  const response = await fetch(`${API_BASE}/auth/csrf-token`, {
    credentials: "include",
  });
  if (!response.ok) return null;
  const result = await response.json();
  if (result.csrf_token) {
    localStorage.setItem("lendswift.csrfToken", result.csrf_token);
    return result.csrf_token;
  }
  return null;
}

async function sendSecureRequest(url, options = {}) {
  const csrfToken = await getCsrfToken();
  const headers = options.headers || {};
  if (csrfToken) {
    headers["X-CSRF-TOKEN"] = csrfToken;
  }
  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

const uploadForm = document.querySelector("[data-kyc-upload-form]");
if (uploadForm) {
  const status = document.querySelector("[data-kyc-status]");
  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(uploadForm);
    if (!data.get("consent")) {
      setStatus(status, "Consent denied: document processing is blocked.", "error");
      return;
    }

    setStatus(status, "Processing documents securely with OCR...");
    try {
      const response = await sendSecureRequest(`${API_BASE}/kyc/upload`, {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.message || "Unable to read document");
      saveProfile(result);
      setStatus(status, "Profile created successfully. Redirecting to review...", "success");
      window.setTimeout(() => {
        window.location.href = "profile.html";
      }, 700);
    } catch (error) {
      setStatus(status, error.message, "error");
    }
  });
}

const confirmForm = document.querySelector("[data-kyc-confirm-form]");
if (confirmForm) {
  const status = document.querySelector("[data-profile-status]");
  const fields = {
    name: confirmForm.querySelector("input[name=name]"),
    dob: confirmForm.querySelector("input[name=dob]"),
    pan_number: confirmForm.querySelector("input[name=pan_number]"),
    masked_aadhaar_number: confirmForm.querySelector("input[name=masked_aadhaar_number]"),
    address: confirmForm.querySelector("textarea[name=address]"),
  };

  async function loadDraftProfile() {
    try {
      const response = await sendSecureRequest(`${API_BASE}/kyc/draft`, { method: "GET" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load profile draft");
      const profile = result.profile || {};
      fields.name.value = profile.name || "";
      fields.dob.value = profile.dob || "";
      fields.pan_number.value = profile.pan_number || "";
      fields.masked_aadhaar_number.value = profile.masked_aadhaar_number || "";
      fields.address.value = profile.address || "";
      saveProfile({ profile });
    } catch (error) {
      setStatus(status, error.message, "error");
    }
  }

  loadDraftProfile();

  confirmForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(status, "Saving profile details...");
    try {
      const payload = {
        name: fields.name.value.trim(),
        dob: fields.dob.value.trim(),
        pan_number: fields.pan_number.value.trim().toUpperCase(),
        masked_aadhaar_number: fields.masked_aadhaar_number.value.trim(),
        address: fields.address.value.trim(),
      };
      const response = await sendSecureRequest(`${API_BASE}/kyc/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to confirm profile");
      setStatus(status, result.message || "Profile confirmed.", "success");
      window.setTimeout(() => {
        window.location.href = "otp.html";
      }, 800);
    } catch (error) {
      setStatus(status, error.message, "error");
    }
  });
}

if (document.body.dataset.page === "profile") {
  const profile = getProfile().profile || {};
  const mobileStatus = localStorage.getItem("lendswift.mobileVerified") === "true";
  document.querySelectorAll("[data-profile]").forEach((field) => {
    const key = field.dataset.profile;
    field.textContent = profile[key] || "Not available";
  });
  const banner = document.querySelector("[data-mobile-status]");
  if (banner) {
    if (mobileStatus) {
      banner.innerHTML = `<strong>Mobile verified.</strong> Your profile is now complete and ready for login.`;
      banner.classList.add("status-success");
    } else {
      banner.innerHTML = `<strong>Mobile verification pending.</strong> Verify your number to complete the profile.`;
    }
  }
}

const sendOtpForm = document.querySelector("[data-send-otp-form]");
const verifyOtpForm = document.querySelector("[data-verify-otp-form]");

if (sendOtpForm) {
  const status = document.querySelector("[data-send-status]");
  sendOtpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const mobile = new FormData(sendOtpForm).get("mobile");
    localStorage.setItem("lendswift.mobile", mobile);
    setStatus(status, "Sending OTP...");
    try {
      const response = await sendSecureRequest(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send OTP");
      const devNote = result.dev_otp ? ` Dev OTP: ${result.dev_otp}` : "";
      setStatus(status, `OTP sent successfully.${devNote}`, "success");
    } catch (error) {
      setStatus(status, error.message, "error");
    }
  });
}

if (verifyOtpForm) {
  const status = document.querySelector("[data-verify-status]");
  verifyOtpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const otp = new FormData(verifyOtpForm).get("otp");
    const mobile = localStorage.getItem("lendswift.mobile");
    setStatus(status, "Verifying OTP...");
    try {
      const response = await sendSecureRequest(`${API_BASE}/auth/mobile-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "OTP verification failed");
      localStorage.setItem("lendswift.mobileVerified", "true");
      setStatus(status, `${result.message}. Redirecting to profile...`, "success");
      window.setTimeout(() => {
        window.location.href = "profile.html";
      }, 900);
    } catch (error) {
      setStatus(status, error.message, "error");
    }
  });
}
