import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all events happening in the next hour that haven't had reminders sent
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    const events = await base44.asServiceRole.entities.CoupleGoal.filter({
      is_event: true,
      invitation_status: 'accepted',
      reminder_sent: false
    });

    const upcomingEvents = events.filter(event => {
      const eventTime = new Date(event.event_datetime);
      return eventTime >= now && eventTime <= oneHourFromNow;
    });

    let remindersSent = 0;

    for (const event of upcomingEvents) {
      try {
        const coupleProfile = await base44.asServiceRole.entities.CoupleProfile.filter({
          id: event.couple_profile_id
        });

        if (coupleProfile.length === 0) continue;

        const profile = coupleProfile[0];
        const partner1 = await base44.asServiceRole.entities.User.filter({ 
          email: profile.partner1_email 
        });
        const partner2 = await base44.asServiceRole.entities.User.filter({ 
          email: profile.partner2_email 
        });

        if (partner1.length === 0 || partner2.length === 0) continue;

        const eventTime = new Date(event.event_datetime);
        const timeString = eventTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        });

        const message = `🔔 Reminder: Your event "${event.title}" is starting in 1 hour at ${timeString}! ${event.event_location ? `Location: ${event.event_location}` : ''}`;

        // Send emails to both partners
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: partner1[0].email,
          subject: `Event Reminder: ${event.title}`,
          body: message
        });

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: partner2[0].email,
          subject: `Event Reminder: ${event.title}`,
          body: message
        });

        // Mark reminder as sent
        await base44.asServiceRole.entities.CoupleGoal.update(event.id, {
          reminder_sent: true
        });

        remindersSent++;
      } catch (error) {
        console.error(`Failed to send reminder for event ${event.id}:`, error);
      }
    }

    return Response.json({ 
      success: true,
      remindersSent,
      eventsChecked: upcomingEvents.length
    });
  } catch (error) {
    console.error('Event reminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});