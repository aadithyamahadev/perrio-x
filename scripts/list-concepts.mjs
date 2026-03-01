import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rkpboggxuqhnjbzztmoq.supabase.co'
const SUPABASE_KEY = 'sb_publishable_nqJWyk2AE6Wt--1b19828g_ObG52Ytn'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const { data, error } = await supabase.from('concepts').select('subject, name').order('subject').order('name')
if (error) {
  console.error(error)
} else {
  console.log("Concepts in DB:")
  data.forEach(c => console.log(`- [${c.subject}] ${c.name}`))
}
