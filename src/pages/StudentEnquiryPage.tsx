import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Program } from '../types'

interface FormState {
  student_name: string
  student_email: string
  student_phone: string
  program_id: string
  message: string
}

const initialForm: FormState = {
  student_name: '',
  student_email: '',
  student_phone: '',
  program_id: '',
  message: '',
}

export default function StudentEnquiryPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [form, setForm] = useState<FormState>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('programs').select('*').order('name').then(({ data }) => {
      if (data) setPrograms(data)
    })
  }, [])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const { data: enquiry, error: insertErr } = await supabase
        .from('enquiries')
        .insert({ ...form, status: 'queued' })
        .select()
        .single()

      if (insertErr) throw insertErr

      // Trigger assignment edge function
      await supabase.functions.invoke('assign-enquiry', {
        body: { enquiry_id: enquiry.id },
      })

      setSubmitted(true)
      setForm(initialForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Enquiry Submitted!</h2>
        <p className="text-gray-600 mb-6">
          We've received your enquiry. A counsellor will be in touch with you shortly.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
        >
          Submit Another Enquiry
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Admission Enquiry</h1>
      <p className="text-gray-500 mb-8">
        Fill in the form below and a counsellor will be assigned to assist you.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            name="student_name"
            value={form.student_name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            name="student_email"
            value={form.student_email}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <input
            type="tel"
            name="student_phone"
            value={form.student_phone}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program of Interest *</label>
          <select
            name="program_id"
            value={form.program_id}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">-- Select a Program --</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50 font-medium"
        >
          {submitting ? 'Submitting…' : 'Submit Enquiry'}
        </button>
      </form>
    </div>
  )
}
