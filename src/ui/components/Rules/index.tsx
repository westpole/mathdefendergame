const rules = [
  'Type the answer and press Enter.',
  'Escape exits the run back to menu.',
  'You have 10 lives for retries.',
  'The base shield absorbs 5 meteor hits.',
  'A destroyed base costs 1 life.',
  'Perfect stages earn 1 bonus life.',
  'Progress through 28 stages of operations.',
];

export function RulesOverlay() {
  return (
    <div className="overlay-screen">
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
