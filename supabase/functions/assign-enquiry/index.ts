import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { enquiry_id } = await req.json()

  // Get enquiry details
  const { data: enquiry, error: enqErr } = await supabase
    .from('enquiries')
    .select('id, program_id, status')
    .eq('id', enquiry_id)
    .single()

  if (enqErr || !enquiry) {
    return new Response(JSON.stringify({ error: 'Enquiry not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (enquiry.status !== 'queued') {
    return new Response(JSON.stringify({ message: 'Already assigned' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Find online counsellors for this program, order by active assignment count (ascending)
  const { data: counsellors } = await supabase
    .from('counsellor_programs')
    .select('counsellor_id, profiles!inner(is_online)')
    .eq('program_id', enquiry.program_id)
    .eq('profiles.is_online', true)

  if (!counsellors || counsellors.length === 0) {
    // No online counsellors - stays queued
    return new Response(JSON.stringify({ message: 'No online counsellors, staying queued' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Count active assignments per counsellor
  const counts = await Promise.all(
    counsellors.map(async (cp) => {
      const { count } = await supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_counsellor_id', cp.counsellor_id)
        .in('status', ['assigned', 'in_progress'])
      return { counsellor_id: cp.counsellor_id, count: count ?? 0 }
    })
  )

  // Pick counsellor with least load
  counts.sort((a, b) => a.count - b.count)
  const best = counts[0]

  await supabase
    .from('enquiries')
    .update({
      assigned_counsellor_id: best.counsellor_id,
      status: 'assigned',
      updated_at: new Date().toISOString(),
    })
    .eq('id', enquiry_id)

  return new Response(JSON.stringify({ assigned_to: best.counsellor_id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
