"use client";

import React from "react";
import { usePumpPortal } from "./hooks/usePumpPortal";
import { ContentCard } from "./components/ContentCard";

export default function Home() {
  const {
    isConnected,
    groupedTokens,
    migratedGroups,
    error,
    isLoading,
    isPaused,
    togglePause,
  } = usePumpPortal();

  // Get a set of all migrated content URLs
  const migratedUrls = new Set(migratedGroups.map((g) => g.contentUrl));
  // Only show new tokens for content not in migrated
  const newOnlyGroups = groupedTokens.filter(
    (g) => !migratedUrls.has(g.contentUrl)
  );

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
            <div className="flex items-center gap-4">
              {/* Pause/Resume Button */}
              {isConnected && (
                <button
                  onClick={togglePause}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isPaused
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  }`}
                >
                  {isPaused ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Resume
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Pause
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two Columns */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-20 text-gray-500">
            <p>Loading tokens...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* New Tokens Column */}
            <section>
              <h2 className="text-xl font-semibold mb-4">New</h2>
              {error && (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-2">Connection Error</p>
                  <p className="text-sm text-gray-500">{error}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Attempting to reconnect...
                  </p>
                </div>
              )}
              {isPaused && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mb-4">
                  <p className="text-blue-800">
                    Updates paused • New tokens will not appear until resumed
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Click &quot;Resume&quot; to continue receiving live updates
                  </p>
                </div>
              )}
              {!isConnected && !error && (
                <div className="text-center py-20 text-gray-500">
                  <p>Connecting to Pump Fun data...</p>
                  <p className="text-sm mt-2">
                    New token launches will appear here
                  </p>
                </div>
              )}
              {isConnected && newOnlyGroups.length === 0 && !isPaused && (
                <div className="text-center py-20 text-gray-500">
                  <p>Waiting for new token launches...</p>
                  <p className="text-sm mt-2">
                    Content will appear here as tokens are created
                  </p>
                </div>
              )}
              {isConnected && newOnlyGroups.length > 0 && (
                <div className="space-y-6">
                  {newOnlyGroups.map((group) => (
                    <ContentCard
                      key={group.contentUrl}
                      group={group}
                      isPaused={isPaused}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Migrations Column */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Migrations</h2>
              {migratedGroups.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <p>No migrations yet</p>
                  <p className="text-sm mt-2">
                    Content will appear here when tokens are migrated
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {migratedGroups.map((group) => (
                    <ContentCard
                      key={group.contentUrl}
                      group={group}
                      isPaused={isPaused}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
