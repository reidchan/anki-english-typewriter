import { getUTCUnixTimestamp } from "../index";
import { db } from "./index";

export interface IDeckRecord {
  id?: number;
  name: string;
  parentId: number | null;
  level: number;
  createdAt: number;
  updatedAt: number;
}

export class DeckRecord implements IDeckRecord {
  id?: number;
  name: string;
  parentId: number | null;
  level: number;
  createdAt: number;
  updatedAt: number;

  constructor(data: {
    name: string;
    parentId?: number | null;
    level?: number;
  }) {
    const now = getUTCUnixTimestamp();
    this.name = data.name;
    this.parentId = data.parentId ?? null;
    this.level = data.level ?? 0;
    this.createdAt = now;
    this.updatedAt = now;
  }
}

export async function addDeck(
  deck: Omit<IDeckRecord, "id" | "createdAt" | "updatedAt">,
) {
  try {
    const deckRecord = new DeckRecord(deck);
    const id = await db.decks.add(deckRecord);
    return id;
  } catch (error) {
    console.error("添加 Deck 失败:", error);
    throw error;
  }
}

export async function getDeckById(id: number) {
  try {
    const deck = await db.decks.get(id);
    return deck;
  } catch (error) {
    console.error("根据 ID 查询 Deck 失败:", error);
    throw error;
  }
}

export async function getDeckByName(name: string) {
  try {
    const deck = await db.decks.where("name").equals(name).first();
    return deck;
  } catch (error) {
    console.error("根据名称查询 Deck 失败:", error);
    throw error;
  }
}

export async function getAllDecks() {
  try {
    const decks = await db.decks.toArray();
    return decks;
  } catch (error) {
    console.error("获取所有 Deck 失败:", error);
    throw error;
  }
}

export async function updateDeck(id: number, updates: Partial<IDeckRecord>) {
  try {
    await db.decks.update(id, {
      ...updates,
      updatedAt: getUTCUnixTimestamp(),
    });
  } catch (error) {
    console.error("更新 Deck 失败:", error);
    throw error;
  }
}

export async function deleteDeck(id: number) {
  try {
    await db.decks.delete(id);
  } catch (error) {
    console.error("删除 Deck 失败:", error);
    throw error;
  }
}

export async function getDecksCount() {
  try {
    const count = await db.decks.count();
    return count;
  } catch (error) {
    console.error("获取 Deck 数量失败:", error);
    throw error;
  }
}
