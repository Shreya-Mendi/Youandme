import { useMemo, useRef, useState } from "react";
import {
  Check,
  Heart,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import type { DateIdea, DateProposal, DateVibe } from "../types";
import { useStore } from "../store";
import { relativeTime } from "../lib/format";
import {
  ALL_VIBES,
  currentSeason,
  mapUrl,
  rankDateIdeas,
  VIBE_STYLE,
} from "../lib/dateRecommender";
import { DATE_IDEAS } from "../data/dateIdeas";
import {
  Card,
  EmojiSticker,
  GhostButton,
  Highlight,
  Input,
  PersonChip,
  SectionLabel,
  StickerDots,
  TealButton,
} from "./ui";

export function DateNightView() {
  const { state, proposeDate, setDateCity } = useStore();
  const formRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("");
  const [idea, setIdea] = useState("");
  const [when, setWhen] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [linkedIdeaId, setLinkedIdeaId] = useState<string | undefined>();

  const [vibes, setVibes] = useState<DateVibe[]>([]);
  const [mood, setMood] = useState("");

  const partner = state.currentPerson === "you" ? "partner" : "you";
  const season = currentSeason();

  const ranked = useMemo(
    () => rankDateIdeas(DATE_IDEAS, { vibes, text: mood, season }).slice(0, 8),
    [vibes, mood, season]
  );

  const submit = () => {
    if (!title.trim() || !idea.trim()) return;
    proposeDate({ title, idea, when, location, notes, linkedIdeaId });
    setTitle("");
    setIdea("");
    setWhen("");
    setLocation("");
    setNotes("");
    setLinkedIdeaId(undefined);
  };

  const useIdea = (di: DateIdea) => {
    setTitle(di.title);
    setIdea(di.description);
    setLinkedIdeaId(di.id);
    if (di.atHome) setLocation("at home");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleVibe = (v: DateVibe) =>
    setVibes((cur) =>
      cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
    );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <EmojiSticker emoji="💕" size="lg" />
        <div>
          <SectionLabel>Date Night</SectionLabel>
          <p className="text-sm font-semibold text-ink/55">
            Propose a plan and see if he's <Highlight>up for it.</Highlight>
          </p>
        </div>
      </div>

      {/* Propose a date */}
      <div ref={formRef}>
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold text-ink/45">
          Proposing as <PersonChip person={state.currentPerson} /> to{" "}
          <PersonChip person={partner} />
        </div>
        <div className="space-y-3">
          <Input
            value={title}
            onChange={setTitle}
            placeholder="Date title — e.g. Rooftop sunset drinks 🌇"
            className="w-full"
          />
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={2}
            placeholder="Write the plan… what are we doing, and why it'll be fun."
            className="w-full rounded-2xl border border-black/10 bg-cream px-3 py-2 text-sm font-medium text-ink outline-none focus:border-teal-400 focus:bg-white"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={when}
              onChange={setWhen}
              placeholder="When? e.g. Friday 7pm"
              className="w-full"
            />
            <Input
              value={location}
              onChange={setLocation}
              placeholder="Where? (optional)"
              className="w-full"
            />
          </div>
          <Input
            value={notes}
            onChange={setNotes}
            placeholder="Any notes (dress code, budget, surprise…)"
            className="w-full"
          />
          <div className="flex items-center justify-between gap-2">
            {linkedIdeaId ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-soft px-2.5 py-1 text-xs font-bold text-ink/70">
                <Sparkles className="h-3 w-3" /> from a suggestion
              </span>
            ) : (
              <span />
            )}
            <TealButton onClick={submit} disabled={!title.trim() || !idea.trim()}>
              <span className="inline-flex items-center gap-1">
                <Heart className="h-4 w-4" /> Propose date
              </span>
            </TealButton>
          </div>
        </div>
      </Card>
      </div>

      {/* Proposals */}
      <div className="space-y-3">
        <SectionLabel>Your date proposals</SectionLabel>
        {state.dateProposals.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm font-semibold text-ink/50">
              No dates proposed yet.
            </p>
            <p className="mt-1 font-hand text-xl text-pink">
              ask him out already 💌
            </p>
          </Card>
        ) : (
          state.dateProposals.map((p, i) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              rotate={i % 2 === 0 ? -1 : 1}
            />
          ))
        )}
      </div>

      {/* Suggester */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <EmojiSticker emoji="✨" size="md" />
          <div>
            <SectionLabel>Need an idea?</SectionLabel>
            <p className="text-sm font-semibold text-ink/55">
              Tell u-n-me your mood — get date ideas near you.
            </p>
          </div>
        </div>

        <Card className="relative p-5">
          <StickerDots className="absolute right-4 top-4" />
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-xs font-bold text-ink/55">
                Where are you? (for nearby suggestions)
              </p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-pink" />
                <Input
                  value={state.dateCity}
                  onChange={setDateCity}
                  placeholder="Your city or area — e.g. Gurugram"
                  className="w-full max-w-xs"
                />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold text-ink/55">
                What's the vibe?
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_VIBES.map((v) => {
                  const active = vibes.includes(v);
                  return (
                    <button
                      key={v}
                      onClick={() => toggleVibe(v)}
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition ${
                        active
                          ? "bg-ink text-white shadow-sm"
                          : `${VIBE_STYLE[v]} hover:opacity-80`
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold text-ink/55">
                …or describe the idea
              </p>
              <Input
                value={mood}
                onChange={setMood}
                placeholder="e.g. something outdoorsy and cheap, or cozy rainy-day"
                className="w-full"
              />
            </div>
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          {ranked.map(({ idea: di, why }) => (
            <IdeaCard
              key={di.id}
              idea={di}
              why={why}
              city={state.dateCity}
              onPropose={() => useIdea(di)}
            />
          ))}
        </div>
        <p className="text-center font-hand text-lg text-ink/40">
          location links open Google Maps · ideas ranked by your vibe & season
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DateProposal["status"] }) {
  const map: Record<DateProposal["status"], string> = {
    proposed: "bg-butter-soft text-ink/70",
    accepted: "bg-mint-soft text-ink/80",
    declined: "bg-black/5 text-ink/50",
    counter: "bg-lavender-soft text-ink/70",
  };
  const label: Record<DateProposal["status"], string> = {
    proposed: "waiting…",
    accepted: "we're on! 💕",
    declined: "maybe next time",
    counter: "counter-offer",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${map[status]}`}
    >
      {label[status]}
    </span>
  );
}

function ProposalCard({
  proposal: p,
  rotate,
}: {
  proposal: DateProposal;
  rotate: -1 | 1;
}) {
  const { state, respondToProposal, reactToProposal, replyToProposal } =
    useStore();
  const [reply, setReply] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [counter, setCounter] = useState("");
  const [showCounter, setShowCounter] = useState(false);

  const me = state.currentPerson;
  const isAuthor = p.authorId === me;
  const hearts = p.reactions.filter((r) => r.type === "heart").length;
  const thumbs = p.reactions.filter((r) => r.type === "thumbsup").length;

  const sendReply = () => {
    if (!reply.trim()) return;
    replyToProposal(p.id, reply);
    setReply("");
    setShowReply(false);
  };

  const sendCounter = () => {
    if (!counter.trim()) return;
    respondToProposal(p.id, "counter", counter);
    setCounter("");
    setShowCounter(false);
  };

  const canRespond = !isAuthor && p.status === "proposed";

  return (
    <Card hover rotate={rotate} className="p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PersonChip person={p.authorId} />
          <span className="text-xs font-semibold text-ink/40">
            {relativeTime(p.createdAt)}
          </span>
        </div>
        <StatusBadge status={p.status} />
      </div>

      <h3 className="font-display text-lg font-extrabold text-ink">
        {p.title}
      </h3>
      <p className="mt-0.5 text-sm font-medium text-ink/75">{p.idea}</p>

      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-ink/60">
        {p.when && (
          <span className="rounded-full bg-cream px-2.5 py-1">🕐 {p.when}</span>
        )}
        {p.location && (
          <span className="rounded-full bg-cream px-2.5 py-1">
            📍 {p.location}
          </span>
        )}
        {p.notes && (
          <span className="rounded-full bg-cream px-2.5 py-1">
            📝 {p.notes}
          </span>
        )}
      </div>

      {p.status === "accepted" && (
        <p className="mt-2 font-hand text-lg font-bold text-mint">
          {state.names[p.respondedBy ?? "partner"]} is in! it's a date 💕
        </p>
      )}
      {p.status === "counter" && p.counterText && (
        <p className="mt-2 rounded-2xl bg-lavender-soft px-3 py-2 text-sm font-semibold text-ink/75">
          <span className="font-hand text-base text-ink/60">counter:</span>{" "}
          {p.counterText}
        </p>
      )}

      {/* Respond controls */}
      {canRespond && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <TealButton onClick={() => respondToProposal(p.id, "accepted")}>
            <span className="inline-flex items-center gap-1">
              <Check className="h-4 w-4" /> I'm up for it!
            </span>
          </TealButton>
          <GhostButton onClick={() => setShowCounter((v) => !v)}>
            Counter…
          </GhostButton>
          <button
            onClick={() => respondToProposal(p.id, "declined")}
            className="rounded-full px-3 py-1.5 text-sm font-bold text-ink/40 transition hover:text-ink/70"
          >
            Can't this time
          </button>
        </div>
      )}

      {/* Author can accept a counter-offer */}
      {p.status === "counter" && isAuthor && (
        <div className="mt-3">
          <TealButton onClick={() => respondToProposal(p.id, "accepted")}>
            <span className="inline-flex items-center gap-1">
              <Check className="h-4 w-4" /> Works for me!
            </span>
          </TealButton>
        </div>
      )}

      {showCounter && (
        <div className="mt-2 flex gap-2">
          <Input
            value={counter}
            onChange={setCounter}
            placeholder="Propose a tweak — e.g. Saturday instead?"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && sendCounter()}
          />
          <TealButton onClick={sendCounter}>Send</TealButton>
        </div>
      )}

      {/* Reactions + replies */}
      <div className="mt-3 flex items-center gap-2">
        <ReactBtn
          active={hearts > 0}
          onClick={() => reactToProposal(p.id, "heart")}
        >
          <Heart className={`h-3.5 w-3.5 ${hearts > 0 ? "fill-current" : ""}`} />
          {hearts > 0 && <span>{hearts}</span>}
        </ReactBtn>
        <ReactBtn
          active={thumbs > 0}
          onClick={() => reactToProposal(p.id, "thumbsup")}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {thumbs > 0 && <span>{thumbs}</span>}
        </ReactBtn>
        <ReactBtn active={false} onClick={() => setShowReply((v) => !v)}>
          <MessageCircle className="h-3.5 w-3.5" />
          Reply
        </ReactBtn>
      </div>

      {p.replies.length > 0 && (
        <div className="mt-3 space-y-1.5 border-l-2 border-black/10 pl-3">
          {p.replies.map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-xs">
              <PersonChip person={r.authorId} />
              <span className="font-medium text-ink/65">{r.text}</span>
              <span className="text-ink/30">{relativeTime(r.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {showReply && (
        <div className="mt-2 flex gap-2">
          <Input
            value={reply}
            onChange={setReply}
            placeholder="Reply…"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && sendReply()}
          />
          <TealButton onClick={sendReply}>Send</TealButton>
        </div>
      )}
    </Card>
  );
}

function IdeaCard({
  idea,
  why,
  city,
  onPropose,
}: {
  idea: DateIdea;
  why: string;
  city: string;
  onPropose: () => void;
}) {
  const link = mapUrl(idea, city);
  return (
    <Card hover className="flex flex-col p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-extrabold text-ink">
          {idea.title}
        </h3>
        {idea.atHome ? (
          <span className="shrink-0 rounded-full bg-peach-soft px-2 py-0.5 text-xs font-bold text-ink/70">
            🏠 at home
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-sky-soft px-2 py-0.5 text-xs font-bold text-ink/70">
            {idea.setting === "outdoor" ? "🌳 outdoor" : "out"}
          </span>
        )}
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-ink/40">
        {idea.category} · {idea.budget} · {idea.duration}
      </p>
      <p className="mt-1.5 text-sm font-medium text-ink/75">
        {idea.description}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {idea.vibes.slice(0, 3).map((v) => (
          <span
            key={v}
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${VIBE_STYLE[v]}`}
          >
            {v}
          </span>
        ))}
      </div>

      <p className="mt-2 font-hand text-base text-pink">{why}</p>

      <div className="mt-3 flex items-center gap-2">
        <TealButton onClick={onPropose} className="!px-3 !py-1.5 text-xs">
          <span className="inline-flex items-center gap-1">
            <Send className="h-3.5 w-3.5" /> Propose this
          </span>
        </TealButton>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-ink/60 transition hover:border-ink/30 hover:text-ink"
          >
            <MapPin className="h-3.5 w-3.5" /> Open in Maps
          </a>
        )}
      </div>
    </Card>
  );
}

function ReactBtn({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold transition ${
        active
          ? "border-pink/40 bg-pink-soft text-pink"
          : "border-black/10 bg-white text-ink/50 hover:border-ink/30"
      }`}
    >
      {children}
    </button>
  );
}
