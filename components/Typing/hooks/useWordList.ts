import { CHAPTER_LENGTH } from "@/lib/constants";
import {
  ankiChapterAtom,
  currentChapterAtom,
  currentDictInfoAtom,
  isAnkiModeAtom,
  reviewModeInfoAtom,
} from "@/lib/store";
import type { Word, WordWithIndex } from "@/lib/types/index";
import { getAllAnkiCards } from "@/lib/utils/db/card";
import { wordListFetcher } from "@/lib/utils/wordListFetcher";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

export type UseWordListResult = {
  words: WordWithIndex[];
  isLoading: boolean;
  error: Error | undefined;
};

/**
 * Use word lists from the current selected dictionary or Anki cards.
 */
export function useWordList(): UseWordListResult {
  const isAnkiMode = useAtomValue(isAnkiModeAtom);
  const currentDictInfo = useAtomValue(currentDictInfoAtom);
  const [currentChapter, setCurrentChapter] = useAtom(currentChapterAtom);
  const [ankiChapter, setAnkiChapter] = useAtom(ankiChapterAtom);
  const { isReviewMode, reviewRecord } = useAtomValue(reviewModeInfoAtom);

  const [ankiCards, setAnkiCards] = useState<
    Array<{ front: string; back: string }>
  >([]);
  const [ankiLoading, setAnkiLoading] = useState(false);
  const [ankiError, setAnkiError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    if (!isAnkiMode) return;

    const loadAnkiCards = async () => {
      try {
        setAnkiLoading(true);
        const cards = await getAllAnkiCards();
        setAnkiCards(cards);
        setAnkiError(undefined);
      } catch (e) {
        setAnkiError(
          e instanceof Error ? e : new Error("Failed to load Anki cards"),
        );
      } finally {
        setAnkiLoading(false);
      }
    };

    loadAnkiCards();
  }, [isAnkiMode]);

  const ankiChapterCount = Math.ceil(ankiCards.length / CHAPTER_LENGTH);

  if (isAnkiMode && ankiChapter >= ankiChapterCount && ankiChapterCount > 0) {
    setAnkiChapter(0);
  }

  if (!isAnkiMode && currentChapter >= currentDictInfo.chapterCount) {
    setCurrentChapter(0);
  }

  const isFirstChapter =
    !isAnkiMode &&
    !isReviewMode &&
    currentDictInfo.id === "cet4" &&
    currentChapter === 0;

  const {
    data: wordList,
    error: dictError,
    isLoading: dictLoading,
  } = useSWR(!isAnkiMode ? currentDictInfo.url : null, wordListFetcher);

  const words: WordWithIndex[] = useMemo(() => {
    if (isAnkiMode) {
      if (ankiCards.length === 0) return [];

      const chapterCards = ankiCards.slice(
        ankiChapter * CHAPTER_LENGTH,
        (ankiChapter + 1) * CHAPTER_LENGTH,
      );

      return chapterCards.map(
        (card, index): WordWithIndex => ({
          name: card.back,
          trans: [card.front],
          usphone: "",
          ukphone: "",
          index,
        }),
      );
    }

    let newWords: Word[];
    if (isFirstChapter) {
      newWords = firstChapter;
    } else if (isReviewMode) {
      newWords = reviewRecord?.words ?? [];
    } else if (wordList) {
      newWords = wordList.slice(
        currentChapter * CHAPTER_LENGTH,
        (currentChapter + 1) * CHAPTER_LENGTH,
      );
    } else {
      newWords = [];
    }

    return newWords.map((word, index) => {
      let trans: string[];
      if (Array.isArray(word.trans)) {
        trans = word.trans.filter((item) => typeof item === "string");
      } else if (
        word.trans === null ||
        word.trans === undefined ||
        typeof word.trans === "object"
      ) {
        trans = [];
      } else {
        trans = [String(word.trans)];
      }
      return {
        ...word,
        index,
        trans,
      };
    });
  }, [
    isAnkiMode,
    ankiCards,
    ankiChapter,
    isFirstChapter,
    isReviewMode,
    wordList,
    reviewRecord?.words,
    currentChapter,
  ]);

  const isLoading = isAnkiMode ? ankiLoading : dictLoading;
  const error = isAnkiMode ? ankiError : dictError;

  return { words, isLoading, error };
}

