import { useEffect } from 'react';

function Step1LoanType({ form, onNext }) {
  const { register, formState, setValue, watch, trigger } = form;
  const loanType = watch('loanType');

  useEffect(() => {
    setValue('loanType', loanType || 'Personal');
  }, [loanType, setValue]);

  async function handleContinue() {
    const valid = await trigger(['loanType', 'loanAmount', 'tenureMonths']);
    if (valid) onNext();
  }

  return (
    <div className="wizard-panel">
      <div className="field-grid">
        <label className="field">
          <span>Loan Type</span>
          <select {...register('loanType')}>
            <option value="Personal">Personal Loan</option>
            <option value="Home">Home Loan</option>
            <option value="Business">Business Loan</option>
          </select>
          <small>{formState.errors.loanType?.message}</small>
        </label>

        <label className="field">
          <span>Loan Amount (INR)</span>
          <input type="number" {...register('loanAmount', { valueAsNumber: true })} min="50000" />
          <small>{formState.errors.loanAmount?.message}</small>
        </label>

        <label className="field">
          <span>Tenure (months)</span>
          <input type="number" {...register('tenureMonths', { valueAsNumber: true })} min="6" />
          <small>{formState.errors.tenureMonths?.message}</small>
        </label>
      </div>
      <button className="btn btn-secondary" type="button" onClick={handleContinue}>
        Continue to personal info
      </button>
    </div>
  );
}

export default Step1LoanType;
