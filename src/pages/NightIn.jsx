import React from "react";
import { supabase } from "@/lib/supabase";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Flame,
  Trophy,
  CalendarDays,
  Dumbbell,
  CheckCircle,
  Loader2,
  Lightbulb,
  Timer,
} from "lucide-react";

const GAME_TWO_TRUTHS = "TWO_TRUTHS";
const GAME_TWENTY_QUESTIONS = "TWENTY_QUESTIONS";
const GAME_CLUE_DATE = "CLUE_DATE";
const GAME_DATE_FIT = "DATE_FIT";

const navItems = [
  { label: "Home", icon: HomeIcon, page: "Home" },
  { label: "Dating", icon: Heart, page: "Dating" },
  { label: "Memories", icon: Image, page: "Memories" },
  { label: "Goals", icon: Target, page: "Goals" },
  { label: "NightIn", icon: MapPin, page: "NightIn" },
  { label: "Chat", icon: MessageCircle, page: "Chat" },
  { label: "Verify", icon: Fingerprint, page: "VerifyStatus" },
];

function defaultPayloadFor(gameType) {
  if (gameType === GAME_TWO_TRUTHS) {
    return {
      phase: "ENTER",
      authorId: "",
      statements: [
        { id: "s1", text: "" },
        { id: "s2", text: "" },
        { id: "s3", text: "" },
      ],
      lieIndex: null,
      guessByPartner: null,
    };
  }

  if (gameType === GAME_TWENTY_QUESTIONS) {
    return {
      phase: "CHOOSE",
      chooserId: "",
      secretHint: "",
      answerCategory: "Thing",
      qCount: 0,
      log: [],
      winnerUserId: null,
    };
  }

  if (gameType === GAME_CLUE_DATE) {
    return {
      phase: "SETUP",
      round: 1,
      category: "Movies",
      answer: "",
      cluePack: [],
      selectedClues: [],
      clueMasterId: "",
      guesserId: "",
      guessText: "",
      score: {},
      startedAt: null,
      timerSeconds: 30,
      result: null,
    };
  }

  return {
    weekDay: 1,
    status: {},
    score: {},
    streak: {},
    lastDayCompleted: {},
  };
}

function getDefaultGameState() {
  return {
    [GAME_TWO_TRUTHS]: defaultPayloadFor(GAME_TWO_TRUTHS),
    [GAME_TWENTY_QUESTIONS]: defaultPayloadFor(GAME_TWENTY_QUESTIONS),
    [GAME_CLUE_DATE]: defaultPayloadFor(GAME_CLUE_DATE),
    [GAME_DATE_FIT]: defaultPayloadFor(GAME_DATE_FIT),
  };
}

function mergeGameState(value) {
  return {
    ...getDefaultGameState(),
    ...(value && typeof value === "object" ? value : {}),
  };
}

