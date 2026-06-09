import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Navbar from "@/components/Navbar";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RetinaAI Screen — คัดกรองเบาหวานขึ้นตาด้วย AI",
  description: "วิเคราะห์ความเสี่ยงโรคเบาหวานขึ้นตา (Diabetic Retinopathy) จากภาพถ่ายจอประสาทตาด้วยปัญญาประดิษฐ์",
  keywords: ["Diabetic Retinopathy", "AI", "Eye Screening", "คัดกรองเบาหวานขึ้นตา", "จอประสาทตา", "AI แพทย์"],
  authors: [{ name: "RetinaAI Screen" }],
  icons: {
    icon: "/eye-logo.png",
  },
  openGraph: {
    title: "RetinaAI Screen — คัดกรองเบาหวานขึ้นตาด้วย AI",
    description: "วิเคราะห์ความเสี่ยงโรคเบาหวานขึ้นตาจากภาพถ่ายจอประสาทตาด้วย AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RetinaAI Screen",
    description: "คัดกรองเบาหวานขึ้นตาด้วย AI",
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <SessionProviderWrapper>
          <Navbar />
          {children}
        </SessionProviderWrapper>
        <Toaster />
      </body>
    </html>
  );
}