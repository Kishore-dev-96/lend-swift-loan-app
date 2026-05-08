import { useMemo } from 'react';
import { calculateAge } from '../../utils/validation.js';

function Step2PersonalInfo({ form }) {
  const { register, formState, watch, trigger } = form;
  const dob = watch('dob');
  const age = useMemo(() => calculateAge(dob), [dob]);

  return (
    <div className="wizard-panel">
      <div className="field-grid">
        <label className="field">
          <span>Full name</span>
          <input type="text" {...register('fullName')} autoComplete="name" />
          <small>{formState.errors.fullName?.message}</small>
        </label>

        <label className="field">
          <span>Date of birth</span>
          <input type="date" {...register('dob')} />
          <small>{formState.errors.dob?.message}</small>
        </label>

        <label className="field">
          <span>Age</span>
          <input type="number" value={age > 0 ? age : ''} readOnly />
          <small>Calculated from DOB</small>
        </label>
      </div>

      <div className="field-grid">
        <label className="field">
          <span>Mobile number</span>
          <input type="tel" {...register('mobile')} placeholder="9876543210" />
          <small>{formState.errors.mobile?.message}</small>
        </label>

        <label className="field">
          <span>Email address</span>
          <input type="email" {...register('email')} autoComplete="email" />
          <small>{formState.errors.email?.message}</small>
        </label>
      </div>

      <button className="btn btn-secondary" type="button" onClick={() => trigger(['fullName', 'dob', 'mobile', 'email'])}>
        Validate personal info
      </button>
    </div>
  );
}

export default Step2PersonalInfo;
