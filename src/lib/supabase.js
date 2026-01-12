import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hykuoiwrowbatfwnemry.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a3VvaXdyb3diYXRmd25lbXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjM4NDQsImV4cCI6MjA4MzI5OTg0NH0.bc2AjNKkQFrn7GSl7nGaW6x0cak7_iZ4qkXEzn0SJkE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
