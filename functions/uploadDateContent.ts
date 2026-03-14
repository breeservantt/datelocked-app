import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MAX_STRIKES = 3;

Deno.serve(async (req) => {
  try {
    console.log('=== BACKEND UPLOAD FUNCTION START ===');
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('ERROR: User not authenticated');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('1. User authenticated:', user.email);

    const payload = await req.json();
    console.log('2. Received payload:', payload);

    const { content_url, content_type, visibility, caption, location } = payload;

    if (!content_url) {
      console.error('ERROR: Missing content_url');
      return Response.json({ error: 'content_url is required' }, { status: 400 });
    }

    console.log('3. Validation passed:', {
      content_url,
      content_type,
      visibility,
      has_caption: !!caption,
      has_location: !!location
    });

    console.log('4. Starting AI moderation...');
    
    // Run AI content moderation (skip file analysis for videos as vision models can't process them)
    let moderationResult;
    
    if (content_type === 'VIDEO') {
      console.log('4a. Video detected - using text-only moderation');
      moderationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on the caption and context, assess if this video upload request seems safe:
Caption: "${caption || 'No caption'}"
Location: "${location || 'No location'}"

Check if the caption contains:
- References to nudity or explicit sexual content
- References to minors
- References to violence or graphic content
- Harassment or abusive language

Return a conservative assessment. If caption seems innocent or empty, mark as safe.`,
        response_json_schema: {
          type: "object",
          properties: {
            nudity: { type: "boolean" },
            sexualExplicit: { type: "boolean" },
            minorsDetected: { type: "boolean" },
            violence: { type: "boolean" },
            harassment: { type: "boolean" },
            safe: { type: "boolean" },
            reason: { type: "string" }
          }
        }
      });
    } else {
      console.log('4b. Image detected - using vision moderation');
      moderationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this image for policy violations. Check for:
- Nudity or explicit sexual content
- Minors in the image
- Violence or graphic content
- Harassment or abusive content

Return a JSON analysis.`,
        file_urls: [content_url],
        response_json_schema: {
          type: "object",
          properties: {
            nudity: { type: "boolean" },
            sexualExplicit: { type: "boolean" },
            minorsDetected: { type: "boolean" },
            violence: { type: "boolean" },
            harassment: { type: "boolean" },
            safe: { type: "boolean" },
            reason: { type: "string" }
          }
        }
      });
    }

    console.log('5. Moderation result:', moderationResult);

    // Check for violations
    let violation = null;
    if (moderationResult.nudity) violation = "Nudity not allowed";
    if (moderationResult.sexualExplicit) violation = "Explicit sexual content not allowed";
    if (moderationResult.minorsDetected) violation = "Minors strictly prohibited";
    if (moderationResult.violence) violation = "Violent content not allowed";
    if (moderationResult.harassment) violation = "Harassment or abuse detected";

    if (violation) {
      console.log('6. VIOLATION DETECTED:', violation);
      
      // Add strike
      const strikes = await base44.asServiceRole.entities.StrikeRecord.filter({
        user_email: user.email,
        is_active: true
      });

      const strikeNumber = strikes.length + 1;

      console.log('7. Adding strike:', strikeNumber);

      await base44.asServiceRole.entities.StrikeRecord.create({
        user_email: user.email,
        reason: violation,
        strike_number: strikeNumber
      });

      // Suspend if max strikes reached
      if (strikeNumber >= MAX_STRIKES) {
        console.log('8. MAX STRIKES REACHED - Suspending account');
        
        await base44.asServiceRole.entities.User.update(user.id, {
          account_status: 'suspended',
          suspension_reason: 'Strike limit reached'
        });

        return Response.json({ 
          error: 'ACCOUNT_SUSPENDED', 
          message: 'Strike limit reached. Account suspended.' 
        }, { status: 403 });
      }

      return Response.json({ 
        error: 'POLICY_VIOLATION', 
        message: violation,
        strikes: strikeNumber
      }, { status: 400 });
    }

    console.log('6. Content APPROVED - Saving to database...');
    
    // Save approved content
    const content = await base44.asServiceRole.entities.DateContent.create({
      owner_email: user.email,
      content_url,
      content_type: content_type || 'IMAGE',
      visibility: visibility || 'PUBLIC_WALL',
      caption: caption || '',
      location: location || '',
      moderation_status: 'APPROVED',
      moderation_flags: moderationResult
    });

    console.log('7. Content saved successfully. ID:', content.id);
    console.log('=== BACKEND UPLOAD FUNCTION END (SUCCESS) ===');

    return Response.json({ 
      success: true, 
      contentId: content.id 
    });

  } catch (error) {
    console.error('=== BACKEND UPLOAD ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});