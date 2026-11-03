import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useGameStore } from '@store/useGameStore';
import type { GradeNotice } from '@shared/types';

import i18n from '../../../../i18n/config';
import { GradeNoticeOverlay } from '..';

const promotedNotice: GradeNotice = { kind: 'promoted', fromGrade: 'trainee', toGrade: 'cadet', operations: [] };
const demotedNotice: GradeNotice = {
  kind: 'demoted',
  fromGrade: 'commander',
  toGrade: 'cadet',
  operations: [
    { op: '-', current: 549, required: 550 },
    { op: '*', current: 240, required: 250 },
  ],
};

describe('GradeNoticeOverlay', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    useGameStore.setState({ gradeNotice: null });
  });

  it('renders nothing when there is no notice', () => {
    render(<GradeNoticeOverlay />);

    expect(screen.queryByTestId('grade-notice-overlay')).not.toBeInTheDocument();
  });

  it('shows the new grade for a promotion without operation rows', () => {
    useGameStore.setState({ gradeNotice: promotedNotice });

    render(<GradeNoticeOverlay />);

    expect(screen.getByRole('dialog', { name: 'PROMOTED' })).toBeInTheDocument();
    expect(screen.getByTestId('grade-notice-grade')).toHaveTextContent('Cadet');
    expect(screen.getByText('Your skills earned you the Cadet grade.')).toBeInTheDocument();
    expect(screen.queryByTestId('grade-requirements')).not.toBeInTheDocument();
  });

  it('lists the operations that fell short for a demotion', () => {
    useGameStore.setState({ gradeNotice: demotedNotice });

    render(<GradeNoticeOverlay />);

    expect(screen.getByRole('dialog', { name: 'DEMOTED' })).toBeInTheDocument();
    expect(screen.getByTestId('grade-notice-grade')).toHaveTextContent('Cadet');
    expect(screen.getByText('These scores fell below the Commander requirements:')).toBeInTheDocument();
    expect(within(screen.getByTestId('grade-requirement-subtraction')).getByText('549 / 550')).toBeInTheDocument();
    expect(within(screen.getByTestId('grade-requirement-multiplication')).getByText('240 / 250')).toBeInTheDocument();
  });

  it('dismisses with the button', () => {
    useGameStore.setState({ gradeNotice: promotedNotice });
    render(<GradeNoticeOverlay />);

    fireEvent.click(screen.getByTestId('grade-notice-dismiss'));

    expect(useGameStore.getState().gradeNotice).toBeNull();
    expect(screen.queryByTestId('grade-notice-overlay')).not.toBeInTheDocument();
  });

  it.each(['Escape', 'Enter'])('dismisses with the %s key', (key) => {
    useGameStore.setState({ gradeNotice: demotedNotice });
    render(<GradeNoticeOverlay />);

    fireEvent.keyDown(window, { key });

    expect(useGameStore.getState().gradeNotice).toBeNull();
  });

  it('ignores other keys', () => {
    useGameStore.setState({ gradeNotice: promotedNotice });
    render(<GradeNoticeOverlay />);

    fireEvent.keyDown(window, { key: 'a' });

    expect(useGameStore.getState().gradeNotice).toEqual(promotedNotice);
  });
});
