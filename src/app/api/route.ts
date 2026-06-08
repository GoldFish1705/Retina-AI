import { NextRequest, NextResponse } from 'next/server';

const FLASK_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'กรุณาอัปโหลดภาพถ่ายจอประสาทตา' },
        { status: 400 }
      );
    }

    // ส่งต่อไปยัง Flask service
    const flaskForm = new FormData();
    flaskForm.append('image', imageFile);

    const flaskRes = await fetch(`${FLASK_URL}/analyze`, {
      method: 'POST',
      body: flaskForm,
    });

    const data = await flaskRes.json();

    if (!flaskRes.ok) {
      return NextResponse.json(
        { error: data.error || 'เกิดข้อผิดพลาดในการวิเคราะห์' },
        { status: flaskRes.status }
      );
    }

    return NextResponse.json(data);

  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการวิเคราะห์';
    return NextResponse.json(
      { error: `เกิดข้อผิดพลาด: ${message}` },
      { status: 500 }
    );
  }
}
