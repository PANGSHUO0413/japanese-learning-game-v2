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

// Spaced Repetition Intervals (days)
// Defines how many days later a word should be reviewed based on its mastery level.
// Index corresponds to masteryLevel: e.g., intervals[0] is for masteryLevel 0.
// masteryLevel 0 -> review in 1 day
// masteryLevel 1 -> review in 2 days
// masteryLevel 2 -> review in 4 days
// etc.
const spacedRepetitionIntervals = [1, 2, 4, 8, 16, 30];

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
    // console.log("End of current question set."); // Original log
    console.log('No more questions in current set or set is empty.'); // Enhanced log for clarity
  }
}

function checkAnswer() {
  if (currentQuestionSet && currentQuestionIndex < currentQuestionSet.length) {
    const userAnswer = answerInput.value.trim().toLowerCase();
    const currentQuestion = currentQuestionSet[currentQuestionIndex];
    const correctAnswer = currentQuestion.english.toLowerCase();

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

    // Logic for when the user's answer is correct
    if (userAnswer === correctAnswer) {
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
      console.log(`Incorrect answer for: ${vocabularyWord.japanese}. Correct was: ${correctAnswer}`);

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

// Function to update the global count of words displayed as "Words to Review"
// This count reflects all words in the vocabulary that are currently due for review (today or earlier).
function updateGlobalWordsToReviewCount() {
  if (typeof vocabulary === 'undefined' || vocabulary === null) { // Ensure vocabulary data is available
    console.log("Vocabulary not loaded yet, skipping global review count update.");
    return;
  }
  const todayDateString = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  // Filter the vocabulary to find words whose nextReviewDate is today or in the past
  const dueWords = vocabulary.filter(word => word.nextReviewDate && word.nextReviewDate <= todayDateString);
  wordsToReviewCountDisplay.textContent = dueWords.length; // Update the UI element
  console.log(`Global words to review count updated: ${dueWords.length}`);
}

// Main function to initialize or restart the game
function startGame() {
  score = 0;
  currentQuestionIndex = 0;
  comboCounter = 0;
  wordsAttempted = 0;
  correctAnswers = 0;
  // wrongAnswers are handled per mode now.

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

// Initial setup
console.log("script.js loaded successfully.");
// Ensure vocabulary is loaded before calling functions that depend on it.
// vocabulary.js is loaded before script.js in HTML, so it should be available.
updateGlobalWordsToReviewCount(); // Initial call on page load
startGame(); // Start game in default mode ('new') on page load
// The startGame call will also update the mode display and global review count again.
