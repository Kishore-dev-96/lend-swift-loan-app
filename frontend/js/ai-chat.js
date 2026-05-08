const stepGuidance = {
  1: "Use names exactly as they appear on PAN and Aadhaar. This avoids verification mismatch later.",
  2: "Loan amount, tenure, and rate decide EMI. If EMI crosses half of income, approval likelihood usually drops.",
  3: "Employment type changes the document list. Salaried borrowers need salary slips; self-employed applicants need ITR and GST evidence.",
  4: "A stable address history helps underwriting. PIN code lookup is included to reduce typing errors.",
  5: "Documents should be uploaded as PDF, JPG, or PNG. The final build will compress images before upload.",
  6: "RBI-aligned consent should be granular. Each checkbox asks for one specific permission.",
  7: "The signature should be clear and captured as an image, then shown in review before submission.",
  8: "Review includes loan amount, EMI, total cost, fees, cooling-off disclosure, and grievance details.",
};

export function renderAssistant(feed, currentStep, formData = {}) {
  const loanType = formData.loanType || "personal";
  const employment = formData.employmentType || "your employment type";

  feed.innerHTML = `
    <article class="assistant-message">
      <strong>Step guidance</strong>
      <p>${stepGuidance[currentStep]}</p>
    </article>
    <article class="assistant-message">
      <strong>Personalized checklist preview</strong>
      <p>For a ${loanType} loan with ${employment}, the document checklist will update before Step 5.</p>
    </article>
  `;
}

export function answerQuestion(question, formData) {
  const lower = question.toLowerCase();
  const hindi = /[\u0900-\u097F]/.test(question);
  const loanType = formData.loanType || "personal";
  const employment = formData.employmentType || "selected employment";

  if (lower.includes("document") || lower.includes("docs") || lower.includes("कागज") || lower.includes("दस्तावेज")) {
    const base = `For your ${loanType} loan, keep PAN, Aadhaar, address proof, bank statement, and income proof ready.`;
    const extra = employment === "self-employed"
      ? " Because you selected self-employed, add GST certificate and ITR for recent years."
      : employment === "salaried"
        ? " Because you selected salaried, add salary slips and employer details."
        : "";
    return hindi ? `आपके ${loanType} loan के लिए PAN, Aadhaar, address proof, bank statement और income proof तैयार रखें.${extra}` : `${base}${extra}`;
  }

  if (lower.includes("pan") || lower.includes("पैन")) {
    return hindi
      ? "PAN format पांच अक्षर, चार अंक, और एक अक्षर होता है, जैसे ABCDE1234F."
      : "PAN should contain five letters, four digits, and one final letter, for example ABCDE1234F.";
  }

  if (lower.includes("emi")) {
    return "EMI depends on loan amount, interest rate, and tenure. LendSwift flags pressure when total monthly EMI is above 50% of income.";
  }

  return hindi
    ? "मैं इस step के हिसाब से मदद कर सकता हूं. Documents, PAN, Aadhaar, EMI या address के बारे में पूछें."
    : "I can help with this step. Ask about documents, PAN, Aadhaar, EMI, address, or why a field is required.";
}
