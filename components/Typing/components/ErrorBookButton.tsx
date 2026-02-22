import { recordErrorBookAction } from '@/lib/utils'
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
// import IconBook from '~icons/bxs/book'

const ErrorBookButton = () => {
  const router = useRouter()

  const toErrorBook = useCallback(() => {
    router.push('/error-book')
    recordErrorBookAction('open')
  }, [router])

  return (
    <button
      type="button"
      onClick={toErrorBook}
      className={`flex items-center justify-center rounded p-[2px] text-lg text-indigo-500 outline-none transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white`}
      title="查看错题本"
    >
      {/* <IconBook className="icon" /> */}
      <span>📖</span>
    </button>
  )
}

export default ErrorBookButton
