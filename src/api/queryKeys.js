const queryKeys = {
  teams: () => ["teams"],
  team: (teamId) => ["team", teamId],
  teamPlayers: (teamId) => ["teamPlayers", teamId],
  schedule: () => ["schedule"],
  weather: (lat, lon) => ["weather", lat, lon],
  messages: (teamId) => ["messages", teamId],
  currentUser: (token) => ["currentUser", token],
};

export { queryKeys };
