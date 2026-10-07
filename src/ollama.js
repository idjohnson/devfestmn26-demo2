const OLLAMA_URL = () => (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/+$/, '');
const OLLAMA_MODEL = () => process.env.OLLAMA_MODEL || 'llama3.1';
const MAX_CHARS = () => parseInt(process.env.MAX_CHARS || '24000', 10);

function buildPrompt(text) {
  return (
    'You are a careful assistant that summarizes medical documents for a patient. ' +
    'Summarize the document below with these sections: Overview, Key Findings, ' +
    'Diagnoses/Conditions, Medications, Recommended Follow-up. Only use information ' +
    'present in the document; say "Not stated" otherwise. Do not give medical advice.\n\n' +
    '--- DOCUMENT ---\n' + text + '\n--- END ---'
  );
}

async function summarize(text) {
  const clipped = text.slice(0, MAX_CHARS());
  const res = await fetch(`${OLLAMA_URL()}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL(), prompt: buildPrompt(clipped), stream: true }),
  });
  if (!res.ok) {
    throw new Error(`Ollama returned ${res.status}: ${await res.text()}`);
  }

  let fullResponse = '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let lineBuffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    lineBuffer += decoder.decode(value, { stream: true });
    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop(); // keep trailing incomplete line
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const data = JSON.parse(line);
        if (data.response) fullResponse += data.response;
      } catch {}
    }
  }

  if (lineBuffer.trim()) {
    try {
      const data = JSON.parse(lineBuffer);
      if (data.response) fullResponse += data.response;
    } catch {}
  }

  return { summary: fullResponse, truncated: text.length > clipped.length };
}

module.exports = { summarize, buildPrompt };
