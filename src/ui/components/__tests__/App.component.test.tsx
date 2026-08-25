import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { gameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/useGameStore';
import { App } from '../../../App';

import baseStoreState from '../__mocks__/base-store-state.json';

const uiSceneMocks = vi.hoisted(() => ({
  destroyGame: vi.fn(),
  ensurePhaserGame: vi.fn(() => ({ id: 'game-instance' })),
  onElectronCloseCancelled: vi.fn(),
  onElectronCloseConfirmed: vi.fn(),
  onElectronCloseRequested: vi.fn(),
  openMenuView: vi.fn(),
  startGame: vi.fn(),
}));

vi.mock('@game/scenes/UIScene', () => ({
  destroyGame: uiSceneMocks.destroyGame,
  ensurePhaserGame: uiSceneMocks.ensurePhaserGame,
  onElectronCloseCancelled: uiSceneMocks.onElectronCloseCancelled,
  onElectronCloseConfirmed: uiSceneMocks.onElectronCloseConfirmed,
  onElectronCloseRequested: uiSceneMocks.onElectronCloseRequested,
  openMenuView: uiSceneMocks.openMenuView,
  startGame: uiSceneMocks.startGame,
  continueGame: vi.fn(),
  returnToMenu: vi.fn(),
}));

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  gameStore.setState({
    ...(structuredClone(baseStoreState) as Partial<GameStoreState>),
    ...partialState,
  });
}

describe('App start menu controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockStoreState();
  });

  it('shows the loading overlay until boot completes and only shows the menu button in the start phase', () => {
    const { rerender } = render(<App />);

    expect(screen.getByText(/loading game/i)).toBeInTheDocument();
    expect(screen.queryByTestId('menu-toggle-button')).not.toBeInTheDocument();

    act(() => {
      setMockStoreState({
        activeUsername: 'AcePilot',
        bootReady: true,
        phase: 'start',
      });
    });
    rerender(<App />);

    expect(screen.getByTestId('menu-toggle-button')).toBeVisible();
    expect(screen.queryByTestId('start-menu-options')).not.toBeInTheDocument();
  });

  it('opens the React menu and routes menu selections through UIScene', () => {
    act(() => {
      setMockStoreState({
        activeUsername: 'AcePilot',
        bootReady: true,
        phase: 'start',
      });
    });

    render(<App />);

    fireEvent.click(screen.getByTestId('menu-toggle-button'));

    expect(screen.getByTestId('start-menu-options')).toBeVisible();

    fireEvent.click(screen.getByTestId('menu-option-profile'));

    expect(uiSceneMocks.openMenuView).toHaveBeenCalledWith('profile');
    expect(screen.queryByTestId('start-menu-options')).not.toBeInTheDocument();
  });

  it('renders the performance page when the menu view is set to performance', () => {
    act(() => {
      setMockStoreState({
        activeUsername: 'AcePilot',
        bootReady: true,
        menuView: 'performance',
        phase: 'start',
      });
    });

    render(<App />);

    expect(screen.getByTestId('performance-overlay')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'PERFORMANCE' })).toBeInTheDocument();
  });

  it('renders the profile page when the menu view is set to profile', () => {
    act(() => {
      setMockStoreState({
        activeUsername: 'AcePilot',
        bootReady: true,
        menuView: 'profile',
        phase: 'start',
      });
    });

    render(<App />);

    expect(screen.getByTestId('profile-overlay')).toBeVisible();
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
  });

  it('forwards Electron close events to UIScene and destroys the Phaser game on unmount', () => {
    setMockStoreState({ bootReady: true, phase: 'login' });

    const { unmount } = render(<App />);

    window.dispatchEvent(new Event('electron-close-requested'));
    window.dispatchEvent(new Event('electron-close-confirmed'));
    window.dispatchEvent(new Event('electron-close-cancelled'));

    expect(uiSceneMocks.onElectronCloseRequested).toHaveBeenCalledTimes(1);
    expect(uiSceneMocks.onElectronCloseConfirmed).toHaveBeenCalledTimes(1);
    expect(uiSceneMocks.onElectronCloseCancelled).toHaveBeenCalledTimes(1);

    unmount();

    expect(uiSceneMocks.destroyGame).toHaveBeenCalledWith({ id: 'game-instance' });

    window.dispatchEvent(new Event('electron-close-requested'));

    expect(uiSceneMocks.onElectronCloseRequested).toHaveBeenCalledTimes(1);
  });
});
