// DOM Element References
const characterDisplay = document.getElementById('character-display');
const answerInput = document.getElementById('answer-input');
const submitButton = document.getElementById('submit-button');
const startButton = document.getElementById('start-button');
const scoreDisplay = document.getElementById('score');
const comboCounterDisplay = document.getElementById('combo-counter');
const reviewWrongAnswersButton = document.getElementById('review-wrong-answers-button');
const wordsAttemptedDisplay = document.getElementById('words-attempted');
const accuracyDisplay = document.getElementById('accuracy-display');
const wordsToReviewCountDisplay = document.getElementById('words-to-review-count');
const modeNewButton = document.getElementById('mode-new');
const modeReviewButton = document.getElementById('mode-review');
const modeChallengeButton = document.getElementById('mode-challenge');
const seedCountDisplay = document.getElementById('seed-count'); // For Garden/Focus Mode
const gardenPlotsDisplay = document.getElementById('garden-plots'); // For Garden display

// Sample Vocabulary (now loaded from data/vocabulary.js)
/*
const vocabulary = [
  { japanese: "こんにちは", english: "hello" },
  { japanese: "さようなら", english: "goodbye" },
  { japanese: "ありがとう", english: "thank you" },
  { japanese: "はい", english: "yes" },
  { japanese: "いいえ", english: "no" }
];
*/

// Game State Variables
let currentQuestionIndex = 0;
let score = 0;
let comboCounter = 0;
let wrongAnswers = [];
let wordsAttempted = 0;
let correctAnswers = 0;
let currentMode = 'new'; // 'new', 'review', 'challenge'
let currentQuestionSet = [];

// --- Focus Mode / Garden Variables ---
// These variables manage the state of the focus timer and the garden feature.

// `studyTimeSeconds`: Tracks the total number of seconds the user has been actively studying.
// This timer starts when a game begins and stops when a game ends.
let studyTimeSeconds = 0;

// `seeds`: Stores the number of seeds the player has earned.
// Seeds are awarded for spending time in "focus mode" (i.e., active study).
let seeds = 0;

// `activeStudyTimerId`: Holds the ID of the JavaScript interval timer.
// This is used to start and stop the timer that increments `studyTimeSeconds`.
// It's `null` when no timer is active.
let activeStudyTimerId = null;

// `SEED_REWARD_INTERVAL_MINUTES`: A constant defining how many minutes of study are required to earn one seed.
// For example, if set to 10, the player gets a seed every 10 minutes of active study.
const SEED_REWARD_INTERVAL_MINUTES = 10;


// --- Garden Specific Variables ---

// `userGarden`: An array that holds all the plants currently in the player's garden.
// Each plant is an object, for example: { type: "flower", stage: 0, id: 0 }
// - `type`: A string key (e.g., "flower") that refers to an entry in `plantTypes`.
// - `stage`: An integer representing the current growth stage of the plant (index in `plantTypes[type].stages`).
// - `id`: A unique number for each plant, useful for managing or identifying individual plants later.
let userGarden = [];

// `nextPlantId`: A simple counter to ensure each new plant gets a unique ID.
// It's incremented each time a plant is created.
let nextPlantId = 0;

// `plantTypes`: An object that defines the different kinds of plants available in the game.
// Each key (e.g., "flower", "tree") represents a type of plant.
// - `name`: A user-friendly name for the plant type.
// - `stages`: An array of strings describing each growth stage (e.g., "Seedling", "Sprout").
// - `display`: An array of strings (often emojis) used to visually represent the plant at each stage.
const plantTypes = {
    flower: {
        name: "Flower",
        stages: ["Seedling", "Sprout", "Bloom"],
        display: ["🌱", "🌷", "🌻"]
    },
    tree: {
        name: "Tree",
        stages: ["Sapling", "Young Tree", "Mature Tree"],
        display: ["🌳", "🌲", "🌳"] // Example: Could use different tree emojis for stages
    }
};

// `MAX_PLANTS_IN_GARDEN`: A constant to limit how many plants can be in the garden at one time.
// This helps keep the display manageable and adds a game mechanic.
const MAX_PLANTS_IN_GARDEN = 5;

// Helper function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

