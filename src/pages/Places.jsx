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
  Plus, MapPin, Star, Utensils, Coffee, TreePine, 
  Waves, Hotel, Landmark, Loader2, ArrowLeft, Camera, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { isTrialActive } from '@/components/utils/trial';
import PlaceCard from '@/components/places/PlaceCard';

const categories = [
  { value: 'restaurant', label: 'Restaurant', icon: Utensils },
  { value: 'cafe', label: 'Café', icon: Coffee },
  { value: 'park', label: 'Park', icon: TreePine },
  { value: 'beach', label: 'Beach', icon: Waves },
  { value: 'hotel', label: 'Hotel', icon: Hotel },
  { value: 'attraction', label: 'Attraction', icon: Landmark },
  { value: 'other', label: 'Other', icon: MapPin }
];

export default function Places() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedPlace, setSelectedPlace] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  const [newPlace, setNewPlace] = React.useState({
    name: '',
    category: 'other',
    location: '',
    notes: '',
    rating: 5,
    photo_url: ''
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000
  });

  const canEdit = (user?.relationship_status === 'date_locked' || isTrialActive(user)) && 
    user?.relationship_status !== 'pending_verification' && 
    user?.relationship_status !== 'single';

  const { data: places = [], isLoading } = useQuery({
    queryKey: ['places', user?.couple_profile_id],
    queryFn: () => base44.entities.FavoritePlace.filter({
      couple_profile_id: user.couple_profile_id
    }, '-created_date'),
    enabled: !!user?.couple_profile_id,
    staleTime: 30 * 1000
  });

  const createPlaceMutation = useMutation({
    mutationFn: (placeData) => base44.entities.FavoritePlace.create(placeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['places'] });
      setShowAddModal(false);
      setNewPlace({
        name: '',
        category: 'other',
        location: '',
        notes: '',
        rating: 5,
        photo_url: ''
      });
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewPlace(prev => ({ ...prev, photo_url: file_url }));
    } catch (error) {
      console.error('Photo upload failed:', error);
    }
  };

  const handleSubmit = () => {
    if (!newPlace.name.trim()) return;
    createPlaceMutation.mutate({
      ...newPlace,
      couple_profile_id: user.couple_profile_id
    });
  };

  const filteredPlaces = filter === 'all' 
    ? places 
    : places.filter(p => p.category === filter);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 pb-24">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-slate-800">Favorite Places</h1>
          </div>
          {canEdit && (
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Place
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-rose-500 hover:bg-rose-600' : ''}
          >
            All
          </Button>
          {categories.map(cat => {
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

        {filteredPlaces.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredPlaces.map((place) => (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  <PlaceCard 
                    place={place} 
                    onClick={() => setSelectedPlace(place)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <Card className="p-12 text-center border-0 shadow-md">
            <MapPin className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No places saved</h3>
            <p className="text-slate-500 mb-4">
              {canEdit ? 'Save your favorite spots to visit together' : 'Get Date-Locked to save places'}
            </p>
            {canEdit && (
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Place
              </Button>
            )}
          </Card>
        )}
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add a Favorite Place</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Place Name</Label>
              <Input
                value={newPlace.name}
                onChange={(e) => setNewPlace(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Our Coffee Spot"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={newPlace.category}
                  onValueChange={(value) => setNewPlace(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => {
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
              <div>
                <Label>Rating</Label>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewPlace(prev => ({ ...prev, rating: star }))}
                    >
                      <Star 
                        className={`w-6 h-6 transition-colors ${
                          star <= newPlace.rating 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={newPlace.location}
                  onChange={(e) => setNewPlace(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Address or area"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={newPlace.notes}
                onChange={(e) => setNewPlace(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Why do you love this place?"
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label>Photo</Label>
              <div className="mt-2">
                {newPlace.photo_url ? (
                  <div className="relative h-32 rounded-lg overflow-hidden">
                    <img src={newPlace.photo_url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setNewPlace(prev => ({ ...prev, photo_url: '' }))}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="h-24 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-rose-300 transition-colors">
                    <Camera className="w-6 h-6 text-slate-400" />
                    <span className="text-sm text-slate-400 mt-1">Add photo</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!newPlace.name.trim() || createPlaceMutation.isPending}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              {createPlaceMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Save Place
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPlace} onOpenChange={() => setSelectedPlace(null)}>
        <DialogContent className="max-w-md">
          {selectedPlace && (
            <>
              {selectedPlace.photo_url && (
                <div className="h-40 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg">
                  <img 
                    src={selectedPlace.photo_url} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <DialogHeader>
                <DialogTitle>{selectedPlace.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {selectedPlace.rating && (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${
                          i < selectedPlace.rating 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                )}
                
                {selectedPlace.location && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedPlace.location}</span>
                  </div>
                )}
                
                {selectedPlace.notes && (
                  <p className="text-slate-600">{selectedPlace.notes}</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}