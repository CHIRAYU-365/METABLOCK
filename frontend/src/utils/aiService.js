

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


export const analyzeDocument = (text) => {
  if (!text) return { docType: 'Unknown', keywords: [] };
  
  const lowerText = text.toLowerCase();
  const foundKeywords = [];
  let docType = 'General';

  for (const [key, type] of Object.entries(KEYWORD_DICTIONARY)) {
    if (lowerText.includes(key)) {
      foundKeywords.push(key);
      docType = type; 
    }
  }

  
  const uniqueKeywords = [...new Set(foundKeywords)];

  return {
    docType,
    keywords: uniqueKeywords.length > 0 ? uniqueKeywords : ['document']
  };
};
