import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RulesOverlay } from '..';

describe('RulesOverlay', () => {
  it('shows the current rules for the live gameplay loop', () => {
    render(<RulesOverlay />);

    expect(screen.getByRole('heading', { name: /rules/i })).toBeInTheDocument();
    expect(screen.getByText(/type the answer and press enter/i)).toBeInTheDocument();
    expect(screen.getByText(/you begin with 3 lives/i)).toBeInTheDocument();
    expect(screen.getByText(/5 shield points before a life is lost/i)).toBeInTheDocument();
    expect(screen.getByText(/perfect stages award an extra life/i)).toBeInTheDocument();
    expect(screen.getByText(/clear 28 stages to win/i)).toBeInTheDocument();
  });
});
