import React from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Target, Calendar, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Goals() {
  const queryClient = useQueryClient();

  const [user, setUser] = React.useState(null);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedGoal, setSelectedGoal] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('all');

  const [newGoal, setNewGoal] = React.useState({
    title: '',
    description: '',
    target_date: '',
    category: 'other',
    status: 'planned'
  });

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    })();
  }, []);

  const coupleId = user?.user_metadata?.couple_profile_id || null;

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', coupleId],
    enabled: !!coupleId,
    queryFn: async () => {
      const { data } = await supabase
        .from('CoupleGoal')
        .select('*')
        .eq('couple_profile_id', coupleId)
        .order('created_at', { ascending: false });

      return data || [];
    }
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goalData) => {
      const { error } = await supabase.from('CoupleGoal').insert(goalData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      setShowAddModal(false);
      setNewGoal({
        title: '',
        description: '',
        target_date: '',
        category: 'other',
        status: 'planned'
      });
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('CoupleGoal')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      setSelectedGoal(null);
    }
  });

  const handleSubmit = () => {
    if (!newGoal.title || !coupleId) return;

    createGoalMutation.mutate({
      ...newGoal,
      couple_profile_id: coupleId
    });
  };

  const updateGoalStatus = (goal, status) => {
    updateGoalMutation.mutate({ id: goal.id, status });
  };

  const filteredGoals =
    statusFilter === 'all'
      ? goals
      : goals.filter((g) => g.status === statusFilter);

  if (!user || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">

      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Our Goals</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="planned">Planned</TabsTrigger>
          <TabsTrigger value="in_progress">Active</TabsTrigger>
          <TabsTrigger value="completed">Done</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 space-y-3">
        <AnimatePresence>
          {filteredGoals.map((goal) => (
            <motion.div key={goal.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card
                className="p-4 cursor-pointer"
                onClick={() => setSelectedGoal(goal)}
              >
                <h3 className="font-semibold">{goal.title}</h3>
                <p className="text-sm text-gray-500">{goal.description}</p>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Goal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Goal</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Title"
            value={newGoal.title}
            onChange={(e) =>
              setNewGoal({ ...newGoal, title: e.target.value })
            }
          />

          <Textarea
            placeholder="Description"
            value={newGoal.description}
            onChange={(e) =>
              setNewGoal({ ...newGoal, description: e.target.value })
            }
          />

          <Input
            type="date"
            value={newGoal.target_date}
            onChange={(e) =>
              setNewGoal({ ...newGoal, target_date: e.target.value })
            }
          />

          <Button onClick={handleSubmit}>
            <Target className="w-4 h-4 mr-2" />
            Save Goal
          </Button>
        </DialogContent>
      </Dialog>

      {/* Update Status */}
      <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
        <DialogContent>
          {selectedGoal && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedGoal.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-2">
                <Button onClick={() => updateGoalStatus(selectedGoal, 'planned')}>
                  Planned
                </Button>
                <Button onClick={() => updateGoalStatus(selectedGoal, 'in_progress')}>
                  Active
                </Button>
                <Button onClick={() => updateGoalStatus(selectedGoal, 'completed')}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Done
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
