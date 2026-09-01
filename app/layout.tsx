import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANUKUL — the adaptive career loop",
  description:
    "A live demo of Anukul: read the job market every week, X-ray your skills against it, get one three-hour plan, turn the work into verified proof.",
};

export const viewport: Viewport = {
  themeColor: "#0a1322",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