function loadQuestion() {
  if (currentQuestionSet && currentQuestionIndex < currentQuestionSet.length) {
    characterDisplay.textContent = currentQuestionSet[currentQuestionIndex].japanese;
    answerInput.value = '';
    answerInput.disabled = false;
    submitButton.disabled = false;
  } else {
    characterDisplay.textContent = "ゲーム終了"; // "Game Over"
    answerInput.disabled = true;
    submitButton.disabled = true;
    if (currentMode === 'review' && currentQuestionSet.length === 0 && wrongAnswers.length === 0) {
        characterDisplay.textContent = "Review Cleared!";
    } else if (currentQuestionSet.length === 0 && currentMode !== 'new') {
        characterDisplay.textContent = "No words in this set!";
    }
    console.log("End of current question set.");
    stopActiveStudyTimer(); // Stop timer when game/set ends
  }
}

function checkAnswer() {
  if (currentQuestionSet && currentQuestionIndex < currentQuestionSet.length) {
    const userAnswer = answerInput.value.trim().toLowerCase();
    const currentQuestion = currentQuestionSet[currentQuestionIndex];
    const correctAnswer = currentQuestion.english.toLowerCase();

    wordsAttempted++;

    if (userAnswer === correctAnswer) {
      score++;
      correctAnswers++;
      comboCounter++;
      if (comboCounter > 0 && comboCounter % 3 === 0) {
        score++; // Add bonus point
        console.log("Combo bonus applied! +1 point.");
      }
      scoreDisplay.textContent = score;
      console.log("Correct answer!");

      if (currentMode === 'review') {
        // Remove from global wrongAnswers list
        const indexInWrongAnswers = wrongAnswers.findIndex(item => item.japanese === currentQuestion.japanese);
        if (indexInWrongAnswers > -1) {
          wrongAnswers.splice(indexInWrongAnswers, 1);
          console.log("Word removed from wrong answers:", currentQuestion.japanese);
        }
      }
    } else {
      comboCounter = 0;
      // Add to wrong answers if not already present (using the object from currentQuestionSet)
      if (!wrongAnswers.find(item => item.japanese === currentQuestion.japanese)) {
        wrongAnswers.push(currentQuestion); // currentQuestion is a reference from vocabulary or a copy
      }
      console.log("Incorrect answer. Correct was: " + correctAnswer);
    }
    comboCounterDisplay.textContent = comboCounter;
    wordsToReviewCountDisplay.textContent = wrongAnswers.length; // Update based on global list

    const accuracy = wordsAttempted > 0 ? (correctAnswers / wordsAttempted) * 100 : 0;
    wordsAttemptedDisplay.textContent = wordsAttempted;
    accuracyDisplay.textContent = accuracy.toFixed(0);

    currentQuestionIndex++;
    loadQuestion();
    provideLearningSuggestions(accuracy);
  }
}

function provideLearningSuggestions(accuracy) {
  console.log("Checking for suggestions..."); // For debugging
  if (accuracy < 70 && wordsAttempted > 0) { // ensure suggestions are relevant
    console.log("Your accuracy is " + accuracy.toFixed(0) + "%. Keep practicing!");
  }
  if (wrongAnswers.length > 5) {
    console.log("You have " + wrongAnswers.length + " words to review. Try the 'Review Wrong Answers' feature!");
  }
}

// --- Focus Mode Timer Functions ---

/**
 * Starts the active study timer.
 * If a timer is already running, it clears the existing one before starting a new one.
 * The timer increments `studyTimeSeconds` every second.
 * When `studyTimeSeconds` reaches a multiple of `SEED_REWARD_INTERVAL_MINUTES * 60`,
 * a seed is awarded, the seed display is updated, and `growPlants()` is called.
 */
function startActiveStudyTimer() {
  // Clear any existing timer to prevent multiple timers running simultaneously.
  if (activeStudyTimerId !== null) {
    clearInterval(activeStudyTimerId);
  }
  console.log("Starting active study timer: Tracks study duration and awards seeds.");

  // Set up an interval that runs every 1000 milliseconds (1 second).
  activeStudyTimerId = setInterval(() => {
    studyTimeSeconds++; // Increment the total study time.

    // Check if it's time to award a seed.
    // This happens when studyTimeSeconds is a positive multiple of the defined interval (in seconds).
    // Example: If SEED_REWARD_INTERVAL_MINUTES is 10, a seed is awarded at 600s, 1200s, etc.
    if (studyTimeSeconds > 0 && (studyTimeSeconds % (SEED_REWARD_INTERVAL_MINUTES * 60)) === 0) {
      seeds++; // Award a seed.
      seedCountDisplay.textContent = seeds; // Update the displayed seed count.
      console.log(`Seed awarded! Total seeds: ${seeds}. Total study time: ${studyTimeSeconds / 60} minutes.`);
      growPlants(); // Call growPlants to potentially advance plant stages.
    }
  }, 1000);
}

