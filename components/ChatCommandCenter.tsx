"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function ChatCommandCenter() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [userName, setUserName] = useState("JPFNK"); // ค่าเริ่มต้นเท่ๆ ของเพื่อน
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. 🔥 ดึงข้อมูล Profile ของคนที่ Login อยู่
    const getUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.display_name) {
          setUserName(profile.display_name);
        }
      }
    };
    getUserProfile();

    // 2. ดึงข้อความเก่ามาโชว์
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(15);
      if (data) setMessages(data);
    };
    fetchMessages();

    // 3. ระบบ Realtime ฟังเสียงแชทสด
    const channel = supabase
      .channel("realtime_world_chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, 
      (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // ✨ ส่งชื่อที่ดึงมาจากตาราง profiles เข้าไปในแชท
    await supabase.from("messages").insert([
      { 
        content: inputText, 
        sender_name: userName, 
        role: "admin" 
      }
    ]);
    setInputText("");
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
      <div className="w-80 h-48 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 p-3 overflow-y-auto shadow-2xl scrollbar-hide">
        {messages.map((m, i) => (
          <div key={i} className="text-[13px] mb-1 leading-relaxed animate-in fade-in slide-in-from-left-2 text-white/90">
            <span className="text-white/40 font-mono text-[10px]">
              [{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]
            </span>
            <span className={`ml-2 font-bold ${m.role === 'admin' ? 'text-green-400' : 'text-cyan-400'}`}>
              {m.sender_name}:
            </span>
            <span className="ml-2 font-medium">{m.content}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`คุยในนาม: ${userName}...`}
          className="bg-black/60 border border-white/20 rounded-full px-4 py-2 text-xs text-white outline-none focus:border-green-400 w-full backdrop-blur-sm"
        />
        <button type="submit" className="bg-green-500/80 hover:bg-green-500 text-white rounded-full px-4 py-2 text-xs font-bold transition-all">
          ส่ง
        </button>
      </form>
    </div>
  );
}