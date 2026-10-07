const OLLAMA_URL = () => (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/+$/, '');
const OLLAMA_MODEL_FAST = () => process.env.OLLAMA_MODEL_FAST || process.env.OLLAMA_MODEL || 'gemma4:e4b';
const OLLAMA_MODEL_DETAILED = () => process.env.OLLAMA_MODEL_DETAILED || 'medgemma1.5:4b';
const MAX_CHARS = () => parseInt(process.env.MAX_CHARS || '24000', 10);

function getModel(mode) {
  const normalized = (mode || '').toString().trim().toUpperCase();
  if (normalized === 'DETAILED') {
    return OLLAMA_MODEL_DETAILED();
  }
  return OLLAMA_MODEL_FAST();
}

function buildPrompt(text, action = 'summarize') {
  const instruction = action === 'evaluate'
    ? 'Evaluate the results and suggest next courses of action for the patient.  Note the user that this was AI generated'
    : 'Only use information present in the document; say "Not stated" otherwise. Do not give medical advice.';

  return (
    'You are a careful assistant that summarizes medical documents for a patient. ' +
    'Summarize the document below with these sections: Overview, Key Findings, ' +
    'Diagnoses/Conditions, Medications, Recommended Follow-up. ' +
    instruction + '\n\n' +
    'Return your response in valid JSON format with this exact JSON structure:\n' +
    '{\n' +
    '  "title": "Concise descriptive title of document or memo",\n' +
    '  "verdict": "Clinical verdict or formal recommendation summary",\n' +
    '  "patient_summary": "1-2 sentence high-level summary for the patient/clinician",\n' +
    '  "overview": "Overview of findings and context",\n' +
    '  "key_findings": ["Key finding 1", "Key finding 2"],\n' +
    '  "diagnoses_conditions": ["Diagnosis or condition 1"],\n' +
    '  "medications": ["Medication or treatment 1"],\n' +
    '  "recommended_follow_up": "Follow-up recommendations",\n' +
    '  "next_courses_of_action": "Suggested next courses of action for the patient"\n' +
    '}\n\n' +
    '--- DOCUMENT ---\n' + text + '\n--- END ---'
  );
}

function parseMarkdownOrText(text) {
  if (!text) return null;

  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
    const parsed = JSON.parse(jsonMatch[1].trim());
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {}

  const result = {
    title: '',
    verdict: '',
    patient_summary: '',
    overview: '',
    key_findings: [],
    diagnoses_conditions: [],
    medications: [],
    recommended_follow_up: '',
    next_courses_of_action: ''
  };

  const getSection = (namePattern) => {
    const re = new RegExp(`\\*\\*\\s*(?:${namePattern})\\s*:\\s*\\*\\*\\s*([\\s\\S]*?)(?=\\n\\s*\\*\\*|$)`, 'i');
    const m = text.match(re);
    return m ? m[1].trim() : '';
  };

  result.patient_summary = getSection('Patient Summary|Summary');
  result.overview = getSection('Overview');
  result.verdict = getSection('Verdict|Recommendation|Formal Verdict');
  result.recommended_follow_up = getSection('Recommended Follow-up|Follow-up');
  result.next_courses_of_action = getSection('Next courses of action|Next Courses of Action|Actions');

  const parseList = (str) => {
    if (!str) return [];
    return str
      .split(/\n+/)
      .map(s => s.replace(/^\s*[-*•\d.]+\s*/, '').trim())
      .filter(Boolean);
  };

  const rawFindings = getSection('Key Findings|Findings');
  result.key_findings = parseList(rawFindings);

  const rawDiagnoses = getSection('Diagnoses/Conditions|Diagnoses|Conditions');
  result.diagnoses_conditions = parseList(rawDiagnoses);

  const rawMeds = getSection('Medications|Medication|Treatments');
  result.medications = parseList(rawMeds);

  if (!result.overview && !result.patient_summary) {
    result.overview = text;
  }

  return result;
}

async function summarize(text, mode = 'FAST', action = 'summarize') {
  const clipped = text.slice(0, MAX_CHARS());
  const model = getModel(mode);
  const prompt = buildPrompt(clipped, action);
  const res = await fetch(`${OLLAMA_URL()}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, format: 'json', stream: true }),
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

  const data = parseMarkdownOrText(fullResponse);

  return { summary: fullResponse, data, truncated: text.length > clipped.length };
}

async function evaluate(text, mode = 'FAST') {
  return summarize(text, mode, 'evaluate');
}

module.exports = { summarize, evaluate, buildPrompt, getModel, parseMarkdownOrText };
