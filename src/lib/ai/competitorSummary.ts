export async function generateCompetitorSummary(feedback: any[]): Promise<string> {
  try {
    if (!feedback || feedback.length === 0) return "Not enough data to generate an analysis.";

    const textToAnalyze = feedback.map(f => `[${f.source} - ${new Date(f.date || f.created_at).toLocaleDateString()}]: ${f.content}`).join('\n').substring(0, 15000);

    const prompt = `You are a strategic product analyst. I am providing you with the latest intelligence on a competitor, which includes a mix of recent product updates, feature launches, and user reviews.
    
Based on the following data, write a highly readable and actionable strategic brief summarizing what this competitor is currently focusing on, how users are reacting, and key strengths/weaknesses. 

FORMAT REQUIREMENTS:
- Output ONLY valid, clean HTML (do not use markdown).
- Do NOT wrap the output in \`\`\`html code blocks. Just return the raw HTML string.
- Structure your response using these exact HTML tags:
  <p style="margin-bottom: 12px;"><strong>Current Focus:</strong> [2-3 sentences on what they are building]</p>
  <p style="margin-bottom: 12px;"><strong>Market Reaction:</strong> [2-3 sentences on user sentiment based on reviews]</p>
  <p><strong>Strategic Opportunity:</strong> [1 sentence on the key takeaway]</p>

Data:
${textToAnalyze}`;

    const apiKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.GEMINI_API_KEY) || process.env.GEMINI_API_KEY;
    if (!apiKey) return "Error: API key missing.";

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 }
      })
    });

    if (!res.ok) throw new Error(`Gemini error: ${res.statusText}`);

    const json = await res.json();
    return json.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Error generating competitor summary:', error);
    return "Error generating analysis. Please try again later.";
  }
}

export async function generateCompetitorRecommendations(feedback: any[]): Promise<string[]> {
  if (!feedback || feedback.length === 0) return [];

  const textToAnalyze = feedback.map(f => `[${f.source}]: ${f.content}`).join('\n').substring(0, 15000);

  const prompt = `Based on the following recent competitor intelligence (product updates, reviews), provide exactly 3 highly actionable strategic recommendations for our own product team. Each recommendation should be a short, direct imperative sentence (max 15 words). Focus on capitalizing on their weaknesses or matching their new strengths.

FORMAT REQUIREMENTS:
- Return ONLY a valid JSON array of 3 strings.
- Do NOT wrap in \`\`\`json code blocks.

Data:
${textToAnalyze}`;

  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.GEMINI_API_KEY) || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API key missing");

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.4,
        responseMimeType: "application/json"
      }
    })
  });

  if (!res.ok) throw new Error(`Gemini error: ${res.statusText}`);

  const json = await res.json();
  const text = json.candidates[0].content.parts[0].text.trim();
  return JSON.parse(text);
}
