import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ChatbotWrapper } from "@/components/ChatbotWrapper";
import UpdateNotifier from "@/components/UpdateNotifier";

export const metadata: Metadata = {
  title: "TrustInn - Secure Testing Platform",
  description: "Enterprise-grade software testing and verification platform",
  icons: {
    icon: "https://res.cloudinary.com/dmpkp1nxv/image/upload/v1770376358/logo_evvxuk.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <ChatbotWrapper />
          <UpdateNotifier />
        </Providers>
      </body>
    </html>
  );
}
