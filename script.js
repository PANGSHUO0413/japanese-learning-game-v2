// DOM Element References
const characterDisplay = document.getElementById('character-display');
const answerInput = document.getElementById('answer-input');
const submitButton = document.getElementById('submit-button');
const startButton = document.getElementById('start-button');
const scoreDisplay = document.getElementById('score');

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

// Placeholder for functions to be implemented later
function loadQuestion() {
  if (currentQuestionIndex < vocabulary.length) {
    characterDisplay.textContent = vocabulary[currentQuestionIndex].japanese;
    answerInput.value = ''; // Clear previous answer
  } else {
    // Handle end of game - for now, just log it and perhaps disable input
    characterDisplay.textContent = "ゲーム終了"; // "Game Over" in Japanese
    answerInput.disabled = true;
    submitButton.disabled = true;
    console.log("End of vocabulary reached.");
  }
}

function checkAnswer() {
  if (currentQuestionIndex < vocabulary.length) {
    const userAnswer = answerInput.value.trim().toLowerCase();
    const correctAnswer = vocabulary[currentQuestionIndex].english.toLowerCase();

    if (userAnswer === correctAnswer) {
      score++;
      scoreDisplay.textContent = score;
      console.log("Correct answer!");
    } else {
      console.log("Incorrect answer. Correct was: " + correctAnswer);
      // Optional: provide feedback to the user about the incorrect answer
    }

    currentQuestionIndex++;
    loadQuestion();
  }
  // If currentQuestionIndex is already >= vocabulary.length, loadQuestion will handle the game over state.
}

function startGame() {
  score = 0;
  currentQuestionIndex = 0;
  scoreDisplay.textContent = score;
  answerInput.disabled = false;
  submitButton.disabled = false;
  answerInput.value = ''; // Clear input field

  console.log("Game started!");
  loadQuestion();
}

// Event listeners
startButton.addEventListener('click', startGame);
submitButton.addEventListener('click', checkAnswer);

// Initial call to load the first question (or a welcome message)
// For now, let's just log that the script is loaded
console.log("script.js loaded successfully.");
