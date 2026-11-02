import type { ReactNode } from 'react';

interface RulesSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

/**
 * Renders one titled block of the rules screen.
 * @param id - Stable section id used for the heading anchor and test ids.
 * @param title - Translated section heading.
 * @param children - Section body content.
 */
export function RulesSection({ id, title, children }: RulesSectionProps) {
  const headingId = `rules-section-${id}`;

  return (
    <section className="rules-section" aria-labelledby={headingId} data-testid={headingId}>
      <h2 id={headingId}>{title}</h2>
      {children}
    </section>
  );
}
