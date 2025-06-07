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

const currentModeDisplay = document.getElementById('current-mode-display'); // UI element to show the current learning mode
const seedCountDisplay = document.getElementById('seed-count'); // For Garden/Focus Mode
const gardenPlotsDisplay = document.getElementById('garden-plots'); // For Garden display
const multipleChoiceArea = document.getElementById('multiple-choice-area');
const toggleInputModeButton = document.getElementById('toggle-input-mode-button');
const userInputArea = document.getElementById('user-input-area'); // Already exists, but good to have a const for it if we manipulate it often
const playAudioButton = document.getElementById('play-audio-button');

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
let isChoiceMode = false; // false for text input, true for multiple choice
let currentQuestionFormat = 'JtoE'; // 'JtoE' (Japanese to English) or 'EtoJ' (English to Japanese)

// Spaced Repetition Intervals (days)
// Defines how many days later a word should be reviewed based on its mastery level.
// Index corresponds to masteryLevel: e.g., intervals[0] is for masteryLevel 0.
// masteryLevel 0 -> review in 1 day
// masteryLevel 1 -> review in 2 days
// masteryLevel 2 -> review in 4 days
// etc.
const spacedRepetitionIntervals = [1, 2, 4, 8, 16, 30];

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

function playAudio(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP'; // Set language to Japanese
    speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech synthesis not supported in this browser.");
    // Optionally, provide fallback or inform user
    if(characterDisplay) characterDisplay.textContent = "Audio playback not supported.";
  }
}

function generateMultipleChoiceOptions(correctAnswerItem, questionFormat = 'JtoE') {
  const options = [];
  let correctAnswerText;
  let optionTypeIsJapanese = false;

  if (questionFormat === 'JtoE') {
    correctAnswerText = correctAnswerItem.english;
  } else if (questionFormat === 'EtoJ' || questionFormat === 'FillInTheBlank_JP') {
    correctAnswerText = correctAnswerItem.japanese;
    optionTypeIsJapanese = true;
  } else { // Default or unknown, fallback to JtoE
    correctAnswerText = correctAnswerItem.english;
  }
  options.push({ text: correctAnswerText, correct: true });

  const distractors = [];
  const vocabularyCopy = [...vocabulary];
  shuffleArray(vocabularyCopy);

  for (const word of vocabularyCopy) {
    if (distractors.length >= 3) break;

    const distractorText = optionTypeIsJapanese ? word.japanese : word.english;
    if (distractorText.toLowerCase() !== correctAnswerText.toLowerCase() &&
        !options.some(opt => opt.text.toLowerCase() === distractorText.toLowerCase()) &&
        !distractors.some(d => d.text.toLowerCase() === distractorText.toLowerCase())) {
      distractors.push({ text: distractorText, correct: false });
    }
  }

  while (distractors.length < 3 && vocabularyCopy.length > options.length + distractors.length) {
      let emergencyDistractor = vocabularyCopy[Math.floor(Math.random() * vocabularyCopy.length)];
      let emergencyDistractorText = optionTypeIsJapanese ? emergencyDistractor.japanese : emergencyDistractor.english;
      if (emergencyDistractorText.toLowerCase() !== correctAnswerText.toLowerCase() &&
          !distractors.some(d => d.text.toLowerCase() === emergencyDistractorText.toLowerCase())) {
          distractors.push({ text: emergencyDistractorText, correct: false });
      } else {
          break;
      }
  }

    const defaultDistractors = optionTypeIsJapanese
        ? ["です", "ます", "でした", "ました"] // Common Japanese endings/particles as distractors
        : ["is", "am", "are", "was"]; // Common English words
    let defaultIdx = 0;
    while (distractors.length < 3) {
        const distractorText = defaultDistractors[defaultIdx % defaultDistractors.length];
        defaultIdx++;
        if (distractorText.toLowerCase() !== correctAnswerText.toLowerCase() &&
            !options.some(opt => opt.text.toLowerCase() === distractorText.toLowerCase()) &&
            !distractors.some(d => d.text.toLowerCase() === distractorText.toLowerCase())) {
            distractors.push({ text: distractorText, correct: false });
        }
    }


  return shuffleArray([...options, ...distractors]);
}

