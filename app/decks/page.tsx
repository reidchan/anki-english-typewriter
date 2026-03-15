"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { Button } from "@headlessui/react";
import { ImportDialog } from "@/components/Gallery/ImportDialog";
import { getAllCards, getCardsCount } from "@/lib/utils/db/card";
import { addDeck, getAllDecks, getDeckByName } from "@/lib/utils/db/deck";
import type { IDeckRecord } from "@/lib/utils/db/deck";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronRight, Layers3, LibraryBig, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type DeckSummary = {
  id: number;
  key: string;
  name: string;
  level: number;
  totalCards?: number;
  latestImportedAt?: number;
};

function buildDeckSummaries(
  decks: IDeckRecord[],
  cardCountByDeckId: Map<number, number>,
): DeckSummary[] {
  return [...(Array.isArray(decks) ? decks : [])]
    .filter(
      (deck): deck is IDeckRecord & { id: number } =>
        typeof deck.id === "number",
    )
    .sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      return a.name.localeCompare(b.name);
    })
    .map((deck) => ({
      id: deck.id,
      key: deck.name,
      name: deck.name.split("::").filter(Boolean).at(-1) ?? deck.name,
      level: deck.level,
      totalCards: cardCountByDeckId.get(deck.id) ?? 0,
      latestImportedAt: deck.updatedAt,
    }));
}

