export type UserRole = 'student' | 'counsellor' | 'admin'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  email: string
  is_online?: boolean
  created_at: string
}

export interface Program {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface CounsellorProgram {
  counsellor_id: string
  program_id: string
}

export interface Enquiry {
  id: string
  student_name: string
  student_email: string
  student_phone: string
  program_id: string
  status: EnquiryStatus
  assigned_counsellor_id: string | null
  message: string | null
  created_at: string
  updated_at: string
  program?: Program
  assigned_counsellor?: Profile
}

export type EnquiryStatus = 'queued' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
