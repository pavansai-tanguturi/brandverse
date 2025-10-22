import { supabaseAdmin } from "../config/supabaseClient.js";

export async function createOrder(payload) {
  return await supabaseAdmin
    .from("orders")
    .insert(payload)
    .select("*")
    .single();
}
