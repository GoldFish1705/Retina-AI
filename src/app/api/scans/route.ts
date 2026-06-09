import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { grade, gradeName, riskLevel, confidence, findings, recommendations, description, urgency } = body

    const scan = await db.scan.create({
      data: {
        userId: session.user.id,
        grade,
        gradeName,
        riskLevel,
        confidence,
        findings,
        recommendations,
        description,
        urgency,
      },
    })

    return NextResponse.json({ success: true, scan })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save scan' }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const scans = await db.scan.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, scans })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch scans' }, { status: 500 })
  }
}
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await db.scan.deleteMany({ where: { userId: session.user.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete scans' }, { status: 500 })
  }
}