import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByUsername, validateInviteCode } from '@/lib/remnawave'

export async function POST(req: NextRequest) {
  try {
    const { username, inviteCode } = await req.json()

    // Validate input
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Укажите никнейм' }, { status: 400 })
    }

    if (!inviteCode || typeof inviteCode !== 'string') {
      return NextResponse.json({ error: 'Укажите инвайт-код' }, { status: 400 })
    }

    // Validate username format
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (cleanUsername.length < 2 || cleanUsername.length > 32) {
      return NextResponse.json({ error: 'Никнейм: 2-32 символа, латиница, цифры, _ и -' }, { status: 400 })
    }

    // Validate invite code
    if (!validateInviteCode(inviteCode)) {
      return NextResponse.json({ error: 'Неверный инвайт-код' }, { status: 403 })
    }

    // Check if user already exists
    const existing = await getUserByUsername(cleanUsername)
    if (existing) {
      const subUrl = process.env.NEXT_PUBLIC_SUB_URL || 'https://sub.dimasikvpn.ru:8844'
      return NextResponse.json({
        success: true,
        user: {
          username: existing.username,
          subscriptionUrl: `${subUrl}/${existing.shortUuid}`,
          expireAt: existing.expireAt,
          status: existing.status,
        },
        message: 'Пользователь уже существует — вот ваша ссылка',
      })
    }

    // Create user
    const expireDays = parseInt(process.env.DEFAULT_EXPIRE_DAYS || '30', 10)
    const dataLimitGB = parseInt(process.env.DEFAULT_DATA_LIMIT_GB || '0', 10)
    const user = await createUser(cleanUsername, expireDays, dataLimitGB)

    const subUrl = process.env.NEXT_PUBLIC_SUB_URL || 'https://sub.dimasikvpn.ru:8844'

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        subscriptionUrl: `${subUrl}/${user.shortUuid}`,
        expireAt: user.expireAt,
        status: user.status,
      },
      message: 'Конфиг создан!',
    })
  } catch (error: unknown) {
    console.error('Registration error:', error)
    const message = error instanceof Error ? error.message : 'Что-то пошло не так'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
