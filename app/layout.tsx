import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoL Customs Autobalancer",
  description:
    "An autobalancing tool for your League of Legends custom lobbies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`bg-sr-art bg-no-repeat bg-cover bg-center bg-fixed antialiased`}
      >
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#010A13] bg-opacity-65">
          {children}
        </div>
      </body>
    </html>
  );
}
