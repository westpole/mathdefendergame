import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/useGameStore';
import { App } from '../../../App';

import baseStoreState from '../__mocks__/base-store-state.json';

const originalVisibilityState = document.visibilityState;

const platformMocks = vi.hoisted(() => ({
  subscribeToAppCloseEvents: vi.fn(),
}));

const uiSceneMocks = vi.hoisted(() => ({
  appendAnswerInputCharacter: vi.fn(),
  continueGame: vi.fn(),
  destroyGame: vi.fn(),
  ensurePhaserGame: vi.fn(() => ({ id: 'game-instance' })),
  logOff: vi.fn(),
  onElectronCloseCancelled: vi.fn(),
  onElectronCloseConfirmed: vi.fn(),
  onElectronCloseRequested: vi.fn(),
  openMenuView: vi.fn(),
  pauseGameForManualEnd: vi.fn(),
  removeAnswerInputCharacter: vi.fn(),
  setAnswerInputBuffer: vi.fn(),
  shouldConfirmElectronClose: vi.fn(() => false),
  startGame: vi.fn(),
  submitAnswerInput: vi.fn(),
}));

vi.mock('../../../platform/adapter', () => ({
  subscribeToAppCloseEvents: platformMocks.subscribeToAppCloseEvents,
}));

vi.mock('@game/scenes/UIScene', () => ({
  appendAnswerInputCharacter: uiSceneMocks.appendAnswerInputCharacter,
  continueGame: uiSceneMocks.continueGame,
  destroyGame: uiSceneMocks.destroyGame,
  ensurePhaserGame: uiSceneMocks.ensurePhaserGame,
  logOff: uiSceneMocks.logOff,
  onElectronCloseCancelled: uiSceneMocks.onElectronCloseCancelled,
  onElectronCloseConfirmed: uiSceneMocks.onElectronCloseConfirmed,
  onElectronCloseRequested: uiSceneMocks.onElectronCloseRequested,
  openMenuView: uiSceneMocks.openMenuView,
  pauseGameForManualEnd: uiSceneMocks.pauseGameForManualEnd,
  removeAnswerInputCharacter: uiSceneMocks.removeAnswerInputCharacter,
  setAnswerInputBuffer: uiSceneMocks.setAnswerInputBuffer,
  shouldConfirmElectronClose: uiSceneMocks.shouldConfirmElectronClose,
  startGame: uiSceneMocks.startGame,
  submitAnswerInput: uiSceneMocks.submitAnswerInput,
  returnToMenu: vi.fn(),
}));

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  useGameStore.setState({
    ...(structuredClone(baseStoreState) as Partial<GameStoreState>),
    ...partialState,
  });
}

function setVisibilityState(visibilityState: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: visibilityState,
  });
}

describe('App start menu controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformMocks.subscribeToAppCloseEvents.mockReturnValue(vi.fn());
    setVisibilityState('visible');
    setMockStoreState();
  });

  afterEach(() => {
    setVisibilityState(originalVisibilityState);
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
    expect(screen.queryByTestId('menu-options')).not.toBeInTheDocument();
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
    expect(screen.getByTestId('menu-overlay')).toBeVisible();
    expect(screen.getByTestId('menu-close-button')).toBeVisible();
    expect(screen.getByTestId('menu-option-logoff')).toBeVisible();

    expect(screen.getByTestId('menu-options')).toBeVisible();

    fireEvent.click(screen.getByTestId('menu-option-profile'));

    expect(uiSceneMocks.openMenuView).toHaveBeenCalledWith('profile');
    expect(screen.queryByTestId('menu-options')).not.toBeInTheDocument();
  });

  it('closes the start menu with the dedicated close action', () => {
    act(() => {
      setMockStoreState({
        activeUsername: 'AcePilot',
        bootReady: true,
        phase: 'start',
      });
    });

    render(<App />);

    fireEvent.click(screen.getByTestId('menu-toggle-button'));
    expect(screen.getByTestId('menu-overlay')).toBeVisible();
    expect(screen.getByTestId('menu-options')).toBeVisible();

    fireEvent.click(screen.getByTestId('menu-close-button'));

    expect(screen.queryByTestId('menu-overlay')).not.toBeInTheDocument();
    expect(screen.queryByTestId('menu-options')).not.toBeInTheDocument();
  });

  it('routes the Home menu option back to the Home overlay', () => {
    act(() => {
      setMockStoreState({
        activeUsername: 'AcePilot',
        bootReady: true,
        menuView: 'profile',
        phase: 'start',
      });
    });

    render(<App />);

    fireEvent.click(screen.getByTestId('menu-toggle-button'));
    fireEvent.click(screen.getByTestId('menu-option-home'));

    expect(uiSceneMocks.openMenuView).toHaveBeenCalledWith('home');
    expect(uiSceneMocks.startGame).not.toHaveBeenCalled();
    expect(screen.queryByTestId('menu-options')).not.toBeInTheDocument();
  });

  it('starts the game from the start menu play action', () => {
    act(() => {
      setMockStoreState({
        activeUsername: 'AcePilot',
        bootReady: true,
        phase: 'start',
      });
    });

    render(<App />);

    fireEvent.click(screen.getByTestId('menu-toggle-button'));
    fireEvent.click(screen.getByTestId('menu-option-play'));

    expect(uiSceneMocks.startGame).toHaveBeenCalledTimes(1);
    expect(uiSceneMocks.openMenuView).not.toHaveBeenCalledWith('home');
    expect(screen.queryByTestId('menu-options')).not.toBeInTheDocument();
  });

  it('routes the Log off menu option through UIScene', () => {
    act(() => {
      setMockStoreState({
        activeUsername: 'AcePilot',
        bootReady: true,
        phase: 'start',
      });
    });

    render(<App />);

    fireEvent.click(screen.getByTestId('menu-toggle-button'));
    fireEvent.click(screen.getByTestId('menu-option-logoff'));

    expect(uiSceneMocks.logOff).toHaveBeenCalledTimes(1);
    expect(uiSceneMocks.startGame).not.toHaveBeenCalled();
    expect(uiSceneMocks.openMenuView).not.toHaveBeenCalled();
    expect(screen.queryByTestId('menu-options')).not.toBeInTheDocument();
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
    const handlers = platformMocks.subscribeToAppCloseEvents.mock.calls[0]?.[0];

    expect(handlers).toBeDefined();

    handlers.onCloseRequested();
    handlers.onCloseConfirmed();
    handlers.onCloseCancelled();

    expect(uiSceneMocks.onElectronCloseRequested).toHaveBeenCalledTimes(1);
    expect(uiSceneMocks.onElectronCloseConfirmed).toHaveBeenCalledTimes(1);
    expect(uiSceneMocks.onElectronCloseCancelled).toHaveBeenCalledTimes(1);

    unmount();

    expect(uiSceneMocks.destroyGame).toHaveBeenCalledWith({ id: 'game-instance' });
  });

  it('pauses active gameplay when the document is hidden', () => {
    setMockStoreState({ bootReady: true, phase: 'playing' });

    render(<App />);

    act(() => {
      setVisibilityState('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(uiSceneMocks.pauseGameForManualEnd).toHaveBeenCalledWith('background');
  });

  it('does not trigger a background pause outside active gameplay', () => {
    setMockStoreState({ bootReady: true, phase: 'start' });

    render(<App />);

    act(() => {
      setVisibilityState('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(uiSceneMocks.pauseGameForManualEnd).not.toHaveBeenCalled();
  });
});
