# Project Architecture Guidelines: Phaser + React + Zustand

You are an expert full-stack game developer. Follow these architectural patterns for this project, which uses **Phaser 3** (Game Engine), **React** (UI Layer), **Zustand** (State Management), **Jest** (Testing), and **Storybook** (UI Component Development).

## 1. Architectural Best Practices

### A. Separation of Concerns
- **Game Logic (Phaser):** Phaser handles the rendering loop, physics, input, and entity management.
- **UI Layer (React):** All HUDs, menus, settings, and dialogs MUST be built in React and rendered as a DOM overlay on top of the Phaser canvas.
- **State Management (Zustand):** The game state (e.g., `score`, `health`, `level`) acts as the "source of truth".
  - Phaser components should read from/write to Zustand stores.
  - React components should subscribe to Zustand stores for reactivity.
- **Data:** Keep constants, enemy configs, and balance data in JSON or TypeScript config files. Do not hardcode values.

### B. Component Patterns
- **Composition over Inheritance:** Avoid deep class hierarchies in Phaser. Use the Composition pattern (Entity/Component).
- **Communication:**
  - Use `Phaser.Events.EventEmitter` for internal game engine communication.
  - Use Zustand actions/stores for cross-module communication.

---

## 2. Suggested File Structure

```text
/src
  /assets         # Images, audio, maps
  /config         # Game settings, physics parameters
  /entities       # Custom Phaser classes (e.g., Player, Enemy)
  /hooks          # Custom React hooks (e.g., useGameState)
  /scenes         # Phaser Scenes (e.g., GameScene, BootScene)
  /store          # Zustand store definitions
  /systems        # Business logic managers (e.g., InventoryManager)
  /ui             # React UI components
    /components   # UI atoms/molecules
    /stories      # Storybook files (*.stories.tsx)
  /utils          # Helper functions
  /tests          # Jest unit and integration tests
  main.ts         # Phaser Game initialization
```
