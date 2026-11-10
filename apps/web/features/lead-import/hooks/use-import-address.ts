'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * The page's address follows the import on it (`M02-21`): once a file is started, `?job=` names it,
 * so a reload or a reopened tab finds its progress or its report; *Import another file* clears it.
 * The address is replaced, never pushed, so Back still leaves the wizard.
 */
export function useImportAddress(jobId: string | null, addressed: string | null) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (jobId === addressed) return;
    router.replace(jobId === null ? pathname : `${pathname}?job=${jobId}`, { scroll: false });
  }, [jobId, addressed, pathname, router]);
}
