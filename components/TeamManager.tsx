'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useActiveSuite } from '@/store'
import { cn } from '@/lib/utils'

interface TeamMember {
  id: string
  user_id: string
  email: string
  role: string
}

export function TeamManager() {
  const suite = useActiveSuite()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!suite) return
    fetchMembers()
  }, [suite])

  const fetchMembers = async () => {
    if (!suite) return
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('suite_id', suite.id)
    if (data) setMembers(data)
  }

  const addMember = async () => {
    if (!email.trim() || !suite) return
    setLoading(true)
    setError('')
    setSuccess('')

    // Find user by email
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email.trim())
      .single()

    if (!users) {
      setError('User not found. Make sure they have an account first.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('team_members')
      .insert({
        suite_id: suite.id,
        user_id: users.id,
        email: users.email,
        role: 'tester',
      })

    if (error) {
      setError('User already added or error occurred.')
    } else {
      setSuccess(`${email} added successfully!`)
      setEmail('')
      fetchMembers()
    }
    setLoading(false)
  }

  const removeMember = async (id: string) => {
    await supabase.from('team_members').delete().eq('id', id)
    fetchMembers()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">👥 Team Members</h2>
        <span className="text-xs text-slate-400">{members.length} members</span>
      </div>

      {/* Add member */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <label className="block text-xs font-semibold text-slate-500 mb-2">
          Add team member by email
        </label>
        <div className="flex gap-2">
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMember()}
            placeholder="tester@example.com"
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
          />
          <button
            onClick={addMember}
            disabled={loading || !email.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-600">{error}</p>
        )}
        {success && (
          <p className="mt-2 text-xs text-emerald-600">{success}</p>
        )}
      </div>

      {/* Members list */}
      {members.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p className="text-2xl mb-2">👥</p>
          <p className="text-sm">No team members yet</p>
          <p className="text-xs mt-1">Add a tester by their email</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                {member.email[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{member.email}</p>
                <p className="text-xs text-slate-400 capitalize">{member.role}</p>
              </div>
              <button
                onClick={() => removeMember(member.id)}
                className="text-slate-300 hover:text-red-500 transition-colors p-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}