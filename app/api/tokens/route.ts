import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { TokenData } from "@/app/hooks/usePumpPortal";

export async function POST(request: Request) {
  try {
    const tokenData: TokenData = await request.json();

    // Create or update token
    const token = await prisma.token.upsert({
      where: { mint: tokenData.mint },
      update: {
        name: tokenData.name,
        symbol: tokenData.symbol,
        uri: tokenData.uri,
        image: tokenData.metadata?.image,
        description: tokenData.metadata?.description,
        volume: tokenData.volume,
        migrated: tokenData.migrated,
        migrationAt: tokenData.migrationTimestamp
          ? new Date(tokenData.migrationTimestamp)
          : null,
      },
      create: {
        mint: tokenData.mint,
        name: tokenData.name,
        symbol: tokenData.symbol,
        uri: tokenData.uri,
        image: tokenData.metadata?.image,
        description: tokenData.metadata?.description,
        volume: tokenData.volume,
        migrated: tokenData.migrated,
        migrationAt: tokenData.migrationTimestamp
          ? new Date(tokenData.migrationTimestamp)
          : null,
      },
    });

    // Create or update content links
    if (tokenData.metadata) {
      const links = [];
      if (tokenData.metadata.twitter) {
        links.push({ url: tokenData.metadata.twitter, type: "twitter" });
      }
      if (tokenData.metadata.telegram) {
        links.push({ url: tokenData.metadata.telegram, type: "telegram" });
      }
      if (tokenData.metadata.website) {
        links.push({ url: tokenData.metadata.website, type: "website" });
      }

      // Create all content links
      for (const link of links) {
        await prisma.contentLink.upsert({
          where: {
            tokenId_url: {
              tokenId: token.id,
              url: link.url,
            },
          },
          update: {},
          create: {
            url: link.url,
            type: link.type,
            tokenId: token.id,
          },
        });
      }
    }

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("Error storing token:", error);
    return NextResponse.json(
      { error: "Failed to store token" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tokens = await prisma.token.findMany({
      include: {
        contentLinks: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json(tokens);
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 }
    );
  }
}
