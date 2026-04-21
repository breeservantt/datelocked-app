export function calculateInteractionScore({
  chats = 0,
  goals = 0,
  memories = 0,
  dates = 0,
}) {
  const chatScore = Math.min(chats * 2, 25);
  const goalScore = Math.min(goals * 8, 25);
  const memoryScore = Math.min(memories * 6, 25);
  const dateScore = Math.min(dates * 10, 25);

  const total = Math.max(
    0,
    Math.min(100, Math.round(chatScore + goalScore + memoryScore + dateScore))
  );

  const level =
    total >= 75 ? "Strong" :
    total >= 40 ? "Growing" :
    "Low";

  return { total, level };
}