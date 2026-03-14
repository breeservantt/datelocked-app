import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { email1, email2, couple_profile_id } = await req.json();

    // Get both users
    const users1 = await base44.asServiceRole.entities.User.filter({ email: email1 });
    const users2 = await base44.asServiceRole.entities.User.filter({ email: email2 });

    if (users1.length === 0 || users2.length === 0) {
      return Response.json({ error: 'One or both users not found' }, { status: 404 });
    }

    const user1 = users1[0];
    const user2 = users2[0];

    // Update both users to date_locked
    await base44.asServiceRole.entities.User.update(user1.id, {
      relationship_status: 'date_locked',
      partner_email: email2,
      couple_profile_id: couple_profile_id
    });

    await base44.asServiceRole.entities.User.update(user2.id, {
      relationship_status: 'date_locked',
      partner_email: email1,
      couple_profile_id: couple_profile_id
    });

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