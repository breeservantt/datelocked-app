import React from 'react';
import { base44 } from '@/api/base44Client';
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
  X as XIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { parseSafeDate } from '@/components/utils/dateHelpers';

export default function RelationshipInsights() {
  const [user, setUser] = React.useState(null);
  const [insights, setInsights] = React.useState([]);
  const [latestInsight, setLatestInsight] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) throw new Error('Unable to load your profile.');

      setUser(currentUser);

      if (!currentUser.couple_profile_id) {
        setInsights([]);
        setLatestInsight(null);
        return;
      }

      const allInsights = await base44.entities.RelationshipInsight.filter(
        { couple_profile_id: currentUser.couple_profile_id },
        '-created_date',
        10
      );

      const list = Array.isArray(allInsights) ? allInsights : [];
      setInsights(list);
      setLatestInsight(list.length > 0 ? list[0] : null);
    } catch (e) {
      console.error('Error loading insights:', e);
      setError(e?.message || 'Failed to load insights. Please try again.');
      setInsights([]);
      setLatestInsight(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await loadData();
    })();

    return () => {
      mounted = false;
    };
  }, [loadData]);

  const generateInsights = React.useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError('');

    try {
      await base44.functions.invoke('generateWeeklyInsights');
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

  // Error state
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

  // Not date-locked / no couple profile
  if (!user?.couple_profile_id) {
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

        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Date-Lock Required</h2>
          <p className="text-slate-500">
            You need to be Date-Locked with a partner to access relationship insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 pb-24">
      {/* Header */}
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
                Generate
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* AI Consent Notice */}
        {!user?.insights_consent && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-4 border-0 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800 mb-1">Enable AI Insights</p>
                  <p className="text-sm text-slate-600 mb-3">
                    Enable AI Insights in Settings for deeper weekly analysis.
                  </p>
                  <Link to={createPageUrl('Settings')}>
                    <Button size="sm" variant="outline">
                      Go to Settings
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Latest Insight */}
        {latestInsight ? (
          <>
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-white to-rose-50">
                <div className="text-center mb-6">
                  <div className={`text-6xl font-bold ${healthScoreColor} mb-2`}>
                    {latestInsight.health_score}
                  </div>
                  <p className="text-slate-600 font-medium">Relationship Health Score</p>
                  {(() => {
                    const startDate = parseSafeDate(latestInsight.week_start_date);
                    const endDate = parseSafeDate(latestInsight.week_end_date);
                    return startDate && endDate ? (
                      <p className="text-xs text-slate-400 mt-1">
                        {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                      </p>
                    ) : null;
                  })()}
                </div>

                <Progress value={latestInsight.health_score} className="h-3 mb-4" />

                {latestInsight.summary ? (
                  <div className="bg-white/50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-700 leading-relaxed">{latestInsight.summary}</p>
                  </div>
                ) : null}

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Heart className="w-6 h-6 text-rose-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{latestInsight.memories_count}</p>
                    <p className="text-xs text-slate-500">Memories</p>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Target className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{latestInsight.goals_completed}</p>
                    <p className="text-xs text-slate-500">Goals</p>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <MapPin className="w-6 h-6 text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{latestInsight.places_added}</p>
                    <p className="text-xs text-slate-500">Places</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Strengths */}
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

            {/* Improvements */}
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

            {/* Previous Insights */}
            {insights.length > 1 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-6 border-0 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-slate-500" />
                    <h2 className="text-lg font-semibold text-slate-800">Previous Weeks</h2>
                  </div>

                  <div className="space-y-3">
                    {insights.slice(1, 5).map((insight) => {
                      const startDate = parseSafeDate(insight.week_start_date);
                      const endDate = parseSafeDate(insight.week_end_date);
                      const scoreColor =
                        insight.health_score >= 80
                          ? 'text-green-500'
                          : insight.health_score >= 60
                          ? 'text-amber-500'
                          : 'text-red-500';

                      return (
                        <div key={insight.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            {startDate && endDate ? (
                              <p className="text-sm font-medium text-slate-800">
                                {format(startDate, 'MMM d')} - {format(endDate, 'MMM d')}
                              </p>
                            ) : (
                              <p className="text-sm font-medium text-slate-800">Week</p>
                            )}
                            <p className="text-xs text-slate-500">
                              {insight.memories_count} memories • {insight.goals_completed} goals
                            </p>
                          </div>
                          <div className={`text-2xl font-bold ${scoreColor}`}>{insight.health_score}</div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            )}
          </>
        ) : (
          // No Data
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">No Insights Yet</h2>
            <p className="text-slate-500 mb-6">
              Generate your first weekly insight to see relationship health analysis.
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
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
