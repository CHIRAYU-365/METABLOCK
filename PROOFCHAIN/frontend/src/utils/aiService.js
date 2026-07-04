/**
 * Simulated AI Heuristics Engine
 * Analyzes document text/content to extract metadata locally.
 * This keeps the platform decentralized and free of 3rd party AI API costs.
 */

const KEYWORD_DICTIONARY = {
  'degree': 'Education',
  'university': 'Education',
  'college': 'Education',
  'transcript': 'Education',
  'invoice': 'Finance',
  'receipt': 'Finance',
  'tax': 'Finance',
  'contract': 'Legal',
  'agreement': 'Legal',
  'nda': 'Legal',
  'certificate': 'Award',
  'award': 'Award',
  'medical': 'Health',
  'report': 'General',
  'resume': 'Employment',
  'offer': 'Employment'
};

/**
 * Analyzes a filename or text content to deduce document type and keywords
 * @param {string} text - The text to analyze
 * @returns {object} - { docType: string, keywords: string[] }
 */
export const analyzeDocument = (text) => {
  if (!text) return { docType: 'Unknown', keywords: [] };
  
  const lowerText = text.toLowerCase();
  const foundKeywords = [];
  let docType = 'General';

  for (const [key, type] of Object.entries(KEYWORD_DICTIONARY)) {
    if (lowerText.includes(key)) {
      foundKeywords.push(key);
      docType = type; // Takes the last matched type
    }
  }

  // Ensure unique keywords
  const uniqueKeywords = [...new Set(foundKeywords)];

  return {
    docType,
    keywords: uniqueKeywords.length > 0 ? uniqueKeywords : ['document']
  };
};
