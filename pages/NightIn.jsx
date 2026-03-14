// ✅ NightIn (FULL PAGE) — 4 games, typing behavior unified to “Two Truths”
// Game 4 is now: ✅ Date-Fit (replaces Quick Dares completely)
// Date-Fit now includes: ✅ 7-day streaks ✅ couple score ✅ weekly program ✅ Rest day
//
// Paste into: Base44 → Code Files → app/src/pages/NightIn.jsx
//
// Guarantees:
// - Typing inputs are LOCAL state (like Two Truths) ✅
// - Server payload writes only on button actions ✅
// - Polling will NOT overwrite what user is typing ✅
// - Key events stopped from bubbling ✅

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Gamepad2,
  Loader2,
  Wifi,
  WifiOff,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Lock,
  CheckCircle2,
  Dumbbell,
  Heart,
  CalendarDays,
  Flame,
  Trophy,
  Coffee,
} from 'lucide-react';
import { toast } from 'sonner';

const POLL_MS = 2500;
const PING_MS = 8000;
const TYPING_TTL_MS = 3000;

const GAME_TWO_TRUTHS = 'TWO_TRUTHS';
const GAME_TWENTY_QUESTIONS = 'TWENTY_QUESTIONS';
const GAME_LOVE_ISLAND = 'LOVE_ISLAND_REMOTE';
const GAME_DATE_FIT = 'DATE_FIT'; // ✅ Replaces Quick Dares completely

const GAME_THEME = {
  [GAME_TWO_TRUTHS]: {
    header: 'bg-gradient-to-r from-rose-500 to-pink-500',
    chip: 'bg-rose-600 text-white',
    btn: 'bg-rose-500 hover:bg-rose-600',
    soft: 'from-rose-50 to-white',
  },
  [GAME_TWENTY_QUESTIONS]: {
    header: 'bg-gradient-to-r from-blue-600 to-indigo-500',
    chip: 'bg-blue-600 text-white',
    btn: 'bg-blue-600 hover:bg-blue-700',
    soft: 'from-blue-50 to-white',
  },
  [GAME_LOVE_ISLAND]: {
    header: 'bg-gradient-to-r from-fuchsia-600 to-purple-600',
    chip: 'bg-fuchsia-600 text-white',
    btn: 'bg-fuchsia-600 hover:bg-fuchsia-700',
    soft: 'from-fuchsia-50 to-white',
  },
  [GAME_DATE_FIT]: {
    header: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    chip: 'bg-emerald-600 text-white',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
    soft: 'from-emerald-50 to-white',
  },
};

/* ---------------- Date-Fit: Weekly Program (HOME ONLY) ----------------
  - Partners mark completed (no photos)
  - Romantic + Serious
  - 7-day streak per user
  - Couple score
  - Rest day allowed
----------------------------------------------------------------------- */

const DATE_FIT_PROGRAMS = {
  Balanced: [
    {
      day: 1,
      title: 'Day 1 — Warm start (Mobility + Core)',
      pack: 'WarmUp',
      workoutIndex: 1,
      minutes: 8,
      intensity: 'Easy',
      notes: 'Start strong but calm. Consistency beats hype.',
    },
    {
      day: 2,
      title: 'Day 2 — Strength base (Full body)',
      pack: 'Strength',
      workoutIndex: 0,
      minutes: 12,
      intensity: 'Medium',
      notes: 'Move slow. Control is love.',
    },
    {
      day: 3,
      title: 'Day 3 — Cardio light (Low impact)',
      pack: 'Cardio',
      workoutIndex: 0,
      minutes: 10,
      intensity: 'Easy',
      notes: 'Breath steady. No rushing.',
    },
    {
      day: 4,
      title: 'Day 4 — Strength (Upper focus)',
      pack: 'Strength',
      workoutIndex: 1,
      minutes: 12,
      intensity: 'Medium',
      notes: 'Small effort, big respect.',
    },
    {
      day: 5,
      title: 'Day 5 — Cardio (HIIT light)',
      pack: 'Cardio',
      workoutIndex: 2,
      minutes: 8,
      intensity: 'Medium',
      notes: 'Finish proud. Don’t overdo it.',
    },
    {
      day: 6,
      title: 'Day 6 — Strength (Leg day)',
      pack: 'Strength',
      workoutIndex: 2,
      minutes: 12,
      intensity: 'Medium',
      notes: 'Legs build stability. Like trust.',
    },
    {
      day: 7,
      title: 'Day 7 — Bond day (Romantic discipline)',
      pack: 'CoupleBond',
      workoutIndex: 0,
      minutes: 6,
      intensity: 'Easy',
      notes: 'Write something serious and real.',
    },
  ],
};

const DATE_FIT_PACKS = {
  WarmUp: [
    { title: '2-minute breathing + intention', task: 'Do 2 minutes calm breathing. Then send (in chat) 1 intention for today.' },
    { title: 'Mobility reset', task: 'Do 10 arm circles + 10 hip circles + 10 bodyweight good mornings.' },
    { title: 'Posture check', task: 'Stand tall for 60 seconds. Shoulders relaxed. Finish with “I’m ready.”' },
  ],
  Strength: [
    { title: 'Core & control', task: '3 rounds: 20s plank + 10 slow squats + 10 glute bridges.' },
    { title: 'Upper body home', task: '3 rounds: 8–12 pushups (knees ok) + 12 chair dips + 20s wall hold.' },
    { title: 'Leg day home', task: '3 rounds: 12 squats + 12 lunges (each) + 20 calf raises.' },
  ],
  Cardio: [
    { title: 'Low-impact cardio', task: '8 minutes: march in place 60s + step touches 60s + repeat 4 times.' },
    { title: 'Stairs / hallway', task: '6 minutes: brisk walk up/down or hallway power-walk. Stay safe.' },
    { title: 'HIIT light', task: '6 rounds: 20s jumping jacks (or step jacks) + 40s rest.' },
  ],
  CoupleBond: [
    { title: 'Romantic discipline', task: 'After workout: write 1 line: “I’m building with you because…” (send in chat).' },
    { title: 'Accountability vow', task: 'Say out loud: “I keep my promises.” Then mark done.' },
    { title: 'Future vision', task: 'Think 30 seconds: “Our healthiest future looks like…” Then mark done.' },
  ],
};

