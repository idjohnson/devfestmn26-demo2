const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const pdfParse = require('pdf-parse');

const execFileAsync = promisify(execFile);

/**
 * Extracts text from PDF pages using pdftoppm + tesseract.
 * @param {Buffer} buffer - The PDF file buffer
 * @returns {Promise<string>} - Extracted OCR text
 */
async function extractTextWithOcr(buffer) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-ocr-'));
  const inputPdf = path.join(tmpDir, 'input.pdf');
  const pagePrefix = path.join(tmpDir, 'page');
  const imagesList = path.join(tmpDir, 'images.txt');

  try {
    await fs.writeFile(inputPdf, buffer);

    // 1. Convert PDF pages to PNG (150 DPI is balanced for OCR speed & accuracy)
    try {
      await execFileAsync('pdftoppm', ['-png', '-r', '150', inputPdf, pagePrefix]);
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error('pdftoppm (poppler-utils) is not installed on this system');
      }
      throw new Error(`pdftoppm failed: ${err.message}`);
    }

    // 2. Discover rendered page images
    const files = await fs.readdir(tmpDir);
    const pages = files
      .filter((f) => f.startsWith('page-') && f.endsWith('.png'))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10);
        const numB = parseInt(b.replace(/\D/g, ''), 10);
        return numA - numB;
      })
      .map((f) => path.join(tmpDir, f));

    if (pages.length === 0) {
      return '';
    }

    // 3. Write image paths file for tesseract batch processing
    await fs.writeFile(imagesList, pages.join('\n') + '\n');

    // 4. Run tesseract OCR
    let stdout = '';
    try {
      const result = await execFileAsync(
        'tesseract',
        [imagesList, 'stdout', '-l', 'eng'],
        { maxBuffer: 20 * 1024 * 1024 }
      );
      stdout = result.stdout;
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error('tesseract-ocr is not installed on this system');
      }
      throw new Error(`tesseract failed: ${err.message}`);
    }

    return (stdout || '').trim();
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Extracts text from a PDF buffer, trying digital text extraction first
 * and falling back to OCR when no extractable text is found.
 * @param {Buffer} buffer - The PDF file buffer
 * @returns {Promise<{text: string, method: 'pdf-parse' | 'ocr'}>}
 */
async function extractPdfText(buffer) {
  let text = '';
  try {
    const parsed = await pdfParse(buffer);
    text = (parsed.text || '').trim();
  } catch (err) {
    console.warn('pdf-parse could not parse digital text, attempting OCR fallback:', err.message);
  }

  if (text.length > 0) {
    return { text, method: 'pdf-parse' };
  }

  const ocrText = await extractTextWithOcr(buffer);
  return { text: ocrText, method: 'ocr' };
}

module.exports = {
  extractPdfText,
  extractTextWithOcr,
};
