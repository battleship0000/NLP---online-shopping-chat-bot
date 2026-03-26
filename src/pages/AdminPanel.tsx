import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Program, Profile } from '../types'

export default function AdminPanel() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [counsellors, setCounsellors] = useState<Profile[]>([])
  const [tab, setTab] = useState<'programs' | 'counsellors'>('programs')

  // Program form
  const [newProgram, setNewProgram] = useState({ name: '', description: '' })
  const [programError, setProgramError] = useState<string | null>(null)
  const [programSuccess, setProgramSuccess] = useState(false)

  // Counsellor form - uses edge function (NO supabase.auth.admin from client)
  const [newCounsellor, setNewCounsellor] = useState({ full_name: '', email: '', password: '' })
  const [counsellorError, setCounsellorError] = useState<string | null>(null)
  const [counsellorSuccess, setCounsellorSuccess] = useState(false)
  const [creatingCounsellor, setCreatingCounsellor] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [pRes, cRes] = await Promise.all([
      supabase.from('programs').select('*').order('name'),
      supabase.from('profiles').select('*').eq('role', 'counsellor').order('full_name'),
    ])
    if (pRes.data) setPrograms(pRes.data)
    if (cRes.data) setCounsellors(cRes.data)
  }

  async function addProgram(e: React.FormEvent) {
    e.preventDefault()
    setProgramError(null)
    const { error } = await supabase.from('programs').insert(newProgram)
    if (error) { setProgramError(error.message); return }
    setProgramSuccess(true)
    setNewProgram({ name: '', description: '' })
    loadData()
    setTimeout(() => setProgramSuccess(false), 3000)
  }

  async function createCounsellor(e: React.FormEvent) {
    e.preventDefault()
    setCounsellorError(null)
    setCreatingCounsellor(true)
    try {
      // Secure: uses edge function with service role key, NOT supabase.auth.admin from client
      const { error } = await supabase.functions.invoke('create-counsellor', {
        body: newCounsellor,
      })
      if (error) throw new Error(error.message)
      setCounsellorSuccess(true)
      setNewCounsellor({ full_name: '', email: '', password: '' })
      loadData()
      setTimeout(() => setCounsellorSuccess(false), 3000)
    } catch (err) {
      setCounsellorError(err instanceof Error ? err.message : 'Failed to create counsellor')
    } finally {
      setCreatingCounsellor(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

      <div className="flex border-b mb-6">
        {(['programs', 'counsellors'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Add Program</h2>
            {programSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded mb-3 text-sm">Program added successfully.</div>}
            {programError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm">{programError}</div>}
            <form onSubmit={addProgram} className="space-y-3 bg-white p-6 rounded-lg shadow">
              <input
                placeholder="Program name *"
                value={newProgram.name}
                onChange={e => setNewProgram(p => ({ ...p, name: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <textarea
                placeholder="Description (optional)"
                value={newProgram.description}
                onChange={e => setNewProgram(p => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 text-sm font-medium">
                Add Program
              </button>
            </form>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">Programs ({programs.length})</h2>
            <div className="space-y-2">
              {programs.map(p => (
                <div key={p.id} className="bg-white rounded-lg shadow-sm border px-4 py-3">
                  <p className="font-medium text-gray-900">{p.name}</p>
                  {p.description && <p className="text-sm text-gray-500">{p.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'counsellors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Add Counsellor</h2>
            {counsellorSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded mb-3 text-sm">Counsellor created successfully.</div>}
            {counsellorError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm">{counsellorError}</div>}
            <form onSubmit={createCounsellor} className="space-y-3 bg-white p-6 rounded-lg shadow">
              <input
                placeholder="Full name *"
                value={newCounsellor.full_name}
                onChange={e => setNewCounsellor(c => ({ ...c, full_name: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="email"
                placeholder="Email *"
                value={newCounsellor.email}
                onChange={e => setNewCounsellor(c => ({ ...c, email: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="password"
                placeholder="Password *"
                value={newCounsellor.password}
                onChange={e => setNewCounsellor(c => ({ ...c, password: e.target.value }))}
                required
                minLength={8}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="submit"
                disabled={creatingCounsellor}
                className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                {creatingCounsellor ? 'Creating…' : 'Create Counsellor'}
              </button>
            </form>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">Counsellors ({counsellors.length})</h2>
            <div className="space-y-2">
              {counsellors.map(c => (
                <div key={c.id} className="bg-white rounded-lg shadow-sm border px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{c.full_name}</p>
                    <p className="text-sm text-gray-500">{c.email}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
