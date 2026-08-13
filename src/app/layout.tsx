import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chronolog",
  description: "A private place to preserve and explore your family's stories.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
