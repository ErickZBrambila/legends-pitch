"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const CHAMPIONSHIP_DATE = "2026-11-14T00:00:00";

function calcParts() {
  const diff = new Date(CHAMPIONSHIP_DATE).getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

function useCountdown() {
  const [parts, setParts] = useState(calcParts);
  useEffect(() => {
    const intervalRef: { id: ReturnType<typeof setInterval> | undefined } = { id: undefined };
    // Wait until the next whole-second boundary so every instance ticks together
    const alignTimer = setTimeout(() => {
      setParts(calcParts());
      intervalRef.id = setInterval(() => setParts(calcParts()), 1000);
    }, 1000 - (Date.now() % 1000));
    return () => { clearTimeout(alignTimer); clearInterval(intervalRef.id); };
  }, []);
  return parts;
}

interface TileProps { char: string; w: number; h: number; fontSize: number }

function FlipTile({ char, w, h, fontSize }: TileProps) {
  const prevRef = useRef(char);
  const [prev, setPrev] = useState(char);
  const [shown, setShown] = useState(char);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (char === prevRef.current) return;
    const old = prevRef.current;
    prevRef.current = char;
    setPrev(old);
    setFlipping(true);
    const t1 = setTimeout(() => setShown(char), 300);
    const t2 = setTimeout(() => setFlipping(false), 650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [char]); // eslint-disable-line react-hooks/exhaustive-deps

  const FONT: React.CSSProperties = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize, fontWeight: 900, lineHeight: 1,
    display: "block", userSelect: "none",
  };
  const halfBase: React.CSSProperties = {
    position: "absolute", left: 0, right: 0, height: "50%",
    overflow: "hidden", display: "flex", justifyContent: "center",
  };

  return (
    <div style={{
      width: w, height: h,
      background: "#141414",
      borderRadius: 5,
      border: "1px solid #2a2a2a",
      position: "relative",
      overflow: "hidden",
      perspective: "200px",
      boxShadow: "0 3px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      <div style={{ ...halfBase, top: 0, background: "linear-gradient(180deg, #1e1e1e 0%, #141414 100%)", alignItems: "flex-end", zIndex: 1 }}>
        <span style={{ ...FONT, color: "#f5cc5c", transform: "translateY(50%)" }}>{shown}</span>
      </div>
      <div style={{ ...halfBase, bottom: 0, background: "linear-gradient(180deg, #101010 0%, #0c0c0c 100%)", alignItems: "flex-start", zIndex: 1 }}>
        <span style={{ ...FONT, color: "#c9941a", transform: "translateY(-50%)" }}>{shown}</span>
      </div>
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#000", zIndex: 20 }} />
      {flipping && (
        <div style={{ ...halfBase, top: 0, background: "linear-gradient(180deg, #1e1e1e 0%, #141414 100%)", alignItems: "flex-end", transformOrigin: "bottom center", animation: "flipTop 0.3s ease-in forwards", zIndex: 15 }}>
          <span style={{ ...FONT, color: "#f5cc5c", transform: "translateY(50%)" }}>{prev}</span>
        </div>
      )}
      {flipping && (
        <div style={{ ...halfBase, bottom: 0, background: "linear-gradient(180deg, #101010 0%, #0c0c0c 100%)", alignItems: "flex-start", transformOrigin: "top center", animation: "flipBottom 0.3s ease-out 0.3s both", zIndex: 15 }}>
          <span style={{ ...FONT, color: "#c9941a", transform: "translateY(-50%)" }}>{char}</span>
        </div>
      )}
    </div>
  );
}

interface GroupProps { value: number; label: string; w: number; h: number; fontSize: number }

function FlipGroup({ value, label, w, h, fontSize }: GroupProps) {
  const str = String(value).padStart(2, "0");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div style={{ display: "flex", gap: 3 }}>
        <FlipTile char={str[0]} w={w} h={h} fontSize={fontSize} />
        <FlipTile char={str[1]} w={w} h={h} fontSize={fontSize} />
      </div>
      <span style={{
        color: "#d4af37", fontSize: 7, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.18em",
        fontFamily: "'Courier New', Courier, monospace",
      }}>{label}</span>
    </div>
  );
}

function Colon({ h }: { h: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 5, height: h, paddingBottom: 14 }}>
      <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#d4af37", opacity: 0.6 }} />
      <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#d4af37", opacity: 0.6 }} />
    </div>
  );
}

export default function ChampionshipCountdown({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("Championship");
  const countdown = useCountdown();

  const tileW    = compact ? 28 : 36;
  const tileH    = compact ? 40 : 54;
  const fontSize = compact ? 24 : 30;

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)" }}>
      <p className="text-center pt-3 pb-1" style={{
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 8, fontWeight: 700, color: "#d4af37",
        textTransform: "uppercase", letterSpacing: "0.25em",
      }}>
        {t("champBegins")}
      </p>
      <div className="flex items-start justify-center gap-1.5 px-3 pb-3 pt-1">
        <FlipGroup value={countdown.d} label="Days" w={tileW} h={tileH} fontSize={fontSize} />
        <Colon h={tileH} />
        <FlipGroup value={countdown.h} label="Hrs"  w={tileW} h={tileH} fontSize={fontSize} />
        <Colon h={tileH} />
        <FlipGroup value={countdown.m} label="Min"  w={tileW} h={tileH} fontSize={fontSize} />
        <Colon h={tileH} />
        <FlipGroup value={countdown.s} label="Sec"  w={tileW} h={tileH} fontSize={fontSize} />
      </div>
    </div>
  );
}