// 100 Love Island stages (remote-friendly; some include optional/required missions)
const LOVE_STAGES = Array.from({ length: 100 }, (_, i) => {
  const n = i + 1;
  const type = n % 12 === 0 ? 'MISSION_REQUIRED' : n % 6 === 0 ? 'MISSION_OPTIONAL' : n % 3 === 0 ? 'DEEP' : 'FUN';
  const requiresMission = type === 'MISSION_REQUIRED';

  const title =
    type === 'MISSION_REQUIRED'
      ? `Stage ${n}: Island Mission (Required)`
      : type === 'MISSION_OPTIONAL'
      ? `Stage ${n}: Island Mission (Optional)`
      : type === 'DEEP'
      ? `Stage ${n}: Deep Talk`
      : `Stage ${n}: Fun & Flirty`;

  const prompts =
    type === 'DEEP'
      ? [
          'What’s one fear you rarely say out loud?',
          'What do you need more of from me this week?',
          'What boundary protects our love, and how can I respect it?',
        ]
      : type === 'MISSION_REQUIRED'
      ? [
          'Send a photo of something that represents “us” (no faces needed).',
          'Record a 10–20 sec voice note: “I’m proud of you because…”',
          'Choose a mini-date idea and schedule a day/time.',
        ]
      : type === 'MISSION_OPTIONAL'
      ? [
          'Share your current mood in 1 word + why.',
          'What’s one thing I do that makes you feel safe?',
          'Choose a “love song” for this week and tell me why.',
        ]
      : [
          'If we had an island villa, what would our rules be?',
          'What’s your favorite feature about me (be specific)?',
          'Describe our next date in 1 sentence.',
        ];

  const mission =
    type === 'MISSION_REQUIRED'
      ? 'Required Mission: Do a 10-minute walk (separately) and send 1 photo of your view + 1 gratitude sentence.'
      : type === 'MISSION_OPTIONAL'
      ? 'Bonus Mission: Do 10 pushups or 20 squats (separately) and send “done”. Celebrate effort.'
      : null;

  const tag =
    type === 'MISSION_REQUIRED' ? 'Mission' : type === 'MISSION_OPTIONAL' ? 'Bonus' : type === 'DEEP' ? 'Deep' : 'Fun';

  return { n, title, prompts, mission, requiresMission, tag };
});

// ✅ SafeInput: stops key events from bubbling (prevents global handlers swallowing typing)
function SafeInput(props) {
  const { onKeyDown, onKeyUp, onKeyPress, ...rest } = props;
  return (
    <Input
      {...rest}
      onKeyDown={(e) => {
        e.stopPropagation();
        onKeyDown?.(e);
      }}
      onKeyUp={(e) => {
        e.stopPropagation();
        onKeyUp?.(e);
      }}
      onKeyPress={(e) => {
        e.stopPropagation();
        onKeyPress?.(e);
      }}
    />
  );
}

