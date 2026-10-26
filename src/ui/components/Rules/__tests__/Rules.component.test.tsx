import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import i18n from '../../../../i18n/config';

import { RulesOverlay } from '..';

describe('RulesOverlay', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('shows the current rules for the live gameplay loop', () => {
    render(<RulesOverlay />);

    expect(screen.getByRole('heading', { name: /rules/i })).toBeInTheDocument();
    expect(screen.getByText(/type the answer and press enter/i)).toBeInTheDocument();
    expect(screen.getByText(/you begin with 3 lives/i)).toBeInTheDocument();
    expect(screen.getByText(/5 shield points before a life is lost/i)).toBeInTheDocument();
    expect(screen.getByText(/reach 30 correct answers in a row to earn 1 extra life/i)).toBeInTheDocument();
    expect(screen.getByText(/clear 28 stages to win/i)).toBeInTheDocument();
  });

  it('renders translated rules in Ukrainian', async () => {
    await i18n.changeLanguage('uk');

    render(<RulesOverlay />);

    expect(screen.getByRole('heading', { name: /правила/i })).toBeInTheDocument();
    expect(screen.getByText(/введіть відповідь і натисніть enter/i)).toBeInTheDocument();
  });
});
