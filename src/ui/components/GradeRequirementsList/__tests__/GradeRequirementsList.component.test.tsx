import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import i18n from '../../../../i18n/config';
import { GradeRequirementsList } from '..';

describe('GradeRequirementsList', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders one row per operation with current / required and a checkmark when met', () => {
    render(
      <GradeRequirementsList
        grade="cadet"
        label="Grade requirements by operation"
        operations={[
          { op: '+', current: 800, required: 750 },
          { op: '-', current: 150, required: 550 },
        ]}
      />,
    );

    const list = screen.getByRole('list', { name: 'Grade requirements by operation' });
    const addition = within(list).getByTestId('grade-requirement-addition');
    const subtraction = within(list).getByTestId('grade-requirement-subtraction');

    expect(within(addition).getByText('800 / 750')).toBeInTheDocument();
    expect(within(addition).getByRole('img', { name: 'Requirement met' })).toBeInTheDocument();
    expect(addition).toHaveClass('grade-requirement--met');
    expect(within(subtraction).getByText('150 / 550')).toBeInTheDocument();
    expect(within(subtraction).queryByRole('img', { name: 'Requirement met' })).not.toBeInTheDocument();
    expect(within(subtraction).getByLabelText('Subtraction (-)')).toBeInTheDocument();
  });

  it('caps the bar at 100% and uses the grade color', () => {
    render(
      <GradeRequirementsList
        grade="commander"
        label="Grade requirements by operation"
        operations={[
          { op: '*', current: 500, required: 250 },
          { op: '/', current: 50, required: 250 },
        ]}
      />,
    );

    const fills = document.querySelectorAll<HTMLElement>('.profile-progress-fill--commander');

    expect(fills).toHaveLength(2);
    expect(fills[0].style.width).toBe('100%');
    expect(fills[1].style.width).toBe('20%');
  });

  it('renders an empty list when there are no requirements', () => {
    render(<GradeRequirementsList grade="trainee" label="Grade requirements by operation" operations={[]} />);

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
