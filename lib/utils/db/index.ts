import type {
  IAnkiCard,
  IChapterRecord,
  IReviewRecord,
  IRevisionDictRecord,
  IWordRecord,
  LetterMistakes,
} from "./record";
import { AnkiCard, ChapterRecord, ReviewRecord, WordRecord } from "./record";
import {
  TypingContext,
  TypingStateActionType,
} from "@/components/Typing/store";
import type { TypingState } from "@/pages/Typing/store/type";
import {
  currentChapterAtom,
  currentDictIdAtom,
  isReviewModeAtom,
} from "@/lib/store";
import type { Table } from "dexie";
import Dexie from "dexie";
import { useAtomValue } from "jotai";
import { useCallback, useContext } from "react";

class RecordDB extends Dexie {
  wordRecords!: Table<IWordRecord, number>;
  chapterRecords!: Table<IChapterRecord, number>;
  reviewRecords!: Table<IReviewRecord, number>;

  revisionDictRecords!: Table<IRevisionDictRecord, number>;
  revisionWordRecords!: Table<IWordRecord, number>;

  ankiCards!: Table<IAnkiCard, number>;

  constructor() {
    super("RecordDB");
    this.version(1).stores({
      wordRecords: "++id,word,timeStamp,dict,chapter,wrongCount,[dict+chapter]",
      chapterRecords: "++id,timeStamp,dict,chapter,time,[dict+chapter]",
      reviewRecords: "++id,dict,createTime,isFinished",
      ankiCards: "++id,&guid,front,back,deck,notetype,tags,importedAt",
    });
  }
}

export const db = new RecordDB();

db.wordRecords.mapToClass(WordRecord);
db.chapterRecords.mapToClass(ChapterRecord);
db.reviewRecords.mapToClass(ReviewRecord);
db.ankiCards.mapToClass(AnkiCard);

export function useSaveChapterRecord() {
  const currentChapter = useAtomValue(currentChapterAtom);
  const isRevision = useAtomValue(isReviewModeAtom);
  const dictID = useAtomValue(currentDictIdAtom);

  const saveChapterRecord = useCallback(
    (typingState: TypingState) => {
      const {
        chapterData: {
          correctCount,
          wrongCount,
          userInputLogs,
          wordCount,
          words,
          wordRecordIds,
        },
        timerData: { time },
      } = typingState;
      const correctWordIndexes = userInputLogs
        .filter((log) => log.correctCount > 0 && log.wrongCount === 0)
        .map((log) => log.index);

      const chapterRecord = new ChapterRecord(
        dictID,
        isRevision ? -1 : currentChapter,
        time,
        correctCount,
        wrongCount,
        wordCount,
        correctWordIndexes,
        words.length,
        wordRecordIds ?? [],
      );
      db.chapterRecords.add(chapterRecord);
    },
    [currentChapter, dictID, isRevision],
  );

  return saveChapterRecord;
}

export type WordKeyLogger = {
  letterTimeArray: number[];
  letterMistake: LetterMistakes;
};

export function useSaveWordRecord() {
  const isRevision = useAtomValue(isReviewModeAtom);
  const currentChapter = useAtomValue(currentChapterAtom);
  const dictID = useAtomValue(currentDictIdAtom);

  const { dispatch } = useContext(TypingContext) ?? {};

  const saveWordRecord = useCallback(
    async ({
      word,
      wrongCount,
      letterTimeArray,
      letterMistake,
    }: {
      word: string;
      wrongCount: number;
      letterTimeArray: number[];
      letterMistake: LetterMistakes;
    }) => {
      const timing = [];
      for (let i = 1; i < letterTimeArray.length; i++) {
        const diff = letterTimeArray[i] - letterTimeArray[i - 1];
        timing.push(diff);
      }

      const wordRecord = new WordRecord(
        word,
        dictID,
        isRevision ? -1 : currentChapter,
        timing,
        wrongCount,
        letterMistake,
      );

      let dbID = -1;
      try {
        dbID = await db.wordRecords.add(wordRecord);
      } catch (e) {
        console.error(e);
      }
      if (dispatch) {
        dbID > 0 &&
          dispatch({
            type: TypingStateActionType.ADD_WORD_RECORD_ID,
            payload: dbID,
          });
        dispatch({
          type: TypingStateActionType.SET_IS_SAVING_RECORD,
          payload: false,
        });
      }
    },
    [currentChapter, dictID, dispatch, isRevision],
  );

  return saveWordRecord;
}

