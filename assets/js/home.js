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
            <td>${value.event_total}</td>
            <td>${value.total}</td>
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

  if (id != currentLeagueId) {
    currentPage = 1;
    $("#tableBody").empty();
    $("#tableTitle h1").text("League");
    $("#tableTitle p span").text("");
  }

  $("#noDataBox").show().find("h4").text("Loading...");

  getDataProxy(
    BASE_URL + `leagues-classic/${id}/standings/?page_standings=${currentPage}`,
    function (response) {
      console.log(response);
      if (response) {
        currentLeagueId = response?.league?.id || "";
        $("#tableTitle h1").text(response?.league?.name || "League");
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

$(document).ready(function () {
  getStandings(170);
  getCurrentGameweek(function (currentGW) {
    currentGameweek = currentGW.id;
  });

  $("#searchLeagueInput").on("keypress", function (e) {
    if (e.which === 13) {
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
    const selectedId = $(this).val();

    if (selectedId && /^\d+$/.test(selectedId)) {
      getStandings(selectedId);
    } else {
      ALERT.init("error", "Invalid League ID selected!");
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
});
