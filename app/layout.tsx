import type { Metadata } from "next";
import "./globals.css";

// Note: Inter font is loaded via globals.css @import from Google Fonts
// This allows the build to succeed in restricted network environments

// Base metadata - will be extended per page
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://extreamsys.com"),
  title: {
    default: "ExtreamSys | Enterprise IT Infrastructure & Security | San Diego",
    template: "%s | ExtreamSys",
  },
  description:
    "San Diego's trusted IT infrastructure and security partner. Managed IT services, network engineering, and cybersecurity solutions for enterprise businesses.",
  keywords: [
    "IT services San Diego",
    "managed IT",
    "network engineering",
    "cybersecurity",
    "IT infrastructure",
    "San Diego IT consultant",
  ],
  authors: [{ name: "ExtreamSys, LLC" }],
  creator: "ExtreamSys, LLC",
  publisher: "ExtreamSys, LLC",

  // Open Graph metadata
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://extreamsys.com",
    siteName: "ExtreamSys",
    title: "ExtreamSys | Enterprise IT Infrastructure & Security",
    description: "San Diego's trusted IT infrastructure and security partner.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "ExtreamSys - Enterprise IT Solutions",
      },
    ],
  },

  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "ExtreamSys | Enterprise IT Infrastructure & Security",
    description: "San Diego's trusted IT infrastructure and security partner.",
    images: ["/images/twitter-card.png"],
  },

  // Robots and indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Icons
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  // Verification (to be filled in Phase 4)
  // verification: {
  //   google: "your-google-verification-code",
  //   yandex: "your-yandex-verification-code",
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
