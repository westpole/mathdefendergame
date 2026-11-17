import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_AVATAR_ID } from '@shared/avatarCatalog';
import { at, makeRun, mondayWeeksBefore } from '@store/selectors/__tests__/achievementTestUtils';
import { useGameStore } from '@store/useGameStore';
import type { GameStoreState, PlayerProfile } from '@store/types';

import i18n from '../../../../i18n/config';
import { SettingsOverlay } from '..';
import profileMenuStore from '../../__mocks__/profile-menu-store.json';

// Some tests swap in a failing action; every reset restores the real one.
const { setWeeklyScoreGoal: realSetWeeklyScoreGoal } = useGameStore.getState();

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  useGameStore.setState({
    ...(structuredClone(profileMenuStore) as Partial<GameStoreState>),
    setWeeklyScoreGoal: realSetWeeklyScoreGoal,
    ...partialState,
  });
}

function withProfile(overrides: Partial<PlayerProfile>): Partial<GameStoreState> {
  const base = structuredClone(profileMenuStore) as Partial<GameStoreState>;
  return { profiles: { AcePilot: { ...(base.profiles?.AcePilot as PlayerProfile), ...overrides } } };
}

function chooseGoal(label: string) {
  fireEvent.click(screen.getByRole('button', { name: /weekly goal/i }));
  fireEvent.click(screen.getByRole('option', { name: label }));
}