function loadQuestion() {
  // Reset UI elements specific to question formats
  if (playAudioButton) playAudioButton.classList.add('hidden');
  characterDisplay.textContent = ''; // Clear previous question text initially

  if (isChoiceMode) {
    userInputArea.classList.add('hidden');
    multipleChoiceArea.classList.remove('hidden');
    if (submitButton) submitButton.style.display = 'none';
    multipleChoiceArea.innerHTML = '';

    if (currentQuestionSet && currentQuestionIndex < currentQuestionSet.length) {
      const currentQuestion = currentQuestionSet[currentQuestionIndex];
      let options;

      if (currentQuestionFormat === 'AudioToE') {
        if (playAudioButton) {
          playAudioButton.classList.remove('hidden');
          playAudioButton.onclick = () => playAudio(currentQuestion.japanese);
        }
        characterDisplay.textContent = "Listen and choose the correct meaning";
        options = generateMultipleChoiceOptions(currentQuestion, 'JtoE');
      } else if (currentQuestionFormat === 'EtoJ') {
        characterDisplay.textContent = currentQuestion.english;
        options = generateMultipleChoiceOptions(currentQuestion, 'EtoJ');
      } else if (currentQuestionFormat === 'FillInTheBlank_JP') {
        // For FillInTheBlank_JP, the question prompt might be more complex,
        // e.g., showing a sentence with a blank. For now, a generic prompt.
        // The actual blank would be part of characterDisplay.textContent if we had sentence data.
        // For now, it implies choosing the correct Japanese word for a given context (which is not provided yet)
        // or simply choosing the correct Japanese word (similar to EtoJ).
        // Let's assume the question is "What is the Japanese for: [English word/phrase]?"
        // Or, "Choose the correct Japanese word:" if the English is implied or part of a larger sentence not yet implemented.
        characterDisplay.textContent = `Choose the correct Japanese for: ${currentQuestion.english}`; // Or more generic
        options = generateMultipleChoiceOptions(currentQuestion, 'FillInTheBlank_JP');
      } else { // JtoE (default)
        characterDisplay.textContent = currentQuestion.japanese;
        options = generateMultipleChoiceOptions(currentQuestion, 'JtoE');
      }

      if (options) { // Ensure options were generated
        options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.classList.add('choice-button');
        button.dataset.correct = option.correct;
        button.addEventListener('click', () => {
          // Disable all choice buttons after a selection
          const choiceButtons = multipleChoiceArea.querySelectorAll('.choice-button');
          choiceButtons.forEach(btn => btn.disabled = true);
          checkAnswer(option.text, option.correct); // Pass text for potential logging, and correctness
        });
        multipleChoiceArea.appendChild(button);
      });
    }
  } else {
    userInputArea.classList.remove('hidden');
    multipleChoiceArea.classList.add('hidden');
    if (submitButton) submitButton.style.display = '';
    if (playAudioButton) playAudioButton.classList.add('hidden'); // Ensure audio button is hidden for text input
    if (answerInput) answerInput.focus();
  }

  // This block runs for both modes to set up the question context if one exists,
  // and for text input mode, it sets the character display.
  if (currentQuestionSet && currentQuestionIndex < currentQuestionSet.length) {
    const currentQuestion = currentQuestionSet[currentQuestionIndex];

    if (!isChoiceMode) {
        if (currentQuestionFormat === 'AudioToE') {
            if (playAudioButton) {
                playAudioButton.classList.remove('hidden');
                playAudioButton.onclick = () => playAudio(currentQuestion.japanese);
            }
            characterDisplay.textContent = "Listen and type the English meaning";
        } else if (currentQuestionFormat === 'EtoJ' || currentQuestionFormat === 'FillInTheBlank_JP') {
            // For text input, FillInTheBlank_JP behaves like EtoJ
            characterDisplay.textContent = currentQuestion.english;
        } else { // JtoE
            characterDisplay.textContent = currentQuestion.japanese;
        }
    }

    if (!isChoiceMode) { // Specific to text input UI setup
      answerInput.value = '';
      answerInput.disabled = false;
    }
    // Submit button is handled by mode-specific logic above for visibility,
    // but its disabled state depends on whether a question is loaded.
    if (submitButton) submitButton.disabled = false;

  } else {
    characterDisplay.textContent = "ゲーム終了"; // "Game Over"
    answerInput.disabled = true;
    submitButton.disabled = true;
    if (currentMode === 'review' && currentQuestionSet.length === 0 && wrongAnswers.length === 0) {
        characterDisplay.textContent = "Review Cleared!";
    } else if (currentQuestionSet.length === 0 && currentMode !== 'new') {
        characterDisplay.textContent = "No words in this set!";
    }
console.log('No more questions in current set or set is empty.'); // Enhanced log for clarity
stopActiveStudyTimer(); // Stop timer when game/set ends

  }
}

