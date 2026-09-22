# UI Overlay and Game Engine Wiring

This diagram shows how the React overlays, Zustand store, Phaser scenes, core game logic, and Electron shell are currently wired together.

```mermaid
flowchart TD
    E["Electron main process<br/>electron/main.js"] -->|dispatches close query / close requested / close confirmed / close cancelled| A["React shell<br/>src/App.tsx"]

    A -->|mounts once and subscribes to close events| P["Phaser singleton bootstrap<br/>src/game/scenes/UIScene.ts<br/>ensurePhaserGame facade"]
    A -->|visibility hidden while playing<br/>pause for background state| U["UIScene facade<br/>startGame / continueGame / resumePausedGame / endGameEarly / openScreenView / logOff / input helpers"]
    P -->|starts first| B["BootScene<br/>src/game/scenes/BootScene.ts"]
    B -->|"document.fonts.ready<br/>markBootReady()"| S["Zustand store<br/>src/store/useGameStore.ts"]
    S -->|bootReady false| L["Loading<br/>shown while boot is unresolved"]

    A -->|selects by phase + screenView| O["UI overlays"]
    O --> I["LoginOverlay<br/>phase: login"]
    O --> M["Start overlays<br/>phase: start"]
    O --> H["HUDOverlay + mobile keypad<br/>phase: playing"]
    O --> PA["PauseOverlay<br/>phase: paused"]
    O --> SM["StageMessageOverlay<br/>phase: stage-message"]
    O --> GO["GameOverOverlay<br/>phase: gameover"]

    M --> MM["HomeOverlay<br/>screenView: home"]
    M --> PR["ProfileOverlay<br/>screenView: profile"]
    M --> PF["PerformanceOverlay<br/>screenView: performance"]
    M --> RU["RulesOverlay<br/>screenView: rules"]
    M --> MC["MenuControls<br/>Home / Play / Profile / Performance / Rules / Log off"]

    MC -->|"openScreenView(view)"| U
    MC -->|Play Game / Log off| U
    MM -->|Start Defense| U
    SM -->|Continue button or Enter| U
    PA -->|Resume / End game| U
    GO -->|Start new game| U
    H -->|mobile keypad buttons| U

    U -->|start game creates or restarts scene| GS["GameScene<br/>src/game/scenes/GameScene.ts"]
    U -->|return to menu or open menu view| S
    U -->|close flow helpers| E

    GS -->|owns render loop, desktop keyboard, touch pause, and resize sync| G["Game rules<br/>src/game/main.ts<br/>class Game"]
    G -->|sync store and overlay state| S
    GS -->|bridges callbacks to store| S
    S -->|React selectors re-render overlays| A

    subgraph StageStatus["Game stage status"]
        ST1["Store fields mirrored into HUD<br/>stage, score, lives, shield, streak, inputBuffer"]
        ST2["While playing<br/>HUD reads store.stage"]
        ST3["On stage finish<br/>GameScene calls showStageMessage with success, stage, score, lives, stageIncorrect"]
        ST4["Important timing<br/>stage clear shows the stage message first, then advances the internal stage for the next round"]
        ST5["After continue<br/>resume from message returns to playing and syncs the next stage back into the store and HUD"]
    end

    G --> ST1
    ST1 --> H
    H --> ST2
    G --> ST3
    ST3 --> SM
    ST3 --> ST4
    ST4 --> ST5

    subgraph PrematureEnd["Manual end and close flow"]
        PE1["PauseOverlay reason<br/>escape / window-close / background"]
        PE2["GameScene.endGameEarly()<br/>builds premature-end snapshot"]
        PE3["Store persists history and profile progress"]
        PE4["closeApp true: show saving state then notify Electron ready"]
        PE5["closeApp false: stop scene and route to profile view"]
    end

    PA --> PE1
    U --> PE2
    PE2 --> PE3
    PE2 --> PE4
    PE2 --> PE5

    subgraph PhaseMap["Overlay phase map from store.phase"]
        PM1["!bootReady shows Loading<br/>initially phase: booting"]
        PM2["login to LoginOverlay"]
        PM3["start plus screenView to home, profile, performance, rules overlays"]
        PM4["playing to HUDOverlay"]
        PM5["paused to PauseOverlay"]
        PM6["stage-message to StageMessageOverlay"]
        PM7["gameover to GameOverOverlay"]
    end

    S --> PhaseMap
```

## Important details

- Zustand is the integration boundary. React does not talk directly to the Game class; React mostly reads store state and invokes UIScene facade functions.
- Phaser is created as a singleton in UIScene. App mounts the Phaser container, subscribes to Electron close events, and pauses active gameplay when the document becomes hidden, but scene lifecycle stays controlled from UIScene.
- Loading is driven by `bootReady`, not just `phase`. The initial store phase is `booting`, and `BootScene` waits for `document.fonts.ready` before `markBootReady()` sends the app either to `login` or directly to `start` when a remembered profile is still valid.
- The start menu is split across `phase` and `screenView`. `phase === 'start'` enables the menu family, `screenView` picks which start overlay is visible, and `MenuControls` owns the Home, Play Game, Profile, Performance, Rules, and Log off actions.
- HUD is not read-only. The mobile keypad in `HUDOverlay` calls UIScene input helpers, while `GameScene` still owns desktop keyboard input, touch-to-pause behavior, and Phaser render/update work.
- GameScene is the bridge layer. It forwards gameplay callbacks from `Game` into store updates such as `syncHUD`, `showStageMessage`, `showPauseOverlay`, and `showGameOver`.
- Stage status has two representations on purpose. The store `stage` field feeds the HUD during active play, while `stageMessage.stage` preserves the stage that was just cleared or lost for the stage-message overlay.
- On successful stage completion, the stage-message overlay is shown before the internal game stage increments for the next round. The next stage number reaches the HUD only after the player continues.
- A streak reward uses a temporary overlay-like message inside HUD state, not a separate `phase`. Gameplay pauses briefly, the store holds `streakRewardMessage`, and the scene auto-resumes after the timer.
- Pause reasons are explicit in store state: `escape`, `window-close`, and `background`. Both Electron close requests and browser visibility changes route through the same pause overlay machinery.
- Manual end and Electron close both use the same premature-end path. `GameScene.endGameEarly()` builds a gameplay snapshot, persists history/profile progress through the store, then either notifies Electron that close can proceed or routes the player back to the profile start view.
