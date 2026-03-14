"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Button } from "@headlessui/react";
import { ImportDialog } from "@/components/Gallery/ImportDialog";
import {
  deleteAnkiCard,
  getAllAnkiCards,
  type IAnkiCard,
} from "@/lib/utils/db/card";
import { X } from "lucide-react";

export default function GalleryPage() {
  const [data, setData] = useState<IAnkiCard[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckQuery = searchParams.get("deck")?.trim() ?? "";
  const deckIdParam = searchParams.get("deckId");
  const targetDeckId =
    deckIdParam !== null && deckIdParam !== "" ? Number(deckIdParam) : undefined;

  const loadData = async () => {
    const cards = await getAllAnkiCards();
    const filteredCards = deckQuery
      ? cards.filter((card) => {
          const deck = card.deck?.trim();
          return deck === deckQuery || deck?.startsWith(`${deckQuery}::`);
        })
      : cards;
    setData(filteredCards);
  };

  useEffect(() => {
    let cancelled = false;

    const syncCards = async () => {
      const cards = await getAllAnkiCards();
      if (cancelled) return;

      const filteredCards = deckQuery
        ? cards.filter((card) => {
            const deck = card.deck?.trim();
            return deck === deckQuery || deck?.startsWith(`${deckQuery}::`);
          })
        : cards;

      setData(filteredCards);
    };

    void syncCards();

    return () => {
      cancelled = true;
    };
  }, [deckQuery]);

  const handleDelete = async (id: number) => {
    await deleteAnkiCard(id);
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {deckQuery ? deckQuery : "词汇库"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {deckQuery
                ? "查看该牌组及其子牌组下的所有卡片"
                : "查看所有已导入的 Anki 卡片"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/decks"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              返回 Decks
            </Link>
            <button
              type="button"
              onClick={() => router.push("/typing")}
              aria-label="关闭词汇库"
              title="关闭词汇库"
              className="cursor-pointer rounded p-1 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 pb-2">
          <ImportDialog
            trigger={
              <Button className="cursor-pointer rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 data-[active]:bg-sky-700">
                导入
              </Button>
            }
            onSuccess={loadData}
            targetDeckId={Number.isFinite(targetDeckId) ? targetDeckId : undefined}
          />
          {deckQuery ? (
            <Link
              href="/gallery"
              className="text-sm font-medium text-sky-700 transition-colors hover:text-sky-900"
            >
              查看全部卡片
            </Link>
          ) : null}
        </div>

        {/* Table Section */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  正面
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  反面
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  导入时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.map((item) => {
                return (
                  <tr
                    className="transition-colors duration-150 hover:bg-gray-50"
                    key={item.guid}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {item.front}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {item.back}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {dayjs(item.importedAt * 1000).format(
                        "YYYY-MM-DD HH:mm:ss",
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <button
                        onClick={() => {
                          if (
                            window.confirm(`确定要删除「${item.front}」吗？`)
                          ) {
                            handleDelete(item.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 transition-colors duration-150 cursor-pointer"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
