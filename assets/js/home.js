let currentLeagueId = "";
let currentPage = 1;
let hasNextPage = false;

function tableRowHTML(value) {
  return `<tr>
            <td>${value.rank}</td>
            <td class="fpl-name-td" data-id="${value.id}" data-entry="${value.entry}">
                ${value.player_name} <br> 
                <span>${value.entry_name}</span>
            </td>
            <td>${value.event_total}</td>
            <td>${value.total}</td>
        </tr>`;
}

function getStandings(id) {
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
    },
    function (xhr, status, error) {
      if (xhr.responseJSON.message) {
        ALERT.init("error", xhr.responseJSON.message);
      } else {
        ALERT.init("error", "Something went wrong !");
      }

      $("#noDataBox").show();
      $("#noDataBox").show().find("h4").text("Something went wrong!");

      //   $("#filterWrapper").removeClass("fd-disabled");
    }
  );
}

$(document).ready(function () {
  getStandings(170);

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

  $("#showMoreBtn").on("click", function (e) {
    e.preventDefault();
    $("#showMoreBox").addClass("fd-none");

    if (hasNextPage) {
      currentPage++;
      getStandings(currentLeagueId);
    }
  });
});