/**
 * Stops the active study timer.
 * It clears the interval timer and resets `activeStudyTimerId` to null.
 * Logs the total study time when stopped.
 */
function stopActiveStudyTimer() {
  if (activeStudyTimerId !== null) {
    clearInterval(activeStudyTimerId); // Stop the interval.
    activeStudyTimerId = null; // Reset the timer ID.
    console.log(`Active study timer stopped. Total accumulated study time: ${studyTimeSeconds} seconds.`);
  }
}


// --- Garden Functions ---

/**
 * Renders the current state of the garden in the UI.
 * It clears the existing content of `gardenPlotsDisplay` and then rebuilds it
 * based on the plants currently in the `userGarden` array.
 */
function renderGarden() {
    // Clear out any plants currently displayed to prevent duplicates.
    gardenPlotsDisplay.innerHTML = '';

    // Loop through each plant object in the `userGarden` array.
    userGarden.forEach(plant => {
        // Create a new `div` element for this plant.
        const plantDiv = document.createElement('div');
        // Add the 'plant-item' class for CSS styling.
        plantDiv.classList.add('plant-item');
        // Store the plant's unique ID as a data attribute on the div. Useful for potential future interactions.
        plantDiv.dataset.plantId = plant.id;

        // Set the text content of the div to the visual representation (e.g., emoji)
        // of the plant's current type and stage.
        // e.g., plantTypes["flower"].display[0] might be "🌱"
        plantDiv.textContent = plantTypes[plant.type].display[plant.stage];

        // Set a 'title' attribute (tooltip) to show plant details on hover.
        // This provides more information to the user in a simple way.
        plantDiv.title = `${plantTypes[plant.type].name} - Stage: ${plantTypes[plant.type].stages[plant.stage]}`;

        // Append the newly created plant div to the main garden plots container.
        gardenPlotsDisplay.appendChild(plantDiv);
    });
    console.log("Garden re-rendered with current plants.");
}

/**
 * Attempts to plant a new seed of a chosen type in the garden.
 * @param {string} chosenPlantTypeKey - The key (e.g., "flower", "tree") of the plant type to plant.
 *
 * Conditions for planting:
 * 1. Player must have at least 1 seed.
 * 2. The garden must not be full (i.e., `userGarden.length < MAX_PLANTS_IN_GARDEN`).
 *
 * If successful, a seed is consumed, a new plant object is created and added to `userGarden`,
 * and the garden display is updated.
 */
function plantSeed(chosenPlantTypeKey) {
    // Check if the player has seeds and if the garden has space.
    if (seeds > 0 && userGarden.length < MAX_PLANTS_IN_GARDEN) {
        seeds--; // Consume one seed.
        seedCountDisplay.textContent = seeds; // Update the seed display.

        // Create a new plant object.
        const newPlant = {
            type: chosenPlantTypeKey,       // The type of plant (e.g., "flower").
            stage: 0,                       // Plants start at the first stage (index 0).
            id: nextPlantId++               // Assign a unique ID and increment for the next one.
        };
        userGarden.push(newPlant); // Add the new plant to the garden array.

        renderGarden(); // Update the garden display to show the new plant.
        console.log(`Planted a ${plantTypes[chosenPlantTypeKey].name}! Remaining seeds: ${seeds}. Garden spots used: ${userGarden.length}/${MAX_PLANTS_IN_GARDEN}.`);
    } else if (seeds <= 0) {
        console.log("Not enough seeds to plant. Earn more seeds by studying!");
        // Consider adding a user-facing message here (e.g., an alert or a message on the page).
    } else { // Implies garden is full
        console.log(`Garden is full (Max ${MAX_PLANTS_IN_GARDEN} plants). Cannot plant more.`);
        // Consider adding a user-facing message here.
    }
}

/**
 * Advances the growth stage of all plants in the garden.
 * Each plant that is not yet at its final stage will have its `stage` incremented.
 * After attempting to grow plants, it re-renders the garden if any plant actually grew.
 */
