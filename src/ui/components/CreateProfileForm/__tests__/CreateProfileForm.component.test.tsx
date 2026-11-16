import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';

import baseStoreState from '@ui/components/__mocks__/base-store-state.json';

import { CreateProfileForm } from '../index';

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  useGameStore.setState({
    ...(structuredClone(baseStoreState) as Partial<GameStoreState>),
    ...partialState,
  });
}

describe('CreateProfileForm', () => {
  beforeEach(() => {
    setMockStoreState({
      bootReady: true,
      phase: 'login',
      activeUsername: null,
      rememberedUsername: null,
      profiles: {},
      gameHistoryByProfile: {},
    });
  });

  it('renders only the username field, focuses it, and calls cancel when provided', () => {
    const onCancel = vi.fn();

    render(<CreateProfileForm onCancel={onCancel} />);

    expect(screen.getByLabelText(/username/i)).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('surfaces store errors and clears them after a successful retry', () => {
    const createProfileSpy = vi.fn<GameStoreState['createAndLoginSimpleProfile']>()
      .mockReturnValueOnce({
        success: false,
        error: 'Username already exists. Pick a different username.',
      })
      .mockReturnValueOnce({ success: true });

    useGameStore.setState({ createAndLoginSimpleProfile: createProfileSpy });

    render(<CreateProfileForm />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'AcePilot' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/username already exists/i);

    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    expect(createProfileSpy).toHaveBeenNthCalledWith(2, 'AcePilot');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('creates a profile from the username', () => {
    const createSimpleProfileSpy = vi.fn<GameStoreState['createAndLoginSimpleProfile']>().mockReturnValue({ success: true });

    useGameStore.setState({ createAndLoginSimpleProfile: createSimpleProfileSpy });

    render(<CreateProfileForm />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'GuestPilot' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    expect(createSimpleProfileSpy).toHaveBeenCalledWith('GuestPilot');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the default error message when profile creation fails without a store error', () => {
    const createSimpleProfileSpy = vi.fn<GameStoreState['createAndLoginSimpleProfile']>().mockReturnValue({
      success: false,
    });

    useGameStore.setState({ createAndLoginSimpleProfile: createSimpleProfileSpy });

    render(<CreateProfileForm />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'GuestPilot' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/profile creation failed/i);
  });
});
