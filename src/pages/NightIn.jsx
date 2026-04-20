import React from 'react';
import { supabase } from '@/lib/supabase';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Home as HomeIcon,
  Heart,
  Image,
  Target,
  MapPin,
  MessageCircle,
  Fingerprint,
  Gamepad2,
  Sparkles,
  Lock,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Coffee,
  Flame,
  Trophy,
  CalendarDays,
  Dumbbell,
  CheckCircle,
  Loader2,
} from 'lucide-react';

const navItems = [
  { label: 'Home', icon: HomeIcon, page: 'Home' },
  { label: 'Dating', icon: Heart, page: 'Dating' },
  { label: 'Memories', icon: Image, page: 'Memories' },
  { label: 'Goals', icon: Target, page: 'Goals' },
  { label: 'NightIn', icon: MapPin, page: 'NightIn' },
  { label: 'Chat', icon: MessageCircle, page: 'Chat' },
  { label: 'Verify', icon: Fingerprint, page: 'VerifyStatus' },
];

const GAME_TWO_TRUTHS = 'TWO_TRUTHS';
const GAME_TWENTY_QUESTIONS = 'TWENTY_QUESTIONS';
const GAME_LOVE_ISLAND = 'LOVE_ISLAND_REMOTE';
const GAME_DATE_FIT = 'DATE_FIT';

