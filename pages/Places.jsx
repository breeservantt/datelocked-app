import React from 'react';
import { supabase } from '@/lib/supabase';
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
  const [user, setUser] = React.useState(null);
  const [places, setPlaces] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

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

  // ✅ LOAD USER + PLACES
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;

      setUser(currentUser);

      if (!currentUser?.user_metadata?.couple_profile_id) {
        setIsLoading(false);
        return;
      }

      const { data: placesData } = await supabase
        .from('FavoritePlace')
        .select('*')
        .eq('couple_profile_id', currentUser.user_metadata.couple_profile_id)
        .order('created_at', { ascending: false });

      setPlaces(placesData || []);
      setIsLoading(false);
    })();
  }, []);

  const coupleId = user?.user_metadata?.couple_profile_id;

  const canEdit =
    user?.user_metadata?.relationship_status === 'date_locked';

  // ✅ ADD PLACE
  const handleSubmit = async () => {
    if (!newPlace.name.trim()) return;

    const { error } = await supabase.from('FavoritePlace').insert({
      ...newPlace,
      couple_profile_id: coupleId
    });

    if (!error) {
      setShowAddModal(false);
      setNewPlace({
        name: '',
        category: 'other',
        location: '',
        notes: '',
        rating: 5,
        photo_url: ''
      });

      const { data: updated } = await supabase
        .from('FavoritePlace')
        .select('*')
        .eq('couple_profile_id', coupleId)
        .order('created_at', { ascending: false });

      setPlaces(updated || []);
    }
  };

  // ✅ SIMPLE FILE UPLOAD (PLACEHOLDER)
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ⚠️ You will replace this with Supabase Storage later
    const fakeUrl = URL.createObjectURL(file);

    setNewPlace((prev) => ({
      ...prev,
      photo_url: fakeUrl
    }));
  };

  const filteredPlaces =
    filter === 'all'
      ? places
      : places.filter((p) => p.category === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost"><ArrowLeft /></Button>
        </Link>
        <h2 className="font-bold">Favorite Places</h2>

        {canEdit && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus />
          </Button>
        )}
      </div>

      {/* FILTER */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <Button onClick={() => setFilter('all')}>All</Button>
        {categories.map((c) => {
          const Icon = c.icon;
          return (
            <Button key={c.value} onClick={() => setFilter(c.value)}>
              <Icon className="w-3 h-3 mr-1" />
              {c.label}
            </Button>
          );
        })}
      </div>

      {/* LIST */}
      {filteredPlaces.length > 0 ? (
        <div className="space-y-3">
          {filteredPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onClick={() => setSelectedPlace(place)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <MapPin className="mx-auto mb-3" />
          <p>No places yet</p>
        </Card>
      )}

      {/* ADD MODAL */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Place</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Name"
            value={newPlace.name}
            onChange={(e) =>
              setNewPlace({ ...newPlace, name: e.target.value })
            }
          />

          <Textarea
            placeholder="Notes"
            value={newPlace.notes}
            onChange={(e) =>
              setNewPlace({ ...newPlace, notes: e.target.value })
            }
          />

          <input type="file" onChange={handlePhotoUpload} />

          <Button onClick={handleSubmit}>
            Save
          </Button>
        </DialogContent>
      </Dialog>

      {/* DETAIL */}
      {selectedPlace && (
        <Card className="p-4 mt-4">
          <h3>{selectedPlace.name}</h3>
          <p>{selectedPlace.notes}</p>
        </Card>
      )}
    </div>
  );
}
