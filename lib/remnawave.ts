const API_URL = process.env.REMNAWAVE_API_URL || 'http://remnawave:3000'
const API_TOKEN = process.env.REMNAWAVE_API_TOKEN || ''

interface RemnawaveUser {
  uuid: string
  username: string
  shortUuid: string
  subscriptionUrl: string
  status: string
  usedTrafficBytes: number
  trafficLimitBytes: number
  expireAt: string
}

interface CreateUserPayload {
  username: string
  trafficLimitBytes?: number
  expireAt?: string
}

async function remnawaveFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_TOKEN}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Remnawave API error ${res.status}: ${text}`)
  }

  return res.json()
}

export async function createUser(username: string, expireDays: number = 30, dataLimitGB: number = 0): Promise<RemnawaveUser> {
  const expireAt = new Date()
  expireAt.setDate(expireAt.getDate() + expireDays)

  const payload: CreateUserPayload = {
    username,
    expireAt: expireAt.toISOString(),
  }

  if (dataLimitGB > 0) {
    payload.trafficLimitBytes = dataLimitGB * 1024 * 1024 * 1024
  }

  const data = await remnawaveFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return data.response
}

export async function getUser(uuid: string): Promise<RemnawaveUser> {
  const data = await remnawaveFetch(`/api/users/${uuid}`)
  return data.response
}

export async function getUserByUsername(username: string): Promise<RemnawaveUser | null> {
  try {
    const data = await remnawaveFetch(`/api/users/by-username/${username}`)
    return data.response
  } catch {
    return null
  }
}

export function validateInviteCode(code: string): boolean {
  const codes = (process.env.INVITE_CODES || '').split(',').map(c => c.trim().toLowerCase())
  return codes.includes(code.trim().toLowerCase())
}
