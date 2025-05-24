"use client";

import { useEffect, useState, useRef, memo } from "react";
import { TokenGroup } from "../hooks/usePumpPortal";

interface TwitterEmbed {
  html: string;
  width?: number;
  height?: number;
  error?: string;
}

interface ContentCardProps {
  group: TokenGroup;
}

// Create a memoized Twitter embed component to prevent unnecessary re-renders
const TwitterEmbedContent = memo(function TwitterEmbedContent({
  html,
}: {
  html: string;
}) {
  const embedRef = useRef<HTMLDivElement>(null);

  // Load Twitter widget only once when this component mounts
  useEffect(() => {
    if (embedRef.current) {
      // Load Twitter widgets script if needed
      if (!window.twttr) {
        const script = document.createElement("script");
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        script.onload = () => {
          if (window.twttr && window.twttr.widgets) {
            window.twttr.widgets.load(embedRef.current);
          }
        };
        document.head.appendChild(script);
      } else if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load(embedRef.current);
      }
    }
  }, []); // Empty dependency array - only run once when mounted

  return (
    <div
      ref={embedRef}
      className="twitter-embed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

export function ContentCard({ group }: ContentCardProps) {
  const [twitterEmbed, setTwitterEmbed] = useState<TwitterEmbed | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(false);
  const hasAttemptedLoad = useRef(false);

  useEffect(() => {
    // Only fetch Twitter embed if it's a Twitter URL and we haven't tried yet
    if (
      !hasAttemptedLoad.current &&
      group.contentType === "twitter" &&
      (group.contentUrl.includes("twitter.com") ||
        group.contentUrl.includes("x.com"))
    ) {
      setIsLoadingEmbed(true);
      hasAttemptedLoad.current = true;

      // Use our API route instead of calling Twitter directly
      fetch(`/api/twitter-embed?url=${encodeURIComponent(group.contentUrl)}`)
        .then((res) => res.json())
        .then((data) => {
          setTwitterEmbed(data);
          setIsLoadingEmbed(false);
        })
        .catch((err) => {
          console.error("Error fetching Twitter embed:", err);
          setIsLoadingEmbed(false);
        });
    }
  }, [group.contentUrl, group.contentType]);

  // Calculate total volume for all tokens
  const totalVolume = group.tokens.reduce(
    (sum, token) => sum + (token.volume || 0),
    0
  );

  // Use a unique key for the TwitterEmbedContent component to prevent re-rendering
  const tweetKey = `tweet-${group.contentUrl}`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Content Display */}
      <div className="p-6">
        {isLoadingEmbed && (
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        )}

        {twitterEmbed && !isLoadingEmbed && (
          <TwitterEmbedContent key={tweetKey} html={twitterEmbed.html} />
        )}

        {!twitterEmbed && !isLoadingEmbed && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              {group.contentType === "twitter"
                ? "🐦"
                : group.contentType === "telegram"
                ? "💬"
                : group.contentType === "website"
                ? "🌐"
                : "🔗"}{" "}
              Content Link
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
}
