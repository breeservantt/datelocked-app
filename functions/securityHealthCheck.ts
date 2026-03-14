import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can run security checks
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const timestamp = new Date().toISOString();
    const issues = [];
    const warnings = [];
    const info = [];

    console.log(`[${timestamp}] Starting security health check...`);

    // --- 1. Payment Configuration Check --- //
    try {
      const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
      const paystackPublic = Deno.env.get('PAYSTACK_PUBLIC_KEY');

      if (!paystackSecret || !paystackPublic) {
        issues.push('Payment configuration: Missing Paystack keys');
      } else {
        // Validate Paystack connection
        const response = await fetch('https://api.paystack.co/transaction', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${paystackSecret}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          issues.push(`Payment configuration: Paystack API returned ${response.status}`);
        } else {
          info.push('Payment configuration: Valid');
        }
      }
    } catch (error) {
      issues.push(`Payment configuration: ${error.message}`);
    }

    // --- 2. Suspicious User Activity Check --- //
    try {
      const usingSR = base44.asServiceRole;

      // Check for multiple failed verification attempts
      const recentLogs = await usingSR.entities.VerificationLog.filter({}, '-verification_timestamp', 100);
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentFails = recentLogs.filter(log => 
        new Date(log.verification_timestamp) > last24h &&
        log.verification_status === 'failed'
      );

      if (recentFails.length > 50) {
        warnings.push(`Suspicious activity: ${recentFails.length} failed verifications in 24h`);
      }

      // Check for rapid account creation
      const allUsers = await usingSR.entities.User.list();
      const newUsers = allUsers.filter(u => 
        new Date(u.created_date) > last24h
      );

      if (newUsers.length > 100) {
        warnings.push(`Suspicious activity: ${newUsers.length} new accounts in 24h`);
      }

      // Check for users with unusual verification counts
      const suspiciousUsers = allUsers.filter(u => 
        (u.verifications_used_this_month || 0) > 50
      );

      if (suspiciousUsers.length > 0) {
        warnings.push(`Suspicious activity: ${suspiciousUsers.length} users with >50 verifications this month`);
      }

      info.push(`User activity: ${recentFails.length} failed verifications, ${newUsers.length} new users in 24h`);
    } catch (error) {
      issues.push(`User activity check failed: ${error.message}`);
    }

    // --- 3. Data Integrity Check --- //
    try {
      const usingSR = base44.asServiceRole;

      // Check for orphaned couple profiles
      const coupleProfiles = await usingSR.entities.CoupleProfile.list();
      const allUsers = await usingSR.entities.User.list();
      const userEmails = new Set(allUsers.map(u => u.email));

      const orphanedProfiles = coupleProfiles.filter(cp => 
        !userEmails.has(cp.partner1_email) || !userEmails.has(cp.partner2_email)
      );

      if (orphanedProfiles.length > 0) {
        warnings.push(`Data integrity: ${orphanedProfiles.length} orphaned couple profiles`);
      }

      // Check for users with invalid relationship status
      const invalidUsers = allUsers.filter(u => 
        u.relationship_status === 'date_locked' && !u.couple_profile_id
      );

      if (invalidUsers.length > 0) {
        warnings.push(`Data integrity: ${invalidUsers.length} users marked date-locked without couple profile`);
      }

      // Check for expired invitation tokens
      const invitations = await usingSR.entities.RelationshipInvitation.filter({ status: 'pending' });
      const expiredInvites = invitations.filter(inv => 
        new Date(inv.expires_at) < new Date()
      );

      if (expiredInvites.length > 10) {
        warnings.push(`Data integrity: ${expiredInvites.length} expired pending invitations (need cleanup)`);
      }

      info.push(`Data integrity: ${coupleProfiles.length} couple profiles, ${orphanedProfiles.length} orphaned, ${invalidUsers.length} invalid statuses`);
    } catch (error) {
      issues.push(`Data integrity check failed: ${error.message}`);
    }

    // --- 4. System Health Check --- //
    try {
      const usingSR = base44.asServiceRole;

      // Check entity counts
      const userCount = (await usingSR.entities.User.list()).length;
      const memoryCount = (await usingSR.entities.Memory.list()).length;
      const goalCount = (await usingSR.entities.CoupleGoal.list()).length;

      info.push(`System health: ${userCount} users, ${memoryCount} memories, ${goalCount} goals`);

      // Check for any users with account_status issues
      const allUsers = await usingSR.entities.User.list();
      const deactivatedCount = allUsers.filter(u => u.account_status === 'deactivated').length;

      if (deactivatedCount > 0) {
        info.push(`System health: ${deactivatedCount} deactivated accounts`);
      }
    } catch (error) {
      issues.push(`System health check failed: ${error.message}`);
    }

    // --- Generate Report --- //
    const status = issues.length > 0 ? 'CRITICAL' : warnings.length > 0 ? 'WARNING' : 'HEALTHY';
    
    const report = {
      timestamp,
      status,
      issues,
      warnings,
      info,
      summary: {
        critical_issues: issues.length,
        warnings: warnings.length,
        info_items: info.length
      }
    };

    console.log(`[${timestamp}] Security check complete: ${status}`);
    console.log(`Issues: ${issues.length}, Warnings: ${warnings.length}`);

    // Send email report ONLY if there are issues or warnings
    if (issues.length > 0 || warnings.length > 0) {
      try {
        const usingSR = base44.asServiceRole;
        const admins = await usingSR.entities.User.filter({ role: 'admin' });
        
        const emailBody = `
🔒 Date-Locked Security Health Check Report
Time: ${new Date(timestamp).toLocaleString()}
Status: ${status}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${issues.length > 0 ? `
🚨 CRITICAL ISSUES (${issues.length}):
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}
` : ''}

${warnings.length > 0 ? `
⚠️ WARNINGS (${warnings.length}):
${warnings.map((warning, i) => `${i + 1}. ${warning}`).join('\n')}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated security check. Please review and take action.
        `;

        for (const admin of admins) {
          await usingSR.integrations.Core.SendEmail({
            from_name: 'Date-Locked Security Monitor',
            to: admin.email,
            subject: `🔒 Security Alert - ${status}`,
            body: emailBody
          });
        }
        
        console.log(`Alert email sent to ${admins.length} admin(s)`);
      } catch (emailError) {
        console.error('Failed to send alert email:', emailError);
      }
    }

    return Response.json(report);
  } catch (error) {
    console.error('Security health check error:', error);
    return Response.json({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      status: 'ERROR'
    }, { status: 500 });
  }
});