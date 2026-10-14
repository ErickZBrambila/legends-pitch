"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const cols = Math.floor(canvas.width / 16);
    const drops = Array(cols).fill(1);

    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const tick = setInterval(() => {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff41";
      ctx.font = "14px monospace";
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * 16, y * 16);
        if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    }, 50);

    return () => {
      clearInterval(tick);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
}

export default function NeoLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/neo/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/neo");
    } else {
      setError("ACCESS DENIED");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <MatrixRain />

      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="border border-[#00ff41]/30 bg-black/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl shadow-[#00ff41]/10">
          <div className="mb-8 text-center">
            <p className="text-[#00ff41] font-mono text-xs tracking-[0.3em] uppercase mb-2 opacity-60">
              NORTH LEGENDS FC
            </p>
            <h1 className="text-[#00ff41] font-mono text-2xl font-bold tracking-wider">
              // NEO
            </h1>
            <p className="text-[#00ff41]/40 font-mono text-xs mt-2">
              This door was not meant for everyone.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[#00ff41]/60 font-mono text-xs uppercase tracking-widest mb-2">
                Access Key
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="············"
                autoFocus
                required
                className="w-full bg-black border border-[#00ff41]/30 text-[#00ff41] font-mono text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-[#00ff41] placeholder-[#00ff41]/20 tracking-widest"
              />
            </div>

            {error && (
              <p className="text-red-500 font-mono text-xs text-center tracking-widest animate-pulse">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 border border-[#00ff41]/50 text-[#00ff41] font-mono text-sm tracking-widest uppercase rounded-lg hover:bg-[#00ff41]/10 hover:border-[#00ff41] transition-all disabled:opacity-40"
            >
              {loading ? "VERIFYING..." : "ENTER THE MATRIX"}
            </button>
          </form>

          <p className="text-[#00ff41]/20 font-mono text-[10px] text-center mt-6 tracking-widest">
            You take the red pill — you stay in Wonderland.
          </p>
        </div>
      </div>
    </div>
  );
}