const firstChapter = [
  // {
  //   name: "What is the contrast between these two things?",
  //   trans: ["这两个东西有什么不同？"],
  //   usphone: "'kænsl",
  //   ukphone: "'kænsl",
  // },
  {
    name: "cancel",
    trans: ["取消， 撤销； 删去"],
    usphone: "'kænsl",
    ukphone: "'kænsl",
  },
  {
    name: "explosive",
    trans: ["爆炸的； 极易引起争论的", "炸药"],
    usphone: "ɪk'splosɪv; ɪk'splozɪv",
    ukphone: "ɪk'spləusɪv",
  },
  {
    name: "numerous",
    trans: ["众多的"],
    usphone: "'numərəs",
    ukphone: "'njuːmərəs",
  },
  {
    name: "govern",
    trans: ["居支配地位， 占优势", "统治，治理，支配"],
    usphone: "'ɡʌvɚn",
    ukphone: "'gʌvn",
  },
  {
    name: "analyse",
    trans: ["分析； 分解； 解析"],
    usphone: "'æn(ə)laɪz",
    ukphone: "'ænəlaɪz",
  },
  {
    name: "discourage",
    trans: ["使泄气， 使灰心； 阻止， 劝阻"],
    usphone: "dɪs'kɝɪdʒ",
    ukphone: "dɪs'kʌrɪdʒ",
  },
  {
    name: "resemble",
    trans: ["像， 类似于"],
    usphone: "rɪ'zɛmbl",
    ukphone: "rɪ'zembl",
  },
  {
    name: "remote",
    trans: [
      "遥远的； 偏僻的； 关系疏远的； 脱离的； 微乎其微的； 孤高的， 冷淡的； 遥控的",
    ],
    usphone: "rɪ'mot",
    ukphone: "rɪ'məut",
  },
  {
    name: "salary",
    trans: ["薪金， 薪水"],
    usphone: "'sæləri",
    ukphone: "'sæləri",
  },
  {
    name: "pollution",
    trans: ["污染， 污染物"],
    usphone: "pə'luʃən",
    ukphone: "pə'luːʃn",
  },
  {
    name: "pretend",
    trans: ["装作， 假装"],
    usphone: "prɪ'tɛnd",
    ukphone: "prɪ'tend",
  },
  { name: "kettle", trans: ["水壶"], usphone: "'kɛtl", ukphone: "'ketl" },
  {
    name: "wreck",
    trans: ["失事；残骸；精神或身体已垮的人", "破坏"],
    usphone: "rɛk",
    ukphone: "rek",
  },
  {
    name: "drunk",
    trans: ["醉的； 陶醉的"],
    usphone: "drʌŋk",
    ukphone: "drʌŋk",
  },
  {
    name: "calculate",
    trans: ["计算； 估计； 计划"],
    usphone: "'kælkjulet",
    ukphone: "'kælkjuleɪt",
  },
  {
    name: "persistent",
    trans: ["坚持的， 不屈不挠的； 持续不断的； 反复出现的"],
    usphone: "pə'zɪstənt",
    ukphone: "pə'sɪstənt",
  },
  { name: "sake", trans: ["缘故， 理由"], usphone: "sek", ukphone: "seɪk" },
  {
    name: "conceal",
    trans: ["把…隐藏起来， 掩盖， 隐瞒"],
    usphone: "kən'sil",
    ukphone: "kən'siːl",
  },
  {
    name: "audience",
    trans: ["听众， 观众， 读者"],
    usphone: "'ɔdɪəns",
    ukphone: "'ɔːdiəns",
  },
  {
    name: "meanwhile",
    trans: ["与此同时"],
    usphone: "'minwaɪl",
    ukphone: "'miːnwaɪl",
  },
];