function growPlants() {
    let grownOccurred = false; // Flag to track if any plant actually grew.
    console.log("Attempting to grow plants in the garden...");

    userGarden.forEach(plant => {
        // Check if the plant is not already at its final stage.
        // `plantTypes[plant.type].stages.length - 1` gives the index of the last stage.
        if (plant.stage < plantTypes[plant.type].stages.length - 1) {
            plant.stage++; // Advance to the next stage.
            grownOccurred = true; // Mark that at least one plant has grown.
            console.log(`Plant ID ${plant.id} (${plantTypes[plant.type].name}) grew to stage: ${plantTypes[plant.type].stages[plant.stage]}.`);
        } else {
            console.log(`Plant ID ${plant.id} (${plantTypes[plant.type].name}) is already at its final stage.`);
        }
    });

    // If any plant grew, re-render the garden to show the changes.
    if (grownOccurred) {
        renderGarden();
        console.log("Garden updated after plants grew.");
    } else {
        console.log("No plants were eligible for further growth at this time.");
    }
}

function startGame() {
  seedCountDisplay.textContent = seeds; // Update seed display at game start
  score = 0;
  currentQuestionIndex = 0;
  comboCounter = 0;
  wordsAttempted = 0;
  correctAnswers = 0;
  // DO NOT clear wrongAnswers here, only when switching to 'new' or if review clears them.

  console.log(`Starting game in mode: ${currentMode}`);

  if (currentMode === 'new') {
    wrongAnswers = []; // For 'New Words' mode, truly start fresh including wrong answers.
    currentQuestionSet = shuffleArray([...vocabulary]);
    console.log("Mode: New Words. Loaded full vocabulary.");
  } else if (currentMode === 'review') {
    if (wrongAnswers.length === 0) {
      console.log("Wrong answer book is empty. Starting a 'New Words' session instead.");
      // Fallback to 'new' mode logic for this session, but don't change currentMode globally yet
      currentQuestionSet = shuffleArray([...vocabulary]);
       // Effectively, this session becomes a 'new' session if review is empty
    } else {
      currentQuestionSet = shuffleArray([...wrongAnswers]); // Use copies for review session
      console.log(`Mode: Review. Loaded ${currentQuestionSet.length} words from wrong answers.`);
    }
  } else if (currentMode === 'challenge') {
    // Challenge mode might mean all words, perhaps with stricter scoring or timer later
    currentQuestionSet = shuffleArray([...vocabulary]);
    console.log("Mode: Challenge. Loaded full vocabulary.");
  }

  scoreDisplay.textContent = score;
  comboCounterDisplay.textContent = comboCounter;
  wordsAttemptedDisplay.textContent = wordsAttempted;
  accuracyDisplay.textContent = '0';
  wordsToReviewCountDisplay.textContent = wrongAnswers.length; // Global wrong answers

  answerInput.value = '';
  loadQuestion(); // This will handle enabling/disabling inputs
  startActiveStudyTimer(); // Start or restart the timer
  console.log("Game started!");
}

function setMode(newMode) {
  currentMode = newMode;
  // Update active button
  [modeNewButton, modeReviewButton, modeChallengeButton].forEach(button => {
    button.classList.remove('active-mode');
  });
  if (newMode === 'new') modeNewButton.classList.add('active-mode');
  else if (newMode === 'review') modeReviewButton.classList.add('active-mode');
  else if (newMode === 'challenge') modeChallengeButton.classList.add('active-mode');

  console.log(`Mode set to: ${newMode}`);
  startGame(); // Restart the game with the new mode
}

// Event listeners
startButton.addEventListener('click', startGame); // Start game in current mode
submitButton.addEventListener('click', checkAnswer);
reviewWrongAnswersButton.addEventListener('click', () => {
  console.log("Wrong Answers:", wrongAnswers); // Keep this for debugging
  setMode('review'); // Switch to review mode and start game
});

modeNewButton.addEventListener('click', () => setMode('new'));
modeReviewButton.addEventListener('click', () => setMode('review'));
modeChallengeButton.addEventListener('click', () => setMode('challenge'));

// --- Initial Setup ---
// This code runs when the script is first loaded by the browser.

console.log("script.js loaded successfully. Initializing application state...");

// Ensure the seed count display is accurate on page load.
// `seeds` is initialized to 0, so this will show "Seeds: 0".
seedCountDisplay.textContent = seeds;

