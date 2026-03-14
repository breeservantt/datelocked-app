import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Target,
  Plane,
  Wallet,
  Sparkles,
  Heart,
  Mountain,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Award,
  Calendar,
  Clock,
  MapPin,
  Send,
  Check,
  X as XIcon,
  Coffee,
  Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { isTrialActive } from '@/components/utils/trial';
import { parseSafeDate } from '@/components/utils/dateHelpers';
import GoalCard from '@/components/goals/GoalCard';
import LevelProgress from '@/components/gamification/LevelProgress';
import StreakDisplay from '@/components/gamification/StreakDisplay';
import BadgeDisplay from '@/components/gamification/BadgeDisplay';
import RewardAnimation from '@/components/gamification/RewardAnimation';

const categories = [
  { value: 'travel', label: 'Travel', icon: Plane },
  { value: 'financial', label: 'Financial', icon: Wallet },
  { value: 'lifestyle', label: 'Lifestyle', icon: Sparkles },
  { value: 'adventure', label: 'Adventure', icon: Mountain },
  { value: 'romantic', label: 'Romantic', icon: Heart },
  { value: 'other', label: 'Other', icon: Target }
];

const eventTypes = [
  { value: 'movie', label: 'Movie', icon: Film },
  { value: 'dinner', label: 'Dinner', icon: Heart },
  { value: 'coffee', label: 'Coffee', icon: Coffee },
  { value: 'date', label: 'Date', icon: Heart },
  { value: 'travel', label: 'Travel', icon: Plane },
  { value: 'other', label: 'Other', icon: Calendar }
];

