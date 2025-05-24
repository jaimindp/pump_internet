# Pump Fun Content Discovery Platform

## Background and Motivation

The user wants to build an app that tracks Pump Fun data from token launches and migrations to showcase content that's produced there. The core thesis is that speculation-driven token launches on Pump Fun create a financial market around attention-grabbing content, which can improve content discovery.

Key aspects:

- Pump Fun tokens often include metadata with links to content (websites, tweets, TikTok, Instagram, YouTube)
- The goal is to present this data in a way that helps users discover valuable content
- Focus on both token launches and migrations
- Create a content discovery platform powered by financial speculation signals

## Key Challenges and Analysis

### 1. Data Collection & Integration

- **Challenge**: Accessing Pump Fun blockchain data for token launches and migrations
- **Solution**: Integrate with Solana RPC nodes and Pump Fun's API/smart contracts
- **Considerations**: Rate limiting, data freshness, historical data backfilling

### 2. Content Extraction & Validation

- **Challenge**: Parsing diverse metadata formats and validating external links
- **Solution**: Build robust parsers for different content platforms (Twitter/X, TikTok, Instagram, YouTube, custom websites)
- **Considerations**: Handle broken links, content moderation, platform API limits

### 3. Financial Signal Analysis

- **Challenge**: Determining which financial metrics best indicate content quality/virality
- **Solution**: Track multiple signals (trading volume, holder count, price momentum, migration success)
- **Considerations**: Avoid pump & dump schemes, identify organic growth patterns

### 4. Content Discovery UX

- **Challenge**: Presenting financial data alongside content in an intuitive way
- **Solution**: Design interfaces that surface content based on financial signals without overwhelming users
- **Considerations**: Different user personas (traders vs content consumers)

### 5. Real-time Updates

- **Challenge**: Keeping data fresh and responsive to market movements
- **Solution**: WebSocket connections for live updates, efficient caching strategies
- **Considerations**: Server costs, scalability

## Required External Services & API Access

### Simplified MVP Approach (Vercel-Only)

**Essential Services (All Free)**

1. **Vercel** - Complete hosting solution

   - Next.js app hosting (free tier)
   - Vercel Postgres database (free tier)
   - Serverless functions for API routes
   - **Cost**: $0/month for MVP

2. **Data Sources** (No direct blockchain access needed)
   - **Pumplify API** - For Pump Fun token data and launches
   - **PumpPortal API** - Alternative/additional data source
   - **User's existing QuickNode RPC** - Available as backup if needed
   - **Cost**: $0/month (using existing services)

### Content Embedding (No API Keys Required)

3. **Twitter/X Embeds**

   - **oEmbed API** - Free, no authentication required
   - **Twitter's public embed endpoint**: `https://publish.twitter.com/oembed`
   - **Fallback**: OpenGraph parsing for basic previews
   - **Cost**: $0/month

4. **YouTube Embeds**

   - **oEmbed API** - Free, no API key required
   - **Endpoint**: `https://www.youtube.com/oembed`
   - **Cost**: $0/month

5. **TikTok/Instagram**
   - **oEmbed APIs** where available
   - **OpenGraph parsing** as fallback
   - **Cost**: $0/month

### Total Required Signups

- **Vercel account** (free)
- **Pumplify/PumpPortal access** (investigate if signup required)

### Development Cost: $0/month

### MVP Production Cost: $0/month

### No API keys or paid services needed initially

## High-level Task Breakdown

### Phase 1: MVP (Dead Simple)

1. **Project Setup** (Success: Next.js app running locally)

   - Initialize Next.js 14+ with TypeScript
   - Basic Tailwind CSS setup
   - Deploy to Vercel

2. **Database Setup** (Success: Can store and retrieve token data)

   - Vercel Postgres with simple schema:
     - tokens table (address, name, volume, created_at)
     - content_links table (url, type, associated_tokens[])
   - Basic seed data for testing

3. **Pumplify/PumpPortal Integration** (Success: Fetching live data)

   - Connect to API for new launches
   - Connect to API for trending/volume data
   - Parse token metadata for links
   - Group tokens by shared content

4. **Content Embedding** (Success: Tweets display properly)

   - Twitter oEmbed integration
   - Basic error handling for failed embeds
   - Fallback to link if embed fails

5. **Simple UI** (Success: Two working tabs with content)
   - Header with "New" and "Trending" tabs
   - Vertical list of embedded content
   - Show associated tokens below each embed
   - Click handlers for tokens (→ pump.fun) and content (→ source)

### That's it for MVP!

### Future Enhancements (Only if needed)

- Add more content types (YouTube, TikTok)
- Basic search functionality
- Pagination for long lists
- Auto-refresh for new content
- Simple caching to improve performance

## Project Status Board

### To Do

- [x] Define simplified MVP scope
- [ ] Database schema creation
- [ ] Pumplify/PumpPortal API research
- [ ] Twitter oEmbed implementation
- [ ] Build simple UI with two tabs

### In Progress

### Completed

- [x] Planning phase
- [x] UI/UX design (simplified)
- [x] Architecture decisions (Vercel-only)
- [x] Project setup and initialization

### Blocked

## Current Status / Progress Tracking

**Current Phase**: Execution - Vercel Deployment Complete ✅
**Current Task**: App successfully deployed to Vercel
**Next Steps**: Implement PumpPortal WebSocket connection for real-time token data

### Milestone 1 Complete: Basic Project Structure

- ✅ Next.js 14+ with TypeScript
- ✅ Tailwind CSS configured
- ✅ Simple homepage with tab navigation
- ✅ Development server running at http://localhost:3000

### Milestone 2 Complete: Vercel Deployment

