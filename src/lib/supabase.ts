import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kyjwphsuafvddlwftlqv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5andwaHN1YWZ2ZGRsd2Z0bHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNDI0MzgsImV4cCI6MjA4NTgxODQzOH0.GwTC5q0KBxzEmcWFqVT5edlQJ1zfwxH6jdBjbOZ58SU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
