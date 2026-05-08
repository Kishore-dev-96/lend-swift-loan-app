import { clearDraft, formatSaveTime, loadDraft, saveDraft } from "./autosave.js";
import { renderAssistant, answerQuestion } from "./ai-chat.js";
import { formatInr, getAffordability } from "./emi.js";
import { getFormData, validateField, validateStep } from "./validation.js";

const steps = [
  { id: 1, name: "Identity" },
  { id: 2, name: "Loan" },
  { id: 3, name: "Income" },
  { id: 4, name: "Address" },
  { id: 5, name: "Documents" },
  { id: 6, name: "Consent" },
  { id: 7, name: "Signature" },
  { id: 8, name: "Review" },
];

const pincodeMap = {
  110001: { city: "New Delhi", state: "Delhi" },
  400001: { city: "Mumbai", state: "Maharashtra" },
  560001: { city: "Bengaluru", state: "Karnataka" },
  600001: { city: "Chennai", state: "Tamil Nadu" },
  700001: { city: "Kolkata", state: "West Bengal" },
  500001: { city: "Hyderabad", state: "Telangana" },
  380001: { city: "Ahmedabad", state: "Gujarat" },
  302001: { city: "Jaipur", state: "Rajasthan" },
};

const form = document.querySelector("#loan-form");
const stepList = document.querySelector("[data-step-list]");
const progressPercent = document.querySelector("[data-progress-percent]");
const autosaveStatus = document.querySelector("[data-autosave-status]");
const resumeBanner = document.querySelector("[data-resume-banner]");
const assistantFeed = document.querySelector("[data-assistant-feed]");
const assistantForm = document.querySelector("[data-assistant-form]");

let currentStep = 1;
let completedSteps = new Set();
let pendingDraft = null;
let fontScale = 1;

function setStatus(message) {
  autosaveStatus.textContent = message;
}

function renderStepList() {
  stepList.innerHTML = steps.map((step) => `
    <li>
      <button type="button" data-step-target="${step.id}" ${step.id === currentStep ? 'aria-current="step"' : ""} class="${completedSteps.has(step.id) ? "is-complete" : ""}">
        <span class="step-number">${completedSteps.has(step.id) ? "✓" : step.id}</span>
        <span class="step-name">${step.name}</span>
      </button>
    </li>
  `).join("");
}

