// LeaseLand - PDF Parsing Service
let pdfParse;

try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse not available, PDF uploads will be limited');
}

async function parsePdf(buffer) {
  if (!pdfParse) {
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
  const text = buffer.toString('utf8');
  const cleaned = text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/\(([^)]*)\)/g, '$1 ')
    .replace(/<<[^>]*>>/g, ' ')
    .replace(/Td|Tm|Tf|Tj|TJ|BT|ET|cm|q|Q|rg|RG|w|J|j|M|d|n|s|S|f|F|f\*/g, ' ')
    .trim();
  
  if (cleaned.length < 50) {
    return {
      text: '',
      pages: 0,
      error: 'Could not extract text from PDF. Please copy and paste the lease text directly.',
    };
  }
  
  return { text: cleaned, pages: 0 };
}

module.exports = { parsePdf };
