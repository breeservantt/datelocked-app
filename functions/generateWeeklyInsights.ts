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

    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentUser, error: currentUserError } = await supabase
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single();

    if (currentUserError || !currentUser) {
      return Response.json({ error: 'User record not found' }, { status: 404 });
    }

    if (!currentUser.couple_profile_id) {
      return Response.json({ error: 'Not in a relationship' }, { status: 400 });
    }

    // Calculate week dates (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch all data for the week
    const [
      { data: memories, error: memoriesError },
      { data: goals, error: goalsError },
      { data: places, error: placesError }
    ] = await Promise.all([
      supabase
        .from('Memory')
        .select('*')
        .eq('couple_profile_id', currentUser.couple_profile_id),
      supabase
        .from('CoupleGoal')
        .select('*')
        .eq('couple_profile_id', currentUser.couple_profile_id),
      supabase
        .from('FavoritePlace')
        .select('*')
        .eq('couple_profile_id', currentUser.couple_profile_id)
    ]);

    if (memoriesError) throw memoriesError;
    if (goalsError) throw goalsError;
    if (placesError) throw placesError;

    const safeMemories = memories || [];
    const safeGoals = goals || [];
    const safePlaces = places || [];

    // Filter by date range
    const weekMemories = safeMemories.filter((m) => {
      const date = m.created_date?.split('T')[0];
      return date >= startDateStr && date <= endDateStr;
    });

    const weekGoalsCompleted = safeGoals.filter((g) => {
      const date = g.updated_date?.split('T')[0];
      return g.status === 'completed' && date >= startDateStr && date <= endDateStr;
    });

    const weekPlaces = safePlaces.filter((p) => {
      const date = p.created_date?.split('T')[0];
      return date >= startDateStr && date <= endDateStr;
    });

    // Calculate health score
    const activityScore = Math.min(
      100,
      (weekMemories.length * 20) +
      (weekGoalsCompleted.length * 15) +
      (weekPlaces.length * 10)
    );

    const goalProgressScore = safeGoals.length > 0
      ? (safeGoals.filter((g) => g.status !== 'planned').length / safeGoals.length) * 100
      : 50;

    const healthScore = Math.round((activityScore * 0.6) + (goalProgressScore * 0.4));

    let aiAnalysis = null;

    if (currentUser.insights_consent) {
      // Replace this block with your own LLM provider integration
      // Example placeholder shape kept to preserve logic:
      aiAnalysis = null;
    }

    // Create insight record
    const { data: insight, error: insightError } = await supabase
      .from('RelationshipInsight')
      .insert({
        couple_profile_id: currentUser.couple_profile_id,
        week_start_date: startDateStr,
        week_end_date: endDateStr,
        memories_count: weekMemories.length,
        goals_completed: weekGoalsCompleted.length,
        places_added: weekPlaces.length,
        health_score: healthScore,
        strengths: aiAnalysis?.strengths || [],
        improvements: aiAnalysis?.improvements || [],
        summary: aiAnalysis?.summary || `This week you created ${weekMemories.length} memories, completed ${weekGoalsCompleted.length} goals, and added ${weekPlaces.length} places!`,
        ai_analysis_enabled: !!currentUser.insights_consent
      })
      .select()
      .single();

    if (insightError) {
      throw insightError;
    }

    return Response.json({ success: true, insight });
  } catch (error) {
    console.error('Error generating insights:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
