import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://getchronolog.com"),
  title: {
    default: "Chronolog",
    template: "%s | Chronolog",
  },
  description:
    "A private family archive for preserving people, relationships, events, stories, media, timelines, and family trees.",
  applicationName: "Chronolog",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
