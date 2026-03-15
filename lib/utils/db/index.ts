import type {
  IReviewRecord,
  IRevisionDictRecord,
  IWordRecord,
  LetterMistakes,
} from "./record";
import { ReviewRecord, WordRecord } from "./record";
import type { IDeckRecord } from "./deck";
import { DeckRecord } from "./deck";
import {
  TypingContext,
  TypingStateActionType,
} from "@/components/Typing/store";
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
  reviewRecords!: Table<IReviewRecord, number>;

  revisionDictRecords!: Table<IRevisionDictRecord, number>;
  revisionWordRecords!: Table<IWordRecord, number>;

  decks!: Table<IDeckRecord, number>;
  notes!: Table<any, number>;
  cards!: Table<any, number>;

  constructor() {
    super("RecordDB");
    this.version(1).stores({
      wordRecords: "++id,word,timeStamp,dict,chapter,wrongCount,[dict+chapter]",
      reviewRecords: "++id,dict,createTime,isFinished",
      decks: "++id,&name,parentId,level,createdAt,updatedAt,[parentId+name]",
      notes:
        "++id,&guid,noteType,sortField,checksum,backEnglish,createdAt,updatedAt",
      cards:
        "++id,noteId,deckId,ord,cardType,queue,due,importedAt,updatedAt,[noteId+ord],[deckId+due],[deckId+ord]",
    });
  }
}

export const db = new RecordDB();

db.wordRecords.mapToClass(WordRecord);
db.reviewRecords.mapToClass(ReviewRecord);
db.decks.mapToClass(DeckRecord);

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
