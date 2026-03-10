"use client";

import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Button } from "@headlessui/react";
import { ImportDialog } from "@/components/Gallery/ImportDialog";
import { deleteAnkiCard, getAllAnkiCards } from "@/lib/utils/db";

export default function GalleryPage() {
  const [data, setData] = useState<any[]>([]);

  const loadData = async () => {
    const data = await getAllAnkiCards();
    console.log("data =>", data);
    setData(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    await deleteAnkiCard(id);
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">词汇库</h1>
          <ImportDialog
            trigger={
              <Button className="cursor-pointer rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 data-[active]:bg-sky-700">
                导入
              </Button>
            }
          />
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