describe('SettingsOverlay', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    setMockStoreState();
  });

  it('uses default avatar as selected when profile does not have one yet', () => {
    render(<SettingsOverlay />);

    expect(screen.getByTestId(`settings-avatar-option-${DEFAULT_AVATAR_ID}`)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('settings-save-avatar-button')).toBeDisabled();
  });

  it('selects an avatar and saves it to the active profile', () => {
    render(<SettingsOverlay />);

    fireEvent.click(screen.getByTestId('settings-avatar-option-avatar-3'));
    expect(screen.getByTestId('settings-avatar-option-avatar-3')).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByTestId('settings-save-avatar-button'));

    expect(useGameStore.getState().profiles.AcePilot.avatarId).toBe('avatar-3');
    expect(screen.getByTestId('settings-save-avatar-button')).toBeDisabled();
  });

  describe('weekly goal', () => {
    it('offers Off and the presets with helper text, Off selected by default', () => {
      render(<SettingsOverlay />);

      expect(screen.getByRole('heading', { name: 'Weekly goal' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /weekly goal/i })).toHaveTextContent('Off');
      expect(screen.getAllByRole('option', { hidden: true }).map((option) => option.textContent)).toEqual([
        'Off', '500', '1,000', '2,500', '5,000',
      ]);
      expect(screen.getByText('Only runs with 85% accuracy or higher count. Up to 40% of the goal counts each day.')).toBeInTheDocument();
    });

    it('enables Save when only the goal changes and saves it', () => {
      render(<SettingsOverlay />);

      chooseGoal('1,000');
      expect(screen.getByTestId('settings-save-avatar-button')).toBeEnabled();

      fireEvent.click(screen.getByTestId('settings-save-avatar-button'));

      expect(useGameStore.getState().profiles.AcePilot.weeklyScoreGoal).toBe(1000);
      expect(useGameStore.getState().profiles.AcePilot.avatarId).toBeUndefined();
      expect(screen.getByTestId('settings-save-avatar-button')).toBeDisabled();
    });

    it('clears the goal when Off is saved', () => {
      setMockStoreState(withProfile({ weeklyScoreGoal: 2500 }));
      render(<SettingsOverlay />);

      expect(screen.getByRole('button', { name: /weekly goal/i })).toHaveTextContent('2,500');
      chooseGoal('Off');
      fireEvent.click(screen.getByTestId('settings-save-avatar-button'));

      expect(useGameStore.getState().profiles.AcePilot).not.toHaveProperty('weeklyScoreGoal');
    });

    it('saves the avatar and the goal together', () => {
      render(<SettingsOverlay />);

      fireEvent.click(screen.getByTestId('settings-avatar-option-avatar-2'));
      chooseGoal('500');
      fireEvent.click(screen.getByTestId('settings-save-avatar-button'));

      expect(useGameStore.getState().profiles.AcePilot.avatarId).toBe('avatar-2');
      expect(useGameStore.getState().profiles.AcePilot.weeklyScoreGoal).toBe(500);
    });

    it('keeps Save disabled when the goal is changed back to the saved value', () => {
      render(<SettingsOverlay />);

      chooseGoal('500');
      chooseGoal('Off');

      expect(screen.getByTestId('settings-save-avatar-button')).toBeDisabled();
    });

    it('shows a saved goal that is not a preset', () => {
      setMockStoreState(withProfile({ weeklyScoreGoal: 900 }));
      render(<SettingsOverlay />);

      expect(screen.getByRole('button', { name: /weekly goal/i })).toHaveTextContent('900');
    });

    it('shows an error when the goal cannot be saved', () => {
      const setWeeklyScoreGoal = vi.fn(() => ({ success: false }));
      setMockStoreState({ setWeeklyScoreGoal });
      render(<SettingsOverlay />);

      chooseGoal('500');
      fireEvent.click(screen.getByTestId('settings-save-avatar-button'));

      expect(screen.getByRole('alert')).toHaveTextContent('Could not save the weekly goal.');
    });

    it('keeps the saved avatar and the goal draft when only the goal fails', () => {
      const setWeeklyScoreGoal = vi.fn(() => ({ success: false, error: 'Nope.' }));
      setMockStoreState({ setWeeklyScoreGoal });
      render(<SettingsOverlay />);

      fireEvent.click(screen.getByTestId('settings-avatar-option-avatar-2'));
      chooseGoal('500');
      fireEvent.click(screen.getByTestId('settings-save-avatar-button'));

      expect(useGameStore.getState().profiles.AcePilot.avatarId).toBe('avatar-2');
      expect(screen.getByRole('alert')).toHaveTextContent('Nope.');
      expect(screen.getByRole('button', { name: /weekly goal/i })).toHaveTextContent('500');
      expect(screen.getByTestId('settings-save-avatar-button')).toBeEnabled();
    });

    describe('suggested goal', () => {
      beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(at(2026, 11, 12));
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      const historyWithBaseline = (score: number) => [1, 2, 3, 4].map((weeksBack) => makeRun(
        mondayWeeksBefore(at(2026, 11, 9), weeksBack),
        { finalScore: score, correctAnswers: 17, incorrectAnswers: 3 },
      ));

      it('offers Suggested (900) for a baseline of 800 and saves the number', () => {
        setMockStoreState({ gameHistoryByProfile: { AcePilot: historyWithBaseline(800) } });
        render(<SettingsOverlay />);

        chooseGoal('Suggested (900)');
        fireEvent.click(screen.getByTestId('settings-save-avatar-button'));

        expect(useGameStore.getState().profiles.AcePilot.weeklyScoreGoal).toBe(900);
      });

      it('hides Suggested with fewer than 2 complete weeks', () => {
        setMockStoreState({ gameHistoryByProfile: { AcePilot: historyWithBaseline(800).slice(0, 1).map((entry) => ({ ...entry, playedAt: mondayWeeksBefore(at(2026, 11, 9), 1) })) } });
        render(<SettingsOverlay />);

        expect(screen.queryByRole('option', { name: /suggested/i, hidden: true })).not.toBeInTheDocument();
      });

      it('hides Suggested when it equals the saved goal', () => {
        setMockStoreState({ ...withProfile({ weeklyScoreGoal: 900 }), gameHistoryByProfile: { AcePilot: historyWithBaseline(800) } });
        render(<SettingsOverlay />);

        expect(screen.getByRole('button', { name: /weekly goal/i })).toHaveTextContent('900');
        expect(screen.queryByRole('option', { name: /suggested/i, hidden: true })).not.toBeInTheDocument();
      });
    });

    it('shows a hint instead of the goal select for guests', () => {
      setMockStoreState({ activeUsername: null });
      render(<SettingsOverlay />);

      expect(screen.getByTestId('settings-goal-guest-hint')).toHaveTextContent('Create a profile to set a goal');
      expect(screen.queryByRole('button', { name: /weekly goal/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/Only runs with 85% accuracy/)).not.toBeInTheDocument();
    });

    it('renders the goal section in Ukrainian', async () => {
      await i18n.changeLanguage('uk');
      render(<SettingsOverlay />);

      expect(screen.getByRole('heading', { name: 'Тижнева ціль' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /тижнева ціль/i })).toHaveTextContent('Вимкнено');
    });
  });
});
