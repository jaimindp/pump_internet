"use client";

import React, { useEffect, useState, useRef, memo } from "react";
import { TokenGroup } from "../hooks/usePumpPortal";

interface ContentEmbed {
  html: string;
  width?: number;
  height?: number;
  error?: string;
  type: "twitter" | "youtube" | "tiktok" | "instagram" | "unknown";
}

interface ContentCardProps {
  group: TokenGroup;
  isPaused?: boolean;
}

// Global cache for successful embeds
const embedCache = new Map<string, ContentEmbed>();

// Global set to track ongoing requests
const ongoingRequests = new Set<string>();

// Global flag to track if the Twitter widget script is loaded
let twitterScriptLoaded = false;
let twitterScriptLoading = false;
let twitterScriptLoadCallbacks: (() => void)[] = [];

function loadTwitterScriptOnce(callback: () => void) {
  if (twitterScriptLoaded) {
    callback();
    return;
  }
  twitterScriptLoadCallbacks.push(callback);
  if (twitterScriptLoading) return;
  twitterScriptLoading = true;
  const script = document.createElement("script");
  script.src = "https://platform.twitter.com/widgets.js";
  script.async = true;
  script.onload = () => {
    twitterScriptLoaded = true;
    twitterScriptLoading = false;
    twitterScriptLoadCallbacks.forEach((cb) => cb());
    twitterScriptLoadCallbacks = [];
  };
  document.head.appendChild(script);
}

// Helper function to detect content type and validate URLs
function getContentInfo(url: string): {
  type: string;
  isEmbeddable: boolean;
  embedUrl?: string;
} {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname;

    // Twitter/X
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      const tweetPattern = /^\/(?:i\/web\/status|[^\/]+\/status)\/\d+/;
      const isActualTweet =
        tweetPattern.test(pathname) &&
        !pathname.includes("/i/communities/") &&
        !pathname.includes("/i/lists/") &&
        !pathname.includes("/i/moments/") &&
        !pathname.includes("/hashtag/") &&
        !pathname.includes("/search");

      return { type: "twitter", isEmbeddable: isActualTweet };
    }

    // YouTube
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      let videoId = "";

      if (hostname.includes("youtu.be")) {
        videoId = pathname.slice(1).split("?")[0];
      } else if (pathname.includes("/watch")) {
        videoId = urlObj.searchParams.get("v") || "";
      } else if (pathname.includes("/embed/")) {
        videoId = pathname.split("/embed/")[1].split("?")[0];
      }

      if (videoId) {
        return {
          type: "youtube",
          isEmbeddable: true,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
        };
      }
    }

    // TikTok
    if (hostname.includes("tiktok.com")) {
      // TikTok video pattern: //@username/video/1234567890
      const tiktokPattern = /\/@[^\/]+\/video\/\d+/;
      if (tiktokPattern.test(pathname)) {
        return { type: "tiktok", isEmbeddable: true };
      }
    }

    // Instagram
    if (hostname.includes("instagram.com")) {
      // Instagram post patterns: /p/ABC123/ or /reel/ABC123/
      const instagramPattern = /\/(p|reel)\/[A-Za-z0-9_-]+/;
      if (instagramPattern.test(pathname)) {
        return { type: "instagram", isEmbeddable: true };
      }
    }

    return { type: "unknown", isEmbeddable: false };
  } catch {
    return { type: "unknown", isEmbeddable: false };
  }
}

