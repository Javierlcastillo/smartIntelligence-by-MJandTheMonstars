import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jdtdemsbgjryevrerbhi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdGRlbXNiZ2pyeWV2cmVyYmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDI4NDksImV4cCI6MjA3NzAxODg0OX0.lpa8N4b5KLIr0pux0_qd-iYt_kuRM7Rj91t9LDCORpI'

export const supabase = createClient(supabaseUrl, supabaseKey)
