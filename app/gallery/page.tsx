"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@headlessui/react";
import { ImportDialog } from "@/components/Gallery/ImportDialog";
import {
  deleteAnkiCard,
  getAllAnkiCards,
  type IAnkiCard,
} from "@/lib/utils/db/card";
import { X } from "lucide-react";

const PAGE_SIZE = 10;

export default function GalleryPage() {
  const [data, setData] = useState<IAnkiCard[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckQuery = searchParams.get("deck")?.trim() ?? "";
  const deckIdParam = searchParams.get("deckId");
  const targetDeckId =
    deckIdParam !== null && deckIdParam !== ""
      ? Number(deckIdParam)
      : undefined;

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

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return data.slice(startIndex, startIndex + PAGE_SIZE);
  }, [data, safeCurrentPage]);
  const startItem =
    data.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safeCurrentPage * PAGE_SIZE, data.length);

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
      setCurrentPage(1);
    };

    void syncCards();

    return () => {
      cancelled = true;
    };
  }, [deckQuery]);

  const handleDelete = async (id: number) => {
    await deleteAnkiCard(id);
    await loadData();
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
            targetDeckId={
              Number.isFinite(targetDeckId) ? targetDeckId : undefined
            }
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
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[46%]" />
              <col className="w-[20%]" />
              <col className="w-[12%]" />
            </colgroup>
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
              {paginatedData.map((item) => {
                return (
                  <tr
                    className="transition-colors duration-150 hover:bg-gray-50"
                    key={item.guid}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 align-top">
                      <div className="line-clamp-2 min-h-10 break-words leading-5">
                        {item.front}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 align-top">
                      <div className="line-clamp-2 min-h-10 break-words whitespace-normal leading-5">
                        {item.backEnglish}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 align-top">
                      {dayjs(item.importedAt * 1000).format(
                        "YYYY-MM-DD HH:mm:ss",
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm align-top">
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

        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            {`显示第 ${startItem}-${endItem} 条，共 ${data.length} 条`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              上一页
            </button>
            <span className="min-w-20 text-center text-sm font-medium text-gray-600">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={safeCurrentPage === totalPages}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
