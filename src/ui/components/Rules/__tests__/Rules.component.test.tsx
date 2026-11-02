import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore } from '@store/useGameStore';

import i18n from '../../../../i18n/config';

import { RulesOverlay } from '..';

const featureFlagMocks = vi.hoisted(() => ({
  isFeatureEnabled: vi.fn<(flagName: string) => boolean>(),
}));

vi.mock('@shared/featureFlags', () => ({
  isFeatureEnabled: featureFlagMocks.isFeatureEnabled,
}));

function renderRules(isMobileDevice = false) {
  useGameStore.setState({ isMobileDevice });
  return render(<RulesOverlay />);
}

describe('RulesOverlay', () => {
  beforeEach(async () => {
    featureFlagMocks.isFeatureEnabled.mockReset();
    featureFlagMocks.isFeatureEnabled.mockReturnValue(true);
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    useGameStore.setState({ isMobileDevice: false });
  });

  it('describes both game modes, lives, shield, and the extra life reward', () => {
    renderRules();

    expect(screen.getByRole('heading', { level: 1, name: /rules/i })).toBeInTheDocument();
    expect(within(screen.getByTestId('rules-section-regular-play')).getByText(/across 28 stages/i)).toBeInTheDocument();
    expect(within(screen.getByTestId('rules-section-practice-mode')).getByText(/no stage limit/i)).toBeInTheDocument();
    expect(screen.getByText(/you start with 3 lives/i)).toBeInTheDocument();
    expect(screen.getByText(/absorbs 5 meteor hits per stage/i)).toBeInTheDocument();
    expect(screen.getByText(/regular play only: answer 30 meteors correctly in a row/i)).toBeInTheDocument();
  });

  it('explains every HUD value', () => {
    renderRules();

    const hudSection = within(screen.getByTestId('rules-section-hud'));

    for (const label of ['Score', 'Stage', 'Base Shield', 'Lives', 'Streak', 'Answer']) {
      expect(hudSection.getByText(label, { selector: 'dt' })).toBeInTheDocument();
    }
  });

  it('shows desktop controls only on desktop devices', () => {
    renderRules(false);

    expect(screen.getByTestId('rules-overlay')).toHaveAttribute('data-device', 'desktop');
    expect(screen.getByText(/type answers with the number keys/i)).toBeInTheDocument();
    expect(screen.getByText(/press esc to pause/i)).toBeInTheDocument();
    expect(screen.queryByText(/on-screen keypad/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tap anywhere on the game area/i)).not.toBeInTheDocument();
  });

  it('shows mobile controls only on mobile devices', () => {
    renderRules(true);

    expect(screen.getByTestId('rules-overlay')).toHaveAttribute('data-device', 'mobile');
    expect(screen.getByText(/on-screen keypad/i)).toBeInTheDocument();
    expect(screen.getByText(/tap anywhere on the game area to pause/i)).toBeInTheDocument();
    expect(screen.queryByText(/type answers with the number keys/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/press esc to pause/i)).not.toBeInTheDocument();
  });

  it('hides the extra life section when the streak reward is disabled', () => {
    featureFlagMocks.isFeatureEnabled.mockImplementation((flagName) => flagName !== 'streak_reward');

    renderRules();

    expect(screen.queryByTestId('rules-section-extra-life')).not.toBeInTheDocument();
  });

  it('renders translated rules in Ukrainian', async () => {
    await i18n.changeLanguage('uk');

    renderRules(true);

    expect(screen.getByRole('heading', { level: 1, name: /правила/i })).toBeInTheDocument();
    expect(screen.getByText(/торкніться ігрового поля/i)).toBeInTheDocument();
  });
});
