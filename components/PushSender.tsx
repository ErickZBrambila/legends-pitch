"use client";

import { useState } from "react";

export default function PushSender({ senderName }: { senderName: string }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("/");
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [sent, setSent] = useState(0);

  async function handleSend() {
    if (!title.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, url, senderName, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(data.sent ?? 0);
      setStatus("ok");
      setTitle("");
      setMessage("");
      setUrl("/");
      setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  }

  return (
    <section className="mb-10">
      <h2 className="text-base font-black text-gray-900 mb-4">Send Push Notification</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1 flex-1 mr-4">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">From</label>
            <div className="border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-500 select-none">
              {senderName}
            </div>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Language</label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-black">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-4 py-2.5 transition-colors ${language === "en" ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:bg-gray-50"}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("es")}
                className={`px-4 py-2.5 transition-colors ${language === "es" ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:bg-gray-50"}`}
              >
                ES
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase tracking-widest text-gray-400">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={language === "en" ? "e.g. Game tomorrow at 9am!" : "ej. ¡Partido mañana a las 9am!"}
            maxLength={100}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase tracking-widest text-gray-400">
            Message (optional)
          </label>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={language === "en" ? "e.g. Don't forget cleats and shin guards." : "ej. No olviden tacos y espinilleras."}
            maxLength={200}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase tracking-widest text-gray-400">Link (optional)</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/schedule"
            maxLength={200}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>
        <p className="text-xs text-gray-400">
          Claude auto-translates your message — families receive it in both English and Spanish.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSend}
            disabled={!title.trim() || status === "sending"}
            className="bg-gray-900 text-white text-sm font-black px-6 py-2.5 rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            {status === "sending" ? "Translating & sending…" : "Send to all subscribers"}
          </button>
          {status === "ok" && (
            <p className="text-sm text-green-600 font-bold">Sent to {sent} device{sent !== 1 ? "s" : ""} ✓</p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-500 font-bold">Failed — check logs</p>
          )}
        </div>
      </div>
    </section>
  );
}