// --- Temporary UI for Planting ---
// The following code programmatically adds "Plant Flower" and "Plant Tree" buttons
// to the page. This is a temporary measure for testing the garden functionality
// without needing to modify index.html directly for these buttons yet.
// A more permanent solution would involve adding these buttons to index.html.
if (gardenPlotsDisplay && !document.getElementById('plant-flower-button')) {
    console.log("Adding temporary planting buttons for testing.");
    const plantFlowerButton = document.createElement('button');
    plantFlowerButton.id = 'plant-flower-button'; // ID for potential styling or future reference
    plantFlowerButton.textContent = 'Plant Flower (1 Seed)';
    plantFlowerButton.style.margin = "5px"; // Add a little space around the button
    plantFlowerButton.onclick = () => plantSeed('flower'); // When clicked, call plantSeed with "flower"

    // Append the button to the parent of gardenPlotsDisplay (which should be the #garden-area section)
    if (gardenPlotsDisplay.parentElement) {
        gardenPlotsDisplay.parentElement.appendChild(plantFlowerButton);
    }

    const plantTreeButton = document.createElement('button');
    plantTreeButton.id = 'plant-tree-button';
    plantTreeButton.textContent = 'Plant Tree (1 Seed)';
    plantTreeButton.style.margin = "5px";
    plantTreeButton.onclick = () => plantSeed('tree');

    if (gardenPlotsDisplay.parentElement) {
        gardenPlotsDisplay.parentElement.appendChild(plantTreeButton);
    }
}
// --- End of Temporary UI ---

// Render the initial state of the garden (it will be empty at first).
renderGarden();

// Start the game in the default mode ('new') when the page loads.
// This also initializes the game UI elements like score, combo, etc.
startGame();


// --- TEST SCRIPT ---
// This script is for testing the Focus Mode and Garden functionalities.
// It will run after the main script initializes.
console.log("--- Starting Test Script ---");