// Modified to handle both text input and multiple choice
function checkAnswer(userAnswerText = null, isCorrectChoice = null) {
  if (currentQuestionSet && currentQuestionIndex < currentQuestionSet.length) {
    const currentQuestion = currentQuestionSet[currentQuestionIndex];
    let isActuallyCorrect;
    let userAnswerDisplay = userAnswerText; // For logging or display purposes

    if (isChoiceMode) {
      if (isCorrectChoice === null) { // Should not happen if called correctly from choice button
        console.error("checkAnswer called in choice mode without isCorrectChoice value.");
        return;
      }
      isActuallyCorrect = isCorrectChoice;
      // userAnswerDisplay is already set from the clicked button's text
    } else {
      // Text input mode
      if (!answerInput) return; // Should not happen
      userAnswerDisplay = answerInput.value.trim();
      let correctAnswer;
      if (currentQuestionFormat === 'EtoJ' || currentQuestionFormat === 'FillInTheBlank_JP') {
        correctAnswer = currentQuestion.japanese.toLowerCase();
      } else { // JtoE or AudioToE (expects English answer)
        correctAnswer = currentQuestion.english.toLowerCase();
      }
      isActuallyCorrect = userAnswerDisplay.toLowerCase() === correctAnswer;
    }

    // Find the original word in the main vocabulary array to update its stats
    const vocabularyWord = vocabulary.find(v => v.japanese === currentQuestion.japanese);

    if (!vocabularyWord) {
      console.error("Critical: Word from currentQuestionSet not found in main vocabulary. This may indicate an issue with data consistency or question set generation.");
      currentQuestionIndex++;
      loadQuestion();
      return;
    }

    console.log('Current word:', currentQuestion.japanese, 'Stats before:', JSON.parse(JSON.stringify(vocabularyWord))); // Log before update

    wordsAttempted++;
    let reviewIntervalDays; // To store how many days later the next review should be
    const currentDate = new Date(); // For calculating next review date

    // Logic for when the user's answer is correct (now based on isActuallyCorrect)
    if (isActuallyCorrect) {
      score++;
      correctAnswers++;
      comboCounter++;
      if (comboCounter > 0 && comboCounter % 3 === 0) { // Combo bonus
        score++;
        console.log("Combo bonus applied! +1 point.");
      }
      scoreDisplay.textContent = score;
      console.log("Correct answer for:", vocabularyWord.japanese);

      // Update word statistics for a correct answer
      vocabularyWord.exposureCount = (vocabularyWord.exposureCount || 0) + 1;
      vocabularyWord.correctStreak = (vocabularyWord.correctStreak || 0) + 1;

      // Increase mastery level if the correct streak reaches a threshold (e.g., every 2 correct answers in a row)
      // Mastery level is capped at 5 (max level defined by spacedRepetitionIntervals length - 1)
      if (vocabularyWord.correctStreak % 2 === 0 && vocabularyWord.masteryLevel < 5) {
        vocabularyWord.masteryLevel = (vocabularyWord.masteryLevel || 0) + 1;
        console.log(`Mastery level for ${vocabularyWord.japanese} increased to ${vocabularyWord.masteryLevel}`);
      }

      // Determine the next review interval based on the current (potentially updated) mastery level
      // It uses the spacedRepetitionIntervals array. Capped at the highest defined interval.
      reviewIntervalDays = spacedRepetitionIntervals[Math.min(vocabularyWord.masteryLevel, spacedRepetitionIntervals.length - 1)];

      // If the word was marked as wrong earlier in this session, remove it from the session's wrongAnswers list
      const indexInWrongAnswers = wrongAnswers.findIndex(item => item.japanese === vocabularyWord.japanese);
      if (indexInWrongAnswers > -1) {
        wrongAnswers.splice(indexInWrongAnswers, 1);
        console.log("Word removed from current session's wrong answers:", vocabularyWord.japanese);
      }

    } else {
      comboCounter = 0;
      // Log for incorrect answer
      let correctAnswerForDisplay;
      let questionAskedForLog;

      if (currentQuestionFormat === 'EtoJ' || currentQuestionFormat === 'FillInTheBlank_JP') {
        correctAnswerForDisplay = currentQuestion.japanese;
        questionAskedForLog = currentQuestion.english; // English was shown as the prompt
      } else if (currentQuestionFormat === 'AudioToE') {
        correctAnswerForDisplay = currentQuestion.english;
        questionAskedForLog = `Audio of "${currentQuestion.japanese}"`; // Log that it was an audio question
      }
       else { // JtoE
        correctAnswerForDisplay = currentQuestion.english;
        questionAskedForLog = currentQuestion.japanese; // Japanese was shown
      }
      console.log(`Incorrect answer for: ${questionAskedForLog}. User chose/entered: ${userAnswerDisplay}. Correct was: ${correctAnswerForDisplay}`);

      // Update word statistics for an incorrect answer
      vocabularyWord.exposureCount = (vocabularyWord.exposureCount || 0) + 1;
      vocabularyWord.correctStreak = 0; // Reset correct streak
      // Decrease mastery level, but not below 0
      if (vocabularyWord.masteryLevel > 0) {
        vocabularyWord.masteryLevel--;
        console.log(`Mastery level for ${vocabularyWord.japanese} decreased to ${vocabularyWord.masteryLevel}`);
      }

      reviewIntervalDays = 1; // If incorrect, schedule for review the next day to reinforce learning

      // Add the word to the current session's list of wrong answers if it's not already there
      if (!wrongAnswers.find(item => item.japanese === vocabularyWord.japanese)) {
        // Push a reference or copy. If vocabularyWord can be directly used, that's fine.
        // currentQuestion is a copy, vocabularyWord is the original.
        // For consistency with how wrongAnswers might be used elsewhere (if it expects copies),
        // it might be safer to push currentQuestion, but since we update vocabularyWord,
        // and review mode now pulls from vocabulary, this is mostly for the counter.
        wrongAnswers.push(currentQuestion);
      }
    }

    // Calculate the actual next review date by adding the interval days to the current date
    currentDate.setDate(currentDate.getDate() + reviewIntervalDays);
    // Store the next review date in "YYYY-MM-DD" format
    vocabularyWord.nextReviewDate = currentDate.toISOString().split('T')[0];

    console.log('Stats after:', JSON.parse(JSON.stringify(vocabularyWord))); // Log after update
    console.log(`Next review for ${vocabularyWord.japanese} scheduled for: ${vocabularyWord.nextReviewDate}`); // Specific log for review date

    comboCounterDisplay.textContent = comboCounter;
    // wordsToReviewCountDisplay.textContent = wrongAnswers.length; // Old logic: Update based on session's wrong answers
    // New logic: update global review count
    updateGlobalWordsToReviewCount();

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
  // The wrongAnswers.length check for suggestion can remain, as it refers to current session performance.
  if (wrongAnswers.length > 5) {
    console.log("You have " + wrongAnswers.length + " words to review from this session. Try the 'Review Wrong Answers' feature!");
  }
}

function toggleInputMode() {
  isChoiceMode = !isChoiceMode;
  if (isChoiceMode) {
    toggleInputModeButton.textContent = "Switch to Input Mode";
    submitButton.style.display = 'none'; // Hide main submit button
  } else {
    toggleInputModeButton.textContent = "Switch to Choice Mode";
    if (submitButton) submitButton.style.display = '';
    if (playAudioButton) playAudioButton.classList.add('hidden'); // Hide audio button when switching to text input
  }
  loadQuestion(); // Refresh the question display for the new mode
}

// ① 保留 Learning Modes 的 updateGlobalWordsToReviewCount()
function updateGlobalWordsToReviewCount() {
  if (typeof vocabulary === 'undefined' || vocabulary === null) { // Ensure vocabulary data is available
    console.log("Vocabulary not loaded yet, skipping global review count update.");
    return;
  }
  const todayDateString = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  const dueWords = vocabulary.filter(word => word.nextReviewDate && word.nextReviewDate <= todayDateString);
  wordsToReviewCountDisplay.textContent = dueWords.length;
  console.log(`Global words to review count updated: ${dueWords.length}`);
}

// ② 保留 Focus Mode Timer Functions
function startActiveStudyTimer() {
  if (activeStudyTimerId !== null) {
    clearInterval(activeStudyTimerId);
  }
  console.log("Starting active study timer: Tracks study duration and awards seeds.");

  activeStudyTimerId = setInterval(() => {
    studyTimeSeconds++;

    if (studyTimeSeconds > 0 && (studyTimeSeconds % (SEED_REWARD_INTERVAL_MINUTES * 60)) === 0) {
      seeds++;
      seedCountDisplay.textContent = seeds;
      console.log(`Seed awarded! Total seeds: ${seeds}. Total study time: ${studyTimeSeconds / 60} minutes.`);
      growPlants();
    }
  }, 1000);
}

function stopActiveStudyTimer() {
  if (activeStudyTimerId !== null) {
    clearInterval(activeStudyTimerId);
    activeStudyTimerId = null;
    console.log(`Active study timer stopped. Total accumulated study time: ${studyTimeSeconds} seconds.`);
  }
}

// ③ 保留 Garden Functions
function renderGarden() {
    gardenPlotsDisplay.innerHTML = '';

    userGarden.forEach(plant => {
        const plantDiv = document.createElement('div');
        plantDiv.classList.add('plant-item');
        plantDiv.dataset.plantId = plant.id;
        plantDiv.textContent = plantTypes[plant.type].display[plant.stage];
        plantDiv.title = `${plantTypes[plant.type].name} - Stage: ${plantTypes[plant.type].stages[plant.stage]}`;
        gardenPlotsDisplay.appendChild(plantDiv);
    });
    console.log("Garden re-rendered with current plants.");
}

function plantSeed(chosenPlantTypeKey) {
    if (seeds > 0 && userGarden.length < MAX_PLANTS_IN_GARDEN) {
        seeds--;
        seedCountDisplay.textContent = seeds;

        const newPlant = {
            type: chosenPlantTypeKey,
            stage: 0,
            id: nextPlantId++
        };
        userGarden.push(newPlant);

        renderGarden();
        console.log(`Planted a ${plantTypes[chosenPlantTypeKey].name}! Remaining seeds: ${seeds}. Garden spots used: ${userGarden.length}/${MAX_PLANTS_IN_GARDEN}.`);
    } else if (seeds <= 0) {
        console.log("Not enough seeds to plant. Earn more seeds by studying!");
    } else {
        console.log(`Garden is full (Max ${MAX_PLANTS_IN_GARDEN} plants). Cannot plant more.`);
    }
}

function growPlants() {
    let grownOccurred = false;
    console.log("Attempting to grow plants in the garden...");

    userGarden.forEach(plant => {
        if (plant.stage < plantTypes[plant.type].stages.length - 1) {
            plant.stage++;
            grownOccurred = true;
            console.log(`Plant ID ${plant.id} (${plantTypes[plant.type].name}) grew to stage: ${plantTypes[plant.type].stages[plant.stage]}.`);
        } else {
            console.log(`Plant ID ${plant.id} (${plantTypes[plant.type].name}) is already at its final stage.`);
        }
    });

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
  // wrongAnswers are handled per mode now.

  isChoiceMode = false; // Default to text input mode
  currentQuestionFormat = 'JtoE'; // Default question format for a new game session
  userInputArea.classList.remove('hidden');
  multipleChoiceArea.classList.add('hidden');
  if(toggleInputModeButton) toggleInputModeButton.textContent = "Switch to Choice Mode";
  if(submitButton) submitButton.style.display = ''; // Ensure submit button is visible for input mode start
  if(playAudioButton) playAudioButton.classList.add('hidden'); // Ensure audio button hidden at game start


  // console.log(`Starting game in mode: ${currentMode}`); // Old log
  console.log(`Starting game in ${currentMode} mode.`); // New specified log
  const todayDateString = new Date().toISOString().split('T')[0]; // Today's date for filtering review words

  // Logic for 'New Words' mode
  if (currentMode === 'new') {
    wrongAnswers = []; // Reset session's wrong answers list for a fresh start
    // Prioritize words with low exposure (seen less than 3 times) or low mastery (level less than 2)
    let newWords = vocabulary.filter(word => word.exposureCount < 3 || word.masteryLevel < 2);
    // Sort these new words: first by exposure count (ascending), then by mastery level (ascending)
    newWords.sort((a, b) => {
      if (a.exposureCount !== b.exposureCount) {
        return a.exposureCount - b.exposureCount;
      }
      return a.masteryLevel - b.masteryLevel;
    });

    // If no words meet the primary "new" criteria, fall back to words with mastery level less than 5
    if (newWords.length === 0) {
      console.log("No 'new' words found based on primary criteria. Falling back to less mastered words.");
      newWords = vocabulary.filter(word => word.masteryLevel < 5);
      newWords.sort((a,b) => a.masteryLevel - b.masteryLevel); // Sort by mastery level
    }

    // Select a subset for the current session (e.g., first 15 words), then shuffle them
    currentQuestionSet = shuffleArray(newWords.slice(0, 15));
    if (currentQuestionSet.length === 0) {
        console.log("No words available for 'new' mode, even after fallback. Displaying message.");
        characterDisplay.textContent = "All words mastered for now!";
        answerInput.disabled = true;
        submitButton.disabled = true;
    } else {
        // console.log(`Mode: New Words. Loaded ${currentQuestionSet.length} words.`); // Old log
        console.log(`Selected ${currentQuestionSet.length} words for the 'New Words' session. First few: `, currentQuestionSet.slice(0,3).map(w => w.japanese));
    }

  } else if (currentMode === 'review') {
    // Logic for 'Review' mode (Corrected to single block)
    // Session wrong answers are not reset here for review based on schedule.
    let reviewWords = vocabulary.filter(word => word.nextReviewDate && word.nextReviewDate <= todayDateString);
    reviewWords.sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate));
    currentQuestionSet = shuffleArray(reviewWords);

    if (currentQuestionSet.length === 0) {
      console.log("No words due for review today!");
      characterDisplay.textContent = "No words to review today!";
      answerInput.disabled = true;
      submitButton.disabled = true;
    } else {
      // console.log(`Mode: Review. Loaded ${currentQuestionSet.length} words due for review.`); // Old log
      console.log(`Selected ${currentQuestionSet.length} words for the 'Review' session. First few: `, currentQuestionSet.slice(0,3).map(w => w.japanese));
    }

  } else if (currentMode === 'challenge') {
    // Logic for 'Challenge' mode (Corrected to single block)
    wrongAnswers = [];
    currentQuestionSet = shuffleArray([...vocabulary]);
    if (currentQuestionSet.length === 0) {
        console.log("No words in vocabulary for 'challenge' mode.");
        characterDisplay.textContent = "No words available!";
        answerInput.disabled = true;
        submitButton.disabled = true;
    } else {
        // console.log("Mode: Challenge. Loaded full vocabulary."); // Old log
        console.log(`Selected ${currentQuestionSet.length} words for the 'Challenge' session. First few: `, currentQuestionSet.slice(0,3).map(w => w.japanese));
    }
  }

  scoreDisplay.textContent = score;
  comboCounterDisplay.textContent = comboCounter;
  wordsAttemptedDisplay.textContent = wordsAttempted;
  accuracyDisplay.textContent = '0';
  // wordsToReviewCountDisplay.textContent = wrongAnswers.length; // Old: Global wrong answers (actually session for new/challenge)
  updateGlobalWordsToReviewCount(); // New: Update with actual global due count

  // Update mode display text in the UI
  let modeText = '';
  if (currentMode === 'new') modeText = 'Mode: New Words';
  else if (currentMode === 'review') modeText = 'Mode: Review';
  else if (currentMode === 'challenge') modeText = 'Mode: Challenge';
  if (currentModeDisplay) currentModeDisplay.textContent = modeText; // Update the specific UI element


  answerInput.value = ''; // Clear the answer input field
  loadQuestion(); // This will handle enabling/disabling inputs
  startActiveStudyTimer(); // Start or restart the timer
  console.log("Game started!");
}

