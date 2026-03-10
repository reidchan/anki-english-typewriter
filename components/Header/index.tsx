'use client'

import logo from '@/assets/logo.svg'
import type { PropsWithChildren } from 'react'
import type React from 'react'
import Link from 'next/link'

const Header: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <header className="container z-20 mx-auto w-full px-16 py-8">
      <div className="flex w-full flex-col items-center justify-between space-y-4 lg:flex-row lg:space-y-0">
        <Link
          className="flex items-center text-2xl font-bold text-indigo-500 no-underline hover:no-underline lg:text-4xl"
          href="https://qwerty.kaiyi.cool/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={logo} className="mr-3 h-16 w-16" alt="Qwerty Learner Logo" />
          <h1>Qwerty Learner</h1>
        </Link>
        <nav className="my-card-glass flex w-auto content-center items-center justify-end space-x-3 px-6 py-3">
          {children}
        </nav>
      </div>
    </header>
  )
}

export default Header
