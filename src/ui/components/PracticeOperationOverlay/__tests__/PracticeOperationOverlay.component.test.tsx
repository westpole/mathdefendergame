import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PracticeOperation } from '@shared/types';
import { useGameStore } from '@store/useGameStore';
import type { GameStoreState, PlayerProfile } from '@store/types';

import { PracticeOperationOverlay } from '..';
import baseStoreState from '../../__mocks__/base-store-state.json';

const uiSceneMocks = vi.hoisted(() => ({
  openScreenView: vi.fn(),
  startGame: vi.fn(),
}));

vi.mock('@game/scenes/UIScene', () => ({
  openScreenView: uiSceneMocks.openScreenView,
  startGame: uiSceneMocks.startGame,
}));

function buildProfile(lastPracticeOperation?: PracticeOperation): PlayerProfile {
  return {
    username: 'AcePilot',
    password: '',
    bestScore: 0,
    highestStage: 1,
    preferredGrade: 'cadet',
    createdAt: 1_000,
    updatedAt: 1_000,
    ...(lastPracticeOperation && { lastPracticeOperation }),
  };
}

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  useGameStore.setState({
    ...(structuredClone(baseStoreState) as Partial<GameStoreState>),
    activeUsername: 'AcePilot',
    bootReady: true,
    phase: 'start',
    screenView: 'practice-select',
    profiles: { AcePilot: buildProfile() },
    ...partialState,
  });
}

describe('PracticeOperationOverlay', () => {
  beforeEach(() => {
    uiSceneMocks.startGame.mockReset();
    uiSceneMocks.openScreenView.mockReset();
  });

  it('renders the title, hint, and one option per math operation', () => {
    setMockStoreState();

    render(<PracticeOperationOverlay />);

    expect(screen.getByTestId('practice-select-overlay')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Choose Practice Operation' })).toBeVisible();
    expect(screen.getByText(/The drill starts right away/i)).toBeVisible();

    const group = screen.getByRole('group', { name: 'Practice operation selector' });
    expect(within(group).getAllByRole('button')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /Addition \(\+\)/ })).toBe(screen.getByTestId('practice-operation-+'));
    expect(screen.getByRole('button', { name: /Subtraction \(-\)/ })).toBe(screen.getByTestId('practice-operation--'));
    expect(screen.getByRole('button', { name: /Multiplication \(\*\)/ })).toBe(screen.getByTestId('practice-operation-*'));
    expect(screen.getByRole('button', { name: /Division \(\/\)/ })).toBe(screen.getByTestId('practice-operation-/'));
  });

  it("marks only the active profile's last practiced operation with a text badge", () => {
    setMockStoreState({ profiles: { AcePilot: buildProfile('*') } });

    render(<PracticeOperationOverlay />);

    const lastOption = screen.getByTestId('practice-operation-*');

    expect(lastOption).toHaveClass('practice-select-option--last');
    expect(within(lastOption).getByTestId('practice-operation-last')).toHaveTextContent('Last practiced');
    expect(screen.getAllByTestId('practice-operation-last')).toHaveLength(1);
    expect(screen.getByTestId('practice-operation-+')).not.toHaveClass('practice-select-option--last');
  });

  it('shows no badge for a profile that has never practiced, ignoring the session practiceOperation', () => {
    setMockStoreState({ practiceOperation: '/', profiles: { AcePilot: buildProfile() } });

    render(<PracticeOperationOverlay />);

    expect(screen.queryByTestId('practice-operation-last')).not.toBeInTheDocument();
  });

  it('shows no badge when no profile is active', () => {
    setMockStoreState({ activeUsername: null, profiles: { AcePilot: buildProfile('-') } });

    render(<PracticeOperationOverlay />);

    expect(screen.queryByTestId('practice-operation-last')).not.toBeInTheDocument();
  });

  it.each(['+', '-', '*', '/'] as const)('starts a practice run with the %s operation when it is picked', async (operation) => {
    setMockStoreState();

    render(<PracticeOperationOverlay />);
    fireEvent.click(screen.getByTestId(`practice-operation-${operation}`));

    await waitFor(() => {
      expect(uiSceneMocks.startGame).toHaveBeenCalledWith({ mode: 'practice', practiceOperation: operation });
    });
    expect(uiSceneMocks.startGame).toHaveBeenCalledTimes(1);
  });

  it('starts only one run when options are clicked repeatedly, and disables the selector', async () => {
    setMockStoreState();

    render(<PracticeOperationOverlay />);
    fireEvent.click(screen.getByTestId('practice-operation-*'));
    fireEvent.click(screen.getByTestId('practice-operation-*'));
    fireEvent.click(screen.getByTestId('practice-operation-+'));

    await waitFor(() => {
      expect(uiSceneMocks.startGame).toHaveBeenCalledTimes(1);
    });
    expect(uiSceneMocks.startGame).toHaveBeenCalledWith({ mode: 'practice', practiceOperation: '*' });
    expect(screen.getByTestId('practice-operation-+')).toBeDisabled();
    expect(screen.getByTestId('practice-select-back')).toBeDisabled();
  });

  it('returns to the home screen through UIScene without starting a run when Back to Home is clicked', async () => {
    setMockStoreState();

    render(<PracticeOperationOverlay />);
    const backButton = screen.getByRole('button', { name: 'Back to Home' });
    expect(backButton).toBe(screen.getByTestId('practice-select-back'));
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(uiSceneMocks.openScreenView).toHaveBeenCalledWith('home');
    });
    expect(uiSceneMocks.startGame).not.toHaveBeenCalled();
  });
});
