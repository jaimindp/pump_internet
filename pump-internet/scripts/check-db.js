const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("🔍 Checking database contents...\n");

    // Check tokens
    const tokenCount = await prisma.token.count();
    console.log(`📊 Total tokens: ${tokenCount}`);

    if (tokenCount > 0) {
      const recentTokens = await prisma.token.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          contentLinks: true,
        },
      });

      console.log("\n🪙 Recent tokens:");
      recentTokens.forEach((token, index) => {
        console.log(`${index + 1}. ${token.name} (${token.symbol})`);
        console.log(`   Mint: ${token.mint}`);
        console.log(`   Volume: ${token.volume || "N/A"}`);
        console.log(`   Migrated: ${token.migrated ? "Yes" : "No"}`);
        console.log(`   Content Links: ${token.contentLinks.length}`);
        console.log("");
      });
    }

    // Check content links
    const linkCount = await prisma.contentLink.count();
    console.log(`🔗 Total content links: ${linkCount}`);

    if (linkCount > 0) {
      const recentLinks = await prisma.contentLink.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          token: {
            select: { name: true, symbol: true },
          },
        },
      });

      console.log("\n🔗 Recent content links:");
      recentLinks.forEach((link, index) => {
        console.log(`${index + 1}. ${link.type}: ${link.url}`);
        console.log(`   Token: ${link.token.name} (${link.token.symbol})`);
        console.log("");
      });
    }

    console.log("✅ Database check complete!");
  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
