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

  it('renders username and password fields in full mode and focuses the username input', () => {
    render(<CreateProfileForm simpleMode={false} />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/verify password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toHaveFocus();
  });

  it('renders the simplified form and calls cancel when provided', () => {
    const onCancel = vi.fn();

    render(<CreateProfileForm onCancel={onCancel} simpleMode />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/verify password/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('requires verify password before submitting in full mode', () => {
    const createProfileSpy = vi.fn<GameStoreState['createAndLoginProfile']>().mockReturnValue({ success: true });

    useGameStore.setState({ createAndLoginProfile: createProfileSpy });

    render(<CreateProfileForm simpleMode={false} />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'AcePilot' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Abc12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/please verify your password/i);
    expect(createProfileSpy).not.toHaveBeenCalled();
  });

  it('shows a mismatch error when password confirmation does not match', () => {
    const createProfileSpy = vi.fn<GameStoreState['createAndLoginProfile']>().mockReturnValue({ success: true });

    useGameStore.setState({ createAndLoginProfile: createProfileSpy });

    render(<CreateProfileForm simpleMode={false} />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'AcePilot' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Abc12345' },
    });
    fireEvent.change(screen.getByLabelText(/verify password/i), {
      target: { value: 'Abc12344' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/must match/i);
    expect(createProfileSpy).not.toHaveBeenCalled();
  });

  it('surfaces store errors and clears them after a successful retry', () => {
    const createProfileSpy = vi.fn<GameStoreState['createAndLoginProfile']>()
      .mockReturnValueOnce({
        success: false,
        error: 'Username already exists. Pick a different username.',
      })
      .mockReturnValueOnce({ success: true });

    useGameStore.setState({ createAndLoginProfile: createProfileSpy });

    render(<CreateProfileForm simpleMode={false} />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'AcePilot' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Abc12345' },
    });
    fireEvent.change(screen.getByLabelText(/verify password/i), {
      target: { value: 'Abc12345' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/username already exists/i);
    expect(createProfileSpy).toHaveBeenNthCalledWith(1, 'AcePilot', 'Abc12345', false);

    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    expect(createProfileSpy).toHaveBeenNthCalledWith(2, 'AcePilot', 'Abc12345', false);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('creates a simple profile without password fields', () => {
    const createSimpleProfileSpy = vi.fn<GameStoreState['createAndLoginSimpleProfile']>().mockReturnValue({ success: true });

    useGameStore.setState({ createAndLoginSimpleProfile: createSimpleProfileSpy });

    render(<CreateProfileForm simpleMode />);

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

    render(<CreateProfileForm simpleMode />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'GuestPilot' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/profile creation failed/i);
  });
});
