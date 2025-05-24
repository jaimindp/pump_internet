import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pump Internet - Discover Content Through Token Launches",
  description:
    "Track Pump Fun token launches and discover the content that's grabbing attention through financial signals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
