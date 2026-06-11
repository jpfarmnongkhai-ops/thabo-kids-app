import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google"; 
import "./globals.css";
import AnnouncementBar from "@/components/AnnouncementBar";
import ChatWidget from "@/components/ChatWidget"; 

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", 
});

export const metadata: Metadata = {
  title: "THABO KIDS SYSTEM",
  description: "ระบบจัดการข้อมูลศูนย์พัฒนาเด็กเล็กเทศบาลเมืองท่าบ่อ",
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased min-h-screen flex flex-col font-sans bg-[#FDFBF7]">
        
        {/* ส่วนนี้จะถูกซ่อนเมื่อสั่งพิมพ์ */}
        <div className="no-print">
          <AnnouncementBar />
        </div>

        <main className="flex-grow relative">
          {children}
        </main>

        {/* ส่วนนี้จะถูกซ่อนเมื่อสั่งพิมพ์ */}
        <div className="no-print">
          <ChatWidget />
        </div>
        
      </body>
    </html>
  );
}