"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AnnouncementBar() {
  const [displayText, setDisplayText] = useState("ยินดีต้อนรับเข้าสู่ระบบ THABO KIDS SYSTEM");

  useEffect(() => {
    // 🔍 1. ไปหยิบประกาศล่าสุดจากตาราง announcements
    const fetchAnnouncement = async () => {
      const { data } = await supabase
        .from("announcements")
        .select("content")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (data?.content) {
        setDisplayText(data.content);
      }
    };

    fetchAnnouncement();

    // 📡 2. ระบบ Realtime: ถ้าใครแก้ประกาศปุ๊บ ตัววิ่งเปลี่ยนปั๊บ!
    const channel = supabase
      .channel("announcement_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, 
      () => {
        fetchAnnouncement();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="relative w-full bg-black/80 border-y border-cyan-500/30 overflow-hidden h-10 z-[100] flex items-center">
      {/* 🚀 ขอบ HUD สไตล์คุณ JPFNK */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-cyan-500/20 z-10 border-r border-cyan-400" style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0% 100%)' }}></div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-cyan-500/20 z-10 border-l border-cyan-400" style={{ clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)' }}></div>

      <div className="flex whitespace-nowrap overflow-hidden w-full">
        <div className="flex animate-marquee gap-8 items-center min-w-full">
          {/* ข้อความชุดที่ 1 (ดึงมาจาก Database) */}
          <span className="text-cyan-400 font-mono text-sm font-bold tracking-widest uppercase flex items-center gap-4">
            <span className="text-xs">⚡</span> {displayText} <span className="text-xs text-white/50">///</span>
          </span>
          {/* ข้อความชุดที่ 2 (แฝด Loop) */}
          <span className="text-cyan-400 font-mono text-sm font-bold tracking-widest uppercase flex items-center gap-4">
            <span className="text-xs">⚡</span> {displayText} <span className="text-xs text-white/50">///</span>
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 30s linear infinite;
          width: max-content;
        }
      `}</style>
    </div>
  );
}