// Wait for a brief moment to ensure the initial startGame() has completed and UI elements are ready.
// This is a simple way to handle potential async operations from initial load or startGame.
// Ideally, tests would have more robust ways to wait for app readiness.
setTimeout(() => {
    console.log("\n--- Test Suite: Initial State ---");
    console.log("Initial seeds global: " + seeds);
    // userGarden is initialized as [], so it should be empty or reflect state from the auto-startGame
    // If startGame was just run, it might have started a timer and potentially awarded a seed if SEED_REWARD_INTERVAL_MINUTES is very low (e.g., 0 for testing)
    // For these tests, we assume SEED_REWARD_INTERVAL_MINUTES is > 0.
    // The initial startGame() in script.js will reset seeds to 0 if it's a 'new' mode start.
    // Let's explicitly reset for clarity before specific tests.
    seeds = 0;
    studyTimeSeconds = 0;
    userGarden = [];
    nextPlantId = 0;
    if (activeStudyTimerId) clearInterval(activeStudyTimerId);
    activeStudyTimerId = null;
    renderGarden(); // Reflects the reset state.
    seedCountDisplay.textContent = seeds;


    console.log("Initial seeds (after test reset): " + seeds);
    console.log("Initial garden (after test reset): " + JSON.stringify(userGarden));
    console.log("Initial seed display (after test reset): " + seedCountDisplay.textContent);
    console.log("Initial garden plots HTML (after test reset): " + gardenPlotsDisplay.innerHTML);

    console.log("\n--- Test Suite: Timer & Seed Awarding ---");
    // Reset studyTimeSeconds for this test block, as startGame() might be called again.
    studyTimeSeconds = 0;
    seeds = 0; // Start with 0 seeds for this test
    seedCountDisplay.textContent = seeds;
    userGarden = []; // Clear garden to observe growth from scratch
    nextPlantId = 0;
    renderGarden();

    startGame(); // Starts the timer and sets up for 'new' mode (clears wrongAnswers, resets score etc.)
    console.log("Game started for timer test, timer running...");

    // Simulate time just before first seed for SEED_REWARD_INTERVAL_MINUTES (e.g., 10 minutes)
    console.log(`Simulating time up to just before first seed award. SEED_REWARD_INTERVAL_MINUTES = ${SEED_REWARD_INTERVAL_MINUTES}`);
    studyTimeSeconds = SEED_REWARD_INTERVAL_MINUTES * 60 - 1;

    // Manually trigger the interval's logic for one tick to test seed awarding
    // This simulates the next second passing where a seed should be awarded by the actual timer.
    // We are directly calling the logic that the setInterval would call.
    console.log("Simulating one second passing to trigger seed award...");
    studyTimeSeconds++;
    if (studyTimeSeconds > 0 && (studyTimeSeconds % (SEED_REWARD_INTERVAL_MINUTES * 60)) === 0) {
      seeds++;
      seedCountDisplay.textContent = seeds;
      console.log("SEED AWARDED (1st): " + seeds + " seeds now. Study time: " + studyTimeSeconds + "s.");
      growPlants(); // This would be called by the timer's interval
    }
    console.log("Seeds after 1st interval simulation: " + seeds);
    console.log("Seed display after 1st interval simulation: " + seedCountDisplay.textContent);
    console.log("Garden after 1st seed (and growth): " + JSON.stringify(userGarden)); // Should be empty if no plants yet

    // Simulate another interval for a second seed
    console.log(`Simulating time up to just before second seed award.`);
    studyTimeSeconds = SEED_REWARD_INTERVAL_MINUTES * 60 * 2 - 1;
    console.log("Simulating one second passing to trigger second seed award...");
    studyTimeSeconds++;
    if (studyTimeSeconds > 0 && (studyTimeSeconds % (SEED_REWARD_INTERVAL_MINUTES * 60)) === 0) {
      seeds++;
      seedCountDisplay.textContent = seeds;
      console.log("SEED AWARDED (2nd): " + seeds + " seeds now. Study time: " + studyTimeSeconds + "s.");
      growPlants();
    }
    console.log("Seeds after 2nd interval simulation: " + seeds);
    console.log("Garden after 2nd seed (and growth): " + JSON.stringify(userGarden)); // Still empty if no plants
    stopActiveStudyTimer();
    console.log("Timer stopped after seed awarding tests.");

    console.log("\n--- Test Suite: Planting Seeds ---");
    // Seeds should be 2 from the previous test.
    console.log("Current seeds before planting: " + seeds);
    plantSeed('flower'); // Plant with type 'flower'
    console.log("After planting flower: Seeds=" + seeds + ", Garden=" + JSON.stringify(userGarden));
    console.log("Seed display after planting flower: " + seedCountDisplay.textContent);
    console.log("Garden plots HTML after planting flower: " + gardenPlotsDisplay.innerHTML);

    plantSeed('tree'); // Plant with type 'tree'
    console.log("After planting tree: Seeds=" + seeds + ", Garden=" + JSON.stringify(userGarden));
    console.log("Seed display after planting tree: " + seedCountDisplay.textContent);

    // Test planting with no seeds
    const seedsBeforeNoSeedTest = seeds; // Save current seed count
    seeds = 0; // Temporarily set seeds to 0
    seedCountDisplay.textContent = seeds;
    console.log("Temporarily set seeds to 0 for no-seed planting test.");
    plantSeed('flower'); // Attempt to plant
    console.log("Attempted planting flower with 0 seeds. Garden should be unchanged: " + JSON.stringify(userGarden) + ". Seeds: " + seeds);
    seeds = seedsBeforeNoSeedTest; // Restore seeds
    seedCountDisplay.textContent = seeds;
    console.log("Restored seeds to: " + seeds);


    console.log("\n--- Test Suite: Garden Full ---");
    userGarden = []; // Clear garden for this test
    nextPlantId = 0; // Reset plant ID counter
    renderGarden();
    seeds = MAX_PLANTS_IN_GARDEN + 1; // Ensure enough seeds to fill garden and attempt overflow
    seedCountDisplay.textContent = seeds;
    console.log(`Set seeds to ${seeds} for garden full test. MAX_PLANTS_IN_GARDEN is ${MAX_PLANTS_IN_GARDEN}.`);

    for (let i = 0; i < MAX_PLANTS_IN_GARDEN; i++) {
        plantSeed('flower'); // Plant 'flower' until garden is full
        console.log(`Planted plant ${i+1}. Seeds remaining: ${seeds}. Garden size: ${userGarden.length}`);
    }
    console.log("Garden after filling: " + JSON.stringify(userGarden));
    console.log("Seeds after filling garden: " + seeds); // Should be 1
    console.log("Garden plots HTML after filling garden: " + gardenPlotsDisplay.innerHTML);

    plantSeed('tree'); // Attempt to plant one more into the full garden
    console.log("Attempted to plant in full garden. Garden should be unchanged: " + JSON.stringify(userGarden) + ". Seeds should be unchanged: " + seeds);


    console.log("\n--- Test Suite: Plant Growth Stages ---");
    // Reset garden and seeds for this specific test.
    seeds = 1; // Start with 1 seed to plant.
    userGarden = [];
    nextPlantId = 0;
    renderGarden();
    seedCountDisplay.textContent = seeds;
    console.log("Garden and seeds reset for growth test. Seeds: " + seeds);

    plantSeed('flower'); // This will consume the 1 seed.
    console.log("Planted one flower for growth test. Garden: " + JSON.stringify(userGarden) + ". Seeds: " + seeds);
    // At this point, seeds is 0. To test growth (which is tied to earning seeds), we need to simulate earning seeds.

    // Simulate 1st seed earned (triggers 1st growth)
    console.log("Simulating 1st seed earned to trigger growth...");
    growPlants(); // Directly call growPlants as if a seed was just earned.
    console.log("After 1st growth cycle: " + JSON.stringify(userGarden));
    console.log("Garden plots HTML after 1st growth: " + gardenPlotsDisplay.innerHTML);

    // Simulate 2nd seed earned
    console.log("Simulating 2nd seed earned...");
    growPlants();
    console.log("After 2nd growth cycle: " + JSON.stringify(userGarden));

    // Simulate 3rd seed earned - should reach max stage for flower (3 stages: 0, 1, 2)
    console.log("Simulating 3rd seed earned...");
    growPlants();
    console.log("After 3rd growth cycle (should be max stage for flower): " + JSON.stringify(userGarden));
    console.log("Garden plots HTML after 3rd growth: " + gardenPlotsDisplay.innerHTML);

    // Simulate 4th seed earned - plant should not grow further
    console.log("Simulating 4th seed earned (plant should be maxed)...");
    growPlants();
    console.log("After 4th growth cycle (plant was maxed): " + JSON.stringify(userGarden));


    console.log("\n--- Test Suite: Mode Switching & Timer ---");
    // Reset studyTimeSeconds and seeds, clear garden for cleaner timer IDs if intervals fire
    studyTimeSeconds = 0;
    seeds = 0;
    userGarden = [];
    nextPlantId = 0;
    renderGarden();
    seedCountDisplay.textContent = seeds;
    if (activeStudyTimerId) clearInterval(activeStudyTimerId); // Stop any existing timer
    activeStudyTimerId = null;


    setMode('new'); // Calls startGame(), which starts timer
    console.log("Timer ID after setting mode to 'new': " + activeStudyTimerId + ". (A non-null value indicates timer started)");
    const timerIdAfterNew = activeStudyTimerId;

    // It's tricky to check if the timer *restarted* without knowing its previous ID *before* the first setMode.
    // The crucial part is that startActiveStudyTimer clears any *existing* interval.
    // So, if timerIdAfterNew is not null, a timer is running.

    setMode('review'); // Calls startGame() again, which should restart the timer.
    console.log("Timer ID after setting mode to 'review': " + activeStudyTimerId + ". (Should be different from 'new' if timer truly restarted)");
    const timerIdAfterReview = activeStudyTimerId;

    if (timerIdAfterNew !== null && timerIdAfterReview !== null) {
        if (timerIdAfterNew !== timerIdAfterReview) {
            // This is the ideal case in many JS environments, where setInterval returns a new ID.
            console.log("SUCCESS: Timer appears to have been restarted with a new ID on mode switch.");
        } else {
            // Some environments might reuse timer IDs if the previous one was cleared effectively.
            // The critical check is that startActiveStudyTimer was called and would have cleared the old one.
            console.log("INFO: Timer ID is the same after mode switch. This can be normal if the environment reuses IDs after clearInterval. Main check is that startActiveStudyTimer was called.");
        }
    } else {
        console.log("ERROR: Timer ID is null after one or both mode switches, indicating timer didn't start correctly.");
    }
    stopActiveStudyTimer(); // Clean up
    console.log("Timer stopped after mode switching tests.");

    console.log("\n--- Test Script Finished ---");
}, 100); // Small delay for initial setup
