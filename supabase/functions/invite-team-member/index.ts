import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) throw new Error("Not authenticated");

    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();
    if (!callerRole) throw new Error("Not admin");

    const { email, full_name, phone, job_title, team_role, password } = await req.json();
    if (!email || !full_name) throw new Error("Email and name required");

    // Create auth user
    const tempPassword = password || Math.random().toString(36).slice(-12) + "A1!";
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name },
    });
    if (createErr) throw createErr;

    const userId = newUser.user.id;

    // Assign 'team' role
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "team" });

    // Create team_members record
    await supabaseAdmin.from("team_members").insert({
      user_id: userId,
      full_name,
      email,
      phone: phone || null,
      job_title: job_title || "Udlejningsrådgiver",
      team_role: team_role || "udlejningsraadgiver",
      invited_by: caller.id,
    });

    // Update profile
    await supabaseAdmin.from("profiles").update({
      full_name,
      phone: phone || null,
    }).eq("id", userId);

    return new Response(JSON.stringify({ success: true, user_id: userId, temp_password: tempPassword }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
