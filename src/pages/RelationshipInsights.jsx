import React from 'react';
import { supabase } from '@/lib/supabase';
import { calculateInteractionScore } from '@/components/utils/interactionScore';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  TrendingUp,
  Heart,
  Target,
  MapPin,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Loader2,
  BarChart3,
  Award,
  X as XIcon,
  MessageCircle,
  CalendarDays,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

async function tryProfileTablesById(userId) {
  for (const table of ['profiles', 'users']) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) return data;
  }
  return null;
}

function buildStrengths({ total, chatsCount, goalsCompleted, memoriesCount, eventsCount }) {
  const strengths = [];

  if (chatsCount >= 20) strengths.push('Strong communication activity this period.');
  if (goalsCompleted >= 1) strengths.push('You are completing goals together.');
  if (memoriesCount >= 3) strengths.push('You are actively capturing shared moments.');
  if (eventsCount >= 1) strengths.push('You are planning or attending shared events.');
  if (total >= 75) strengths.push('Your overall interaction level is strong.');

  if (strengths.length === 0) {
    strengths.push('Your connection has room to grow with more shared activity.');
  }

  return strengths;
}

function buildImprovements({ total, chatsCount, goalsCompleted, memoriesCount, eventsCount }) {
  const improvements = [];

  if (chatsCount < 10) improvements.push('Increase message activity to strengthen day-to-day connection.');
  if (goalsCompleted < 1) improvements.push('Complete shared goals together to build momentum.');
  if (memoriesCount < 3) improvements.push('Create and save more memories together.');
  if (eventsCount < 1) improvements.push('Plan more date or event activities together.');
  if (total < 40) improvements.push('Focus on regular communication and shared actions to improve your score.');

  if (improvements.length === 0) {
    improvements.push('Keep maintaining your current rhythm and consistency.');
  }

  return improvements;
}

