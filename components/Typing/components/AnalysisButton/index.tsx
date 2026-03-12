import { recordAnalysisAction } from "@/lib/utils";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChartPie } from "lucide-react";
// import ChartPie from '~icons/heroicons/chart-pie-solid'

const AnalysisButton = () => {
  const router = useRouter();

  const toAnalysis = useCallback(() => {
    router.push("/analysis");
    recordAnalysisAction("open");
  }, [router]);

  return (
    <button
      type="button"
      onClick={toAnalysis}
      className="flex h-7 w-7 items-center justify-center rounded text-indigo-500 outline-none transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white"
      title="查看数据统计"
    >
      <ChartPie className="h-5 w-5" />
    </button>
  );
};

export default AnalysisButton;
