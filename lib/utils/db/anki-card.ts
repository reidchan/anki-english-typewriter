import { db } from "./index";
import type { IAnkiCard } from "./record";
import { AnkiCard } from "./record";

/**
 * 添加单张 Anki 卡片
 */
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

/**
 * 批量添加 Anki 卡片
 */
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

/**
 * 根据 GUID 查询卡片
 */
export async function getAnkiCardByGuid(guid: string) {
  try {
    const card = await db.ankiCards.where("guid").equals(guid).first();
    return card;
  } catch (error) {
    console.error("查询 Anki 卡片失败:", error);
    throw error;
  }
}

/**
 * 获取所有 Anki 卡片
 */
export async function getAllAnkiCards() {
  try {
    const cards = await db.ankiCards.toArray();
    return cards;
  } catch (error) {
    console.error("获取所有 Anki 卡片失败:", error);
    throw error;
  }
}

/**
 * 获取指定牌组的所有卡片
 */
export async function getAnkiCardsByDeck(deck: string) {
  try {
    const cards = await db.ankiCards.where("deck").equals(deck).toArray();
    return cards;
  } catch (error) {
    console.error("获取指定牌组的 Anki 卡片失败:", error);
    throw error;
  }
}

/**
 * 更新 Anki 卡片
 */
export async function updateAnkiCard(id: number, updates: Partial<IAnkiCard>) {
  try {
    await db.ankiCards.update(id, updates);
  } catch (error) {
    console.error("更新 Anki 卡片失败:", error);
    throw error;
  }
}

/**
 * 删除单张卡片
 */
export async function deleteAnkiCard(id: number) {
  try {
    await db.ankiCards.delete(id);
  } catch (error) {
    console.error("删除 Anki 卡片失败:", error);
    throw error;
  }
}

/**
 * 删除指定牌组的所有卡片
 */
export async function deleteAnkiCardsByDeck(deck: string) {
  try {
    const deletedCount = await db.ankiCards.where("deck").equals(deck).delete();
    return deletedCount;
  } catch (error) {
    console.error("删除牌组卡片失败:", error);
    throw error;
  }
}

/**
 * 清空所有 Anki 卡片
 */
export async function clearAllAnkiCards() {
  try {
    await db.ankiCards.clear();
  } catch (error) {
    console.error("清空 Anki 卡片失败:", error);
    throw error;
  }
}

/**
 * 搜索 Anki 卡片(根据正面或背面内容)
 */
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

/**
 * 获取卡片总数
 */
export async function getAnkiCardsCount() {
  try {
    const count = await db.ankiCards.count();
    return count;
  } catch (error) {
    console.error("获取卡片总数失败:", error);
    throw error;
  }
}

/**
 * 检查 GUID 是否已存在
 */
export async function isGuidExists(guid: string) {
  try {
    const count = await db.ankiCards.where("guid").equals(guid).count();
    return count > 0;
  } catch (error) {
    console.error("检查 GUID 是否存在失败:", error);
    throw error;
  }
}
