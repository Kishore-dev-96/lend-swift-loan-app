export function calculateEmi(principal, annualRate, months) {
  const amount = Number(principal);
  const rate = Number(annualRate);
  const tenure = Number(months);

  if (!amount || !rate || !tenure) return 0;

  const monthlyRate = rate / 12 / 100;
  const factor = (1 + monthlyRate) ** tenure;
  return Math.round((amount * monthlyRate * factor) / (factor - 1));
}

export function formatInr(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getAffordability(formData) {
  const emi = calculateEmi(formData.loanAmount, formData.interestRate, formData.tenure);
  const income = Number(formData.monthlyIncome || 0);
  const existingEmi = Number(formData.existingEmi || 0);

  if (!emi || !income) {
    return {
      emi,
      level: "neutral",
      title: "Enter loan details",
      copy: "We will estimate EMI once amount, tenure, rate, and income are available.",
    };
  }

  const obligationRatio = ((emi + existingEmi) / income) * 100;

  if (obligationRatio <= 40) {
    return {
      emi,
      level: "good",
      title: "Looks affordable",
      copy: `Estimated obligations are ${Math.round(obligationRatio)}% of monthly income, within the preferred range.`,
    };
  }

  if (obligationRatio <= 50) {
    return {
      emi,
      level: "warn",
      title: "Borderline affordability",
      copy: `Estimated obligations are ${Math.round(obligationRatio)}% of income. A lower amount or longer tenure may help.`,
    };
  }

  return {
    emi,
    level: "risk",
    title: "High EMI pressure",
    copy: `Estimated obligations are ${Math.round(obligationRatio)}% of income, above the common 50% threshold.`,
  };
}
