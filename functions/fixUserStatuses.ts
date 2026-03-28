import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || '',
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { email1, email2, couple_profile_id } = await req.json();

    // Get both users
    const { data: users1, error: users1Error } = await supabase
      .from('User')
      .select('*')
      .eq('email', email1);

    if (users1Error) {
      throw users1Error;
    }

    const { data: users2, error: users2Error } = await supabase
      .from('User')
      .select('*')
      .eq('email', email2);

    if (users2Error) {
      throw users2Error;
    }

    if (!users1 || users1.length === 0 || !users2 || users2.length === 0) {
      return Response.json({ error: 'One or both users not found' }, { status: 404 });
    }

    const user1 = users1[0];
    const user2 = users2[0];

    // Update both users to date_locked
    const { error: updateUser1Error } = await supabase
      .from('User')
      .update({
        relationship_status: 'date_locked',
        partner_email: email2,
        couple_profile_id: couple_profile_id
      })
      .eq('id', user1.id);

    if (updateUser1Error) {
      throw updateUser1Error;
    }

    const { error: updateUser2Error } = await supabase
      .from('User')
      .update({
        relationship_status: 'date_locked',
        partner_email: email1,
        couple_profile_id: couple_profile_id
      })
      .eq('id', user2.id);

    if (updateUser2Error) {
      throw updateUser2Error;
    }

    return Response.json({
      success: true,
      message: 'Both users updated to date_locked status',
      users: [
        { email: email1, status: 'date_locked', partner: email2 },
        { email: email2, status: 'date_locked', partner: email1 }
      ]
    });
  } catch (error) {
    console.error('Fix user statuses error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
