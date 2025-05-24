"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export interface TokenMetadata {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  uri?: string;
}

export interface TokenData {
  mint: string;
  name: string;
  symbol: string;
  uri?: string;
  metadata?: TokenMetadata;
  timestamp: number;
  volume?: number;
  migrated?: boolean;
  migrationTimestamp?: number;
}

export interface TokenGroup {
  contentUrl: string;
  contentType: "twitter" | "telegram" | "website" | "unknown";
  tokens: TokenData[];
  latestMigration?: number;
}

export function usePumpPortal() {
  const [isConnected, setIsConnected] = useState(false);
  const [newTokens, setNewTokens] = useState<TokenData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);

  // Load initial data from the database
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch("/api/tokens");
        if (!response.ok) throw new Error("Failed to fetch tokens");
        const tokens = await response.json();

        // Convert database tokens to TokenData format
        const formattedTokens: TokenData[] = tokens.map((token: any) => ({
          mint: token.mint,
          name: token.name,
          symbol: token.symbol,
          uri: token.uri,
          metadata: {
            name: token.name,
            symbol: token.symbol,
            description: token.description,
            image: token.image,
            ...token.contentLinks?.reduce((acc: any, link: any) => {
              acc[link.type] = link.url;
              return acc;
            }, {}),
          },
          timestamp: token.createdAt,
          volume: token.volume,
          migrated: token.migrated,
          migrationTimestamp: token.migrationAt?.getTime(),
        }));

        setNewTokens(formattedTokens);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading initial data:", error);
        setError("Failed to load initial data");
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const persistToken = async (tokenData: TokenData) => {
    try {
      const response = await fetch("/api/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tokenData),
      });

      if (!response.ok) {
        throw new Error("Failed to persist token");
      }
    } catch (error) {
      console.error("Error persisting token:", error);
    }
  };

  const fetchMetadata = async (uri: string): Promise<TokenMetadata | null> => {
    try {
      const response = await fetch(uri);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return null;
    }
  };

  const connect = useCallback(() => {
    try {
      if (reconnectCountRef.current > 5) {
        console.error("Too many reconnection attempts");
        setError("Failed to connect after multiple attempts");
        return;
      }

      console.log("Attempting to connect to PumpPortal...");

      if (typeof WebSocket === "undefined") {
        console.error("WebSocket is not supported in this environment");
        setError("WebSocket not supported");
        return;
      }

      const ws = new WebSocket("wss://pumpportal.fun/api/data");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Successfully connected to PumpPortal");
        setIsConnected(true);
        setError(null);
        reconnectCountRef.current = 0;

        const subscribeNewToken = JSON.stringify({
          method: "subscribeNewToken",
        });
        const subscribeMigration = JSON.stringify({
          method: "subscribeMigration",
        });

        console.log("Sending subscription requests:", {
          subscribeNewToken,
          subscribeMigration,
        });

        ws.send(subscribeNewToken);
        ws.send(subscribeMigration);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received WebSocket message:", data);

          if (data.mint && data.name && data.symbol) {
            console.log("Processing new token:", {
              mint: data.mint,
              name: data.name,
              symbol: data.symbol,
            });

            const tokenData: TokenData = {
              mint: data.mint,
              name: data.name,
              symbol: data.symbol,
              uri: data.uri,
              timestamp: Date.now(),
              volume: data.initialBuy || 0,
              migrated: false,
            };

            if (data.uri) {
              console.log("Fetching metadata from:", data.uri);
              const metadata = await fetchMetadata(data.uri);
              if (metadata) {
                console.log("Metadata fetched successfully:", metadata);
                tokenData.metadata = metadata;
              }
            }

            // Persist token to database
            await persistToken(tokenData);

            setNewTokens((prev) => {
              console.log("Updating tokens list, current count:", prev.length);
              return [tokenData, ...prev].slice(0, 100);
            });
          }

          if (data.type === "migration" && data.mint) {
            console.log("Processing migration event for:", data.mint);
            const updatedTokens = newTokens.map((token) => {
              if (token.mint === data.mint) {
                const updatedToken = {
                  ...token,
                  migrated: true,
                  migrationTimestamp: Date.now(),
                };
                // Persist migration update
                persistToken(updatedToken);
                return updatedToken;
              }
              return token;
            });
            setNewTokens(updatedTokens);
          }
        } catch (error) {
          console.error(
            "Error processing WebSocket message:",
            error,
            "Raw message:",
            event.data
          );
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Connection error occurred");
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        reconnectCountRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(
            `Attempting to reconnect (attempt ${reconnectCountRef.current})...`
          );
          connect();
        }, 5000);
      };
    } catch (error) {
      console.error("Error in connect function:", error);
      setError(
        `Failed to connect: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [newTokens]);

  useEffect(() => {
    connect();

    return () => {
      console.log("Cleaning up WebSocket connection");
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Group tokens by content URL
  const groupTokensByContent = useCallback(
    (tokens: TokenData[]): TokenGroup[] => {
      const groups = new Map<string, TokenGroup>();

      tokens.forEach((token) => {
        const metadata = token.metadata;
        if (!metadata) return;

        let contentUrl = "";
        let contentType: TokenGroup["contentType"] = "unknown";

        if (metadata.twitter) {
          contentUrl = metadata.twitter;
          contentType = "twitter";
        } else if (metadata.telegram) {
          contentUrl = metadata.telegram;
          contentType = "telegram";
        } else if (metadata.website) {
          contentUrl = metadata.website;
          contentType = "website";
        }

        if (contentUrl) {
          const existing = groups.get(contentUrl);
          if (existing) {
            existing.tokens.push(token);
            if (token.migrated && token.migrationTimestamp) {
              existing.latestMigration = Math.max(
                existing.latestMigration || 0,
                token.migrationTimestamp
              );
            }
          } else {
            groups.set(contentUrl, {
              contentUrl,
              contentType,
              tokens: [token],
              latestMigration: token.migrated
                ? token.migrationTimestamp
                : undefined,
            });
          }
        }
      });

      return Array.from(groups.values()).sort((a, b) => {
        if (a.latestMigration && b.latestMigration) {
          return b.latestMigration - a.latestMigration;
        }
        const aLatest = Math.max(...a.tokens.map((t) => t.timestamp));
        const bLatest = Math.max(...b.tokens.map((t) => t.timestamp));
        return bLatest - aLatest;
      });
    },
    []
  );

  const groupedTokens = groupTokensByContent(newTokens);
  const migratedGroups = groupedTokens.filter((group) => group.latestMigration);

  return {
    isConnected,
    error,
    isLoading,
    groupedTokens,
    migratedGroups,
  };
}
