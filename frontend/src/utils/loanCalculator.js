export function getLoanRates(loanType) {
  switch (loanType) {
    case 'Home':
      return 8.5;
    case 'Business':
      return 14.0;
    default:
      return 10.5;
  }
}

export function calculateEmi(principal, annualRate, months) {
  const r = annualRate / 100 / 12;
  if (!principal || !months || r <= 0) {
    return { emi: 0, totalRepayment: 0, processingFee: 0 };
  }
  const powerTerm = Math.pow(1 + r, months);
  const emi = principal * r * powerTerm / (powerTerm - 1);
  const totalRepayment = emi * months;
  const processingFee = Math.min(Math.max(principal * 0.01, 2000), 25000);
  return { emi: Math.round(emi), totalRepayment: Math.round(totalRepayment), processingFee: Math.round(processingFee) };
}
