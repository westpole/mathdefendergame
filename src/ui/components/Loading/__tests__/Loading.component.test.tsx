/**
 * React component test example
 * Uses React Testing Library for DOM testing
 */

import { render, screen } from '@testing-library/react';
import { Loading } from '../index';

describe('Loading Component', () => {
  it('should render loading message', () => {
    render(<Loading />);
    const loadingElement = screen.getByText(/loading/i);
    expect(loadingElement).toBeInTheDocument();
  });

  it('should have correct CSS class', () => {
    const { container } = render(<Loading />);
    const loadingDiv = container.firstChild;
    expect(loadingDiv).toHaveClass('overlay-screen');
  });

  it('should be visible in the document', () => {
    const { container } = render(<Loading />);
    expect(container.firstChild).toBeVisible();
  });
});
