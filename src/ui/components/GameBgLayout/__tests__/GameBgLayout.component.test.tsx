import { render } from '@testing-library/react';

import { GameBgLayout } from '../index';

describe('GameBgLayout Component', () => {
  it('should render the city background layer', () => {
    const { container } = render(<GameBgLayout />);
    const cityBackgroundLayer = container.querySelector('.city-background-layer');

    expect(cityBackgroundLayer).toBeInTheDocument();
    expect(cityBackgroundLayer).toBeVisible();
  });

  it('should render a div for the background layer', () => {
    const { container } = render(<GameBgLayout />);
    const cityBackgroundLayer = container.querySelector('.city-background-layer');

    expect(cityBackgroundLayer?.tagName).toBe('DIV');
  });
});
