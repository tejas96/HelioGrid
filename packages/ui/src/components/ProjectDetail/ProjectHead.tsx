import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { Avatar } from '../Avatar';
import { IconButton } from '../IconButton';
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
 * The page's acts: on a phone *Call*, which opens the dial pad, and the ⋯; on the wide web the ⋯
 * alone — a desk has no dial pad, and the Deal card shows the number. The ⋯ is drawn only for a
 * reader who moves stages, on a live project.
 */
export function ProjectHeadActs(props: ProjectHeadProps) {
  const { form, project, words, onCall, sending } = props;
  const items = projectMenuOf(props, menuGlyph);
  const name = project.customer.name ?? project.number;
  const phone = <ShellGlyph name="phone" size="md" tone="primary" />;
  return (
    <span className="hg-project-detail-head-acts">
      {form === 'bar' ? (
        <IconButton label={words.call(name)} onClick={onCall}>
          {phone}
        </IconButton>
      ) : null}
      {items === null ? null : (
        <Menu
          label={words.menu}
          items={items}
          disabled={sending}
          triggerLook={form === 'bar' ? 'surface' : undefined}
        />
      )}
    </span>
  );
}

const menuGlyph = (name: ShellGlyphName) => <ShellGlyph name={name} size="sm" tone="secondary" />;
