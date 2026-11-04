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

  it('treats a score exactly at the requirement as met with a full bar', () => {
    render(
      <GradeRequirementsList
        grade="cadet"
        label="Grade requirements by operation"
        operations={[{ op: '-', current: 150, required: 150 }]}
      />,
    );

    const row = screen.getByTestId('grade-requirement-subtraction');

    expect(row).toHaveClass('grade-requirement--met');
    expect(within(row).getByRole('img', { name: 'Requirement met' })).toBeInTheDocument();
    expect(row.querySelector<HTMLElement>('.profile-progress-fill')?.style.width).toBe('100%');
  });

  it('shows an empty bar and no checkmark at zero progress', () => {
    render(
      <GradeRequirementsList
        grade="trainee"
        label="Grade requirements by operation"
        operations={[{ op: '+', current: 0, required: 250 }]}
      />,
    );

    const row = screen.getByTestId('grade-requirement-addition');

    expect(within(row).getByText('0 / 250')).toBeInTheDocument();
    expect(row).not.toHaveClass('grade-requirement--met');
    expect(row.querySelector<HTMLElement>('.profile-progress-fill')?.style.width).toBe('0%');
  });

  it('shows a full bar instead of dividing by zero when nothing is required', () => {
    render(
      <GradeRequirementsList
        grade="trainee"
        label="Grade requirements by operation"
        operations={[{ op: '/', current: 0, required: 0 }]}
      />,
    );

    const row = screen.getByTestId('grade-requirement-division');

    expect(row).toHaveClass('grade-requirement--met');
    expect(row.querySelector<HTMLElement>('.profile-progress-fill')?.style.width).toBe('100%');
  });

  it('formats large values with locale separators and names each operation', () => {
    render(
      <GradeRequirementsList
        grade="major-general"
        label="Grade requirements by operation"
        operations={[
          { op: '+', current: 1420, required: 1250 },
          { op: '*', current: 731, required: 550 },
        ]}
      />,
    );

    const addition = screen.getByTestId('grade-requirement-addition');

    expect(within(addition).getByText(`${(1420).toLocaleString()} / ${(1250).toLocaleString()}`)).toBeInTheDocument();
    expect(within(addition).getByLabelText('Addition (+)')).toBeInTheDocument();
    expect(within(screen.getByTestId('grade-requirement-multiplication')).getByLabelText('Multiplication (*)')).toBeInTheDocument();
  });

  it('renders an empty list when there are no requirements', () => {
    render(<GradeRequirementsList grade="trainee" label="Grade requirements by operation" operations={[]} />);

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
