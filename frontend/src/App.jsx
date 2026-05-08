import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Wizard from './components/Wizard.jsx';
import { loanApplicationSchema } from './utils/validation.js';
import { useAutoSave } from './hooks/useAutoSave.js';
import Modal from './components/Modal.jsx';

const INITIAL_VALUES = {
  loanType: 'Personal',
  loanAmount: 500000,
  tenureMonths: 60,
  fullName: '',
  dob: '',
  pan: '',
  mobile: '',
  aadhaar: '',
  pinCode: '',
  addressLine: '',
  city: '',
  state: '',
  employmentStatus: 'Salaried',
  monthlyIncome: '',
  companyName: '',
  businessNature: '',
  coApplicantRequired: false,
  coApplicantName: '',
  coApplicantRelationship: '',
  documents: [],
  signature: '',
  consentTerms: false,
  consentCredit: false,
};

function App() {
  const [draftPending, setDraftPending] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [loadedDraft, setLoadedDraft] = useState(null);
  const [submission, setSubmission] = useState(null);

  const form = useForm({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: INITIAL_VALUES,
    mode: 'onTouched',
  });

  const loanType = form.watch('loanType');
  const draftKey = useMemo(() => `lendswift_draft_${loanType}`, [loanType]);

  useAutoSave({
    form,
    storageKey: draftKey,
    onDraftFound: (draft) => {
      setDraftPending(true);
      setLoadedDraft(draft);
    },
  });

  useEffect(() => {
    if (loadedDraft && draftPending) {
      return;
    }
  }, [loadedDraft, draftPending]);

  function handleResume() {
    if (loadedDraft) {
      form.reset(loadedDraft);
      setIsResuming(true);
      setDraftPending(false);
    }
  }

  function handleStartFresh() {
    form.reset(INITIAL_VALUES);
    setDraftPending(false);
    setLoadedDraft(null);
    localStorage.removeItem(draftKey);
  }

  function handleSubmission(result) {
    setSubmission(result);
    setDraftPending(false);
    localStorage.removeItem(draftKey);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <span className="brand-mark">LS</span>
          <h1>LendSwift Loan Wizard</h1>
        </div>
      </header>

      <main className="app-content">
        <Wizard form={form} onSubmit={handleSubmission} />
      </main>

      {draftPending && (
        <Modal title="Resume your draft application" onClose={handleStartFresh}>
          <p>A saved application draft exists for the selected loan type.</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={handleStartFresh}>
              Start fresh
            </button>
            <button className="btn btn-primary" type="button" onClick={handleResume}>
              Resume draft
            </button>
          </div>
        </Modal>
      )}

      {submission && (
        <Modal title="Application submitted" onClose={() => setSubmission(null)}>
          <p>Your application ID is <strong>{submission.applicationId}</strong>.</p>
          <p>Pre-approval status: <strong>{submission.approvalStatus}</strong></p>
          <p>We have captured your loan details and e-signature for final review.</p>
          <button className="btn btn-primary" type="button" onClick={() => setSubmission(null)}>
            Close
          </button>
        </Modal>
      )}
    </div>
  );
}

export default App;
