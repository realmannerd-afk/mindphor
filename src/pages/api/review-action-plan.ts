import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../lib/supabase";
import { getUserPlanLimits } from "../../lib/planLimits";

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const url = new URL(request.url);
    const feedbackId = url.searchParams.get("feedback_id");

    if (!feedbackId) {
      return new Response(JSON.stringify({ error: "Missing feedback_id" }), { status: 400 });
    }

    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { data: fb } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', feedbackId)
      .single();

    if (!fb) {
      return new Response(JSON.stringify({ recommendations: [] }));
    }

    const { plan } = await getUserPlanLimits(cookies, supabase, fb.user_id);
    if (plan === 'starter') {
      return new Response(JSON.stringify({ 
        error: "Upgrade Required: AI Action Plans are only available on the Growth plan and above." 
      }), { status: 403 });
    }

    if (!fb) {
      return new Response(JSON.stringify({ recommendations: [] }));
    }

    const textToAnalyze = `[${fb.source} - ${fb.score ? fb.score + '/5' : 'No rating'}]: ${fb.content}`;

    const prompt = `Based on the following specific user feedback/review, provide exactly 3 highly actionable steps for our product team to address this user's concerns or capitalize on their praise. Each recommendation should be a short, direct imperative sentence (max 15 words).

FORMAT REQUIREMENTS:
- Return ONLY a valid JSON array of 3 strings.
- Do NOT wrap in \`\`\`json code blocks.

Review Data:
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
    const recommendations = JSON.parse(text);

    return new Response(JSON.stringify({ recommendations }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("AI Review Action Plan API error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate action plan." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
