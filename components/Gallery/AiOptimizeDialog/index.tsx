import { useState, type ReactNode } from "react";
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { IAnkiCard } from "@/lib/utils/db/card";
import { Sparkles } from "lucide-react";

type AiOptimizeDialogProps = {
  trigger: ReactNode;
  card: Pick<IAnkiCard, "front" | "backEnglish" | "deck" | "notetype">;
};

type OptimizeResult = {
  optimizedFront: string;
  optimizedBackEnglish: string;
  explanation: string;
};

export function AiOptimizeDialog({
  trigger,
  card,
}: AiOptimizeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OptimizeResult | null>(null);

  const handleOptimize = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/ai/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          front: card.front,
          backEnglish: card.backEnglish,
          deck: card.deck,
          notetype: card.notetype,
        }),
      });

      const payload = (await response.json()) as
        | OptimizeResult
        | { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "AI 优化失败");
      }

      setResult(payload as OptimizeResult);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "AI 优化失败";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setIsLoading(false);
          setError("");
          setResult(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2 text-sky-600">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">AI Optimize</span>
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            AI 优化卡片内容
          </DialogTitle>
          <DialogDescription className="leading-6 text-gray-500">
            这里先承接 AI 优化入口，方便后面把润色、例句扩写、释义整理之类的能力继续往里接。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Front
            </p>
            <p className="mt-2 break-words text-base font-medium leading-6 text-gray-900">
              {card.front}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Back English
            </p>
            <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {card.backEnglish || "暂无反面内容"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {card.deck ? (
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
                Deck: {card.deck}
              </span>
            ) : null}
            {card.notetype ? (
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
                Note Type: {card.notetype}
              </span>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Optimized Front
              </p>
              <p className="mt-2 break-words text-base font-medium leading-6 text-gray-900">
                {result.optimizedFront}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Optimized Back English
              </p>
              <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {result.optimizedBackEnglish}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Explanation
              </p>
              <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {result.explanation}
              </p>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <button
            type="button"
            onClick={handleOptimize}
            disabled={isLoading}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "优化中..." : "开始优化"}
          </button>
          <DialogClose asChild>
            <button
              type="button"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              关闭
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
