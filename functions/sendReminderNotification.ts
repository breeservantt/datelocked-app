import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    // Get all accepted events happening in the next hour
    const events = await base44.asServiceRole.entities.CoupleGoal.list();
    const upcomingEvents = events.filter(event => {
      if (!event.is_event || event.invitation_status !== 'accepted') return false;
      const eventTime = new Date(event.event_datetime);
      return eventTime >= now && eventTime <= oneHourFromNow && !event.reminder_sent;
    });

    let sentCount = 0;

    for (const event of upcomingEvents) {
      // Get the couple profile
      const couples = await base44.asServiceRole.entities.CoupleProfile.filter({
        id: event.couple_profile_id
      });
      
      if (couples.length > 0) {
        const couple = couples[0];
        
        // Send to both partners
        const emails = [couple.partner1_email, couple.partner2_email];
        
        for (const email of emails) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject: `⏰ Reminder: ${event.title} in 1 hour`,
            body: `This is a reminder that your event "${event.title}" is starting in 1 hour.\n\nDate & Time: ${new Date(event.event_datetime).toLocaleString()}\nLocation: ${event.event_location || 'No location specified'}\n\nLog in to Date-Locked to view details: https://app.base44.com/your-app`
          });
          sentCount++;
        }
        
        // Mark reminder as sent
        await base44.asServiceRole.entities.CoupleGoal.update(event.id, {
          reminder_sent: true
        });
      }
    }

    return Response.json({ 
      success: true, 
      sentCount,
      message: `Sent ${sentCount} reminder notifications`
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});