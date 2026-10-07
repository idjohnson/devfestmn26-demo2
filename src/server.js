const express = require('express');
const multer = require('multer');
const { extractPdfText } = require('./pdf');
const path = require('path');
const { summarize, evaluate } = require('./ollama');
const { attachAuthRoutes } = require('./auth');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

attachAuthRoutes(app);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

async function handlePdfRequest(req, res, defaultAction = 'summarize') {
  if (!req.file) return res.status(400).json({ error: 'Upload a PDF in the "pdf" field.' });
  if (req.file.buffer.slice(0, 5).toString() !== '%PDF-') {
    return res.status(400).json({ error: 'File is not a valid PDF.' });
  }
  let text;
  try {
    const result = await extractPdfText(req.file.buffer);
    text = result.text;
  } catch (e) {
    console.error('PDF extraction error:', e);
    return res.status(422).json({ error: `Could not parse the PDF: ${e.message}` });
  }
  if (!text) return res.status(422).json({ error: 'No extractable text found in the PDF.' });
  try {
    const rawMode = (req.body?.mode || req.query?.mode || '').toString().trim().toUpperCase();
    const mode = rawMode === 'DETAILED' ? 'DETAILED' : 'FAST';
    const rawAction = (req.body?.action || req.query?.action || defaultAction).toString().trim().toLowerCase();
    const action = rawAction === 'evaluate' ? 'evaluate' : 'summarize';
    res.json(await summarize(text, mode, action));
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: `Failed to get a ${defaultAction} from Ollama.` });
  }
}

app.post('/api/summarize', upload.single('pdf'), (req, res) => handlePdfRequest(req, res, 'summarize'));
app.post('/api/evaluate', upload.single('pdf'), (req, res) => handlePdfRequest(req, res, 'evaluate'));

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Listening on ${port}`));
}

module.exports = app;
