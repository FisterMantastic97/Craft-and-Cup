import { supabase } from '../lib/supabase'

export default function SignIn() {
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    })
  }

  const signInWithDiscord = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0e0e0e', color: '#ede5d8', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 42, color: '#d4b05a', marginBottom: 8 }}>Craft & Cup</h1>
      <p style={{ color: '#888', marginBottom: 48, fontSize: 14 }}>Sign in to access your coffee journal</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
        <button onClick={signInWithGoogle} style={{ padding: '14px 20px', background: '#fff', color: '#000', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <img src="https://www.google.com/favicon.ico" width={18} height={18} />
          Continue with Google
        </button>
        <button onClick={signInWithDiscord} style={{ padding: '14px 20px', background: '#5865F2', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          Continue with Discord
        </button>
      </div>
    </div>
  )
}