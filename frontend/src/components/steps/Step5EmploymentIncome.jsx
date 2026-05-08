import { useMemo } from 'react';

function Step5EmploymentIncome({ form, loanType, emi }) {
  const { register, watch, formState } = form;
  const employmentStatus = watch('employmentStatus');
  const monthlyIncome = Number(watch('monthlyIncome') || 0);
  const incomeRatio = monthlyIncome ? ((emi || 0) / monthlyIncome) * 100 : 0;

  const showWarning = incomeRatio > 50;

  return (
    <div className="wizard-panel">
      <div className="field-grid">
        <label className="field">
          <span>Employment status</span>
          <select {...register('employmentStatus')}>
            <option value="Salaried">Salaried</option>
            <option value="Self-employed">Self-employed</option>
            <option value="Business">Business</option>
            <option value="Unemployed">Unemployed</option>
          </select>
          <small>{formState.errors.employmentStatus?.message}</small>
        </label>

        <label className="field">
          <span>Monthly income</span>
          <input type="number" {...register('monthlyIncome', { valueAsNumber: true })} />
          <small>{formState.errors.monthlyIncome?.message}</small>
        </label>
      </div>

      {employmentStatus === 'Salaried' && (
        <label className="field">
          <span>Employer / company</span>
          <input type="text" {...register('companyName')} />
          <small>{formState.errors.companyName?.message}</small>
        </label>
      )}

      {employmentStatus !== 'Salaried' && (
        <label className="field">
          <span>Business nature</span>
          <input type="text" {...register('businessNature')} placeholder="e.g. Retail, IT services" />
          <small>{formState.errors.businessNature?.message}</small>
        </label>
      )}

      {loanType === 'Business' && (
        <div className="wizard-note">
          <strong>Business loan selected:</strong> only Business or Self-employed profiles are permitted.
        </div>
      )}

      {showWarning && (
        <div className="wizard-warning">
          EMI is more than 50% of monthly income. Review income or tenure before submitting.
        </div>
      )}
    </div>
  );
}

export default Step5EmploymentIncome;
