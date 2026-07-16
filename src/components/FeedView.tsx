import { useState } from "react";
import { Heart, MessageCircle, Send, ThumbsUp } from "lucide-react";
import type { FeedMessage, WeekDay } from "../types";
import { useStore } from "../store";
import { relativeTime } from "../lib/format";
import {
  Card,
  EmojiSticker,
  Input,
  PersonChip,
  SectionLabel,
  TealButton,
} from "./ui";

export function FeedView() {
  const { state, plan, recipes, postMessage } = useStore();
  const [text, setText] = useState("");
  const [attachedDay, setAttachedDay] = useState<WeekDay | "">("");

  const post = () => {
    if (!text.trim()) return;
    const day = attachedDay || undefined;
    const recipeId = day
      ? plan.find((d) => d.day === day)?.recipeId
      : undefined;
    postMessage(text, day, recipeId);
    setText("");
    setAttachedDay("");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <EmojiSticker emoji="💬" size="lg" />
        <div>
          <SectionLabel>Nudges</SectionLabel>
          <p className="text-sm font-semibold text-ink/55">
            Little food notes between the two of you
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink/45">
          Posting as <PersonChip person={state.currentPerson} />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="This is what I wanna eat this week — we cool?"
          className="w-full rounded-2xl border border-black/10 bg-cream px-3 py-2 text-sm font-medium text-ink outline-none focus:border-teal-400 focus:bg-white"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <select
            value={attachedDay}
            onChange={(e) => setAttachedDay(e.target.value as WeekDay | "")}
            className="rounded-2xl border border-black/10 bg-cream px-3 py-1.5 text-xs font-semibold text-ink/70 outline-none focus:border-teal-400 focus:bg-white"
          >
            <option value="">Attach a day (optional)</option>
            {plan.map((d) => (
              <option key={d.day} value={d.day}>
                {d.day}
              </option>
            ))}
          </select>
          <TealButton onClick={post} disabled={!text.trim()}>
            <span className="inline-flex items-center gap-1">
              <Send className="h-4 w-4" /> Post
            </span>
          </TealButton>
        </div>
      </Card>

      {state.feed.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-semibold text-ink/50">
            No nudges yet. Say hi 👋
          </p>
          <p className="mt-1 font-hand text-xl text-teal-600">we cool?</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {state.feed.map((m) => (
            <MessageCard key={m.id} message={m} recipeTitle={
              m.attachedRecipeId
                ? recipes.find((r) => r.id === m.attachedRecipeId)?.title
                : undefined
            } />
          ))}
        </div>
      )}
    </div>
  );
}

function MessageCard({
  message,
  recipeTitle,
}: {
  message: FeedMessage;
  recipeTitle?: string;
}) {
  const { reactToMessage, replyToMessage } = useStore();
  const [reply, setReply] = useState("");
  const [showReply, setShowReply] = useState(false);

  const thumbs = message.reactions.filter((r) => r.type === "thumbsup").length;
  const hearts = message.reactions.filter((r) => r.type === "heart").length;

  const isWeCool = /we cool\??/i.test(message.text);

  const submitReply = () => {
    if (!reply.trim()) return;
    replyToMessage(message.id, reply);
    setReply("");
    setShowReply(false);
  };

  return (
    <Card hover className="p-4">
      <div className="mb-1 flex items-center gap-2">
        <PersonChip person={message.authorId} />
        <span className="text-xs font-semibold text-ink/40">
          {relativeTime(message.createdAt)}
        </span>
      </div>
      <p className="text-sm font-medium text-ink/85">{message.text}</p>

      {(message.attachedDay || recipeTitle) && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
          {message.attachedDay && <strong>{message.attachedDay}</strong>}
          {recipeTitle && <span>· {recipeTitle}</span>}
        </div>
      )}

      {isWeCool && message.replies.some((r) => /cool/i.test(r.text)) && (
        <p className="mt-2 font-hand text-lg font-bold text-teal-600">
          we cool! ✅
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <ReactBtn
          active={thumbs > 0}
          onClick={() => reactToMessage(message.id, "thumbsup")}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {thumbs > 0 && <span>{thumbs}</span>}
        </ReactBtn>
        <ReactBtn
          active={hearts > 0}
          onClick={() => reactToMessage(message.id, "heart")}
        >
          <Heart
            className={`h-3.5 w-3.5 ${hearts > 0 ? "fill-current" : ""}`}
          />
          {hearts > 0 && <span>{hearts}</span>}
        </ReactBtn>
        <ReactBtn active={false} onClick={() => setShowReply((v) => !v)}>
          <MessageCircle className="h-3.5 w-3.5" />
          Reply
        </ReactBtn>
      </div>

      {message.replies.length > 0 && (
        <div className="mt-3 space-y-1.5 border-l-2 border-black/10 pl-3">
          {message.replies.map((r) => (
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
            onKeyDown={(e) => e.key === "Enter" && submitReply()}
          />
          <TealButton onClick={submitReply}>Send</TealButton>
        </div>
      )}
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
          ? "border-teal-200 bg-teal-50 text-teal-600"
          : "border-black/10 bg-white text-ink/50 hover:border-ink/30"
      }`}
    >
      {children}
    </button>
  );
}
