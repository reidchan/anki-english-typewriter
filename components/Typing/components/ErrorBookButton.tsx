import { recordErrorBookAction } from "@/lib/utils";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { NotebookTabs } from "lucide-react";
// import IconBook from '~icons/bxs/book'

const ErrorBookButton = () => {
  const router = useRouter();

  const toErrorBook = useCallback(() => {
    router.push("/error-book");
    recordErrorBookAction("open");
  }, [router]);

  return (
    <button
      type="button"
      onClick={toErrorBook}
      className="flex h-7 w-7 items-center justify-center rounded text-indigo-500 outline-none transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white"
      title="查看错题本"
    >
      <NotebookTabs className="h-5 w-5" />
    </button>
  );
};

export default ErrorBookButton;
