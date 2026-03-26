import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { Enquiry, EnquiryStatus } from '../types'

const STATUS_LABELS: Record<EnquiryStatus, string> = {
  queued: 'Queued',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

const STATUS_COLORS: Record<EnquiryStatus, string> = {
  queued: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

export default function CounsellorDashboard() {
  const { profile } = useAuth()
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadEnquiries()

    const channel = supabase
      .channel('counsellor-enquiries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enquiries', filter: `assigned_counsellor_id=eq.${profile.id}` },
        () => loadEnquiries()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadEnquiries() {
    if (!profile) return
    const { data } = await supabase
      .from('enquiries')
      .select('*, program:programs(id, name, description, created_at)')
      .eq('assigned_counsellor_id', profile.id)
      .order('created_at', { ascending: false })
    setEnquiries((data as Enquiry[]) ?? [])
    setLoading(false)
  }

  async function updateStatus(enquiryId: string, status: EnquiryStatus) {
    await supabase
      .from('enquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', enquiryId)
    setEnquiries(e => e.map(q => q.id === enquiryId ? { ...q, status } : q))
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading your enquiries…</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Counsellor Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome, {profile?.full_name}.
            <span className="ml-2 inline-flex items-center gap-1 text-green-600 text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block" /> Online
            </span>
          </p>
        </div>
        <span className="text-sm text-gray-400">{enquiries.length} enquiry(ies)</span>
      </div>

      {enquiries.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-lg shadow">
          <p className="text-lg">No enquiries assigned yet.</p>
          <p className="text-sm mt-1">Queued enquiries will be assigned to you automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enquiries.map(enq => (
            <div key={enq.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{enq.student_name}</h3>
                  <p className="text-sm text-gray-500">{enq.student_email} · {enq.student_phone}</p>
                  {enq.program && (
                    <p className="text-sm text-indigo-600 mt-1">{enq.program.name}</p>
                  )}
                  {enq.message && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{enq.message}</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[enq.status]}`}>
                  {STATUS_LABELS[enq.status]}
                </span>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                {(['in_progress', 'resolved', 'closed'] as EnquiryStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(enq.id, s)}
                    disabled={enq.status === s}
                    className="text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Mark {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Submitted: {new Date(enq.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
