"use client";

import { useEffect, useState } from "react";
import { TokenGroup } from "../hooks/usePumpPortal";

interface TwitterEmbed {
  html: string;
  width?: number;
  height?: number;
}

interface ContentCardProps {
  group: TokenGroup;
}

export function ContentCard({ group }: ContentCardProps) {
  const [twitterEmbed, setTwitterEmbed] = useState<TwitterEmbed | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(false);

  useEffect(() => {
    // Only fetch Twitter embed if it's a Twitter URL
    if (
      group.contentType === "twitter" &&
      (group.contentUrl.includes("twitter.com") ||
        group.contentUrl.includes("x.com"))
    ) {
      setIsLoadingEmbed(true);

      // Use our API route to avoid CORS issues
      fetch(`/api/twitter-embed?url=${encodeURIComponent(group.contentUrl)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.html) {
            setTwitterEmbed(data);
          }
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

  // Format the display URL for better readability
  const getDisplayUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      // For Twitter/X URLs, show a cleaner format
      if (
        urlObj.hostname.includes("twitter.com") ||
        urlObj.hostname.includes("x.com")
      ) {
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        if (pathParts.length > 0) {
          // Show @username for profile URLs
          if (pathParts.length === 1) {
            return `@${pathParts[0]}`;
          }
          // Show @username/status/id for tweets
          if (pathParts.includes("status")) {
            return `@${pathParts[0]}/status/${
              pathParts[pathParts.indexOf("status") + 1]
            }`;
          }
          // Show community name for communities
          if (pathParts.includes("communities")) {
            return `Community: ${
              pathParts[pathParts.indexOf("communities") + 1]
            }`;
          }
        }
      }
      return url;
    } catch {
      return url;
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

        {twitterEmbed && !isLoadingEmbed && (
          <div
            className="twitter-embed"
            dangerouslySetInnerHTML={{ __html: twitterEmbed.html }}
          />
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
              className="text-blue-600 hover:text-blue-800 break-all font-medium"
            >
              {getDisplayUrl(group.contentUrl)}
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
