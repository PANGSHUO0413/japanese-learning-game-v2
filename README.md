# Japanese Learning Game

## Overview

Welcome to the Japanese Learning Game! This interactive web application helps you learn Japanese vocabulary through various engaging modes. It uses a Spaced Repetition System (SRS) to optimize learning and retention.

## Features

*   **Vocabulary Learning**: Learn Japanese words and their English translations.
*   **Spaced Repetition System (SRS)**: Words are scheduled for review at optimal intervals based on your performance, enhancing long-term memory.
*   **Multiple Learning Modes**: Choose from New Words, Review, or Challenge modes to suit your learning style and needs.
*   **Progress Tracking**: The game tracks your exposure count, mastery level, and correct streak for each word.
*   **Interactive UI**: Clean and simple interface for a smooth learning experience.

## Learning Modes

The game offers three distinct modes to help you learn effectively:

### 1. New Words Mode
*   **Goal**: Introduce new vocabulary systematically.
*   **Logic**: This mode prioritizes words you haven't seen much (low `exposureCount`) or haven't mastered yet (low `masteryLevel`). Words are sorted to show less familiar words first. A small subset of these words is presented in each session to avoid overwhelm.
*   **Outcome**: Gradually builds your vocabulary base.

### 2. Review Mode
*   **Goal**: Reinforce learning and move words into long-term memory using SRS.
*   **Logic**: This mode selects words that are due for review based on their `nextReviewDate`. The scheduling is determined by your past performance:
    *   **Correct answers**: Increase the review interval (e.g., review in 1 day, then 2 days, 4 days, 8 days, etc., as mastery level increases).
    *   **Incorrect answers**: Decrease the review interval, typically scheduling the word for review the next day, and may decrease the mastery level.
*   **Outcome**: Efficiently reviews words just before you're likely to forget them.

### 3. Challenge Mode
*   **Goal**: Test your overall knowledge comprehensively.
*   **Logic**: This mode presents a random mix of *all* words from your vocabulary, regardless of their learning status (mastery level or review schedule).
*   **Outcome**: Provides a good benchmark of your current vocabulary strength across the board.

## How to Play

1.  **Select a Mode**:
    *   Click on "New Words" to learn new vocabulary.
    *   Click on "Review Mode" to practice words due for review.
    *   Click on "Challenge Mode" to test yourself on all words.
2.  **Start Game**: Click the "Start Game" button. The current mode will be displayed.
3.  **View Word**: A Japanese word will be shown on the screen.
4.  **Enter Translation**: Type the English translation of the word in the input field.
5.  **Submit Answer**: Click "Submit" or press Enter.
6.  **Check Result**: The game will indicate if your answer was correct or incorrect.
    *   Your score, combo, and word statistics (exposure, mastery, next review date) will be updated.
    *   The count of global words due for review is also updated.
7.  **Continue**: The next word will load automatically.
8.  **Game End**: When all words in the current session set are completed, a "Game Over" or set-specific message will appear. You can then choose a new mode or start again.
9.  **Review Wrong Answers**: The "Words to Review" count in the Progress section shows how many words are due globally. Clicking the "Review Wrong Answers" button will switch to "Review Mode" and load these due words.

## Setup

1.  Clone this repository:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd <project-directory>
    ```
3.  Open `index.html` in your web browser.
    *   No special server is needed; it runs directly in the browser.

## Data
Vocabulary data is stored in `data/vocabulary.js`. You can customize this file to add your own words. Each word object should follow this structure:
```javascript
{
  japanese: "単語",    // The Japanese word
  english: "word",      // The English translation
  exposureCount: 0,     // How many times the user has seen this word
  masteryLevel: 0,      // A level from 0-5 indicating mastery
  nextReviewDate: "YYYY-MM-DD", // Date for the next scheduled review
  correctStreak: 0      // Number of consecutive correct answers for this word
}
```
Initialize `exposureCount`, `masteryLevel`, and `correctStreak` to 0, and `nextReviewDate` to a past or current date (e.g., "2023-01-01") for new words to appear in "New Words" or "Review" mode initially.
