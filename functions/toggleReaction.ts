import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentId, reactionType } = await req.json();

    if (reactionType !== 'heart') {
      return Response.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    // Check if user already reacted
    const existing = await base44.entities.ContentReaction.filter({
      content_id: contentId,
      user_email: user.email
    });

    if (existing.length > 0) {
      const existingReaction = existing[0];
      
      // If same reaction, remove it (toggle off)
      if (existingReaction.reaction_type === reactionType) {
        await base44.entities.ContentReaction.delete(existingReaction.id);
        return Response.json({ success: true, action: 'removed' });
      }
      
      // If different reaction, update it
      await base44.entities.ContentReaction.update(existingReaction.id, {
        reaction_type: reactionType
      });
      return Response.json({ success: true, action: 'updated' });
    }

    // Create new reaction
    await base44.entities.ContentReaction.create({
      content_id: contentId,
      user_email: user.email,
      reaction_type: reactionType
    });

    return Response.json({ success: true, action: 'added' });

  } catch (error) {
    console.error('Reaction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});