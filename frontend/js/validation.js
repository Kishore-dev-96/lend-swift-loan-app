const verhoeffD = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const verhoeffP = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function isVerhoeffValid(value) {
  const digits = String(value || "").replace(/\D/g, "").split("").reverse();
  let checksum = 0;

  for (let i = 0; i < digits.length; i += 1) {
    checksum = verhoeffD[checksum][verhoeffP[i % 8][Number(digits[i])]];
  }

  return checksum === 0;
}

export function normalizeValue(input) {
  if (input.type === "radio") {
    const checked = document.querySelector(`input[name="${input.name}"]:checked`);
    return checked ? checked.value : "";
  }

  if (input.type === "checkbox") return input.checked;
  return String(input.value || "").trim();
}

export function getFormData(form) {
  const data = {};
  const fields = form.querySelectorAll("input, select, textarea");

  fields.forEach((field) => {
    if (!field.name) return;
    if (field.type === "radio") {
      if (field.checked) data[field.name] = field.value;
      return;
    }
    if (field.type === "checkbox") {
      data[field.name] = field.checked;
      return;
    }
    data[field.name] = field.value.trim();
  });

  return data;
}

function isVisible(field) {
  return !field.closest(".hidden") && field.offsetParent !== null;
}

function requiredForContext(field, formData) {
  if (field.dataset.required === "true") return true;
  const name = field.name;
  if (["businessPurpose"].includes(name)) return formData.loanType === "business";
  if (["propertyValue"].includes(name)) return formData.loanType === "home";
  if (["employerName"].includes(name)) return formData.employmentType === "salaried";
  if (["gstin"].includes(name)) return formData.employmentType === "self-employed";
  if (["landHolding"].includes(name)) return formData.employmentType === "farmer";
  return false;
}

function validateByRule(field, value, formData) {
  const rule = field.dataset.validator;

  if (!rule && field.type === "email" && value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Enter a valid email address.";
  }

  switch (rule) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Enter a valid email address.";
    case "mobile":
      return /^[6-9]\d{9}$/.test(value) ? "" : "Enter a 10-digit Indian mobile number starting with 6-9.";
    case "pan":
      return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.toUpperCase()) ? "" : "PAN must look like ABCDE1234F.";
    case "aadhaar":
      if (!/^\d{12}$/.test(value)) return "Aadhaar must be exactly 12 digits.";
      return isVerhoeffValid(value) ? "" : "Aadhaar checksum did not pass. Please recheck the number.";
    case "loanAmount": {
      const amount = Number(value);
      if (amount < 50000) return "Minimum loan amount is INR 50,000.";
      if (formData.loanType === "personal" && amount > 1000000) return "Personal loans above INR 10 lakh need collateral documentation.";
      if (formData.loanType === "home" && amount > 50000000) return "Home loan demo limit is INR 5 crore.";
      return "";
    }
    case "tenure": {
      const months = Number(value);
      return months >= 6 && months <= 360 ? "" : "Tenure must be between 6 and 360 months.";
    }
    case "interestRate": {
      const rate = Number(value);
      return rate >= 6 && rate <= 30 ? "" : "Use an annual rate between 6% and 30%.";
    }
    case "monthlyIncome":
      return Number(value) >= 5000 ? "" : "Monthly income must be at least INR 5,000.";
    case "existingEmi":
      return Number(value || 0) >= 0 ? "" : "Existing EMI cannot be negative.";
    case "gstin":
      return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value.toUpperCase()) ? "" : "Enter a valid 15-character GSTIN.";
    case "propertyValue":
      return Number(value) >= Number(formData.loanAmount || 0) ? "" : "Property value should be equal to or higher than loan amount.";
    case "businessPurpose":
      return value ? "" : "Select the business purpose.";
    case "employerName":
      return value.length >= 2 ? "" : "Enter employer name.";
    case "landHolding":
      return Number(value) > 0 ? "" : "Enter land holding in acres.";
    case "pincode":
      return /^\d{6}$/.test(value) ? "" : "PIN code must be exactly 6 digits.";
    case "yearsAtAddress":
      return Number(value) >= 0 && Number(value) <= 80 ? "" : "Enter a valid number of years.";
    default:
      return "";
  }
}

export function validateField(field, formData) {
  if (!field.name || !isVisible(field)) return "";
  if (["radio", "checkbox"].includes(field.type)) return "";

  const value = normalizeValue(field);
  let message = "";

  if (requiredForContext(field, formData) && !value) {
    message = `${field.dataset.label || field.closest(".field")?.querySelector("span")?.textContent || "This field"} is required.`;
  } else if (value) {
    message = validateByRule(field, value, formData);
  }

  field.setAttribute("aria-invalid", message ? "true" : "false");
  const error = document.querySelector(`[data-error-for="${field.name}"]`);
  if (error) error.textContent = message;
  return message;
}

export function validateStep(stepElement, form) {
  const formData = getFormData(form);
  const fields = stepElement.querySelectorAll("input, select, textarea");
  const errors = [];

  fields.forEach((field) => {
    const message = validateField(field, formData);
    if (message) errors.push({ field, message });
  });

  return errors;
}
