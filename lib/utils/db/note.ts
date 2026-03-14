import { getUTCUnixTimestamp } from "../index";
import { db } from "./index";

export interface INoteRecord {
  id?: number;
  guid: string;
  noteType?: string;
  sortField?: string;
  checksum?: string;
  createdAt: number;
  updatedAt: number;
}

export class NoteRecord implements INoteRecord {
  id?: number;
  guid: string;
  noteType?: string;
  sortField?: string;
  checksum?: string;
  createdAt: number;
  updatedAt: number;

  constructor(data: {
    guid: string;
    noteType?: string;
    sortField?: string;
    checksum?: string;
  }) {
    const now = getUTCUnixTimestamp();
    this.guid = data.guid;
    this.noteType = data.noteType;
    this.sortField = data.sortField;
    this.checksum = data.checksum;
    this.createdAt = now;
    this.updatedAt = now;
  }
}

export async function addNote(
  note: Omit<INoteRecord, "id" | "createdAt" | "updatedAt">,
) {
  try {
    const noteRecord = new NoteRecord(note);
    const id = await db.notes.add(noteRecord);
    return id;
  } catch (error) {
    console.error("添加 Note 失败:", error);
    throw error;
  }
}

export async function getNoteById(id: number) {
  try {
    const note = await db.notes.get(id);
    return note;
  } catch (error) {
    console.error("根据 ID 查询 Note 失败:", error);
    throw error;
  }
}

export async function getNoteByGuid(guid: string) {
  try {
    const note = await db.notes.where("guid").equals(guid).first();
    return note;
  } catch (error) {
    console.error("根据 GUID 查询 Note 失败:", error);
    throw error;
  }
}

export async function getAllNotes() {
  try {
    const notes = await db.notes.toArray();
    return notes;
  } catch (error) {
    console.error("获取所有 Note 失败:", error);
    throw error;
  }
}

export async function updateNote(id: number, updates: Partial<INoteRecord>) {
  try {
    await db.notes.update(id, {
      ...updates,
      updatedAt: getUTCUnixTimestamp(),
    });
  } catch (error) {
    console.error("更新 Note 失败:", error);
    throw error;
  }
}

export async function deleteNote(id: number) {
  try {
    await db.notes.delete(id);
  } catch (error) {
    console.error("删除 Note 失败:", error);
    throw error;
  }
}

export async function getNotesCount() {
  try {
    const count = await db.notes.count();
    return count;
  } catch (error) {
    console.error("获取 Note 数量失败:", error);
    throw error;
  }
}
