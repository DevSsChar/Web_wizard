"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { User, LogOut } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session, status } = useSession()

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative flex items-center justify-between py-4">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/" className="flex items-center gap-2 text-white font-semibold text-lg">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="28" 
                height="28" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-blue-500"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              ChatSecure
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="hidden lg:flex items-center gap-8"
          >
            <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
              How it Works
            </Link>
            <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#security" className="text-gray-300 hover:text-white transition-colors">
              Security
            </Link>
            {/* <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </Link> */}
            <Link href="#about" className="text-gray-300 hover:text-white transition-colors">
              About
            </Link>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="hidden lg:flex items-center gap-3"
          >
            {session ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt="Profile" 
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-300">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/dashboard" 
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Dashboard
                  </Link>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => signOut()}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/login" 
                    className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg transition-all"
                  >
                    Login
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/dashboard" 
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Get Started
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Mobile menu button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-gray-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {!isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-t border-white/10 py-4"
          >
            <div className="space-y-4">
              <Link href="#how-it-works" className="block text-gray-300 hover:text-white transition-colors">
                How it Works
              </Link>
              <Link href="#features" className="block text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#security" className="block text-gray-300 hover:text-white transition-colors">
                Security
              </Link>
              {/* <Link href="#pricing" className="block text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link> */}
              <Link href="#about" className="block text-gray-300 hover:text-white transition-colors">
                About
              </Link>
              <div className="pt-4 border-t border-white/10 space-y-3">
                {session ? (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                      {session.user?.image ? (
                        <img 
                          src={session.user.image} 
                          alt="Profile" 
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-300">
                        {session.user?.name || session.user?.email}
                      </span>
                    </div>
                    <Link 
                      href="/dashboard" 
                      className="block px-4 py-2 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="block w-full px-4 py-2 text-center text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg transition-all"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      className="block px-4 py-2 text-center text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg transition-all"
                    >
                      Login
                    </Link>
                    <Link 
                      href="/dashboard" 
                      className="block px-4 py-2 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}