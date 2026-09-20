import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSavedOptions } from "../../../api/savedOptions.js";
import { queryKeys } from "../../../api/queryKeys.js";

// A text box that also offers a dropdown of remembered values: pick one from
// the list, or just type something new (it's remembered automatically the
// next time an event is saved with it). Built on the browser's native
// <datalist>, so it works on phones with no extra library.
// kind: "opponent" (pass teamId) or "location" (club-wide).
function SuggestInput({ kind, teamId, token, value, onChange, ...inputProps }) {
  const listId = useId();
  const needsTeam = kind === "opponent";

  const { data: options = [] } = useQuery({
    queryKey: queryKeys.savedOptions(kind, needsTeam ? teamId : null),
    queryFn: () => getSavedOptions(kind, needsTeam ? teamId : null, token),
    enabled: Boolean(token && (!needsTeam || teamId)),
    staleTime: 60 * 1000,
  });

  return (
    <>
      <input
        {...inputProps}
        list={listId}
        value={value}
        onChange={onChange}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option._id} value={option.name} />
        ))}
      </datalist>
    </>
  );
}

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

export default SuggestInput;
export { titleAfterOpponentChange };
