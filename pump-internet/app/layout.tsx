import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retarded Internet - The Most Unhinged Content Portal",
  description:
    "Track the most unhinged, viral, and degenerate content launches on the internet. X, YouTube, and more, all in one place.",
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
