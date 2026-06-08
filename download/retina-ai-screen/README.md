# 🏥 RetinaAI Screen — คัดกรองเบาหวานขึ้นตาด้วย AI

## วิธีติดตั้งและรันบน Localhost

### 1. สิ่งที่ต้องเตรียม
- **Node.js** เวอร์ชัน 18+ (แนะนำ 20+)
- **OpenAI API Key** (สมัครได้ที่ https://platform.openai.com)

### 2. ติดตั้ง
```bash
cd retina-ai-screen
npm install
```

### 3. ตั้งค่า Environment
```bash
# คัดลอกไฟล์ตัวอย่าง
cp .env.example .env

# แก้ไข .env ใส่ OpenAI API Key ของคุณ
# OPENAI_API_KEY=sk-your-actual-key-here
```

### 4. ตั้งค่า Database
```bash
# สร้างตารางใน SQLite
npx prisma db push
```

### 5. รัน Development Server
```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ **http://localhost:3000**

---

## ใช้ AI Provider อื่นแทน OpenAI ได้ไหม?

ได้! ในไฟล์ `.env` ให้ตั้งค่า:

```bash
# Google Gemini (ผ่าน OpenAI-compatible endpoint)
OPENAI_API_KEY=your-gemini-key
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-2.0-flash

# หรือ Local LLM (เช่น Ollama, LM Studio)
OPENAI_API_KEY=not-needed
OPENAI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama3
```

---

## โครงสร้าง Database (Prisma)

ตาราง `Analysis` เก็บประวัติการตรวจทั้งหมด:

| ฟิลด์ | ประเภท | รายละเอียด |
|-------|--------|-----------|
| id | String (cuid) | รหัสอ้างอิง |
| createdAt | DateTime | วันเวลาที่ตรวจ |
| patientName | String? | ชื่อผู้ป่วย (optional) |
| patientId | String? | รหัสผู้ป่วย (optional) |
| imageName | String | ชื่อไฟล์ภาพ |
| riskLevel | String | ระดับความเสี่ยง |
| confidence | Int | ค่าความมั่นใจ (0-100) |
| grade | String | ระดับโรค ICDR |
| urgency | String | ความเร่งด่วน |
| description | String | คำอธิบายผล |
| findings | String | สิ่งที่พบ (JSON array) |
| recommendations | String | คำแนะนำ (JSON array) |

ดูข้อมูลใน DB ผ่าน Prisma Studio:
```bash
npx prisma studio
```

---

## เปลี่ยนเป็น MySQL/PostgreSQL

1. แก้ `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mysql"  // หรือ "postgresql"
  url      = env("DATABASE_URL")
}
```

2. แก้ `.env`:
```
DATABASE_URL="mysql://user:password@localhost:3306/retina_ai"
# หรือ
DATABASE_URL="postgresql://user:password@localhost:5432/retina_ai"
```

3. รัน migration:
```bash
npx prisma db push
```

---

## ⚠️ หมายเหตุ

เครื่องมือนี้เป็นการคัดกรองเบื้องต้นเท่านั้น
ไม่สามารถใช้แทนการวินิจฉัยของแพทย์ได้
