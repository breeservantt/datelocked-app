import React from 'react';
import { supabase } from '@/lib/supabase';
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
      // ✅ GET USER
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;

      if (!currentUser) throw new Error('User not found');

      setUser(currentUser);

      const coupleId = currentUser.user_metadata?.couple_profile_id;

      if (!coupleId) {
        setInsights([]);
        setLatestInsight(null);
        return;
      }

      // ✅ LOAD INSIGHTS
      const { data: allInsights } = await supabase
        .from('RelationshipInsight')
        .select('*')
        .eq('couple_profile_id', coupleId)
        .order('created_at', { ascending: false })
        .limit(10);

      const list = allInsights || [];

      setInsights(list);
      setLatestInsight(list.length > 0 ? list[0] : null);

    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load insights');
      setInsights([]);
      setLatestInsight(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // ✅ GENERATE (calls your backend function)
  const generateInsights = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError('');

    try {
      await fetch('/api/functions/generateWeeklyInsights', {
        method: 'POST'
      });

      await loadData();
    } catch (e) {
      setError('Failed to generate insights');
    } finally {
      setIsGenerating(false);
    }
  };

  const healthScoreColor =
    latestInsight?.health_score >= 80
      ? 'text-green-500'
      : latestInsight?.health_score >= 60
      ? 'text-amber-500'
      : 'text-red-500';

  // LOADING
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div className="p-6 text-center">
        <XIcon className="mx-auto text-red-500 mb-3" />
        <p>{error}</p>
        <Button onClick={loadData}>Retry</Button>
      </div>
    );
  }

  // NOT DATE-LOCKED
  if (!user?.user_metadata?.couple_profile_id) {
    return (
      <div className="p-6 text-center">
        <Heart className="mx-auto mb-3" />
        <p>You must be Date-Locked to view insights</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost"><ArrowLeft /></Button>
        </Link>

        <Button onClick={generateInsights} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="animate-spin" /> : 'Generate'}
        </Button>
      </div>

      {latestInsight ? (
        <>
          {/* SCORE */}
          <Card className="p-4 text-center">
            <h2 className={`text-5xl font-bold ${healthScoreColor}`}>
              {latestInsight.health_score}
            </h2>
            <p>Relationship Score</p>
            <Progress value={latestInsight.health_score} />
          </Card>

          {/* SUMMARY */}
          {latestInsight.summary && (
            <Card className="p-4">
              <p>{latestInsight.summary}</p>
            </Card>
          )}

          {/* STATS */}
          <Card className="p-4 grid grid-cols-3 text-center">
            <div>
              <Heart />
              <p>{latestInsight.memories_count}</p>
            </div>
            <div>
              <Target />
              <p>{latestInsight.goals_completed}</p>
            </div>
            <div>
              <MapPin />
              <p>{latestInsight.places_added}</p>
            </div>
          </Card>

          {/* HISTORY */}
          {insights.slice(1).map((i) => (
            <Card key={i.id} className="p-3 flex justify-between">
              <span>
                {format(parseSafeDate(i.created_at), 'MMM d')}
              </span>
              <span>{i.health_score}</span>
            </Card>
          ))}
        </>
      ) : (
        <div className="text-center">
          <BarChart3 className="mx-auto mb-3" />
          <p>No insights yet</p>
        </div>
      )}
    </div>
  );
}
