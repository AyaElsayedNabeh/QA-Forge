'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

interface TeamMember {
  id: string
  user_id: string
  email: string
  role: string
  project_id: string
}

export function TeamManager() {
  const projects = useStore(s => s.projects)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [email, setEmail] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterProjectId, setFilterProjectId] = useState('all')

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    const { data } = await supabase.from('team_members').select('*')
    if (data) setMembers(data)
  }

  const addMember = async () => {
    if (!email.trim() || !selectedProjectId) return
    setLoading(true)
    setError('')
    setSuccess('')

    const { data: user } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email.trim())
      .single()

    if (!user) {
      setError('User not found. Make sure they have an account first.')
      setLoading(false)
      return
    }

    const { error } = await supabase
  .from('team_members')
  .insert({
    project_id: selectedProjectId,
    user_id: user.id,
    email: user.email,
    role: 'tester',
  })

    if (error) {
  setError(error.message)
} else {
      // Send invitation email
      const project = projects.find(p => p.id === selectedProjectId)
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          projectName: project?.name ?? 'QA Forge Project',
          inviterEmail: currentUser?.email ?? 'A team member',
        }),
      })

      setSuccess(`✅ ${email} added and invitation sent!`)
      setEmail('')
      setSelectedProjectId('')
      fetchMembers()
    }
    setLoading(false)
  }

  const removeMember = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from the team?`)) return
    await supabase.from('team_members').delete().eq('id', id)
    fetchMembers()
  }

  const filteredMembers = filterProjectId === 'all'
    ? members
    : members.filter(m => m.project_id === filterProjectId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">👥 Team Members</h2>
        <span className="text-xs text-slate-400">{members.length} members</span>
      </div>

      {/* Add member */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <label className="block text-xs font-semibold text-slate-500">
          Add team member
        </label>

        {/* Project selector */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Select Project *
          </label>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
          >
            <option value="">-- Select a project --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Email input */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Email *
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
              disabled={loading || !email.trim() || !selectedProjectId}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '...' : 'Add'}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-emerald-600">{success}</p>}
      </div>

      {/* Filter by project */}
      {members.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterProjectId('all')}
            className={cn(
              'px-3 py-1 text-xs rounded-lg transition-colors',
              filterProjectId === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            All Projects
          </button>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setFilterProjectId(p.id)}
              className={cn(
                'px-3 py-1 text-xs rounded-lg transition-colors',
                filterProjectId === p.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              📁 {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Members list */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p className="text-2xl mb-2">👥</p>
          <p className="text-sm">No team members yet</p>
          <p className="text-xs mt-1">Add a tester by their email</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map(member => {
            const project = projects.find(p => p.id === member.project_id)
            return (
              <div key={member.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                  {member.email[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{member.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400 capitalize">{member.role}</p>
                    {project && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                        📁 {project.name}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeMember(member.id, member.email)}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}