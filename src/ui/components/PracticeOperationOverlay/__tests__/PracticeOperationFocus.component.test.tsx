import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { at, makeRun } from '@store/selectors/__tests__/achievementTestUtils';
import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';

import i18n from '../../../../i18n/config';
import baseStoreState from '../../__mocks__/base-store-state.json';
import { PracticeOperationOverlay } from '..';

vi.mock('@game/scenes/UIScene', () => ({
  openScreenView: vi.fn(),
  startGame: vi.fn(),
}));

const featureFlagMocks = vi.hoisted(() => ({
  overrides: {} as Record<string, boolean>,
}));

vi.mock('@shared/featureFlags', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/featureFlags')>();

  return {
    ...actual,
    isFeatureEnabled: (flagName: string, fallbackValue?: boolean) => (
      featureFlagMocks.overrides[flagName] ?? actual.isFeatureEnabled(flagName, fallbackValue)
    ),
  };
});

const NOW = at(2026, 11, 12);

function seed(withFocus: boolean) {
  useGameStore.setState({
    ...(structuredClone(baseStoreState) as Partial<GameStoreState>),
    activeUsername: 'AcePilot',
    bootReady: true,
    phase: 'start',
    screenView: 'practice-select',
    profiles: {
      AcePilot: { username: 'AcePilot', password: '', bestScore: 0, highestStage: 1, preferredGrade: 'cadet', createdAt: 1, updatedAt: 1 },
    },
    gameHistoryByProfile: {
      AcePilot: withFocus ? [makeRun(at(2026, 11, 3), { mostProblematicOperation: '*' })] : [],
    },
  });
}

describe('PracticeOperationOverlay focus tag', () => {
  beforeEach(async () => {
    featureFlagMocks.overrides = {};
    await i18n.changeLanguage('en');
  });

  it('tags the focus operation', () => {
    seed(true);
    render(<PracticeOperationOverlay now={NOW} />);

    expect(within(screen.getByTestId('practice-operation-*')).getByTestId('practice-operation-focus')).toHaveTextContent('Focus');
    expect(screen.getAllByTestId('practice-operation-focus')).toHaveLength(1);
  });

  it('shows no tag without a focus', () => {
    seed(false);
    render(<PracticeOperationOverlay now={NOW} />);

    expect(screen.queryByTestId('practice-operation-focus')).not.toBeInTheDocument();
  });

  it('shows no tag when the achievements flag is off', () => {
    featureFlagMocks.overrides = { achievements: false };
    seed(true);
    render(<PracticeOperationOverlay now={NOW} />);

    expect(screen.queryByTestId('practice-operation-focus')).not.toBeInTheDocument();
  });

  it('renders the tag in Ukrainian', async () => {
    await i18n.changeLanguage('uk');
    seed(true);
    render(<PracticeOperationOverlay now={NOW} />);

    expect(screen.getByTestId('practice-operation-focus')).toHaveTextContent('Фокус');
  });
});
