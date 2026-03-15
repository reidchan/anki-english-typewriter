"use client";

import { TypingContext, TypingStateActionType } from "../../store";
import Tooltip from "@/components/Tooltip";
import { randomConfigAtom } from "@/lib/store";
import { useAtomValue } from "jotai";
import { useCallback, useContext } from "react";
import { useHotkeys } from "react-hotkeys-hook";

export default function StartButton({ isLoading }: { isLoading: boolean }) {
  const { state, dispatch } = useContext(TypingContext)!;
  const randomConfig = useAtomValue(randomConfigAtom);
  const isTyping = state.isTyping;
  const isPrimaryDisabled = isLoading;
  const isRestartDisabled = isLoading || !state.chapterData.words?.length;

  const onToggleIsTyping = useCallback(() => {
    if (isLoading) return;
    dispatch({ type: TypingStateActionType.TOGGLE_IS_TYPING });
  }, [isLoading, dispatch]);

  const onClickRestart = useCallback(() => {
    dispatch({
      type: TypingStateActionType.REPEAT_CHAPTER,
      shouldShuffle: randomConfig.isOpen,
    });
  }, [dispatch, randomConfig.isOpen]);

  useHotkeys(
    "enter",
    onToggleIsTyping,
    { enableOnFormTags: true, preventDefault: true },
    [onToggleIsTyping],
  );

  return (
    <Tooltip
      content={`${isTyping ? "暂停" : "开始"}（Enter）`}
      className="box-content px-4 py-2"
    >
      <div className="flex items-center gap-2 rounded-2xl border border-white/55 bg-white/70 p-1 shadow-[0_14px_32px_-18px_rgba(79,70,229,0.6)] backdrop-blur-sm dark:border-white/10 dark:bg-gray-900/60 dark:shadow-black/30">
        <button
          className={`my-btn-primary min-w-[88px] px-4 shadow-sm focus:ring-indigo-300 ${
            isTyping
              ? "bg-white/90 text-slate-700 ring-1 ring-slate-200 shadow-none hover:scale-100 hover:shadow-none active:scale-100 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
              : "shadow-indigo-300/60"
          } ${isPrimaryDisabled ? "cursor-not-allowed opacity-50 hover:scale-100 active:scale-100" : ""}`}
          type="button"
          onClick={onToggleIsTyping}
          aria-label={isTyping ? "暂停" : "开始"}
          disabled={isPrimaryDisabled}
        >
          <span className="font-semibold tracking-[0.02em]">
            {isTyping ? "暂停" : isLoading ? "加载中" : "开始"}
          </span>
        </button>
        <button
          className={`my-btn-primary min-w-[92px] bg-white/90 px-4 text-sm font-semibold tracking-[0.02em] text-slate-700 shadow-none ring-1 ring-slate-200 hover:scale-100 hover:shadow-none active:scale-100 focus:ring-indigo-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:ring-offset-gray-900 ${
            isRestartDisabled
              ? "cursor-not-allowed bg-slate-100/80 text-slate-400 hover:scale-100 active:scale-100 dark:bg-slate-900 dark:text-slate-500"
              : ""
          }`}
          type="button"
          onClick={onClickRestart}
          aria-label="重新开始"
          disabled={isRestartDisabled}
        >
          重新开始
        </button>
      </div>
    </Tooltip>
  );
}
