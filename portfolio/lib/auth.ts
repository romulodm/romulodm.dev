import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export interface SessionData {
  isAdmin: boolean
}

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'portfolio-blog-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

export async function getSession() {
  return getIronSession<SessionData>(cookies(), sessionOptions)
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session.isAdmin === true
}

export async function requireAuth() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    throw new Error('Unauthorized')
  }
}

export async function validatePassword(password: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD not configured')
  }
  
  // Se a senha no env já estiver hasheada (começa com $2)
  if (adminPassword.startsWith('$2')) {
    return bcrypt.compare(password, adminPassword)
  }
  
  // Se for senha em texto plano (apenas para desenvolvimento)
  return password === adminPassword
}
