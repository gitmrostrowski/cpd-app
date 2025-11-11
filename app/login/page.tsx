'use client'

import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabaseBrowser'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createBrowserSupabase()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault()
    setPending(true); setMsg(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setPending(false)
    if (error) setMsg(error.message)
    else router.push('/')
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault()
    setPending(true); setMsg(null)
    const { error } = await supabase.auth.signUp({ email, password })
    setPending(false)
    if (error) setMsg(error.message)
    else setMsg('Konto utworzone. Jeśli wymagane – potwierdź e-mail i zaloguj się.')
  }

  async function magicLink(e: React.FormEvent) {
    e.preventDefault()
    setPending(true); setMsg(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    setPending(false)
    if (error) setMsg(error.message)
    else setMsg('Wysłaliśmy link logowania na e-mail.')
  }

  return (
    <div className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Zaloguj się</h1>
      <form className="space-y-3" onSubmit={signInWithPassword}>
        <input
          className="w-full border rounded p-2"
          placeholder="e-mail"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border rounded p-2"
          placeholder="hasło"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="w-full border rounded p-2 bg-black text-white" disabled={pending}>
          {pending ? 'Loguję…' : 'Zaloguj (hasło)'}
        </button>
        <button className="w-full border rounded p-2" onClick={signUp}>
          Załóż konto
        </button>
        <button className="w-full border rounded p-2" onClick={magicLink}>
          Magic link na e-mail
        </button>
      </form>
      {msg && <p className="text-sm text-gray-700">{msg}</p>}
    </div>
  )
}
