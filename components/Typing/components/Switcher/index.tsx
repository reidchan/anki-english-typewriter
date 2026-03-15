"use client";

import { TypingContext, TypingStateActionType } from "../../store";
import { Languages, Ban } from "lucide-react";
import AnalysisButton from "../AnalysisButton";
import ErrorBookButton from "../ErrorBookButton";
import HandPositionIllustration from "../HandPositionIllustration";
import LoopWordSwitcher from "../LoopWordSwitcher";
import Setting from "../Setting";
import SoundSwitcher from "../SoundSwitcher";
import WordDictationSwitcher from "../WordDictationSwitcher";
import Tooltip from "@/components/Tooltip";
import { isOpenDarkModeAtom } from "@/lib/store";
import { CTRL } from "@/lib/utils";
import { useAtom } from "jotai";
import { useContext } from "react";
import { useHotkeys } from "react-hotkeys-hook";
// import IconMoon from '~icons/heroicons/moon-solid'
// import IconSun from '~icons/heroicons/sun-solid'
// import IconLanguage from '~icons/tabler/language'
// import IconLanguageOff from '~icons/tabler/language-off'

export default function Switcher() {
  const [isOpenDarkMode, setIsOpenDarkMode] = useAtom(isOpenDarkModeAtom);
  const { state, dispatch } = useContext(TypingContext) ?? {};

  const changeDarkModeState = () => {
    setIsOpenDarkMode((old) => !old);
  };

  const changeTransVisibleState = () => {
    if (dispatch) {
      dispatch({ type: TypingStateActionType.TOGGLE_TRANS_VISIBLE });
    }
  };

  useHotkeys(
    "ctrl+shift+v",
    () => {
      changeTransVisibleState();
    },
    { enableOnFormTags: true, preventDefault: true },
    [],
  );

  return (
    <div className="flex items-center justify-center gap-2">
      <Tooltip className="h-7 w-7" content={`开关默写模式（${CTRL} + V）`}>
        <WordDictationSwitcher />
      </Tooltip>
      <Tooltip
        className="h-7 w-7"
        content={`开关释义显示（${CTRL} + Shift + V）`}
      >
        <button
          className={`flex h-7 w-7 items-center justify-center rounded text-indigo-500 outline-none transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white ${
            state?.isTransVisible ? "text-indigo-500" : "text-gray-500"
          }`}
          type="button"
          onClick={(e) => {
            changeTransVisibleState();
            e.currentTarget.blur();
          }}
          aria-label={`开关释义显示（${CTRL} + Shift + V）`}
        >
          {/* {state?.isTransVisible ? <IconLanguage /> : <IconLanguageOff />} */}
          {state?.isTransVisible ? (
            <Languages className="relative top-[-1px] h-5 w-5 shrink-0" />
          ) : (
            <Ban className="relative top-[-1px] h-5 w-5 shrink-0 text-red-500" />
          )}
        </button>
      </Tooltip>

      {/* <Tooltip content="错题本">
        <ErrorBookButton />
      </Tooltip> */}

      {/* <Tooltip className="h-7 w-7" content="查看数据统计">
        <AnalysisButton />
      </Tooltip> */}

      {/* <Tooltip content="设置">
        <Setting />
      </Tooltip> */}
    </div>
  );
}
