import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xkwtbvofggsldjaojido.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrd3Ridm9mZ2dzbGRqYW9qaWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MjAyNjMsImV4cCI6MjA1OTI5NjI2M30.fFeADg089nDtmuWZIFupX8UCfBM2z_DHhm-9OkuIea0'

export const supabase = createClient(supabaseUrl, supabaseKey)
