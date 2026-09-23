import { NextResponse } from "next/server";

export async function POST() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey || apiKey === "your_assemblyai_api_key_here") {
    return NextResponse.json({
      token: null,
      mode: "simulation",
      message: "No valid ASSEMBLYAI_API_KEY found. Running in interactive simulator mode.",
    });
  }

  try {
    const response = await fetch("https://api.assemblyai.com/v2/realtime/token", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_in_seconds: 600, // 10 minutes
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("Failed to fetch AssemblyAI token, falling back to simulator mode:", errorText);
      return NextResponse.json({
        token: null,
        mode: "simulation",
        error: `AssemblyAI token request failed: ${response.status}`,
      });
    }

    const data = (await response.json()) as { token: string };

    return NextResponse.json({
      token: data.token,
      mode: "live",
    });
  } catch (error) {
    console.error("Error creating AssemblyAI token:", error);
    return NextResponse.json(
      {
        token: null,
        mode: "simulation",
        error: "Internal server error connecting to AssemblyAI token service",
      },
      { status: 500 }
    );
  }
}
