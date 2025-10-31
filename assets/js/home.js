const SMALL_LEAGUE_IDs = ["480834"];
let currentLeagueId = "";
let currentPage = 1;
let hasNextPage = false;
let currentGameweek = null;

function tableRowHTML(value) {
  return `<tr>
            <td>${value.rank}</td>
            <td title="${value.player_name} (${value.entry_name})" class="fpl-name-td" data-id="${value.id}" data-entry="${value.entry}">
                ${value.player_name} <br> 
                <span>${value.entry_name}</span>
            </td>
            <td class="ftxt-right">${value.event_total}</td>
            <td class="ftxt-right">${value.total}</td>
        </tr>`;
}

function getCurrentGameweek(callback) {
  const cacheKey = "fpl_bootstrap_data";
  const cacheTimeKey = "fpl_bootstrap_time";
  const CACHE_DURATION = 15 * 60 * 1000;

  const cached = localStorage.getItem(cacheKey);
  const cachedTime = localStorage.getItem(cacheTimeKey);

  if (cached && cachedTime && Date.now() - cachedTime < CACHE_DURATION) {
    const data = JSON.parse(cached);
    const currentEvent = data.events.find((e) => e.is_current);
    if (callback) callback(currentEvent);
    return;
  }

  console.log("🌐 Fetching new data from API...");

  getDataProxy(
    BASE_URL + "bootstrap-static/",
    function (response) {
      if (response) {
        localStorage.setItem(cacheKey, JSON.stringify(response));
        localStorage.setItem(cacheTimeKey, Date.now());

        const currentEvent = response.events.find((e) => e.is_current);
        if (callback) callback(currentEvent);
      } else {
        if (callback) callback(null);
      }
    },
    function (xhr, status, error) {
      if (xhr.responseJSON.message) {
        ALERT.init("error", xhr.responseJSON.message);
      } else {
        ALERT.init("error", "Something went wrong !");
      }
    }
  );
}

function getStandings(id) {
  $("#filterWrapper").addClass("fd-disabled");
  $("#tableTitle h1 span").eq(0).text("");

  if (id != currentLeagueId) {
    currentPage = 1;
    $("#tableBody").empty();
    $("#tableTitle h1 span").eq(0).text(`League`);
    $("#tableTitle p span").text("");
  }

  $("#noDataBox").show().find("h4").text("Loading...");

  getDataProxy(
    BASE_URL + `leagues-classic/${id}/standings/?page_standings=${currentPage}`,
    function (response) {
      console.log(response);
      if (response) {
        currentLeagueId = response?.league?.id || "";
        $("#tableTitle h1 span")
          .eq(0)
          .text(response?.league?.name || "League");
        $("#tableTitle p span").text(
          formatNepalTime(response?.last_updated_data)
        );

        const data = response?.standings?.results || [];
        hasNextPage = response?.standings?.has_next || false;

        if (data && data.length > 0) {
          $("#noDataBox").hide();

          $.each(data, function (index, value) {
            $("#tableBody").append(tableRowHTML(value));
          });
        } else {
          $("#noDataBox").show().find("h4").text("No Data Found!");
        }

        if (hasNextPage) {
          $("#showMoreBox").removeClass("fd-none");
        } else {
          $("#showMoreBox").addClass("fd-none");
        }
      }

      $("#filterWrapper").removeClass("fd-disabled");
    },
    function (xhr, status, error) {
      if (xhr.responseJSON.message) {
        ALERT.init("error", xhr.responseJSON.message);
      } else {
        ALERT.init("error", "Something went wrong !");
      }

      $("#noDataBox").show();
      $("#noDataBox").show().find("h4").text("Something went wrong!");

      $("#filterWrapper").removeClass("fd-disabled");
    }
  );
}

