"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export default function StudioPage() {
  return (
    <div style={{ height: "calc(100vh - 64px)" }}>
      <NextStudio config={config} />
    </div>
  );
}
