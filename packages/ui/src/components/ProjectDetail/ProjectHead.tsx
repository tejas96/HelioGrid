import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { Menu } from '../Menu';
import { firstNameOf, installFactOf, projectMenuOf } from './ProjectDetail.logic';
import type { ProjectHeadProps } from './ProjectDetail.parts.types';
import './ProjectHead.css';

/** The project's facts as pills under its title: who manages it, and where its install stands. */
export function ProjectFacts({ project, words }: Pick<ProjectHeadProps, 'project' | 'words'>) {
  const install = installFactOf({ project, words });
  return (
    <p className="hg-project-detail-facts">
      <span className="hg-project-detail-fact" data-person="true">
        <Avatar name={project.manager.name} size={24} />
        {words.manager(firstNameOf(project.manager.name))}
      </span>
      <span className="hg-project-detail-fact">
        <ShellGlyph name={install.glyph} size="sm" tone="secondary" />
        {install.label}
      </span>
    </p>
  );
}

/**
 * The acts beside the project's title (the picked desktop): *Call* the customer by their first name,
 * and the ⋯ of acts on the whole project — drawn only for a reader who moves stages, on a live one.
 */
export function ProjectHeadActs(props: ProjectHeadProps) {
  const { project, words, onCall, sending } = props;
  const items = projectMenuOf(props, menuGlyph);
  const name = project.customer.name ?? project.number;
  return (
    <span className="hg-project-detail-head-acts">
      <Button
        variant="secondary"
        icon={<ShellGlyph name="phone" size="md" tone="primary" />}
        onClick={onCall}
      >
        {words.call(firstNameOf(name))}
      </Button>
      {items === null ? null : <Menu label={words.menu} items={items} disabled={sending} />}
    </span>
  );
}

const menuGlyph = (name: ShellGlyphName) => <ShellGlyph name={name} size="sm" tone="secondary" />;
