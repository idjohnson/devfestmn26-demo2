const test = require('node:test');
const assert = require('node:assert');
const { buildPrompt, getModel, parseMarkdownOrText } = require('./src/ollama');
const { signSession, verifySession } = require('./src/auth');
const app = require('./src/server');

test('prompt includes document text', () => {
  assert.match(buildPrompt('hello'), /hello/);
  assert.match(buildPrompt('hello'), /Do not give medical advice/);
});

test('prompt uses evaluate instructions when requested', () => {
  const prompt = buildPrompt('doc text', 'evaluate');
  assert.match(
    prompt,
    /Evaluate the results and suggest next courses of action for the patient\.  Note the user that this was AI generated/
  );
  assert.doesNotMatch(prompt, /Do not give medical advice/);
  assert.match(prompt, /doc text/);
});

test('parseMarkdownOrText parses JSON format correctly', () => {
  const jsonStr = JSON.stringify({
    title: 'Test Cardiology Memo',
    verdict: 'Normal sinus rhythm',
    patient_summary: 'Patient is stable.',
    overview: 'Routine electrocardiogram.',
    key_findings: ['Normal PR interval', 'No ST changes'],
    diagnoses_conditions: ['Sinus Bradycardia'],
    medications: ['Metoprolol 25mg'],
    recommended_follow_up: 'Annual exam',
    next_courses_of_action: 'Continue current therapy'
  });

  const parsed = parseMarkdownOrText(jsonStr);
  assert.strictEqual(parsed.title, 'Test Cardiology Memo');
  assert.strictEqual(parsed.verdict, 'Normal sinus rhythm');
  assert.deepStrictEqual(parsed.key_findings, ['Normal PR interval', 'No ST changes']);

  const fenced = '```json\n' + jsonStr + '\n```';
  const parsedFenced = parseMarkdownOrText(fenced);
  assert.strictEqual(parsedFenced.title, 'Test Cardiology Memo');
});

test('parseMarkdownOrText parses markdown blocks fallback', () => {
  const md = `**Patient Summary:** 54-year-old male with persistent cough.
**Overview:** Outpatient evaluation of respiratory symptoms.
**Key Findings:**
- Bilateral wheezing on auscultation
- Normal chest radiograph
**Diagnoses/Conditions:**
- Mild Intermittent Asthma
**Medications:**
- Albuterol HFA as needed
**Recommended Follow-up:** Follow-up in 4 weeks.
**Next courses of action:** Peak flow monitoring. Note the user that this was AI generated`;

  const parsed = parseMarkdownOrText(md);
  assert.match(parsed.patient_summary, /54-year-old male/);
  assert.match(parsed.overview, /Outpatient evaluation/);
  assert.strictEqual(parsed.key_findings.length, 2);
  assert.strictEqual(parsed.key_findings[0], 'Bilateral wheezing on auscultation');
  assert.strictEqual(parsed.diagnoses_conditions[0], 'Mild Intermittent Asthma');
  assert.strictEqual(parsed.medications[0], 'Albuterol HFA as needed');
  assert.match(parsed.recommended_follow_up, /4 weeks/);
  assert.match(parsed.next_courses_of_action, /Peak flow monitoring/);
});

test('getModel selects appropriate model and defaults to FAST', () => {
  assert.strictEqual(getModel(), 'gemma4:e4b');
  assert.strictEqual(getModel(''), 'gemma4:e4b');
  assert.strictEqual(getModel('FAST'), 'gemma4:e4b');
  assert.strictEqual(getModel('fast'), 'gemma4:e4b');
  assert.strictEqual(getModel('DETAILED'), 'medgemma1.5:4b');
  assert.strictEqual(getModel('detailed'), 'medgemma1.5:4b');
  assert.strictEqual(getModel('UNKNOWN'), 'gemma4:e4b');
});

test('getModel respects environment variables', () => {
  const origFast = process.env.OLLAMA_MODEL_FAST;
  const origDetailed = process.env.OLLAMA_MODEL_DETAILED;

  process.env.OLLAMA_MODEL_FAST = 'custom-fast';
  process.env.OLLAMA_MODEL_DETAILED = 'custom-detailed';

  try {
    assert.strictEqual(getModel('FAST'), 'custom-fast');
    assert.strictEqual(getModel('DETAILED'), 'custom-detailed');
  } finally {
    if (origFast !== undefined) process.env.OLLAMA_MODEL_FAST = origFast;
    else delete process.env.OLLAMA_MODEL_FAST;

    if (origDetailed !== undefined) process.env.OLLAMA_MODEL_DETAILED = origDetailed;
    else delete process.env.OLLAMA_MODEL_DETAILED;
  }
});

