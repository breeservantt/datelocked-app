import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    console.log('Starting system health check...');
    
    const issues = [];
    const timestamp = new Date().toISOString();
    
    // Check 1: Environment Variables / Secrets
    console.log('Checking environment variables...');
    const requiredSecrets = [
      'PAYFAST_MERCHANT_ID',
      'PAYFAST_MERCHANT_KEY',
      'PAYFAST_PASSPHRASE'
    ];
    
    const missingSecrets = [];
    for (const secret of requiredSecrets) {
      if (!Deno.env.get(secret)) {
        missingSecrets.push(secret);
      }
    }
    
    if (missingSecrets.length > 0) {
      issues.push({
        severity: 'CRITICAL',
        category: 'Configuration',
        message: `Missing required secrets: ${missingSecrets.join(', ')}`
      });
    }
    
    // Check 2: Database Connectivity
    console.log('Checking database connectivity...');
    try {
      await base44.asServiceRole.entities.User.filter({}, '', 1);
    } catch (error) {
      issues.push({
        severity: 'CRITICAL',
        category: 'Database',
        message: `Database connection failed: ${error.message}`
      });
    }
    
    // Check 3: Payment Gateway Status (PayFast)
    console.log('Checking payment gateway...');
    
    // Run comprehensive PayFast diagnostics
    try {
      const payfastMerchantId = Deno.env.get('PAYFAST_MERCHANT_ID');
      const payfastMerchantKey = Deno.env.get('PAYFAST_MERCHANT_KEY');
      const payfastPassphrase = Deno.env.get('PAYFAST_PASSPHRASE');
      const isSandbox = Deno.env.get('PAYFAST_SANDBOX') === 'true';
      
      if (!payfastMerchantId || !payfastMerchantKey || !payfastPassphrase) {
        issues.push({
          severity: 'CRITICAL',
          category: 'Payment Gateway',
          message: 'PayFast credentials are incomplete - payments will fail'
        });
      } else {
        // Check for common configuration issues
        if (isSandbox && !payfastMerchantId.startsWith('10')) {
          issues.push({
            severity: 'HIGH',
            category: 'Payment Gateway',
            message: 'PayFast sandbox mode enabled but merchant ID does not match sandbox format'
          });
        }

        // Check recent payment success rate
        const premiumUsers = await base44.asServiceRole.entities.User.filter({
          subscription_tier: 'premium'
        });
        
        if (premiumUsers.length === 0) {
          issues.push({
            severity: 'MEDIUM',
            category: 'Payment Gateway',
            message: 'No successful premium subscriptions detected - PayFast may not be working correctly'
          });
        }
      }
    } catch (error) {
      issues.push({
        severity: 'HIGH',
        category: 'Payment Gateway',
        message: `PayFast diagnostic failed: ${error.message}`
      });
    }
    
    // Check 4: Data Integrity
    console.log('Checking data integrity...');
    try {
      // Check for orphaned records
      const users = await base44.asServiceRole.entities.User.filter({
        relationship_status: 'date_locked'
      });
      
      for (const user of users) {
        if (user.couple_profile_id) {
          try {
            const coupleProfiles = await base44.asServiceRole.entities.CoupleProfile.filter({
              id: user.couple_profile_id
            });
            
            if (coupleProfiles.length === 0) {
              issues.push({
                severity: 'MEDIUM',
                category: 'Data Integrity',
                message: `User ${user.email} has couple_profile_id but no matching CoupleProfile exists`
              });
            }
          } catch (error) {
            // Profile doesn't exist
            issues.push({
              severity: 'MEDIUM',
              category: 'Data Integrity',
              message: `User ${user.email} has invalid couple_profile_id`
            });
          }
        }
      }
      
      // Check for expired invitations that should be cleaned up
      const pendingInvitations = await base44.asServiceRole.entities.RelationshipInvitation.filter({
        status: 'pending'
      });
      
      const now = new Date();
      let expiredCount = 0;
      for (const inv of pendingInvitations) {
        if (new Date(inv.expires_at) < now) {
          expiredCount++;
        }
      }
      
      if (expiredCount > 10) {
        issues.push({
          severity: 'LOW',
          category: 'Data Cleanup',
          message: `${expiredCount} expired invitations need cleanup`
        });
      }
    } catch (error) {
      issues.push({
        severity: 'MEDIUM',
        category: 'Data Integrity',
        message: `Data integrity check failed: ${error.message}`
      });
    }
    
    // Check 5: Use AI to analyze system state
    console.log('Running AI analysis...');
    try {
      const analysisPrompt = `Analyze the following system health check results for a dating/relationship app called Date-Locked:

Current Issues Found: ${JSON.stringify(issues, null, 2)}

Payment Gateway: PayFast
Features: User relationships, couple profiles, memories, goals, subscription management

Based on these issues, provide:
1. Overall health status (HEALTHY, DEGRADED, CRITICAL)
2. Immediate actions needed
3. Potential impact on users
4. Recommendations

Keep analysis concise and actionable.`;

      const aiAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['HEALTHY', 'DEGRADED', 'CRITICAL'] },
            immediate_actions: { type: 'array', items: { type: 'string' } },
            user_impact: { type: 'string' },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      
      console.log('AI Analysis:', JSON.stringify(aiAnalysis));
      
      // Send email ONLY if issues found or status is not HEALTHY
      if (issues.length > 0 || aiAnalysis.status !== 'HEALTHY') {
        const admins = await base44.asServiceRole.entities.User.filter({
          role: 'admin'
        });
        
        const emailBody = `
🔍 Date-Locked System Health Check Report
Time: ${new Date(timestamp).toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 OVERALL STATUS: ${aiAnalysis.status}

${issues.length > 0 ? `
⚠️ ISSUES DETECTED (${issues.length}):

${issues.map((issue, i) => `
${i + 1}. [${issue.severity}] ${issue.category}
   ${issue.message}
`).join('\n')}
` : '✅ No issues detected'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 AI ANALYSIS:

${aiAnalysis.user_impact ? `👥 User Impact:\n${aiAnalysis.user_impact}\n\n` : ''}

${aiAnalysis.immediate_actions?.length > 0 ? `🚨 Immediate Actions:\n${aiAnalysis.immediate_actions.map(a => `• ${a}`).join('\n')}\n\n` : ''}

${aiAnalysis.recommendations?.length > 0 ? `💡 Recommendations:\n${aiAnalysis.recommendations.map(r => `• ${r}`).join('\n')}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated system health check. Please review and take necessary actions.
        `;
        
        for (const admin of admins) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              from_name: 'Date-Locked System Monitor',
              to: admin.email,
              subject: `🔍 System Health Report - ${aiAnalysis.status}`,
              body: emailBody
            });
            console.log(`Alert sent to admin: ${admin.email}`);
          } catch (emailError) {
            console.error(`Failed to send email to ${admin.email}:`, emailError);
          }
        }
      }
      
      console.log('Health check completed successfully');
      
      return Response.json({
        success: true,
        timestamp,
        status: aiAnalysis.status,
        issues_count: issues.length,
        issues,
        ai_analysis: aiAnalysis
      });
      
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      issues.push({
        severity: 'LOW',
        category: 'Monitoring',
        message: `AI analysis unavailable: ${aiError.message}`
      });
    }
    
    return Response.json({
      success: true,
      timestamp,
      status: issues.some(i => i.severity === 'CRITICAL') ? 'CRITICAL' : 
              issues.some(i => i.severity === 'HIGH') ? 'DEGRADED' : 'HEALTHY',
      issues_count: issues.length,
      issues
    });
    
  } catch (error) {
    console.error('System health check failed:', error);
    console.error('Error stack:', error.stack);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});