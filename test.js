const test = require('node:test');
const assert = require('node:assert');
const { buildPrompt, getModel } = require('./src/ollama');
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

test('serves webpage with model options, evaluate button, and download option', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;
  const res = await fetch(base + '/');
  assert.strictEqual(res.status, 200);
  const html = await res.text();
  assert.match(html, /id="downloadBtn"/);
  assert.match(html, /Download Summary/);
  assert.match(html, /name="mode"/);
  assert.match(html, /value="FAST"\s+selected/);
  assert.match(html, /value="DETAILED"/);
  assert.match(html, /id="summarizeBtn"/);
  assert.match(html, /id="evaluateBtn"/);
  assert.match(html, /Evaluate/);
  server.close();
});