function getEventStandings(leagueId, eventId) {
  $("#filterWrapper").addClass("fd-disabled");
  $("#noDataBox").show().find("h4").text(`Loading...`);
  $("#tableBody").empty();
  $("#showMoreBox").addClass("fd-none");

  $("#tableTitle h1 span").eq(1).text(`(GW ${eventId})`);

  getDataProxy(
    BASE_URL + `leagues-classic/${leagueId}/standings/`,
    function (response) {
      const members = response.standings.results;
      const totalPlayers = members.length;

      let done = 0;
      let eventData = [];

      members.forEach((m) => {
        getDataProxy(
          BASE_URL + `entry/${m.entry}/history/`,
          function (playerData) {
            const gw = playerData.current.find((e) => e.event == eventId);
            const gwPoints = gw ? gw.points : 0;

            eventData.push({
              player_name: m.player_name,
              entry_name: m.entry_name,
              entry: m.entry,
              id: m.id,
              points: gwPoints,
            });

            done++;
            if (done === totalPlayers) {
              $("#filterWrapper").removeClass("fd-disabled");
              eventData.sort((a, b) => b.points - a.points);

              $("#tableBody").empty();
              $("#noDataBox").hide();

              $.each(eventData, function (index, val) {
                $("#tableBody").append(`
                  <tr>
                    <td>${index + 1}</td>
                    <td title="${
                      val.player_name
                    } (${val.entry_name})" class="fpl-name-td" data-entry="${val.entry}">
                      ${val.player_name}<br><span>${val.entry_name}</span>
                    </td>
                    <td class="ftxt-right">${val.points}</td>
                    <td class="ftxt-right">–</td>
                  </tr>
                `);
              });
            }
          },
          function () {
            done++;
          }
        );
      });
    },
    function () {
      $("#filterWrapper").removeClass("fd-disabled");
      ALERT.init("error", "Failed to fetch league standings!");
    }
  );
}

$(document).ready(function () {
  getStandings(170);
  getCurrentGameweek(function (currentGW) {
    currentGameweek = currentGW.id;
  });

  $("#searchLeagueInput").on("input", function () {
    const value = $(this).val().trim();

    if (value === "") {
      $("#rightFilterBox").show();
    } else {
      $("#rightFilterBox").hide();
      $("#leagueSelect").val("");
      $("#eventSelect").val("");
    }
  });

  $("#searchLeagueInput").on("keypress", function (e) {
    if (e.which === 13) {
      e.preventDefault();

      const value = $(this).val().trim();
      if (!value) return;

      if (/^\d+$/.test(value)) {
        getStandings(value);
      } else {
        ALERT.init("error", "Please enter a valid numeric League ID.");
      }
    }
  });

  $("#leagueSelect").on("change", function () {
    $("#eventSelect").val("");

    const selectedId = $(this).val();

    $("#eventSelect").hide();

    if (selectedId && /^\d+$/.test(selectedId)) {
      if (SMALL_LEAGUE_IDs.includes(selectedId)) {
        $("#eventSelect").show();
      }

      getStandings(selectedId);
    } else {
      ALERT.init("error", "Invalid League ID selected!");
    }
  });

  $("#eventSelect").on("change", function () {
    const selectedEvent = $(this).val();
    const selectedLeague = $("#leagueSelect").val();

    if (!selectedLeague) {
      ALERT.init("error", "Please select a league first!");
      return;
    }

    if (!SMALL_LEAGUE_IDs.includes(selectedLeague)) {
      ALERT.init("error", "Event standings only available for small leagues.");
      return;
    }

    if (selectedEvent && /^\d+$/.test(selectedEvent)) {
      getEventStandings(selectedLeague, selectedEvent);
    }
  });

  $("#showMoreBtn").on("click", function (e) {
    e.preventDefault();
    $("#showMoreBox").addClass("fd-none");

    if (hasNextPage) {
      currentPage++;
      getStandings(currentLeagueId);
    }
  });

  $("#tableBody").on("click", ".fpl-name-td", function () {
    const entryId = $(this).data("entry");

    if (!entryId || !currentGameweek) {
      ALERT.init("error", "Missing entry ID or current gameweek!");
      return;
    }

    const url = `https://fantasy.premierleague.com/entry/${entryId}/event/${currentGameweek}`;

    window.open(url, "_blank");
  });
});
