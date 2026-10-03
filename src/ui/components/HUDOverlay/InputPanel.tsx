import {
  appendAnswerInputCharacter,
  removeAnswerInputCharacter,
  submitAnswerInput,
} from '@game/scenes/UIScene';

const mobileKeypadValues = ['7', '8', '9', 'Enter', '4', '5', '6', 'Delete', '1', '2', '3', '0'];

function EnterButton() {
  return (
    <button
      aria-label="Submit answer"
      className="mobile-input-panel__key mobile-input-panel__key--primary"
      onClick={submitAnswerInput}
      type="button"
    >
      Enter
    </button>
  );
}

function DeleteButton() {
  return (
    <button
      aria-label="Backspace"
      className="mobile-input-panel__key mobile-input-panel__key--secondary"
      onClick={removeAnswerInputCharacter}
      type="button"
    >
      Del
    </button>
  );
}

/**
 * Renders the touch-friendly keypad used for entering answers on mobile devices.
 * Each key mirrors the shared answer-input actions used by the keyboard controls.
 */
export function InputPanel() {
  return (
    <div className="mobile-input-panel" data-testid="mobile-input-panel">
      <div className="mobile-input-panel__keypad" aria-label="Answer keypad" role="group">
        {mobileKeypadValues.map((keyValue) => {
          if (keyValue === 'Enter') return <EnterButton key="Enter" />;
          if (keyValue === 'Delete') return <DeleteButton key="Delete" />;

          return (
            <button
              aria-label={keyValue === '-' ? 'Negative sign' : `Digit ${keyValue}`}
              className="mobile-input-panel__key"
              key={keyValue}
              onClick={() => appendAnswerInputCharacter(keyValue)}
              type="button"
            >
              {keyValue}
            </button>
          );
        })}
      </div>
    </div>
  );
}
