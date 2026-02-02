import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Controlled Anonymity - Private Chat",
  description: "Anonymous chat with AI verification. No email, no phone number - just conversations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