export default function NightIn() {
  const [user, setUser] = useState(null);
  const [activeGame, setActiveGame] = useState(GAME_TWO_TRUTHS);
  const [session, setSession] = useState(null);
  const [stateRow, setStateRow] = useState(null);
  const [pingMs, setPingMs] = useState(null);
  const [loading, setLoading] = useState(true);

  const writeTimerRef = useRef(null);
  const pollTimerRef = useRef(null);
  const pingTimerRef = useRef(null);
  const seenAckTimerRef = useRef(null);

  const theme = GAME_THEME[activeGame] || GAME_THEME[GAME_TWO_TRUTHS];

  const clonePayload = (obj) => {
    try {
      // eslint-disable-next-line no-undef
      return structuredClone(obj);
    } catch {
      return JSON.parse(JSON.stringify(obj ?? {}));
    }
  };

  const getPartnerIdFromMap = (obj, currentUserId) => {
    if (!obj || typeof obj !== 'object') return null;
    const keys = Object.keys(obj);
    const other = keys.find((k) => k && k !== String(currentUserId));
    return other || null;
  };

  const loadUser = useCallback(async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (e) {
      console.error('NightIn loadUser error:', e);
      toast.error('Could not load your profile');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const canPlay = useMemo(() => Boolean(user?.couple_profile_id), [user?.couple_profile_id]);

  // Ping
  useEffect(() => {
    let alive = true;

    const tick = async () => {
      try {
        const t0 = Date.now();
        await base44.entities.NightInSession.list('', 1);
        const rtt = Date.now() - t0;
        if (alive) setPingMs(rtt);
      } catch {
        if (alive) setPingMs(999);
      } finally {
        if (alive) pingTimerRef.current = setTimeout(tick, PING_MS);
      }
    };

    tick();
    return () => {
      alive = false;
      if (pingTimerRef.current) clearTimeout(pingTimerRef.current);
    };
  }, []);

  // Ensure session/state exist
  const ensureSession = useCallback(
    async (gameType) => {
      if (!user?.couple_profile_id) return;

      setLoading(true);
      try {
        const existing = await base44.entities.NightInSession.filter({
          couple_profile_id: user.couple_profile_id,
          game_type: gameType,
          status: 'IN_PROGRESS',
        });

        const sess =
          existing?.[0] ||
          (await base44.entities.NightInSession.create({
            couple_profile_id: user.couple_profile_id,
            game_type: gameType,
            status: 'IN_PROGRESS',
            host_user_id: user.id,
          }));

        setSession(sess);

        const states = await base44.entities.NightInState.filter({ session_id: sess.id });
        const srow =
          states?.[0] ||
          (await base44.entities.NightInState.create({
            session_id: sess.id,
            couple_profile_id: user.couple_profile_id,
            game_type: gameType,
            payload: defaultPayloadFor(gameType),
            version: 1,
          }));

        setStateRow(srow);
      } catch (e) {
        console.error('NightIn ensureSession error:', e);
        toast.error('Could not start game');
      } finally {
        setLoading(false);
      }
    },
    [user?.couple_profile_id, user?.id]
  );

  useEffect(() => {
    if (!canPlay) return;
    ensureSession(activeGame);
  }, [activeGame, canPlay, ensureSession]);

  // Update payload (debounced write)
  const updatePayload = useCallback((updaterFn) => {
    setStateRow((prev) => {
      if (!prev?.id) return prev;

      const currentPayload = clonePayload(prev.payload);
      const nextPayloadRaw = updaterFn(currentPayload);

      const nextVersion = (prev.version || 0) + 1;
      const nextPayload = { ...(nextPayloadRaw || {}), _v: nextVersion };

      const optimistic = { ...prev, payload: nextPayload, version: nextVersion };

      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
      writeTimerRef.current = setTimeout(async () => {
        try {
          await base44.entities.NightInState.update(prev.id, { payload: nextPayload, version: nextVersion });
        } catch (e) {
          console.error('NightIn update failed:', e);
        }
      }, 350);

      return optimistic;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
      if (seenAckTimerRef.current) clearTimeout(seenAckTimerRef.current);
    };
  }, []);

  // Read receipts ack
  const ackSeen = useCallback(() => {
    if (!user?.id || !stateRow?.id) return;

    const myId = String(user.id);
    const currentRowVersion = stateRow.version || 0;
    const seen = (stateRow.payload && stateRow.payload.seen) || {};
    const mySeen = seen?.[myId] || 0;

    if (mySeen >= currentRowVersion) return;

    if (seenAckTimerRef.current) clearTimeout(seenAckTimerRef.current);
    seenAckTimerRef.current = setTimeout(() => {
      updatePayload((p) => {
        const nextSeen = { ...(p.seen || {}) };
        nextSeen[myId] = currentRowVersion;
        return { ...p, seen: nextSeen };
      });
    }, 800);
  }, [user?.id, stateRow?.id, stateRow?.version, stateRow?.payload, updatePayload]);

  // Poll
  useEffect(() => {
    if (!session?.id) return;

    let alive = true;

    const poll = async () => {
      try {
        const states = await base44.entities.NightInState.filter({ session_id: session.id });
        const latest = states?.[0];
        if (!alive || !latest) return;

        let didUpdate = false;

        setStateRow((prev) => {
          if (!prev) {
            didUpdate = true;
            return latest;
          }
          if ((latest.version || 0) > (prev.version || 0)) {
            didUpdate = true;
            return latest;
          }
          return prev;
        });

        if (didUpdate) setTimeout(() => alive && ackSeen(), 0);
      } catch (e) {
        console.warn('NightIn poll error:', e);
      } finally {
        if (alive) pollTimerRef.current = setTimeout(poll, POLL_MS);
      }
    };

    poll();

    return () => {
      alive = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [session?.id, ackSeen]);

  useEffect(() => {
    if (stateRow?.id && user?.id) ackSeen();
  }, [stateRow?.id, user?.id]);

  // Meta
  const meta = useMemo(() => {
    const p = stateRow?.payload || {};
    const typing = p.typing || {};
    const seen = p.seen || {};
    const myId = user?.id != null ? String(user.id) : null;

    const partnerId = getPartnerIdFromMap({ ...typing, ...seen }, myId);
    const partnerTypingAt = partnerId ? typing?.[partnerId]?.at : null;
    const partnerTyping =
      !!partnerId && typeof partnerTypingAt === 'number' && Date.now() - partnerTypingAt <= TYPING_TTL_MS;

    const partnerSeen = partnerId ? (seen?.[partnerId] || 0) : 0;
    const currentVersion = stateRow?.version || 0;
    const partnerUpToDate = !!partnerId && partnerSeen >= currentVersion;

    return { partnerId, partnerTyping, partnerUpToDate };
  }, [stateRow?.payload, stateRow?.version, user?.id]);

  if (!canPlay) {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${theme.soft} p-4 pb-24`}>
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-6 h-6" />
              NightIn Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">NightIn is available once you are Date-Locked.</p>
            <p className="text-sm text-gray-500 mt-2">Connect with your partner first to play together.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${theme.soft} p-4 pb-24`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gamepad2 className="w-7 h-7 text-rose-500" />
            NightIn Games
          </h1>

          <Badge variant="outline" className="flex items-center gap-1">
            {pingMs !== null && pingMs < 500 ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {pingMs !== null ? `${pingMs}ms` : '…'}
          </Badge>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">{meta.partnerTyping ? <span>Partner is typing…</span> : <span>&nbsp;</span>}</div>
          <div className="text-sm">{meta.partnerUpToDate ? <Badge>Seen</Badge> : <Badge variant="outline">Not seen yet</Badge>}</div>
        </div>

        {/* 4 games */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button onClick={() => setActiveGame(GAME_TWO_TRUTHS)} variant={activeGame === GAME_TWO_TRUTHS ? 'default' : 'outline'} className="flex-1 min-w-[140px]">
            Two Truths
          </Button>
          <Button onClick={() => setActiveGame(GAME_TWENTY_QUESTIONS)} variant={activeGame === GAME_TWENTY_QUESTIONS ? 'default' : 'outline'} className="flex-1 min-w-[140px]">
            20 Questions
          </Button>
          <Button onClick={() => setActiveGame(GAME_LOVE_ISLAND)} variant={activeGame === GAME_LOVE_ISLAND ? 'default' : 'outline'} className="flex-1 min-w-[140px]">
            Love Island
          </Button>
          <Button onClick={() => setActiveGame(GAME_DATE_FIT)} variant={activeGame === GAME_DATE_FIT ? 'default' : 'outline'} className="flex-1 min-w-[140px]">
            Date-Fit
          </Button>
        </div>

        {loading || !session || !stateRow ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500" />
            </CardContent>
          </Card>
        ) : (
          <GameShell
            session={session}
            stateRow={stateRow}
            currentUserId={user?.id}
            updatePayload={updatePayload}
            onReset={async () => {
              if (!stateRow?.id) return;

              const resetPayload = defaultPayloadFor(activeGame);
              const seen = stateRow.payload?.seen || {};
              const nextMeta = { seen, typing: {} };

              const nextVersion = (stateRow.version || 0) + 1;
              const payload = { ...resetPayload, ...nextMeta, _v: nextVersion };

              setStateRow({ ...stateRow, payload, version: nextVersion });

              try {
                await base44.entities.NightInState.update(stateRow.id, { payload, version: nextVersion });
              } catch (e) {
                console.error('NightIn reset failed:', e);
                toast.error('Reset failed');
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function GameShell({ session, stateRow, currentUserId, updatePayload, onReset }) {
  const t = GAME_THEME[session.game_type] || GAME_THEME[GAME_TWO_TRUTHS];
  const title =
    session.game_type === GAME_TWO_TRUTHS
      ? 'Two Truths and a Lie'
      : session.game_type === GAME_TWENTY_QUESTIONS
      ? '20 Questions'
      : session.game_type === GAME_LOVE_ISLAND
      ? 'Love Island (Remote • 100 Stages)'
      : 'Date-Fit (Home • Streaks • Score • Weekly)';

  return (
    <Card className="overflow-hidden">
      <div className={`${t.header} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="text-white font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> {title}
          </div>
          <Button onClick={onReset} variant="secondary" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Reset
          </Button>
        </div>
      </div>

      <CardContent className="pt-4">
        {session.game_type === GAME_TWO_TRUTHS ? (
          <TwoTruthsGame payload={stateRow.payload} currentUserId={currentUserId} setPayload={updatePayload} />
        ) : session.game_type === GAME_TWENTY_QUESTIONS ? (
          <TwentyQuestionsGame payload={stateRow.payload} currentUserId={currentUserId} setPayload={updatePayload} />
        ) : session.game_type === GAME_LOVE_ISLAND ? (
          <LoveIslandGame payload={stateRow.payload} currentUserId={currentUserId} setPayload={updatePayload} />
        ) : (
          <DateFitGame payload={stateRow.payload} currentUserId={currentUserId} setPayload={updatePayload} />
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- GAME 1: Two Truths ---------------- */
function TwoTruthsGame({ payload, currentUserId, setPayload }) {
  const phase = payload?.phase || 'ENTER';
  const isAuthor = payload?.authorId === currentUserId;
  const t = GAME_THEME[GAME_TWO_TRUTHS];

  const [localStatements, setLocalStatements] = useState(
    Array.isArray(payload?.statements)
      ? payload.statements
      : [{ id: 's1', text: '' }, { id: 's2', text: '' }, { id: 's3', text: '' }]
  );
  const [localLieIndex, setLocalLieIndex] = useState(payload?.lieIndex ?? null);

  useEffect(() => {
    setLocalStatements(
      Array.isArray(payload?.statements)
        ? payload.statements
        : [{ id: 's1', text: '' }, { id: 's2', text: '' }, { id: 's3', text: '' }]
    );
    setLocalLieIndex(payload?.lieIndex ?? null);
  }, [payload?.phase, payload?.authorId, payload?.lieIndex, payload?.guessByPartner]);

  const startRound = () => {
    setPayload((p) => ({
      ...p,
      phase: 'ENTER',
      authorId: currentUserId,
      statements: [{ id: 's1', text: '' }, { id: 's2', text: '' }, { id: 's3', text: '' }],
      lieIndex: null,
      guessByPartner: null,
    }));
  };

  const submitStatements = () => {
    const filled = localStatements.every((s) => (s.text || '').trim().length >= 3);
    if (!filled || localLieIndex === null) return;

    setPayload((p) => ({
      ...p,
      phase: 'GUESS',
      authorId: currentUserId,
      statements: localStatements.map((s) => ({ ...s, text: s.text.trim() })),
      lieIndex: localLieIndex,
      guessByPartner: null,
    }));
  };

  const submitGuess = (guessIndex) => {
    setPayload((p) => ({ ...p, guessByPartner: guessIndex, phase: 'REVEAL' }));
  };

  return (
    <div className="space-y-4">
      <Button onClick={startRound} className={`w-full ${t.btn}`}>
        Start New Round
      </Button>

      {phase === 'ENTER' && isAuthor && (
        <>
          <p className="font-semibold">Write 3 statements. Choose which one is the lie.</p>

          {localStatements.map((s, idx) => (
            <div key={s.id} className="space-y-2">
              <SafeInput
                value={s.text}
                placeholder={`Statement ${idx + 1}`}
                onChange={(e) => {
                  const next = localStatements.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x));
                  setLocalStatements(next);
                }}
              />

              <label className="flex items-center gap-2">
                <input type="radio" checked={localLieIndex === idx} onChange={() => setLocalLieIndex(idx)} className="w-4 h-4" />
                <span className="text-sm">This is the lie</span>
              </label>
            </div>
          ))}

          <Button
            onClick={submitStatements}
            disabled={localLieIndex === null || localStatements.some((s) => (s.text || '').trim().length < 3)}
            className={`w-full ${t.btn}`}
          >
            Send to Partner
          </Button>
        </>
      )}

      {phase === 'ENTER' && !isAuthor && <p className="text-gray-600">Waiting for your partner to start…</p>}

      {phase === 'GUESS' && !isAuthor && Array.isArray(payload?.statements) && (
        <>
          <p className="font-semibold">Which one is the lie?</p>
          {payload.statements.map((s, idx) => (
            <div key={s.id} className="flex items-center justify-between p-3 border rounded bg-white">
              <span>
                {idx + 1}. {s.text}
              </span>
              <Button onClick={() => submitGuess(idx)} size="sm" className={t.btn}>
                Pick
              </Button>
            </div>
          ))}
        </>
      )}

      {phase === 'GUESS' && isAuthor && <p className="text-gray-600">Sent. Waiting for your partner&apos;s guess…</p>}

      {phase === 'REVEAL' && Array.isArray(payload?.statements) && (
        <>
          <p className="font-bold text-lg">Reveal</p>
          {payload.statements.map((s, idx) => {
            const isLie = idx === payload.lieIndex;
            const guessed = idx === payload.guessByPartner;
            return (
              <div key={s.id} className="flex items-center justify-between p-3 border rounded bg-white">
                <span>
                  {idx + 1}. {s.text} {isLie ? '(LIE)' : '(TRUTH)'}
                </span>
                {guessed && <Badge className={t.chip}>Partner Pick</Badge>}
              </div>
            );
          })}
          <p className="font-bold text-center">{payload.guessByPartner === payload.lieIndex ? '✅ Correct guess!' : '❌ Not quite!'}</p>
        </>
      )}
    </div>
  );
}

/* ---------------- GAME 2: 20 Questions ---------------- */
function TwentyQuestionsGame({ payload, currentUserId, setPayload }) {
  const phase = payload?.phase || 'CHOOSE';
  const t = GAME_THEME[GAME_TWENTY_QUESTIONS];

  const [category, setCategory] = useState(payload?.answerCategory || 'Thing');
  const [hint, setHint] = useState(payload?.secretHint || '');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (phase === 'CHOOSE') {
      setCategory(payload?.answerCategory || 'Thing');
      setHint(payload?.secretHint || '');
      setDraft('');
    }
  }, [phase, payload?.answerCategory, payload?.secretHint]);

  const startGame = () => {
    setPayload((p) => ({
      ...p,
      phase: 'ASK',
      chooserId: currentUserId,
      answerCategory: category,
      secretHint: (hint || '').trim(),
      qCount: 0,
      log: [],
      winnerUserId: null,
    }));
  };

  const addLog = (type) => {
    const text = (draft || '').trim();
    if (!text) return;

    setPayload((p) => {
      const log = Array.isArray(p.log) ? [...p.log] : [];
      let qCount = p.qCount || 0;
      if (type === 'Q') qCount = Math.min(20, qCount + 1);

      log.push({ byUserId: currentUserId, type, text, createdAt: new Date().toISOString() });

      const nextPhase = qCount >= 20 ? 'END' : p.phase;
      return { ...p, log: log.slice(-80), qCount, phase: nextPhase };
    });

    setDraft('');
  };

  const endWithWinner = (winnerLabel) => {
    setPayload((p) => ({ ...p, phase: 'END', winnerUserId: winnerLabel }));
  };

  return (
    <div className="space-y-4">
      {phase === 'CHOOSE' && (
        <>
          <p className="font-semibold">One partner chooses a secret answer and starts the round.</p>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {['Person', 'Place', 'Thing', 'Memory', 'Date Idea', 'Movie', 'Song'].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <SafeInput value={hint} placeholder="Optional hint (not the answer)" onChange={(e) => setHint(e.target.value)} />

          <Button onClick={startGame} className={`w-full ${t.btn}`}>
            Start 20 Questions
          </Button>
        </>
      )}

      {phase === 'ASK' && (
        <>
          <div className="flex items-center justify-between">
            <Badge className={t.chip}>Questions: {payload?.qCount || 0}/20</Badge>
            <span className="text-sm">Category: {payload?.answerCategory}</span>
          </div>

          {payload?.secretHint ? <p className="text-sm text-gray-600">Hint: {payload.secretHint}</p> : null}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(payload?.log || []).map((it, idx) => (
              <div
                key={idx}
                className={`p-2 rounded border ${
                  it.byUserId === currentUserId ? 'ml-auto bg-blue-50' : 'mr-auto bg-gray-50'
                } max-w-[80%]`}
              >
                <p className="text-xs font-bold">
                  {it.type} · {it.byUserId === currentUserId ? 'You' : 'Partner'}
                </p>
                <p className="text-sm">{it.text}</p>
              </div>
            ))}
          </div>

          <SafeInput value={draft} placeholder="Type here…" onChange={(e) => setDraft(e.target.value)} />

          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => addLog('Q')} disabled={!draft.trim()} size="sm" className={t.btn}>
              Ask (Q)
            </Button>
            <Button onClick={() => addLog('A')} disabled={!draft.trim()} size="sm" className={t.btn}>
              Answer (A)
            </Button>
            <Button onClick={() => addLog('GUESS')} disabled={!draft.trim()} size="sm" className={t.btn}>
              Guess
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => endWithWinner('YOU')} variant="outline" size="sm">
              I guessed it ✅
            </Button>
            <Button onClick={() => endWithWinner('PARTNER')} variant="outline" size="sm">
              Partner guessed ✅
            </Button>
          </div>
        </>
      )}

      {phase === 'END' && (
        <>
          <p className="font-bold">Round Finished</p>
          {payload?.winnerUserId ? (
            <p>Winner: {payload.winnerUserId === 'YOU' ? 'You' : payload.winnerUserId === 'PARTNER' ? 'Partner' : '—'}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

/* ---------------- GAME 3: Love Island ---------------- */
function LoveIslandGame({ payload, currentUserId, setPayload }) {
  const t = GAME_THEME[GAME_LOVE_ISLAND];
  const myId = String(currentUserId);

  const stageNum = Math.min(Math.max(Number(payload?.stage || 1), 1), 100);
  const stage = LOVE_STAGES[stageNum - 1];

  const stages = payload?.stages || {};
  const stageData = stages?.[stageNum] || {};
  const submitted = stageData.submitted || {};
  const answers = stageData.answers || {};
  const physicalDone = stageData.physicalDone || {};

  const mySubmitted = !!submitted?.[myId];

  const partnerId = useMemo(() => {
    const ids = new Set([...Object.keys(submitted), ...Object.keys(answers), ...Object.keys(physicalDone)]);
    ids.delete(myId);
    return Array.from(ids)[0] || null;
  }, [submitted, answers, physicalDone, myId]);

  const partnerSubmitted = partnerId ? !!submitted?.[partnerId] : false;
  const bothSubmitted = mySubmitted && partnerSubmitted;

  const myPhysical = !!physicalDone?.[myId];
  const partnerPhysical = partnerId ? !!physicalDone?.[partnerId] : false;
  const bothPhysical = myPhysical && partnerPhysical;

  const canUnlock = bothSubmitted && (!stage.requiresMission || bothPhysical);

  const [a1, setA1] = useState('');
  const [a2, setA2] = useState('');
  const [a3, setA3] = useState('');
  const [note, setNote] = useState('');

  const lastStageRef = useRef(null);
  useEffect(() => {
    if (lastStageRef.current === stageNum) return;
    lastStageRef.current = stageNum;

    const mine = answers?.[myId] || null;
    setA1(mine?.a1 || '');
    setA2(mine?.a2 || '');
    setA3(mine?.a3 || '');
    setNote(mine?.note || '');
  }, [stageNum, answers, myId]);

  const submit = () => {
    const x1 = (a1 || '').trim();
    const x2 = (a2 || '').trim();
    const x3 = (a3 || '').trim();
    if (!x1 || !x2 || !x3) {
      toast.error('Answer all 3 questions before submitting.');
      return;
    }

    setPayload((p) => {
      const nextStages = { ...(p.stages || {}) };
      const current = { ...(nextStages[stageNum] || {}) };

      const nextAnswers = { ...(current.answers || {}) };
      nextAnswers[myId] = { a1: x1, a2: x2, a3: x3, note: (note || '').trim(), at: new Date().toISOString() };

      const nextSubmitted = { ...(current.submitted || {}) };
      nextSubmitted[myId] = true;

      nextStages[stageNum] = {
        ...current,
        answers: nextAnswers,
        submitted: nextSubmitted,
        physicalDone: { ...(current.physicalDone || {}) },
      };

      return { ...p, stage: stageNum, stages: nextStages };
    });

    toast.success('Submitted ✅');
  };

  const togglePhysicalDone = () => {
    setPayload((p) => {
      const nextStages = { ...(p.stages || {}) };
      const current = { ...(nextStages[stageNum] || {}) };
      const nextPhysical = { ...(current.physicalDone || {}) };
      nextPhysical[myId] = !nextPhysical[myId];

      nextStages[stageNum] = {
        ...current,
        physicalDone: nextPhysical,
        answers: { ...(current.answers || {}) },
        submitted: { ...(current.submitted || {}) },
      };

      return { ...p, stage: stageNum, stages: nextStages };
    });
  };

  const unlockNext = () => {
    if (!bothSubmitted) {
      toast.error('Both partners must submit answers to unlock the next stage.');
      return;
    }
    if (stage.requiresMission && !bothPhysical) {
      toast.error('This stage requires the mission. Both must mark it done.');
      return;
    }
    setPayload((p) => ({ ...p, stage: Math.min(stageNum + 1, 100) }));
  };

  const partnerAnswers = partnerId ? answers?.[partnerId] || null : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge className={t.chip}>
          {stage.tag} • Stage {stageNum}/100
        </Badge>
        {canUnlock ? <Badge className="bg-green-600 text-white">Ready</Badge> : <Badge variant="outline">In Progress</Badge>}
      </div>

      <div className="p-4 rounded-2xl border bg-white">
        <div className="text-lg font-bold">{stage.title}</div>

        {stage.mission ? (
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
            <div className="text-xs font-bold text-amber-700">{stage.requiresMission ? 'Mission (Required)' : 'Mission (Optional)'}</div>
            <div className="text-sm text-gray-800 mt-1">{stage.mission}</div>

            <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-white border">
              <div className="text-sm">
                You:{' '}
                <span className={myPhysical ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                  {myPhysical ? 'Done' : 'Not done'}
                </span>
                {partnerId ? (
                  <>
                    {' '}• Partner:{' '}
                    <span className={partnerPhysical ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                      {partnerPhysical ? 'Done' : 'Not done'}
                    </span>
                  </>
                ) : null}
              </div>
              <Button variant="outline" size="sm" onClick={togglePhysicalDone}>
                {myPhysical ? 'Undo' : 'Mark Done'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="p-4 rounded-2xl border bg-white space-y-3">
        <div className="font-semibold">Your Answers</div>

        <div className="space-y-1">
          <div className="text-sm font-medium">1) {stage.prompts[0]}</div>
          <SafeInput value={a1} onChange={(e) => setA1(e.target.value)} disabled={mySubmitted} placeholder="Type your answer…" />
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">2) {stage.prompts[1]}</div>
          <SafeInput value={a2} onChange={(e) => setA2(e.target.value)} disabled={mySubmitted} placeholder="Type your answer…" />
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">3) {stage.prompts[2]}</div>
          <SafeInput value={a3} onChange={(e) => setA3(e.target.value)} disabled={mySubmitted} placeholder="Type your answer…" />
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Note (optional)</div>
          <SafeInput value={note} onChange={(e) => setNote(e.target.value)} disabled={mySubmitted} placeholder="Add a sweet note…" />
        </div>

        <Button className={`w-full ${t.btn}`} onClick={submit} disabled={mySubmitted}>
          {mySubmitted ? 'Submitted' : 'Submit Answers'}
        </Button>

        <div className="text-xs text-gray-500">
          Reveal unlocks after BOTH submit. {stage.requiresMission ? 'Mission required to unlock next stage.' : ''}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border">
        <div className="text-sm">
          You: <span className={mySubmitted ? 'text-green-600 font-semibold' : 'text-gray-600'}>{mySubmitted ? 'Submitted' : 'Not submitted'}</span>
        </div>
        <div className="text-sm">
          Partner:{' '}
          <span className={partnerSubmitted ? 'text-green-600 font-semibold' : 'text-gray-600'}>
            {partnerSubmitted ? 'Submitted' : 'Not submitted'}
          </span>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Reveal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!bothSubmitted ? (
            <p className="text-sm text-gray-600">Reveal unlocks after BOTH submit.</p>
          ) : (
            <div className="p-3 rounded border bg-gray-50">
              <div className="text-xs font-bold mb-1">Partner</div>
              {partnerAnswers ? (
                <>
                  <div className="text-sm whitespace-pre-wrap">{partnerAnswers.a1 || '-'}</div>
                  <div className="text-sm whitespace-pre-wrap mt-2">{partnerAnswers.a2 || '-'}</div>
                  <div className="text-sm whitespace-pre-wrap mt-2">{partnerAnswers.a3 || '-'}</div>
                  {partnerAnswers.note ? <div className="text-sm mt-2 italic">“{partnerAnswers.note}”</div> : null}
                </>
              ) : (
                <div className="text-sm text-gray-600">Partner answers not loaded yet…</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Button className={`w-full ${canUnlock ? t.btn : ''}`} variant={canUnlock ? 'default' : 'outline'} onClick={unlockNext}>
        {canUnlock ? (
          <>
            <ChevronRight className="w-4 h-4 mr-2" /> Unlock Next Stage
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" /> Complete together to unlock
          </>
        )}
      </Button>
    </div>
  );
}

/* ---------------- GAME 4: Date-Fit (Streaks + Score + Weekly + Rest) ---------------- */
function DateFitGame({ payload, currentUserId, setPayload }) {
  const t = GAME_THEME[GAME_DATE_FIT];
  const myId = String(currentUserId);

  // Program settings
  const programName = payload?.program || 'Balanced';
  const weekDay = Math.min(Math.max(Number(payload?.weekDay || 1), 1), 7);

  const program = DATE_FIT_PROGRAMS[programName] || DATE_FIT_PROGRAMS.Balanced;
  const todayPlan = program[weekDay - 1] || program[0];

  // Manual pack/index (still available, but program drives default)
  const pack = payload?.pack || todayPlan.pack;
  const idx = Number(payload?.index ?? todayPlan.workoutIndex);

  const workouts = DATE_FIT_PACKS[pack] || DATE_FIT_PACKS.WarmUp;
  const workout = workouts[idx % workouts.length];

  // Completion map
  const done = payload?.done || {};
  const statusMap = payload?.status || {}; // { userId: "DONE" | "REST" }
  const myStatus = statusMap?.[myId] || null;
  const myDone = !!done?.[myId];

  const partnerId = Object.keys({ ...done, ...statusMap }).find((k) => k !== myId) || null;
  const partnerDone = partnerId ? !!done[partnerId] : false;
  const partnerStatus = partnerId ? statusMap?.[partnerId] || null : null;

  const bothCompleted = myDone && partnerDone;
  const bothHaveStatus =
    (myStatus === 'DONE' || myStatus === 'REST') && (partnerStatus === 'DONE' || partnerStatus === 'REST');

  // Scores / streaks (per user)
  const score = payload?.score || {}; // { userId: number }
  const streak = payload?.streak || {}; // { userId: number } capped at 7
  const lastDayCompleted = payload?.lastDayCompleted || {}; // { userId: number } last weekDay they completed

  const myScore = Number(score?.[myId] || 0);
  const partnerScore = partnerId ? Number(score?.[partnerId] || 0) : 0;

  const myStreak = Number(streak?.[myId] || 0);
  const partnerStreak = partnerId ? Number(streak?.[partnerId] || 0) : 0;

  const coupleScore = myScore + partnerScore;

  const statusLabel = (s) => (s === 'DONE' ? 'Done' : s === 'REST' ? 'Rest' : '—');

  // 🔒 Lock next until both partners have chosen DONE/REST
  const canGoNextDay = bothHaveStatus;

  const setProgram = (name) => {
    setPayload((p) => ({
      ...p,
      program: name,
      weekDay: 1,
      // reset day-specific status
      done: {},
      status: {},
      pack: (DATE_FIT_PROGRAMS[name] || DATE_FIT_PROGRAMS.Balanced)[0]?.pack || 'WarmUp',
      index: (DATE_FIT_PROGRAMS[name] || DATE_FIT_PROGRAMS.Balanced)[0]?.workoutIndex ?? 0,
    }));
  };

  const setDay = (day) => {
    const d = Math.min(Math.max(Number(day || 1), 1), 7);
    const plan = program[d - 1] || program[0];
    setPayload((p) => ({
      ...p,
      weekDay: d,
      done: {},
      status: {},
      pack: plan.pack,
      index: plan.workoutIndex,
    }));
  };

  const markDone = () => {
    if (myStatus === 'REST') {
      toast.error('You marked Rest. Undo Rest first if you want to mark Done.');
      return;
    }

    setPayload((p) => {
      const nextDone = { ...(p.done || {}) };
      nextDone[myId] = true;

      const nextStatus = { ...(p.status || {}) };
      nextStatus[myId] = 'DONE';

      // Score: +10 for done
      const nextScore = { ...(p.score || {}) };
      nextScore[myId] = Number(nextScore[myId] || 0) + 10;

      // Streak logic (cap at 7)
      const nextStreak = { ...(p.streak || {}) };
      const nextLast = { ...(p.lastDayCompleted || {}) };
      const lastDay = Number(nextLast[myId] || 0);

      // If they complete day in sequence, streak++ else reset to 1
      let s = Number(nextStreak[myId] || 0);
      if (lastDay === (p.weekDay || weekDay) - 1 || (lastDay === 7 && (p.weekDay || weekDay) === 1)) {
        s = s + 1;
      } else {
        s = 1;
      }
      nextStreak[myId] = Math.min(7, s);
      nextLast[myId] = p.weekDay || weekDay;

      return { ...p, done: nextDone, status: nextStatus, score: nextScore, streak: nextStreak, lastDayCompleted: nextLast };
    });

    toast.success('Marked Done ✅');
  };

  const markRest = () => {
    if (myDone) {
      toast.error('You already marked Done. Undo Done first if you want Rest.');
      return;
    }

    setPayload((p) => {
      const nextStatus = { ...(p.status || {}) };
      nextStatus[myId] = 'REST';

      // Score: +3 for Rest day (serious but realistic)
      const nextScore = { ...(p.score || {}) };
      nextScore[myId] = Number(nextScore[myId] || 0) + 3;

      // Streak does NOT increase on Rest (keeps current)
      const nextStreak = { ...(p.streak || {}) };
      const current = Number(nextStreak[myId] || 0);
      nextStreak[myId] = Math.min(7, current);

      return { ...p, status: nextStatus, score: nextScore, streak: nextStreak };
    });

    toast.success('Rest day saved ☕');
  };

  const undoMyChoice = () => {
    setPayload((p) => {
      const nextDone = { ...(p.done || {}) };
      delete nextDone[myId];

      const nextStatus = { ...(p.status || {}) };
      delete nextStatus[myId];

      // No score rollback (keeps it simple + avoids edge cases)
      return { ...p, done: nextDone, status: nextStatus };
    });
    toast.success('Undone');
  };

  const nextDay = () => {
    if (!canGoNextDay) {
      toast.error('Both partners must choose Done or Rest to move to the next day.');
      return;
    }

    const next = weekDay >= 7 ? 1 : weekDay + 1;
    setDay(next);
  };

  const pickWorkoutFromProgram = () => {
    // Force plan values (in case user changed pack/index manually)
    setPayload((p) => ({
      ...p,
      pack: todayPlan.pack,
      index: todayPlan.workoutIndex,
    }));
    toast.success('Program applied ✅');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-2xl border bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="font-bold text-gray-900">Date-Fit</div>
              <div className="text-xs text-gray-500">Home only • Romantic + Serious • Consistency wins</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={t.chip}>
              <Trophy className="w-3 h-3 mr-1" />
              Couple: {coupleScore}
            </Badge>
          </div>
        </div>

        {/* Streaks */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl border bg-emerald-50/40">
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <Flame className="w-3 h-3" /> Your streak
            </div>
            <div className="text-lg font-bold text-gray-900">{myStreak}/7</div>
            <div className="text-xs text-gray-500">Score: {myScore}</div>
          </div>

          <div className="p-3 rounded-xl border bg-emerald-50/40">
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <Flame className="w-3 h-3" /> Partner streak
            </div>
            <div className="text-lg font-bold text-gray-900">{partnerId ? `${partnerStreak}/7` : '—'}</div>
            <div className="text-xs text-gray-500">Score: {partnerId ? partnerScore : '—'}</div>
          </div>
        </div>
      </div>

      {/* Weekly program controls */}
      <div className="p-4 rounded-2xl border bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Weekly Program
          </div>
          <Badge variant="outline">{programName}</Badge>
        </div>

        <Select value={programName} onValueChange={setProgram}>
          <SelectTrigger>
            <SelectValue placeholder="Select program" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(DATE_FIT_PROGRAMS).map((k) => (
              <SelectItem key={k} value={k}>
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Day picker */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => {
            const active = d === weekDay;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                className={`h-9 rounded-lg border text-sm font-semibold transition ${
                  active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-slate-50'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>

        <div className="p-3 rounded-xl border bg-slate-50">
          <div className="text-xs text-gray-500 mb-1">Today (Day {weekDay})</div>
          <div className="font-bold text-gray-900">{todayPlan.title}</div>
          <div className="text-sm text-gray-700 mt-1">
            {todayPlan.minutes} min • {todayPlan.intensity}
          </div>
          <div className="text-sm text-gray-600 mt-2">{todayPlan.notes}</div>

          <div className="mt-3 flex gap-2">
            <Button onClick={pickWorkoutFromProgram} className={t.btn} size="sm">
              Use today’s plan
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.message('Tip', { description: 'Done = +10 score. Rest = +3 score. Streak increases only on Done.' })}>
              How scoring works
            </Button>
          </div>
        </div>
      </div>

      {/* Workout (pack + challenge) */}
      <div className="p-4 rounded-2xl border bg-white">
        <div className="flex items-center justify-between gap-2">
          <Badge className={t.chip}>Pack: {pack}</Badge>
          <Badge variant="outline">Challenge {idx + 1}</Badge>
        </div>

        <div className="mt-3">
          <div className="text-sm text-gray-500 mb-1">Today’s Challenge</div>
          <div className="text-lg font-bold text-gray-900">{workout.title}</div>
          <div className="mt-2 text-sm text-gray-700">{workout.task}</div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 flex items-start gap-2">
          <Heart className="w-4 h-4 text-emerald-700 mt-0.5" />
          <div className="text-sm text-emerald-900">
            <span className="font-semibold">Couple rule:</span> both of you must choose <span className="font-semibold">Done</span> or <span className="font-semibold">Rest</span> before Day {weekDay >= 7 ? 1 : weekDay + 1} unlocks.
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border">
        <div className="text-sm">
          You:{' '}
          <span className={(myStatus ? 'text-gray-900 font-semibold' : 'text-gray-600')}>
            {statusLabel(myStatus)}
          </span>
        </div>
        <div className="text-sm">
          Partner:{' '}
          <span className={(partnerStatus ? 'text-gray-900 font-semibold' : 'text-gray-600')}>
            {partnerId ? statusLabel(partnerStatus) : '—'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Button className={t.btn} onClick={markDone} disabled={myStatus === 'DONE'}>
          <CheckCircle2 className="w-4 h-4 mr-2" /> Done
        </Button>
        <Button variant="outline" onClick={markRest} disabled={myStatus === 'REST'}>
          <Coffee className="w-4 h-4 mr-2" /> Rest
        </Button>
        <Button variant="outline" onClick={undoMyChoice} disabled={!myStatus}>
          Undo
        </Button>
      </div>

      <Button onClick={nextDay} className={`w-full ${canGoNextDay ? t.btn : ''}`} variant={canGoNextDay ? 'default' : 'outline'}>
        {canGoNextDay ? (
          <>
            <ChevronRight className="w-4 h-4 mr-2" /> Next Day
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" /> Both must choose Done/Rest
          </>
        )}
      </Button>

      {/* Optional pack picker (still allowed) */}
      <details className="p-4 rounded-2xl border bg-white">
        <summary className="cursor-pointer font-semibold">Optional: Pick a different pack (advanced)</summary>
        <div className="mt-3 space-y-3">
          <Select
            value={pack}
            onValueChange={(v) =>
              setPayload((p) => ({
                ...p,
                pack: v,
                index: 0,
                done: {},
                status: {},
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select pack" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(DATE_FIT_PACKS).map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() =>
              setPayload((p) => ({
                ...p,
                index: (Number(p.index || 0) + 1) % (DATE_FIT_PACKS[pack]?.length || 1),
                done: {},
                status: {},
              }))
            }
          >
            Next Challenge in Pack
          </Button>

          <p className="text-xs text-gray-500">
            Tip: changing pack resets today’s statuses so both partners stay synced.
          </p>
        </div>
      </details>
    </div>
  );
}

/* ---------------- DEFAULT PAYLOADS ---------------- */
function defaultPayloadFor(gameType) {
  if (gameType === GAME_TWO_TRUTHS) {
    return {
      phase: 'ENTER',
      authorId: '',
      statements: [{ id: 's1', text: '' }, { id: 's2', text: '' }, { id: 's3', text: '' }],
      lieIndex: null,
      guessByPartner: null,
      typing: {},
      seen: {},
      _v: 1,
    };
  }

  if (gameType === GAME_TWENTY_QUESTIONS) {
    return {
      phase: 'CHOOSE',
      chooserId: '',
      secretHint: '',
      answerCategory: 'Thing',
      qCount: 0,
      log: [],
      winnerUserId: null,
      typing: {},
      seen: {},
      _v: 1,
    };
  }

  if (gameType === GAME_LOVE_ISLAND) {
    return {
      stage: 1,
      stages: {},
      typing: {},
      seen: {},
      _v: 1,
    };
  }

  // ✅ Date-Fit payload
  return {
    program: 'Balanced',
    weekDay: 1,
    pack: 'WarmUp',
    index: 0,
    done: {}, // { userId: true }
    status: {}, // { userId: "DONE" | "REST" }
    score: {}, // { userId: number }
    streak: {}, // { userId: number } capped at 7
    lastDayCompleted: {}, // { userId: number }
    typing: {},
    seen: {},
    _v: 1,
  };
}