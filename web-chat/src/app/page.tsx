"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  ts: number;
};

function uuid() {
  return crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Page() {
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: uuid(),
      role: "assistant",
      text: "สวัสดีครับ มีอะไรให้ผมช่วยไหมครับ? พิมพ์ข้อความด้านล่างได้เลย",
      ts: Date.now(),
    },
  ]);
  const currentUser = {
    id: "U-001",
    name: "Somchai",
  };
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSessionId(uuid());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const canSend = useMemo(() => text.trim().length > 0 && !busy && sessionId, [text, busy, sessionId]);

  async function send() {
    const userText = text.trim();
    if (!userText || busy) return;

    setText("");
    setBusy(true);

    const userMsg: Msg = { id: uuid(), role: "user", text: userText, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);

    const typingId = uuid();
    setMessages((m) => [
      ...m,
      { id: typingId, role: "assistant", text: "...", ts: Date.now() },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: currentUser.id,
          customer_name: currentUser.name,
          message: userText,
        }),
      });

      const data = await res.json().catch(() => ({}));

      let reply: string =
        typeof data?.reply === "string" && data.reply.trim() !== ""
          ? data.reply
          : "ขออภัยครับ ระบบขัดข้องชั่วคราว";

      if (reply.includes("{{$json") || reply.includes("={{$json")) {
        reply = "ขออภัย ระบบตอบกลับผิดพลาด (n8n template error)";
      }

      if (typeof data?.session_id === "string" && data.session_id.trim() !== "") {
        setSessionId(data.session_id);
      }

      setMessages((m) =>
        m.map((x) => (x.id === typingId ? { ...x, text: reply, ts: Date.now() } : x))
      );
    } catch (e) {
      setMessages((m) =>
        m.map((x) =>
          x.id === typingId
            ? { ...x, text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", ts: Date.now() }
            : x
        )
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            AI
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">Smart Assistant</h1>
            <p className="text-xs text-green-500 font-medium">● Online</p>
          </div>
        </div>
        <div className="hidden sm:block text-[10px] text-gray-400 font-mono">
          ID: {sessionId.slice(0, 8)}...
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 md:px-0">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`group relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm transition-all ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white text-slate-800 border border-gray-100 rounded-bl-none"
                }`}
              >
                <div className="text-[10px] mb-1 opacity-60 uppercase font-bold tracking-wider">
                  {m.role === "user" ? "You" : "Assistant"}
                </div>
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {m.text === "..." ? (
                    <span className="flex gap-1 py-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]"></span>
                    </span>
                  ) : (
                    m.text
                  )}
                </div>
                <div className={`text-[9px] mt-1 text-right opacity-50`}>
                  {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area */}
      <footer className="border-t bg-white p-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-center gap-2">
            <input
              className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-6 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-all"
              placeholder="ถามอะไรบางอย่าง..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              disabled={busy}
            />
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 disabled:bg-gray-300 disabled:shadow-none transition-all"
              onClick={send}
              disabled={!canSend}
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                className="h-5 w-5 rotate-45"
              >
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-gray-400 uppercase tracking-widest">
            Next.js + n8n + Gemini MVP
          </p>
        </div>
      </footer>
    </main>
  );
}