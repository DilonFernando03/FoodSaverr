// Supabase Edge Function to serve email verification HTML with correct Content-Type
// This function is publicly accessible and doesn't require authentication
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FoodSaverr – Email Confirmed</title>
    <style>
      :root {
        color-scheme: light dark;
        --background: #f7f7f7;
        --card: #ffffff;
        --brand: #e63946;
        --brand-dark: #c70e1b;
        --text: #1d1d1f;
        --muted: #6b7280;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
        background: radial-gradient(circle at top, #fff7f7, var(--background));
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        color: var(--text);
      }
      .card {
        width: min(520px, 100%);
        background: var(--card);
        border-radius: 32px;
        padding: 48px 40px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
        position: relative;
        overflow: hidden;
      }
      .pill {
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
        font-weight: 600;
      }
      h1 {
        margin: 12px 0 8px;
        font-size: clamp(2rem, 3vw, 2.6rem);
        line-height: 1.1;
      }
      p {
        margin: 0 0 24px;
        color: var(--muted);
        font-size: 1rem;
        line-height: 1.6;
      }
      button,
      a.cta {
        appearance: none;
        border: none;
        outline: none;
        cursor: pointer;
        width: 100%;
        border-radius: 999px;
        padding: 16px 24px;
        font-size: 1rem;
        font-weight: 600;
        background: var(--brand);
        color: white;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 15px 30px rgba(230, 57, 70, 0.35);
      }
      a.cta:hover {
        transform: translateY(-1px);
        box-shadow: 0 18px 35px rgba(199, 14, 27, 0.35);
        background: var(--brand-dark);
      }
      .secondary {
        margin-top: 18px;
        background: transparent;
        color: var(--brand);
        font-weight: 600;
        text-align: center;
        text-decoration: none;
        display: block;
      }
      .confetti {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .confetti span {
        position: absolute;
        width: 10px;
        height: 14px;
        border-radius: 2px;
        animation: float 6s linear infinite;
        opacity: 0.7;
      }
      @keyframes float {
        0% {
          transform: translateY(0) rotate(0deg);
        }
        100% {
          transform: translateY(400px) rotate(360deg);
        }
      }
      .details {
        margin-top: 32px;
        padding: 20px;
        background: rgba(230, 57, 70, 0.07);
        border-radius: 20px;
        font-size: 0.95rem;
      }
      code {
        font-family: "JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular,
          Menlo, Consolas, monospace;
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 0.9em;
      }
      @media (max-width: 480px) {
        .card {
          padding: 36px 28px;
          border-radius: 24px;
        }
      }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="confetti" aria-hidden="true"></div>
      <span class="pill">FoodSaverr</span>
      <h1>Email verified 🎉</h1>
      <p>
        Thanks for confirming your email address. You can now sign in and start
        saving meals with FoodSaverr.
      </p>
      <a class="cta" id="primaryCta" href="food-saverr://auth/callback">
        Open the FoodSaverr app
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 12H19"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M12 5L19 12L12 19"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </a>
      <a class="secondary" href="mailto:support@foodsaverr.com">
        Need help? Contact support
      </a>
      <div class="details">
        <strong>What happens next?</strong>
        <ul>
          <li>Return to the FoodSaverr app and log in with your email.</li>
          <li>Your verification status will update automatically.</li>
          <li>If the app was already open, refresh the session from Settings.</li>
        </ul>
        <p style="margin: 12px 0 0">
          Tip: If this page opens in a desktop browser, scan the QR code in the
          app or email to continue on your phone.
        </p>
      </div>
    </main>
    <script>
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      const cta = document.getElementById("primaryCta");
      
      // Get the hash fragment (contains access_token, refresh_token, etc.)
      const hash = window.location.hash;
      
      if (redirect) {
        // Append hash fragment to redirect URL to preserve tokens
        cta.href = redirect + hash;
      } else {
        // Default redirect with hash fragment
        cta.href = "food-saverr://auth/callback" + hash;
      }

      const colors = ["#e63946", "#ff9f1c", "#2ec4b6", "#4c956c", "#3a86ff"];
      const confettiEl = document.querySelector(".confetti");
      for (let i = 0; i < 40; i++) {
        const piece = document.createElement("span");
        piece.style.background = colors[i % colors.length];
        piece.style.left = \`\${Math.random() * 100}%\`;
        piece.style.top = \`\${Math.random() * -80}%\`;
        piece.style.animationDelay = \`\${Math.random() * 4}s\`;
        piece.style.animationDuration = \`\${4 + Math.random() * 3}s\`;
        confettiEl.appendChild(piece);
      }
    </script>
  </body>
</html>`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Create Supabase client - this allows the function to work with Supabase's auth system
    // Using anon key makes it effectively public for GET requests
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://bblcyyqmwmbovkecxuqz.supabase.co'
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibGN5eXFtd21ib3ZrZWN4dXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMDc0MjMsImV4cCI6MjA3NDg4MzQyM30.WzIcxOdp41VzwE0Udl8vh6KK2DQXYFJMsHFG9X5-5E4'
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

    // Get query parameters and hash from the request
    const url = new URL(req.url);
    const redirect = url.searchParams.get("redirect");
    
    // Inject redirect parameter into the HTML if provided
    let html = HTML_CONTENT;
    if (redirect) {
      // The JavaScript in the HTML will handle the redirect parameter
      html = html.replace(
        'const redirect = params.get("redirect");',
        `const redirect = "${redirect}";`
      );
    }

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

