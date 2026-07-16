export async function summarizeChangelogChange(oldText: string, newText: string): Promise<string> {
  try {
    let prompt = '';
    if (oldText && oldText.trim().length > 0) {
      prompt = `Compare these two versions of a product's changelog/release notes page. Old version: ${oldText.substring(0, 10000)}. New version: ${newText.substring(0, 10000)}. In 2-3 sentences, summarize specifically what is new or changed — focus only on actual product features, updates, or announcements. If nothing meaningful changed (e.g. just a date or formatting), say 'No meaningful product update detected.'`;
    } else {
      prompt = `Here is a product's changelog/release notes page. In 2-3 sentences, summarize the most recent product features, updates, or announcements found in the text. Ignore website navigation menus or boilerplate. Text: ${newText.substring(0, 10000)}`;
    }

    // The user requested using Gemini 2.5 Flash
    // Support both Vite/Astro environment and pure Node environments
    const apiKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.GEMINI_API_KEY) || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Missing GEMINI_API_KEY, falling back to raw text.");
      return newText.substring(0, 300) + '...';
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3
        }
      })
    });

    if (!res.ok) {
      throw new Error(`Gemini error: ${res.statusText}`);
    }

    const json = await res.json();
    return json.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Error summarizing changelog:', error);
    return newText.substring(0, 300) + '...'; // Fallback
  }
}
