import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(
        url
      )}&omit_script=true`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PumpInternet/1.0)",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Twitter API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching Twitter embed:", error);
    return NextResponse.json(
      { error: "Failed to fetch Twitter embed" },
      { status: 500 }
    );
  }
}
