import { classNames } from '../../primitives/class-names';
import type {
  SettingsCardProps,
  SettingsSectionProps,
  SettingsSectionRowProps,
} from './SettingsSection.types';

export function SettingsCard({ children, className }: SettingsCardProps & { className?: string }) {
  return <div className={classNames('hg-settings-card', className)}>{children}</div>;
}

export function SettingsSection({ title, titleAside, children }: SettingsSectionProps) {
  return (
    <section className="hg-settings-card hg-settings-section">
      <div className="hg-settings-section-head">
        <h2 className="hg-settings-section-title">{title}</h2>
        {titleAside}
      </div>
      <div className="hg-settings-section-rows">{children}</div>
    </section>
  );
}

export function SettingsSectionRow({
  label,
  labelAside,
  caption,
  control,
  controlId,
}: SettingsSectionRowProps) {
  return (
    <div className="hg-settings-section-row">
      <div className="hg-settings-section-words">
        <span className="hg-settings-section-label-line">
          {controlId === undefined ? (
            <span className="hg-settings-section-label">{label}</span>
          ) : (
            <label htmlFor={controlId} className="hg-settings-section-label">
              {label}
            </label>
          )}
          {labelAside}
        </span>
        {caption === undefined ? null : (
          <span className="hg-settings-section-caption">{caption}</span>
        )}
      </div>
      {control === undefined ? null : <div className="hg-settings-section-control">{control}</div>}
    </div>
  );
}
