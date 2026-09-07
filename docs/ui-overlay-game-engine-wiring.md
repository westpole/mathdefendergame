# UI Overlay and Game Engine Wiring

This diagram shows how the React overlays, Zustand store, Phaser scenes, core game logic, and Electron shell are wired together.

```mermaid
flowchart TD
    E["Electron main process<br/>electron/main.js"] -->|dispatches close query / close requested / close confirmed / close cancelled| A["React shell<br/>src/App.tsx"]

    A -->|mounts once| P["Phaser singleton bootstrap<br/>src/game/scenes/UIScene.ts<br/>'ensurePhaserGame()'"]
    P -->|starts first| B["BootScene<br/>src/game/scenes/BootScene.ts"]
    B -->|"document.fonts.ready<br/>markBootReady()"| S["Zustand store<br/>src/store/useGameStore.ts"]

    A -->|selects by phase + menuView| O["UI overlays"]
    O --> L["Loading<br/>phase: booting"]
    O --> I["LoginOverlay<br/>phase: login"]
    O --> M["Start overlays<br/>phase: start"]
    O --> H["HUDOverlay<br/>phase: playing"]
    O --> PA["PauseOverlay<br/>phase: paused"]
    O --> SM["StageMessageOverlay<br/>phase: stage-message"]
    O --> GO["GameOverOverlay<br/>phase: gameover"]

    M --> MM["HomeOverlay<br/>menuView: home"]
    M --> PR["ProfileOverlay<br/>menuView: profile"]
    M --> PF["PerformanceOverlay<br/>menuView: performance"]
    M --> RU["RulesOverlay<br/>menuView: rules"]
    M --> MC["MenuControls"]

    MC -->|"openMenuView(view)"| U
    MM -->|Start Defense| U["UIScene facade<br/>startGame / continueGame / resumePausedGame / endGameEarly / openMenuView"]
    SM -->|Continue button or Enter| U
    PA -->|Resume / End game| U
    GO -->|Start new game| U

    U -->|"startGame() creates or restarts"| GS["GameScene<br/>src/game/scenes/GameScene.ts"]
    U -->|"returnToMenu() / openMenuView()"| S
    U -->|close flow helpers| E

    GS -->|owns render loop + keyboard input| G["Game rules<br/>src/game/main.ts<br/>class Game"]
    G -->|"syncStore() / showStageMessage() / showGameOver() / showPauseOverlay()"| S
    GS -->|bridges callbacks to store| S
    S -->|React selectors re-render overlays| A

    subgraph StageStatus["Game stage status"]
        ST1["Store fields mirrored into HUD<br/>stage, score, lives, shield, streak, inputBuffer"]
        ST2["While playing<br/>HUD reads store.stage"]
        ST3["On stage finish<br/>GameScene calls showStageMessage with success, stage, score, lives, stageIncorrect"]
        ST4["Important timing<br/>'Game.finishStage(true)' shows the stage-message first, then increments internal Game.stage for the next round"]
        ST5["After continue<br/>'resumeFromMessage()' returns to playing and syncs the next stage back into the store and HUD"]
    end

    G --> ST1
    ST1 --> H
    H --> ST2
    G --> ST3
    ST3 --> SM
    ST3 --> ST4
    ST4 --> ST5

    subgraph PhaseMap["Overlay phase map from store.phase"]
        PM1["booting to Loading"]
        PM2["login to LoginOverlay"]
        PM3["start plus menuView to menu, profile, performance, rules overlays"]
        PM4["playing to HUDOverlay"]
        PM5["paused to PauseOverlay"]
        PM6["stage-message to StageMessageOverlay"]
        PM7["gameover to GameOverOverlay"]
    end

    S --> PhaseMap
```

## Important details

- Zustand is the integration boundary. React does not talk directly to the Game class; React mostly reads store state and invokes UIScene facade functions.
- Phaser is created as a singleton in UIScene. App mounts the Phaser container, but scene lifecycle is controlled from UIScene.
- Boot is gated by web font readiness. BootScene waits for `document.fonts.ready` before moving the UI from `booting` to `login`.
- The start menu is split across `phase` and `menuView`. `phase === 'start'` enables the menu family, and `menuView` picks which start overlay is visible.
- GameScene is the bridge layer. It owns Phaser input/rendering and forwards gameplay callbacks from `Game` into store updates such as `syncHUD`, `showStageMessage`, `showPauseOverlay`, and `showGameOver`.
- Stage status has two representations on purpose. The store `stage` field feeds the HUD during active play, while `stageMessage.stage` preserves the stage that was just cleared or lost for the stage-message overlay.
- On successful stage completion, the stage-message overlay is shown before the internal game stage increments for the next round. The next stage number reaches the HUD only after the player continues.
- A streak reward uses a temporary overlay-like message inside HUD state, not a separate `phase`. Gameplay pauses briefly, the store holds `streakRewardMessage`, and the scene auto-resumes after the timer.
- Electron close handling is negotiated across processes. The main process asks the renderer whether a confirmation is needed, React forwards the events to UIScene, and UIScene either resumes play or ends the game early before allowing the window to close.
