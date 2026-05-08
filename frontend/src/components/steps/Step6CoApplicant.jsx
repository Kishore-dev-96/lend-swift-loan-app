function Step6CoApplicant({ form, shouldShow }) {
  const { register, watch, formState } = form;
  const needsCoApplicant = watch('coApplicantRequired');

  if (!shouldShow) {
    return (
      <div className="wizard-panel">
        <p className="wizard-note">No co-applicant needed for this loan configuration.</p>
      </div>
    );
  }

  return (
    <div className="wizard-panel">
      <label className="field field-inline">
        <span>Include co-applicant?</span>
        <select {...register('coApplicantRequired')}>
          <option value={false}>No</option>
          <option value={true}>Yes</option>
        </select>
      </label>

      {needsCoApplicant === 'true' || needsCoApplicant === true ? (
        <div className="field-grid">
          <label className="field">
            <span>Co-applicant name</span>
            <input type="text" {...register('coApplicantName')} />
            <small>{formState.errors.coApplicantName?.message}</small>
          </label>

          <label className="field">
            <span>Relationship</span>
            <input type="text" {...register('coApplicantRelationship')} />
            <small>{formState.errors.coApplicantRelationship?.message}</small>
          </label>
        </div>
      ) : (
        <p className="wizard-note">A co-applicant can strengthen your approval if the loan size is large.</p>
      )}
    </div>
  );
}

export default Step6CoApplicant;