export default function DecksPage() {
  const [cardsCount, setCardsCount] = useState(0);
  const [decks, setDecks] = useState<IDeckRecord[]>([]);
  const [cardCountByDeckId, setCardCountByDeckId] = useState<
    Map<number, number>
  >(new Map());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const loadCards = async () => {
    const [nextCardsCount, nextDecks, nextCards] = await Promise.all([
      getCardsCount(),
      getAllDecks(),
      getAllCards(),
    ]);
    const nextCardCountByDeckId = new Map<number, number>();
    nextCards.forEach((card) => {
      nextCardCountByDeckId.set(
        card.deckId,
        (nextCardCountByDeckId.get(card.deckId) ?? 0) + 1,
      );
    });
    setCardsCount(nextCardsCount);
    setDecks(nextDecks);
    setCardCountByDeckId(nextCardCountByDeckId);
  };

  const handleCreateDeck = async () => {
    const normalizedName = deckName.trim().replaceAll(/\s*::\s*/g, "::");
    if (!normalizedName) {
      setCreateError("请输入目录名");
      return;
    }

    const parts = normalizedName.split("::").filter(Boolean);
    if (parts.length === 0) {
      setCreateError("目录名格式不正确");
      return;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      const existingDeck = await getDeckByName(normalizedName);
      if (existingDeck) {
        setCreateError("目录已存在");
        return;
      }

      let parentId: number | null = null;
      if (parts.length > 1) {
        const parentName = parts.slice(0, -1).join("::");
        const parentDeck = await getDeckByName(parentName);
        if (!parentDeck?.id) {
          setCreateError("父级目录不存在，请先创建上级目录");
          return;
        }
        parentId = parentDeck.id;
      }

      await addDeck({
        name: normalizedName,
        parentId,
        level: parts.length - 1,
      });

      setDeckName("");
      setCreateDialogOpen(false);
      await loadCards();
    } catch (error) {
      console.error("创建 Deck 失败:", error);
      setCreateError("创建失败，请重试");
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const syncCards = async () => {
      const [nextCardsCount, nextDecks, nextCards] = await Promise.all([
        getCardsCount(),
        getAllDecks(),
        getAllCards(),
      ]);
      if (!cancelled) {
        const nextCardCountByDeckId = new Map<number, number>();
        nextCards.forEach((card) => {
          nextCardCountByDeckId.set(
            card.deckId,
            (nextCardCountByDeckId.get(card.deckId) ?? 0) + 1,
          );
        });
        setCardsCount(nextCardsCount);
        setDecks(nextDecks);
        setCardCountByDeckId(nextCardCountByDeckId);
      }
    };

    void syncCards();

    return () => {
      cancelled = true;
    };
  }, []);

  const deckSummaries = useMemo(
    () => buildDeckSummaries(decks, cardCountByDeckId),
    [cardCountByDeckId, decks],
  );

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
          <div className="border-b border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                  Anki
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
                  Decks
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-500">
                  按牌组查看已导入卡片。当前还没有复习排程，所以所有卡片暂时按
                  `New` 统计显示。
                </p>
              </div>
              <div className="flex items-center gap-2 self-start">
                <Link
                  href="/gallery"
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Browse Cards
                </Link>
                <button
                  type="button"
                  onClick={() => router.push("/typing")}
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                  aria-label="关闭 Decks 页面"
                  title="关闭 Decks 页面"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ImportDialog
                trigger={
                  <Button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-700">
                    导入卡片
                  </Button>
                }
                onSuccess={loadCards}
              />
              <Dialog
                open={createDialogOpen}
                onOpenChange={(open) => {
                  setCreateDialogOpen(open);
                  if (!open) {
                    setDeckName("");
                    setCreateError("");
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-700">
                    添加目录
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader className="space-y-3">
                    <DialogTitle className="text-xl font-semibold text-gray-900">
                      添加目录
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="deck-name"
                        className="text-sm font-medium text-gray-700"
                      >
                        目录名
                      </label>
                      <input
                        id="deck-name"
                        value={deckName}
                        onChange={(event) => {
                          setDeckName(event.target.value);
                          if (createError) {
                            setCreateError("");
                          }
                        }}
                        placeholder="例如 English::CET4"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-sky-500"
                      />
                      <p className="text-xs text-gray-500">
                        支持 `::` 层级。创建子目录前，请先创建父目录。
                      </p>
                      {createError ? (
                        <p className="text-sm text-red-500">{createError}</p>
                      ) : null}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setCreateDialogOpen(false)}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCreateDeck()}
                        disabled={isCreating}
                        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isCreating ? "创建中..." : "创建"}
                      </button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="inline-flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-700">
                <LibraryBig className="h-4 w-4 text-sky-600" />
                <span>{deckSummaries.length} decks</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
                <Layers3 className="h-4 w-4 text-indigo-600" />
                <span>{cardsCount} cards</span>
              </div>
            </div>
          </div>

          <div className="px-3 py-4 sm:px-5">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="grid grid-cols-[minmax(0,1.7fr)_110px_110px_110px_110px_150px_120px] items-center border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                <div>Deck</div>
                <div className="text-center">总卡片数</div>
                <div className="text-center"></div>
                <div className="text-center"></div>
                <div className="text-center"></div>
                <div className="text-center">导入时间</div>
                <div className="flex justify-end">操作</div>
              </div>

              {deckSummaries.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <div className="rounded-full bg-sky-50 p-4 text-sky-600">
                    <LibraryBig className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      还没有任何牌组
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      先导入一份 Anki 导出的 `.txt` 文件，Decks
                      页面会自动生成牌组列表。
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  {deckSummaries.map((deck) => (
                    <div
                      key={deck.key}
                      className="grid grid-cols-[minmax(0,1.7fr)_110px_110px_110px_110px_150px_120px] items-center border-b border-gray-100 px-5 py-4 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <div
                        className="flex items-center gap-3"
                        style={{ paddingLeft: `${deck.level * 20}px` }}
                      >
                        {deck.level > 0 ? (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        ) : (
                          <LibraryBig className="h-4 w-4 text-indigo-500" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">
                            {deck.name}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {deck.key}
                          </p>
                        </div>
                      </div>
                      <div className="text-center text-base font-semibold text-sky-600">
                        {deck.totalCards ?? 0}
                      </div>
                      <div className="text-center text-gray-400"></div>
                      <div className="text-center text-emerald-600"></div>
                      <div className="text-center text-gray-400"></div>
                      <div className="text-center text-xs text-gray-500">
                        {deck.latestImportedAt
                          ? dayjs(deck.latestImportedAt * 1000).format(
                              "YYYY-MM-DD",
                            )
                          : "-"}
                      </div>
                      <div className="flex justify-end">
                        <Link
                          href={`/gallery?deckId=${deck.id}&deck=${encodeURIComponent(deck.key)}`}
                          className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          Browse
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
