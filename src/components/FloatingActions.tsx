import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import logo from "@/assets/logo.asset.json";
import bgMusic from "@/assets/bg-music.asset.json";

const WHATSAPP_NUMBER = "351930656040";
const WHATSAPP_MSG =
  "Hi Mighty Mindz! I'd like to know more about admissions for 2026.";
const MUSIC_SRC = bgMusic.url;
const STORAGE_KEY = "mm_chat_v1";

type Msg = { role: "user" | "assistant"; content: string };

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hi! I'm **MIGHTY MINDZ AI** 🧒 — ask me anything about our programs, admissions for 2026, facilities, or a school tour!",
};

/* ---------- Background music ---------- */
function useBgMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(true); // start muted (autoplay policy)

  useEffect(() => {
    const a = new Audio(MUSIC_SRC);
    a.loop = true;
    a.volume = 0.25;
    audioRef.current = a;
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (muted) {
      a.play().catch(() => {
        /* user needs to interact; button click satisfies this */
      });
      setMuted(false);
    } else {
      a.pause();
      setMuted(true);
    }
  };

  return { muted, toggle };
}

/* ---------- Streaming chat client ---------- */
async function streamChat(
  messages: Msg[],
  onDelta: (chunk: string) => void,
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Chat error: ${res.status}`);
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const payload = JSON.parse(data);
        const delta: string | undefined =
          payload?.choices?.[0]?.delta?.content ??
          payload?.choices?.[0]?.message?.content;
        if (delta) onDelta(delta);
      } catch {
        /* ignore heartbeats */
      }
    }
  }
}

/* ---------- Chat panel ---------- */
function ChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window === "undefined") return [WELCOME];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Msg[];
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [WELCOME];
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore quota */
    }
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    setMessages((m) => [...m, { role: "assistant", content: "" }]);
    try {
      await streamChat(next, (delta) => {
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: last.content + delta };
          }
          return copy;
        });
      });
    } catch (err) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content:
            "Sorry — I couldn't reach my brain just now. Please try again, or tap WhatsApp to reach our team.",
        };
        return copy;
      });
    } finally {
      setBusy(false);
      textareaRef.current?.focus();
    }
  }

  function reset() {
    setMessages([WELCOME]);
  }

  return (
    <div
      role="dialog"
      aria-label="MIGHTY MINDZ AI chatbot"
      className="fixed z-[60] bottom-24 right-4 md:right-6 w-[min(92vw,380px)] h-[min(70vh,560px)] bg-card rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden animate-scale-in"
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground">
        <div className="h-11 w-11 rounded-full bg-cream grid place-items-center shrink-0 overflow-hidden ring-2 ring-white/40">
          <img
            src={logo.url}
            alt="Mighty Mindz logo"
            className="h-9 w-auto"
            width={44}
            height={44}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-sm leading-tight truncate">
            MIGHTY MINDZ AI
          </div>
          <div className="text-[11px] opacity-90 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-leaf animate-bob" />
            Always here to help
          </div>
        </div>
        <button
          onClick={reset}
          className="text-[11px] font-bold rounded-full bg-white/15 hover:bg-white/25 px-2.5 py-1 transition"
          aria-label="Start new chat"
          title="New chat"
        >
          New
        </button>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 grid place-items-center transition"
          aria-label="Close chat"
        >
          ✕
        </button>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-cream/60"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "flex justify-end"
                : "flex items-start gap-2"
            }
          >
            {m.role === "assistant" && (
              <div className="h-7 w-7 rounded-full bg-primary shrink-0 grid place-items-center overflow-hidden ring-1 ring-border">
                <img src={logo.url} alt="" className="h-6 w-auto" />
              </div>
            )}
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium shadow-sm"
                  : "max-w-[85%] rounded-2xl rounded-bl-md bg-card border border-border px-3.5 py-2 text-sm text-foreground shadow-sm"
              }
            >
              {m.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-strong:text-primary prose-ul:my-1 prose-ol:my-1">
                  {m.content ? (
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  ) : (
                    <span className="inline-flex gap-1 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bob" />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bob"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bob"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </span>
                  )}
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="border-t border-border p-2.5 bg-card flex items-end gap-2"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={1}
          placeholder="Ask about admissions, programs..."
          className="flex-1 resize-none rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-h-32"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="h-11 w-11 rounded-full bg-primary text-primary-foreground grid place-items-center btn-3d [--btn-shadow:var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22l-4-9-9-4Z" />
          </svg>
        </button>
      </form>
    </div>
  );
}

/* ---------- Floating action stack ---------- */
export function FloatingActions() {
  const { muted, toggle } = useBgMusic();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <div
        className="fixed z-[70] right-3 md:right-6 flex flex-col items-end gap-2.5 md:gap-3 pointer-events-auto"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        }}
      >

        {/* Music toggle */}
        <button
          onClick={toggle}
          aria-label={muted ? "Play background music" : "Mute background music"}
          title={muted ? "Play music" : "Mute music"}
          className="h-12 w-12 rounded-full bg-sunshine text-sunshine-foreground btn-3d [--btn-shadow:var(--sunshine)] grid place-items-center"
        >
          {muted ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="22" y1="9" x2="16" y2="15" />
              <line x1="16" y1="9" x2="22" y2="15" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MSG)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          title="WhatsApp"
          className="h-12 w-12 rounded-full bg-leaf text-leaf-foreground btn-3d [--btn-shadow:var(--leaf)] grid place-items-center"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
            <path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.5 0 .17 5.32.17 11.87c0 2.09.55 4.13 1.6 5.93L0 24l6.36-1.66a11.86 11.86 0 0 0 5.69 1.45h.01c6.55 0 11.88-5.32 11.88-11.87 0-3.17-1.23-6.15-3.42-8.44ZM12.06 21.5h-.01a9.6 9.6 0 0 1-4.9-1.34l-.35-.21-3.77.98 1.01-3.67-.23-.38a9.55 9.55 0 0 1-1.47-5.03c0-5.29 4.31-9.6 9.62-9.6a9.54 9.54 0 0 1 6.79 2.82 9.55 9.55 0 0 1 2.82 6.79c0 5.3-4.32 9.64-9.51 9.64Zm5.55-7.19c-.3-.15-1.79-.88-2.07-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.49a9.05 9.05 0 0 1-1.68-2.08c-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.64-.93-2.24-.24-.59-.49-.51-.68-.52l-.58-.01c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.51 0 1.48 1.08 2.91 1.23 3.11.15.2 2.12 3.24 5.13 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.79-.73 2.04-1.44.25-.71.25-1.32.18-1.44-.07-.13-.28-.2-.58-.35Z" />
          </svg>
        </a>

        {/* Chatbot toggle */}
        <button
          onClick={() => setChatOpen((v) => !v)}
          aria-label={chatOpen ? "Close MIGHTY MINDZ AI chat" : "Open MIGHTY MINDZ AI chat"}
          title="MIGHTY MINDZ AI"
          className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-primary text-primary-foreground btn-3d [--btn-shadow:var(--primary)] grid place-items-center relative overflow-hidden"
        >
          {chatOpen ? (
            <span className="text-xl font-bold" aria-hidden>✕</span>
          ) : (
            <>
              <img
                src={logo.url}
                alt=""
                aria-hidden
                className="h-9 md:h-10 w-auto"
              />
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-tomato ring-2 ring-card animate-bob" />
            </>
          )}
        </button>
      </div>

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </>
  );
}
