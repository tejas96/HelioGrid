/**
 * The PUT and PATCH routes the repeat proof holds to a stated reason instead of a proof: what each
 * records on a repeat, and why that is fine.
 */
export const noRepeatToProve: Readonly<Record<string, string>> = {
  'PUT /catalog/items/:id': 'records every repeat — deferred D163',
  'PUT /catalog/items/:id/override': 'records every repeat — deferred D163',
  'PUT /catalog/imports/:id/mapping': 'an import’s working state; records no entry',
  'PUT /catalog/imports/:id/rows/:rowNumber': 'an import’s working state; records no entry',
  'PUT /lead-imports/:id/mapping':
    'an import’s working state; records no entry; the same mapping again starts no pass (tests/crm/lead-import.test.ts)',
  'PUT /notifications/preferences/:group': 'records no entry',
  'PUT /onboarding/progress/:step': 'records no entry',
  'PUT /onboarding/prompt-points/:fact': 'records no entry',
  'PATCH /tenants/me/membership': 'records no entry',
  'PUT /settings/quiet-hours': 'records no entry',
  'PATCH /users/me': 'records no entry',
  'PUT /users/me/photo': 'records no entry',
  'PATCH /leads/:id':
    'records no entry; a field sent as stored writes no timeline entry (tests/crm/lead-fields.test.ts)',
  'PATCH /contacts/:id': 'records no entry',
  'PUT /customers/:id/primary-contact': 'records no entry; the same choice again writes nothing',
};
