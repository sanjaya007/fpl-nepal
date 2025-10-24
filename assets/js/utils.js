const BASE_URL = "https://fantasy.premierleague.com" + "/api/";

function formatNepalTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString("en-NP", {
    timeZone: "Asia/Kathmandu",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
