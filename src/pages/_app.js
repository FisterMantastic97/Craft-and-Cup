import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  const [session, setSession] = useState(undefined)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session && router.pathname !== '/signin') {
        router.push('/signin')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session && router.pathname !== '/signin') {
        router.push('/signin')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  return <Component {...pageProps} />
}