export default function RelationshipInsights() {
  const [user, setUser] = React.useState(null);
  const [latestInsight, setLatestInsight] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadData = React.useCallback(async () => {
  setIsLoading(true);
  setError('');

  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authUser) throw new Error('Unable to load your profile.');

    const profile = await tryProfileTablesById(authUser.id);

    const currentUser = {
      id: authUser.id,
      email: authUser.email,
      full_name:
        profile?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        'User',
      couple_profile_id: profile?.couple_profile_id || null,
      insights_consent: profile?.insights_consent || false,
    };

    setUser(currentUser);

    let messages = [];
    let goals = [];
    let memories = [];

    try {
      let messagesQuery = supabase.from('messages').select('*');

      if (currentUser.couple_profile_id) {
        messagesQuery = messagesQuery.eq(
          'couple_profile_id',
          currentUser.couple_profile_id
        );
      } else {
        messagesQuery = messagesQuery.eq('sender_email', currentUser.email);
      }

      const { data, error } = await messagesQuery;
      if (error) {
        console.error('Messages query error:', error);
      } else {
        messages = Array.isArray(data) ? data : [];
      }
    } catch (e) {
      console.error('Messages load failed:', e);
    }

    try {
      let goalsQuery = supabase.from('couple_goals').select('*');

      if (currentUser.couple_profile_id) {
        goalsQuery = goalsQuery.eq(
          'couple_profile_id',
          currentUser.couple_profile_id
        );
      } else {
        goalsQuery = goalsQuery.eq('owner_id', currentUser.id);
      }

      const { data, error } = await goalsQuery;
      if (error) {
        console.error('Goals query error:', error);
      } else {
        goals = Array.isArray(data) ? data : [];
      }
    } catch (e) {
      console.error('Goals load failed:', e);
    }

    try {
      let memoriesQuery = supabase.from('memories').select('*');

      if (currentUser.couple_profile_id) {
        memoriesQuery = memoriesQuery.eq(
          'couple_profile_id',
          currentUser.couple_profile_id
        );
      } else {
        memoriesQuery = memoriesQuery.eq('created_by', currentUser.id);
      }

      const { data, error } = await memoriesQuery;
      if (error) {
        console.error('Memories query error:', error);
      } else {
        memories = Array.isArray(data) ? data : [];
      }
    } catch (e) {
      console.error('Memories load failed:', e);
    }

    const goalItems = goals.filter((g) => g?.type === 'goal');
const eventItems = goals.filter((g) => g?.type === 'event');

const chatsCount = messages.length;
const goalsCount = goalItems.length;
const goalsCompleted = goalItems.filter((g) => g?.status === 'completed').length;
const memoriesCount = memories.length;
const eventsCount = eventItems.length;

    const { total, level } = calculateInteractionScore({
      chats: chatsCount,
      goals: goalsCount,
      memories: memoriesCount,
      dates: eventsCount,
    });

    const summary =
      total >= 75
        ? 'Strong interaction between you and your partner.'
        : total >= 40
        ? 'Your relationship is growing steadily.'
        : 'Low interaction detected. Increase chats and shared activities.';

    setLatestInsight({
      id: 'live-insight',
      health_score: total,
      summary,
      strengths: buildStrengths({
        total,
        chatsCount,
        goalsCompleted,
        memoriesCount,
        eventsCount,
      }),
      improvements: buildImprovements({
        total,
        chatsCount,
        goalsCompleted,
        memoriesCount,
        eventsCount,
      }),
      memories_count: memoriesCount,
      goals_completed: goalsCompleted,
      goals_count: goalsCount,
      chats_count: chatsCount,
      dates_count: eventsCount,
      interaction_level: level,
      week_start_date: new Date(),
      week_end_date: new Date(),
    });
  } catch (e) {
    console.error('Error loading insights:', e);
    setError(e?.message || 'Failed to load insights.');
    setLatestInsight(null);
  } finally {
    setIsLoading(false);
  }
}, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
  if (!user?.id) return;

  const messageChannel = supabase
    .channel(`insights-messages-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
      },
      () => {
        loadData();
      }
    )
    .subscribe();

  const goalChannel = supabase
    .channel(`insights-goals-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'couple_goals',
      },
      () => {
        loadData();
      }
    )
    .subscribe();

  const memoryChannel = supabase
    .channel(`insights-memories-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'memories',
      },
      () => {
        loadData();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(messageChannel);
    supabase.removeChannel(goalChannel);
    supabase.removeChannel(memoryChannel);
  };
}, [user?.id, loadData]);

  const generateInsights = React.useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError('');

    try {
      await loadData();
    } catch (e) {
      console.error('Error generating insights:', e);
      setError(e?.message || 'Failed to generate insights. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, loadData]);

  const healthScoreColor =
    latestInsight?.health_score >= 80
      ? 'text-green-500'
      : latestInsight?.health_score >= 60
      ? 'text-amber-500'
      : 'text-red-500';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 pb-24">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-slate-800">Relationship Insights</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-10">
          <Card className="p-8 border-0 shadow-lg text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XIcon className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button
              onClick={loadData}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 pb-24">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-slate-800">Relationship Insights</h1>
          </div>
          <Button
            onClick={generateInsights}
            disabled={isGenerating}
            size="sm"
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {latestInsight ? (
          <>
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-white to-rose-50">
                <div className="text-center mb-6">
                  <div className={`text-6xl font-bold ${healthScoreColor} mb-2`}>
                    {latestInsight.health_score}
                  </div>
                  <p className="text-slate-600 font-medium">Relationship Health Score</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {format(new Date(latestInsight.week_start_date), 'MMM d')} -{' '}
                    {format(new Date(latestInsight.week_end_date), 'MMM d, yyyy')}
                  </p>
                </div>

                <Progress value={latestInsight.health_score} className="h-3 mb-4" />

                {latestInsight.summary ? (
                  <div className="bg-white/50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-700 leading-relaxed">{latestInsight.summary}</p>
                  </div>
                ) : null}

              </Card>
            </motion.div>

            {Array.isArray(latestInsight.strengths) && latestInsight.strengths.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-6 border-0 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-green-500" />
                    <h2 className="text-lg font-semibold text-slate-800">Strengths</h2>
                  </div>
                  <div className="space-y-3">
                    {latestInsight.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-700">{strength}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {Array.isArray(latestInsight.improvements) && latestInsight.improvements.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-6 border-0 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-semibold text-slate-800">Areas to Grow</h2>
                  </div>
                  <div className="space-y-3">
                    {latestInsight.improvements.map((improvement, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-700">{improvement}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 border-0 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-800">Activity Breakdown</h2>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-blue-500" />
                      <p className="text-sm font-medium text-slate-800">Messages</p>
                    </div>
                    <div className="text-lg font-bold text-slate-800">{latestInsight.chats_count}</div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-green-500" />
                      <p className="text-sm font-medium text-slate-800">Goals</p>
                    </div>
                    <div className="text-lg font-bold text-slate-800">{latestInsight.goals_count}</div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-rose-500" />
                      <p className="text-sm font-medium text-slate-800">Memories</p>
                    </div>
                    <div className="text-lg font-bold text-slate-800">{latestInsight.memories_count}</div>
                  </div>

      
                </div>
              </Card>
            </motion.div>
          </>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">No Insights Yet</h2>
            <p className="text-slate-500 mb-6">
              Your live relationship insights will appear here after activity is detected.
            </p>
            <Button
              onClick={generateInsights}
              disabled={isGenerating}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Refresh Insights
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}