export default function Goals() {
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEventModal, setShowEventModal] = React.useState(false);
  const [selectedGoal, setSelectedGoal] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('all');

  const [showReward, setShowReward] = React.useState(false);
  const [rewardData, setRewardData] = React.useState(null);

  const [newGoal, setNewGoal] = React.useState({
    title: '',
    description: '',
    target_date: '',
    category: 'other',
    status: 'planned'
  });

  const [newEvent, setNewEvent] = React.useState({
    title: '',
    description: '',
    event_datetime: '',
    event_location: '',
    event_type: 'other'
  });

  const {
    data: user,
    isLoading: userLoading,
    isError: userError
  } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000
  });

  const coupleId = user?.couple_profile_id || null;
  const myEmail = user?.email || null;

  const canEdit =
    !!user &&
    (user.relationship_status === 'date_locked' || isTrialActive(user)) &&
    user.relationship_status !== 'pending_verification' &&
    user.relationship_status !== 'single';

  const {
    data: goals = [],
    isLoading: goalsLoading,
    isError: goalsError
  } = useQuery({
    queryKey: ['goals', coupleId],
    enabled: !!coupleId,
    staleTime: 30 * 1000,
    queryFn: () =>
      base44.entities.CoupleGoal.filter(
        { couple_profile_id: coupleId },
        '-created_date'
      )
  });

  const { data: pendingInvites = [] } = useQuery({
    queryKey: ['pendingInvites', coupleId, myEmail],
    enabled: !!coupleId && !!myEmail,
    staleTime: 30 * 1000,
    queryFn: () =>
      base44.entities.CoupleGoal.filter({
        couple_profile_id: coupleId,
        is_event: true,
        invitation_status: 'pending'
      })
  });

  // Prevent accidental duplicate "create profile" calls if react-query refetches quickly
  const creatingGamificationRef = React.useRef(false);

  const { data: gamification } = useQuery({
    queryKey: ['gamification', coupleId],
    enabled: !!coupleId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const profiles = await base44.entities.GamificationProfile.filter({
        couple_profile_id: coupleId
      });

      if (profiles?.length > 0) return profiles[0];

      // Guard to reduce duplicate creates from double fetches (not a substitute for backend uniqueness)
      if (creatingGamificationRef.current) {
        // wait a moment then re-check
        await new Promise((r) => setTimeout(r, 250));
        const again = await base44.entities.GamificationProfile.filter({
          couple_profile_id: coupleId
        });
        return again?.[0] || null;
      }

      creatingGamificationRef.current = true;
      try {
        return await base44.entities.GamificationProfile.create({
          couple_profile_id: coupleId,
          total_points: 0,
          level: 1,
          badges: [],
          current_streak: 0,
          longest_streak: 0,
          goals_completed_count: 0,
          memories_created_count: 0,
          last_activity_date: null
        });
      } finally {
        creatingGamificationRef.current = false;
      }
    }
  });

  const checkAndAwardBadge = React.useCallback(
    async (goalsCompleted) => {
      const badges = [...(gamification?.badges || [])];
      let newBadge = null;

      if (goalsCompleted === 1 && !badges.find((b) => b.id === 'first-goal')) {
        newBadge = { id: 'first-goal', name: 'First Goal', icon: 'target', earned_at: new Date().toISOString() };
        badges.push(newBadge);
      } else if (goalsCompleted === 5 && !badges.find((b) => b.id === 'goal-master')) {
        newBadge = { id: 'goal-master', name: 'Goal Master', icon: 'trophy', earned_at: new Date().toISOString() };
        badges.push(newBadge);
      } else if (goalsCompleted === 10 && !badges.find((b) => b.id === 'dream-achiever')) {
        newBadge = { id: 'dream-achiever', name: 'Dream Achiever', icon: 'star', earned_at: new Date().toISOString() };
        badges.push(newBadge);
      }

      return { badges, newBadge };
    },
    [gamification?.badges]
  );

  const updateStreak = React.useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = gamification?.last_activity_date || null;
    let newStreak = gamification?.current_streak || 0;

    if (lastActivity !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActivity === yesterdayStr) newStreak += 1;
      else newStreak = 1;
    }

    const longestStreak = Math.max(newStreak, gamification?.longest_streak || 0);
    return { newStreak, longestStreak, today };
  }, [gamification?.last_activity_date, gamification?.current_streak, gamification?.longest_streak]);

  const createGoalMutation = useMutation({
    mutationFn: (goalData) => base44.entities.CoupleGoal.create(goalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', coupleId] });
      setShowAddModal(false);
      setNewGoal({ title: '', description: '', target_date: '', category: 'other', status: 'planned' });
    },
    onError: (e) => {
      console.error('Create goal failed:', e);
      alert(e?.message || 'Failed to create goal. Please try again.');
    }
  });

  const createEventMutation = useMutation({
    mutationFn: (eventData) => base44.entities.CoupleGoal.create(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', coupleId] });
      queryClient.invalidateQueries({ queryKey: ['pendingInvites', coupleId, myEmail] });
      setShowEventModal(false);
      setNewEvent({ title: '', description: '', event_datetime: '', event_location: '', event_type: 'other' });
    },
    onError: (e) => {
      console.error('Create event failed:', e);
      alert(e?.message || 'Failed to create event. Please try again.');
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, status, gamUpdate }) => {
      await base44.entities.CoupleGoal.update(goalId, { status });
      if (gamUpdate && gamification?.id) {
        await base44.entities.GamificationProfile.update(gamification.id, gamUpdate);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', coupleId] });
      queryClient.invalidateQueries({ queryKey: ['gamification', coupleId] });
      setSelectedGoal(null);
    },
    onError: (e) => {
      console.error('Update goal failed:', e);
      alert(e?.message || 'Failed to update goal. Please try again.');
    }
  });

  const handleSubmit = React.useCallback(() => {
    if (!canEdit) return;
    if (!coupleId) return;
    if (!newGoal.title?.trim()) return;

    createGoalMutation.mutate({
      ...newGoal,
      title: newGoal.title.trim(),
      couple_profile_id: coupleId
    });
  }, [canEdit, coupleId, newGoal, createGoalMutation]);

  const handleEventSubmit = React.useCallback(() => {
    if (!canEdit) return;
    if (!coupleId || !myEmail) return;

    if (!newEvent.title?.trim() || !newEvent.event_datetime || !newEvent.event_location?.trim()) return;

    createEventMutation.mutate({
      ...newEvent,
      title: newEvent.title.trim(),
      event_location: newEvent.event_location.trim(),
      couple_profile_id: coupleId,
      is_event: true,
      invited_by: myEmail,
      invitation_status: 'pending',
      status: 'planned',
      category: 'romantic'
    });
  }, [canEdit, coupleId, myEmail, newEvent, createEventMutation]);

  const handleInviteResponse = React.useCallback(
    async (invite, response) => {
      try {
        await base44.entities.CoupleGoal.update(invite.id, { invitation_status: response });
        queryClient.invalidateQueries({ queryKey: ['goals', coupleId] });
        queryClient.invalidateQueries({ queryKey: ['pendingInvites', coupleId, myEmail] });
      } catch (e) {
        console.error('Error responding to invite:', e);
        alert(e?.message || 'Failed to respond. Please try again.');
      }
    },
    [queryClient, coupleId, myEmail]
  );

  const updateGoalStatus = React.useCallback(
    async (goal, newStatus) => {
      let gamUpdate = null;

      if (newStatus === 'completed' && goal.status !== 'completed' && gamification) {
        const pointsEarned = 100;
        const newGoalsCompleted = (gamification.goals_completed_count || 0) + 1;
        const newPoints = (gamification.total_points || 0) + pointsEarned;
        const newLevel = Math.floor(newPoints / 1000) + 1;

        const { badges, newBadge } = await checkAndAwardBadge(newGoalsCompleted);
        const { newStreak, longestStreak, today } = await updateStreak();

        gamUpdate = {
          total_points: newPoints,
          level: newLevel,
          goals_completed_count: newGoalsCompleted,
          badges,
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_activity_date: today
        };

        setRewardData({ points: pointsEarned, badgeName: newBadge?.name });
        setShowReward(true);
      }

      updateGoalMutation.mutate({ goalId: goal.id, status: newStatus, gamUpdate });
    },
    [gamification, checkAndAwardBadge, updateStreak, updateGoalMutation]
  );

  const filteredGoals = React.useMemo(() => {
    if (statusFilter === 'all') return goals;
    return goals.filter((g) => g.status === statusFilter);
  }, [goals, statusFilter]);

  const stats = React.useMemo(() => {
    let planned = 0, in_progress = 0, completed = 0;
    for (const g of goals) {
      if (g.status === 'planned') planned += 1;
      else if (g.status === 'in_progress') in_progress += 1;
      else if (g.status === 'completed') completed += 1;
    }
    return { planned, in_progress, completed };
  }, [goals]);

  const incomingInvites = React.useMemo(() => {
    if (!myEmail) return [];
    return pendingInvites.filter((inv) => inv.invited_by !== myEmail);
  }, [pendingInvites, myEmail]);

  // --- Loading & error states ---
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50 p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Couldn’t load Goals</h3>
          <p className="text-slate-500 text-sm mb-4">Please check your connection and try again.</p>
          <Link to={createPageUrl('Home')}>
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (goalsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (goalsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50 p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Goals failed to load</h3>
          <p className="text-slate-500 text-sm mb-4">Please try again.</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['goals', coupleId] })}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-slate-800">Our Goals</h1>
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <Button onClick={() => setShowEventModal(true)} variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Event
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                size="sm"
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Goal
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Pending Invitations */}
        {incomingInvites.length > 0 && (
          <div className="mb-6 space-y-3">
            {incomingInvites.map((invite) => (
              <Card key={invite.id} className="p-4 border-0 shadow-md bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 mb-1">Event Invitation</p>
                    <p className="text-lg font-medium text-slate-900 mb-2">{invite.title}</p>

                    {invite.description && <p className="text-sm text-slate-600 mb-2">{invite.description}</p>}

                    <div className="flex flex-col gap-1 text-sm text-slate-600">
                      {(() => {
                        const eventDate = parseSafeDate(invite.event_datetime);
                        return eventDate ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {eventDate.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                        ) : null;
                      })()}

                      {invite.event_location ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{invite.event_location}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleInviteResponse(invite, 'accepted')}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleInviteResponse(invite, 'declined')}
                    variant="outline"
                    className="flex-1 text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <XIcon className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Gamification Section */}
        {gamification && (
          <div className="mb-6 space-y-4">
            <LevelProgress level={gamification.level} points={gamification.total_points} />
            <StreakDisplay currentStreak={gamification.current_streak} longestStreak={gamification.longest_streak} />

            {gamification.badges?.length > 0 && (
              <Card className="p-4 border-0 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-slate-800">Your Badges</h3>
                  </div>
                  <span className="text-sm text-slate-500">{gamification.badges.length} earned</span>
                </div>
                <BadgeDisplay badges={gamification.badges} />
              </Card>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-4 text-center border-0 shadow-md bg-gradient-to-br from-slate-50 to-slate-100">
            <p className="text-2xl font-bold text-slate-800">{stats.planned}</p>
            <p className="text-xs text-slate-500">Planned</p>
          </Card>
          <Card className="p-4 text-center border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
            <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
            <p className="text-xs text-slate-500">In Progress</p>
          </Card>
          <Card className="p-4 text-center border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-slate-500">Completed</p>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="planned" className="flex-1">Planned</TabsTrigger>
            <TabsTrigger value="in_progress" className="flex-1">Active</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">Done</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Goals List */}
        {filteredGoals.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredGoals.map((goal) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  <GoalCard goal={goal} onClick={() => setSelectedGoal(goal)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <Card className="p-12 text-center border-0 shadow-md">
            <Target className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No goals yet</h3>
            <p className="text-slate-500 mb-4">
              {canEdit ? 'Set goals together and watch them come true' : 'Get Date-Locked to set goals'}
            </p>
            {canEdit && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Set Your First Goal
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Add Goal Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add a Goal</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>What's your goal?</Label>
              <Input
                value={newGoal.title}
                onChange={(e) => setNewGoal((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Visit Paris together"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Add more details..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal((prev) => ({ ...prev, target_date: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select value={newGoal.category} onValueChange={(value) => setNewGoal((prev) => ({ ...prev, category: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canEdit || !newGoal.title.trim() || createGoalMutation.isPending}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              {createGoalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Add Goal
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goal Detail Modal */}
      <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
        <DialogContent className="max-w-md">
          {selectedGoal && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedGoal.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {selectedGoal.description && <p className="text-slate-600">{selectedGoal.description}</p>}

                {canEdit && (
                  <div className="space-y-2">
                    <Label>Update Status</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={selectedGoal.status === 'planned' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateGoalStatus(selectedGoal, 'planned')}
                        className={selectedGoal.status === 'planned' ? 'bg-slate-600' : ''}
                        disabled={updateGoalMutation.isPending}
                      >
                        Planned
                      </Button>

                      <Button
                        variant={selectedGoal.status === 'in_progress' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateGoalStatus(selectedGoal, 'in_progress')}
                        className={selectedGoal.status === 'in_progress' ? 'bg-blue-600' : ''}
                        disabled={updateGoalMutation.isPending}
                      >
                        Active
                      </Button>

                      <Button
                        variant={selectedGoal.status === 'completed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateGoalStatus(selectedGoal, 'completed')}
                        className={selectedGoal.status === 'completed' ? 'bg-green-600' : ''}
                        disabled={updateGoalMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Event Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Event Invitation</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Event Type</Label>
              <Select value={newEvent.event_type} onValueChange={(value) => setNewEvent((prev) => ({ ...prev, event_type: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Event Title</Label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Movie night at Cinema"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Add more details..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={newEvent.event_datetime}
                onChange={(e) => setNewEvent((prev) => ({ ...prev, event_datetime: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Location</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <Input
                  value={newEvent.event_location}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, event_location: e.target.value }))}
                  placeholder="Where will this happen?"
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              onClick={handleEventSubmit}
              disabled={
                !canEdit ||
                !newEvent.title.trim() ||
                !newEvent.event_datetime ||
                !newEvent.event_location.trim() ||
                createEventMutation.isPending
              }
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              {createEventMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reward Animation */}
      <RewardAnimation
        show={showReward}
        points={rewardData?.points}
        badgeName={rewardData?.badgeName}
        onComplete={() => setShowReward(false)}
      />
    </div>
  );
}
