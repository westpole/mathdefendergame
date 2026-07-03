### Plan

1. [Done] Decouple UI from Phaser scope
  1.1 [Done] Generate instructions and skills
  1.2 [Done] update instructions file
  1.3 generate skills for React
  1.4 generate skills for phaser

--> set strategy how to iterate through the development process
  [] define version scope
  [] define versioning workflow
  [] set scripts
  [] how to manage tickets

2. [Done] Use React for UI on top of Phaser canvas
3. Introduce StoryBook for React UI
  3.1 Do we have test coverage for stories
  3.2 Create a workflow to change UI
4. Run test with a new build
5. Introduce Jest for Phaser unit tests`
  5.1 Mock data for scenarious
6. Add components tests for UI
  6.1 Mock data
7. Performance testing
  7.1 What are tools
8. Build process
9. [Done] Add Zustand for UI and game
10. Connect Snyk

### ------------------

1. Only game exit when playing
2. Menu: "new game", "statistics", "exit"
3. Replace tarret with a screens for calculation result
4. Use UI overlay for messages
5. Introduce 10 in a row correct answers
  5.1 Calculate how many "10-in-a-row1" during a game
  5.2 Calculate how many incorrect answers

### UI fix

- [] Add menu option for rules page
- [] Add menu option for stats page
- [] Display level selection and game start button in the middle of a window
- [] Move Game stats to the right and stack them vertically
- [] replace turret object with a box to display current calculation
- [] add night sky background with stars at the top that fades to the bottom
- [] paint land part in dark green
- [] add shapes of a city buildings shape on top a "death line"

### TODO

- [] add jest as test framework
- [] electron need to handle profile and stats
- [] need lite storage implementation
- [] decide on stats report
- [] "dist" folder for current build test
- [] "builds" folder for long term build storage (save under folder <name-date-id>)

- [] loosing shield needs a "shaking + sound" effect
- [] image and font are fuzzy (tried to tweak it, but did not help)
- [] add wide screen for Desktop
