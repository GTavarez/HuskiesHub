// Title prefill for a game: picking an opponent fills "vs. Opponent" unless
// the person already wrote their own title.
function autoGameTitle(opponent) {
  return opponent ? `vs. ${opponent}` : "";
}

function titleAfterOpponentChange(currentTitle, previousOpponent, nextOpponent) {
  if (!currentTitle || currentTitle === autoGameTitle(previousOpponent)) {
    return autoGameTitle(nextOpponent);
  }
  return currentTitle;
}

export { autoGameTitle, titleAfterOpponentChange };
