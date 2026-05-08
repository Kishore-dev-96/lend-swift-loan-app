import { z } from 'zod';

const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export const loanApplicationSchema = z.object({
  loanType: z.enum(['Personal', 'Home', 'Business']),
  loanAmount: z.number().min(50000, 'Loan amount must be at least ₹50,000.'),
  tenureMonths: z.number().min(6, 'Tenure must be at least 6 months.').max(360, 'Tenure cannot exceed 360 months.'),
  fullName: z.string().min(2, 'Full name is required.'),
  dob: z.string().refine((value) => Boolean(value), 'Date of birth is required.'),
  email: z.string().email('Enter a valid email address.'),
  mobile: z.string().refine((value) => validateMobile(value), 'Enter a valid 10-digit Indian mobile number.'),
  pan: z.string().refine((value) => panPattern.test(value.toUpperCase()), 'PAN must use format AAAAA9999A.').superRefine((value, ctx) => {
    if (!value) return;
    const normalized = value.toUpperCase();
    const fourth = normalized[3];
    if (ctx.parent.loanType === 'Personal' && fourth !== 'P') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Personal loans require a PAN fourth character of P.' });
    }
    if (ctx.parent.loanType === 'Business' && !['P', 'C', 'F'].includes(fourth)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Business loans require PAN fourth character P, C, or F.' });
    }
  }),
  aadhaar: z.string().refine((value) => value.length === 12 && validateAadhaar(value), 'Aadhaar must be 12 digits and pass checksum validation.'),
  pinCode: z.string().refine((value) => /^[1-9][0-9]{5}$/.test(value), 'Enter a valid 6-digit PIN code.'),
  addressLine: z.string().min(10, 'Please enter a full address.'),
  city: z.string().min(2, 'City is required.'),
  state: z.string().min(2, 'State is required.'),
  employmentStatus: z.enum(['Salaried', 'Self-employed', 'Business', 'Unemployed']),
  monthlyIncome: z.number().min(1000, 'Income must be at least ₹1,000.'),
  companyName: z.string().optional(),
  businessNature: z.string().optional(),
  coApplicantRequired: z.union([z.literal(true), z.literal(false), z.string()]).optional(),
  coApplicantName: z.string().optional(),
  coApplicantRelationship: z.string().optional(),
  documents: z.array(z.any()).min(1, 'At least one supporting document is required.'),
  signature: z.string().min(1, 'Signature is required.'),
  consentTerms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms.' }) }),
  consentCredit: z.literal(true, { errorMap: () => ({ message: 'Credit consent is required.' }) }),
}).superRefine((data, ctx) => {
  const age = calculateAge(data.dob);
  if (age < 18) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dob'], message: 'Applicant must be at least 18 years old.' });
  }
  if (age + data.tenureMonths / 12 > 65) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tenureMonths'], message: 'Age plus loan tenure must not exceed 65 years.' });
  }
  if (data.loanType === 'Business' && !['Business', 'Self-employed'].includes(data.employmentStatus)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['employmentStatus'], message: 'Business loans are only available to business or self-employed applicants.' });
  }
  if ((data.coApplicantRequired === true || data.coApplicantRequired === 'true') && !data.coApplicantName) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['coApplicantName'], message: 'Co-applicant name is required.' });
  }
});

export function validateMobile(value) {
  return /^[6-9][0-9]{9}$/.test(value);
}

export function validateAadhaar(number) {
  const digits = number.split('').map(Number);
  if (digits.length !== 12 || digits.some((digit) => Number.isNaN(digit))) return false;
  const d = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,2,3,4,0,6,7,8,9,5],
    [2,3,4,0,1,7,8,9,5,6],
    [3,4,0,1,2,8,9,5,6,7],
    [4,0,1,2,3,9,5,6,7,8],
    [5,9,8,7,6,0,4,3,2,1],
    [6,5,9,8,7,1,0,4,3,2],
    [7,6,5,9,8,2,1,0,4,3],
    [8,7,6,5,9,3,2,1,0,4],
    [9,8,7,6,5,4,3,2,1,0]
  ];
  const p = [0,1,2,3,4,5,6,7,8,9];
  const inv = [0,4,3,2,1,5,6,7,8,9];
  let c = 0;
  for (let i = digits.length - 1, j = 0; i >= 0; i -= 1, j += 1) {
    c = d[c][(digits[i] + p[j % 10]) % 10];
  }
  return c === 0;
}

export function calculateAge(dob) {
  if (!dob) return 0;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

const PIN_LOOKUP = {
  '560001': { city: 'Bengaluru', state: 'Karnataka' },
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '110001': { city: 'New Delhi', state: 'Delhi' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
};

export function zipCodeLookup(pin) {
  return PIN_LOOKUP[pin] || null;
}