const DATE_FIT_PROGRAMS = {
  Balanced: [
    {
      day: 1,
      title: 'Day 1 — Warm start',
      pack: 'WarmUp',
      workoutIndex: 1,
      minutes: 8,
      intensity: 'Easy',
      notes: 'Start strong but calm. Consistency beats hype.',
    },
    {
      day: 2,
      title: 'Day 2 — Strength base',
      pack: 'Strength',
      workoutIndex: 0,
      minutes: 12,
      intensity: 'Medium',
      notes: 'Move slow. Control is love.',
    },
    {
      day: 3,
      title: 'Day 3 — Cardio light',
      pack: 'Cardio',
      workoutIndex: 0,
      minutes: 10,
      intensity: 'Easy',
      notes: 'Breath steady. No rushing.',
    },
    {
      day: 4,
      title: 'Day 4 — Strength upper',
      pack: 'Strength',
      workoutIndex: 1,
      minutes: 12,
      intensity: 'Medium',
      notes: 'Small effort, big respect.',
    },
    {
      day: 5,
      title: 'Day 5 — Cardio HIIT',
      pack: 'Cardio',
      workoutIndex: 2,
      minutes: 8,
      intensity: 'Medium',
      notes: 'Finish proud. Don’t overdo it.',
    },
    {
      day: 6,
      title: 'Day 6 — Leg day',
      pack: 'Strength',
      workoutIndex: 2,
      minutes: 12,
      intensity: 'Medium',
      notes: 'Legs build stability.',
    },
    {
      day: 7,
      title: 'Day 7 — Bond day',
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
    { title: '2-minute breathing + intention', task: 'Do 2 minutes calm breathing. Then send 1 intention for today.' },
    { title: 'Mobility reset', task: 'Do 10 arm circles + 10 hip circles + 10 bodyweight good mornings.' },
    { title: 'Posture check', task: 'Stand tall for 60 seconds. Shoulders relaxed. Finish with “I’m ready.”' },
  ],
  Strength: [
    { title: 'Core & control', task: '3 rounds: 20s plank + 10 slow squats + 10 glute bridges.' },
    { title: 'Upper body home', task: '3 rounds: 8–12 pushups + 12 chair dips + 20s wall hold.' },
    { title: 'Leg day home', task: '3 rounds: 12 squats + 12 lunges each + 20 calf raises.' },
  ],
  Cardio: [
    { title: 'Low-impact cardio', task: '8 minutes: march in place 60s + step touches 60s + repeat.' },
    { title: 'Stairs / hallway', task: '6 minutes brisk walk up/down or hallway power-walk.' },
    { title: 'HIIT light', task: '6 rounds: 20s jumping jacks or step jacks + 40s rest.' },
  ],
  CoupleBond: [
    { title: 'Romantic discipline', task: 'Write 1 line: “I’m building with you because…”' },
    { title: 'Accountability vow', task: 'Say out loud: “I keep my promises.” Then mark done.' },
    { title: 'Future vision', task: 'Think 30 seconds: “Our healthiest future looks like…”' },
  ],
};

const LOVE_STAGES = Array.from({ length: 100 }, (_, i) => {
  const n = i + 1;
  const type = n % 12 === 0 ? 'MISSION_REQUIRED' : n % 6 === 0 ? 'MISSION_OPTIONAL' : n % 3 === 0 ? 'DEEP' : 'FUN';
  const requiresMission = type === 'MISSION_REQUIRED';

  const title =
    type === 'MISSION_REQUIRED'
      ? `Stage ${n}: Island Mission`
      : type === 'MISSION_OPTIONAL'
      ? `Stage ${n}: Bonus Mission`
      : type === 'DEEP'
      ? `Stage ${n}: Deep Talk`
      : `Stage ${n}: Fun & Flirty`;

  const prompts =
    type === 'DEEP'
      ? [
          'What’s one fear you rarely say out loud?',
          'What do you need more of from me this week?',
          'What boundary protects our love?',
        ]
      : type === 'MISSION_REQUIRED'
      ? [
          'Send a photo of something that represents “us”.',
          'Record a voice note: “I’m proud of you because…”',
          'Choose a mini-date idea and schedule it.',
        ]
      : type === 'MISSION_OPTIONAL'
      ? [
          'Share your current mood in 1 word + why.',
          'What’s one thing I do that makes you feel safe?',
          'Choose a love song for this week and tell me why.',
        ]
      : [
          'If we had an island villa, what would our rules be?',
          'What’s your favorite feature about me?',
          'Describe our next date in 1 sentence.',
        ];

  const mission =
    type === 'MISSION_REQUIRED'
      ? 'Required mission: do a 10-minute walk and capture 1 photo of your view + 1 gratitude sentence.'
      : type === 'MISSION_OPTIONAL'
      ? 'Bonus mission: do 10 pushups or 20 squats and send “done”.'
      : null;

  const tag =
    type === 'MISSION_REQUIRED' ? 'Mission' : type === 'MISSION_OPTIONAL' ? 'Bonus' : type === 'DEEP' ? 'Deep' : 'Fun';

  return { n, title, prompts, mission, requiresMission, tag };
});

function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#ece6ea] bg-white/95 pb-2 pt-2 shadow-[0_-6px_18px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="mx-auto grid w-full max-w-[390px] grid-cols-7 gap-1 px-2">
        {navItems.map((item) => {
          const href = createPageUrl(item.page);
          const active =
            location.pathname === href || (href === '/' && location.pathname === '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={href}
              className={`flex min-h-[64px] flex-col items-center justify-center rounded-[16px] px-1 py-2 transition ${
                active ? 'bg-[#fdecef]' : 'bg-transparent'
              }`}
            >
              <Icon
                className={`mb-1 h-5 w-5 ${
                  active ? 'text-[#ef4f75]' : 'text-slate-400'
                }`}
                strokeWidth={2.1}
              />
              <span
                className={`truncate text-[9px] leading-tight ${
                  active ? 'font-semibold text-[#ef4f75]' : 'font-medium text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, iconColor, iconWrap }) {
  return (
    <div className="rounded-[16px] bg-white px-1.5 py-2 text-center shadow-[0_6px_14px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col items-center">
        <div className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-full ${iconWrap}`}>
          {React.cloneElement(icon, { className: `h-3.5 w-3.5 ${iconColor}` })}
        </div>

        <p className="text-[12px] font-bold leading-none text-slate-900">
          {value}
        </p>

        <p className="mt-1 truncate text-[9px] font-medium text-slate-500">
          {label}
        </p>
      </div>
    </div>
  );
}

function SafeInput({ className = '', onKeyDown, onKeyUp, onKeyPress, ...rest }) {
  return (
    <Input
      {...rest}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      className={`h-[42px] rounded-[14px] border border-slate-200 bg-white px-4 text-[13px] leading-[42px] text-slate-900 placeholder:text-slate-400 caret-slate-900 focus:border-rose-400 focus:ring-1 focus:ring-rose-200 ${className}`}
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

function GamePill({ active, onClick, children, icon: Icon = null }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[42px] w-full items-center justify-center gap-2 rounded-[14px] px-3 text-[13px] font-medium shadow-[0_6px_14px_rgba(15,23,42,0.08)] transition active:scale-[0.98] ${
        active
          ? 'bg-rose-500 text-white'
          : 'bg-white text-rose-500 hover:bg-rose-50'
      }`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
      <span className="leading-none">{children}</span>
    </button>
  );
}

function defaultPayloadFor(gameType) {
  if (gameType === GAME_TWO_TRUTHS) {
    return {
      phase: 'ENTER',
      authorId: '',
      statements: [
        { id: 's1', text: '' },
        { id: 's2', text: '' },
        { id: 's3', text: '' },
      ],
      lieIndex: null,
      guessByPartner: null,
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
    };
  }

  if (gameType === GAME_LOVE_ISLAND) {
    return {
      stage: 1,
      stages: {},
    };
  }

  return {
    program: 'Balanced',
    weekDay: 1,
    pack: 'WarmUp',
    index: 0,
    done: {},
    status: {},
    score: {},
    streak: {},
    lastDayCompleted: {},
  };
}

export default function NightIn() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeGame, setActiveGame] = React.useState(GAME_TWO_TRUTHS);
  const [gameState, setGameState] = React.useState({
    [GAME_TWO_TRUTHS]: defaultPayloadFor(GAME_TWO_TRUTHS),
    [GAME_TWENTY_QUESTIONS]: defaultPayloadFor(GAME_TWENTY_QUESTIONS),
    [GAME_LOVE_ISLAND]: defaultPayloadFor(GAME_LOVE_ISLAND),
    [GAME_DATE_FIT]: defaultPayloadFor(GAME_DATE_FIT),
  });

  React.useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;
        if (!mounted) return;

        setUser(authUser || null);
      } catch (error) {
        console.error('NightIn loadUser error:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const currentPayload = React.useMemo(() => {
    return gameState[activeGame] || defaultPayloadFor(activeGame);
  }, [activeGame, gameState]);

  const updatePayload = React.useCallback((updater) => {
    setGameState((prev) => {
      const current = prev[activeGame] || defaultPayloadFor(activeGame);
      const next = typeof updater === 'function' ? updater(current) : updater;

      return {
        ...prev,
        [activeGame]: next,
      };
    });
  }, [activeGame]);

  const resetCurrentGame = React.useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      [activeGame]: defaultPayloadFor(activeGame),
    }));
  }, [activeGame]);

  const stats = React.useMemo(() => {
    const twoTruths = gameState[GAME_TWO_TRUTHS];
    const twenty = gameState[GAME_TWENTY_QUESTIONS];
    const island = gameState[GAME_LOVE_ISLAND];
    const fit = gameState[GAME_DATE_FIT];

    return {
      rounds: twoTruths?.phase === 'REVEAL' ? 1 : 0,
      questions: twenty?.qCount || 0,
      islandStage: island?.stage || 1,
      fitScore: Object.values(fit?.score || {}).reduce((sum, n) => sum + Number(n || 0), 0),
    };
  }, [gameState]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3edf1]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-[#f3edf1] p-4 pb-[96px]">
          <Card className="mx-auto mt-8 w-full max-w-md p-6 text-center">
            <p className="mb-4 text-slate-600">Please sign in to access NightIn</p>
          </Card>
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#f3edf1] px-3 py-3 pb-[96px]">
        <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[28px] border border-[#e8e2e7] bg-[#f7f3f6] shadow-[0_12px_40px_rgba(15,23,42,0.10)]">
          <div className="bg-gradient-to-r from-[#5e9cff] via-[#2f6df0] to-[#6aa7ff] px-5 pb-6 pt-7">
            <div className="min-w-0">
              <p className="text-[14px] text-white/80">Welcome to</p>
              <h2 className="truncate text-[22px] font-semibold text-white">NightIn</h2>
            </div>
          </div>

          <div className="-mt-2 px-4 pt-4 pb-6">
            <div className="mb-4 flex gap-3">
              <GamePill
                active={activeGame === GAME_TWO_TRUTHS}
                onClick={() => setActiveGame(GAME_TWO_TRUTHS)}
                icon={Sparkles}
              >
                Two Truths
              </GamePill>

              <GamePill
                active={activeGame === GAME_TWENTY_QUESTIONS}
                onClick={() => setActiveGame(GAME_TWENTY_QUESTIONS)}
              >
                20 Questions
              </GamePill>
            </div>

            <div className="mb-5 flex gap-3">
              <GamePill
                active={activeGame === GAME_LOVE_ISLAND}
                onClick={() => setActiveGame(GAME_LOVE_ISLAND)}
              >
                Love Island
              </GamePill>

              <GamePill
                active={activeGame === GAME_DATE_FIT}
                onClick={() => setActiveGame(GAME_DATE_FIT)}
              >
                Date-Fit
              </GamePill>
            </div>

            <div className="mb-4 grid grid-cols-4 gap-1.5">
              <StatCard
                icon={<CheckCircle />}
                value={stats.rounds}
                label="Rounds"
                iconColor="text-emerald-500"
                iconWrap="bg-emerald-50"
              />
              <StatCard
                icon={<MessageCircle />}
                value={stats.questions}
                label="Questions"
                iconColor="text-blue-400"
                iconWrap="bg-blue-50"
              />
              <StatCard
                icon={<MapPin />}
                value={stats.islandStage}
                label="Stage"
                iconColor="text-fuchsia-500"
                iconWrap="bg-fuchsia-50"
              />
              <StatCard
                icon={<Trophy />}
                value={stats.fitScore}
                label="Fit Score"
                iconColor="text-amber-500"
                iconWrap="bg-amber-50"
              />
            </div>

            <div className="mb-4 overflow-hidden rounded-[26px] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[18px] bg-gradient-to-br from-[#8b5cf6] to-[#6366f1]">
                    <Gamepad2 className="h-6 w-6 text-white" strokeWidth={2.1} />
                  </div>

                  <div>
                    <p className="text-[15px] font-semibold leading-none text-[#172033]">
                      Current Game
                    </p>
                    <p className="mt-2 text-[12px] font-medium leading-none text-[#64748b]">
                      {activeGame === GAME_TWO_TRUTHS
                        ? 'Two Truths and a Lie'
                        : activeGame === GAME_TWENTY_QUESTIONS
                        ? '20 Questions'
                        : activeGame === GAME_LOVE_ISLAND
                        ? 'Love Island Remote'
                        : 'Date-Fit'}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={resetCurrentGame}
                  className="h-[38px] rounded-[14px] bg-white px-3 text-[12px] font-medium text-rose-500 shadow-[0_6px_14px_rgba(15,23,42,0.08)] hover:bg-slate-50"
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Reset
                </Button>
              </div>

              <div className="px-5 py-5">
                {activeGame === GAME_TWO_TRUTHS ? (
                  <TwoTruthsGame
                    payload={currentPayload}
                    currentUserId={user.id || 'me'}
                    setPayload={updatePayload}
                  />
                ) : activeGame === GAME_TWENTY_QUESTIONS ? (
                  <TwentyQuestionsGame
                    payload={currentPayload}
                    currentUserId={user.id || 'me'}
                    setPayload={updatePayload}
                  />
                ) : activeGame === GAME_LOVE_ISLAND ? (
                  <LoveIslandGame
                    payload={currentPayload}
                    currentUserId={user.id || 'me'}
                    setPayload={updatePayload}
                  />
                ) : (
                  <DateFitGame
                    payload={currentPayload}
                    currentUserId={user.id || 'me'}
                    setPayload={updatePayload}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </>
  );
}

function TwoTruthsGame({ payload, currentUserId, setPayload }) {
  const phase = payload?.phase || 'ENTER';
  const isAuthor = payload?.authorId === currentUserId;

  const [localStatements, setLocalStatements] = React.useState([
    { id: 's1', text: '' },
    { id: 's2', text: '' },
    { id: 's3', text: '' },
  ]);
  const [localLieIndex, setLocalLieIndex] = React.useState(null);
  const [isTyping, setIsTyping] = React.useState(false);

  React.useEffect(() => {
    if (phase === 'ENTER') {
      setLocalStatements(
        Array.isArray(payload?.statements) && payload.statements.length === 3
          ? payload.statements
          : [
              { id: 's1', text: '' },
              { id: 's2', text: '' },
              { id: 's3', text: '' },
            ]
      );
      setLocalLieIndex(payload?.lieIndex ?? null);
      setIsTyping(false);
    }
  }, [phase, payload?.statements, payload?.lieIndex]);

  const startRound = () => {
    setPayload((p) => ({
      ...p,
      phase: 'ENTER',
      authorId: currentUserId,
      statements: [
        { id: 's1', text: '' },
        { id: 's2', text: '' },
        { id: 's3', text: '' },
      ],
      lieIndex: null,
      guessByPartner: null,
    }));

    setLocalStatements([
      { id: 's1', text: '' },
      { id: 's2', text: '' },
      { id: 's3', text: '' },
    ]);
    setLocalLieIndex(null);
    setIsTyping(false);
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

    setIsTyping(false);
  };

  const submitGuess = (guessIndex) => {
    setPayload((p) => ({
      ...p,
      guessByPartner: guessIndex,
      phase: 'REVEAL',
    }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] bg-[#f8fafc] p-4">
        <p className="text-[14px] font-semibold text-slate-900">Two Truths and a Lie</p>
        <p className="mt-2 text-[12px] text-slate-500">
          Start a round, write 3 statements, then pick the lie.
        </p>
        {isTyping ? (
          <p className="mt-2 text-[11px] font-medium text-rose-500">Typing…</p>
        ) : null}
      </div>

      <Button
        type="button"
        onClick={startRound}
        className="flex h-[42px] w-full items-center justify-center rounded-[14px] bg-rose-500 px-3 text-[13px] font-medium text-white shadow-[0_6px_14px_rgba(15,23,42,0.08)] hover:bg-rose-600"
      >
        Start New Round
      </Button>

      {phase === 'ENTER' && isAuthor && (
        <div className="space-y-3">
          {localStatements.map((s, idx) => (
            <div key={s.id} className="rounded-[18px] bg-[#f8fafc] p-3">
              <SafeInput
                value={s.text}
                placeholder={`Statement ${idx + 1}`}
                onChange={(e) => {
                  const value = e.target.value;
                  setIsTyping(value.length > 0);
                  setLocalStatements((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, text: value } : x))
                  );
                }}
                className="h-[42px] rounded-[14px] border-slate-200 bg-white"
              />

              <label className="mt-3 flex items-center gap-2">
                <input
                  type="radio"
                  checked={localLieIndex === idx}
                  onChange={() => setLocalLieIndex(idx)}
                  className="h-4 w-4"
                />
                <span className="text-[12px] font-medium text-slate-600">This is the lie</span>
              </label>
            </div>
          ))}

          <Button
            type="button"
            onClick={submitStatements}
            disabled={localLieIndex === null || localStatements.some((s) => (s.text || '').trim().length < 3)}
            className="flex h-[42px] w-full items-center justify-center rounded-[14px] bg-rose-500 px-3 text-[13px] font-medium text-white shadow-[0_6px_14px_rgba(15,23,42,0.08)] hover:bg-rose-600 disabled:opacity-60"
          >
            Send to Guess
          </Button>
        </div>
      )}

      {phase === 'ENTER' && !isAuthor && (
        <div className="rounded-[18px] bg-[#f8fafc] p-4 text-[12px] text-slate-500">
          Tap “Start New Round” to begin.
        </div>
      )}

      {phase === 'GUESS' && !isAuthor && Array.isArray(payload?.statements) && (
        <div className="space-y-3">
          {payload.statements.map((s, idx) => (
            <div key={s.id} className="flex items-center justify-between rounded-[18px] bg-[#f8fafc] p-4">
              <span className="pr-3 text-[13px] font-medium text-slate-700">
                {idx + 1}. {s.text}
              </span>
              <Button
                type="button"
                onClick={() => submitGuess(idx)}
                className="h-[38px] rounded-[14px] bg-rose-500 px-3 text-[12px] font-medium text-white hover:bg-rose-600"
              >
                Pick
              </Button>
            </div>
          ))}
        </div>
      )}

      {phase === 'GUESS' && isAuthor && (
        <div className="rounded-[18px] bg-[#f8fafc] p-4 text-[12px] text-slate-500">
          Waiting for the guess…
        </div>
      )}

      {phase === 'REVEAL' && Array.isArray(payload?.statements) && (
        <div className="space-y-3">
          {payload.statements.map((s, idx) => {
            const isLie = idx === payload.lieIndex;
            const guessed = idx === payload.guessByPartner;

            return (
              <div key={s.id} className="flex items-center justify-between rounded-[18px] bg-[#f8fafc] p-4">
                <span className="text-[13px] font-medium text-slate-700">
                  {idx + 1}. {s.text} {isLie ? '(LIE)' : '(TRUTH)'}
                </span>
                {guessed ? <Badge className="bg-rose-500 text-white">Picked</Badge> : null}
              </div>
            );
          })}

          <div className="rounded-[18px] bg-[#eefcf3] p-4 text-center text-[13px] font-semibold text-emerald-700">
            {payload.guessByPartner === payload.lieIndex ? '✅ Correct guess!' : '❌ Not quite!'}
          </div>
        </div>
      )}
    </div>
  );
}

function TwentyQuestionsGame({ payload, currentUserId, setPayload }) {
  const phase = payload?.phase || 'CHOOSE';

  const [category, setCategory] = React.useState(payload?.answerCategory || 'Thing');
  const [hint, setHint] = React.useState(payload?.secretHint || '');
  const [draft, setDraft] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);

  React.useEffect(() => {
    if (phase === 'CHOOSE') {
      setCategory(payload?.answerCategory || 'Thing');
      setHint(payload?.secretHint || '');
      setDraft('');
      setIsTyping(false);
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

      log.push({
        byUserId: currentUserId,
        type,
        text,
        createdAt: new Date().toISOString(),
      });

      return {
        ...p,
        log: log.slice(-80),
        qCount,
        phase: qCount >= 20 ? 'END' : p.phase,
      };
    });

    setDraft('');
    setIsTyping(false);
  };

  const endWithWinner = (winnerLabel) => {
    setPayload((p) => ({
      ...p,
      phase: 'END',
      winnerUserId: winnerLabel,
    }));
  };

  return (
    <div className="space-y-4">
      {phase === 'CHOOSE' && (
        <div className="space-y-3">
          <div className="rounded-[18px] bg-[#f8fafc] p-4 text-[12px] text-slate-500">
            Choose a category and start the round.
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-[42px] w-full rounded-[14px] border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none"
          >
            {['Person', 'Place', 'Thing', 'Memory', 'Date Idea', 'Movie', 'Song'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <SafeInput
            value={hint}
            placeholder="Optional hint"
            onChange={(e) => setHint(e.target.value)}
            className="h-[42px] rounded-[14px] border-slate-200 bg-white"
          />

          <Button
            type="button"
            onClick={startGame}
            className="flex h-[42px] w-full items-center justify-center rounded-[14px] bg-rose-500 px-3 text-[13px] font-medium text-white shadow-[0_6px_14px_rgba(15,23,42,0.08)] hover:bg-rose-600"
          >
            Start 20 Questions
          </Button>
        </div>
      )}

      {phase === 'ASK' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-[18px] bg-[#f8fafc] p-4">
            <Badge className="bg-[#eaf1ff] text-[#3b82f6]">Questions: {payload?.qCount || 0}/20</Badge>
            <span className="text-[12px] font-medium text-slate-500">{payload?.answerCategory}</span>
          </div>

          {payload?.secretHint ? (
            <div className="rounded-[18px] bg-[#f8fafc] p-4 text-[12px] text-slate-600">
              Hint: {payload.secretHint}
            </div>
          ) : null}

          {isTyping ? (
            <div className="rounded-[18px] bg-[#fff1f2] p-3 text-[11px] font-medium text-rose-500">
              Typing…
            </div>
          ) : null}

          <div className="max-h-64 space-y-2 overflow-y-auto rounded-[18px] bg-[#f8fafc] p-3">
            {(payload?.log || []).map((it, idx) => (
              <div
                key={idx}
                className={`max-w-[80%] rounded-[16px] p-3 ${
                  it.byUserId === currentUserId ? 'ml-auto bg-[#fdecef]' : 'mr-auto bg-white'
                }`}
              >
                <p className="text-[10px] font-bold text-slate-500">{it.type}</p>
                <p className="text-[12px] font-medium text-slate-700">{it.text}</p>
              </div>
            ))}
          </div>

          <SafeInput
            value={draft}
            placeholder="Type here…"
            onChange={(e) => {
              const value = e.target.value;
              setDraft(value);
              setIsTyping(value.length > 0);
            }}
            className="h-[42px] rounded-[14px] border-slate-200 bg-white"
          />

          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              onClick={() => addLog('Q')}
              disabled={!draft.trim()}
              className="h-[40px] rounded-[14px] bg-white text-rose-500 shadow-[0_6px_14px_rgba(15,23,42,0.08)] hover:bg-slate-50"
            >
              Ask
            </Button>
            <Button
              type="button"
              onClick={() => addLog('A')}
              disabled={!draft.trim()}
              className="h-[40px] rounded-[14px] bg-white text-rose-500 shadow-[0_6px_14px_rgba(15,23,42,0.08)] hover:bg-slate-50"
            >
              Answer
            </Button>
            <Button
              type="button"
              onClick={() => addLog('GUESS')}
              disabled={!draft.trim()}
              className="h-[40px] rounded-[14px] bg-white text-rose-500 shadow-[0_6px_14px_rgba(15,23,42,0.08)] hover:bg-slate-50"
            >
              Guess
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={() => endWithWinner('YOU')}
              className="h-[40px] rounded-[14px] bg-[#eefcf3] text-[#16a34a] hover:bg-[#dcfce7]"
            >
              I guessed it
            </Button>
            <Button
              type="button"
              onClick={() => endWithWinner('PARTNER')}
              className="h-[40px] rounded-[14px] bg-[#eaf1ff] text-[#2563eb] hover:bg-[#dbeafe]"
            >
              Partner guessed
            </Button>
          </div>
        </div>
      )}

      {phase === 'END' && (
        <div className="rounded-[18px] bg-[#eefcf3] p-4 text-center text-[13px] font-semibold text-emerald-700">
          Winner: {payload?.winnerUserId || '—'}
        </div>
      )}
    </div>
  );
}

function LoveIslandGame({ payload, currentUserId, setPayload }) {
  const myId = String(currentUserId);
  const stageNum = Math.min(Math.max(Number(payload?.stage || 1), 1), 100);
  const stage = LOVE_STAGES[stageNum - 1];

  const stages = payload?.stages || {};
  const stageData = stages?.[stageNum] || {};
  const submitted = stageData.submitted || {};
  const answers = stageData.answers || {};
  const physicalDone = stageData.physicalDone || {};

  const mySubmitted = !!submitted?.[myId];
  const myPhysical = !!physicalDone?.[myId];
  const canUnlock = mySubmitted && (!stage.requiresMission || myPhysical);

  const [a1, setA1] = React.useState('');
  const [a2, setA2] = React.useState('');
  const [a3, setA3] = React.useState('');
  const [note, setNote] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);

  const lastStageRef = React.useRef(null);

  React.useEffect(() => {
    if (lastStageRef.current === stageNum) return;
    lastStageRef.current = stageNum;

    const mine = answers?.[myId] || null;
    setA1(mine?.a1 || '');
    setA2(mine?.a2 || '');
    setA3(mine?.a3 || '');
    setNote(mine?.note || '');
    setIsTyping(false);
  }, [stageNum, answers, myId]);

  const submit = () => {
    const x1 = (a1 || '').trim();
    const x2 = (a2 || '').trim();
    const x3 = (a3 || '').trim();

    if (!x1 || !x2 || !x3) return;

    setPayload((p) => {
      const nextStages = { ...(p.stages || {}) };
      const current = { ...(nextStages[stageNum] || {}) };
      const nextAnswers = { ...(current.answers || {}) };
      const nextSubmitted = { ...(current.submitted || {}) };

      nextAnswers[myId] = {
        a1: x1,
        a2: x2,
        a3: x3,
        note: (note || '').trim(),
        at: new Date().toISOString(),
      };

      nextSubmitted[myId] = true;

      nextStages[stageNum] = {
        ...current,
        answers: nextAnswers,
        submitted: nextSubmitted,
        physicalDone: { ...(current.physicalDone || {}) },
      };

      return {
        ...p,
        stage: stageNum,
        stages: nextStages,
      };
    });

    setIsTyping(false);
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

      return {
        ...p,
        stage: stageNum,
        stages: nextStages,
      };
    });
  };

  const unlockNext = () => {
    if (!mySubmitted) return;
    if (stage.requiresMission && !myPhysical) return;

    setPayload((p) => ({
      ...p,
      stage: Math.min(stageNum + 1, 100),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-[18px] bg-[#f8fafc] p-4">
        <Badge className="bg-[#f5e8ff] text-[#a855f7]">
          {stage.tag} • Stage {stageNum}/100
        </Badge>
        <Badge className={canUnlock ? 'bg-[#eefcf3] text-[#16a34a]' : 'bg-slate-100 text-slate-500'}>
          {canUnlock ? 'Ready' : 'In Progress'}
        </Badge>
      </div>

      {isTyping ? (
        <div className="rounded-[18px] bg-[#fff1f2] p-3 text-[11px] font-medium text-rose-500">
          Typing…
        </div>
      ) : null}

      <div className="rounded-[20px] bg-[#f8fafc] p-4">
        <p className="text-[14px] font-semibold text-slate-900">{stage.title}</p>

        {stage.mission ? (
          <div className="mt-3 rounded-[18px] bg-white p-4">
            <div className="text-[11px] font-bold text-amber-600">
              {stage.requiresMission ? 'Mission Required' : 'Mission Optional'}
            </div>
            <div className="mt-2 text-[12px] text-slate-600">{stage.mission}</div>

            <Button
              type="button"
              onClick={togglePhysicalDone}
              className="mt-3 h-[40px] rounded-[14px] bg-white text-rose-500 shadow-[0_6px_14px_rgba(15,23,42,0.08)] hover:bg-slate-50"
            >
              {myPhysical ? 'Undo Mission' : 'Mark Mission Done'}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="rounded-[18px] bg-[#f8fafc] p-3">
          <div className="mb-2 text-[12px] font-semibold text-slate-700">1) {stage.prompts[0]}</div>
          <SafeInput
            value={a1}
            onChange={(e) => {
              const value = e.target.value;
              setA1(value);
              setIsTyping(value.length > 0 || a2.length > 0 || a3.length > 0 || note.length > 0);
            }}
            disabled={mySubmitted}
            placeholder="Type your answer…"
            className="h-[42px] rounded-[14px] border-slate-200 bg-white"
          />
        </div>

        <div className="rounded-[18px] bg-[#f8fafc] p-3">
          <div className="mb-2 text-[12px] font-semibold text-slate-700">2) {stage.prompts[1]}</div>
          <SafeInput
            value={a2}
            onChange={(e) => {
              const value = e.target.value;
              setA2(value);
              setIsTyping(a1.length > 0 || value.length > 0 || a3.length > 0 || note.length > 0);
            }}
            disabled={mySubmitted}
            placeholder="Type your answer…"
            className="h-[42px] rounded-[14px] border-slate-200 bg-white"
          />
        </div>

        <div className="rounded-[18px] bg-[#f8fafc] p-3">
          <div className="mb-2 text-[12px] font-semibold text-slate-700">3) {stage.prompts[2]}</div>
          <SafeInput
            value={a3}
            onChange={(e) => {
              const value = e.target.value;
              setA3(value);
              setIsTyping(a1.length > 0 || a2.length > 0 || value.length > 0 || note.length > 0);
            }}
            disabled={mySubmitted}
            placeholder="Type your answer…"
            className="h-[42px] rounded-[14px] border-slate-200 bg-white"
          />
        </div>

        <div className="rounded-[18px] bg-[#f8fafc] p-3">
          <div className="mb-2 text-[12px] font-semibold text-slate-700">Note (optional)</div>
          <SafeInput
            value={note}
            onChange={(e) => {
              const value = e.target.value;
              setNote(value);
              setIsTyping(a1.length > 0 || a2.length > 0 || a3.length > 0 || value.length > 0);
            }}
            disabled={mySubmitted}
            placeholder="Add a sweet note…"
            className="h-[42px] rounded-[14px] border-slate-200 bg-white"
          />
        </div>

        <Button
          type="button"
          onClick={submit}
          disabled={mySubmitted}
          className="flex h-[42px] w-full items-center justify-center rounded-[14px] bg-rose-500 px-3 text-[13px] font-medium text-white shadow-[0_6px_14px_rgba(15,23,42,0.08)] hover:bg-rose-600 disabled:opacity-60"
        >
          {mySubmitted ? 'Submitted' : 'Submit Answers'}
        </Button>

        <Button
          type="button"
          onClick={unlockNext}
          className={`flex h-[42px] w-full items-center justify-center rounded-[14px] px-3 text-[13px] font-medium shadow-[0_6px_14px_rgba(15,23,42,0.08)] ${
            canUnlock ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-white text-slate-400'
          }`}
        >
          {canUnlock ? (
            <>
              <ChevronRight className="mr-2 h-4 w-4" />
              Unlock Next Stage
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Complete Stage to Unlock
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function DateFitGame({ payload, currentUserId, setPayload }) {
  const myId = String(currentUserId);

  const DAYS = [
    {
      day: 1,
      title: 'Day 1 — Warm Start',
      minutes: 8,
      intensity: 'Easy',
      task: '2 rounds: 10 squats, 10 arm circles, 20s plank.',
    },
    {
      day: 2,
      title: 'Day 2 — Strength Base',
      minutes: 12,
      intensity: 'Medium',
      task: '3 rounds: 10 squats, 10 pushups, 20s plank.',
    },
    {
      day: 3,
      title: 'Day 3 — Light Cardio',
      minutes: 10,
      intensity: 'Easy',
      task: '8 minutes march in place + 2 minutes step touches.',
    },
    {
      day: 4,
      title: 'Day 4 — Upper Focus',
      minutes: 12,
      intensity: 'Medium',
      task: '3 rounds: 8 pushups, 12 chair dips, 20s wall sit.',
    },
    {
      day: 5,
      title: 'Day 5 — Cardio Push',
      minutes: 8,
      intensity: 'Medium',
      task: '6 rounds: 20s jumping jacks, 40s rest.',
    },
    {
      day: 6,
      title: 'Day 6 — Leg Day',
      minutes: 12,
      intensity: 'Medium',
      task: '3 rounds: 12 squats, 12 lunges each side, 20 calf raises.',
    },
    {
      day: 7,
      title: 'Day 7 — Bond Day',
      minutes: 6,
      intensity: 'Easy',
      task: 'Write one line: “I’m building with you because…” and reflect together.',
    },
  ];

  const weekDay = Math.min(Math.max(Number(payload?.weekDay || 1), 1), 7);
  const todayPlan = DAYS[weekDay - 1] || DAYS[0];

  const score = payload?.score || {};
  const streak = payload?.streak || {};
  const statusMap = payload?.status || {};
  const lastDayCompleted = payload?.lastDayCompleted || {};

  const myScore = Number(score?.[myId] || 0);
  const myStreak = Number(streak?.[myId] || 0);
  const myStatus = statusMap?.[myId] || null;

  const canContinue = myStatus === 'DONE' || myStatus === 'SKIPPED';

  const markDone = () => {
    if (myStatus) return;

    setPayload((p) => {
      const nextStatus = { ...(p.status || {}) };
      nextStatus[myId] = 'DONE';

      const nextScore = { ...(p.score || {}) };
      nextScore[myId] = Number(nextScore[myId] || 0) + 10;

      const nextStreak = { ...(p.streak || {}) };
      const nextLast = { ...(p.lastDayCompleted || {}) };
      const currentDay = Number(p.weekDay || 1);
      const previousDay = Number(nextLast[myId] || 0);

      let s = Number(nextStreak[myId] || 0);
      if (previousDay === currentDay - 1 || (previousDay === 7 && currentDay === 1)) {
        s += 1;
      } else {
        s = 1;
      }

      nextStreak[myId] = Math.min(7, s);
      nextLast[myId] = currentDay;

      return {
        ...p,
        status: nextStatus,
        score: nextScore,
        streak: nextStreak,
        lastDayCompleted: nextLast,
      };
    });
  };

  const markSkip = () => {
    if (myStatus) return;

    setPayload((p) => {
      const nextStatus = { ...(p.status || {}) };
      nextStatus[myId] = 'SKIPPED';

      const nextStreak = { ...(p.streak || {}) };
      nextStreak[myId] = 0;

      return {
        ...p,
        status: nextStatus,
        streak: nextStreak,
      };
    });
  };

  const nextDay = () => {
    if (!canContinue) return;

    const next = weekDay >= 7 ? 1 : weekDay + 1;

    setPayload((p) => ({
      ...p,
      weekDay: next,
      status: {
        ...(p.status || {}),
        [myId]: null,
      },
    }));
  };

  const statusLabel =
    myStatus === 'DONE' ? 'Done' : myStatus === 'SKIPPED' ? 'Skipped' : 'Pending';

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] bg-[#f8fafc] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[18px] bg-[#eefcf3]">
              <Dumbbell className="h-6 w-6 text-[#22c55e]" strokeWidth={2.1} />
            </div>

            <div>
              <p className="text-[15px] font-semibold leading-none text-[#172033]">
                Date-Fit
              </p>
              <p className="mt-2 text-[12px] font-medium leading-none text-[#64748b]">
                One day, one task, one choice
              </p>
            </div>
          </div>

          <Badge className="bg-[#fff7ed] text-[#f59e0b]">
            <Trophy className="mr-1 h-3 w-3" />
            {myScore}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-[18px] bg-white px-3 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Flame className="h-3.5 w-3.5 text-rose-500" />
              Your streak
            </div>
            <div className="mt-2 text-[18px] font-bold text-slate-900">
              {myStreak}/7
            </div>
          </div>

          <div className="rounded-[18px] bg-white px-3 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
              Status
            </div>
            <div className="mt-2 text-[18px] font-bold text-slate-900">
              {statusLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[20px] bg-[#f8fafc] p-4">
        <div className="rounded-[18px] bg-white p-4">
          <div className="text-[11px] text-slate-500">Today (Day {weekDay})</div>
          <div className="mt-1 text-[14px] font-semibold text-slate-900">
            {todayPlan.title}
          </div>
          <div className="mt-2 text-[12px] text-slate-600">
            {todayPlan.minutes} min • {todayPlan.intensity}
          </div>
          <div className="mt-3 text-[12px] text-slate-600">{todayPlan.task}</div>
        </div>
      </div>

      {myStatus === 'DONE' ? (
        <div className="rounded-[18px] bg-[#eefcf3] p-4 text-center text-[13px] font-semibold text-emerald-700">
          Strong discipline 🔥
        </div>
      ) : null}

      {myStatus === 'SKIPPED' ? (
        <div className="rounded-[18px] bg-[#fff7ed] p-4 text-center text-[13px] font-semibold text-amber-700">
          You missed today. Show up tomorrow.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
  <Button
    type="button"
    onClick={markDone}
    disabled={!!myStatus}
    className="flex h-[44px] w-full items-center justify-center rounded-full bg-rose-500 px-4 text-[15px] font-semibold leading-none text-white shadow-[0_6px_14px_rgba(15,23,42,0.08)] whitespace-nowrap hover:bg-rose-600 disabled:opacity-60"
  >
    <span className="flex w-full items-center justify-center leading-none">
      Done
    </span>
  </Button>

  <Button
    type="button"
    onClick={markSkip}
    disabled={!!myStatus}
    className="flex h-[44px] w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-[15px] font-semibold leading-none text-slate-600 shadow-[0_6px_14px_rgba(15,23,42,0.08)] whitespace-nowrap hover:bg-slate-50 disabled:opacity-60"
  >
    <span className="flex w-full items-center justify-center leading-none">
      Skip
    </span>
  </Button>
</div>

      <Button
        type="button"
        onClick={nextDay}
        disabled={!canContinue}
        className={`flex h-[42px] w-full items-center justify-center rounded-[14px] px-3 text-[13px] font-medium shadow-[0_6px_14px_rgba(15,23,42,0.08)] ${
          canContinue
            ? 'bg-rose-500 text-white hover:bg-rose-600'
            : 'bg-white text-slate-400'
        }`}
      >
        {canContinue ? (
          <>
            <ChevronRight className="mr-2 h-4 w-4" />
            Continue
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Choose Done or Skip
          </>
        )}
      </Button>
    </div>
  );
}