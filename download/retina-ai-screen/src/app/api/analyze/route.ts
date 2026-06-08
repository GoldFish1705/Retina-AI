import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const patientName = (formData.get('patientName') as string) || null;
    const patientId = (formData.get('patientId') as string) || null;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'กรุณาอัปโหลดภาพถ่ายจอประสาทตา' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'รองรับเฉพาะไฟล์ภาพประเภท JPEG, PNG และ WebP' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ขนาดไฟล์ต้องไม่เกิน 10 MB' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const imageUrl = `data:${imageFile.type};base64,${base64}`;

    // Initialize OpenAI client (รองรับ OpenAI-compatible APIs เช่น Gemini, Local LLM)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });

    const model = process.env.AI_MODEL || 'gpt-4o';

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `คุณเป็นจักษุแพทย์ผู้เชี่ยวชาญด้านการวินิจฉัยโรคเบาหวานขึ้นตา (Diabetic Retinopathy) จากภาพถ่ายจอประสาทตา (Fundus Photography) คุณต้องวิเคราะห์ภาพถ่ายจอประสาทตาที่ได้รับและให้ผลการวิเคราะห์ในรูปแบบ JSON เท่านั้น ตามโครงสร้างดังนี้:

{
  "riskLevel": "ไม่พบความเสี่ยง" | "ความเสี่ยงต่ำ" | "ความเสี่ยงปานกลาง" | "ความเสี่ยงสูง",
  "confidence": number (0-100),
  "grade": "No DR" | "Mild NPDR" | "Moderate NPDR" | "Severe NPDR" | "Proliferative DR",
  "findings": ["ข้อความอธิบายสิ่งที่พบแต่ละอย่าง"],
  "description": "คำอธิบายผลการวิเคราะห์โดยรวม",
  "recommendations": ["ข้อแนะนำแต่ละข้อ"],
  "urgency": "ไม่เร่งด่วน" | "ควรตรวจติดตาม" | "ควรพบแพทย์เร็ว" | "เร่งด่วนมาก"
}

หมายเหตุสำคัญ:
- วิเคราะห์เฉพาะจากลักษณะที่เห็นในภาพเท่านั้น
- ระบุความมั่นใจ (confidence) ตามความชัดเจนของลักษณะที่พบ
- หากภาพไม่ใช่ภาพถ่ายจอประสาทตา ให้ระบุ riskLevel เป็น "ไม่พบความเสี่ยง" และอธิบายใน description ว่าไม่ใช่ภาพถ่ายจอประสาทตา
- ให้คำแนะนำที่เป็นประโยชน์และเหมาะสมกับระดับความเสี่ยงที่พบ
- ตอบเป็นภาษาไทยทุกข้อความ

เกณฑ์การจัดระดับความเสี่ยง:
- ไม่พบความเสี่ยง: ไม่พบลักษณะผิดปกติใดๆ
- ความเสี่ยงต่ำ: พบ Microaneurysms เพียงเล็กน้อย (Mild NPDR)
- ความเสี่ยงปานกลาง: พบ Microaneurysms, Hemorrhages, Hard Exudates หรือ Cotton Wool Spots (Moderate NPDR)
- ความเสี่ยงสูง: พบลักษณะรุนแรงหรือ Proliferative DR

คุณต้องตอบเป็น JSON เท่านั้น ไม่มีข้อความอื่นใดนอกจาก JSON`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
            {
              type: 'text',
              text: 'กรุณาวิเคราะห์ภาพถ่ายจอประสาทตานี้ และให้ผลการประเมินความเสี่ยงโรคเบาหวานขึ้นตา พร้อมคำแนะนำ',
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse JSON from response
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const jsonObjMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonObjMatch) {
      return NextResponse.json(
        { error: 'ไม่สามารถวิเคราะห์ภาพได้ กรุณาลองใหม่อีกครั้ง' },
        { status: 500 }
      );
    }

    const analysisResult = JSON.parse(jsonObjMatch[0]);

    // บันทึกลง Database
    try {
      await db.analysis.create({
        data: {
          patientName,
          patientId,
          imageName: imageFile.name,
          imageSize: imageFile.size,
          riskLevel: analysisResult.riskLevel || 'ไม่พบความเสี่ยง',
          confidence: analysisResult.confidence || 0,
          grade: analysisResult.grade || 'No DR',
          urgency: analysisResult.urgency || 'ไม่เร่งด่วน',
          description: analysisResult.description || '',
          findings: JSON.stringify(analysisResult.findings || []),
          recommendations: JSON.stringify(analysisResult.recommendations || []),
          rawResponse: responseText,
        },
      });
    } catch (dbError) {
      // ถ้าบันทึก DB ไม่สำเร็จ ก็ยังส่งผลลัพธ์กลับ (ไม่ block ผู้ใช้)
      console.error('DB save error:', dbError);
    }

    return NextResponse.json({
      success: true,
      result: analysisResult,
    });

  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการวิเคราะห์';
    return NextResponse.json(
      { error: `เกิดข้อผิดพลาด: ${message}` },
      { status: 500 }
    );
  }
}
