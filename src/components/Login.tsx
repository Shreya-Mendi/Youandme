import { useState } from "react";
import { apiLogin, saveSession } from "../lib/auth";
import type { Session } from "../lib/auth";
import { Card, EmojiSticker, Highlight, Input, TealButton } from "./ui";

export function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!name.trim() || !pass) {
      setError("Pop in your name and password 💌");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const session = await apiLogin(name.trim(), pass);
      saveSession(session);
      onLogin(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <img
              src="/couple-sticker.png"
              alt="A couple cooking together"
              className="h-36 w-auto rotate-3 drop-shadow-[0_14px_24px_rgba(20,20,20,0.24)]"
            />
            <EmojiSticker
              emoji="🫶"
              size="md"
              className="absolute -left-3 -top-2"
            />
            <EmojiSticker
              emoji="💕"
              size="sm"
              className="absolute -right-2 bottom-2 !rotate-6"
            />
          </div>
          <h1 className="font-display text-4xl font-extrabold lowercase tracking-tight text-ink">
            u-n-me
          </h1>
          <p className="mt-1 font-hand text-2xl text-teal-600">
            just the two of us 💕
          </p>
        </div>

        <Card className="p-6" rotate={-1}>
          <p className="mb-4 text-center text-sm font-semibold text-ink/55">
            Who's logging in? <Highlight>Welcome back.</Highlight>
          </p>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink/55">
                Your name
              </span>
              <Input
                value={name}
                onChange={setName}
                placeholder="e.g. Shreya"
                onKeyDown={onKeyDown}
                autoFocus
                className="w-full"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink/55">
                Password
              </span>
              <Input
                value={pass}
                onChange={setPass}
                type="password"
                placeholder="••••••••"
                onKeyDown={onKeyDown}
                className="w-full"
              />
            </label>

            {error && (
              <p className="rounded-2xl bg-pink-soft px-3 py-2 text-center text-xs font-bold text-pink-700">
                {error}
              </p>
            )}

            <TealButton
              type="button"
              onClick={submit}
              disabled={busy}
              className="w-full"
            >
              {busy ? "Logging in…" : "Log in 🫶"}
            </TealButton>
          </div>
        </Card>

        <p className="mt-5 text-center text-xs font-semibold text-ink/40">
          a private space for two · your shared life, together
        </p>
      </div>
    </div>
  );
}
