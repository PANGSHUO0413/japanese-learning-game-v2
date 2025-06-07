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

function startGame() {
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

// Initial setup
console.log("script.js loaded successfully.");
startGame(); // Start game in default mode ('new') on page load
