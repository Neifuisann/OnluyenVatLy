import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ôn luyện Vật lí 12 - Next Gen Learning",
  description: "Học tập thông minh chỉ với 5 phút mỗi ngày, chinh phục mọi thử thách vật lý 🚀",
  keywords: ["vật lý", "học tập", "ôn luyện", "lớp 12", "physics", "learning"],
  authors: [{ name: "OnluyenVatLy Team" }],
  robots: "index, follow",
  openGraph: {
    title: "Ôn luyện Vật lí 12 - Next Gen Learning",
    description: "Học tập thông minh chỉ với 5 phút mỗi ngày, chinh phục mọi thử thách vật lý 🚀",
    type: "website",
    locale: "vi_VN",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
