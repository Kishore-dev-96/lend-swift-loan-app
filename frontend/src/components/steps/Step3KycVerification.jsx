function Step3KycVerification({ form, loanType }) {
  const { register, formState } = form;

  return (
    <div className="wizard-panel">
      <div className="field-grid">
        <label className="field">
          <span>PAN number</span>
          <input type="text" {...register('pan')} maxLength="10" placeholder="ABCDE1234F" />
          <small>{formState.errors.pan?.message}</small>
        </label>

        <label className="field">
          <span>Aadhaar number</span>
          <input type="text" {...register('aadhaar')} maxLength="12" placeholder="123412341234" />
          <small>{formState.errors.aadhaar?.message}</small>
        </label>
      </div>

      <div className="wizard-note">
        {loanType === 'Business' ? (
          <p>Business loans require PAN with entity type P, C, or F. Aadhaar must pass checksum verification.</p>
        ) : (
          <p>Personal loans require PAN with entity type P and valid Aadhaar number.</p>
        )}
      </div>
    </div>
  );
}

export default Step3KycVerification;
