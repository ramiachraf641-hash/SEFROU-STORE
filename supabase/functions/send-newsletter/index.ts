import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const senderEmail = Deno.env.get("RESEND_FROM_EMAIL");

  if (!authorization || !supabaseUrl || !supabaseAnonKey) {
    console.error("SEND NEWSLETTER: Missing authentication or Supabase configuration.");
    return response({ error: "Unauthorized" }, 401);
  }
  if (!resendApiKey || !senderEmail) {
    console.error("SEND NEWSLETTER: Resend secrets are not configured.");
    return response({ error: "Newsletter service is not configured." }, 503);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(
      authorization.replace(/^Bearer\s+/i, ""),
    );
    if (userError || !userData.user) return response({ error: "Unauthorized" }, 401);

    const { data: isAdmin, error: adminError } = await supabase.rpc("is_store_admin");
    if (adminError || isAdmin !== true) return response({ error: "Admin access required." }, 403);

    let payload: { subject?: unknown; content?: unknown };
    try {
      payload = await request.json();
    } catch {
      return response({ error: "Invalid request body." }, 400);
    }

    const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
    const content = typeof payload.content === "string" ? payload.content.trim() : "";
    if (!subject || !content) return response({ error: "Subject and content are required." }, 400);
    if (subject.length > 200 || content.length > 100000) return response({ error: "Newsletter content is too long." }, 400);

    const { data: subscribers, error: subscribersError } = await supabase
      .from("newsletter_subscribers")
      .select("email");
    if (subscribersError) {
      console.error("SEND NEWSLETTER: Subscriber query failed.", { code: subscribersError.code });
      return response({ error: "Could not load subscribers." }, 500);
    }

    const emails = [...new Set((subscribers || [])
      .map((subscriber) => String(subscriber.email || "").trim().toLowerCase())
      .filter(Boolean))];
    if (!emails.length) return response({ sent: 0, failed: 0, message: "No subscribers." });

    const htmlContent = escapeHtml(content).replaceAll("\n", "<br>");
    let sent = 0;
    let failed = 0;

    for (const [index, email] of emails.entries()) {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [email],
          subject,
          text: content,
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">${htmlContent}</div>`,
        }),
      });

      if (resendResponse.ok) {
        sent++;
      } else {
        failed++;
        console.error("SEND NEWSLETTER: Resend rejected a message.", {
          recipientIndex: index,
          status: resendResponse.status,
        });
      }
    }

    return response({
      sent,
      failed,
      total: emails.length,
      message: failed ? "Newsletter completed with some failures." : "Newsletter sent successfully.",
    });
  } catch (error) {
    console.error("SEND NEWSLETTER: Unexpected error.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return response({ error: "Could not send newsletter." }, 500);
  }
});
