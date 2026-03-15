import { getUTCUnixTimestamp } from "../index";
import { parseNoteContentFromFields } from "./note-content";
import { db } from "./index";
import type { IDeckRecord } from "./deck";
import type { INoteRecord } from "./note";

export interface ICardRecord {
  id?: number;
  noteId: number;
  deckId: number;
  ord: number;
  cardType?: string;
  queue?: number;
  due?: number;
  importedAt: number;
  updatedAt: number;
}

export interface IAnkiCard {
  id: number;
  guid: string;
  front: string;
  back: string;
  backEnglish?: string;
  deck?: string;
  notetype?: string;
  importedAt: number;
  updatedAt: number;
}

export class CardRecord implements ICardRecord {
  id?: number;
  noteId: number;
  deckId: number;
  ord: number;
  cardType?: string;
  queue?: number;
  due?: number;
  importedAt: number;
  updatedAt: number;

  constructor(data: {
    noteId: number;
    deckId: number;
    ord?: number;
    cardType?: string;
    queue?: number;
    due?: number;
  }) {
    const now = getUTCUnixTimestamp();
    this.noteId = data.noteId;
    this.deckId = data.deckId;
    this.ord = data.ord ?? 0;
    this.cardType = data.cardType;
    this.queue = data.queue;
    this.due = data.due;
    this.importedAt = now;
    this.updatedAt = now;
  }
}

export async function addCard(
  card: Omit<ICardRecord, "id" | "importedAt" | "updatedAt">,
) {
  try {
    const cardRecord = new CardRecord(card);
    const id = await db.cards.add(cardRecord);
    return id;
  } catch (error) {
    console.error("添加 Card 失败:", error);
    throw error;
  }
}

export async function getCardById(id: number) {
  try {
    const card = await db.cards.get(id);
    return card;
  } catch (error) {
    console.error("根据 ID 查询 Card 失败:", error);
    throw error;
  }
}

export async function getCardsByNoteId(noteId: number) {
  try {
    const cards = await db.cards.where("noteId").equals(noteId).toArray();
    return cards;
  } catch (error) {
    console.error("根据 Note ID 查询 Card 失败:", error);
    throw error;
  }
}

export async function getCardsByDeckId(deckId: number) {
  try {
    const cards = await db.cards.where("deckId").equals(deckId).toArray();
    return cards;
  } catch (error) {
    console.error("根据 Deck ID 查询 Card 失败:", error);
    throw error;
  }
}

export async function getAllCards() {
  try {
    const cards = await db.cards.toArray();
    return cards;
  } catch (error) {
    console.error("获取所有 Card 失败:", error);
    throw error;
  }
}

export async function updateCard(id: number, updates: Partial<ICardRecord>) {
  try {
    await db.cards.update(id, {
      ...updates,
      updatedAt: getUTCUnixTimestamp(),
    });
  } catch (error) {
    console.error("更新 Card 失败:", error);
    throw error;
  }
}

export async function deleteCard(id: number) {
  try {
    await db.cards.delete(id);
  } catch (error) {
    console.error("删除 Card 失败:", error);
    throw error;
  }
}

export async function getCardsCount() {
  try {
    const count = await db.cards.count();
    return count;
  } catch (error) {
    console.error("获取 Card 数量失败:", error);
    throw error;
  }
}

function parseNoteContent(note?: INoteRecord) {
  return parseNoteContentFromFields(note?.sortField, note?.checksum);
}

function buildAnkiCard(
  card: ICardRecord,
  note?: INoteRecord,
  deck?: IDeckRecord,
): IAnkiCard | null {
  if (!card.id || !note?.guid) {
    return null;
  }

  const { front, back } = parseNoteContent(note);

  return {
    id: card.id,
    guid: note.guid,
    front,
    back: note.backEnglish,
    deck: deck?.name,
    notetype: note.noteType,
    importedAt: card.importedAt,
    updatedAt: card.updatedAt,
  };
}

export async function getAllAnkiCards(): Promise<IAnkiCard[]> {
  try {
    const [cards, notes, decks] = await Promise.all([
      db.cards.toArray(),
      db.notes.toArray(),
      db.decks.toArray(),
    ]);

    const noteById = new Map(notes.map((note) => [note.id, note]));
    const deckById = new Map(decks.map((deck) => [deck.id, deck]));

    return cards
      .map((card) =>
        buildAnkiCard(
          card,
          noteById.get(card.noteId),
          deckById.get(card.deckId),
        ),
      )
      .filter((card): card is IAnkiCard => card !== null)
      .sort((a, b) => b.importedAt - a.importedAt);
  } catch (error) {
    console.error("获取所有 Anki 卡片失败:", error);
    throw error;
  }
}

export async function deleteAnkiCard(id: number) {
  try {
    const card = await db.cards.get(id);
    if (!card) return;

    await db.cards.delete(id);

    const remainingCards = await db.cards
      .where("noteId")
      .equals(card.noteId)
      .count();
    if (remainingCards === 0) {
      await db.notes.delete(card.noteId);
    }
  } catch (error) {
    console.error("删除 Anki 卡片失败:", error);
    throw error;
  }
}
