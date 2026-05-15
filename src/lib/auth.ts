const ADMIN_EMAIL = 'admin@gmail.com'
const ADMIN_PASSWORD = 'password'
const TOKEN_KEY = 'auth_token'

export function login(email: string, password: string): boolean {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    localStorage.setItem(TOKEN_KEY, btoa(`${email}:${Date.now()}`))
    return true
  }
  return false
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(TOKEN_KEY)
}