test('signSession and verifySession handle HMAC signature verification correctly', () => {
  const payload = { sub: 'user_456', name: 'Dr. Jane Doe', email: 'jane@example.com' };
  const token = signSession(payload, 'test-secret');
  assert.ok(token.includes('.'));

  // Valid verification
  const verified = verifySession(token, 'test-secret');
  assert.strictEqual(verified.sub, 'user_456');
  assert.strictEqual(verified.name, 'Dr. Jane Doe');
  assert.strictEqual(verified.email, 'jane@example.com');

  // Wrong secret
  assert.strictEqual(verifySession(token, 'wrong-secret'), null);

  // Tampered payload
  const [b64Payload, sig] = token.split('.');
  const tamperedPayload = Buffer.from(JSON.stringify({ sub: 'user_tampered', name: 'Attacker' })).toString('base64url');
  assert.strictEqual(verifySession(`${tamperedPayload}.${sig}`, 'test-secret'), null);

  // Invalid formats
  assert.strictEqual(verifySession('', 'test-secret'), null);
  assert.strictEqual(verifySession('invalid.format.extra', 'test-secret'), null);
});

test('health and missing upload', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;
  assert.strictEqual((await fetch(base + '/health')).status, 200);
  assert.strictEqual((await fetch(base + '/api/summarize', { method: 'POST' })).status, 400);
  assert.strictEqual((await fetch(base + '/api/evaluate', { method: 'POST' })).status, 400);
  server.close();
});

test('serves webpage with Google login, user header, model options, evaluate, export PDF, and download option', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;
  const res = await fetch(base + '/');
  assert.strictEqual(res.status, 200);
  const html = await res.text();

  // Authentication UI elements
  assert.match(html, /id=\"loginView\"/);
  assert.match(html, /id=\"googleSignInBtn\"/);
  assert.match(html, /Sign in with Google/);
  assert.match(html, /id=\"userNameDisplay\"/);
  assert.match(html, /href=\"\/auth\/logout\"/);

  // App features
  assert.match(html, /id=\"downloadBtn\"/);
  assert.match(html, /Download Summary/);
  assert.match(html, /id=\"export-pdf-btn\"/);
  assert.match(html, /Export PDF/);
  assert.match(html, /name=\"mode\"/);
  assert.match(html, /value=\"FAST\"\s+selected/);
  assert.match(html, /value=\"DETAILED\"/);
  assert.match(html, /id=\"summarizeBtn\"/);
  assert.match(html, /id=\"evaluateBtn\"/);
  assert.match(html, /Evaluate/);
  server.close();
});

test('/api/auth/me returns unauthenticated status without session cookie', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;
  const res = await fetch(base + '/api/auth/me');
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.authenticated, false);
  assert.strictEqual(body.user, null);
  assert.strictEqual(typeof body.idpConfigured, 'boolean');
  server.close();
});

test('/api/auth/me returns authenticated user with valid session cookie', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;
  const sessionToken = signSession({
    sub: 'google-sub-789',
    name: 'Dr. Sarah Connor, MD',
    email: 'sconnor@hospital.org'
  });

  const res = await fetch(base + '/api/auth/me', {
    headers: {
      Cookie: `session=${sessionToken}`
    }
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.authenticated, true);
  assert.strictEqual(body.user.name, 'Dr. Sarah Connor, MD');
  assert.strictEqual(body.user.email, 'sconnor@hospital.org');
  server.close();
});

test('/auth/dev-login sets session cookie and returns user data', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;
  const res = await fetch(base + '/auth/dev-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Dr. Test Clinician', email: 'test@hospital.org' })
  });
  assert.strictEqual(res.status, 200);
  const cookieHeader = res.headers.get('set-cookie');
  assert.ok(cookieHeader && cookieHeader.includes('session='));
  const body = await res.json();
  assert.strictEqual(body.status, 'ok');
  assert.strictEqual(body.user.name, 'Dr. Test Clinician');
  server.close();
});

test('/auth/google redirects to error when IdP not configured, or to Google endpoint when configured', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;

  // When unconfigured:
  const resUnconfigured = await fetch(base + '/auth/google', { redirect: 'manual' });
  assert.strictEqual(resUnconfigured.status, 302);
  assert.match(resUnconfigured.headers.get('location'), /auth_error=idp_not_configured/);

  // When configured:
  const origClientId = process.env.GOOGLE_CLIENT_ID;
  const origClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
  process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

  try {
    const resConfigured = await fetch(base + '/auth/google', { redirect: 'manual' });
    assert.strictEqual(resConfigured.status, 302);
    const location = resConfigured.headers.get('location');
    assert.match(location, /^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
    assert.match(location, /client_id=test-client-id\.apps\.googleusercontent\.com/);
    assert.match(location, /scope=openid\+email\+profile/);
  } finally {
    if (origClientId !== undefined) process.env.GOOGLE_CLIENT_ID = origClientId;
    else delete process.env.GOOGLE_CLIENT_ID;

    if (origClientSecret !== undefined) process.env.GOOGLE_CLIENT_SECRET = origClientSecret;
    else delete process.env.GOOGLE_CLIENT_SECRET;
  }

  server.close();
});
