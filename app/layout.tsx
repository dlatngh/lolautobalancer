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
      <body className={`bg-sr-art bg-no-repeat bg-cover bg-center bg-fixed antialiased`}>{children}</body>
    </html>
  );
}
