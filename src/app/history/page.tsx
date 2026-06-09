'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Eye, History, TrendingUp, Calendar, AlertCircle,
  CheckCircle2, AlertTriangle, ArrowLeft, LogIn,
  Trash2, Sun, Moon, Monitor, Settings, X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

interface Scan {
  id: string
  grade: number
  gradeName: string
  riskLevel: string
  confidence: number
  description: string
  urgency: string
  createdAt: string
}

const riskConfig: Record<string, { color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  'ไม่พบความเสี่ยง': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  'ความเสี่ยงต่ำ': { color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200', icon: CheckCircle2 },
  'ความเสี่ยงปานกลาง': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle },
  'ความเสี่ยงสูง': { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle },
}

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/scans')
        .then(r => r.json())
        .then(d => { setScans(d.scans || []); setLoading(false) })
    } else if (status !== 'loading') {
      setLoading(false)
    }
  }, [status])

  const clearHistory = async () => {
    setClearing(true)
    await fetch('/api/scans', { method: 'DELETE' })
    setScans([])
    setClearing(false)
    setShowConfirmClear(false)
  }

  const chartData = [...scans].reverse().map((s) => ({
    date: new Date(s.createdAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
    grade: s.grade,
    gradeName: s.gradeName,
  }))

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center p-8">
          <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-sm text-slate-500 mb-6">เพื่อดูประวัติการตรวจของคุณ</p>
          <Button onClick={() => signIn('google')} className="bg-teal-600 hover:bg-teal-700 text-white w-full">
            <LogIn className="w-4 h-4 mr-2" />เข้าสู่ระบบด้วย Google
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">

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
              <div className="mb-6">
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

              {/* Clear History */}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">ข้อมูล</p>
                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => { setShowSettings(false); setShowConfirmClear(true) }}
                  disabled={scans.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  ล้างประวัติการตรวจทั้งหมด
                  {scans.length > 0 && <Badge className="ml-2 bg-red-100 text-red-600 border-0">{scans.length}</Badge>}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Clear Modal */}
      <AnimatePresence>
        {showConfirmClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 text-center"
            >
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">ล้างประวัติทั้งหมด?</h3>
              <p className="text-sm text-slate-500 mb-6">ประวัติการตรวจ {scans.length} ครั้งจะถูกลบถาวร ไม่สามารถกู้คืนได้</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirmClear(false)}>
                  ยกเลิก
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={clearHistory}
                  disabled={clearing}
                >
                  {clearing ? 'กำลังลบ...' : 'ลบทั้งหมด'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-gray-700/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">ประวัติการตรวจ</h1>
                <p className="text-xs text-slate-500">{session?.user?.name}</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
            <Settings className="w-5 h-5 text-slate-500" />
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-slate-400">กำลังโหลด...</div>
        ) : scans.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">ยังไม่มีประวัติการตรวจ</h2>
            <p className="text-sm text-slate-400 mb-6">เริ่มวิเคราะห์ภาพถ่ายจอประสาทตาเพื่อบันทึกผล</p>
            <Button onClick={() => router.push('/')} className="bg-teal-600 hover:bg-teal-700 text-white">
              เริ่มตรวจเลย
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'ตรวจทั้งหมด', value: scans.length, unit: 'ครั้ง', color: 'text-teal-600' },
                { label: 'ล่าสุด', value: scans[0]?.gradeName || '-', unit: '', color: 'text-slate-700 dark:text-slate-300' },
                { label: 'ความเสี่ยงสูง', value: scans.filter(s => s.grade >= 3).length, unit: 'ครั้ง', color: 'text-red-600' },
                { label: 'ปกติ', value: scans.filter(s => s.grade === 0).length, unit: 'ครั้ง', color: 'text-emerald-600' },
              ].map((stat, i) => (
                <Card key={i} className="border-slate-200/60 dark:border-gray-700 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value} <span className="text-sm font-normal text-slate-400">{stat.unit}</span></p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Chart */}
            {chartData.length >= 2 && (
              <Card className="border-slate-200/60 dark:border-gray-700 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600" />แนวโน้มระดับโรค
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tickFormatter={(v) => ['No DR', 'Mild', 'Mod.', 'Severe', 'PDR'][v]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip formatter={(value: number) => [['No DR', 'Mild NPDR', 'Moderate NPDR', 'Severe NPDR', 'Proliferative DR'][value], 'ระดับ']} labelFormatter={(label) => `วันที่: ${label}`} />
                      <ReferenceLine y={3} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'เสี่ยงสูง', fontSize: 10, fill: '#ef4444' }} />
                      <Line type="monotone" dataKey="grade" stroke="#14b8a6" strokeWidth={2} dot={{ fill: '#14b8a6', r: 5 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* History List */}
            <Card className="border-slate-200/60 dark:border-gray-700 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  ประวัติทั้งหมด ({scans.length} ครั้ง)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-gray-700">
                  {scans.map((scan, i) => {
                    const config = riskConfig[scan.riskLevel] || riskConfig['ไม่พบความเสี่ยง']
                    const IconComp = config.icon
                    return (
                      <motion.div
                        key={scan.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                          <IconComp className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{scan.gradeName}</p>
                            <Badge className={`${config.bg} ${config.color} ${config.border} text-xs border`}>{scan.riskLevel}</Badge>
                          </div>
                          <p className="text-xs text-slate-400">
                            {new Date(scan.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{scan.confidence.toFixed(1)}%</p>
                          <p className="text-xs text-slate-400">ความมั่นใจ</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}