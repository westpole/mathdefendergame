const rules = [
  'Type the answer and press Enter.',
  'Press Escape to return to the menu.',
  'You begin with 3 lives.',
  'The base shield has 5 shield points before a life is lost.',
  'Perfect stages award an extra life.',
  'Clear 28 stages to win.',
];

export function RulesOverlay() {
  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="rules-overlay">
      <div className="overlay-panel">
        <div className="menu-page-header">
          <h1>RULES</h1>
        </div>
        <ul className="rules-list rules-list--page">
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
