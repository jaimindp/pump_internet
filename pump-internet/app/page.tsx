"use client";

import { useState } from "react";
import { usePumpPortal } from "./hooks/usePumpPortal";
import { ContentCard } from "./components/ContentCard";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"new" | "trending">("new");
  const { isConnected, groupedTokens, error } = usePumpPortal();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Pump Internet</h1>
              {isConnected && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                  Connected
                </span>
              )}
              {!isConnected && error && (
                <span className="text-sm text-red-600">Disconnected</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("new")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "new"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                New
              </button>
              <button
                onClick={() => setActiveTab("trending")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "trending"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Trending
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {activeTab === "new" ? (
            <>
              {!isConnected && !error && (
                <div className="text-center py-20 text-gray-500">
                  <p>Connecting to Pump Fun data...</p>
                  <p className="text-sm mt-2">
                    New token launches will appear here
                  </p>
                </div>
              )}

              {error && (
                <div className="text-center py-20">
                  <p className="text-red-600 mb-2">Connection Error</p>
                  <p className="text-sm text-gray-500">{error}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Attempting to reconnect...
                  </p>
                </div>
              )}

              {isConnected && groupedTokens.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                  <p>Waiting for new token launches...</p>
                  <p className="text-sm mt-2">
                    Content will appear here as tokens are created
                  </p>
                </div>
              )}

              {isConnected && groupedTokens.length > 0 && (
                <div className="space-y-6">
                  {groupedTokens.map((group, index) => (
                    <ContentCard
                      key={`${group.contentUrl}-${index}`}
                      group={group}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <p>Trending feature coming soon...</p>
              <p className="text-sm mt-2">
                This will show the most active tokens by volume
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
