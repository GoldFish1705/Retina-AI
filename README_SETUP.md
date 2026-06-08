# 🏥 RetinaAI Screen — คัดกรองเบาหวานขึ้นตาด้วย AI

## วิธีติดตั้งและรันบน Localhost

### 1. สิ่งที่ต้องเตรียม
- **Node.js** เวอร์ชัน 18 ขึ้นไป หรือ **Bun** (แนะนำ)
- ระบบปฏิบัติการ Windows / macOS / Linux

### 2. ติดตั้ง Dependencies
```bash
# ถ้าใช้ Bun (แนะนำ - เร็วกว่า)
bun install

# หรือถ้าใช้ Node.js
npm install
```

### 3. รัน Development Server
```bash
# ถ้าใช้ Bun
bun run dev

# หรือถ้าใช้ Node.js
npm run dev
```

เปิดเบราว์เซอร์ไปที่ **http://localhost:3000**

### 4. สร้าง Production Build (optional)
```bash
bun run build
bun run start
```

---

## โครงสร้างโปรเจกต์

```
retina-ai-screen/
├── src/
│   ├── app/
│   │   ├── page.tsx          ← หน้าเว็บหลัก (UI ทั้งหมด)
│   │   ├── layout.tsx        ← Layout + Metadata
│   │   ├── globals.css       ← Global styles
│   │   └── api/
│   │       └── analyze/
│   │           └── route.ts  ← API วิเคราะห์ภาพด้วย AI
│   ├── components/ui/        ← shadcn/ui components
│   └── lib/                  ← utilities
├── public/
│   └── eye-logo.png          ← โลโก้แอป
├── package.json
├── tsconfig.json
└── next.config.ts
```

## ฟีเจอร์

- ✅ อัปโหลดภาพถ่ายจอประสาทตา (Drag & Drop)
- ✅ AI วิเคราะห์ความเสี่ยงเบาหวานขึ้นตา
- ✅ แสดงระดับความเสี่ยง + Confidence + ICDR Grade
- ✅ คำแนะนำและความเร่งด่วน
- ✅ UI ภาษาไทยทั้งหมด + Animation สวยงาม

## เทคโนโลยี

- Next.js 16 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Framer Motion (animation)
- z-ai-web-dev-sdk (AI Vision Model)

## ⚠️ หมายเหตุ

เครื่องมือนี้เป็นการคัดกรองเบื้องต้นเท่านั้น
ไม่สามารถใช้แทนการวินิจฉัยของแพทย์ได้
