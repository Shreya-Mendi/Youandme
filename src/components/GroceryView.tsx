import { useState } from "react";
import {
  Check,
  MessageCircle,
  Plus,
  RefreshCw,
  Repeat,
  Trash2,
} from "lucide-react";
import type { GroceryCategory, GroceryItem } from "../types";
import { useStore } from "../store";
import { relativeTime } from "../lib/format";
import {
  CATEGORY_ORDER,
  categorizeManualItem,
  groupByCategory,
} from "../lib/grocery";
import {
  Card,
  EmojiSticker,
  GhostButton,
  Input,
  PersonChip,
  SectionLabel,
  TealButton,
} from "./ui";

const CATEGORIES: GroceryCategory[] = [
  "Produce",
  "Meat",
  "Dairy",
  "Pantry",
  "Household",
  "Other",
];

const CATEGORY_EMOJI: Record<GroceryCategory, string> = {
  Produce: "🥬",
  Meat: "🥩",
  Dairy: "🥛",
  Pantry: "🥫",
  Household: "🧴",
  Other: "📦",
};

const CATEGORY_PASTEL: Record<GroceryCategory, string> = {
  Produce: "bg-mint-soft text-emerald-700",
  Meat: "bg-pink-soft text-pink-700",
  Dairy: "bg-sky-soft text-sky-700",
  Pantry: "bg-butter-soft text-amber-700",
  Household: "bg-lavender-soft text-violet-700",
  Other: "bg-peach-soft text-orange-700",
};

export function GroceryView() {
  const { state, addGroceryItem, regenerateGroceries } = useStore();
  const [newItem, setNewItem] = useState("");
  const [category, setCategory] = useState<GroceryCategory>("Produce");

  const groups = groupByCategory(state.groceries);
  const remaining = state.groceries.filter((g) => !g.checked).length;

  const add = () => {
    if (!newItem.trim()) return;
    const detected = categorizeManualItem(newItem);
    addGroceryItem(newItem, detected === "Household" ? "Household" : category);
    setNewItem("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <EmojiSticker emoji="🛒" size="lg" />
          <div>
            <SectionLabel>Living grocery note</SectionLabel>
            <p className="text-sm font-semibold text-ink/55">
              {remaining} item{remaining === 1 ? "" : "s"} left · shared with
              your partner
            </p>
          </div>
        </div>
        <GhostButton onClick={regenerateGroceries}>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Sync from plan
          </span>
        </GhostButton>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newItem}
            onChange={setNewItem}
            placeholder="Add an item…"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as GroceryCategory)}
            className="rounded-2xl border border-black/10 bg-cream px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-teal-400 focus:bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <TealButton onClick={add}>
            <span className="inline-flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add
            </span>
          </TealButton>
        </div>
      </Card>

      {state.groceries.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-semibold text-ink/50">
            Your list is empty. Plan some meals or add items above 🛒
          </p>
          <p className="mt-1 font-hand text-xl text-teal-600">let's stock up!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {CATEGORY_ORDER.filter((c) => groups[c].length > 0).map((cat) => (
            <div key={cat}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base leading-none">
                  {CATEGORY_EMOJI[cat]}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${CATEGORY_PASTEL[cat]}`}
                >
                  {cat}
                </span>
              </div>
              <div className="space-y-2">
                {groups[cat].map((item) => (
                  <GroceryRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GroceryRow({ item }: { item: GroceryItem }) {
  const {
    toggleGroceryCheck,
    removeGroceryItem,
    addGroceryComment,
    suggestSwap,
    acceptSwap,
    dismissSwap,
  } = useStore();

  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [showSwap, setShowSwap] = useState(false);
  const [swapText, setSwapText] = useState("");

  const submitComment = () => {
    if (!comment.trim()) return;
    addGroceryComment(item.id, comment);
    setComment("");
    setShowComment(false);
  };

  const submitSwap = () => {
    if (!swapText.trim()) return;
    suggestSwap(item.id, swapText);
    setSwapText("");
    setShowSwap(false);
  };

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => toggleGroceryCheck(item.id)}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
            item.checked
              ? "border-teal-500 bg-teal-500 text-white"
              : "border-ink/25 bg-white hover:border-teal-400"
          }`}
        >
          {item.checked && <Check className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`truncate text-sm font-bold ${
                item.checked ? "text-ink/35 line-through" : "text-ink/85"
              }`}
            >
              {item.text}
            </span>
            {item.quantity && (
              <span className="shrink-0 text-xs font-semibold text-ink/40">
                {item.quantity}
              </span>
            )}
            {item.auto && (
              <span className="shrink-0 rounded-full bg-sky-soft px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                from plan
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold text-ink/40">
            <PersonChip person={item.authorId} />
            <span>{relativeTime(item.createdAt)}</span>
            {item.checked && item.checkedBy && (
              <span className="inline-flex items-center gap-1">
                · checked by
                <PersonChip person={item.checkedBy} />
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <IconBtn
            title="Comment"
            active={item.comments.length > 0}
            onClick={() => setShowComment((v) => !v)}
          >
            <MessageCircle className="h-4 w-4" />
            {item.comments.length > 0 && (
              <span className="text-[11px]">{item.comments.length}</span>
            )}
          </IconBtn>
          <IconBtn title="Suggest swap" onClick={() => setShowSwap((v) => !v)}>
            <Repeat className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Remove" onClick={() => removeGroceryItem(item.id)}>
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      </div>

      {item.swap && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-2xl bg-peach-soft px-3 py-2 text-xs">
          <PersonChip person={item.swap.authorId} />
          <span className="font-semibold text-orange-800">
            suggests <strong>{item.swap.suggestedText}</strong> instead
          </span>
          <div className="ml-auto flex gap-1.5">
            <button
              onClick={() => acceptSwap(item.id)}
              className="rounded-full bg-teal-500 px-2.5 py-1 font-bold text-white hover:bg-teal-600"
            >
              Accept
            </button>
            <button
              onClick={() => dismissSwap(item.id)}
              className="rounded-full border border-black/10 bg-white px-2.5 py-1 font-bold text-ink/60 hover:border-ink/30"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {item.comments.length > 0 && (
        <div className="mt-2 space-y-1.5 border-l-2 border-black/10 pl-3">
          {item.comments.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-xs">
              <PersonChip person={c.authorId} />
              <span className="font-medium text-ink/65">{c.text}</span>
              <span className="text-ink/30">{relativeTime(c.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {showComment && (
        <InlineInput
          value={comment}
          onChange={setComment}
          placeholder="Add a comment…"
          onSubmit={submitComment}
        />
      )}
      {showSwap && (
        <InlineInput
          value={swapText}
          onChange={setSwapText}
          placeholder={`Swap "${item.text}" for…`}
          onSubmit={submitSwap}
          label="Suggest"
        />
      )}
    </Card>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full p-1.5 transition hover:bg-black/5 ${
        active ? "text-teal-600" : "text-ink/40"
      }`}
    >
      {children}
    </button>
  );
}

function InlineInput({
  value,
  onChange,
  placeholder,
  onSubmit,
  label = "Post",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onSubmit: () => void;
  label?: string;
}) {
  return (
    <div className="mt-2 flex gap-2">
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1"
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
      />
      <TealButton onClick={onSubmit}>{label}</TealButton>
    </div>
  );
}
