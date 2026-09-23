import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ACCESS_HASH, UNLOCK_STORAGE_KEY, sha256Hex } from "../accessHash";

function isUnlocked(): boolean {
  try {
    return localStorage.getItem(UNLOCK_STORAGE_KEY) === ACCESS_HASH;
  } catch {
    return false;
  }
}

export function AccessGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(false), 500);
      return () => clearTimeout(t);
    }
  }, [error]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setChecking(true);
    const hash = await sha256Hex(passphrase.trim());
    setChecking(false);
    if (hash === ACCESS_HASH) {
      try {
        localStorage.setItem(UNLOCK_STORAGE_KEY, hash);
      } catch {
        // localStorage unavailable (private browsing etc.) — still unlock for this session.
      }
      setUnlocked(true);
    } else {
      setError(true);
      setPassphrase("");
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl ${
          error ? "animate-[shake_0.4s_ease-in-out]" : ""
        }`}
      >
        <h1 className="text-center text-lg font-bold text-slate-100">Conference Tracker</h1>
        <p className="mt-1 text-center text-sm text-slate-400">This tracker is private. Enter the passphrase to continue.</p>
        <input
          autoFocus
          type="password"
          inputMode="text"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Passphrase"
          className="input mt-4"
        />
        {error && <p className="mt-2 text-sm text-red-400">That's not it — try again.</p>}
        <button
          type="submit"
          disabled={checking || !passphrase}
          className="mt-4 min-h-[44px] w-full rounded-xl bg-emerald-600 font-semibold text-white disabled:opacity-40"
        >
          {checking ? "Checking…" : "Unlock"}
        </button>
      </form>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
