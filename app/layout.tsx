import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "League Customs Autobalancer",
  description: "5v5s",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={` antialiased`}>{children}</body>
    </html>
  );
}
