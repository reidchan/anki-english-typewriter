import { CheckCircle, FileText, Upload, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addCard, getCardsByNoteId } from "@/lib/utils/db/card";
import { addDeck, getDeckById, getDeckByName } from "@/lib/utils/db/deck";
import {
  addNote,
  extractBackEnglish,
  getNoteByGuid,
  updateNote,
} from "@/lib/utils/db/note";
import { buildRawContent } from "@/lib/utils/db/note-content";
import { useRef, useState } from "react";

interface AnkiCard {
  guid: string;
  front: string;
  back: string;
  deck?: string;
  notetype?: string;
  tags?: string;
}

interface ColumnMapping {
  guid: number;
  notetype: number;
  deck: number;
  tags: number;
}

type ImportStatus = "idle" | "loading" | "success" | "error";

const UNCATEGORIZED_DECK = "Uncategorized";

export function ImportDialog({
  trigger,
  onSuccess,
  targetDeckId,
}: {
  trigger: React.ReactNode;
  onSuccess?: () => void;
  targetDeckId?: number;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseColumnMapping = (lines: string[]): ColumnMapping | null => {
    const mapping: Partial<ColumnMapping> = {};

    for (const line of lines) {
      if (!line.startsWith("#")) break;

      const guidMatch = line.match(/#guid column:(\d+)/);
      if (guidMatch) mapping.guid = parseInt(guidMatch[1]) - 1;

      const notetypeMatch = line.match(/#notetype column:(\d+)/);
      if (notetypeMatch) mapping.notetype = parseInt(notetypeMatch[1]) - 1;

      const deckMatch = line.match(/#deck column:(\d+)/);
      if (deckMatch) mapping.deck = parseInt(deckMatch[1]) - 1;

      const tagsMatch = line.match(/#tags column:(\d+)/);
      if (tagsMatch) mapping.tags = parseInt(tagsMatch[1]) - 1;
    }

    if (mapping.guid === undefined) return null;

    return mapping as ColumnMapping;
  };

  const parseAnkiCards = (content: string): AnkiCard[] => {
    const lines = content.split("\n").filter((line) => line.trim());
    const mapping = parseColumnMapping(lines);

    if (!mapping) {
      console.error("无法解析列映射");
      return [];
    }

    const dataLines = lines.filter((line) => !line.startsWith("#"));
    const cards: AnkiCard[] = [];

    for (const line of dataLines) {
      const columns = line.split("\t");

      if (columns.length < 4) continue;

      const guid = columns[mapping.guid];
      const deck =
        mapping.deck !== undefined ? columns[mapping.deck]?.trim() : undefined;
      const notetype =
        mapping.notetype !== undefined
          ? columns[mapping.notetype]?.trim()
          : undefined;
      const tags =
        mapping.tags !== undefined ? columns[mapping.tags]?.trim() : undefined;

      // 对于 Basic 类型,字段顺序通常是: front, back
      // 根据列索引,找到非 guid/notetype/deck/tags 的列
      const knownColumns = new Set([
        mapping.guid,
        mapping.notetype,
        mapping.deck,
        mapping.tags,
      ]);

      const contentColumns = columns.filter(
        (_, index) => !knownColumns.has(index) && columns[index],
      );

      if (contentColumns.length >= 2) {
        cards.push({
          guid,
          front: contentColumns[0],
          back: contentColumns[1],
          deck,
          notetype,
          tags,
        });
      }
    }

    return cards;
  };

  const readFileContent = (file: File) => {
    setStatus("loading");
    setMessage("正在导入...");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const cards = parseAnkiCards(content);

      if (cards.length === 0) {
        setStatus("error");
        setMessage("未能解析任何卡片，请检查文件格式");
        return;
      }

      try {
        for (const card of cards) {
          const rawContent = buildRawContent(card.front, card.back);
          const backEnglish = extractBackEnglish(card.back);

          let targetDeck;

          if (typeof targetDeckId === "number") {
            targetDeck = await getDeckById(targetDeckId);
            if (!targetDeck?.id) {
              throw new Error(`未找到 Deck: ${targetDeckId}`);
            }
          } else {
            const deckName = card.deck?.trim() || UNCATEGORIZED_DECK;
            const deckParts = deckName.split("::").filter(Boolean);

            let parentId: number | null = null;
            for (let index = 0; index < deckParts.length; index += 1) {
              const currentDeckName = deckParts.slice(0, index + 1).join("::");
              let deckRecord = await getDeckByName(currentDeckName);

              if (!deckRecord) {
                const deckId = await addDeck({
                  name: currentDeckName,
                  parentId,
                  level: index,
                });
                deckRecord = await getDeckByName(currentDeckName);
                if (!deckRecord && typeof deckId === "number") {
                  throw new Error(`创建 Deck 失败: ${currentDeckName}`);
                }
              }

              parentId = deckRecord?.id ?? null;
            }

            targetDeck = await getDeckByName(deckName);
            if (!targetDeck?.id) {
              throw new Error(`未找到 Deck: ${deckName}`);
            }
          }

          let noteRecord = await getNoteByGuid(card.guid);
          if (!noteRecord) {
            const noteId = await addNote({
              guid: card.guid,
              noteType: card.notetype,
              front: card.front,
              rawContent,
              backEnglish,
            });
            noteRecord = await getNoteByGuid(card.guid);
            if (!noteRecord && typeof noteId === "number") {
              throw new Error(`创建 Note 失败: ${card.guid}`);
            }
          } else if (
            noteRecord.front !== card.front ||
            noteRecord.rawContent !== rawContent ||
            noteRecord.noteType !== card.notetype ||
            noteRecord.backEnglish !== backEnglish
          ) {
            await updateNote(noteRecord.id, {
              noteType: card.notetype,
              front: card.front,
              rawContent,
              backEnglish,
            });
            noteRecord = await getNoteByGuid(card.guid);
          }

          if (!noteRecord?.id) {
            throw new Error(`未找到 Note: ${card.guid}`);
          }

          const existingCards = await getCardsByNoteId(noteRecord.id);
          const hasCard = existingCards.some(
            (existingCard) =>
              existingCard.deckId === targetDeck.id && existingCard.ord === 0,
          );

          if (!hasCard) {
            await addCard({
              noteId: noteRecord.id,
              deckId: targetDeck.id,
              ord: 0,
              cardType: "new",
              queue: 0,
              due: 0,
            });
          }
        }

        setStatus("success");
        setMessage(`成功导入 ${cards.length} 张卡片`);

        // 2秒后关闭对话框
        setTimeout(() => {
          setOpen(false);
          setStatus("idle");
          setSelectedFile(null);
          setMessage("");
          onSuccess?.();
        }, 2000);
      } catch (error) {
        console.error("导入卡片失败:", error);
        setStatus("error");
        setMessage("导入失败，请重试");
      }
    };
    reader.onerror = () => {
      console.error("读取文件失败");
      setStatus("error");
      setMessage("读取文件失败");
    };
    reader.readAsText(file, "utf-8");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const txtFile = files.find((file) => file.name.endsWith(".txt"));

    if (txtFile) {
      setSelectedFile(txtFile);
      readFileContent(txtFile);
    } else {
      setStatus("error");
      setMessage("仅支持 .txt 文件");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
      readFileContent(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            导入单词
          </DialogTitle>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* 拖拽上传区域 */}
          <div
            onClick={status === "idle" ? handleClick : undefined}
            onDragOver={status === "idle" ? handleDragOver : undefined}
            onDragLeave={status === "idle" ? handleDragLeave : undefined}
            onDrop={status === "idle" ? handleDrop : undefined}
            className={`relative overflow-hidden rounded-xl border-2 border-dashed p-8 transition-all duration-200 ${
              status === "idle" && "cursor-pointer"
            } ${
              isDragging
                ? "border-sky-500 bg-sky-50"
                : status === "idle"
                  ? "border-gray-300 hover:border-sky-400 hover:bg-gray-50"
                  : "border-transparent"
            } ${status === "loading" && "bg-sky-50"} ${
              status === "success" && "bg-green-50"
            } ${status === "error" && "bg-red-50"}`}
          >
            {/* 空闲状态 */}
            {status === "idle" && (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="rounded-full bg-sky-100 p-4">
                  <Upload className="h-8 w-8 text-sky-600" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-gray-700">
                    {selectedFile ? selectedFile.name : "拖拽文件到此处"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">或点击选择文件</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">
                    仅支持 .txt 文件
                  </span>
                </div>
              </div>
            )}

            {/* 加载状态 */}
            {status === "loading" && (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-gray-700">
                    {message}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">请稍候...</p>
                </div>
              </div>
            )}

            {/* 成功状态 */}
            {status === "success" && (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-green-700">
                    导入成功！
                  </p>
                  <p className="mt-1 text-sm text-green-600">{message}</p>
                </div>
              </div>
            )}

            {/* 错误状态 */}
            {status === "error" && (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-red-700">导入失败</p>
                  <p className="mt-1 text-sm text-red-600">{message}</p>
                </div>
                <button
                  onClick={() => {
                    setStatus("idle");
                    setMessage("");
                  }}
                  className="mt-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  重新选择
                </button>
              </div>
            )}
          </div>

          {/* 提示信息 */}
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm leading-relaxed text-blue-700">
              <span className="font-semibold">提示：</span>
              请确保 .txt 文件为 Anki 导出格式，包含正确的列映射信息。
            </p>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
