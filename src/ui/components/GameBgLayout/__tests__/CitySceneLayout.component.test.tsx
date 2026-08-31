import { render } from '@testing-library/react';

import { CitySceneLayout } from '../index';

describe('CitySceneLayout Component', () => {
  it('should render the city background layer', () => {
    const { container } = render(<CitySceneLayout />);
    const cityBackgroundLayer = container.querySelector('.city-background-layer');

    expect(cityBackgroundLayer).toBeInTheDocument();
    expect(cityBackgroundLayer).toBeVisible();
  });

  it('should render a div for the background layer', () => {
    const { container } = render(<CitySceneLayout />);
    const cityBackgroundLayer = container.querySelector('.city-background-layer');

    expect(cityBackgroundLayer?.tagName).toBe('DIV');
  });
});
