import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const tokens = await prisma.token.findMany({
      include: {
        contentLinks: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to most recent 100 tokens
    });

    // Transform database tokens to match TokenData interface
    const transformedTokens = tokens.map((token) => ({
      mint: token.mint,
      name: token.name,
      symbol: token.symbol,
      uri: token.uri,
      timestamp: token.createdAt.getTime(),
      volume: token.volume,
      migrated: token.migrated,
      migrationTimestamp: token.migrationAt?.getTime(),
      metadata: {
        name: token.name,
        symbol: token.symbol,
        description: token.description,
        image: token.image,
        // Extract content links by type
        twitter: token.contentLinks.find((link) => link.type === "twitter")
          ?.url,
        telegram: token.contentLinks.find((link) => link.type === "telegram")
          ?.url,
        website: token.contentLinks.find((link) => link.type === "website")
          ?.url,
        uri: token.uri,
      },
    }));

    return NextResponse.json(transformedTokens);
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const tokenData = await request.json();

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
        migrated: tokenData.migrated || false,
        migrationAt: tokenData.migrationTimestamp
          ? new Date(tokenData.migrationTimestamp)
          : null,
      },
    });

    // Handle content links if metadata exists
    if (tokenData.metadata) {
      const contentLinks = [];

      if (tokenData.metadata.twitter) {
        contentLinks.push({
          url: tokenData.metadata.twitter,
          type: "twitter",
          tokenId: token.id,
        });
      }

      if (tokenData.metadata.telegram) {
        contentLinks.push({
          url: tokenData.metadata.telegram,
          type: "telegram",
          tokenId: token.id,
        });
      }

      if (tokenData.metadata.website) {
        contentLinks.push({
          url: tokenData.metadata.website,
          type: "website",
          tokenId: token.id,
        });
      }

      // Create content links (ignore duplicates)
      for (const link of contentLinks) {
        try {
          await prisma.contentLink.upsert({
            where: {
              url_tokenId: {
                url: link.url,
                tokenId: link.tokenId,
              },
            },
            update: {},
            create: link,
          });
        } catch (error) {
          console.error("Error creating content link:", error);
          // Continue with other links even if one fails
        }
      }
    }

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("Error creating/updating token:", error);
    return NextResponse.json(
      { error: "Failed to create/update token" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { mint, migrated, migrationTimestamp } = await request.json();

    if (!mint) {
      return NextResponse.json(
        { error: "Mint address is required" },
        { status: 400 }
      );
    }

    const token = await prisma.token.update({
      where: { mint },
      data: {
        migrated: migrated,
        migrationAt: migrationTimestamp ? new Date(migrationTimestamp) : null,
      },
    });

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("Error updating token migration:", error);
    return NextResponse.json(
      { error: "Failed to update token migration" },
      { status: 500 }
    );
  }
}
