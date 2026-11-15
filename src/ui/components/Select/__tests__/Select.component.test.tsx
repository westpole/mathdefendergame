import { fireEvent, render, screen } from '@testing-library/react';

import { Select, type SelectOption } from '..';

const options: SelectOption[] = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'bravo', label: 'Bravo' },
  { value: 'charlie', label: 'Charlie' },
];

function renderSelect(props: Partial<Parameters<typeof Select>[0]> = {}) {
  const onChange = vi.fn();

  render(
    <>
      <span id="select-label">Pilot</span>
      <Select id="pilot" labelId="select-label" onChange={onChange} options={options} placeholder="Choose" value="" {...props} />
    </>,
  );

  return { onChange };
}

describe('Select', () => {
  it('shows the placeholder when nothing is selected and the label of the selected value otherwise', () => {
    const { unmount } = render(
      <Select id="a" labelId="l" onChange={vi.fn()} options={options} placeholder="Choose" value="" />,
    );
    expect(screen.getByText('Choose')).toHaveClass('custom-select__placeholder');
    unmount();

    render(<Select id="b" labelId="l" onChange={vi.fn()} options={options} placeholder="Choose" value="bravo" />);
    expect(screen.getByText('Bravo')).not.toHaveClass('custom-select__placeholder');
  });

  it('opens on click and reports the clicked option', () => {
    const { onChange } = renderSelect();
    const trigger = screen.getByRole('button', { name: /pilot/i });

    expect(screen.getByRole('listbox', { hidden: true })).not.toBeVisible();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('option', { name: 'Charlie' }));
    expect(onChange).toHaveBeenCalledWith('charlie');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('starts on the selected option and wraps keyboard navigation', () => {
    const { onChange } = renderSelect({ value: 'charlie' });
    const trigger = screen.getByRole('button', { name: /pilot/i });

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('option', { name: 'Charlie' })).toHaveClass('is-active');

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('option', { name: 'Alpha' })).toHaveClass('is-active');

    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowUp' });
    expect(screen.getByRole('option', { name: 'Charlie' })).toHaveClass('is-active');

    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('charlie');
  });

  it('closes on Escape and on outside click without changing the value', () => {
    const { onChange } = renderSelect();
    const trigger = screen.getByRole('button', { name: /pilot/i });

    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not open when there are no options', () => {
    renderSelect({ options: [] });
    const trigger = screen.getByRole('button', { name: /pilot/i });

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
