"use client";
import { useState, useRef } from "react";
import Draggable from "react-draggable";
import { MessageSquare, X, Send, Minus } from "lucide-react";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([
    { sender: "SYSTEM", text: "ยินดีต้อนรับเพื่อน JP! ลองลากผมดูซินะ!" }
  ]);
  
  const nodeRef = useRef(null);

  const handleSendMessage = () => {
    if (inputText.trim() === "") return;
    setMessages([...messages, { sender: "JPFNK", text: inputText }]);
    setInputText("");
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] font-mono">
      {/* 🔔 ปุ่มเปิด/ปิดหลัก */}
      {!isOpen && (
        <div className="absolute bottom-6 right-6 pointer-events-auto">
          <button 
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 bg-black border-2 border-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:scale-110 transition-transform"
          >
            <MessageSquare className="text-cyan-400" size={24} />
          </button>
        </div>
      )}

      {isOpen && (
        <Draggable nodeRef={nodeRef} handle=".chat-handle" bounds="parent">
          <div 
            ref={nodeRef} 
            className={`absolute bottom-20 right-10 pointer-events-auto flex flex-col ${isMinimized ? "w-40 h-10" : "w-64 h-80"} bg-black border-2 border-cyan-500 shadow-[0_0_25px_rgba(0,0,0,0.9)]`}
          >
            {/* Header / จุดที่ใช้ลาก (Handle) */}
            <div className="chat-handle cursor-move bg-cyan-900/40 p-2 border-b border-cyan-500/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-cyan-400 tracking-tighter">COMM_UNIT</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-0.5 hover:bg-cyan-500/20"><Minus size={14} className="text-cyan-700" /></button>
                <button onClick={() => setIsOpen(false)} className="p-0.5 hover:bg-red-500/20"><X size={14} className="text-cyan-700 hover:text-red-500" /></button>
              </div>
            </div>

            {/* เนื้อหาข้างใน จะหายไปเมื่อย่อหน้าต่าง */}
            {!isMinimized && (
              <>
                {/* 💬 รายการข้อความ (แก้จุด ( ) เพื่อให้แสดงผล) */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2 text-[10px]">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="border-l border-cyan-500/30 pl-2">
                      <p className="text-[8px] text-cyan-800">[{msg.sender}]:</p>
                      <p className="text-cyan-200">{msg.text}</p>
                    </div>
                  ))}
                </div>

                {/* ⌨️ ช่องพิมพ์ Command */}
                <div className="p-2 border-t border-cyan-900 bg-black">
                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="TYPE_CMD..." 
                      className="flex-1 bg-transparent border border-cyan-900 px-2 py-1 text-[10px] text-cyan-400 focus:outline-none focus:border-cyan-500"
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="p-1 bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all"
                    >
                      <Send size={10} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Draggable>
      )}
    </div>
  );
}