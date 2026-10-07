const test = require('node:test');
const assert = require('node:assert');
const { buildPrompt, getModel, parseMarkdownOrText } = require('./src/ollama');
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

test('health and missing upload', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;
  assert.strictEqual((await fetch(base + '/health')).status, 200);
  assert.strictEqual((await fetch(base + '/api/summarize', { method: 'POST' })).status, 400);
  assert.strictEqual((await fetch(base + '/api/evaluate', { method: 'POST' })).status, 400);
  server.close();
});

test('serves webpage with model options, evaluate button, export PDF, and download option', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;
  const res = await fetch(base + '/');
  assert.strictEqual(res.status, 200);
  const html = await res.text();
  assert.match(html, /id="downloadBtn"/);
  assert.match(html, /Download Summary/);
  assert.match(html, /id="export-pdf-btn"/);
  assert.match(html, /Export PDF/);
  assert.match(html, /name="mode"/);
  assert.match(html, /value="FAST"\s+selected/);
  assert.match(html, /value="DETAILED"/);
  assert.match(html, /id="summarizeBtn"/);
  assert.match(html, /id="evaluateBtn"/);
  assert.match(html, /Evaluate/);
  server.close();
});
