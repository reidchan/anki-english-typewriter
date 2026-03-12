"use client";

import Tooltip from "@/components/Tooltip";
import { CHAPTER_LENGTH } from "@/lib/constants";
import {
  ankiChapterAtom,
  currentChapterAtom,
  currentDictInfoAtom,
  isAnkiModeAtom,
  isReviewModeAtom,
} from "@/lib/store";
import { getAllAnkiCards } from "@/lib/utils/db";
import range from "@/lib/utils/range";
import { Listbox, Transition } from "@headlessui/react";
import { useAtom, useAtomValue } from "jotai";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";

export const DictChapterButton = () => {
  const currentDictInfo = useAtomValue(currentDictInfoAtom);
  const [currentChapter, setCurrentChapter] = useAtom(currentChapterAtom);
  const [ankiChapter, setAnkiChapter] = useAtom(ankiChapterAtom);
  const [isAnkiMode, setIsAnkiMode] = useAtom(isAnkiModeAtom);
  const isReviewMode = useAtomValue(isReviewModeAtom);

  const [ankiCardCount, setAnkiCardCount] = useState(0);

  useEffect(() => {
    const loadAnkiCardCount = async () => {
      const cards = await getAllAnkiCards();
      setAnkiCardCount(cards.length);
    };
    loadAnkiCardCount();
  }, []);

  const dictChapterCount = currentDictInfo.chapterCount;
  const ankiChapterCount = Math.max(
    1,
    Math.ceil(ankiCardCount / CHAPTER_LENGTH),
  );

  const chapterCount = isAnkiMode ? ankiChapterCount : dictChapterCount;
  const activeChapter = isAnkiMode ? ankiChapter : currentChapter;
  const setActiveChapter = isAnkiMode ? setAnkiChapter : setCurrentChapter;

  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (
    event,
  ) => {
    if (event.key === " ") {
      event.preventDefault();
    }
  };

  const toggleAnkiMode = () => {
    setIsAnkiMode(!isAnkiMode);
  };

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
