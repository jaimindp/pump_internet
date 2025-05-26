"use client";

import React from "react";
import { usePumpPortal } from "./hooks/usePumpPortal";
import { ContentCard } from "./components/ContentCard";

export default function Home() {
  const {
    isConnected,
    groupedTokens,
    error,
    isLoading,
    isPaused,
    togglePause,
  } = usePumpPortal();

  // Separate tokens into different categories
  const embeddedTweets = groupedTokens.filter((group) => {
    return (
      group.contentType === "twitter" && group.contentUrl.includes("/status/")
    );
  });

  const youtubeVideos = groupedTokens.filter((group) => {
    return group.contentType === "youtube";
  });

  const otherContent = groupedTokens.filter((group) => {
    return (
      group.contentType !== "youtube" &&
      !(
        group.contentType === "twitter" && group.contentUrl.includes("/status/")
      )
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🤡</span>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Retarded Internet
                </h1>
              </div>
              {isConnected && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">
                    Connected
                  </span>
                </div>
              )}
              {!isConnected && error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-red-400 text-sm font-medium">
                    Disconnected
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* Pause/Resume Button */}
              {isConnected && (
                <button
                  onClick={togglePause}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                    isPaused
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25"
                      : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/25"
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

      {/* Main Content - Three Columns */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-300 font-medium">
                Loading tokens...
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Embedded Tweets Column */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl backdrop-blur-sm">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🐦</span>
                </div>
                <h2 className="text-xl font-bold text-white">X</h2>
                <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                  <span className="text-blue-400 text-sm font-medium">
                    {embeddedTweets.length}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
                  <p className="text-red-400 font-medium mb-2">
                    Connection Error
                  </p>
                  <p className="text-gray-400 text-sm">{error}</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Attempting to reconnect...
                  </p>
                </div>
              )}

              {isPaused && (
                <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl backdrop-blur-sm">
                  <p className="text-blue-400 font-medium">Updates paused</p>
                  <p className="text-gray-400 text-sm mt-1">
                    New tokens will not appear until resumed
                  </p>
                </div>
              )}

              {!isConnected && !error && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-300 font-medium">
                    Connecting to Retarded Internet data...
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    X posts will appear here
                  </p>
                </div>
              )}

              {isConnected && embeddedTweets.length === 0 && !isPaused && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🐦</span>
                  </div>
                  <p className="text-gray-300 font-medium">No X posts yet</p>
                  <p className="text-gray-500 text-sm mt-2">
                    X posts will appear here as tokens are created
                  </p>
                </div>
              )}

              {isConnected && embeddedTweets.length > 0 && (
                <div className="space-y-6">
                  {embeddedTweets.map((group) => (
                    <ContentCard
                      key={group.contentUrl}
                      group={group}
                      isPaused={isPaused}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* YouTube Column */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📺</span>
                </div>
                <h2 className="text-xl font-bold text-white">YouTube</h2>
                <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                  <span className="text-red-400 text-sm font-medium">
                    {youtubeVideos.length}
                  </span>
                </div>
              </div>

              {youtubeVideos.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📺</span>
                  </div>
                  <p className="text-gray-300 font-medium">
                    No YouTube videos yet
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    YouTube videos will appear here as tokens are created
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {youtubeVideos.map((group) => (
                    <ContentCard
                      key={group.contentUrl}
                      group={group}
                      isPaused={isPaused}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Other Content Column */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl backdrop-blur-sm">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🔗</span>
                </div>
                <h2 className="text-xl font-bold text-white">Other</h2>
                <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                  <span className="text-green-400 text-sm font-medium">
                    {otherContent.length}
                  </span>
                </div>
              </div>

              {otherContent.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <p className="text-gray-300 font-medium">
                    No other content yet
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Other content will appear here as tokens are created
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {otherContent.map((group) => (
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
