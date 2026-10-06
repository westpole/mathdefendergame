import { act, fireEvent, render, screen } from '@testing-library/react';

import { cancelElectronClose, endGameEarly, resumePausedGame } from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';

import baseStoreState from '@ui/components/__mocks__/base-store-state.json';

vi.mock('@game/scenes/UIScene', () => ({
  cancelElectronClose: vi.fn(),
  endGameEarly: vi.fn(),
  resumePausedGame: vi.fn(),
}));

import { PauseOverlay } from '../index';

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  act(() => {
    useGameStore.setState({
      ...(structuredClone(baseStoreState) as Partial<GameStoreState>),
      ...partialState,
    });
  });
}

describe('PauseOverlay', () => {
  beforeEach(() => {
    setMockStoreState({
      phase: 'paused',
      pauseOverlay: null,
    });
  });

  it('renders nothing when there is no pause overlay', () => {
    const { container } = render(<PauseOverlay />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the saving-before-close message when app shutdown is in progress', () => {
    setMockStoreState({
      pauseOverlay: {
        reason: 'window-close',
        isSavingBeforeClose: true,
      },
    });

    render(<PauseOverlay />);

    expect(screen.getByRole('heading', { name: /saving progress/i })).toBeInTheDocument();
    expect(screen.getByText(/saving data before closing/i)).toBeInTheDocument();
  });

  it('shows the default pause prompt and resumes or ends the game', () => {
    const resumeSpy = vi.mocked(resumePausedGame);
    const endSpy = vi.mocked(endGameEarly);
    resumeSpy.mockReset();
    endSpy.mockReset();

    setMockStoreState({
      pauseOverlay: {
        reason: 'escape',
        isSavingBeforeClose: false,
      },
    });

    render(<PauseOverlay />);

    expect(screen.getByRole('heading', { name: /game paused/i })).toBeInTheDocument();
    expect(screen.getByText(/game paused\. you can resume any time or end this game\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^resume$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^end game$/i }));

    expect(resumeSpy).toHaveBeenCalledTimes(1);
    expect(endSpy).toHaveBeenCalledWith({ closeApp: false });
  });

  it('shows the exit confirmation prompt and routes the actions to the desktop close flow', () => {
    const cancelSpy = vi.mocked(cancelElectronClose);
    const endSpy = vi.mocked(endGameEarly);
    cancelSpy.mockReset();
    endSpy.mockReset();

    setMockStoreState({
      pauseOverlay: {
        reason: 'window-close',
        isSavingBeforeClose: false,
      },
    });

    render(<PauseOverlay />);

    expect(screen.getByRole('heading', { name: /confirm exit/i })).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to end this game\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /keep playing/i }));
    fireEvent.click(screen.getByRole('button', { name: /end game and close/i }));

    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(endSpy).toHaveBeenCalledWith({ closeApp: true });
  });
});
