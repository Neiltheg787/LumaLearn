import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "LumaLearn",
  description: "AI-powered visual learning with AR models and Socratic tutoring.",
  icons: {
    icon: "/img/LumaLearn.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
