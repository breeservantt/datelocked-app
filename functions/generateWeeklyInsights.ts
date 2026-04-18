import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.couple_profile_id) {
      return Response.json({ error: 'Not in a relationship' }, { status: 400 });
    }

    // Calculate week dates (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch all data for the week
    const [memories, goals, places] = await Promise.all([
      base44.asServiceRole.entities.Memory.filter({ couple_profile_id: user.couple_profile_id }),
      base44.asServiceRole.entities.CoupleGoal.filter({ couple_profile_id: user.couple_profile_id }),
      base44.asServiceRole.entities.FavoritePlace.filter({ couple_profile_id: user.couple_profile_id })
    ]);

    // Filter by date range
    const weekMemories = memories.filter(m => {
      const date = m.created_date?.split('T')[0];
      return date >= startDateStr && date <= endDateStr;
    });

    const weekGoalsCompleted = goals.filter(g => {
      const date = g.updated_date?.split('T')[0];
      return g.status === 'completed' && date >= startDateStr && date <= endDateStr;
    });

    const weekPlaces = places.filter(p => {
      const date = p.created_date?.split('T')[0];
      return date >= startDateStr && date <= endDateStr;
    });

    // Calculate health score
    const activityScore = Math.min(100, (weekMemories.length * 20) + (weekGoalsCompleted.length * 15) + (weekPlaces.length * 10));
    const goalProgressScore = goals.length > 0 ? (goals.filter(g => g.status !== 'planned').length / goals.length) * 100 : 50;
    const healthScore = Math.round((activityScore * 0.6) + (goalProgressScore * 0.4));

    let aiAnalysis = null;
    if (user.insights_consent) {
      // Generate AI insights
      const prompt = `Analyze this couple's weekly relationship data and provide insights:
- ${weekMemories.length} new memories created
- ${weekGoalsCompleted.length} goals completed
- ${weekPlaces.length} new places added
- Total goals: ${goals.length} (${goals.filter(g => g.status === 'completed').length} completed)
- Total memories: ${memories.length}
- Total places: ${places.length}

Provide:
1. A warm, encouraging 2-3 sentence summary
2. 2-3 specific strengths (as an array)
3. 1-2 gentle suggestions for improvement (as an array)

Be positive, supportive, and specific.`;

      aiAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } }
          }
        }
      });
    }

    // Create insight record
    const insight = await base44.asServiceRole.entities.RelationshipInsight.create({
      couple_profile_id: user.couple_profile_id,
      week_start_date: startDateStr,
      week_end_date: endDateStr,
      memories_count: weekMemories.length,
      goals_completed: weekGoalsCompleted.length,
      places_added: weekPlaces.length,
      health_score: healthScore,
      strengths: aiAnalysis?.strengths || [],
      improvements: aiAnalysis?.improvements || [],
      summary: aiAnalysis?.summary || `This week you created ${weekMemories.length} memories, completed ${weekGoalsCompleted.length} goals, and added ${weekPlaces.length} places!`,
      ai_analysis_enabled: !!user.insights_consent
    });

    return Response.json({ success: true, insight });
  } catch (error) {
    console.error('Error generating insights:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});