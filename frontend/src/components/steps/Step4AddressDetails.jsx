import { useEffect } from 'react';
import { zipCodeLookup } from '../../utils/validation.js';

function Step4AddressDetails({ form }) {
  const { register, watch, setValue, formState } = form;
  const pinCode = watch('pinCode');

  useEffect(() => {
    if (pinCode && pinCode.length === 6) {
      const location = zipCodeLookup(pinCode);
      if (location) {
        setValue('city', location.city);
        setValue('state', location.state);
      }
    }
  }, [pinCode, setValue]);

  return (
    <div className="wizard-panel">
      <div className="field-grid">
        <label className="field">
          <span>PIN code</span>
          <input type="text" {...register('pinCode')} maxLength="6" placeholder="560001" />
          <small>{formState.errors.pinCode?.message}</small>
        </label>

        <label className="field">
          <span>Address line</span>
          <textarea {...register('addressLine')} rows="3" />
          <small>{formState.errors.addressLine?.message}</small>
        </label>

        <label className="field">
          <span>City</span>
          <input type="text" {...register('city')} readOnly />
          <small>{formState.errors.city?.message}</small>
        </label>

        <label className="field">
          <span>State</span>
          <input type="text" {...register('state')} readOnly />
          <small>{formState.errors.state?.message}</small>
        </label>
      </div>
    </div>
  );
}

export default Step4AddressDetails;
