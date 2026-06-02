'use client'
import { useEffect, useState } from 'react'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><p>Loading...</p></div>
  return <div>QA Forge Home</div>
}