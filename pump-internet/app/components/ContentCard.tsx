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
    console.log("Twitter script already loaded, calling callback");
    callback();
    return;
  }

  console.log("Adding callback to Twitter script loading queue");
  twitterScriptLoadCallbacks.push(callback);

  if (twitterScriptLoading) {
    console.log("Twitter script already loading, waiting...");
    return;
  }

  twitterScriptLoading = true;
  console.log("Loading Twitter script...");

  const script = document.createElement("script");
  script.src = "https://platform.twitter.com/widgets.js";
  script.async = true;
  script.onload = () => {
    console.log("Twitter script loaded successfully");
    twitterScriptLoaded = true;
    twitterScriptLoading = false;
    console.log(`Calling ${twitterScriptLoadCallbacks.length} callbacks`);
    twitterScriptLoadCallbacks.forEach((cb) => cb());
    twitterScriptLoadCallbacks = [];
  };
  script.onerror = () => {
    console.error("Failed to load Twitter script");
    twitterScriptLoading = false;
  };
  document.head.appendChild(script);
}

// Helper function to detect content type and validate URLs
function getContentInfo(url: string): {
  type: string;
  isEmbeddable: boolean;
  embedUrl?: string;
  isEmbeddableTweet?: boolean;
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
        !pathname.includes("/search") &&
        !pathname.includes("/photo/");

      return {
        type: "twitter",
        isEmbeddable: isActualTweet,
        isEmbeddableTweet: isActualTweet,
      };
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
      // TikTok video pattern: //@username/video/1234567890 (with optional query params)
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
    } else if (embedRef.current && embed.type === "tiktok") {
      console.log(`Processing TikTok embed for: ${contentUrl}`);

      if (!window.TikTok) {
        const script = document.createElement("script");
        script.src = "https://www.tiktok.com/embed.js";
        script.async = true;
        script.onload = () => {
          console.log(`TikTok script loaded for: ${contentUrl}`);
          if (window.TikTok && window.TikTok.embed) {
            window.TikTok.embed.init();
          }
        };
        script.onerror = () => {
          console.error(`Failed to load TikTok script for: ${contentUrl}`);
        };
        document.head.appendChild(script);
      } else {
        console.log(
          `TikTok script already loaded, initializing for: ${contentUrl}`
        );
        if (window.TikTok.embed) {
          window.TikTok.embed.init();
        }
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [embed.type, embed.html, contentUrl, twitterLoaded]);

  if (embed.type === "twitter" && timedOut) {
    return (
      <div className="bg-gray-700/30 border border-gray-600/50 p-6 rounded-xl text-center backdrop-blur-sm">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-xl">🐦</span>
        </div>
        <p className="text-gray-300 mb-3 font-medium">Could not load tweet</p>
        <a
          href={contentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/30 transition-all duration-200 text-sm font-medium"
        >
          <span>View on Twitter</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
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
  const [animationClass, setAnimationClass] = useState("");
  const hasAnimated = useRef(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Simple animation on first mount
  useEffect(() => {
    if (!hasAnimated.current) {
      // Pick a random animation class on first mount
      const animations = [
        "animate-fade-in",
        "animate-slide-in",
        "animate-scale-in",
      ];
      const random = Math.floor(Math.random() * animations.length);
      setAnimationClass(animations[random]);
      hasAnimated.current = true;
      // Remove the animation class after 300ms for faster, more subtle animations
      setTimeout(() => setAnimationClass(""), 300);
    }
  }, []);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <div
      className={`bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden hover:border-gray-600/50 transition-all duration-200 hover:shadow-xl hover:shadow-black/20 ${animationClass}`}
    >
      {/* Content Display */}
      <div className="p-6">
        {isLoadingEmbed && (
          <div className="animate-pulse">
            <div className="h-32 bg-gray-700/50 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {getContentIcon(contentInfo.type)}
              </span>
              <span className="text-gray-300 font-medium">Content Link</span>
              {contentInfo.isEmbeddable && (
                <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-400 font-medium">
                  {contentInfo.type}
                </span>
              )}
            </div>
            <a
              href={group.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-400 hover:text-blue-300 break-all text-sm transition-colors duration-200 hover:underline"
            >
              {group.contentUrl}
            </a>
          </div>
        )}
      </div>

      {/* Associated Tokens */}
      <div className="border-t border-gray-700/50 px-6 py-4 bg-gray-900/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <p className="text-gray-300 font-medium text-sm">
              {group.tokens.length} token{group.tokens.length !== 1 ? "s" : ""}
            </p>
          </div>
          {totalVolume > 0 && (
            <div className="text-right">
              <p className="text-green-400 font-bold text-sm">
                ${(totalVolume / 1e9).toFixed(2)}M
              </p>
              <p className="text-gray-500 text-xs">Total Volume</p>
            </div>
          )}
        </div>

        {/* Compact token grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {group.tokens.slice(0, 4).map((token) => (
            <div
              key={token.mint}
              className="flex items-center gap-2 p-2 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-colors duration-200"
            >
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">$</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 mb-1">
                  <span
                    className="font-medium text-white text-sm truncate"
                    title={`${token.symbol} - ${token.name}`}
                  >
                    ${token.symbol}
                  </span>
                  {token.migrated && (
                    <span className="px-1 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400 font-medium">
                      Migrated
                    </span>
                  )}
                </div>

                {/* Contract Address - Copyable */}
                <div className="flex items-center gap-1 mb-1 relative">
                  <button
                    onClick={() => copyToClipboard(token.mint)}
                    className="text-gray-400 hover:text-gray-300 text-xs font-mono truncate max-w-[120px] transition-colors duration-200"
                    title={`Copy CA: ${token.mint}`}
                  >
                    {token.mint.slice(0, 8)}...{token.mint.slice(-4)}
                  </button>
                  <svg
                    className="w-3 h-3 text-gray-500 hover:text-gray-400 cursor-pointer"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    onClick={() => copyToClipboard(token.mint)}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  {/* Toast notification */}
                  {copiedAddress === token.mint && (
                    <span className="absolute left-0 -top-8 z-10 px-2 py-1 bg-green-500 text-white text-xs rounded shadow-lg animate-fade-in whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </div>

                {/* Links Row */}
                <div className="flex items-center gap-1 flex-wrap">
                  {/* Pump.fun Link */}
                  <a
                    href={`https://pump.fun/${token.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/30 rounded text-xs text-gray-300 hover:text-white transition-all duration-200"
                    title="View on Pump.fun"
                  >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/en/b/bd/Pump_fun_logo.png"
                      alt="Pump"
                      className="w-3 h-3 rounded"
                    />
                    Pump
                  </a>

                  {/* Jupiter Link */}
                  <a
                    href={`https://jup.ag/swap/SOL-${token.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/30 rounded text-xs text-gray-300 hover:text-white transition-all duration-200"
                    title="Trade on Jupiter"
                  >
                    <img
                      src="https://jup.ag/favicon.ico"
                      alt="Jupiter"
                      className="w-3 h-3"
                    />
                    Jup
                  </a>

                  {/* Volume Display */}
                  {token.volume && token.volume > 0 && (
                    <span className="text-green-400 text-xs font-medium ml-auto">
                      ${(token.volume / 1e9).toFixed(1)}M
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show more indicator if there are more than 4 tokens */}
        {group.tokens.length > 4 && (
          <div className="mt-2 text-center">
            <span className="text-gray-400 text-xs">
              +{group.tokens.length - 4} more token
              {group.tokens.length - 4 !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const ContentCard = memo(ContentCardComponent, areEqual);
