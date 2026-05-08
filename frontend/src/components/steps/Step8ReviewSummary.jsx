import { formatCurrency } from '../../utils/formatters.js';

function Step8ReviewSummary({ form, emi, totalRepayment, processingFee, rate, onConfirm }) {
  const { watch, formState } = form;
  const values = watch();

  return (
    <div className="wizard-panel review-panel">
      <h3>Review your application</h3>

      <div className="review-grid">
        <article>
          <h4>Loan details</h4>
          <p>Type: {values.loanType}</p>
          <p>Amount: {formatCurrency(values.loanAmount)}</p>
          <p>Tenure: {values.tenureMonths} months</p>
          <p>Interest rate: {rate}%</p>
        </article>

        <article>
          <h4>Applicant</h4>
          <p>Name: {values.fullName}</p>
          <p>DOB: {values.dob}</p>
          <p>Mobile: {values.mobile}</p>
          <p>Email: {values.email}</p>
        </article>

        <article>
          <h4>Address</h4>
          <p>{values.addressLine}</p>
          <p>{values.city} – {values.state}</p>
          <p>PIN: {values.pinCode}</p>
        </article>
      </div>

      <div className="review-summary-card">
        <h4>EMI summary</h4>
        <p>Monthly EMI: <strong>{formatCurrency(emi)}</strong></p>
        <p>Total repayment: <strong>{formatCurrency(totalRepayment)}</strong></p>
        <p>Processing fee: <strong>{formatCurrency(processingFee)}</strong></p>
      </div>

      <div className="consent-grid">
        <label className="consent-field">
          <input type="checkbox" {...form.register('consentTerms')} />
          <span>I agree to the terms and conditions.</span>
        </label>
        <label className="consent-field">
          <input type="checkbox" {...form.register('consentCredit')} />
          <span>I consent to credit and eligibility verification.</span>
        </label>
        <small className="error-message">
          {formState.errors.consentTerms?.message || formState.errors.consentCredit?.message}
        </small>
      </div>

      <button className="btn btn-primary" type="submit">
        Confirm and generate application ID
      </button>
    </div>
  );
}

export default Step8ReviewSummary;
