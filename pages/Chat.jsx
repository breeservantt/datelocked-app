import React from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Send,
  Loader2,
  MessageCircle,
  Users,
  UserPlus,
  Plus,
  Check,
  CheckCheck,
  Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { parseSafeDate } from '@/components/utils/dateHelpers';
import GroupChatList from '@/components/chat/GroupChatList';
import CreateGroupDialog from '@/components/chat/CreateGroupDialog';
import InviteMemberDialog from '@/components/chat/InviteMemberDialog';
import EmojiPicker from '@/components/chat/EmojiPicker';

const NOTIFY_AUDIO_SRC =
  'data:audio/wav;base64,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';

const STORAGE_BUCKET = 'chat-media';

export default function Chat() {
  const queryClient = useQueryClient();

  const [newMessage, setNewMessage] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('partner');
  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const [showCreateGroup, setShowCreateGroup] = React.useState(false);
  const [showInvite, setShowInvite] = React.useState(false);

  const messagesEndRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const notifyAudioRef = React.useRef(null);

  React.useEffect(() => {
    notifyAudioRef.current = new Audio(NOTIFY_AUDIO_SRC);
  }, []);

  const playNotify = React.useCallback(() => {
    notifyAudioRef.current?.play().catch(() => {});
  }, []);

  const lastPartnerNotifiedIdRef = React.useRef(null);
  const lastGroupNotifiedIdRef = React.useRef(null);

  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authUser) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileError) throw profileError;

      return {
        id: authUser.id,
        email: authUser.email,
        ...profile,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const isPendingVerification = user?.relationship_status === 'pending_verification';

  const { data: partner } = useQuery({
    queryKey: ['partner', user?.couple_profile_id, user?.id],
    enabled: !!user?.couple_profile_id && !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('couple_profile_id', user.couple_profile_id)
        .neq('id', user.id)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    },
  });

  const { data: partnerMessages = [] } = useQuery({
    queryKey: ['messages', user?.couple_profile_id],
    enabled: !!user?.couple_profile_id && activeTab === 'partner',
    staleTime: 2000,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('couple_profile_id', user.couple_profile_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: myGroups = [] } = useQuery({
    queryKey: ['myGroups', user?.email],
    enabled: !!user?.email && isPendingVerification,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data: memberships, error: membershipsError } = await supabase
        .from('chat_group_members')
        .select('*')
        .eq('user_email', user.email)
        .eq('status', 'active');

      if (membershipsError) throw membershipsError;

      const groupIds = (memberships || []).map((m) => m.chat_group_id).filter(Boolean);
      if (!groupIds.length) return [];

      const { data: groups, error: groupsError } = await supabase
        .from('chat_groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError) throw groupsError;

      const groupsWithCounts = await Promise.all(
        (groups || []).map(async (group) => {
          const { count, error: countError } = await supabase
            .from('chat_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('chat_group_id', group.id)
            .eq('status', 'active');

          if (countError) throw countError;
          return { ...group, memberCount: count || 0 };
        })
      );

      return groupsWithCounts;
    },
  });

  const { data: groupMessages = [] } = useQuery({
    queryKey: ['groupMessages', selectedGroup?.id],
    enabled: !!selectedGroup?.id,
    staleTime: 2000,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('chat_group_id', selectedGroup.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const markPartnerReadMutation = useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase
        .from('messages')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .in('id', ids);

      if (error) throw error;
      return ids;
    },
    onSuccess: (ids) => {
      queryClient.setQueryData(['messages', user?.couple_profile_id], (old = []) =>
        old.map((m) => (ids.includes(m.id) ? { ...m, read: true } : m))
      );
    },
  });

  React.useEffect(() => {
    if (!user?.email) return;
    if (activeTab !== 'partner') return;
    if (!partnerMessages?.length) return;
    if (markPartnerReadMutation.isPending) return;

    const unreadIds = partnerMessages
      .filter((m) => m.sender_email !== user.email && !m.read)
      .map((m) => m.id);

    if (unreadIds.length) {
      markPartnerReadMutation.mutate(unreadIds);
    }
  }, [partnerMessages, user?.email, activeTab]);

  React.useEffect(() => {
    if (!user?.email) return;
    if (!partnerMessages?.length) return;

    const last = partnerMessages[partnerMessages.length - 1];
    if (!last?.id) return;

    const isIncoming = last.sender_email !== user.email;
    const isNew = lastPartnerNotifiedIdRef.current !== last.id;

    if (isIncoming && isNew) {
      lastPartnerNotifiedIdRef.current = last.id;
      playNotify();
    } else if (isNew) {
      lastPartnerNotifiedIdRef.current = last.id;
    }
  }, [partnerMessages, user?.email, playNotify]);

  React.useEffect(() => {
    if (!user?.email) return;
    if (!groupMessages?.length) return;

    const last = groupMessages[groupMessages.length - 1];
    if (!last?.id) return;

    const isIncoming = last.sender_email !== user.email;
    const isNew = lastGroupNotifiedIdRef.current !== last.id;

    if (isIncoming && isNew) {
      lastGroupNotifiedIdRef.current = last.id;
      playNotify();
    } else if (isNew) {
      lastGroupNotifiedIdRef.current = last.id;
    }
  }, [groupMessages, user?.email, playNotify]);

  const sendPartnerMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          ...messageData,
          read: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', user?.couple_profile_id] });
      setNewMessage('');
      inputRef.current?.focus();
    },
  });

  const sendGroupMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const { data, error } = await supabase
        .from('group_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMessages', selectedGroup?.id] });
      setNewMessage('');
      inputRef.current?.focus();
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData) => {
      const { data: group, error: groupError } = await supabase
        .from('chat_groups')
        .insert({
          ...groupData,
          creator_email: user.email,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      const { error: memberError } = await supabase
        .from('chat_group_members')
        .insert({
          chat_group_id: group.id,
          user_email: user.email,
          status: 'active',
        });

      if (memberError) throw memberError;

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups', user?.email] });
      setShowCreateGroup(false);
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (email) => {
      if (!selectedGroup?.id) return;

      const { error } = await supabase
        .from('chat_group_members')
        .insert({
          chat_group_id: selectedGroup.id,
          user_email: email,
          status: 'invited',
        });

      if (error) throw error;
    },
    onSuccess: () => setShowInvite(false),
  });

  const handleFileUpload = React.useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        alert('Please select an image or video file');
        return;
      }

      setIsUploading(true);

      try {
        const ext = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

        const prefix = isImage ? '📷 ' : '🎥 ';
        const content = `${prefix}${publicUrl}`;

        if (selectedGroup?.id) {
          const { error } = await supabase.from('group_messages').insert({
            chat_group_id: selectedGroup.id,
            sender_email: user.email,
            sender_name: user.full_name,
            content,
          });

          if (error) throw error;

          queryClient.invalidateQueries({ queryKey: ['groupMessages', selectedGroup?.id] });
        } else if (user.couple_profile_id) {
          const { error } = await supabase.from('messages').insert({
            couple_profile_id: user.couple_profile_id,
            sender_email: user.email,
            content,
            read: false,
          });

          if (error) throw error;

          queryClient.invalidateQueries({ queryKey: ['messages', user?.couple_profile_id] });
        }

        inputRef.current?.focus();
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload file. Please try again.');
      } finally {
        setIsUploading(false);
      }
    },
    [selectedGroup?.id, user, queryClient]
  );

  const handleSend = React.useCallback(() => {
    if (!user) return;

    const content = newMessage.trim();
    if (!content) return;

    if (selectedGroup?.id) {
      sendGroupMessageMutation.mutate({
        chat_group_id: selectedGroup.id,
        sender_email: user.email,
        sender_name: user.full_name,
        content,
      });
      return;
    }

    if (!user.couple_profile_id) return;

    sendPartnerMessageMutation.mutate({
      couple_profile_id: user.couple_profile_id,
      sender_email: user.email,
      content,
    });
  }, [newMessage, selectedGroup?.id, user]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [partnerMessages, groupMessages]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 pb-24 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading chat...</span>
        </div>
      </div>
    );
  }

  if (isUserError || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 pb-24 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Couldn&apos;t load chat
          </h3>
          <p className="text-slate-500 text-sm">Please check your connection and try again.</p>
          <div className="mt-4">
            <Link to={createPageUrl('Home')}>
              <Button>Go Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!user?.couple_profile_id || user?.relationship_status === 'single') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 pb-24">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-slate-800">Chat</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="p-12 text-center border-0 shadow-md">
            <MessageCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Chat Unavailable</h3>
            <p className="text-slate-500">You need to be Date-Locked to use chat features</p>
          </Card>
        </div>
      </div>
    );
  }

  const displayedMessages = selectedGroup ? groupMessages : partnerMessages;
  const isSending =
    sendPartnerMessageMutation.isPending || sendGroupMessageMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-red-100 flex flex-col pb-24">
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('Home')}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>

              {selectedGroup ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-slate-800">{selectedGroup.name}</h1>
                    <p className="text-xs text-slate-500">{selectedGroup.memberCount} members</p>
                  </div>
                </div>
              ) : partner ? (
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={partner.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-rose-100 to-pink-100 text-rose-500">
                      {partner.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-lg font-semibold text-slate-800">{partner.full_name}</h1>
                    <p className="text-xs text-slate-500">Date-Locked</p>
                  </div>
                </div>
              ) : (
                <h1 className="text-xl font-semibold text-slate-800">Chat</h1>
              )}
            </div>

            {selectedGroup && isPendingVerification && (
              <Button onClick={() => setShowInvite(true)} size="sm" variant="outline">
                <UserPlus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {isPendingVerification && !selectedGroup && (
        <div className="bg-white border-b">
          <div className="max-w-2xl mx-auto px-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="partner" className="flex-1">
                  Partner
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex-1">
                  Groups
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'groups' && !selectedGroup ? (
          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Your Groups</h2>
              <Button
                onClick={() => setShowCreateGroup(true)}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
            <GroupChatList groups={myGroups} onSelectGroup={setSelectedGroup} />
          </div>
        ) : (
          <div className="px-4 py-6 max-w-2xl mx-auto w-full">
            {selectedGroup && (
              <Button onClick={() => setSelectedGroup(null)} variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Groups
              </Button>
            )}

            {displayedMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {displayedMessages.map((msg) => {
                    const isMe = msg.sender_email === user.email;
                    const createdDate = parseSafeDate(msg.created_at || msg.created_date);

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] ${isMe ? 'order-2' : 'order-1'}`}>
                          {selectedGroup && !isMe && (
                            <p className="text-xs text-slate-500 mb-1 px-1">{msg.sender_name}</p>
                          )}

                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              isMe
                                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                                : 'bg-white border border-slate-200 text-slate-800'
                            }`}
                          >
                            {msg.content?.startsWith('📷 ') ? (
                              <img
                                src={msg.content.substring(3)}
                                alt="Shared"
                                className="max-w-full rounded-lg"
                                style={{ maxHeight: '300px' }}
                              />
                            ) : msg.content?.startsWith('🎥 ') ? (
                              <video
                                src={msg.content.substring(3)}
                                controls
                                className="max-w-full rounded-lg"
                                style={{ maxHeight: '300px' }}
                              />
                            ) : (
                              <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                            )}
                          </div>

                          <div
                            className={`flex items-center gap-1 text-xs text-slate-400 mt-1 px-1 ${
                              isMe ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {createdDate ? <span>{format(createdDate, 'h:mm a')}</span> : null}
                            {isMe && !selectedGroup ? (
                              msg.read ? (
                                <CheckCheck className="w-3 h-3 text-blue-500" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )
                            ) : null}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}
      </div>

      {(activeTab !== 'groups' || !!selectedGroup) && (
        <div className="bg-white border-t fixed left-0 right-0 z-20 safe-area-pb" style={{ bottom: '88px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex gap-2 items-end">
              <div className="flex gap-1">
                <EmojiPicker onSelect={(emoji) => setNewMessage((prev) => prev + emoji)} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-slate-500 hover:text-slate-700"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                </Button>
              </div>

              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder="Type a message..."
                className="flex-1"
                disabled={isSending || isUploading}
              />

              <Button
                onClick={handleSend}
                disabled={!newMessage.trim() || isSending || isUploading}
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onCreate={createGroupMutation.mutate}
        isCreating={createGroupMutation.isPending}
      />

      <InviteMemberDialog
        open={showInvite}
        onOpenChange={setShowInvite}
        onInvite={inviteMemberMutation.mutate}
        isInviting={inviteMemberMutation.isPending}
        groupName={selectedGroup?.name}
      />
    </div>
  );
}
