import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ciypdlhffhkidezcpdsy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpeXBkbGhmZmhraWRlemNwZHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjY0MjUsImV4cCI6MjA3NzAwMjQyNX0.P8bQvJRqiJSP17ESL4xsGQ7F0ogXYWGcvZGTExMIamc'

export const supabase = createClient(supabaseUrl, supabaseKey)
