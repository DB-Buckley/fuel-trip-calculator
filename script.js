const publicSheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlR9zaL-9jbKA5TgzfRUYASiElCc_fIZ3BdfMmzt5_YPIzrGD4b5NXJHKfOPaTkkbH5SadjhOxwrrN/pub?output=csv";
let fuelData = [];
let autocompleteStart, autocompleteEnd;

// Make initMap globally accessible
window.initMap = function () {
  const startInput = document.getElementById("start");
  const endInput = document.getElementById("end");

  // Set up Google Maps Autocomplete
  autocompleteStart = new google.maps.places.Autocomplete(startInput, {
    types: ["geocode"],
    componentRestrictions: { country: "ZA" }  // Restrict to South Africa (optional)
  });

  autocompleteEnd = new google.maps.places.Autocomplete(endInput, {
    types: ["geocode"],
    componentRestrictions: { country: "ZA" }
  });

  fetchFuelData();
};

async function fetchFuelData() {
  try {
    const response = await fetch(publicSheetURL);
    const csvText = await response.text();
    const rows = csvText.split("\n").slice(1);

    fuelData = rows
      .map(line => line.split(","))
      .filter(cells => cells.length >= 5)
      .map(cells => ({
        type: cells[0].trim(),
        region: cells[1].trim(),
        previous: parseFloat(cells[2]),
        current: parseFloat(cells[3]),
        predicted: parseFloat(cells[4])
      }))
      .filter(row => row.type && row.region && !isNaN(row.current));

    populateDropdowns();
  } catch (err) {
    console.error("Failed to fetch or parse fuel data:", err);
    document.getElementById("fuelCostResult").innerText = "⚠️ Unable to load fuel prices.";
  }
}

function populateDropdowns() {
  const fuelTypes = [...new Set(fuelData.map(d => d.type))];
  const regions = [...new Set(fuelData.map(d => d.region))];

  document.getElementById("fuelType").innerHTML =
    fuelTypes.map(t => `<option value="${t}">${t}</option>`).join("");
  document.getElementById("region").innerHTML =
    regions.map(r => `<option value="${r}">${r}</option>`).join("");
}

function getDistanceAndCalculate() {
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const consumption = parseFloat(document.getElementById("consumption").value);

  if (!start || !end || isNaN(consumption)) {
    document.getElementById("fuelCostResult").innerText = "🚫 Please enter valid locations and fuel consumption.";
    return;
  }

  const service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix({
    origins: [start],
    destinations: [end],
    travelMode: google.maps.TravelMode.DRIVING,
    unitSystem: google.maps.UnitSystem.METRIC
  }, (response, status) => {
    if (status !== "OK" || !response.rows[0].elements[0]) {
      document.getElementById("fuelCostResult").innerText = "❌ Unable to calculate distance.";
      return;
    }

    const distanceText = response.rows[0].elements[0].distance.text;
    const distanceKm = parseFloat(distanceText.replace(/[^0-9.]/g, ""));
    calculateFuelCost(distanceKm, consumption);
  });
}

function calculateFuelCost(distance, consumption) {
  const fuelType = document.getElementById("fuelType").value;
  const region = document.getElementById("region").value;

  const fuel = fuelData.find(f => f.type === fuelType && f.region === region);
  if (!fuel) {
    document.getElementById("fuelCostResult").innerText = "⚠️ Fuel price not found for selection.";
    return;
  }

  const litresUsed = (distance * consumption) / 100;
  const totalCost = litresUsed * fuel.current;

  document.getElementById("fuelCostResult").innerHTML = `
    📍 Distance: <strong>${distance.toFixed(1)} km</strong><br>
    ⛽ Fuel Needed: <strong>${litresUsed.toFixed(1)} L</strong><br>
    💸 Estimated Fuel Cost: <strong>R${totalCost.toFixed(2)}</strong> @ R${fuel.current.toFixed(2)}/L
  `;
}

let deferredPrompt;
const installButton = document.getElementById('installButton');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing
  e.preventDefault();
  deferredPrompt = e;
  installButton.style.display = 'block'; // Show custom install button
});

installButton.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install: ${outcome}`);
    deferredPrompt = null;
    installButton.style.display = 'none';
  }
});

const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  const isInStandalone = ('standalone' in window.navigator) && window.navigator.standalone;

  if (isIos && !isInStandalone) {
    const banner = document.getElementById('iosPrompt');
    banner.style.display = 'block';

    banner.addEventListener('click', () => {
      banner.style.display = 'none';
    });
  }
