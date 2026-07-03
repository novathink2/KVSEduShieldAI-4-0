// Edge Function: onspace-ai-chat — proxy to OnSpace AI for all AI features
// Powered by OnSpace.AI

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, model } = await req.json()

    const onspaceAiUrl = Deno.env.get('ONSPACE_AI_BASE_URL') ?? 'https://ai.onspace.ai/v1'
    const onspaceAiKey = Deno.env.get('ONSPACE_AI_API_KEY') ?? ''

    const response = await fetch(`${onspaceAiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${onspaceAiKey}`,
      },
      body: JSON.stringify({
        model: model ?? 'gpt-4o-mini',
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return new Response(
        JSON.stringify({ error: `OnSpace AI: ${err}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('onspace-ai-chat error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
