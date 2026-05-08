import { useMemo, useState } from 'react';
import { formatCurrency, getLoanRates, calculateEmi } from '../utils/loanCalculator.js';
import { calculateAge, zipCodeLookup } from '../utils/validation.js';
import Step1LoanType from './steps/Step1LoanType.jsx';
import Step2PersonalInfo from './steps/Step2PersonalInfo.jsx';
import Step3KycVerification from './steps/Step3KycVerification.jsx';
import Step4AddressDetails from './steps/Step4AddressDetails.jsx';
import Step5EmploymentIncome from './steps/Step5EmploymentIncome.jsx';
import Step6CoApplicant from './steps/Step6CoApplicant.jsx';
import Step7DocumentsSignature from './steps/Step7DocumentsSignature.jsx';
import Step8ReviewSummary from './steps/Step8ReviewSummary.jsx';
import ProgressStepper from './ProgressStepper.jsx';

const STEP_LABELS = [
  'Loan type',
  'Personal information',
  'KYC verification',
  'Address details',
  'Employment & income',
  'Co-applicant',
  'Documents & e-sign',
  'Review & summary',
];

function Wizard({ form, onSubmit }) {
  const [currentStep, setCurrentStep] = useState(0);
  const values = form.watch();
  const loanType = values.loanType;
  const amount = Number(values.loanAmount || 0);
  const tenure = Number(values.tenureMonths || 0);
  const age = calculateAge(values.dob);
  const shouldShowCoApplicant = amount > 500000 || loanType === 'Home';

  const rate = getLoanRates(loanType);
  const { emi, totalRepayment, processingFee } = useMemo(
    () => calculateEmi(amount, rate, tenure),
    [amount, rate, tenure]
  );

  const visibleSteps = useMemo(() => {
    const steps = [0, 1, 2, 3, 4];
    if (shouldShowCoApplicant) steps.push(5);
    steps.push(6, 7);
    return steps;
  }, [shouldShowCoApplicant]);

  const stepIndex = visibleSteps.indexOf(currentStep);
  const totalSteps = visibleSteps.length;
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  function goNext() {
    const nextIndex = visibleSteps.indexOf(currentStep) + 1;
    if (nextIndex < visibleSteps.length) {
      setCurrentStep(visibleSteps[nextIndex]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function goBack() {
    const prevIndex = visibleSteps.indexOf(currentStep) - 1;
    if (prevIndex >= 0) {
      setCurrentStep(visibleSteps[prevIndex]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async function handleStepSubmit(data) {
    if (currentStep === visibleSteps[visibleSteps.length - 1]) {
      const applicationId = crypto.randomUUID();
      onSubmit({ applicationId, approvalStatus: 'Pre-approved', data });
      return;
    }
    goNext();
  }

  function renderStep() {
    switch (currentStep) {
      case 0:
        return <Step1LoanType form={form} onNext={goNext} />;
      case 1:
        return <Step2PersonalInfo form={form} onNext={goNext} age={age} tenure={tenure} />;
      case 2:
        return <Step3KycVerification form={form} onNext={goNext} loanType={loanType} />;
      case 3:
        return <Step4AddressDetails form={form} />;
      case 4:
        return <Step5EmploymentIncome form={form} loanType={loanType} emi={emi} />;
      case 5:
        return <Step6CoApplicant form={form} shouldShow={shouldShowCoApplicant} />;
      case 6:
        return <Step7DocumentsSignature form={form} />;
      case 7:
        return (
          <Step8ReviewSummary
            form={form}
            emi={emi}
            totalRepayment={totalRepayment}
            processingFee={processingFee}
            rate={rate}
            onConfirm={handleStepSubmit}
          />
        );
      default:
        return null;
    }
  }

  return (
    <section className="wizard-shell" aria-label="Loan application wizard">
      <div className="wizard-header">
        <div>
          <p className="eyebrow">Step {stepIndex + 1} of {totalSteps}</p>
          <h2>{STEP_LABELS[currentStep]}</h2>
        </div>
        <div className="wizard-summary-card">
          <span>Loan Summary</span>
          <strong>{formatCurrency(amount)}</strong>
          <small>{loanType || 'Personal loan'}</small>
        </div>
      </div>

      <ProgressStepper labels={STEP_LABELS} currentStep={currentStep} visibleSteps={visibleSteps} />
      <div className="wizard-progress-bar" aria-hidden="true">
        <span style={{ width: `${progress}%` }}></span>
      </div>

      <form className="wizard-form" onSubmit={form.handleSubmit(handleStepSubmit)} noValidate>
        {renderStep()}

        <div className="wizard-actions">
          <button className="btn btn-outline" type="button" onClick={goBack} disabled={stepIndex === 0}>
            Previous
          </button>
          <button className="btn btn-primary" type="submit">
            {currentStep === visibleSteps[visibleSteps.length - 1] ? 'Submit application' : 'Continue'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default Wizard;
