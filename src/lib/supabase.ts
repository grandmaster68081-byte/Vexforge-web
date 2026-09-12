import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "https://rscuzqnfccqvltkdcdny.supabase.co";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58";

/**
 * The ONE Supabase client for the whole app.
 */
export const supabase = createClient(url, anonKey);
