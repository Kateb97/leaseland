// LeaseLand - PDF Parsing Service
const fs = require('fs');
const path = require('path');

let pdfParse;

// Load pdf-parse dynamically (it has native dependencies)
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse not available, PDF uploads will be limited');
}

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

async function parsePdf(buffer) {
  if (!pdfParse) {
    // Fallback: extract text simply
    return extractTextFallback(buffer);
  }
  
  try {
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      pages: data.numpages,
      metadata: data.metadata,
    };
  } catch (err) {
    console.error('PDF parsing error:', err);
    throw new Error('Could not parse PDF file. Please ensure it is a valid PDF document.');
  }
}

function extractTextFallback(buffer) {
  // Simple text extraction from PDF buffer
  const text = buffer.toString('utf8');
  // Remove PDF control characters and try to get readable text
  const cleaned = text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/\(([^)]*)\)/g, '$1 ')
    .replace(/<<[^>]*>>/g, ' ')
    .replace(/Td|Tm|Tf|Tj|TJ|BT|ET|cm|q|Q|rg|RG|w|J|j|M|d|n|s|S|f|F|f\*/g, ' ')
    .trim();
  
  // If we got very little readable text, return a meaningful message
  if (cleaned.length < 50) {
    return {
      text: '',
      pages: 0,
      error: 'Could not extract text from PDF. Please copy and paste the lease text directly.',
    };
  }
  
  return { text: cleaned, pages: 0 };
}

function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn('Could not cleanup file:', filePath);
  }
}

module.exports = { parsePdf, cleanupFile, UPLOAD_DIR };