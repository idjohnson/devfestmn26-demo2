const test = require('node:test');
const assert = require('node:assert');
const { buildPrompt } = require('./src/ollama');
const app = require('./src/server');

test('prompt includes document text', () => {
  assert.match(buildPrompt('hello'), /hello/);
});

test('health and missing upload', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;
  assert.strictEqual((await fetch(base + '/health')).status, 200);
  assert.strictEqual((await fetch(base + '/api/summarize', { method: 'POST' })).status, 400);
  server.close();
});
