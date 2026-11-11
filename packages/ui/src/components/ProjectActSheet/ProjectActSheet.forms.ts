import { type ComponentType, createElement, type ReactElement } from 'react';
import { draftKeyOf } from './ProjectActSheet.logic';
import type { ProjectActForm, ProjectFormFrame, ProjectFormOf } from './ProjectActSheet.types';

/** Each act's form by its kind — every half hands over its own platform's forms. */
export type ProjectForms = {
  readonly [K in ProjectActForm['kind']]: ComponentType<ProjectFormOf<K>>;
};

/**
 * The form an act opens, keyed so another row's *Not needed* or another file's name starts a fresh
 * draft — the one switch both halves draw through.
 */
export function formOf(
  forms: ProjectForms,
  form: ProjectActForm,
  frame: ProjectFormFrame,
): ReactElement {
  const key = draftKeyOf(form);
  switch (form.kind) {
    case 'dispatch':
      return createElement(forms.dispatch, { key, form, ...frame });
    case 'wait':
      return createElement(forms.wait, { key, form, ...frame });
    case 'earlyProof':
      return createElement(forms.earlyProof, { key, form, ...frame });
    case 'notNeeded':
      return createElement(forms.notNeeded, { key, form, ...frame });
    case 'cancel':
      return createElement(forms.cancel, { key, form, ...frame });
    case 'date':
      return createElement(forms.date, { key, form, ...frame });
    case 'manager':
      return createElement(forms.manager, { key, form, ...frame });
    case 'access':
      return createElement(forms.access, { key, form, ...frame });
    case 'fileName':
      return createElement(forms.fileName, { key, form, ...frame });
  }
}