function showStep(step) {
  currentStep = Math.min(Math.max(step, 1), steps.length);
  document.querySelectorAll(".form-step").forEach((section) => {
    section.classList.toggle("active", Number(section.dataset.step) === currentStep);
  });

  document.querySelector('[data-action="previous"]').disabled = currentStep === 1;
  document.querySelector('[data-action="next"]').textContent = currentStep === steps.length ? "Submit application" : "Continue";
  progressPercent.textContent = `${Math.round((currentStep / steps.length) * 100)}%`;
  renderStepList();
  updateDerivedViews();
  renderAssistant(assistantFeed, currentStep, getFormData(form));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function evaluateCondition(expression, formData) {
  const [field, value] = expression.split(":");
  return String(formData[field]) === value;
}

function updateConditionals() {
  const formData = getFormData(form);
  document.querySelectorAll("[data-show-if]").forEach((element) => {
    const visible = evaluateCondition(element.dataset.showIf, formData);
    element.classList.toggle("hidden", !visible);
  });
}

function updatePincode() {
  const pin = form.elements.pincode?.value;
  const match = pincodeMap[pin];
  const hint = document.querySelector("[data-pincode-hint]");

  if (!pin || pin.length !== 6) return;

  if (match) {
    form.elements.city.value = match.city;
    form.elements.state.value = match.state;
    hint.textContent = `Matched ${match.city}, ${match.state}.`;
  } else {
    hint.textContent = "Unknown demo PIN. You can enter city and state manually.";
  }
}

function updateAffordability() {
  const formData = getFormData(form);
  const affordability = getAffordability(formData);
  const panel = document.querySelector("[data-affordability]");
  const title = document.querySelector("[data-affordability-title]");
  const copy = document.querySelector("[data-affordability-copy]");
  const output = document.querySelector("[data-emi-output]");

  panel.classList.remove("good", "warn", "risk");
  if (affordability.level !== "neutral") panel.classList.add(affordability.level);
  title.textContent = affordability.title;
  copy.textContent = affordability.copy;
  output.textContent = affordability.emi ? `EMI: ${formatInr(affordability.emi)}` : "EMI: --";
}

function getDocumentItems(formData) {
  const items = [
    ["PAN card", "Identity verification for all loan types."],
    ["Aadhaar or address proof", "KYC and address verification."],
    ["Bank statement", "Recent transaction history for repayment assessment."],
  ];

  if (formData.employmentType === "salaried") {
    items.push(["Salary slips", "Last 3 months of salary proof."]);
    items.push(["Form 16", "Tax and employer income confirmation."]);
  }

  if (formData.employmentType === "self-employed") {
    items.push(["GST certificate", "Business registration and tax identity."]);
    items.push(["ITR documents", "Recent income tax returns for underwriting."]);
  }

  if (formData.loanType === "home") {
    items.push(["Property papers", "Sale deed, allotment letter, or construction estimate."]);
  }

  if (formData.loanType === "business") {
    items.push(["Business proof", "Registration certificate, shop license, or Udyam details."]);
  }

  return items;
}

function updateDocumentChecklist() {
  const target = document.querySelector("[data-document-checklist]");
  const items = getDocumentItems(getFormData(form));
  target.innerHTML = items.map(([title, copy]) => `
    <article class="document-card">
      <span>✓</span>
      <div>
        <strong>${title}</strong>
        <p>${copy}</p>
      </div>
    </article>
  `).join("");
}

function updateCoApplicantHint() {
  const hint = document.querySelector("[data-coapplicant-hint]");
  const amount = Number(form.elements.loanAmount?.value || 0);
  const loanType = getFormData(form).loanType;

  if (amount > 1000000 || loanType === "home") {
    hint.textContent = "A co-applicant section should activate for higher-value or home loan applications.";
    return;
  }

  hint.textContent = "No co-applicant appears required yet.";
}

function updateSummary() {
  const data = getFormData(form);
  const affordability = getAffordability(data);
  const summary = document.querySelector("[data-summary]");
  const rows = [
    ["Applicant", data.fullName || "--"],
    ["Loan type", data.loanType || "--"],
    ["Loan amount", data.loanAmount ? formatInr(data.loanAmount) : "--"],
    ["Tenure", data.tenure ? `${data.tenure} months` : "--"],
    ["Estimated EMI", affordability.emi ? formatInr(affordability.emi) : "--"],
    ["Monthly income", data.monthlyIncome ? formatInr(data.monthlyIncome) : "--"],
    ["Affordability", affordability.title],
    ["KFS note", "Review total cost, fees, cooling-off period, and grievance officer before final submission."],
  ];

  summary.innerHTML = rows.map(([label, value]) => `
    <article class="summary-card">
      <strong>${label}</strong>
      <span>${value}</span>
    </article>
  `).join("");
}

function updateDerivedViews() {
  updateConditionals();
  updatePincode();
  updateAffordability();
  updateDocumentChecklist();
  updateCoApplicantHint();
  updateSummary();
}

async function persistDraft() {
  const timestamp = await saveDraft(getFormData(form), currentStep);
  setStatus(formatSaveTime(timestamp));
}

function setFormData(data) {
  Object.entries(data || {}).forEach(([name, value]) => {
    const fields = form.querySelectorAll(`[name="${CSS.escape(name)}"]`);
    fields.forEach((field) => {
      if (field.type === "radio") {
        field.checked = field.value === value;
      } else if (field.type === "checkbox") {
        field.checked = Boolean(value);
      } else {
        field.value = value;
      }
    });
  });
}

async function goNext() {
  const stepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
  const errors = validateStep(stepElement, form);

  if (errors.length) {
    errors[0].field.focus();
    renderAssistant(assistantFeed, currentStep, getFormData(form));
    return;
  }

  completedSteps.add(currentStep);
  await persistDraft();

  if (currentStep === steps.length) {
    clearDraft();
    setStatus("Application submitted locally for demo");
    document.querySelector('[data-action="next"]').disabled = true;
    return;
  }

  showStep(currentStep + 1);
}

function bindEvents() {
  form.addEventListener("input", (event) => {
    if (event.target.matches("input, select, textarea")) {
      updateDerivedViews();
    }
  });

  form.addEventListener("change", (event) => {
    if (event.target.matches("input, select, textarea")) {
      updateDerivedViews();
      renderAssistant(assistantFeed, currentStep, getFormData(form));
    }
  });

  form.addEventListener("blur", (event) => {
    if (event.target.matches("input, select, textarea")) {
      validateField(event.target, getFormData(form));
    }
  }, true);

  document.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    const stepTarget = event.target.closest("[data-step-target]")?.dataset.stepTarget;

    if (stepTarget) {
      showStep(Number(stepTarget));
      return;
    }

    if (action === "next") await goNext();
    if (action === "previous") showStep(currentStep - 1);
    if (action === "save") await persistDraft();
    if (action === "contrast") document.body.classList.toggle("high-contrast");
    if (action === "font-up") {
      fontScale = Math.min(fontScale + 0.08, 1.32);
      document.documentElement.style.setProperty("--font-scale", fontScale);
    }
    if (action === "font-down") {
      fontScale = Math.max(fontScale - 0.08, 0.88);
      document.documentElement.style.setProperty("--font-scale", fontScale);
    }
    if (action === "resume" && pendingDraft) {
      setFormData(pendingDraft.formData);
      resumeBanner.classList.add("hidden");
      showStep(pendingDraft.currentStep || 1);
    }
    if (action === "start-fresh") {
      clearDraft();
      pendingDraft = null;
      resumeBanner.classList.add("hidden");
      form.reset();
      showStep(1);
    }
  });

  assistantForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = assistantForm.elements.question;
    const question = input.value.trim();
    if (!question) return;

    const reply = answerQuestion(question, getFormData(form));
    assistantFeed.insertAdjacentHTML("beforeend", `
      <article class="assistant-message user"><strong>You</strong><p>${question}</p></article>
      <article class="assistant-message"><strong>LendSwift</strong><p>${reply}</p></article>
    `);
    input.value = "";
    assistantFeed.scrollTop = assistantFeed.scrollHeight;
  });

  setInterval(() => {
    persistDraft().catch(() => setStatus("Auto-save could not complete"));
  }, 30000);
}

async function init() {
  bindEvents();
  pendingDraft = await loadDraft();

  if (pendingDraft) {
    resumeBanner.classList.remove("hidden");
    setStatus(formatSaveTime(pendingDraft.savedAt));
  }

  showStep(1);
}

init();
