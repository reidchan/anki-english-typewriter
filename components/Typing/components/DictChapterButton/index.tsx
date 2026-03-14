"use client";

import Tooltip from "@/components/Tooltip";
import { getCardsCount } from "@/lib/utils/db/card";
import Link from "next/link";
import { useEffect, useState } from "react";

export const DictChapterButton = () => {
  const [ankiCardCount, setAnkiCardCount] = useState(0);

  useEffect(() => {
    const loadAnkiCardCount = async () => {
      const count = await getCardsCount();
      setAnkiCardCount(count);
    };
    void loadAnkiCardCount();
  }, []);

  return (
    <>
      {
        <Tooltip content="管理 Anki 卡片">
          <Link
            className="block rounded-lg px-3 py-1 text-lg transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white focus:outline-none dark:text-white dark:text-opacity-60 dark:hover:text-opacity-100"
            href="/decks"
          >
            Anki 卡片 ({ankiCardCount})
          </Link>
        </Tooltip>
      }
    </>
  );
};
