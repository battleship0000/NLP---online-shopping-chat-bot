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

  const { counsellor_id } = await req.json()

  // Get programs this counsellor handles
  const { data: cpRows } = await supabase
    .from('counsellor_programs')
    .select('program_id')
    .eq('counsellor_id', counsellor_id)

  if (!cpRows || cpRows.length === 0) {
    return new Response(JSON.stringify({ message: 'No programs assigned' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const programIds = cpRows.map(r => r.program_id)

  // Get queued enquiries for those programs, oldest first
  const { data: queued } = await supabase
    .from('enquiries')
    .select('id')
    .eq('status', 'queued')
    .in('program_id', programIds)
    .order('created_at', { ascending: true })

  if (!queued || queued.length === 0) {
    return new Response(JSON.stringify({ message: 'No queued enquiries' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Assign them to this counsellor
  const ids = queued.map(e => e.id)
  await supabase
    .from('enquiries')
    .update({
      assigned_counsellor_id: counsellor_id,
      status: 'assigned',
      updated_at: new Date().toISOString(),
    })
    .in('id', ids)

  return new Response(JSON.stringify({ assigned: ids.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
