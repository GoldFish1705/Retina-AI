import { NextRequest, NextResponse } from 'next/server'

const FLASK_URL = process.env.FLASK_API_URL || 'https://dr-api-eamg.onrender.com'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const flaskRes = await fetch(`${FLASK_URL}/gradcam`, {
      method: 'POST',
      body: formData,
    })
    const data = await flaskRes.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch heatmap' }, { status: 500 })
  }
}