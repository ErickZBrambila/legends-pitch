'use client';

import { useState } from "react";

type Position = "GK" | "DEF" | "MID" | "FWD";
type TeamSlug = "u11" | "u12";

interface AssistantCoach {
  name: string;
  role: string;
}

interface Player {
  name: string;
  number: string;
  position: Position;
}

interface PracticeSlot {
  day: string;
  time: string;
  location: string;
}

interface FormState {
  team: TeamSlug;
  headCoachName: string;
  headCoachRole: string;
  headCoachEmail: string;
  assistants: AssistantCoach[];
  practiceSlots: PracticeSlot[];
  players: Player[];
}

const emptyForm = (team: TeamSlug): FormState => ({
  team,
  headCoachName: "",
  headCoachRole: "Head Coach",
  headCoachEmail: "",
  assistants: [{ name: "", role: "Assistant Coach" }],
  practiceSlots: [
    { day: "", time: "", location: "" },
    { day: "", time: "", location: "" },
  ],
  players: Array.from({ length: 3 }, () => ({ name: "", number: "", position: "MID" as Position })),
});

export default function CoachForm() {
  const [activeTeam, setActiveTeam] = useState<TeamSlug>("u11");
  const [forms, setForms] = useState<Record<TeamSlug, FormState>>({
    u11: emptyForm("u11"),
    u12: emptyForm("u12"),
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const form = forms[activeTeam];

  function update(patch: Partial<FormState>) {
    setForms((prev) => ({ ...prev, [activeTeam]: { ...prev[activeTeam], ...patch } }));
  }

  function updateSlot(i: number, field: keyof PracticeSlot, value: string) {
    const next = [...form.practiceSlots];
    next[i] = { ...next[i], [field]: value };
    update({ practiceSlots: next });
  }

  function updateAssistant(i: number, field: keyof AssistantCoach, value: string) {
    const next = [...form.assistants];
    next[i] = { ...next[i], [field]: value };
    update({ assistants: next });
  }

  function addAssistant() {
    update({ assistants: [...form.assistants, { name: "", role: "Assistant Coach" }] });
  }

  function removeAssistant(i: number) {
    update({ assistants: form.assistants.filter((_, idx) => idx !== i) });
  }

  function updatePlayer(i: number, field: keyof Player, value: string) {
    const next = [...form.players];
    next[i] = { ...next[i], [field]: value } as Player;
    update({ players: next });
  }

  function addPlayer() {
    update({ players: [...form.players, { name: "", number: "", position: "MID" }] });
  }

  function removePlayer(i: number) {
    update({ players: form.players.filter((_, idx) => idx !== i) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Unknown error");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">Submitted!</h2>
          <p className="text-gray-600 mb-6">
            {activeTeam.toUpperCase()} data saved. Players added to Sanity.
          </p>
          <button
            onClick={() => {
              const other: TeamSlug = activeTeam === "u11" ? "u12" : "u11";
              setActiveTeam(other);
              setStatus("idle");
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold"
          >
            Fill in {activeTeam === "u11" ? "U12" : "U11"} now →
          </button>
        </div>
      </div>
    );
  }

  const inputCls = "w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400";
  const labelCls = "block text-sm font-semibold text-gray-600 mb-1";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-700 text-white px-6 py-5">
        <h1 className="text-2xl font-bold">North Legends FC</h1>
        <p className="text-blue-200 text-sm mt-0.5">Coach Onboarding Form</p>
      </div>

      {/* Team tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {(["u11", "u12"] as TeamSlug[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setActiveTeam(t); setStatus("idle"); }}
            className={`flex-1 py-4 text-lg font-bold transition-colors ${
              activeTeam === t
                ? "border-b-4 border-blue-600 text-blue-700 bg-blue-50"
                : "text-gray-500"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* Head Coach */}
        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Head Coach</h2>
          <div>
            <label className={labelCls}>Full Name *</label>
            <input required className={inputCls} placeholder="e.g. Hugo García" value={form.headCoachName}
              onChange={(e) => update({ headCoachName: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Role Title</label>
            <input className={inputCls} placeholder="Head Coach" value={form.headCoachRole}
              onChange={(e) => update({ headCoachRole: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input required type="email" className={inputCls} placeholder="coach@example.com" value={form.headCoachEmail}
              onChange={(e) => update({ headCoachEmail: e.target.value })} />
          </div>
        </section>

        {/* Assistant Coaches */}
        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Assistant Coaches</h2>
          {form.assistants.map((a, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-1 space-y-2">
                <input className={inputCls} placeholder="Name" value={a.name}
                  onChange={(e) => updateAssistant(i, "name", e.target.value)} />
                <input className={inputCls} placeholder="Role (e.g. Assistant Coach)" value={a.role}
                  onChange={(e) => updateAssistant(i, "role", e.target.value)} />
              </div>
              {form.assistants.length > 1 && (
                <button type="button" onClick={() => removeAssistant(i)}
                  className="mt-1 text-red-400 hover:text-red-600 text-2xl font-bold w-10 h-10 flex items-center justify-center">
                  ×
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addAssistant}
            className="w-full border-2 border-dashed border-blue-300 text-blue-600 rounded-xl py-3 text-base font-semibold hover:bg-blue-50">
            + Add Assistant Coach
          </button>
          <p className="text-sm text-gray-400">Leave name blank if none.</p>
        </section>

        {/* Practice Schedule */}
        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Practice Schedule</h2>
          {form.practiceSlots.map((slot, i) => (
            <div key={i} className="space-y-3">
              <p className="text-sm font-bold text-blue-600 uppercase tracking-wide">Day {i + 1}</p>
              <div>
                <label className={labelCls}>Day</label>
                <input className={inputCls} placeholder="e.g. Tuesday" value={slot.day}
                  onChange={(e) => updateSlot(i, "day", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Time</label>
                <input className={inputCls} placeholder="e.g. 5:30 PM – 7:00 PM" value={slot.time}
                  onChange={(e) => updateSlot(i, "time", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Location / Field</label>
                <input className={inputCls} placeholder="e.g. Cesar Chavez Park, Field 3" value={slot.location}
                  onChange={(e) => updateSlot(i, "location", e.target.value)} />
              </div>
              {i < form.practiceSlots.length - 1 && <hr className="border-gray-100" />}
            </div>
          ))}
        </section>

        {/* Roster */}
        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Roster</h2>
          <div className="grid grid-cols-12 gap-2 text-sm font-semibold text-gray-500 px-1">
            <span className="col-span-1">#</span>
            <span className="col-span-5">Name</span>
            <span className="col-span-4">Position</span>
            <span className="col-span-2"></span>
          </div>
          {form.players.map((p, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                className="col-span-1 border border-gray-300 rounded-xl px-2 py-3 text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="#" value={p.number} maxLength={2}
                onChange={(e) => updatePlayer(i, "number", e.target.value)} />
              <input
                className="col-span-5 border border-gray-300 rounded-xl px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Player name" value={p.name}
                onChange={(e) => updatePlayer(i, "name", e.target.value)} />
              <select
                className="col-span-4 border border-gray-300 rounded-xl px-3 py-3 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={p.position}
                onChange={(e) => updatePlayer(i, "position", e.target.value as Position)}>
                <option value="GK">GK</option>
                <option value="DEF">DEF</option>
                <option value="MID">MID</option>
                <option value="FWD">FWD</option>
              </select>
              <button type="button" onClick={() => removePlayer(i)}
                className="col-span-2 text-red-400 hover:text-red-600 text-2xl font-bold flex items-center justify-center h-12">
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={addPlayer}
            className="w-full border-2 border-dashed border-blue-300 text-blue-600 rounded-xl py-3 text-base font-semibold hover:bg-blue-50">
            + Add Player
          </button>
        </section>

        {/* Error */}
        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full bg-blue-700 text-white rounded-2xl py-5 text-xl font-bold shadow-md hover:bg-blue-800 disabled:opacity-50 transition-colors">
          {status === "submitting" ? "Saving…" : `Save ${activeTeam.toUpperCase()} Data →`}
        </button>
      </form>
    </div>
  );
}
