import { NextResponse } from "next/server";

const ASSEMBLYAI_API_BASE = "https://agents.assemblyai.com";

export async function POST() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey) {
    console.error("[voice-token] ASSEMBLYAI_API_KEY not configured");
    return NextResponse.json(
      { error: "Voice service not configured" },
      { status: 503 }
    );
  }

  try {
    // Mint a short-lived token for the browser client.
    // AssemblyAI Voice Agent Token API: GET /v1/token?expires_in_seconds=300
    // expires_in_seconds must be between 1 and 600
    const url = new URL(`${ASSEMBLYAI_API_BASE}/v1/token`);
    url.searchParams.set("expires_in_seconds", "300");

    const tokenResponse = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: apiKey,
      },
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[voice-token] AssemblyAI token error:", tokenResponse.status, errorText);
      return NextResponse.json(
        { error: "Failed to create voice session" },
        { status: 502 }
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      token: string;
      expires_in_seconds?: number;
    };

    console.log("[voice-token] Token minted successfully");

    return NextResponse.json({
      token: tokenData.token,
      expiresIn: tokenData.expires_in_seconds ?? 300,
    });
  } catch (err) {
    console.error("[voice-token] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support GET for direct client/testing requests
export async function GET() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice service not configured" },
      { status: 503 }
    );
  }

  try {
    const url = new URL(`${ASSEMBLYAI_API_BASE}/v1/token`);
    url.searchParams.set("expires_in_seconds", "300");

    const tokenResponse = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: apiKey,
      },
    });

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: "Failed to create voice session" },
        { status: 502 }
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      token: string;
      expires_in_seconds?: number;
    };

    return NextResponse.json({
      token: tokenData.token,
      expiresIn: tokenData.expires_in_seconds ?? 300,
    });
  } catch (err) {
    console.error("[voice-token] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
