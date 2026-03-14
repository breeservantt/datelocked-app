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
import {
  Plus, Image as ImageIcon, Calendar, MapPin, Heart, Plane,
  Utensils, Star, X, Loader2, Camera, ArrowLeft, Video, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { isTrialActive } from '@/components/utils/trial';
import MemoryCard from '@/components/memories/MemoryCard';
import confetti from 'canvas-confetti';

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

  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedMemory, setSelectedMemory] = React.useState(null);
  const [filter, setFilter] = React.useState('all');

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [newMemory, setNewMemory] = React.useState(emptyMemory);

  const [locationSuggestions, setLocationSuggestions] = React.useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = React.useState(false);
  const locationTimerRef = React.useRef(null);
  const lastLocationQueryRef = React.useRef('');

  // --- Queries ---
  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
    refetch: refetchUser
  } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const coupleId = user?.couple_profile_id || null;

  const canEdit =
    !!user &&
    (user.relationship_status === 'date_locked' || isTrialActive(user)) &&
    user.relationship_status !== 'pending_verification' &&
    user.relationship_status !== 'single';

  const {
    data: memories = [],
    isLoading: memoriesLoading,
    isError: memoriesError,
    refetch: refetchMemories
  } = useQuery({
    queryKey: ['memories', coupleId],
    enabled: !!coupleId,
    staleTime: 30 * 1000,
    retry: 1,
    queryFn: () =>
      base44.entities.Memory.filter(
        { couple_profile_id: coupleId },
        '-created_date'
      )
  });

  // --- Mutations (✅ corrected base44 create call) ---
  const createMemoryMutation = useMutation({
    mutationFn: (payload) => base44.entities.Memory.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['memories', coupleId] });
      setShowAddModal(false);
      setNewMemory(emptyMemory);
      setLocationSuggestions([]);

      const duration = 1200;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    },
    onError: (e) => {
      console.error('Error creating memory:', e);
      alert(e?.message || 'Failed to save memory. Please try again.');
    },
    onSettled: () => setIsSubmitting(false)
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: (memoryId) => base44.entities.Memory.delete(memoryId),
    onSuccess: async () => {
      setSelectedMemory(null);
      await queryClient.invalidateQueries({ queryKey: ['memories', coupleId] });
    },
    onError: (e) => {
      console.error('Error deleting memory:', e);
      alert(e?.message || 'Failed to delete memory. Please try again.');
    }
  });

  const handleDeleteMemory = (memoryId) => {
    if (!memoryId) return;
    if (!window.confirm('Delete this memory? This cannot be undone.')) return;
    deleteMemoryMutation.mutate(memoryId);
  };

  // --- Upload helpers ---
  const uploadFile = React.useCallback(async (file) => {
    const res = await base44.integrations.Core.UploadFile({ file });
    return res?.file_url;
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFile(file);
      if (!url) throw new Error('Upload returned no URL');
      setNewMemory((prev) => ({ ...prev, photos: [...prev.photos, url] }));
    } catch (err) {
      console.error('Photo upload failed:', err);
      alert('Failed to upload photo. Please try again.');
    } finally {
      e.target.value = '';
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('Video size must be less than 50MB');
      e.target.value = '';
      return;
    }

    try {
      const url = await uploadFile(file);
      if (!url) throw new Error('Upload returned no URL');
      setNewMemory((prev) => ({ ...prev, videos: [...prev.videos, url] }));
    } catch (err) {
      console.error('Video upload failed:', err);
      alert('Failed to upload video. Please try again.');
    } finally {
      e.target.value = '';
    }
  };

  const removePhoto = (index) => {
    setNewMemory((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const removeVideo = (index) => {
    setNewMemory((prev) => ({ ...prev, videos: prev.videos.filter((_, i) => i !== index) }));
  };

  // --- Location search (debounced) ---
  const searchLocation = React.useCallback(async (query) => {
    const q = (query || '').trim();
    if (q.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    if (q === lastLocationQueryRef.current) return;
    lastLocationQueryRef.current = q;

    setIsSearchingLocation(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest 5 real location names that match: "${q}". Return only JSON like {"locations":["..."]} and nothing else.`,
        response_json_schema: {
          type: 'object',
          properties: {
            locations: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      const locations = Array.isArray(result?.locations) ? result.locations : [];
      setLocationSuggestions(locations.slice(0, 5));
    } catch (err) {
      console.error('Location search failed:', err);
      setLocationSuggestions([]);
    } finally {
      setIsSearchingLocation(false);
    }
  }, []);

  const onLocationChange = (val) => {
    setNewMemory((prev) => ({ ...prev, location: val }));

    if (locationTimerRef.current) clearTimeout(locationTimerRef.current);
    locationTimerRef.current = setTimeout(() => {
      searchLocation(val);
    }, 450);
  };

  React.useEffect(() => {
    return () => {
      if (locationTimerRef.current) clearTimeout(locationTimerRef.current);
    };
  }, []);

  // --- Submit ---
  const handleSubmit = async () => {
    if (!canEdit) {
      alert('Get Date-Locked to create memories.');
      return;
    }
    if (!coupleId) {
      alert('You must be Date-Locked to save memories.');
      return;
    }
    if (!newMemory.title?.trim()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    createMemoryMutation.mutate({
      ...newMemory,
      title: newMemory.title.trim(),
      couple_profile_id: coupleId
    });
  };

  // --- Derived ---
  const filteredMemories = React.useMemo(() => {
    if (filter === 'all') return memories;
    return memories.filter((m) => m.category === filter);
  }, [memories, filter]);

  // --- Loading / error states ---
  if (userLoading || memoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (userError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50 p-4">
        <Card className="max-w-md w-full p-8 text-center border-0 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Something went wrong</h3>
          <p className="text-slate-600 mb-6">Failed to load your profile.</p>
          <Button
            onClick={() => refetchUser()}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (memoriesError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50 p-4">
        <Card className="max-w-md w-full p-8 text-center border-0 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Something went wrong</h3>
          <p className="text-slate-600 mb-6">Failed to load memories.</p>
          <Button
            onClick={() => refetchMemories()}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
          >
            Try Again
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
            <h1 className="text-xl font-semibold text-slate-800">Our Memories</h1>
          </div>

          {canEdit && (
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Memory
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-rose-500 hover:bg-rose-600' : ''}
          >
            All
          </Button>

          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.value}
                variant={filter === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(cat.value)}
                className={filter === cat.value ? 'bg-rose-500 hover:bg-rose-600' : ''}
              >
                <Icon className="w-3 h-3 mr-1" />
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Memory Grid */}
        {filteredMemories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredMemories.map((memory) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  <MemoryCard memory={memory} onClick={() => setSelectedMemory(memory)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <Card className="p-12 text-center border-0 shadow-md">
            <ImageIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No memories yet</h3>
            <p className="text-slate-500 mb-4">
              {canEdit ? 'Start capturing your special moments together' : 'Get Date-Locked to create memories'}
            </p>
            {canEdit && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Memory
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Add Memory Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add a Memory</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Title</Label>
              <Input
                value={newMemory.title}
                onChange={(e) => setNewMemory((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="What happened?"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newMemory.description}
                onChange={(e) => setNewMemory((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Tell the story..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newMemory.date}
                  onChange={(e) => setNewMemory((prev) => ({ ...prev, date: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={newMemory.category}
                  onValueChange={(value) => setNewMemory((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <Input
                  value={newMemory.location}
                  onChange={(e) => onLocationChange(e.target.value)}
                  placeholder="Where was it?"
                  className="pl-10"
                />
                {isSearchingLocation && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                )}
                {locationSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {locationSuggestions.map((location, idx) => (
                      <button
                        key={`${location}-${idx}`}
                        type="button"
                        onClick={() => {
                          setNewMemory((prev) => ({ ...prev, location }));
                          setLocationSuggestions([]);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm"
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ✅ Photos (adjusted: natural size + white border) */}
            <div>
              <Label>Photos</Label>
              <div className="space-y-3 mt-2">
                {newMemory.photos.map((photo, index) => (
                  <div
                    key={`${photo}-${index}`}
                    className="relative w-full min-h-[180px] rounded-lg bg-white border border-slate-200 flex items-center justify-center p-3"
                  >
                    <img
                      src={photo}
                      alt=""
                      className="max-w-full max-h-[55vh] object-contain"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
                      aria-label="Remove photo"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}

                <label className="w-full min-h-[120px] rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-rose-300 transition-colors bg-white">
                  <Camera className="w-6 h-6 text-slate-400" />
                  <span className="text-xs text-slate-400 mt-1">Add Photo</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <Label>Videos</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {newMemory.videos.map((video, index) => (
                  <div key={`${video}-${index}`} className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    <video src={video} className="w-full h-full object-cover" controls preload="metadata" />
                    <button
                      type="button"
                      onClick={() => removeVideo(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
                <label className="aspect-video rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-rose-300 transition-colors">
                  <Video className="w-6 h-6 text-slate-400" />
                  <span className="text-xs text-slate-400 mt-1">Add Video</span>
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!newMemory.title.trim() || isSubmitting || createMemoryMutation.isPending}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              {(isSubmitting || createMemoryMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Save Memory
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Memory Detail Modal */}
      <Dialog open={!!selectedMemory} onOpenChange={() => setSelectedMemory(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto [&>button]:hidden">
          {selectedMemory && (
            <>
              {/* ✅ Top / cover photo (adjusted: white border + no forced stretch) */}
              {selectedMemory.photos?.[0] && (
                <div className="-mx-6 -mt-6 mb-4 rounded-t-lg bg-white border-b border-slate-200 flex items-center justify-center p-3 min-h-[220px]">
                  <img
                    src={selectedMemory.photos[0]}
                    alt=""
                    className="max-w-full max-h-[70vh] object-contain"
                    loading="lazy"
                  />
                </div>
              )}

              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedMemory(null)}>
                    <X className="w-5 h-5" />
                  </Button>

                  {canEdit && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteMemory(selectedMemory.id)}
                      disabled={deleteMemoryMutation.isPending}
                    >
                      {deleteMemoryMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>

                <DialogTitle className="text-left">
                  {selectedMemory.title || 'Memory'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {selectedMemory.description && (
                  <p className="text-slate-600">{selectedMemory.description}</p>
                )}

                {Array.isArray(selectedMemory.videos) && selectedMemory.videos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Videos</Label>
                    {selectedMemory.videos.map((video, index) => (
                      <video
                        key={`${video}-${index}`}
                        src={video}
                        controls
                        className="w-full rounded-lg bg-black"
                        preload="metadata"
                      />
                    ))}
                  </div>
                )}

                {/* ✅ All Photos (natural size + white border) */}
                {Array.isArray(selectedMemory.photos) && selectedMemory.photos.length > 1 && (
                  <div className="space-y-2">
                    <Label>All Photos</Label>
                    <div className="space-y-3">
                      {selectedMemory.photos.map((photo, index) => (
                        <div
                          key={index}
                          className="w-full min-h-[180px] rounded-lg bg-white border border-slate-200 flex items-center justify-center p-3"
                        >
                          <img
                            src={photo}
                            alt=""
                            className="max-w-full max-h-[70vh] object-contain"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  {selectedMemory.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedMemory.date}</span>
                    </div>
                  )}
                  {selectedMemory.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedMemory.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
