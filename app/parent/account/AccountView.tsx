"use client";

import Image from "next/image";

interface ParentAccount {
  id: string;
  email: string;
  displayName: string;
  playerName: string;
  createdAt: number;
  approved: boolean;
}

interface AccountViewProps {
  account: ParentAccount;
  welcome: boolean;
}

export default function AccountView({ account, welcome }: AccountViewProps) {
  const memberSince = new Date(account.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleLogout() {
    await fetch("/api/parent/logout", { method: "POST" });
    window.location.href = "/family";
  }

  return (
    <div className="min-h-screen bg-[var(--color-navy)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[var(--color-accent)] shadow-xl">
            <Image src="/logo.jpg" alt="North Legends FC" width={80} height={80} className="object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white">My Account</h1>
            <p className="text-sm text-gray-300 mt-1">North Legends FC · Family Portal</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {welcome && (
            <div className="bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 rounded-2xl px-5 py-4 text-sm text-white font-medium">
              Welcome, {account.displayName}! You're all set.
            </div>
          )}

          {!account.approved && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4 text-sm text-amber-300">
              Account pending coach approval — you'll get access to team content shortly.
            </div>
          )}

          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 shadow-2xl border border-white/10 flex flex-col gap-5">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Name</p>
              <p className="text-white font-semibold">{account.displayName}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Email</p>
              <p className="text-white">{account.email}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Linked Player</p>
              <p className="text-white">{account.playerName}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Member Since</p>
              <p className="text-white">{memberSince}</p>
            </div>

            <div className="pt-2 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
