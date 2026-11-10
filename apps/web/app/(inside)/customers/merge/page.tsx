import { notFound } from 'next/navigation';
import { CustomerMergeScreen } from '../../../../features/customer-merge';

/**
 * Route entry for /customers/merge — Customer Merge (`SCR-M02-06`); routing only. Lead Detail opens
 * it with `?survivorId=<this lead's customer>`; a kept-both link adds `&loserId=<the other>`.
 */
export default async function CustomerMergePage({
  searchParams,
}: {
  searchParams: Promise<{ survivorId?: string; loserId?: string }>;
}) {
  const { survivorId, loserId } = await searchParams;
  if (survivorId === undefined || survivorId === '') notFound();
  // Another pair keeps this page mounted with new params: keyed by the pair, it starts afresh.
  return (
    <CustomerMergeScreen
      key={`${survivorId}:${loserId ?? ''}`}
      survivorId={survivorId}
      loserId={loserId === undefined || loserId === '' ? null : loserId}
    />
  );
}
