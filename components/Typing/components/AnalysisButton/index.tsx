import { recordAnalysisAction } from '@/lib/utils'
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
// import ChartPie from '~icons/heroicons/chart-pie-solid'

const AnalysisButton = () => {
  const router = useRouter()

  const toAnalysis = useCallback(() => {
    router.push('/analysis')
    recordAnalysisAction('open')
  }, [router])

  return (
    <button
      type="button"
      onClick={toAnalysis}
      className={`flex items-center justify-center rounded p-[2px] text-lg text-indigo-500 outline-none transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white`}
      title="查看数据统计"
    >
      {/* <ChartPie className="icon" /> */}
      <span>📊</span>
    </button>
  )
}

export default AnalysisButton
