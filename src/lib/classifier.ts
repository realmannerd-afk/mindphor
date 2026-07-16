export function classifySentiment(content: string): 'positive' | 'negative' | 'neutral' {
  if (!content) return 'neutral';

  const text = content.toLowerCase();
  
  const negativeKeywords = [
    'crash', 'bug', 'broken', 'terrible', 'slow', 'fail', 'error', 
    'hate', 'worst', 'awful', 'useless', 'disappointing'
  ];
  
  const positiveKeywords = [
    'love', 'great', 'amazing', 'perfect', 'awesome', 'fast', 
    'easy', 'helpful', 'excellent', 'fantastic', 'best'
  ];

  let negativeCount = 0;
  let positiveCount = 0;

  // Count occurrences (simple substring matching, can be refined with regex word boundaries if needed)
  for (const word of negativeKeywords) {
    // using regex boundary to match whole words
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = text.match(regex);
    if (matches) {
      negativeCount += matches.length;
    }
  }

  for (const word of positiveKeywords) {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = text.match(regex);
    if (matches) {
      positiveCount += matches.length;
    }
  }

  if (negativeCount > positiveCount) {
    return 'negative';
  } else if (positiveCount > negativeCount) {
    return 'positive';
  } else {
    return 'neutral';
  }
}
