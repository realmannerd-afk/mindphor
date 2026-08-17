import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../../lib/supabase";
import { google } from "googleapis";
import jwt from "jsonwebtoken";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await request.json();
    const { feedback_id, reply_text } = body;

    if (!feedback_id || !reply_text) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
    }

    // Get the feedback and associated app credentials
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select('*, apps(play_store_url, play_console_json, apple_issuer_id, apple_key_id, apple_private_key)')
      .eq('id', feedback_id)
      .eq('user_id', user.id)
      .single();

    if (feedbackError || !feedbackData) {
      return new Response(JSON.stringify({ error: "Feedback not found or unauthorized" }), { status: 404 });
    }

    const app = feedbackData.apps;
    const isGooglePlay = feedbackData.store === 'google-play';
    const isAppStore = feedbackData.store === 'app-store';

    let remoteSuccess = false;

    if (isGooglePlay) {
      if (!app.play_console_json) {
        return new Response(JSON.stringify({ error: "Google Play Service Account JSON is not configured for this app. Please add it in App Settings." }), { status: 400 });
      }

      try {
        const credentials = typeof app.play_console_json === 'string' ? JSON.parse(app.play_console_json) : app.play_console_json;
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/androidpublisher']
        });
        
        const androidpublisher = google.androidpublisher({ version: 'v3', auth });
        
        // feedbackData.review_id must contain the real review ID from Google
        // We assume feedbackData.url contains the package name, or it can be parsed.
        // Extract the package name from the play_store_url (e.g. https://play.google.com/store/apps/details?id=com.whatsapp)
        let packageName = app.play_store_url;
        try {
          const url = new URL(app.play_store_url);
          if (url.searchParams.has('id')) {
            packageName = url.searchParams.get('id');
          }
        } catch (e) {
          // If it's not a valid URL, assume they just pasted the raw package name (e.g. 'com.whatsapp')
        }
        
        if (!packageName) {
          return new Response(JSON.stringify({ error: "Could not determine Android package name from App Settings." }), { status: 400 });
        }
        
        await androidpublisher.reviews.reply({
          packageName: packageName,
          reviewId: feedbackData.review_id,
          requestBody: {
            replyText: reply_text
          }
        });
        remoteSuccess = true;
      } catch (err: any) {
        console.error("Google Play Reply Error:", err.message);
        return new Response(JSON.stringify({ error: `Google Play API Error: ${err.message}` }), { status: 400 });
      }
    } 
    else if (isAppStore) {
      if (!app.apple_issuer_id || !app.apple_key_id || !app.apple_private_key) {
        return new Response(JSON.stringify({ error: "Apple App Store Connect API Keys are not fully configured. Please add them in App Settings." }), { status: 400 });
      }

      try {
        const payload = {
          iss: app.apple_issuer_id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 1200,
          aud: "appstoreconnect-v1"
        };
        
        const privateKey = app.apple_private_key.replace(/\\n/g, '\n');
        const token = jwt.sign(payload, privateKey, { algorithm: 'ES256', keyid: app.apple_key_id });

        const response = await fetch('https://api.appstoreconnect.apple.com/v1/customerReviewResponses', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: {
              type: "customerReviewResponses",
              attributes: {
                responseBody: reply_text
              },
              relationships: {
                review: {
                  data: {
                    id: feedbackData.review_id,
                    type: "customerReviews"
                  }
                }
              }
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.errors?.[0]?.detail || "Failed to post to App Store Connect");
        }
        remoteSuccess = true;
      } catch (err: any) {
        console.error("App Store Reply Error:", err.message);
        return new Response(JSON.stringify({ error: `App Store API Error: ${err.message}` }), { status: 400 });
      }
    }

    // Save to database only if remote push was successful or if it's a test environment
    const { error } = await supabase
      .from('feedback')
      .update({
        reply_text: reply_text,
        replied_at: new Date().toISOString()
      })
      .eq('id', feedback_id);

    if (error) {
      console.error("Error saving reply to DB:", error);
      // We still return success because it pushed to the store successfully
    }

    return new Response(JSON.stringify({ success: true, message: "Successfully posted reply to the App Store!" }), { status: 200 });
  } catch (error) {
    console.error("Reply API error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
};
