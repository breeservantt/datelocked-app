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
import {
  Plus, Image as ImageIcon, Calendar, MapPin, Heart, Plane,
  Utensils, Star, X, Loader2, Camera, ArrowLeft, Video, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';
import MemoryCard from '@/components/memories/MemoryCard';

const categories = [
  { value: 'date', label: 'Date Night', icon: Heart },
  { value: 'trip', label: 'Trip', icon: Plane },
  { value: 'anniversary', label: 'Anniversary', icon: Star },
  { value: 'milestone', label: 'Milestone', icon: Star },
  { value: 'restaurant', label: 'Restaurant', icon: Utensils },
  { value: 'other', label: 'Other', icon: ImageIcon }
];

const emptyMemory = {
  title: '',
  description: '',
  date: '',
  location: '',
  category: 'other',
  photos: [],
  videos: []
};

export default function Memories() {
  const queryClient = useQueryClient();

  const [user, setUser] = React.useState(null);
  const [memories, setMemories] = React.useState([]);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedMemory, setSelectedMemory] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  const [newMemory, setNewMemory] = React.useState(emptyMemory);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // ✅ LOAD USER + MEMORIES
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;
      setUser(currentUser);

      if (!currentUser?.user_metadata?.couple_profile_id) return;

      const { data: mem } = await supabase
        .from('Memory')
        .select('*')
        .eq('couple_profile_id', currentUser.user_metadata.couple_profile_id)
        .order('created_at', { ascending: false });

      setMemories(mem || []);
    })();
  }, []);

  const coupleId = user?.user_metadata?.couple_profile_id;

  const canEdit =
    user?.user_metadata?.relationship_status === 'date_locked';

  // ✅ CREATE MEMORY
  const handleSubmit = async () => {
    if (!newMemory.title.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase.from('Memory').insert({
      ...newMemory,
      couple_profile_id: coupleId
    });

    if (!error) {
      setShowAddModal(false);
      setNewMemory(emptyMemory);

      const { data: updated } = await supabase
        .from('Memory')
        .select('*')
        .eq('couple_profile_id', coupleId)
        .order('created_at', { ascending: false });

      setMemories(updated || []);

      confetti();
    }

    setIsSubmitting(false);
  };

  // ✅ DELETE
  const handleDelete = async (id) => {
    await supabase.from('Memory').delete().eq('id', id);

    setMemories((prev) => prev.filter((m) => m.id !== id));
    setSelectedMemory(null);
  };

  // ✅ FILTER
  const filteredMemories =
    filter === 'all'
      ? memories
      : memories.filter((m) => m.category === filter);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">

      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Memories</h2>

        {canEdit && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus />
          </Button>
        )}
      </div>

      {/* FILTER */}
      <div className="flex gap-2 mb-4">
        <Button onClick={() => setFilter('all')}>All</Button>
        {categories.map((c) => (
          <Button key={c.value} onClick={() => setFilter(c.value)}>
            {c.label}
          </Button>
        ))}
      </div>

      {/* LIST */}
      {filteredMemories.map((memory) => (
        <MemoryCard
          key={memory.id}
          memory={memory}
          onClick={() => setSelectedMemory(memory)}
        />
      ))}

      {/* ADD MODAL */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Memory</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Title"
            value={newMemory.title}
            onChange={(e) =>
              setNewMemory({ ...newMemory, title: e.target.value })
            }
          />

          <Textarea
            placeholder="Description"
            value={newMemory.description}
            onChange={(e) =>
              setNewMemory({ ...newMemory, description: e.target.value })
            }
          />

          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* DETAIL */}
      {selectedMemory && (
        <Card className="p-4 mt-4">
          <h3>{selectedMemory.title}</h3>
          <p>{selectedMemory.description}</p>

          {canEdit && (
            <Button
              variant="destructive"
              onClick={() => handleDelete(selectedMemory.id)}
            >
              <Trash2 />
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