function setMode(newMode) {
  currentMode = newMode;

  let modeText = '';
  if (newMode === 'new') modeText = 'Mode: New Words';
  else if (newMode === 'review') modeText = 'Mode: Review';
  else if (newMode === 'challenge') modeText = 'Mode: Challenge';
  if (currentModeDisplay) currentModeDisplay.textContent = modeText;

  // Update active button
  [modeNewButton, modeReviewButton, modeChallengeButton].forEach(button => {
    button.classList.remove('active-mode');
  });
  if (newMode === 'new') modeNewButton.classList.add('active-mode');
  else if (newMode === 'review') modeReviewButton.classList.add('active-mode');
  else if (newMode === 'challenge') modeChallengeButton.classList.add('active-mode');

  // console.log(`Mode set to: ${newMode}`); // Old log
  console.log(`Mode changed to: ${newMode}`); // New specified log
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
if (toggleInputModeButton) { // Ensure button exists before adding listener
    toggleInputModeButton.addEventListener('click', toggleInputMode);
}

// --- End of Temporary UI --- (toggleQuestionFormatButton removed)


// --- Initial Setup ---

console.log("script.js loaded successfully. Initializing application state...");

// Ensure vocabulary is loaded before calling functions that depend on it.
updateGlobalWordsToReviewCount(); // Initial call on page load

// Ensure the seed count display is accurate on page load.
seedCountDisplay.textContent = seeds;

// --- Temporary UI for Planting ---
if (gardenPlotsDisplay && !document.getElementById('plant-flower-button')) {
    console.log("Adding temporary planting buttons for testing.");
    const plantFlowerButton = document.createElement('button');
    plantFlowerButton.id = 'plant-flower-button';
    plantFlowerButton.textContent = 'Plant Flower (1 Seed)';
    plantFlowerButton.style.margin = "5px";
    plantFlowerButton.onclick = () => plantSeed('flower');
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

// Render the initial state of the garden.
renderGarden();

// Start the game in the default mode ('new').
startGame(); // This will also update mode display and global review count again.

// --- TEST SCRIPT ---
// 这里可以保留 main 分支里的 TEST SCRIPT 不变（Focus Mode + Garden 自动测试）

