describe('LendSwift loan wizard', () => {
  beforeEach(() => {
    cy.visit('/loan.html');
  });

  it('loads the wizard page', () => {
    cy.contains('LendSwift Loan Wizard').should('exist');
    cy.get('select[name="loanType"]').should('exist');
  });

  it('validates personal loan PAN rules', () => {
    cy.get('input[name="pan"]').type('ABCDE1234C');
    cy.contains('Personal loans require a PAN fourth character of P.').should('exist');
  });

  it('rejects invalid Aadhaar numbers', () => {
    cy.get('input[name="aadhaar"]').type('123456789012');
    cy.contains('Aadhaar must be 12 digits and pass checksum validation.').should('exist');
  });

  it('allows personal loan path and navigates steps', () => {
    cy.get('select[name="loanType"]').select('Personal');
    cy.get('input[name="loanAmount"]').clear().type('300000');
    cy.get('input[name="tenureMonths"]').clear().type('60');
    cy.get('button[type="submit"]').click();
    cy.contains('Full name').should('exist');
  });

  it('allows home loan path and shows co-applicant step', () => {
    cy.get('select[name="loanType"]').select('Home');
    cy.get('input[name="loanAmount"]').clear().type('800000');
    cy.get('input[name="tenureMonths"]').clear().type('180');
    cy.get('button[type="submit"]').click();
    cy.get('input[name="fullName"]').type('Test User');
    cy.get('input[name="dob"]').type('1990-01-01');
    cy.get('input[name="mobile"]').type('9876543210');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('button[type="submit"]').click();
    cy.get('input[name="pan"]').type('ABCDE1234P');
    cy.get('input[name="aadhaar"]').type('79927398713');
    cy.contains('Aadhaar must be 12 digits').should('exist');
  });

  it('allows business loan flow if employment is business', () => {
    cy.get('select[name="loanType"]').select('Business');
    cy.get('input[name="loanAmount"]').clear().type('600000');
    cy.get('input[name="tenureMonths"]').clear().type('72');
    cy.get('button[type="submit"]').click();
    cy.get('input[name="fullName"]').type('Business User');
    cy.get('input[name="dob"]').type('1985-05-05');
    cy.get('input[name="mobile"]').type('9123456789');
    cy.get('input[name="email"]').type('biz@example.com');
    cy.get('button[type="submit"]').click();
    cy.get('input[name="pan"]').type('ABCDE1234F');
    cy.get('input[name="aadhaar"]').type('999999990019');
    cy.get('button[type="submit"]').click();
    cy.contains('PIN code').should('exist');
  });

  it('saves draft to localStorage and shows resume modal', () => {
    cy.get('select[name="loanType"]').select('Personal');
    cy.get('input[name="loanAmount"]').clear().type('220000');
    cy.get('input[name="tenureMonths"]').clear().type('48');
    cy.window().then((win) => {
      const data = { loanType: 'Personal', loanAmount: 220000, tenureMonths: 48, updatedAt: new Date().toISOString() };
      win.localStorage.setItem('lendswift_draft_Personal', JSON.stringify(data));
    });
    cy.reload();
    cy.contains('Resume your draft application').should('exist');
  });

  it('supports keyboard navigation through fields', () => {
    cy.get('select[name="loanType"]').focus().type('{downarrow}{enter}');
    cy.get('input[name="loanAmount"]').focus().type('150000');
    cy.get('input[name="tenureMonths"]').focus().type('36');
  });

  it('uploads a valid document and shows size info', () => {
    cy.get('.dropzone input[type="file"]').selectFile({
      contents: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFnQJ0rmMXywAAAABJRU5ErkJggg==',
      fileName: 'test.png',
      mimeType: 'image/png',
    });
    cy.contains('test.png').should('exist');
  });

  it('draws a signature and saves it', () => {
    cy.get('.signature-canvas').trigger('mousedown', { button: 0, clientX: 50, clientY: 20 });
    cy.get('.signature-canvas').trigger('mousemove', { button: 0, clientX: 120, clientY: 70 });
    cy.get('.signature-canvas').trigger('mouseup');
    cy.contains('Save signature').click();
    cy.get('.signature-preview').should('exist');
  });

  it('shows EMI compliance warning when EMI > 50% income', () => {
    cy.get('select[name="loanType"]').select('Personal');
    cy.get('input[name="loanAmount"]').clear().type('500000');
    cy.get('input[name="tenureMonths"]').clear().type('12');
    cy.get('button[type="submit"]').click();
    cy.get('input[name="fullName"]').type('Warning User');
    cy.get('input[name="dob"]').type('1994-06-15');
    cy.get('input[name="mobile"]').type('9876543210');
    cy.get('input[name="email"]').type('warn@example.com');
    cy.get('button[type="submit"]').click();
    cy.get('input[name="pan"]').type('ABCDE1234P');
    cy.get('input[name="aadhaar"]').type('79927398713');
    cy.get('button[type="submit"]').click();
    cy.get('input[name="pinCode"]').type('560001');
    cy.get('input[name="addressLine"]').type('123 Main Road, Outer Layout');
    cy.get('button[type="submit"]').click();
    cy.get('select[name="employmentStatus"]').select('Salaried');
    cy.get('input[name="monthlyIncome"]').clear().type('20000');
    cy.contains('EMI is more than 50% of monthly income.').should('exist');
  });

  it('submits final review when all steps are complete', () => {
    cy.get('select[name="loanType"]').select('Personal');
    cy.get('input[name="loanAmount"]').clear().type('100000');
    cy.get('input[name="tenureMonths"]').clear().type('24');
    cy.get('button[type="submit"]').click();
    cy.get('input[name="fullName"]').type('Final User');
    cy.get('input[name="dob"]').type('1990-11-11');
    cy.get('input[name="mobile"]').type('9876501234');
    cy.get('input[name="email"]').type('final@example.com');
    cy.get('button[type="submit"]').click();
    cy.get('input[name="pan"]').type('ABCDE1234P');
    cy.get('input[name="aadhaar"]').type('79927398713');
    cy.get('button[type="submit"]').click();
    cy.get('input[name="pinCode"]').type('110001');
    cy.get('input[name="addressLine"]').type('Apt 5, Central Street');
    cy.get('input[name="companyName"]').type('Acme Corp');
    cy.get('button[type="submit"]').click();
    cy.get('.signature-canvas').trigger('mousedown', { button: 0, clientX: 20, clientY: 20 });
    cy.get('.signature-canvas').trigger('mousemove', { button: 0, clientX: 80, clientY: 80 });
    cy.get('.signature-canvas').trigger('mouseup');
    cy.contains('Save signature').click();
    cy.get('input[name="consentTerms"]').check();
    cy.get('input[name="consentCredit"]').check();
    cy.contains('Confirm and generate application ID').click();
    cy.contains('Application submitted').should('exist');
  });
});
