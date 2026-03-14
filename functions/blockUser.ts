import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { blockedEmail } = await req.json();

    if (blockedEmail === user.email) {
      return Response.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    // Check if already blocked
    const existing = await base44.asServiceRole.entities.BlockRelation.filter({
      blocker_email: user.email,
      blocked_email: blockedEmail
    });

    if (existing.length > 0) {
      return Response.json({ error: 'User already blocked' }, { status: 400 });
    }

    await base44.asServiceRole.entities.BlockRelation.create({
      blocker_email: user.email,
      blocked_email: blockedEmail
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Block error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});