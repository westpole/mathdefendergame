# Prompt: Create "Math Defender" HTML5 Game

Role: Expert Game Developer

## Game Overview

The player defends a base from falling meteors containing math expressions by typing the correct answer and pressing Enter. The game features a progression system, difficulty levels, and a persistent leaderboard.

## Core Mechanics

### Game Flow & Progression

Stages: There are 28 total stages.

  Stages 1-4: Addition only.
  Stages 5-8: Subtraction only.
  Stages 9-12: Addition & Subtraction.
  Stages 13-16: Multiplication only.
  Stages 17-20: Division only.
  Stages 21-24: Multiplication & Division.
  Stages 25-28: All operations mixed.

Stage Completion: A stage is cleared when the player scores 200 points (each hit is +10 points).

Difficulty Levels:
  - Child (Easy): Slow speed, low spawn rate.
  - Student (Medium): Moderate speed.
  - Adult (Hard): Fast speed, high spawn rate.

###  Health & Lives System (Crucial Logic)

Global Lives (Retries): The player starts with 10 Global Lives.

Stage Shield (Base Health):
  - Every stage starts with 5 Shield Points.
  - If a meteor crosses the "danger line" (100px from bottom), the player loses 1 Shield Point.
  - Losing Shield points does not immediately reduce Global Lives.

Stage Failure:
  - If Shield reaches 0, the stage is Failed.
  - Penalty: -1 Global Life.
  - Action: The stage restarts. Score reverts to what it was at the beginning of the stage.

Bonuses:
  If a stage is completed without typing a single incorrect answer, the player gains +1 Global Life.

Game Over:
  When Global Lives drop to 0.

### Controls

Input: Type numbers (and minus sign) using the keyboard.
Submit: Press Enter to fire.
Correction: Backspace to edit input.
Exit: Press ESC to exit to the main menu immediately (do not save score).

## Visual & Audio Specs

### Aesthetics

Theme: Dark space background (#1a1a2e gradient).

Font: Use Google Fonts 'Press Start 2P' for headers/titles and 'Roboto' for UI text.

Math Expressions:

  Font: Semibold sans-serif.

  Colors:
    Addition (+): Green (#4ade80)
    Subtraction (-): Yellow (#facc15)
    Multiplication (*): Blue (#60a5fa)
    Division (/): Brown/Orange (#d97706)

Feedback:
  Hit: Particle explosion in the color of the operation.
  Wrong Input: Screen shake effect.
  Stage Clear: Confetti animation.

### HUD Layout

The Heads-Up Display must be positioned as follows:

Top Left:
  Score (Yellow text)
  Difficulty (Uppercase)
  Stage: X/28
  Goal: Current/200

Top Center:
  Label: "BASE SHIELD"
  Visuals: 5 rectangular blocks (Blue = active, Gray = empty).

Top Right:
  Label: "Lives" with numeric counter (e.g., 10).
  Visual Bar: A progress bar representing lives (Green > 6, Yellow > 3, Red <= 3).
  Subtext: "Press ESC to Exit".

## Technical Requirements

### Math Generation

Expressions must result in integers.

Result should generally be < 100.

Division must result in whole numbers.

Subtraction results can be positive or negative (though usually positive logic preferred for younger difficulties).

###  Data Persistence (Leaderboard)

Storage: Use Browser Cookies.

Format: Cookie name mdg_<randomID>. Content: JSON object { name, score, perfScore, difficulty, date }.

Logic:
  - Group scores by Difficulty (Child, Student, Adult).
  - Keep only the top 10 scores per difficulty.
  - Ranking based on Combined Score (Game Score + Performance Accuracy %).

Display: In the Start Menu, show a tabbed leaderboard (Child | Student | Adult).
