'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Eye, Sparkles, LogIn, LogOut, History, User,
  Settings, Sun, Moon, Monitor, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Navbar() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-teal-600" />ตั้งค่า
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Theme */}
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">ธีม</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'light', label: 'สว่าง', icon: Sun },
                    { value: 'dark', label: 'มืด', icon: Moon },
                    { value: 'system', label: 'ระบบ', icon: Monitor },
                  ].map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        theme === t.value
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30'
                          : 'border-slate-200 dark:border-gray-600 hover:border-teal-300'
                      }`}
                    >
                      <t.icon className={`w-5 h-5 ${theme === t.value ? 'text-teal-600' : 'text-slate-400'}`} />
                      <span className={`text-xs font-medium ${theme === t.value ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500'}`}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account */}
              {session && (
                <div className="pt-4 border-t border-slate-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">บัญชี</p>
                  <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-slate-50 dark:bg-gray-700">
                    {session.user?.image
                      ? <img src={session.user.image} className="w-8 h-8 rounded-full" alt="avatar" />
                      : <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center"><User className="w-4 h-4 text-teal-600" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{session.user?.name}</p>
                      <p className="text-xs text-slate-400 truncate">{session.user?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={() => { signOut(); setShowSettings(false) }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />ออกจากระบบ
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-gray-700/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => router.push('/')} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">RetinaAI Screen</h1>
              <p className="text-xs text-slate-500 leading-tight">คัดกรองเบาหวานขึ้นตาด้วย AI</p>
            </div>
          </button>

          {/* Right */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200 text-xs hidden sm:flex">
              <Sparkles className="w-3 h-3 mr-1" />AI-Powered
            </Badge>

            {session ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => router.push('/history')} className="text-slate-500 hover:text-slate-700 text-xs">
                  <History className="w-4 h-4 mr-1" />ประวัติ
                </Button>
                {session.user?.image
                  ? <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full border-2 border-teal-200 cursor-pointer" onClick={() => setShowSettings(true)} />
                  : <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center cursor-pointer" onClick={() => setShowSettings(true)}><User className="w-4 h-4 text-teal-600" /></div>
                }
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => signIn('google')} className="border-teal-200 text-teal-700 hover:bg-teal-50 text-xs">
                <LogIn className="w-4 h-4 mr-1" />เข้าสู่ระบบ
              </Button>
            )}

            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="text-slate-500">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
    </>
  )
}