export function useDeleteWordRecord() {
  const deleteWordRecord = useCallback(async (word: string, dict: string) => {
    try {
      const deletedCount = await db.wordRecords.where({ word, dict }).delete();
      return deletedCount;
    } catch (error) {
      console.error(`删除单词记录时出错：`, error);
    }
  }, []);

  return { deleteWordRecord };
}

// Anki Card operations
export async function addAnkiCard(card: Omit<IAnkiCard, "id" | "importedAt">) {
  try {
    const ankiCard = new AnkiCard(card);
    const id = await db.ankiCards.add(ankiCard);
    return id;
  } catch (error) {
    console.error("添加 Anki 卡片失败:", error);
    throw error;
  }
}

export async function addAnkiCards(
  cards: Array<Omit<IAnkiCard, "id" | "importedAt">>,
) {
  try {
    const dedupedCards = Array.from(
      new Map(
        cards
          .map((card) => ({ ...card, guid: card.guid.trim() }))
          .filter((card) => card.guid)
          .map((card) => [card.guid, card]),
      ).values(),
    );

    if (dedupedCards.length === 0) {
      return [];
    }

    const existingCards = await db.ankiCards
      .where("guid")
      .anyOf(dedupedCards.map((card) => card.guid))
      .toArray();
    const existingGuidSet = new Set(existingCards.map((card) => card.guid));
    const newCards = dedupedCards.filter(
      (card) => !existingGuidSet.has(card.guid),
    );

    if (newCards.length === 0) {
      return [];
    }

    const ankiCards = newCards.map((card) => new AnkiCard(card));
    const ids = await db.ankiCards.bulkAdd(ankiCards, { allKeys: true });
    return ids;
  } catch (error) {
    console.error("批量添加 Anki 卡片失败:", error);
    throw error;
  }
}

export async function getAnkiCardByGuid(guid: string) {
  try {
    const card = await db.ankiCards.where("guid").equals(guid).first();
    return card;
  } catch (error) {
    console.error("查询 Anki 卡片失败:", error);
    throw error;
  }
}

export async function getAllAnkiCards() {
  try {
    const cards = await db.ankiCards.toArray();
    return cards;
  } catch (error) {
    console.error("获取所有 Anki 卡片失败:", error);
    throw error;
  }
}

export async function getAnkiCardsByDeck(deck: string) {
  try {
    const cards = await db.ankiCards.where("deck").equals(deck).toArray();
    return cards;
  } catch (error) {
    console.error("获取指定牌组的 Anki 卡片失败:", error);
    throw error;
  }
}

export async function updateAnkiCard(id: number, updates: Partial<IAnkiCard>) {
  try {
    await db.ankiCards.update(id, updates);
  } catch (error) {
    console.error("更新 Anki 卡片失败:", error);
    throw error;
  }
}

export async function deleteAnkiCard(id: number) {
  try {
    await db.ankiCards.delete(id);
  } catch (error) {
    console.error("删除 Anki 卡片失败:", error);
    throw error;
  }
}

export async function deleteAnkiCardsByDeck(deck: string) {
  try {
    const deletedCount = await db.ankiCards.where("deck").equals(deck).delete();
    return deletedCount;
  } catch (error) {
    console.error("删除牌组卡片失败:", error);
    throw error;
  }
}

export async function clearAllAnkiCards() {
  try {
    await db.ankiCards.clear();
  } catch (error) {
    console.error("清空 Anki 卡片失败:", error);
    throw error;
  }
}

export async function searchAnkiCards(query: string) {
  try {
    const lowerQuery = query.toLowerCase();
    const cards = await db.ankiCards
      .filter(
        (card) =>
          card.front.toLowerCase().includes(lowerQuery) ||
          card.back.toLowerCase().includes(lowerQuery),
      )
      .toArray();
    return cards;
  } catch (error) {
    console.error("搜索 Anki 卡片失败:", error);
    throw error;
  }
}
