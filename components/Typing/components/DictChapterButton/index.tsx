"use client";

import Tooltip from "@/components/Tooltip";
import { getAllAnkiCards } from "@/lib/utils/db";
import Link from "next/link";
import { useEffect, useState } from "react";

export const DictChapterButton = () => {
  const [ankiCardCount, setAnkiCardCount] = useState(0);

  useEffect(() => {
    const loadAnkiCardCount = async () => {
      const cards = await getAllAnkiCards();
      setAnkiCardCount(cards.length);
    };
    loadAnkiCardCount();
  }, []);

  return (
    <>
      {
        <Tooltip content="管理 Anki 卡片">
          <Link
            className="block rounded-lg px-3 py-1 text-lg transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white focus:outline-none dark:text-white dark:text-opacity-60 dark:hover:text-opacity-100"
            href="/gallery"
          >
            Anki 卡片 ({ankiCardCount})
          </Link>
        </Tooltip>
      }
    </>
  );
};
