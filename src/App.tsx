import { useCallback, useState } from "react";
import { StoreProvider } from "./store";
import { AuthProvider } from "./auth";
import { Login } from "./components/Login";
import { clearSession, loadSession, saveSession } from "./lib/auth";
import type { Session } from "./lib/auth";
import { Header } from "./components/Header";
import { PlannerView } from "./components/PlannerView";
import { GroceryView } from "./components/GroceryView";
import { DiscoverView } from "./components/DiscoverView";
import { RecipesView } from "./components/RecipesView";
import { GymView } from "./components/GymView";
import { FeedView } from "./components/FeedView";
import { DateNightView } from "./components/DateNightView";
import { Pill } from "./components/ui";

type Tab =
  | "week"
  | "grocery"
  | "discover"
  | "recipes"
  | "gym"
  | "date"
  | "feed";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "week", label: "This Week", emoji: "🗓️" },
  { id: "grocery", label: "Grocery", emoji: "🛒" },
  { id: "discover", label: "Discover", emoji: "✨" },
  { id: "recipes", label: "Recipes", emoji: "🍛" },
  { id: "gym", label: "Gym", emoji: "💪" },
  { id: "date", label: "Date Night", emoji: "💕" },
  { id: "feed", label: "Feed", emoji: "💬" },
];

function Shell() {
  const [tab, setTab] = useState<Tab>("week");

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Header />

        <nav className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Pill key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-base leading-none">{t.emoji}</span>
                {t.label}
              </span>
            </Pill>
          ))}
        </nav>

        <main>
          {tab === "week" && <PlannerView />}
          {tab === "grocery" && <GroceryView />}
          {tab === "discover" && <DiscoverView />}
          {tab === "recipes" && <RecipesView />}
          {tab === "gym" && <GymView />}
          {tab === "date" && <DateNightView />}
          {tab === "feed" && <FeedView />}
        </main>

        <footer className="mt-12 pb-6 text-center text-xs font-semibold text-ink/35">
          u-n-me · your shared life, together · synced privately for two
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());

  const handleLogin = useCallback((s: Session) => {
    saveSession(s);
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  if (!session) return <Login onLogin={handleLogin} />;

  return (
    <AuthProvider session={session} logout={logout}>
      <StoreProvider
        token={session.token}
        me={session.user.person}
        userName={session.user.name}
        onAuthError={logout}
      >
        <Shell />
      </StoreProvider>
    </AuthProvider>
  );
}