function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#ece6ea] bg-white/95 pb-[max(6px,env(safe-area-inset-bottom))] pt-1 shadow-[0_-6px_18px_rgba(15,23,42,0.05)] backdrop-blur">
      <div className="mx-auto grid w-full max-w-[390px] grid-cols-7 gap-0.5 px-2">
        {navItems.map((item) => {
          const href = createPageUrl(item.page);
          const active = location.pathname === href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={href}
              className={`flex min-h-[50px] flex-col items-center justify-center rounded-[14px] px-1 py-1 transition ${
                active ? "bg-[#fdecef]" : "bg-transparent"
              }`}
            >
              <Icon
                className={`mb-0.5 h-[18px] w-[18px] ${
                  active ? "text-[#ef4f75]" : "text-slate-400"
                }`}
                strokeWidth={2}
              />
              <span
                className={`truncate text-[8px] leading-none tracking-[-0.01em] ${
                  active
                    ? "font-semibold text-[#ef4f75]"
                    : "font-medium text-slate-400"
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

function SafeInput({ className = "", onKeyDown, onKeyUp, onKeyPress, ...rest }) {
  return (
    <Input
      {...rest}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      className={`h-[42px] rounded-[14px] border border-slate-200 bg-white px-4 text-[13px] leading-[42px] text-slate-900 placeholder:text-slate-400 caret-slate-900 focus:border-rose-400 focus:ring-1 focus:ring-rose-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${className}`}
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
          ? "bg-rose-500 text-white"
          : "bg-white text-rose-500 hover:bg-rose-50"
      }`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
      <span className="leading-none">{children}</span>
    </button>
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

export default function NightIn() {
  const [user, setUser] = React.useState(null);
  const [sessionId, setSessionId] = React.useState(null);
  const [coupleId, setCoupleId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [errorText, setErrorText] = React.useState("");
  const [activeGame, setActiveGame] = React.useState(GAME_CLUE_DATE);
  const [gameState, setGameState] = React.useState(getDefaultGameState());

  const channelRef = React.useRef(null);
  const isPreviewLocked = !coupleId;

  const saveSession = React.useCallback(
    async (nextActiveGame, nextGameState) => {
      if (!coupleId || !user?.id) return;

      setSaving(true);

      try {
        const { data, error } = await supabase
          .from("nightin_sessions")
          .upsert(
            {
              couple_profile_id: coupleId,
              active_game: nextActiveGame,
              game_state: nextGameState,
              created_by: user.id,
              updated_by: user.id,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "couple_profile_id" }
          )
          .select("id, active_game, game_state")
          .single();

        if (error) throw error;

        setSessionId(data.id);
        setActiveGame(data.active_game || GAME_CLUE_DATE);
        setGameState(mergeGameState(data.game_state));
      } catch (error) {
        console.error("NightIn saveSession error:", error);
        setErrorText(error.message || "Could not save NightIn session.");
      } finally {
        setSaving(false);
      }
    },
    [coupleId, user?.id]
  );

  React.useEffect(() => {
    let mounted = true;

    async function loadPage() {
      setLoading(true);
      setErrorText("");

      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!authUser) {
          if (!mounted) return;
          setUser(null);
          setCoupleId(null);
          setLoading(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, email, full_name, couple_profile_id, relationship_status")
          .eq("id", authUser.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const activeCoupleId = profileData?.couple_profile_id || null;

        if (!mounted) return;

        setUser(authUser);
        setCoupleId(activeCoupleId);

        if (!activeCoupleId) {
          setSessionId(null);
          setActiveGame(GAME_CLUE_DATE);
          setGameState(getDefaultGameState());
          setLoading(false);
          return;
        }

        const { data: existingSession, error: sessionError } = await supabase
          .from("nightin_sessions")
          .select("id, active_game, game_state")
          .eq("couple_profile_id", activeCoupleId)
          .maybeSingle();

        if (sessionError) throw sessionError;

        if (existingSession) {
          setSessionId(existingSession.id);
          setActiveGame(existingSession.active_game || GAME_CLUE_DATE);
          setGameState(mergeGameState(existingSession.game_state));
        } else {
          const defaultState = getDefaultGameState();

          const { data: createdSession, error: createError } = await supabase
            .from("nightin_sessions")
            .insert({
              couple_profile_id: activeCoupleId,
              active_game: GAME_CLUE_DATE,
              game_state: defaultState,
              created_by: authUser.id,
              updated_by: authUser.id,
            })
            .select("id, active_game, game_state")
            .single();

          if (createError) throw createError;

          setSessionId(createdSession.id);
          setActiveGame(createdSession.active_game || GAME_CLUE_DATE);
          setGameState(mergeGameState(createdSession.game_state));
        }
      } catch (error) {
        console.error("NightIn loadPage error:", error);
        if (mounted) setErrorText(error.message || "Unable to load NightIn.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!coupleId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`nightin-session-${coupleId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nightin_sessions",
          filter: `couple_profile_id=eq.${coupleId}`,
        },
        (payload) => {
          const row = payload.new;
          if (!row) return;

          setSessionId(row.id);
          setActiveGame(row.active_game || GAME_CLUE_DATE);
          setGameState(mergeGameState(row.game_state));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [coupleId]);

  const updatePayload = React.useCallback(
    async (updater) => {
      if (!coupleId || !user?.id) return;

      setGameState((prev) => {
        const currentState = mergeGameState(prev);
        const currentPayload =
          currentState[activeGame] || defaultPayloadFor(activeGame);

        const nextPayload =
          typeof updater === "function" ? updater(currentPayload) : updater;

        const nextState = {
          ...currentState,
          [activeGame]: nextPayload,
        };

        saveSession(activeGame, nextState);
        return nextState;
      });
    },
    [activeGame, coupleId, saveSession, user?.id]
  );

  const changeActiveGame = React.useCallback(
    async (gameType) => {
      setActiveGame(gameType);
      if (!coupleId || !user?.id) return;
      await saveSession(gameType, gameState);
    },
    [coupleId, gameState, saveSession, user?.id]
  );

  const resetCurrentGame = React.useCallback(async () => {
    if (!coupleId || !user?.id) return;

    const nextState = {
      ...mergeGameState(gameState),
      [activeGame]: defaultPayloadFor(activeGame),
    };

    setGameState(nextState);
    await saveSession(activeGame, nextState);
  }, [activeGame, coupleId, gameState, saveSession, user?.id]);

  const currentPayload = React.useMemo(() => {
    return gameState[activeGame] || defaultPayloadFor(activeGame);
  }, [activeGame, gameState]);

  const stats = React.useMemo(() => {
    const twoTruths = gameState[GAME_TWO_TRUTHS];
    const twenty = gameState[GAME_TWENTY_QUESTIONS];
    const clueDate = gameState[GAME_CLUE_DATE];
    const fit = gameState[GAME_DATE_FIT];

    return {
      rounds: twoTruths?.phase === "REVEAL" ? 1 : 0,
      questions: twenty?.qCount || 0,
      clueRound: clueDate?.round || 1,
      fitScore: Object.values(fit?.score || {}).reduce(
        (sum, n) => sum + Number(n || 0),
        0
      ),
    };
  }, [gameState]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3edf1]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-[#f3edf1] p-4 pb-[74px]">
          <Card className="mx-auto mt-8 w-full max-w-md p-6 text-center">
            <p className="mb-4 text-slate-600">
              Please sign in to access NightIn
            </p>
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
            <h2 className="truncate text-[22px] font-semibold text-white">
              NightIn
            </h2>
            <p className="mt-1 text-[11px] text-white/75">
              {saving
                ? "Syncing…"
                : isPreviewLocked
                ? "Preview mode"
                : "Synced for both partners"}
            </p>
          </div>

          <div className="-mt-2 px-4 pt-4 pb-6">
            {errorText ? (
              <div className="mb-4 rounded-[18px] bg-red-50 p-3 text-[12px] text-red-600">
                {errorText}
              </div>
            ) : null}

            {isPreviewLocked ? (
              <div className="mb-4 rounded-[18px] bg-white p-3 text-[12px] font-medium text-slate-600 shadow-[0_6px_14px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-rose-500" />
                  <span>
                    Preview visible. Become Date-Locked to play and save progress.
                  </span>
                </div>
              </div>
            ) : null}

            <div className="mb-4 grid grid-cols-2 gap-3">
              <GamePill
                active={activeGame === GAME_TWO_TRUTHS}
                onClick={() => changeActiveGame(GAME_TWO_TRUTHS)}
                icon={Sparkles}
              >
                Two Truths
              </GamePill>

              <GamePill
                active={activeGame === GAME_TWENTY_QUESTIONS}
                onClick={() => changeActiveGame(GAME_TWENTY_QUESTIONS)}
              >
                20 Questions
              </GamePill>

              <GamePill
                active={activeGame === GAME_CLUE_DATE}
                onClick={() => changeActiveGame(GAME_CLUE_DATE)}
                icon={Lightbulb}
              >
                Clue-Date
              </GamePill>

              <GamePill
                active={activeGame === GAME_DATE_FIT}
                onClick={() => changeActiveGame(GAME_DATE_FIT)}
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
                icon={<Lightbulb />}
                value={stats.clueRound}
                label="Clue Round"
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
                        ? "Two Truths and a Lie"
                        : activeGame === GAME_TWENTY_QUESTIONS
                        ? "20 Questions"
                        : activeGame === GAME_CLUE_DATE
                        ? "Clue-Date"
                        : "Date-Fit"}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={resetCurrentGame}
                  disabled={saving || isPreviewLocked}
                  className="h-[38px] rounded-[14px] bg-white px-3 text-[12px] font-medium text-rose-500 shadow-[0_6px_14px_rgba(15,23,42,0.08)] hover:bg-slate-50 disabled:opacity-60"
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Reset
                </Button>
              </div>

              <div className="px-5 py-5">
                {activeGame === GAME_TWO_TRUTHS ? (
                  <TwoTruthsGame
                    payload={currentPayload}
                    currentUserId={user.id}
                    setPayload={updatePayload}
                    disabled={isPreviewLocked}
                  />
                ) : activeGame === GAME_TWENTY_QUESTIONS ? (
                  <TwentyQuestionsGame
                    payload={currentPayload}
                    currentUserId={user.id}
                    setPayload={updatePayload}
                    disabled={isPreviewLocked}
                  />
                ) : activeGame === GAME_CLUE_DATE ? (
                  <ClueDateGame
                    payload={currentPayload}
                    currentUserId={user.id}
                    setPayload={updatePayload}
                    disabled={isPreviewLocked}
                  />
                ) : (
                  <DateFitGame
                    payload={currentPayload}
                    currentUserId={user.id}
                    setPayload={updatePayload}
                    disabled={isPreviewLocked}
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

function ClueDateGame({ payload, currentUserId, setPayload, disabled = false }) {
  const myId = String(currentUserId);
  const phase = payload?.phase || "SETUP";
  const isClueMaster = String(payload?.clueMasterId || "") === myId;
  const isGuesser = phase === "GUESSING" && !isClueMaster;

  const [category, setCategory] = React.useState(payload?.category || "Movies");
  const [answer, setAnswer] = React.useState(payload?.answer || "");
  const [guess, setGuess] = React.useState(payload?.guessText || "");
  const [timeLeft, setTimeLeft] = React.useState(payload?.timerSeconds || 30);

  const clueBank = React.useMemo(
  () => ({
    Movies: {
      Titanic: [
        "A famous love story on a ship.",
        "The ending happens in freezing water.",
        "A necklace plays an important role.",
        "The main couple meets during a voyage.",
        "One character says he is king of the world.",
        "The movie is based on a real disaster.",
        "The ship was called unsinkable.",
        "The love story crosses social classes.",
        "It has one of the most famous movie songs.",
        "The lead characters are Jack and Rose.",
      ],
      "Black Panther": [
        "A superhero movie linked to Wakanda.",
        "The hero wears a dark suit.",
        "It has a powerful hidden kingdom.",
        "Vibranium is very important.",
        "The main character becomes king.",
        "The movie is part of Marvel.",
        "The villain has royal blood.",
        "The salute became globally famous.",
        "Technology and tradition are mixed.",
        "The hero protects his nation.",
      ],
      "The Lion King": [
        "A young prince must claim his place.",
        "Animals are the main characters.",
        "The setting is the Pride Lands.",
        "The uncle is the villain.",
        "A famous song says no worries.",
        "The hero’s father dies.",
        "The story includes a wise monkey.",
        "The main character runs away then returns.",
        "The movie has a circle-of-life theme.",
        "The hero is Simba.",
      ],
      "Fast and Furious": [
        "Cars are central to the story.",
        "Family is repeated many times.",
        "Street racing started the franchise.",
        "Dominic is one of the main characters.",
        "Explosions and stunts are common.",
        "Loyalty is a major theme.",
        "There are many sequels.",
        "The characters often break the law.",
        "The franchise became global.",
        "High-speed action is everywhere.",
      ],
      "Avengers": [
        "A team of superheroes fights together.",
        "It belongs to Marvel.",
        "Several heroes appear in one movie.",
        "The team faces major world-level threats.",
        "Iron Man is part of the group.",
        "Captain America is part of the group.",
        "The enemy can be extremely powerful.",
        "The story connects to other Marvel films.",
        "Teamwork is a major theme.",
        "It became a huge cinema event.",
      ],
      "Spider-Man": [
        "The hero is linked to a spider bite.",
        "He swings between buildings.",
        "His identity is usually hidden.",
        "New York is strongly linked to the story.",
        "He is often young compared to other heroes.",
        "His suit is red and blue.",
        "He uses webs.",
        "Responsibility is a major theme.",
        "He has appeared in many versions.",
        "Peter Parker is the famous name.",
      ],
      "John Wick": [
        "The main character is a feared assassin.",
        "A dog is important to the story.",
        "Action scenes are very intense.",
        "The underworld has strict rules.",
        "The character wears suits often.",
        "Revenge drives the plot.",
        "Keanu Reeves plays the lead.",
        "The fighting style is very polished.",
        "A hotel is linked to assassins.",
        "The lead character is difficult to kill.",
      ],
      "The Matrix": [
        "Reality is not what it seems.",
        "The main character is Neo.",
        "People are plugged into a system.",
        "Black coats and sunglasses are iconic.",
        "Bullet-time became famous.",
        "Machines control much of the world.",
        "Choosing a pill is important.",
        "It mixes action and philosophy.",
        "Keanu Reeves stars in it.",
        "The question is about escaping illusion.",
      ],
      "Shrek": [
        "The main character is an ogre.",
        "A donkey is his close companion.",
        "It makes fun of fairy tales.",
        "A princess has a secret.",
        "The swamp is important.",
        "It is animated.",
        "The humor works for adults and kids.",
        "The main character does not want visitors.",
        "A dragon appears.",
        "The story is about accepting yourself.",
      ],
      "Frozen": [
        "Two sisters are central to the story.",
        "Ice powers are important.",
        "A snowman is a funny character.",
        "A famous song became global.",
        "The kingdom is affected by winter.",
        "One sister runs away.",
        "It is animated.",
        "Love between sisters matters most.",
        "The main character wears a blue dress.",
        "The phrase 'let it go' is linked to it.",
      ],
      "Harry Potter": [
        "A young wizard goes to a magical school.",
        "A lightning scar is important.",
        "Wands are used often.",
        "Hogwarts is the school.",
        "A dark wizard is the main enemy.",
        "The hero has two close friends.",
        "Magic houses divide students.",
        "A train takes students to school.",
        "Spells and potions are common.",
        "The main character survived as a baby.",
      ],
    },

    Sports: {
      Soccer: [
        "It is played with a round ball.",
        "There are usually 11 players per side.",
        "Goals decide the score.",
        "A goalkeeper protects the net.",
        "It is the world’s most popular sport.",
        "The World Cup is its biggest event.",
        "Players cannot use hands except the keeper.",
        "A red card removes a player.",
        "Penalty kicks can decide games.",
        "Fans are extremely passionate.",
      ],
      Rugby: [
        "Players carry an oval ball.",
        "Tackling is central to the game.",
        "South Africa is very strong in this sport.",
        "A try scores points.",
        "The Springboks are famous for it.",
        "Scrums happen during play.",
        "The ball can be kicked for territory.",
        "It is physical and tactical.",
        "The World Cup is a major event.",
        "Fifteen players usually start per side.",
      ],
      Cricket: [
        "It uses a bat and ball.",
        "Runs are scored between wickets.",
        "Overs structure the game.",
        "A bowler tries to dismiss the batter.",
        "It can last hours or days.",
        "T20 made it faster.",
        "South Africa has the Proteas.",
        "A six means the ball clears the boundary.",
        "Wickets are important.",
        "It is popular in Commonwealth countries.",
      ],
      Basketball: [
        "The target is a hoop.",
        "Players dribble the ball.",
        "Three-pointers are important.",
        "Five players are usually on court.",
        "The NBA is the most famous league.",
        "Dunks are highlight moments.",
        "The court has a free-throw line.",
        "It is fast-paced.",
        "Tall players often dominate near the rim.",
        "Michael Jordan is strongly linked to it.",
      ],
      Tennis: [
        "Players use rackets.",
        "The ball goes over a net.",
        "It can be singles or doubles.",
        "Wimbledon is a major tournament.",
        "A serve starts the point.",
        "The scoring includes love, deuce, and advantage.",
        "It can be played on grass, clay, or hard court.",
        "Grand Slam titles are very important.",
        "Players change sides during matches.",
        "The ball must land inside lines.",
      ],
      Boxing: [
        "Fighters use gloves.",
        "Rounds structure the contest.",
        "A knockout can end the fight.",
        "Punching is the main action.",
        "Weight divisions are important.",
        "The referee controls the ring.",
        "Defence and footwork matter.",
        "A belt often represents a title.",
        "Fighters have corners.",
        "The sport is physically intense.",
      ],
      Formula1: [
        "Fast cars race on circuits.",
        "Drivers compete for a championship.",
        "Pit stops can change the result.",
        "Teams build and manage the cars.",
        "Tyres are very important.",
        "The race has laps.",
        "Speed and strategy both matter.",
        "A safety car can appear.",
        "Qualifying decides starting positions.",
        "The cars are open-wheel.",
      ],
      Golf: [
        "Players hit a small ball with clubs.",
        "The goal is to finish holes in few shots.",
        "Courses have greens and fairways.",
        "A hole-in-one is rare.",
        "The Masters is a famous tournament.",
        "Players carry different clubs.",
        "Putting happens on the green.",
        "Bunkers and water are hazards.",
        "Lower score is better.",
        "It is known for patience and precision.",
      ],
    },

    Music: {
      "Beyoncé": [
        "A global pop and R&B superstar.",
        "She was part of Destiny’s Child.",
        "Her performances are highly polished.",
        "Her fanbase is called the BeyHive.",
        "She is linked to powerful vocals.",
        "She has many iconic visual albums.",
        "She is married to a famous rapper.",
        "She is known for stage presence.",
        "Her music often celebrates confidence.",
        "She is one of the biggest artists in the world.",
      ],
      "Drake": [
        "A Canadian rapper and singer.",
        "He started as an actor.",
        "He mixes rap and melody.",
        "Toronto is strongly linked to him.",
        "He has many chart hits.",
        "His lyrics often discuss relationships.",
        "OVO is linked to his brand.",
        "He often uses emotional themes.",
        "He has collaborated with many major artists.",
        "He is one of the most streamed artists.",
      ],
      "Rihanna": [
        "A singer from Barbados.",
        "She became famous with pop and R&B hits.",
        "She also built a major beauty brand.",
        "Her voice is very recognizable.",
        "She has hits about umbrellas and diamonds.",
        "Fashion is strongly linked to her image.",
        "She performed at the Super Bowl halftime show.",
        "She became a billionaire entrepreneur.",
        "She is known for confidence and style.",
        "Fans waited years for new music.",
      ],
      "Michael Jackson": [
        "Known as the King of Pop.",
        "Moonwalking is linked to him.",
        "Thriller is one of his biggest works.",
        "He was famous as a child performer.",
        "His music videos changed pop culture.",
        "A single glove became iconic.",
        "He had extremely precise dance moves.",
        "He influenced generations of performers.",
        "He had many global hits.",
        "His stage presence was legendary.",
      ],
      "Amapiano": [
        "A music style strongly linked to South Africa.",
        "Log drums are a major sound.",
        "It is popular in clubs and parties.",
        "Dance challenges often use it.",
        "It blends house, jazz, and local sounds.",
        "It became internationally popular.",
        "The beat often has a relaxed groove.",
        "It is strongly linked to township culture.",
        "Many South African artists helped it grow.",
        "It is a modern African music movement.",
      ],
      "Afrobeats": [
        "A popular modern African music sound.",
        "Nigeria is strongly linked to it.",
        "It blends rhythm, melody, and dance.",
        "Burna Boy and Wizkid are linked to it.",
        "It is popular globally.",
        "The sound is often smooth and rhythmic.",
        "It works well for parties.",
        "It mixes African sounds with pop.",
        "It has grown on global charts.",
        "It is a major cultural export.",
      ],
    },

    Celebrities: {
      "Cristiano Ronaldo": [
        "A famous football player.",
        "He is linked to Portugal.",
        "He has played for Real Madrid.",
        "He is known for discipline and fitness.",
        "His celebration is very famous.",
        "He wears number 7 often.",
        "He has won many individual awards.",
        "He is one of the most followed people online.",
        "He is known for scoring goals.",
        "Fans often compare him with Messi.",
      ],
      "Lionel Messi": [
        "A famous football player from Argentina.",
        "He is known for dribbling.",
        "Barcelona is strongly linked to his career.",
        "He won the World Cup with Argentina.",
        "Fans compare him with Ronaldo.",
        "He is known for close ball control.",
        "He is left-footed.",
        "He has won many Ballon d’Or awards.",
        "He is not very tall.",
        "He is considered one of the greatest players ever.",
      ],
      "Dwayne Johnson": [
        "Also known as The Rock.",
        "He was a professional wrestler.",
        "He became a Hollywood actor.",
        "He is known for action movies.",
        "He has a muscular build.",
        "His eyebrow raise is famous.",
        "He often plays heroic characters.",
        "He has a strong fitness image.",
        "He worked in WWE.",
        "He is known for charisma.",
      ],
      "Taylor Swift": [
        "A global singer-songwriter.",
        "Her fans are called Swifties.",
        "She writes many songs about relationships.",
        "She has many album eras.",
        "She started in country music.",
        "Her tours are massive events.",
        "She rerecorded some albums.",
        "She is known for storytelling lyrics.",
        "She has many number-one hits.",
        "She is one of the biggest pop stars.",
      ],
      "Trevor Noah": [
        "A South African comedian.",
        "He hosted The Daily Show.",
        "He writes and performs stand-up comedy.",
        "He was born in South Africa.",
        "His book is called Born a Crime.",
        "He jokes about culture and politics.",
        "He became internationally famous.",
        "He speaks several languages.",
        "He often discusses identity.",
        "He is known for sharp humour.",
      ],
    },

    Places: {
      "Cape Town": [
        "A famous South African city.",
        "Table Mountain is strongly linked to it.",
        "It has beaches and wine regions nearby.",
        "Tourists love visiting it.",
        "The waterfront is popular.",
        "It is in the Western Cape.",
        "Robben Island is nearby.",
        "It has dramatic natural scenery.",
        "It is often called one of the most beautiful cities.",
        "The ocean and mountains meet there.",
      ],
      "Johannesburg": [
        "A major city in South Africa.",
        "It is linked to gold history.",
        "It is in Gauteng.",
        "It is a major business hub.",
        "People often call it Jozi.",
        "Soweto is part of its story.",
        "It has busy traffic.",
        "It is not a coastal city.",
        "It is one of Africa’s biggest urban economies.",
        "Many people move there for opportunities.",
      ],
      "Durban": [
        "A coastal South African city.",
        "It is known for warm beaches.",
        "It is in KwaZulu-Natal.",
        "The Golden Mile is famous.",
        "Indian Ocean weather shapes the city.",
        "It has strong Indian cultural influence.",
        "It is popular for holidays.",
        "Surfing is common there.",
        "It has a major harbour.",
        "Bunny chow is strongly linked to it.",
      ],
      "Paris": [
        "A famous European city.",
        "The Eiffel Tower is linked to it.",
        "It is known as romantic.",
        "It is the capital of France.",
        "Fashion is strongly linked to it.",
        "The Louvre is there.",
        "The Seine River runs through it.",
        "It attracts many tourists.",
        "Cafés and art are part of its image.",
        "It is called the City of Light.",
      ],
      "New York": [
        "A famous American city.",
        "Times Square is linked to it.",
        "It has many skyscrapers.",
        "The Statue of Liberty is nearby.",
        "It is known as the city that never sleeps.",
        "Central Park is there.",
        "Wall Street is linked to finance.",
        "Broadway is linked to theatre.",
        "It has five boroughs.",
        "It appears in many movies.",
      ],
    },

    Food: {
      Pizza: [
        "It is usually round.",
        "Cheese is a major ingredient.",
        "It often has toppings.",
        "It is strongly linked to Italy.",
        "It is cut into slices.",
        "People order it for parties.",
        "It can be thin or thick crust.",
        "Tomato sauce is common.",
        "It is popular worldwide.",
        "Pepperoni is a common topping.",
      ],
      Sushi: [
        "It is linked to Japan.",
        "Rice is important.",
        "Fish is often involved.",
        "It is served in small pieces.",
        "Soy sauce is commonly used.",
        "Wasabi may come with it.",
        "Chopsticks are often used.",
        "It can include seaweed.",
        "Some versions use raw fish.",
        "It is popular as a date-night meal.",
      ],
      "Bunny Chow": [
        "It is strongly linked to Durban.",
        "It uses hollowed-out bread.",
        "Curry fills the bread.",
        "It is a South African food.",
        "It is often eaten with hands.",
        "It can be spicy.",
        "It has Indian-South African roots.",
        "It is filling and messy.",
        "It is popular street food.",
        "The bread acts like a bowl.",
      ],
      Burger: [
        "It usually has a bun.",
        "A patty is the main filling.",
        "Cheese can be added.",
        "It is common at fast-food places.",
        "Lettuce and tomato are common extras.",
        "Fries often come with it.",
        "It can be beef, chicken, or veggie.",
        "It is held with both hands.",
        "Sauce makes it messy.",
        "It is popular for casual dates.",
      ],
      Chocolate: [
        "It is sweet.",
        "It is linked to cocoa.",
        "People give it as a romantic gift.",
        "It can be dark, milk, or white.",
        "It melts easily.",
        "Desserts often use it.",
        "It is popular on Valentine’s Day.",
        "It can come in bars.",
        "It is loved by many people.",
        "It can be paired with strawberries.",
      ],
    },

    "Couple Life": {
      "First Date": [
        "It usually happens early in a relationship.",
        "People often remember the outfit.",
        "There may be nervousness.",
        "Food or coffee is often involved.",
        "It can decide if there is chemistry.",
        "Couples often talk about it later.",
        "It may include awkward silence.",
        "It can become a special memory.",
        "Planning matters a lot.",
        "It is the beginning of a shared story.",
      ],
      Anniversary: [
        "It happens once a year.",
        "Couples often celebrate it.",
        "It marks a special date.",
        "Gifts or dinner may be involved.",
        "Memories are often revisited.",
        "It can be romantic.",
        "Photos are often taken.",
        "It reminds couples how far they have come.",
        "Some people forget it and get in trouble.",
        "It is linked to relationship milestones.",
      ],
      "Movie Night": [
        "It usually happens at home or cinema.",
        "Snacks are important.",
        "Choosing what to watch can take long.",
        "Blankets may be involved.",
        "Couples often cuddle during it.",
        "Arguments can happen over the genre.",
        "It is low-pressure bonding.",
        "It can become a weekly ritual.",
        "Popcorn is common.",
        "It is perfect for NightIn.",
      ],
      "Date Night": [
        "Couples plan it to spend time together.",
        "It can involve dinner.",
        "Outfits may matter.",
        "It breaks routine.",
        "It can happen indoors or outdoors.",
        "It creates memories.",
        "It may include surprises.",
        "Photos are often taken.",
        "It keeps the relationship active.",
        "Effort matters more than money.",
      ],
      "Inside Joke": [
        "Only the couple fully understands it.",
        "It can start from a random moment.",
        "It makes both people laugh.",
        "It becomes part of the relationship language.",
        "Others may not understand it.",
        "It can last for years.",
        "A word or look can trigger it.",
        "It strengthens closeness.",
        "It feels private.",
        "It often comes from shared memories.",
      ],
          "Geography / Places": {
      "Mount Everest": [
        "It is the highest mountain on Earth.",
        "It is in the Himalayas.",
        "Climbers train for months to attempt it.",
        "The summit is extremely cold.",
        "Nepal is strongly linked to it.",
        "Oxygen becomes a major problem near the top.",
        "It attracts adventurers from around the world.",
        "Sherpas are often linked to climbs there.",
        "Reaching the top is considered a major achievement.",
        "It is taller than 8,000 meters.",
      ],
      "Sahara Desert": [
        "It is one of the largest deserts in the world.",
        "It is in Africa.",
        "Sand dunes are strongly linked to it.",
        "Temperatures can be extremely hot.",
        "Camels are often associated with it.",
        "It covers parts of many countries.",
        "Water is very scarce there.",
        "It is larger than many countries.",
        "It has harsh survival conditions.",
        "It is famous for its dry landscape.",
      ],
      "Amazon Rainforest": [
        "It is one of the world’s largest rainforests.",
        "It is in South America.",
        "It has huge biodiversity.",
        "A famous river shares its name.",
        "It is important for the planet’s climate.",
        "Many species live there.",
        "It is often called the lungs of the Earth.",
        "Brazil contains a large part of it.",
        "It is dense and green.",
        "Deforestation is a major concern there.",
      ],
      "Great Wall of China": [
        "It is a famous structure in Asia.",
        "It was built for protection.",
        "It stretches across a huge distance.",
        "China is strongly linked to it.",
        "It is visited by many tourists.",
        "It is made of walls and watchtowers.",
        "It is very old.",
        "It appears in many history lessons.",
        "It was built over many dynasties.",
        "It is one of the world’s most famous landmarks.",
      ],
      "Victoria Falls": [
        "It is a famous waterfall in Africa.",
        "It is linked to Zambia and Zimbabwe.",
        "Mist rises strongly from it.",
        "It is one of the largest waterfalls in the world.",
        "The local name means smoke that thunders.",
        "Tourists travel to see it.",
        "The Zambezi River feeds it.",
        "It is dramatic and powerful.",
        "Rainbows can appear in the spray.",
        "It is a major natural attraction.",
      ],
    },

    "TV Shows": {
      Friends: [
        "It follows a group of friends in New York.",
        "A coffee shop is very important.",
        "The theme song is very famous.",
        "There are six main friends.",
        "One character says 'How you doin?'",
        "The show includes roommates and relationships.",
        "It was one of the biggest sitcoms.",
        "Ross and Rachel are a major storyline.",
        "Monica, Chandler, Joey, Phoebe, Ross, and Rachel are central.",
        "It is still watched years later.",
      ],
      "Game of Thrones": [
        "It has dragons.",
        "Several families fight for power.",
        "A throne is central to the story.",
        "Winter is a repeated warning.",
        "The show is based on fantasy books.",
        "Kings and queens are everywhere.",
        "The story has major betrayals.",
        "Westeros is the main setting.",
        "The Stark family is very important.",
        "It became one of the biggest TV shows.",
      ],
      "Breaking Bad": [
        "A chemistry teacher becomes a criminal.",
        "The main character is Walter White.",
        "Blue product is linked to the story.",
        "A former student becomes his partner.",
        "The story involves crime and consequences.",
        "New Mexico is strongly linked to it.",
        "The main character changes dramatically.",
        "A hat and glasses became iconic.",
        "It is known for intense storytelling.",
        "The phrase 'I am the one who knocks' is linked to it.",
      ],
      "Squid Game": [
        "Players compete in deadly games.",
        "The tracksuits are green.",
        "The guards wear masks.",
        "A giant doll appears in one game.",
        "It is a Korean show.",
        "Money is a major motivation.",
        "Childhood games become dangerous.",
        "The visuals use strong colors.",
        "It became globally popular.",
        "The red light, green light game is famous.",
      ],
      "The Big Bang Theory": [
        "It follows scientists and their friends.",
        "Sheldon is a central character.",
        "The characters love geek culture.",
        "A couch spot becomes important.",
        "The show has many science jokes.",
        "Penny lives across the hall.",
        "Bazinga is linked to the show.",
        "It is a sitcom.",
        "Leonard and Sheldon are roommates.",
        "It mixes friendship, romance, and nerd culture.",
      ],
      "Money Heist": [
        "A group plans major robberies.",
        "The Professor leads the plan.",
        "Red jumpsuits are iconic.",
        "Masks are important.",
        "The show is originally Spanish.",
        "City names are used as character names.",
        "A famous song is linked to it.",
        "The target includes a mint.",
        "Strategy and betrayal matter.",
        "It became popular worldwide.",
      ],
    },

    "Super Famous People": {
      "Nelson Mandela": [
        "He was South Africa’s first democratic president.",
        "He spent many years in prison.",
        "Robben Island is linked to his story.",
        "He became a global symbol of peace.",
        "He fought against apartheid.",
        "His clan name is Madiba.",
        "He won a Nobel Peace Prize.",
        "He is one of the most respected leaders in history.",
        "He promoted reconciliation.",
        "His life is strongly linked to South African freedom.",
      ],
      "Elon Musk": [
        "He is linked to Tesla.",
        "He is linked to SpaceX.",
        "He was born in South Africa.",
        "He is known for technology companies.",
        "Electric cars are strongly linked to him.",
        "Rockets are strongly linked to him.",
        "He bought a major social media platform.",
        "He is one of the world’s richest people.",
        "He often makes headlines.",
        "Mars is often linked to his ambitions.",
      ],
      "Oprah Winfrey": [
        "She is a famous talk show host.",
        "Her interviews became globally known.",
        "She built a major media empire.",
        "She is known for emotional conversations.",
        "Her name is linked to inspiration.",
        "She has influenced books and television.",
        "She became one of the most powerful women in media.",
        "She is also an actress and producer.",
        "Audience giveaways became famous on her show.",
        "She is widely recognized worldwide.",
      ],
      "Barack Obama": [
        "He was president of the United States.",
        "He was the first Black U.S. president.",
        "Michelle is his wife.",
        "He is known for strong speeches.",
        "His campaign used the word hope.",
        "He served two terms.",
        "He won a Nobel Peace Prize.",
        "He wrote several books.",
        "He remains globally recognized.",
        "He was president before Donald Trump.",
      ],
      "Kim Kardashian": [
        "She became famous through reality TV.",
        "Her family is globally known.",
        "She built beauty and fashion brands.",
        "Social media is central to her fame.",
        "She is linked to the Kardashian name.",
        "She has been involved in legal reform efforts.",
        "Her style often trends online.",
        "She has millions of followers.",
        "She was married to Kanye West.",
        "She is one of the most famous reality stars.",
      ],
      "Michael Jordan": [
        "He is one of the greatest basketball players ever.",
        "The Chicago Bulls are strongly linked to him.",
        "Number 23 is famous because of him.",
        "Air Jordan shoes carry his name.",
        "He won multiple NBA championships.",
        "He is known for competitiveness.",
        "He became a global sports icon.",
        "He could score and defend at elite level.",
        "His logo appears on sneakers.",
        "Fans compare many players to him.",
      ],
      "Beyoncé": [
        "She is one of the most famous singers in the world.",
        "Her fanbase is called the BeyHive.",
        "She was part of Destiny’s Child.",
        "Her performances are known for precision.",
        "She is married to Jay-Z.",
        "She has many iconic albums.",
        "She is linked to powerful vocals.",
        "Her tours are major events.",
        "She is also an actress and businesswoman.",
        "She is often called Queen Bey.",
      ],
    },

    },
  }),
  []
);

  const availableAnswers = Object.keys(clueBank[category] || {});

  React.useEffect(() => {
    setCategory(payload?.category || "Movies");
    setAnswer(payload?.answer || "");
    setGuess(payload?.guessText || "");
  }, [payload?.category, payload?.answer, payload?.guessText]);

  React.useEffect(() => {
    if (!payload?.startedAt || phase !== "GUESSING") {
      setTimeLeft(payload?.timerSeconds || 30);
      return;
    }

    const tick = () => {
      const started = new Date(payload.startedAt).getTime();
      const elapsed = Math.floor((Date.now() - started) / 1000);
      setTimeLeft(Math.max(30 - elapsed, 0));
    };

    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [payload?.startedAt, payload?.timerSeconds, phase]);

  const generateFiveClues = (nextCategory, nextAnswer) => {
    const source = clueBank[nextCategory]?.[nextAnswer] || [];
    return [...source].sort(() => Math.random() - 0.5).slice(0, 5);
  };

  const startRound = () => {
    if (disabled || !answer) return;

    setPayload({
      ...payload,
      phase: "CHOOSE_CLUES",
      round: payload?.round || 1,
      category,
      answer,
      cluePack: generateFiveClues(category, answer),
      selectedClues: [],
      clueMasterId: myId,
      guesserId: "",
      guessText: "",
      startedAt: null,
      timerSeconds: 30,
      result: null,
      score: payload?.score || {},
    });
  };

  const nextClues = () => {
    if (disabled || !payload?.answer) return;

    setPayload({
      ...payload,
      cluePack: generateFiveClues(payload.category, payload.answer),
      selectedClues: [],
    });
  };

  const toggleClue = (clue) => {
    if (disabled || !isClueMaster) return;

    const selected = Array.isArray(payload?.selectedClues)
      ? payload.selectedClues
      : [];

    setPayload({
      ...payload,
      selectedClues: selected.includes(clue)
        ? selected.filter((item) => item !== clue)
        : [...selected, clue],
    });
  };

  const sendClues = () => {
    const selected = Array.isArray(payload?.selectedClues)
      ? payload.selectedClues
      : [];

    if (disabled || !isClueMaster || selected.length === 0) return;

    setPayload({
      ...payload,
      phase: "GUESSING",
      startedAt: new Date().toISOString(),
      timerSeconds: 30,
      guesserId: "",
      guessText: "",
      result: null,
    });
  };

  const submitGuess = () => {
    if (disabled || !guess.trim()) return;

    const cleanGuess = guess.trim();
    const correct =
      cleanGuess.toLowerCase() === String(payload?.answer || "").toLowerCase();

    const score = { ...(payload?.score || {}) };

    if (correct) {
      score[myId] = Number(score[myId] || 0) + 1;
    }

    setPayload({
      ...payload,
      phase: correct ? "CORRECT" : "WRONG",
      guesserId: myId,
      guessText: cleanGuess,
      result: correct ? "correct" : "wrong",
      score,
    });
  };

  const nextRound = () => {
    setGuess("");
    setPayload({
      ...defaultPayloadFor(GAME_CLUE_DATE),
      round: Number(payload?.round || 1) + 1,
      score: payload?.score || {},
    });
  };

  const selectedClues = Array.isArray(payload?.selectedClues)
    ? payload.selectedClues
    : [];

  const cluePack = Array.isArray(payload?.cluePack) ? payload.cluePack : [];
  const myScore = Number(payload?.score?.[myId] || 0);

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] bg-[#f8fafc] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold text-slate-900">
              Clue-Date
            </p>
            <p className="mt-2 text-[12px] text-slate-500">
              One partner chooses clues. The other has 30 seconds to guess.
            </p>
          </div>

          <div className="rounded-[16px] bg-white px-3 py-2 text-center shadow-[0_6px_14px_rgba(15,23,42,0.05)]">
            <Timer className="mx-auto h-4 w-4 text-[#2f6df0]" />
            <p className="mt-1 text-[16px] font-black text-[#2f6df0]">
              {timeLeft}s
            </p>
          </div>
        </div>

        {disabled ? (
          <p className="mt-3 text-[11px] font-medium text-rose-500">
            Date-Locked required to play.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniStat value={payload?.round || 1} label="Round" />
        <MiniStat value={myScore} label="My Score" />
        <MiniStat
          value={
            phase === "SETUP"
              ? "Pick"
              : phase === "CHOOSE_CLUES"
              ? "Clues"
              : phase === "GUESSING"
              ? "Guess"
              : "Done"
          }
          label="Status"
        />
      </div>

      {phase === "SETUP" ? (
        <div className="space-y-3">
          <select
  value={category}
  disabled={disabled}
  onChange={(e) => {
    setCategory(e.target.value);
    setAnswer("");
  }}
  className="h-[42px] w-full rounded-[14px] border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none disabled:bg-slate-50"
>
  {Object.keys(clueBank).map((item) => (
    <option key={item} value={item}>
      {item}
    </option>
  ))}
</select>

          <select
            value={answer}
            disabled={disabled}
            onChange={(e) => setAnswer(e.target.value)}
            className="h-[42px] w-full rounded-[14px] border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none disabled:bg-slate-50"
          >
            <option value="">Choose answer...</option>
            {availableAnswers.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <Button
            type="button"
            onClick={startRound}
            disabled={disabled || !answer}
            className="h-[42px] w-full rounded-[14px] bg-rose-500 text-[13px] font-medium text-white hover:bg-rose-600 disabled:opacity-60"
          >
            Generate Clues
          </Button>
        </div>
      ) : null}

      {phase === "CHOOSE_CLUES" ? (
        <div className="space-y-3">
          {isClueMaster ? (
            <>
              <div className="rounded-[18px] bg-[#f8fafc] p-3 text-[12px] text-slate-600">
                Answer hidden from partner:{" "}
                <span className="font-bold text-slate-900">
                  {payload.answer}
                </span>
              </div>

              {cluePack.map((clue) => {
                const active = selectedClues.includes(clue);

                return (
                  <button
                    key={clue}
                    type="button"
                    onClick={() => toggleClue(clue)}
                    className={`w-full rounded-[16px] px-3 py-3 text-left text-[13px] font-semibold ${
                      active
                        ? "bg-[#eaf3ff] text-[#2f6df0] ring-2 ring-[#8ec5ff]"
                        : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {clue}
                  </button>
                );
              })}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={nextClues}
                  disabled={disabled}
                  className="h-[40px] rounded-[14px] bg-white text-rose-500 shadow-[0_6px_14px_rgba(15,23,42,0.08)]"
                >
                  Next Clues
                </Button>

                <Button
                  type="button"
                  onClick={sendClues}
                  disabled={disabled || selectedClues.length === 0}
                  className="h-[40px] rounded-[14px] bg-rose-500 text-white disabled:opacity-60"
                >
                  Send Clues
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-[18px] bg-[#f8fafc] p-4 text-[12px] text-slate-500">
              Waiting for your partner to choose clues.
            </div>
          )}
        </div>
      ) : null}

      {phase === "GUESSING" ? (
        <div className="space-y-3">
          {selectedClues.map((clue) => (
            <div
              key={clue}
              className="rounded-[16px] bg-slate-50 px-3 py-3 text-[13px] font-semibold text-slate-700"
            >
              {clue}
            </div>
          ))}

          {isGuesser ? (
            <>
              <SafeInput
                value={guess}
                disabled={disabled || timeLeft <= 0}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Type your answer..."
              />

              <Button
                type="button"
                onClick={submitGuess}
                disabled={disabled || !guess.trim() || timeLeft <= 0}
                className="h-[42px] w-full rounded-[14px] bg-rose-500 text-[13px] font-medium text-white hover:bg-rose-600 disabled:opacity-60"
              >
                Submit Guess
              </Button>
            </>
          ) : (
            <div className="rounded-[18px] bg-[#f8fafc] p-4 text-[12px] text-slate-500">
              Waiting for your partner to guess.
            </div>
          )}
        </div>
      ) : null}

      {phase === "CORRECT" || phase === "WRONG" ? (
        <div className="space-y-3">
          <div
            className={`rounded-[20px] px-4 py-5 text-center ${
              phase === "CORRECT"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            <p className="text-[20px] font-black">
              {phase === "CORRECT" ? "Correct!" : "Wrong!"}
            </p>
            <p className="mt-2 text-sm font-semibold">
              Answer: {payload.answer}
            </p>
            {payload.guessText ? (
              <p className="mt-1 text-xs">Guess: {payload.guessText}</p>
            ) : null}
          </div>

          <Button
            type="button"
            onClick={nextRound}
            disabled={disabled}
            className="h-[42px] w-full rounded-[14px] bg-rose-500 text-[13px] font-medium text-white hover:bg-rose-600 disabled:opacity-60"
          >
            Next Round
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function MiniStat({ value, label }) {
  return (
    <div className="rounded-[16px] bg-slate-50 px-2 py-3 text-center">
      <p className="truncate text-[18px] font-black text-slate-800">{value}</p>
      <p className="text-[10px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function TwoTruthsGame({ payload, currentUserId, setPayload, disabled = false }) {
  const myId = String(currentUserId);
  const phase = payload?.phase || "ENTER";
  const isAuthor = String(payload?.authorId || "") === myId;

  const [statements, setStatements] = React.useState(
    Array.isArray(payload?.statements) ? payload.statements : defaultPayloadFor(GAME_TWO_TRUTHS).statements
  );
  const [lieIndex, setLieIndex] = React.useState(payload?.lieIndex ?? null);

  React.useEffect(() => {
    setStatements(
      Array.isArray(payload?.statements)
        ? payload.statements
        : defaultPayloadFor(GAME_TWO_TRUTHS).statements
    );
    setLieIndex(payload?.lieIndex ?? null);
  }, [payload?.statements, payload?.lieIndex]);

  const startRound = () => {
    if (disabled) return;
    setPayload({
      ...defaultPayloadFor(GAME_TWO_TRUTHS),
      authorId: myId,
    });
  };

  const submitStatements = () => {
    if (disabled) return;

    const filled = statements.every((s) => (s.text || "").trim().length >= 2);
    if (!filled || lieIndex === null) return;

    setPayload({
      ...payload,
      phase: "GUESS",
      authorId: myId,
      statements: statements.map((s) => ({ ...s, text: s.text.trim() })),
      lieIndex,
      guessByPartner: null,
    });
  };

  const submitGuess = (idx) => {
    if (disabled) return;

    setPayload({
      ...payload,
      guessByPartner: idx,
      phase: "REVEAL",
    });
  };

  return (
    <div className="space-y-4">
      <GameIntro
        title="Two Truths and a Lie"
        text="Write three statements. Your partner must find the lie."
        disabled={disabled}
      />

      <Button
        type="button"
        onClick={startRound}
        disabled={disabled}
        className="h-[42px] w-full rounded-[14px] bg-rose-500 text-[13px] font-medium text-white hover:bg-rose-600 disabled:opacity-60"
      >
        Start New Round
      </Button>

      {phase === "ENTER" && isAuthor ? (
        <div className="space-y-3">
          {statements.map((s, idx) => (
            <div key={s.id} className="rounded-[18px] bg-[#f8fafc] p-3">
              <SafeInput
                value={s.text}
                placeholder={`Statement ${idx + 1}`}
                disabled={disabled}
                onChange={(e) =>
                  setStatements((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, text: e.target.value } : x
                    )
                  )
                }
              />

              <label className="mt-3 flex items-center gap-2">
                <input
                  type="radio"
                  checked={lieIndex === idx}
                  disabled={disabled}
                  onChange={() => setLieIndex(idx)}
                  className="h-4 w-4"
                />
                <span className="text-[12px] font-medium text-slate-600">
                  This is the lie
                </span>
              </label>
            </div>
          ))}

          <Button
            type="button"
            onClick={submitStatements}
            disabled={
              disabled ||
              lieIndex === null ||
              statements.some((s) => (s.text || "").trim().length < 2)
            }
            className="h-[42px] w-full rounded-[14px] bg-rose-500 text-[13px] font-medium text-white hover:bg-rose-600 disabled:opacity-60"
          >
            Send to Partner
          </Button>
        </div>
      ) : null}

      {phase === "ENTER" && !isAuthor ? (
        <Waiting text="Waiting for partner to create the round." />
      ) : null}

      {phase === "GUESS" && !isAuthor ? (
        <div className="space-y-3">
          {(payload?.statements || []).map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => submitGuess(idx)}
              disabled={disabled}
              className="w-full rounded-[18px] bg-[#f8fafc] p-4 text-left text-[13px] font-semibold text-slate-700 disabled:opacity-60"
            >
              {idx + 1}. {s.text}
            </button>
          ))}
        </div>
      ) : null}

      {phase === "GUESS" && isAuthor ? <Waiting text="Waiting for the guess…" /> : null}

      {phase === "REVEAL" ? (
        <div className="space-y-3">
          {(payload?.statements || []).map((s, idx) => {
            const isLie = idx === payload.lieIndex;
            const guessed = idx === payload.guessByPartner;

            return (
              <div
                key={s.id}
                className="rounded-[18px] bg-[#f8fafc] p-4 text-[13px] font-semibold text-slate-700"
              >
                {idx + 1}. {s.text} {isLie ? "(Lie)" : "(Truth)"}
                {guessed ? " — Picked" : ""}
              </div>
            );
          })}

          <ResultBox
            correct={payload.guessByPartner === payload.lieIndex}
            correctText="Correct guess!"
            wrongText="Not quite!"
          />
        </div>
      ) : null}
    </div>
  );
}

function TwentyQuestionsGame({ payload, currentUserId, setPayload, disabled = false }) {
  const [category, setCategory] = React.useState(payload?.answerCategory || "Thing");
  const [hint, setHint] = React.useState(payload?.secretHint || "");
  const [draft, setDraft] = React.useState("");

  const phase = payload?.phase || "CHOOSE";

  React.useEffect(() => {
    setCategory(payload?.answerCategory || "Thing");
    setHint(payload?.secretHint || "");
  }, [payload?.answerCategory, payload?.secretHint]);

  const startGame = () => {
    if (disabled) return;

    setPayload({
      ...payload,
      phase: "ASK",
      chooserId: String(currentUserId),
      answerCategory: category,
      secretHint: hint.trim(),
      qCount: 0,
      log: [],
      winnerUserId: null,
    });
  };

  const addLog = (type) => {
    if (disabled || !draft.trim()) return;

    const log = Array.isArray(payload?.log) ? [...payload.log] : [];
    let qCount = Number(payload?.qCount || 0);

    if (type === "Q") qCount = Math.min(20, qCount + 1);

    log.push({
      byUserId: String(currentUserId),
      type,
      text: draft.trim(),
      createdAt: new Date().toISOString(),
    });

    setPayload({
      ...payload,
      log: log.slice(-80),
      qCount,
      phase: qCount >= 20 ? "END" : "ASK",
    });

    setDraft("");
  };

  const endGame = (winner) => {
    if (disabled) return;

    setPayload({
      ...payload,
      phase: "END",
      winnerUserId: winner,
    });
  };

  return (
    <div className="space-y-4">
      <GameIntro
        title="20 Questions"
        text="Ask, answer, and guess before the 20 questions run out."
        disabled={disabled}
      />

      {phase === "CHOOSE" ? (
        <div className="space-y-3">
          <select
            value={category}
            disabled={disabled}
            onChange={(e) => setCategory(e.target.value)}
            className="h-[42px] w-full rounded-[14px] border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none disabled:bg-slate-50"
          >
            {["Person", "Place", "Thing", "Memory", "Date Idea", "Movie", "Song"].map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              )
            )}
          </select>

          <SafeInput
            value={hint}
            placeholder="Optional hint"
            disabled={disabled}
            onChange={(e) => setHint(e.target.value)}
          />

          <Button
            type="button"
            onClick={startGame}
            disabled={disabled}
            className="h-[42px] w-full rounded-[14px] bg-rose-500 text-[13px] font-medium text-white hover:bg-rose-600 disabled:opacity-60"
          >
            Start 20 Questions
          </Button>
        </div>
      ) : null}

      {phase === "ASK" ? (
        <div className="space-y-3">
          <div className="rounded-[18px] bg-[#f8fafc] p-4 text-[12px] text-slate-600">
            Questions: {payload?.qCount || 0}/20 • {payload?.answerCategory}
            {payload?.secretHint ? ` • Hint: ${payload.secretHint}` : ""}
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto rounded-[18px] bg-[#f8fafc] p-3">
            {(payload?.log || []).map((it, idx) => (
              <div key={`${idx}-${it.createdAt}`} className="rounded-[16px] bg-white p-3">
                <p className="text-[10px] font-bold text-slate-500">{it.type}</p>
                <p className="text-[12px] font-medium text-slate-700">{it.text}</p>
              </div>
            ))}
          </div>

          <SafeInput
            value={draft}
            placeholder="Type here…"
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-2">
            <MiniButton onClick={() => addLog("Q")} disabled={disabled || !draft.trim()}>
              Ask
            </MiniButton>
            <MiniButton onClick={() => addLog("A")} disabled={disabled || !draft.trim()}>
              Answer
            </MiniButton>
            <MiniButton onClick={() => addLog("GUESS")} disabled={disabled || !draft.trim()}>
              Guess
            </MiniButton>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={() => endGame("You")}
              disabled={disabled}
              className="h-[40px] rounded-[14px] bg-[#eefcf3] text-[#16a34a] hover:bg-[#dcfce7] disabled:opacity-60"
            >
              I guessed it
            </Button>

            <Button
              type="button"
              onClick={() => endGame("Partner")}
              disabled={disabled}
              className="h-[40px] rounded-[14px] bg-[#eaf1ff] text-[#2563eb] hover:bg-[#dbeafe] disabled:opacity-60"
            >
              Partner guessed
            </Button>
          </div>
        </div>
      ) : null}

      {phase === "END" ? (
        <div className="rounded-[18px] bg-[#eefcf3] p-4 text-center text-[13px] font-semibold text-emerald-700">
          Winner: {payload?.winnerUserId || "—"}
        </div>
      ) : null}
    </div>
  );
}

function DateFitGame({ payload, currentUserId, setPayload, disabled = false }) {
  const myId = String(currentUserId);

  const days = [
    {
      day: 1,
      title: "Day 1 — Warm Start",
      minutes: 8,
      intensity: "Easy",
      task: "2 rounds: 10 squats, 10 arm circles, 20s plank.",
    },
    {
      day: 2,
      title: "Day 2 — Strength Base",
      minutes: 12,
      intensity: "Medium",
      task: "3 rounds: 10 squats, 10 pushups, 20s plank.",
    },
    {
      day: 3,
      title: "Day 3 — Light Cardio",
      minutes: 10,
      intensity: "Easy",
      task: "8 minutes march in place + 2 minutes step touches.",
    },
    {
      day: 4,
      title: "Day 4 — Upper Focus",
      minutes: 12,
      intensity: "Medium",
      task: "3 rounds: 8 pushups, 12 chair dips, 20s wall sit.",
    },
    {
      day: 5,
      title: "Day 5 — Cardio Push",
      minutes: 8,
      intensity: "Medium",
      task: "6 rounds: 20s jumping jacks, 40s rest.",
    },
    {
      day: 6,
      title: "Day 6 — Leg Day",
      minutes: 12,
      intensity: "Medium",
      task: "3 rounds: 12 squats, 12 lunges each side, 20 calf raises.",
    },
    {
      day: 7,
      title: "Day 7 — Bond Day",
      minutes: 6,
      intensity: "Easy",
      task: "Write one line: “I’m building with you because…” and reflect together.",
    },
  ];

  const weekDay = Math.min(Math.max(Number(payload?.weekDay || 1), 1), 7);
  const todayPlan = days[weekDay - 1];

  const score = payload?.score || {};
  const streak = payload?.streak || {};
  const statusMap = payload?.status || {};
  const lastDayCompleted = payload?.lastDayCompleted || {};

  const myScore = Number(score?.[myId] || 0);
  const myStreak = Number(streak?.[myId] || 0);
  const myStatus = statusMap?.[myId] || null;
  const canContinue = myStatus === "DONE" || myStatus === "SKIPPED";

  const markDone = () => {
    if (disabled || myStatus) return;

    const nextStatus = { ...statusMap, [myId]: "DONE" };
    const nextScore = { ...score, [myId]: myScore + 10 };
    const nextStreak = { ...streak };
    const nextLast = { ...lastDayCompleted };

    const previousDay = Number(nextLast[myId] || 0);
    let nextStreakValue = Number(nextStreak[myId] || 0);

    if (previousDay === weekDay - 1 || (previousDay === 7 && weekDay === 1)) {
      nextStreakValue += 1;
    } else {
      nextStreakValue = 1;
    }

    nextStreak[myId] = Math.min(7, nextStreakValue);
    nextLast[myId] = weekDay;

    setPayload({
      ...payload,
      status: nextStatus,
      score: nextScore,
      streak: nextStreak,
      lastDayCompleted: nextLast,
    });
  };

  const markSkip = () => {
    if (disabled || myStatus) return;

    setPayload({
      ...payload,
      status: { ...statusMap, [myId]: "SKIPPED" },
      streak: { ...streak, [myId]: 0 },
    });
  };

  const nextDay = () => {
    if (disabled || !canContinue) return;

    setPayload({
      ...payload,
      weekDay: weekDay >= 7 ? 1 : weekDay + 1,
      status: { ...statusMap, [myId]: null },
    });
  };

  return (
    <div className="space-y-4">
      <GameIntro
        title="Date-Fit"
        text="One day, one task, one shared commitment."
        disabled={disabled}
      />

      <div className="grid grid-cols-2 gap-2">
        <MiniStat value={`${myStreak}/7`} label="Streak" />
        <MiniStat value={myScore} label="Score" />
      </div>

      <div className="rounded-[20px] bg-[#f8fafc] p-4">
        <div className="rounded-[18px] bg-white p-4">
          <div className="text-[11px] text-slate-500">Today - Day {weekDay}</div>
          <div className="mt-1 text-[14px] font-semibold text-slate-900">
            {todayPlan.title}
          </div>
          <div className="mt-2 text-[12px] text-slate-600">
            {todayPlan.minutes} min • {todayPlan.intensity}
          </div>
          <div className="mt-3 text-[12px] text-slate-600">{todayPlan.task}</div>
        </div>
      </div>

      {myStatus === "DONE" ? (
        <ResultBox correct correctText="Strong discipline." wrongText="" />
      ) : null}

      {myStatus === "SKIPPED" ? (
        <div className="rounded-[18px] bg-[#fff7ed] p-4 text-center text-[13px] font-semibold text-amber-700">
          You missed today. Show up tomorrow.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          onClick={markDone}
          disabled={disabled || !!myStatus}
          className="h-[44px] rounded-full bg-rose-500 text-[15px] font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
        >
          Done
        </Button>

        <Button
          type="button"
          onClick={markSkip}
          disabled={disabled || !!myStatus}
          className="h-[44px] rounded-full border border-slate-200 bg-white text-[15px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          Skip
        </Button>
      </div>

      <Button
        type="button"
        onClick={nextDay}
        disabled={disabled || !canContinue}
        className={`h-[42px] w-full rounded-[14px] text-[13px] font-medium ${
          canContinue && !disabled
            ? "bg-rose-500 text-white hover:bg-rose-600"
            : "bg-white text-slate-400"
        }`}
      >
        {canContinue && !disabled ? (
          <>
            <ChevronRight className="mr-2 inline h-4 w-4" />
            Continue
          </>
        ) : (
          <>
            <Lock className="mr-2 inline h-4 w-4" />
            Choose Done or Skip
          </>
        )}
      </Button>
    </div>
  );
}

function GameIntro({ title, text, disabled }) {
  return (
    <div className="rounded-[20px] bg-[#f8fafc] p-4">
      <p className="text-[14px] font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-[12px] text-slate-500">{text}</p>
      {disabled ? (
        <p className="mt-2 text-[11px] font-medium text-rose-500">
          Date-Locked required to play.
        </p>
      ) : null}
    </div>
  );
}

function Waiting({ text }) {
  return (
    <div className="rounded-[18px] bg-[#f8fafc] p-4 text-[12px] text-slate-500">
      {text}
    </div>
  );
}

function ResultBox({ correct, correctText, wrongText }) {
  return (
    <div
      className={`rounded-[18px] p-4 text-center text-[13px] font-semibold ${
        correct ? "bg-[#eefcf3] text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      {correct ? correctText : wrongText}
    </div>
  );
}

function MiniButton({ children, onClick, disabled }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-[40px] rounded-[14px] bg-white text-rose-500 shadow-[0_6px_14px_rgba(15,23,42,0.08)] hover:bg-slate-50 disabled:opacity-60"
    >
      {children}
    </Button>
  );
}