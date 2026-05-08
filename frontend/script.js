const navbar = document.querySelector("[data-navbar]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
const applyButton = document.querySelector("[data-apply-button]");
const links = [...document.querySelectorAll(".nav-links a[href^='#']")];
const sections = links
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const revealItems = document.querySelectorAll(".reveal");
const loanForm = document.querySelector("[data-loan-form]");
const wizardForm = document.querySelector("[data-wizard-form]");

function closeMenu() {
  if (!navLinks || !menuToggle) return;
  document.body.classList.remove("menu-open");
  navLinks.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

links.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

if (applyButton) {
  applyButton.addEventListener("click", () => {
    applyButton.style.transform = "scale(0.98)";
    window.setTimeout(() => {
      window.location.href = "loan.html";
    }, 160);
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 },
);

revealItems.forEach((item) => revealObserver.observe(item));

if (sections.length) {
  const activeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    {
      rootMargin: "-40% 0px -52% 0px",
      threshold: 0,
    },
  );

  sections.forEach((section) => activeObserver.observe(section));
}

window.addEventListener("scroll", () => {
  if (navbar) navbar.classList.toggle("scrolled", window.scrollY > 20);
});

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function analyzeLoan(data) {
  const income = Number(data.get("income"));
  const creditScore = Number(data.get("creditScore"));
  const loanAmount = Number(data.get("loanAmount"));
  const employmentStatus = data.get("employmentStatus");
  const incomeCapacity = Math.min(35, (income / 100000) * 35);
  const scoreCapacity = Math.min(40, Math.max(0, ((creditScore - 300) / 600) * 40));
  const amountPressure = Math.max(0, 15 - (loanAmount / Math.max(income * 18, 1)) * 15);
  const employmentBoost = {
    salaried: 10,
    "self-employed": 8,
    student: 4,
    unemployed: 1,
  }[employmentStatus] || 0;
  const eligibility = Math.max(8, Math.min(96, Math.round(incomeCapacity + scoreCapacity + amountPressure + employmentBoost)));

  let risk = "High";
  let riskClass = "risk-high";
  if (eligibility >= 76) {
    risk = "Low";
    riskClass = "risk-low";
  } else if (eligibility >= 52) {
    risk = "Medium";
    riskClass = "risk-medium";
  }

  const suggestedAmount = Math.max(50000, Math.min(loanAmount, income * 12));
  const options = [
    `${formatCurrency(suggestedAmount)} personal loan with 24-36 month tenure`,
    `${formatCurrency(Math.round(suggestedAmount * 0.7))} safer approval option with lower EMI pressure`,
    creditScore >= 720 ? "Priority interest-rate review for strong credit profile" : "Improve credit score above 720 for better offers",
  ];

  return {
    eligibility,
    risk,
    riskClass,
    probability: eligibility >= 76 ? "Strong" : eligibility >= 52 ? "Moderate" : "Needs improvement",
    options,
  };
}

if (loanForm) {
  const emptyState = document.querySelector("[data-analysis-empty]");
  const loadingState = document.querySelector("[data-analysis-loading]");
  const resultState = document.querySelector("[data-analysis-result]");
  const score = document.querySelector("[data-score]");
  const scoreBar = document.querySelector("[data-score-bar]");
  const risk = document.querySelector("[data-risk]");
  const probability = document.querySelector("[data-probability]");
  const options = document.querySelector("[data-options]");

  loanForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(loanForm);

    emptyState.classList.add("hidden");
    resultState.classList.add("hidden");
    loadingState.classList.remove("hidden");

    window.setTimeout(() => {
      const analysis = analyzeLoan(data);
      score.textContent = `${analysis.eligibility}%`;
      scoreBar.style.width = `${analysis.eligibility}%`;
      risk.textContent = analysis.risk;
      risk.className = analysis.riskClass;
      probability.textContent = analysis.probability;
      options.innerHTML = analysis.options.map((item) => `<li>${item}</li>`).join("");

      loadingState.classList.add("hidden");
      resultState.classList.remove("hidden");
    }, 950);
  });
}

