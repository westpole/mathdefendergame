import { fireEvent, render, screen } from '@testing-library/react';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/useGameStore';

import { LoginOverlay } from '../index';

import baseStoreState from '../../__mocks__/base-store-state.json';

function setMockStoreState(partialState: Partial<GameStoreState> = {}) {
  useGameStore.setState({
    ...(structuredClone(baseStoreState) as Partial<GameStoreState>),
    ...partialState,
  });
}

describe('LoginOverlay', () => {
  beforeEach(() => {
    setMockStoreState({ bootReady: true, phase: 'login', rememberedUsername: null });
  });

  it('shows login state by default with keep me logged in option', () => {
    render(<LoginOverlay />);

    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create profile/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/keep me logged in/i)).toBeInTheDocument();
    expect(screen.getByText(/login with your existing profile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toHaveFocus();
  });

  it('shows suggestion to create profile when username does not exist', () => {
    render(<LoginOverlay />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'UnknownPilot' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Abc12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/username not found/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/create profile/i);
  });

  it('switches to create profile and returns to login on cancel', () => {
    render(<LoginOverlay />);

    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

    expect(screen.getByRole('button', { name: /^create$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/verify password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/keep me logged in/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/keep me logged in/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/verify password/i)).not.toBeInTheDocument();
  });

  it('shows validation error when verify password does not match', () => {
    render(<LoginOverlay />);

    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

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
  });

  it('creates profile from create profile state when form is valid', () => {
    render(<LoginOverlay />);

    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

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

    const state = useGameStore.getState();
    expect(state.phase).toBe('start');
    expect(state.activeUsername).toBe('AcePilot');
    expect(state.rememberedUsername).toBeNull();
  });

  it('logs in with keep me logged in enabled', () => {
    useGameStore.getState().createAndLoginProfile('AcePilot', 'Abc12345');
    useGameStore.setState({
      phase: 'login',
      activeUsername: null,
      rememberedUsername: null,
    });

    render(<LoginOverlay />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'AcePilot' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Abc12345' },
    });
    fireEvent.click(screen.getByLabelText(/keep me logged in/i));
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

    const state = useGameStore.getState();
    expect(state.phase).toBe('start');
    expect(state.activeUsername).toBe('AcePilot');
    expect(state.rememberedUsername).toBe('AcePilot');
  });
});
