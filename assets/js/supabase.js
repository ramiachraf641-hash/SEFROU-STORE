// =====================================================
//                 SUPABASE CLIENT
// =====================================================

const SUPABASE_URL =
    "https://qjyqwidjaeekiseaalfb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
   "sb_publishable_b0gW3g_VGijfp9EZzMbicQ_2uGKjKlr";
 

// =====================================================
//              CREATE SUPABASE CLIENT
// =====================================================

window.supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );