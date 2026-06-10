'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signIn } from 'next-auth/react'
import {
  Eye, Upload, Camera, Shield, AlertTriangle, CheckCircle2,
  Activity, Heart, Info, RotateCcw, FileImage,
  Clock, Stethoscope, ArrowRight, Sparkles, AlertCircle, Loader2, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface AnalysisResult {
  riskLevel: string
  confidence: number
  grade: string
  findings: string[]
  description: string
  recommendations: string[]
  urgency: string
}

type AppState = 'idle' | 'preview' | 'analyzing' | 'result' | 'error'

const riskConfig: Record<string, { color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  'ไม่พบความเสี่ยง': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  'ความเสี่ยงต่ำ': { color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200', icon: CheckCircle2 },
  'ความเสี่ยงปานกลาง': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle },
  'ความเสี่ยงสูง': { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle },
}

const urgencyConfig: Record<string, { color: string; bg: string }> = {
  'ไม่เร่งด่วน': { color: 'text-emerald-700', bg: 'bg-emerald-100' },
  'ควรตรวจติดตาม': { color: 'text-teal-700', bg: 'bg-teal-100' },
  'ควรพบแพทย์เร็ว': { color: 'text-amber-700', bg: 'bg-amber-100' },
  'เร่งด่วนมาก': { color: 'text-red-700', bg: 'bg-red-100' },
}

const FLASK_URL = 'https://dr-api-eamg.onrender.com'
const GRADE_NAMES = ['No DR', 'Mild NPDR', 'Moderate NPDR', 'Severe NPDR', 'Proliferative DR']

export default function Home() {
  const { data: session } = useSession()
  const [appState, setAppState] = useState<AppState>('idle')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [heatmap, setHeatmap] = useState<string | null>(null)
  const [loadingHeatmap, setLoadingHeatmap] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) { setErrorMessage('รองรับเฉพาะไฟล์ภาพประเภท JPEG, PNG และ WebP'); setAppState('error'); return }
    if (file.size > 10 * 1024 * 1024) { setErrorMessage('ขนาดไฟล์ต้องไม่เกิน 10 MB'); setAppState('error'); return }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => { setImagePreview(e.target?.result as string); setAppState('preview') }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file) }, [handleFile])
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }, [])
  const handleDragLeave = useCallback(() => { setIsDragOver(false) }, [])

  const analyzeImage = async () => {
    if (!imageFile) return
    setAppState('analyzing')
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      const response = await fetch('/api/analyze', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok || !data.success) { setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการวิเคราะห์'); setAppState('error'); return }
      setResult(data.result)
      setAppState('result')
      if (session) {
        await fetch('/api/scans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grade: GRADE_NAMES.indexOf(data.result.grade),
            gradeName: data.result.grade,
            riskLevel: data.result.riskLevel,
            confidence: data.result.confidence,
            findings: data.result.findings,
            recommendations: data.result.recommendations,
            description: data.result.description,
            urgency: data.result.urgency,
          }),
        })
      }
    } catch { setErrorMessage('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่'); setAppState('error') }
  }

  const fetchHeatmap = async () => {
    if (!imageFile || !result) return
    setLoadingHeatmap(true)
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('gradeIdx', String(GRADE_NAMES.indexOf(result.grade)))
      const res = await fetch(`${FLASK_URL}/gradcam`, { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) setHeatmap(data.heatmap)
    } catch {}
    setLoadingHeatmap(false)
  }

  const resetApp = () => {
    setAppState('idle'); setImagePreview(null); setImageFile(null)
    setResult(null); setErrorMessage(''); setHeatmap(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        <AnimatePresence mode="wait">

          {/* IDLE */}
          {appState === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <div className="text-center mb-8 sm:mb-12">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, duration: 0.5 }} className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 mb-6 shadow-xl shadow-teal-500/25">
                  <Eye className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">คัดกรองเบาหวานขึ้นตา</h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-2">วิเคราะห์ความเสี่ยงจากภาพถ่ายจอประสาทตาด้วยปัญญาประดิษฐ์</p>
                <p className="text-sm text-slate-400 max-w-xl mx-auto">อัปโหลดภาพถ่ายจอประสาทตา (Fundus Photography) แล้วให้ AI ช่วยวิเคราะห์ความเสี่ยงเบาหวานขึ้นตาได้ภายในไม่กี่วินาที</p>
                {!session && <p className="text-xs text-slate-400 mt-3"><button onClick={() => signIn('google')} className="text-teal-600 hover:underline">เข้าสู่ระบบ</button> เพื่อบันทึกประวัติการตรวจ</p>}
              </div>

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="max-w-2xl mx-auto mb-10">
                <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 transition-all duration-300 text-center ${isDragOver ? 'border-teal-400 bg-teal-50/50 scale-[1.02]' : 'border-slate-300 bg-white dark:bg-gray-800 dark:border-gray-600 hover:border-teal-300 hover:bg-teal-50/30'}`}>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file) }} />
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragOver ? 'bg-teal-100' : 'bg-slate-100 dark:bg-gray-700'}`}>
                      <Upload className={`w-7 h-7 ${isDragOver ? 'text-teal-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">{isDragOver ? 'วางไฟล์ที่นี่' : 'ลากไฟล์มาวาง หรือคลิกเพื่ออัปโหลด'}</p>
                      <p className="text-sm text-slate-400">รองรับ JPEG, PNG, WebP (สูงสุด 10 MB)</p>
                    </div>
                    <Button variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
                      <Camera className="w-4 h-4 mr-2" />เลือกไฟล์ภาพ
                    </Button>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10">
                {[
                  { icon: Shield, title: 'วิเคราะห์ด้วย AI', desc: 'ใช้โมเดล AI วิเคราะห์ภาพถ่ายจอประสาทตาอัตโนมัติ', color: 'from-teal-500 to-teal-600', shadow: 'shadow-teal-500/20' },
                  { icon: Activity, title: 'ประเมินความเสี่ยง', desc: 'จัดระดับความเสี่ยงตามเกณฑ์ทางการแพทย์มาตรฐาน', color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
                  { icon: Heart, title: 'คำแนะนำที่เหมาะสม', desc: 'รับคำแนะนำและขั้นตอนถัดไปตามผลการวิเคราะห์', color: 'from-cyan-500 to-cyan-600', shadow: 'shadow-cyan-500/20' },
                ].map((item, i) => (
                  <Card key={i} className="border-slate-200/60 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 shadow-lg ${item.shadow}`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }} className="max-w-4xl mx-auto">
                <Accordion type="single" collapsible>
                  <AccordionItem value="dr-info" className="border-slate-200/60 dark:border-gray-700">
                    <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 dark:hover:bg-gray-800 px-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-teal-600" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">รู้จักโรคเบาหวานขึ้นตา (Diabetic Retinopathy)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                        <p>โรคเบาหวานขึ้นตา (Diabetic Retinopathy) เป็นภาวะแทรกซ้อนของโรคเบาหวานที่ส่งผลต่อหลอดเลือดในเรตินา หากไม่ได้รับการรักษาอาจนำไปสู่การสูญเสียการมองเห็นได้</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { grade: 'No DR', desc: 'ไม่พบลักษณะผิดปกติ', color: 'bg-emerald-100 text-emerald-700' },
                            { grade: 'Mild NPDR', desc: 'พบ Microaneurysms เล็กน้อย', color: 'bg-teal-100 text-teal-700' },
                            { grade: 'Moderate NPDR', desc: 'พบเลือดออกและ Exudates', color: 'bg-amber-100 text-amber-700' },
                            { grade: 'Severe NPDR', desc: 'พบลักษณะรุนแรงหลายอย่าง', color: 'bg-orange-100 text-orange-700' },
                          ].map((stage, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-gray-700">
                              <Badge className={`${stage.color} text-xs font-medium`}>{stage.grade}</Badge>
                              <span className="text-xs">{stage.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.div>
            </motion.div>
          )}

          {/* PREVIEW */}
          {appState === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">ตรวจสอบภาพก่อนวิเคราะห์</h2>
                <p className="text-sm text-slate-500">กรุณาตรวจสอบว่าเป็นภาพถ่ายจอประสาทตาที่ชัดเจน</p>
              </div>
              <Card className="border-slate-200/60 shadow-lg overflow-hidden mb-6">
                <CardContent className="p-0">
                  <div className="relative aspect-[4/3] bg-slate-900 flex items-center justify-center overflow-hidden">
                    {imagePreview && <img src={imagePreview} alt="ภาพถ่ายจอประสาทตาที่อัปโหลด" className="max-w-full max-h-full object-contain" />}
                    <Button variant="secondary" size="icon" className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white border-0" onClick={resetApp}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-4 flex items-center gap-3 bg-slate-50 dark:bg-gray-800">
                    <FileImage className="w-5 h-5 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{imageFile?.name}</p>
                      <p className="text-xs text-slate-400">{imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB • ${imageFile.type.split('/')[1].toUpperCase()}` : ''}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12 border-slate-300" onClick={resetApp}><RotateCcw className="w-4 h-4 mr-2" />เลือกภาพใหม่</Button>
                <Button className="flex-1 h-12 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25" onClick={analyzeImage}>
                  <Sparkles className="w-4 h-4 mr-2" />เริ่มวิเคราะห์<ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ANALYZING */}
          {appState === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="max-w-2xl mx-auto">
              <div className="text-center py-12">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 mb-8 shadow-xl shadow-teal-500/25">
                  <Eye className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">กำลังวิเคราะห์ภาพ</h2>
                <p className="text-slate-500 mb-8">AI กำลังตรวจสอบลักษณะผิดปกติในภาพถ่ายจอประสาทตา...</p>
                {imagePreview && (
                  <div className="relative w-40 h-40 mx-auto rounded-xl overflow-hidden border-4 border-white shadow-xl mb-8">
                    <img src={imagePreview} alt="กำลังวิเคราะห์" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-teal-500/20 animate-pulse" />
                  </div>
                )}
                <div className="space-y-3 max-w-xs mx-auto">
                  {[
                    { text: 'กำลังอ่านข้อมูลภาพ...', delay: 0 },
                    { text: 'กำลังตรวจหา Microaneurysms...', delay: 1500 },
                    { text: 'กำลังประเมินหลอดเลือดและเลือดออก...', delay: 3000 },
                    { text: 'กำลังสรุปผลการวิเคราะห์...', delay: 4500 },
                  ].map((step, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: step.delay / 1000, duration: 0.3 }} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-teal-500" />{step.text}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* RESULT */}
          {appState === 'result' && result && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">ผลการวิเคราะห์</h2>
                <p className="text-sm text-slate-500">ผลการคัดกรองเบาหวานขึ้นตาจากภาพถ่ายจอประสาทตา</p>
                {session && <p className="text-xs text-teal-600 mt-1">✓ บันทึกผลการตรวจเรียบร้อยแล้ว</p>}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-4">

                  {/* รูปต้นฉบับ */}
                  <Card className="border-slate-200/60 shadow-lg overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative aspect-[4/3] bg-slate-900 flex items-center justify-center overflow-hidden">
                        {imagePreview && <img src={imagePreview} alt="ภาพที่วิเคราะห์" className="max-w-full max-h-full object-contain" />}
                      </div>
                      <p className="text-xs text-center text-slate-400 py-1">ภาพต้นฉบับ</p>
                    </CardContent>
                  </Card>

                  {/* Heatmap */}
                  <Card className="border-slate-200/60 shadow-lg overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative aspect-[4/3] bg-slate-900 flex items-center justify-center overflow-hidden">
                        {heatmap ? (
                          <img src={`data:image/jpeg;base64,${heatmap}`} alt="AI Heatmap" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-center p-6">
                            <Eye className="w-8 h-8 text-slate-500" />
                            <p className="text-xs text-slate-400">กดปุ่มด้านล่างเพื่อดูจุดที่ AI โฟกัส</p>
                            <p className="text-xs text-slate-500">🔴 แดง = สำคัญมาก · 🔵 น้ำเงิน = สำคัญน้อย</p>
                          </div>
                        )}
                        {loadingHeatmap && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="text-center">
                              <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-2" />
                              <p className="text-xs text-white">กำลังคำนวณ heatmap...</p>
                              <p className="text-xs text-slate-400 mt-1">ใช้เวลา ~30 วินาที</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-gray-800">
                        <Button variant="outline" size="sm" className="w-full border-teal-200 text-teal-700 hover:bg-teal-50 text-xs" onClick={fetchHeatmap} disabled={loadingHeatmap}>
                          {loadingHeatmap ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Eye className="w-3 h-3 mr-1" />}
                          {heatmap ? 'คำนวณ Heatmap ใหม่' : 'แสดงจุดที่ AI โฟกัส'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Level */}
                  {(() => {
                    const config = riskConfig[result.riskLevel] || riskConfig['ไม่พบความเสี่ยง']
                    const IconComp = config.icon
                    const uc = urgencyConfig[result.urgency] || urgencyConfig['ไม่เร่งด่วน']
                    return (
                      <Card className={`${config.border} ${config.bg} shadow-sm`}>
                        <CardContent className="p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <IconComp className={`w-6 h-6 ${config.color}`} />
                            <div>
                              <p className="text-xs font-medium text-slate-500">ระดับความเสี่ยง</p>
                              <p className={`text-lg font-bold ${config.color}`}>{result.riskLevel}</p>
                            </div>
                          </div>
                          <div className="space-y-2 mb-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">ความมั่นใจ</span>
                              <span className={`font-semibold ${config.color}`}>{result.confidence}%</span>
                            </div>
                            <Progress value={result.confidence} className="h-2" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-xs text-slate-500">ความเร่งด่วน:</span>
                            <Badge className={`${uc.bg} ${uc.color} text-xs border-0`}>{result.urgency}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })()}

                  <Card className="border-slate-200/60 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-teal-600" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">ระดับโรค (ICDR)</span>
                      </div>
                      <Badge className="bg-slate-900 text-white text-sm px-3 py-1">{result.grade}</Badge>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-3 space-y-4">
                  <Card className="border-slate-200/60 shadow-sm">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2"><Info className="w-4 h-4 text-teal-600" />สรุปผลการวิเคราะห์</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{result.description}</p>
                    </CardContent>
                  </Card>
                  {result.findings?.length > 0 && (
                    <Card className="border-slate-200/60 shadow-sm">
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2"><Eye className="w-4 h-4 text-teal-600" />สิ่งที่พบจากภาพ</h3>
                        <div className="space-y-2">
                          {result.findings.map((finding, i) => (
                            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-gray-700">
                              <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs font-bold text-teal-700">{i + 1}</span></div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{finding}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {result.recommendations?.length > 0 && (
                    <Card className="border-slate-200/60 shadow-sm">
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-teal-600" />คำแนะนำ</h3>
                        <div className="space-y-2">
                          {result.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-teal-50/50 dark:bg-teal-900/20">
                              <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-slate-600 dark:text-slate-400">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800 mb-1">ข้อจำกัดของเครื่องมือ</p>
                          <p className="text-xs text-amber-700 leading-relaxed">เครื่องมือนี้เป็นการคัดกรองเบื้องต้นโดยใช้ปัญญาประดิษฐ์ ไม่สามารถใช้แทนการวินิจฉัยของแพทย์ผู้เชี่ยวชาญได้</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Button variant="outline" className="w-full h-11 border-slate-300" onClick={resetApp}><RotateCcw className="w-4 h-4 mr-2" />วิเคราะห์ภาพใหม่</Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ERROR */}
          {appState === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="max-w-md mx-auto text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6"><AlertCircle className="w-8 h-8 text-red-500" /></div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">เกิดข้อผิดพลาด</h2>
              <p className="text-sm text-slate-500 mb-6">{errorMessage}</p>
              <Button onClick={resetApp} className="bg-teal-600 hover:bg-teal-700 text-white"><RotateCcw className="w-4 h-4 mr-2" />ลองใหม่อีกครั้ง</Button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-200/60 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <p>RetinaAI Screen — เครื่องมือคัดกรองเบาหวานขึ้นตาด้วย AI (เบื้องต้น)</p>
            <p>ไม่ใช่การวินิจฉัยทางการแพทย์ • กรุณาปรึกษาแพทย์เพื่อผลที่แม่นยำ</p>
          </div>
        </div>
      </footer>
    </div>
  )
}