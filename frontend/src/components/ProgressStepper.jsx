function ProgressStepper({ labels, currentStep, visibleSteps }) {
  return (
    <div className="stepper" aria-label="Application progress">
      {visibleSteps.map((step, index) => (
        <div key={step} className={`stepper-item ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}>
          <span>{index + 1}</span>
          <p>{labels[step]}</p>
        </div>
      ))}
    </div>
  );
}

export default ProgressStepper;