if (wizardForm) {
  const panels = [...document.querySelectorAll(".wizard-panel")];
  const prevButton = document.querySelector("[data-wizard-prev]");
  const nextButton = document.querySelector("[data-wizard-next]");
  const stepCount = document.querySelector("[data-step-count]");
  const stepTitle = document.querySelector("[data-step-title]");
  const progressBar = document.querySelector("[data-progress-bar]");
  const stepList = document.querySelector("[data-wizard-steps]");
  const resultScore = document.querySelector("[data-result-score]");
  const resultScoreBar = document.querySelector("[data-result-score-bar]");
  const resultRisk = document.querySelector("[data-result-risk]");
  const resultStatus = document.querySelector("[data-result-status]");
  const resultAmount = document.querySelector("[data-result-amount]");

  const stepLabels = {
    personal: "Personal Details",
    identity: "Identity Verification",
    loan: "Loan Details",
    additional: "Additional Details",
    analysis: "AI Analysis",
    result: "Result Section",
  };

  let currentStepIndex = 0;

  function getWizardData() {
    return new FormData(wizardForm);
  }

  function needsAdditionalStep() {
    return Number(getWizardData().get("loanAmount") || 0) > 500000;
  }

  function getFlow() {
    const flow = ["personal", "identity", "loan"];
    if (needsAdditionalStep()) flow.push("additional");
    flow.push("analysis", "result");
    return flow;
  }

  function getField(name) {
    return wizardForm.elements[name];
  }

  function setError(name, message = "") {
    const field = getField(name);
    const error = document.querySelector(`[data-error-for="${name}"]`);
    const wrapper = field?.closest(".field");

    if (error) error.textContent = message;
    if (wrapper) wrapper.classList.toggle("has-error", Boolean(message));
    if (field) field.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function requireValue(name, label) {
    const value = String(getWizardData().get(name) || "").trim();
    if (!value) {
      setError(name, `${label} is required`);
      return false;
    }
    setError(name);
    return true;
  }

  function isAtLeast21(value) {
    if (!value) return false;
    const dob = new Date(`${value}T00:00:00`);
    if (Number.isNaN(dob.getTime())) return false;

    const today = new Date();
    const threshold = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate());
    return dob <= threshold;
  }

  function validatePersonal() {
    let valid = true;
    valid = requireValue("fullName", "Full Name") && valid;
    valid = requireValue("employmentType", "Employment Type") && valid;

    const dob = String(getWizardData().get("dob") || "");
    if (!dob) {
      setError("dob", "Date of Birth is required");
      valid = false;
    } else if (!isAtLeast21(dob)) {
      setError("dob", "Applicant must be at least 21 years old");
      valid = false;
    } else {
      setError("dob");
    }

    return valid;
  }

  function validatePanValue(value) {
    const pan = String(value || "").trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      return "Invalid PAN format";
    }
    if (!["P", "C"].includes(pan[3])) {
      return "PAN 4th character must indicate entity type (P/C)";
    }
    return "";
  }

  function validateIdentity() {
    const panField = getField("pan");
    panField.value = panField.value.toUpperCase();
    const message = validatePanValue(panField.value);
    setError("pan", message);
    return !message;
  }

  function validateLoan() {
    let valid = true;
    valid = requireValue("loanType", "Loan Type") && valid;

    const numericFields = [
      ["loanAmount", "Loan Amount"],
      ["tenure", "Tenure"],
      ["monthlyIncome", "Monthly Income"],
    ];

    numericFields.forEach(([name, label]) => {
      const value = Number(getWizardData().get(name));
      if (!getWizardData().get(name)) {
        setError(name, `${label} is required`);
        valid = false;
      } else if (value <= 0) {
        setError(name, `${label} must be greater than 0`);
        valid = false;
      } else {
        setError(name);
      }
    });

    return valid;
  }

  function validateAdditional() {
    let valid = true;
    valid = requireValue("additionalIncomeSource", "Additional Income Source") && valid;

    const liabilities = getWizardData().get("existingLiabilities");
    if (liabilities === "") {
      setError("existingLiabilities", "Existing Liabilities is required");
      valid = false;
    } else if (Number(liabilities) < 0) {
      setError("existingLiabilities", "Existing Liabilities cannot be negative");
      valid = false;
    } else {
      setError("existingLiabilities");
    }

    return valid;
  }

  function validateCurrentStep() {
    const current = getFlow()[currentStepIndex];
    if (current === "personal") return validatePersonal();
    if (current === "identity") return validateIdentity();
    if (current === "loan") return validateLoan();
    if (current === "additional") return validateAdditional();
    return true;
  }

  function renderStepList(flow) {
    stepList.innerHTML = flow.map((step, index) => {
      const complete = index < currentStepIndex;
      const active = index === currentStepIndex;
      return `
        <li class="${active ? "is-active" : ""} ${complete ? "is-complete" : ""}">
          <span>${complete ? "✓" : index + 1}</span>
          ${stepLabels[step]}
        </li>
      `;
    }).join("");
  }

  function showCurrentStep(shouldScroll = false) {
    const flow = getFlow();
    if (currentStepIndex >= flow.length) currentStepIndex = flow.length - 1;
    const current = flow[currentStepIndex];

    panels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.step === current);
    });

    stepCount.textContent = `Step ${currentStepIndex + 1} of ${flow.length}`;
    stepTitle.textContent = stepLabels[current];
    progressBar.style.width = `${((currentStepIndex + 1) / flow.length) * 100}%`;
    renderStepList(flow);

    prevButton.hidden = currentStepIndex === 0 || current === "analysis";
    nextButton.hidden = current === "analysis";
    nextButton.textContent = current === "result" ? "Start New Application" : current === "additional" || current === "loan" && !needsAdditionalStep() ? "Submit for AI Analysis" : "Next";

    if (shouldScroll) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function generateWizardResult() {
    const data = getWizardData();
    const income = Number(data.get("monthlyIncome") || 0);
    const amount = Number(data.get("loanAmount") || 0);
    const liabilities = needsAdditionalStep() ? Number(data.get("existingLiabilities") || 0) : 0;
    const tenure = Number(data.get("tenure") || 1) * (data.get("tenureUnit") === "years" ? 12 : 1);
    const employmentType = data.get("employmentType");

    const incomeScore = Math.min(38, income / 2500);
    const amountRatio = amount / Math.max(income * 14, 1);
    const affordabilityScore = Math.max(8, 34 - amountRatio * 12);
    const tenureScore = tenure >= 12 && tenure <= 84 ? 12 : 7;
    const liabilityPenalty = Math.min(18, liabilities / Math.max(income, 1) * 20);
    const employmentScore = {
      salaried: 12,
      "self-employed": 10,
      student: 6,
      unemployed: 2,
    }[employmentType] || 5;

    const score = Math.max(12, Math.min(96, Math.round(incomeScore + affordabilityScore + tenureScore + employmentScore - liabilityPenalty)));
    let risk = "High";
    let riskClass = "risk-high";
    let status = "Rejected";
    let statusClass = "status-rejected";

    if (score >= 76) {
      risk = "Low";
      riskClass = "risk-low";
      status = "Approved";
      statusClass = "status-approved";
    } else if (score >= 52) {
      risk = "Medium";
      riskClass = "risk-medium";
      status = "Review";
      statusClass = "status-review";
    }

    const suggested = Math.round(Math.min(amount, income * (score >= 76 ? 14 : score >= 52 ? 9 : 4)) / 1000) * 1000;

    resultScore.textContent = `${score}%`;
    resultScoreBar.style.width = `${score}%`;
    resultRisk.textContent = risk;
    resultRisk.className = riskClass;
    resultStatus.textContent = status;
    resultStatus.className = statusClass;
    resultAmount.textContent = formatCurrency(Math.max(0, suggested));
  }

  function startAnalysis() {
    const flow = getFlow();
    currentStepIndex = flow.indexOf("analysis");
    showCurrentStep(true);

    window.setTimeout(() => {
      generateWizardResult();
      currentStepIndex = getFlow().indexOf("result");
      showCurrentStep(true);
    }, 1200);
  }

  nextButton.addEventListener("click", () => {
    const flow = getFlow();
    const current = flow[currentStepIndex];

    if (current === "result") {
      wizardForm.reset();
      document.querySelectorAll(".field.has-error").forEach((field) => field.classList.remove("has-error"));
      document.querySelectorAll("[data-error-for]").forEach((error) => {
        error.textContent = "";
      });
      currentStepIndex = 0;
      showCurrentStep(true);
      return;
    }

    if (!validateCurrentStep()) return;

    const nextFlow = getFlow();
    const nextStep = nextFlow[currentStepIndex + 1];
    if (nextStep === "analysis") {
      startAnalysis();
      return;
    }

    currentStepIndex += 1;
    showCurrentStep(true);
  });

  prevButton.addEventListener("click", () => {
    currentStepIndex = Math.max(0, currentStepIndex - 1);
    showCurrentStep(true);
  });

  wizardForm.addEventListener("input", (event) => {
    if (event.target.matches("[data-uppercase='true']")) {
      event.target.value = event.target.value.toUpperCase();
    }
    if (event.target.name === "loanAmount") {
      showCurrentStep();
    }
  });

  wizardForm.addEventListener("blur", (event) => {
    if (!event.target.name) return;
    const current = getFlow()[currentStepIndex];
    const namesByStep = {
      personal: ["fullName", "dob", "employmentType"],
      identity: ["pan"],
      loan: ["loanType", "loanAmount", "tenure", "monthlyIncome"],
      additional: ["additionalIncomeSource", "existingLiabilities"],
    };
    if (namesByStep[current]?.includes(event.target.name)) validateCurrentStep();
  }, true);

  showCurrentStep();
}
