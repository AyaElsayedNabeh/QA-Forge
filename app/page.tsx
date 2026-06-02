'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AppPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/app')  }, [router])
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Loading QA Forge...</p>
    </div>
  )
}