// Create a memoized embed component
const EmbedContent = memo(function EmbedContent({
  embed,
  contentUrl,
}: {
  embed: ContentEmbed;
  contentUrl: string;
}) {
  const embedRef = useRef<HTMLDivElement>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [twitterLoaded, setTwitterLoaded] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (embedRef.current && embed.type === "twitter") {
      console.log(`Processing Twitter embed for: ${contentUrl}`);

      // Set a longer timeout for Twitter embeds
      timeoutId = setTimeout(() => {
        if (!twitterLoaded) {
          console.log(`Twitter embed timed out for: ${contentUrl}`);
          setTimedOut(true);
        }
      }, 15000); // 15 seconds instead of 8

      const processTwitterEmbed = () => {
        if (window.twttr && window.twttr.widgets && embedRef.current) {
          console.log(`Loading Twitter widget for: ${contentUrl}`);
          console.log(`Embed HTML:`, embed.html);

          // Check if there's a blockquote element
          const blockquote = embedRef.current.querySelector(".twitter-tweet");
          if (blockquote) {
            console.log(`Found twitter-tweet blockquote for: ${contentUrl}`);
          } else {
            console.log(`No twitter-tweet blockquote found for: ${contentUrl}`);
          }

          // Clear any existing widgets in this container
          const existingWidgets = embedRef.current.querySelectorAll(
            ".twitter-tweet iframe"
          );
          if (existingWidgets.length > 0) {
            console.log(
              `Twitter widget already loaded for: ${contentUrl} (${existingWidgets.length} iframes)`
            );
            setTwitterLoaded(true);
            return;
          }

          // Process the embed
          console.log(`Calling twttr.widgets.load for: ${contentUrl}`);
          window.twttr.widgets.load(embedRef.current);

          // Check if the widget loaded after a short delay
          setTimeout(() => {
            if (embedRef.current) {
              const twitterWidget = embedRef.current.querySelector(
                ".twitter-tweet iframe"
              );
              if (twitterWidget) {
                console.log(
                  `Twitter widget loaded successfully for: ${contentUrl}`
                );
                setTwitterLoaded(true);
              } else {
                console.log(
                  `Twitter widget not found after load for: ${contentUrl}`
                );
                // Check again after more time
                setTimeout(() => {
                  if (embedRef.current) {
                    const twitterWidget2 = embedRef.current.querySelector(
                      ".twitter-tweet iframe"
                    );
                    if (twitterWidget2) {
                      console.log(
                        `Twitter widget loaded on second check for: ${contentUrl}`
                      );
                      setTwitterLoaded(true);
                    } else {
                      console.log(
                        `Twitter widget still not found for: ${contentUrl}`
                      );
                    }
                  }
                }, 3000); // Check again after 3 more seconds
              }
            }
          }, 2000); // Check after 2 seconds
        } else {
          console.log(`Twitter widgets not available for: ${contentUrl}`);
        }
      };

      loadTwitterScriptOnce(processTwitterEmbed);
    } else if (embedRef.current && embed.type === "instagram") {
      if (!window.instgrm) {
        const script = document.createElement("script");
        script.src = "https://www.instagram.com/embed.js";
        script.async = true;
        script.onload = () => {
          if (window.instgrm) {
            window.instgrm.Embeds.process();
          }
        };
        document.head.appendChild(script);
      } else {
        window.instgrm.Embeds.process();
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [embed.type, embed.html, contentUrl, twitterLoaded]);

  if (embed.type === "twitter" && timedOut) {
    return (
      <div className="twitter-embed-fallback bg-gray-100 p-4 rounded text-center">
        <p className="text-gray-500">
          Could not load tweet.{" "}
          <a
            href={contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View on Twitter
          </a>
        </p>
      </div>
    );
  }

  if (embed.type === "youtube") {
    const contentInfo = getContentInfo(contentUrl);
    return (
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={contentInfo.embedUrl}
          title="YouTube video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      ref={embedRef}
      className="content-embed"
      dangerouslySetInnerHTML={{ __html: embed.html }}
    />
  );
});

const areEqual = (prevProps: ContentCardProps, nextProps: ContentCardProps) => {
  // Basic props comparison
  if (prevProps.group.contentUrl !== nextProps.group.contentUrl) return false;
  if (prevProps.isPaused !== nextProps.isPaused) return false;
  if (prevProps.group.tokens.length !== nextProps.group.tokens.length)
    return false;

  // Create sorted arrays of token mints for comparison
  const prevMints = prevProps.group.tokens.map((t) => t.mint).sort();
  const nextMints = nextProps.group.tokens.map((t) => t.mint).sort();

  // Compare sorted mints
  for (let i = 0; i < prevMints.length; i++) {
    if (prevMints[i] !== nextMints[i]) return false;
  }

  // Check migration status for each token
  const prevMigrated = prevProps.group.tokens
    .filter((t) => t.migrated)
    .map((t) => t.mint)
    .sort();
  const nextMigrated = nextProps.group.tokens
    .filter((t) => t.migrated)
    .map((t) => t.mint)
    .sort();

  if (prevMigrated.length !== nextMigrated.length) return false;
  for (let i = 0; i < prevMigrated.length; i++) {
    if (prevMigrated[i] !== nextMigrated[i]) return false;
  }

  return true;
};

const ContentCardComponent = function ContentCard({
  group,
  isPaused = false,
}: ContentCardProps) {
  const [contentEmbed, setContentEmbed] = useState<ContentEmbed | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(false);
  const hasAttemptedLoad = useRef(false);
  const lastContentUrl = useRef<string>("");

  // Debug: Track renders (commented out to reduce clutter)
  // renderCountRef.current += 1;
  // console.log(`ContentCard render #${renderCountRef.current} for: ${group.contentUrl} (${group.tokens.length} tokens)`);

  useEffect(() => {
    // Only run if contentUrl changes
    if (lastContentUrl.current !== group.contentUrl) {
      hasAttemptedLoad.current = false;
      setContentEmbed(null);
      setIsLoadingEmbed(false);
      lastContentUrl.current = group.contentUrl;
    }

    const contentInfo = getContentInfo(group.contentUrl);

    // Check cache first
    const cachedEmbed = embedCache.get(group.contentUrl);
    if (cachedEmbed && !hasAttemptedLoad.current) {
      console.log(`Using cached embed for: ${group.contentUrl}`);
      setContentEmbed(cachedEmbed);
      hasAttemptedLoad.current = true;
      return;
    }

    // Only fetch embed if it's embeddable, we haven't tried yet, AND not paused
    if (!hasAttemptedLoad.current && contentInfo.isEmbeddable && !isPaused) {
      setIsLoadingEmbed(true);
      hasAttemptedLoad.current = true;

      if (contentInfo.type === "youtube") {
        const youtubeEmbed = { html: "", type: "youtube" as const };
        setContentEmbed(youtubeEmbed);
        embedCache.set(group.contentUrl, youtubeEmbed);
        setIsLoadingEmbed(false);
      } else {
        // Check if request is already ongoing
        if (ongoingRequests.has(group.contentUrl)) {
          console.log(`Request already ongoing for: ${group.contentUrl}`);
          setIsLoadingEmbed(false);
          return;
        }

        ongoingRequests.add(group.contentUrl);
        console.log(`Starting embed fetch for: ${group.contentUrl}`);

        fetch(
          `/api/content-embed?url=${encodeURIComponent(
            group.contentUrl
          )}&type=${contentInfo.type}`
        )
          .then((res) => res.json())
          .then((data) => {
            console.log(`Embed fetch completed for: ${group.contentUrl}`);
            const embedData = { ...data, type: contentInfo.type };
            setContentEmbed(embedData);
            // Cache successful embeds (but not errors)
            if (!data.error) {
              embedCache.set(group.contentUrl, embedData);
            }
            setIsLoadingEmbed(false);
          })
          .catch((err) => {
            console.error("Error fetching content embed:", err);
            setIsLoadingEmbed(false);
          })
          .finally(() => {
            ongoingRequests.delete(group.contentUrl);
          });
      }
    }
  }, [group.contentUrl, isPaused]);

  // Calculate total volume for all tokens
  const totalVolume = group.tokens.reduce(
    (sum, token) => sum + (token.volume || 0),
    0
  );

  const contentInfo = getContentInfo(group.contentUrl);
  const embedKey = `embed-${group.contentUrl}`;

  // Get appropriate icon for content type
  const getContentIcon = (type: string) => {
    switch (type) {
      case "twitter":
        return "🐦";
      case "youtube":
        return "📺";
      case "tiktok":
        return "🎵";
      case "instagram":
        return "📸";
      case "telegram":
        return "💬";
      case "website":
        return "🌐";
      default:
        return "🔗";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Content Display */}
      <div className="p-6">
        {isLoadingEmbed && (
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        )}

        {contentEmbed && !isLoadingEmbed && (
          <EmbedContent
            key={embedKey}
            embed={contentEmbed}
            contentUrl={group.contentUrl}
          />
        )}

        {!contentEmbed && !isLoadingEmbed && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              {getContentIcon(contentInfo.type)} Content Link
              {contentInfo.isEmbeddable && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {contentInfo.type}
                </span>
              )}
            </p>
            <a
              href={group.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 break-all"
            >
              {group.contentUrl}
            </a>
          </div>
        )}
      </div>

      {/* Associated Tokens */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <p className="text-sm text-gray-600 mb-3">
          Associated tokens: {group.tokens.length}
        </p>
        <div className="space-y-2">
          {group.tokens.map((token) => (
            <div
              key={token.mint}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <a
                  href={`https://pump.fun/${token.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-gray-900 hover:text-blue-600"
                >
                  ${token.symbol}
                </a>
                <span className="text-gray-500">{token.name}</span>
              </div>
              {token.volume && token.volume > 0 && (
                <span className="text-gray-600">
                  ${(token.volume / 1e9).toFixed(2)}M
                </span>
              )}
            </div>
          ))}
        </div>
        {totalVolume > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-900">
              Total Volume: ${(totalVolume / 1e9).toFixed(2)}M
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const ContentCard = memo(ContentCardComponent, areEqual);
