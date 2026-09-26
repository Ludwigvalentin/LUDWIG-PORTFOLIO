let resultater = document.getElementById("resultsList");
let drawHolder = document.getElementById("drawHolder");
let allGames = [];
let selected = {};
let drawerOpener = null;

const filtersContainer = document.querySelector(".filters");
const filterPanel = document.getElementById("filterPanel");
const selectedChipsContainer = document.querySelector(".selected-chips");
const searchInput = document.getElementById("searchInput");
const resetFiltersButton = document.getElementById("resetFilters");
const topGamesTrack = document.getElementById("topGamesTrack");
const previousTopGame = document.getElementById("previousTopGame");
const nextTopGame = document.getElementById("nextTopGame");
const filterLabels = {
  location: "Sted",
  players: "Antal spillere",
  genre: "Genre",
  difficulty: "Sværhedsgrad",
  time: "Spilletid",
  search: "Søgning",
};

document.querySelectorAll(".filter-option").forEach((option) => {
  option.setAttribute("aria-pressed", "false");
});

async function getGames() {
  try {
const response = await fetch("./data/games.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    allGames = await response.json();
    displayTopGames();
    displayGames(allGames);
  } catch (error) {
    console.error("Kunne ikke hente games:", error);
    resultater.innerHTML =
      '<div class="game-list-empty"><p>🚨 Kunne ikke hente Games.</p></div>';
  }
}

function formatRating(rating) {
  return Number(rating).toLocaleString("da-DK", { maximumFractionDigits: 1 });
}

// Browseren vælger en billedstørrelse efter skærmens størrelse og opløsning.
function gameImageSources(image) {
  return `${image.replace(/\.webp$/, "-360.webp")} 360w, ${image} 600w`;
}

function displayTopGames() {
  const topGames = [...allGames]
    .sort((firstGame, secondGame) => Number(secondGame.rating) - Number(firstGame.rating))
    .slice(0, 10);

  topGamesTrack.innerHTML = topGames.map((game, index) => `
    <button type="button" class="carousel-card" data-game-id="${game.id}" aria-label="Vis detaljer for ${game.title}. Bedømmelse ${formatRating(game.rating)}.">
      <span class="carousel-card__image"><img src="${game.image}" srcset="${gameImageSources(game.image)}" sizes="(max-width: 600px) 196px, 236px" width="600" height="600" alt="" loading="${index < 2 ? "eager" : "lazy"}" decoding="async"><span class="carousel-card__rating"><span aria-hidden="true">★ </span><span class="visually-hidden">Bedømmelse: </span>${formatRating(game.rating)}</span></span>
      <span class="carousel-card__content">
        <span class="carousel-card__title">${game.title}</span>
      </span>
    </button>
  `).join("");
}

function displayGames(games) {
  resultater.innerHTML = "";

  if (!games.length) {
    resultater.insertAdjacentHTML(
      "beforeend",
      '<div class="game-list-empty"><p>Ingen spil matchede dine filtre...</p></div>'
    );
    return;
  }

  games.forEach((game) => displayGame(game));
}

function displayGame(game) {
  const gameHTML = `
    <button type="button" class="card" data-game-id="${game.id}" aria-label="Vis detaljer for ${game.title}.">
      <span class="card__imageHolder">
        <img src="${game.image}" srcset="${gameImageSources(game.image)}" sizes="(max-width: 600px) calc((100vw - 90px) / 2), (max-width: 900px) calc((100vw - 160px) / 3), (max-width: 1800px) calc((100vw - 300px) / 5), 300px" width="600" height="600" alt="" loading="lazy" decoding="async">
      </span>

      <span class="card__footer"><span class="card__title">${game.title}</span></span>

    </button>
  `;

  resultater.insertAdjacentHTML("beforeend", gameHTML);
}

resultater.addEventListener("click", (event) => {
  const card = event.target.closest(".card");
  if (!card) return;

  displayDrawer(Number(card.dataset.gameId));
});

topGamesTrack.addEventListener("click", (event) => {
  const card = event.target.closest(".carousel-card");
  if (!card) return;

  displayDrawer(Number(card.dataset.gameId));
});

previousTopGame.addEventListener("click", () => {
  topGamesTrack.scrollBy({ left: -320, behavior: "smooth" });
});

nextTopGame.addEventListener("click", () => {
  topGamesTrack.scrollBy({ left: 320, behavior: "smooth" });
});

function filterGames() {
  let filteredGames = [...allGames];

  Object.entries(selected).forEach(([filter, value]) => {
    if (!value) return;

    switch (filter) {
      case "genre":
        filteredGames = filteredGames.filter((game) => game.genre === value);
        break;
      case "difficulty":
        filteredGames = filteredGames.filter((game) => game.difficulty === value);
        break;
      case "players":
        const players = Number(value);
        filteredGames = filteredGames.filter(
          (game) => game.players.min <= players && game.players.max >= players
        );
        break;
      case "time":
        const time = Number(value);
        filteredGames = filteredGames.filter((game) => game.playtime <= time);
        break;
      case "location":
        filteredGames = filteredGames.filter((game) => game.location === value);
        break;
      case "search":
        const searchTerm = value.toLowerCase();
        filteredGames = filteredGames.filter((game) =>
          game.title.toLowerCase().includes(searchTerm)
        );
        break;
    }
  });

  displayGames(filteredGames);
}

function updateSelectedChips() {
  selectedChipsContainer.innerHTML = "";

  Object.entries(selected).forEach(([filter, value]) => {
    if (!value) return;

    const filterLabel = filterLabels[filter] || filter;
    const chip = document.createElement("div");
    chip.className = "selected-chip";
    chip.innerHTML = `
      ${filterLabel}: ${value}
      <button class="remove-chip" type="button" data-filter="${filter}" aria-label="Fjern filteret ${filterLabel}">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x-icon lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
      </button>
    `;
    selectedChipsContainer.appendChild(chip);
  });
}

function removeFilter(filter) {
  delete selected[filter];

  if (filter === "search") {
    searchInput.value = "";
  }

  document.querySelectorAll(`.filter-option[data-filter="${filter}"]`).forEach((option) => {
    option.classList.remove("active");
    option.setAttribute("aria-pressed", "false");
  });
  updateSelectedChips();
  filterGames();

  const filterButton = document.querySelector('.chip[data-filter="all"]');
  filterButton?.focus();
}

function resetFilters() {
  selected = {};
  searchInput.value = "";

  document.querySelectorAll(".filter-option").forEach((option) => {
    option.classList.remove("active");
    option.setAttribute("aria-pressed", "false");
  });

  updateSelectedChips();
  displayGames(allGames);
  filterPanel.classList.add("hidden");

  const filterButton = document.querySelector('.chip[data-filter="all"]');
  if (filterButton) {
    filterButton.classList.remove("active");
    filterButton.setAttribute("aria-expanded", "false");
    filterButton.focus();
  }
}

function displayDrawer(id) {
  const game = allGames.find((game) => game.id === id);

  if (!game) return;

  drawerOpener = document.activeElement;

  drawHolder.innerHTML = `
    <div class="overlay" id="overlay" role="dialog" aria-modal="true" aria-labelledby="drawerTitle" tabindex="-1">
      <div class="overlay__header">
        <button type="button" class="close" aria-label="Luk detaljevisning">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 6L18 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="card__rating">
          <svg width="15" height="13" viewBox="0 0 8 7" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.06919 6.79995L2.66502 4.35969L0.666687 2.71837L3.30669 2.50127L4.33335 0.199951L5.36002 2.50127L8.00002 2.71837L6.00169 4.35969L6.59752 6.79995L4.33335 5.506L2.06919 6.79995Z" fill="#FFD54F"/></svg>
          <span class="visually-hidden">Bedømmelse: </span>${formatRating(game.rating)}
        </div>
      </div>
      <div class="overlay__main">
        <div class="topInfo">
          <div class="gameinfo">
            <div>
              <div class="title"><h2 id="drawerTitle">${game.title}</h2></div>
              <div class="shortDesc">${game.description}</div>
            </div>
          </div>
          <img src="${game.image}" alt="billede af ${game.title}" loading="eager" decoding="async">
        </div>
        <div class="info">
          <div class="boks">Type: <span>${game.genre}</span></div>
          <div class="boks">Sværhedsgrad: <span>${game.difficulty}</span></div>
          <div class="boks">Spilletid: <span>${game.playtime} min</span></div>
          <div class="boks">Antal spillere: <span>${game.players.min}-${game.players.max}</span></div>
          <div class="boks">Alder: <span>+${game.age}</span></div>
          <div class="boks">Hylde: <span>${game.shelf}</span></div>
        </div>
      </div>
      <div class="drawer">
        <button type="button" class="drawer-toggle" aria-expanded="false" aria-controls="drawerRules-${game.id}">
          <span class="drawHandle" aria-hidden="true"></span>
          <span class="drawer-label">Vis regler</span>
        </button>
        <div class="drawer-text" id="drawerRules-${game.id}" role="region" aria-label="Regler for ${game.title}" aria-hidden="true">
          ${game.rules}
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const overlay = document.getElementById("overlay");
    if (overlay) {
      overlay.classList.add("overlay--active");
      overlay.querySelector(".close")?.focus();
    }
  }, 10);
}

drawHolder.addEventListener("click", (event) => {
  const closeButton = event.target.closest(".close");
  if (closeButton) {
    closeDrawer();
    return;
  }

  const drawerButton = event.target.closest(".drawer-toggle");
  if (drawerButton) {
    toggleDrawer(drawerButton);
  }
});

function toggleDrawer(drawerButton) {
  const drawer = document.querySelector(".drawer");
  const drawerText = document.querySelector(".drawer-text");

  if (!drawer || !drawerButton || !drawerText) return;

  const isOpen = drawer.classList.toggle("open");
  drawerButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
  drawerButton.querySelector(".drawer-label").textContent = isOpen
    ? "Skjul regler"
    : "Vis regler";
  drawerText.setAttribute("aria-hidden", String(!isOpen));
}

function closeDrawer() {
  const overlay = document.getElementById("overlay");
  if (overlay) {
    overlay.classList.remove("overlay--active");
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.innerHTML = "";
      drawerOpener?.focus();
      drawerOpener = null;
    }, 400);
  }
}

document.addEventListener("keydown", (event) => {
  const overlay = document.getElementById("overlay");
  if (!overlay) return;

  if (event.key === "Escape") {
    closeDrawer();
    return;
  }

  if (event.key !== "Tab") return;

  const focusableElements = overlay.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  if (!focusableElements.length) {
    event.preventDefault();
    overlay.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
});

filtersContainer.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip || chip.dataset.filter !== "all") return;

  const skalAabnes = filterPanel.classList.contains("hidden");

  filterPanel.classList.toggle("hidden", !skalAabnes);
  chip.classList.toggle("active", skalAabnes);
  chip.setAttribute("aria-expanded", String(skalAabnes));

  if (skalAabnes) {
    filterPanel.querySelector(".filter-option")?.focus();
  }
});

filterPanel.addEventListener("click", (e) => {
  const option = e.target.closest(".filter-option");
  if (!option) return;

  const filter = option.dataset.filter;
  const value = option.dataset.option;

  document.querySelectorAll(".filter-option").forEach((btn) => {
    if (btn.dataset.filter === filter) {
      btn.classList.toggle("active", btn === option);
      btn.setAttribute("aria-pressed", btn === option ? "true" : "false");
    }
  });

  if (!value) {
    delete selected[filter];
  } else {
    selected[filter] = value;
  }

  filterGames();
  updateSelectedChips();
  filterPanel.classList.add("hidden");
  const filterButton = document.querySelector('.chip[data-filter="all"]');
  filterButton.classList.remove("active");
  filterButton.setAttribute("aria-expanded", "false");
  filterButton.focus();
});

document.addEventListener("click", (e) => {
  const clickedInsideFilter =
    e.target.closest(".filter-panel") || e.target.closest(".chip[data-filter='all']");

  if (!clickedInsideFilter) {
    filterPanel.classList.add("hidden");
    const mainFilterChip = document.querySelector('.chip[data-filter="all"]');
    if (mainFilterChip) {
      mainFilterChip.classList.remove("active");
      mainFilterChip.setAttribute("aria-expanded", "false");
    }
  }
});

selectedChipsContainer.addEventListener("click", (e) => {
  const removeButton = e.target.closest(".remove-chip");
  if (!removeButton) return;
  removeFilter(removeButton.dataset.filter);
});

searchInput.addEventListener("input", (e) => {
  const value = e.target.value.trim();

  if (value) {
    selected.search = value;
  } else {
    delete selected.search;
  }

  filterGames();
  updateSelectedChips();
});

resetFiltersButton.addEventListener("click", resetFilters);

getGames();