- ✅ Successfully deployed to Vercel
- ✅ Production URL: https://pump-internet-h7eeku4mf-jaimin888patelgmailcoms-projects.vercel.app
- ✅ Automatic deployments configured for future pushes

### What's Next

The app is now live! Next we'll implement:

1. PumpPortal WebSocket connection
2. Real-time token data fetching
3. Metadata extraction and content display
4. Twitter oEmbed integration for embedded tweets

## Executor's Feedback or Assistance Requests

### What I Need to Feel 100% Confident

Based on my research, I've identified the following requirements for confident implementation:

1. **PumpPortal API Access** ✅

   - Good news: PumpPortal provides a free Data API with WebSocket support
   - Endpoints available:
     - `wss://pumpportal.fun/api/data` for real-time updates
     - Methods: `subscribeNewToken`, `subscribeTokenTrade`, `subscribeMigration`
   - No API key needed for data access (only for trading)

2. **Twitter oEmbed** ✅

   - Confirmed working: `https://publish.twitter.com/oembed?url=TWEET_URL`
   - No authentication required
   - Returns HTML embed code

3. **Data Structure Understanding** ✅

   - Tokens have metadata with links (Twitter, YouTube, TikTok, websites)
   - Multiple tokens can share the same content link
   - Key metrics: volume, price, holder count, creation time

4. **Technical Stack Clarity** ✅
   - Next.js 14+ with App Router
   - TypeScript
   - Tailwind CSS
   - Vercel Postgres
   - All free tier compatible

### Remaining Questions for User

1. **PumpPortal vs Other APIs**

   - Should we use PumpPortal (simpler, real-time WebSocket) or explore Pumplify/other APIs?
   - PumpPortal seems most straightforward - is this acceptable?

2. **Data Storage Strategy**

   - How much historical data should we store?
   - Should we cache all token data or just fetch on-demand?

3. **Content Filtering**
   - Any content moderation needed initially?
   - Should we filter out certain types of content?

### Confidence Level: 95%

I'm ready to start building with PumpPortal's free API. The only uncertainty is whether you prefer a different data source, but PumpPortal appears to be the simplest option to get started quickly.

## Pump Fun Token Metadata Structure

Based on my research, Pump Fun tokens have metadata in this format:

```json
{
  "name": "Act I : The AI Prophecy",
  "symbol": "ACT",
  "description": "Act I : The AI Prophecy",
  "image": "https://ipfs.io/ipfs/QmUfrHNLqia7NmqgbzHYGF4rtX75nEwukPFFU1YscKKquL",
  "showName": true,
  "createdOn": "https://pump.fun",
  "twitter": "https://x.com/repligate/status/1841064405980913705",
  "telegram": "https://x.com/repligate/status/1839080227944935934",
  "website": "https://cyborgism.wiki/hypha/act_i"
}
```

Key observations:

- `twitter` field can contain either a profile URL or a specific tweet URL
- `telegram` field sometimes contains Twitter links instead of Telegram links
- `website` field contains the actual website URL
- Links are stored directly in the metadata, not in a nested structure

### How to Access Token Metadata

From PumpPortal WebSocket, when we receive token creation events via `subscribeNewToken`, we'll get:

- Token mint address
- Basic token info (name, symbol)
- URI pointing to the full metadata (usually IPFS or Arweave)

We'll need to:

1. Fetch the metadata from the URI
2. Extract the twitter/telegram/website fields
3. For Twitter links, use oEmbed to get embeddable content
4. Display all links with Twitter embeds when available

## Lessons

### Technical Considerations

- Pump Fun is built on Solana, so we'll need Solana Web3.js expertise
- Content moderation will be important given the unfiltered nature of token launches
- Rate limiting from external platforms (Twitter, YouTube) needs careful handling
- Consider using a queue system for processing content previews

### Architecture Recommendations

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with tRPC for type safety
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for content previews and API responses
- **Real-time**: Pusher or custom WebSocket server
- **Blockchain**: Solana Web3.js, Helius or QuickNode for RPC

### MVP Feature Prioritization

1. Basic token tracking and display
2. Content link extraction and preview
3. Simple financial metrics (volume, price, holders)
4. Responsive web interface
5. Search and filtering

## UI/UX Design Vision (Simplified Desktop)

### Core Concept

Dead simple desktop app showing new + trending content from Pump Fun launches. Focus on embedded content, minimal chrome.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Pump Internet                          [New] [Trending] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────┐      │
│  │                                               │      │
│  │         Embedded Tweet/Profile                │      │
│  │                                               │      │
│  └─────────────────────────────────────────────┘      │
│  Associated tokens: $MEME ($1.2M) $PEPE ($500K)        │
│  ─────────────────────────────────────────────────     │
│                                                         │
│  ┌─────────────────────────────────────────────┐      │
│  │                                               │      │
│  │         Embedded Tweet/Profile                │      │
│  │                                               │      │
│  └─────────────────────────────────────────────┘      │
│  Associated tokens: $DOGE ($2.5M)                      │
│  ─────────────────────────────────────────────────     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Key Features

1. **Two Tabs Only**

   - **New**: Latest launches in chronological order
   - **Trending**: Sorted by volume/activity

2. **Content Display**

   - Full embedded tweets/profiles (using oEmbed)
   - Show all tokens associated with that content
   - Token name + volume only (keep metrics minimal)

3. **Interactions**
   - Click token name → opens pump.fun page
   - Click embedded content → opens original source
   - That's it.

### Design Principles

- **No cards, no borders** - just content + associated tokens
- **Minimal spacing** - pack more content on screen
- **No fancy metrics** - just volume in parentheses
- **No user accounts, no favorites** - pure discovery
- **Fast loading** - server-side rendered

### Technical Simplicity

- Single page app
- No client-side routing needed
- Simple CSS, no complex components
- Focus on fast data fetching and embedding
