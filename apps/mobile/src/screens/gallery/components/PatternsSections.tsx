import { phoneE164Schema } from '@heliogrid/contracts';
import { ApiError } from '@heliogrid/data';
import { usePagedList, usePaginatedList } from '@heliogrid/data/react';
import { applyServerErrors, Controller, useZodForm, z } from '@heliogrid/forms';
import { useState } from 'react';
import { ApiErrorText } from '../../../lib/ApiErrorText';
import { AppText, Button, Input } from '../../../ui';
import { Row, Section } from './GalleryChrome';

/**
 * Foundation-pattern demos (foundation-dx spec §5) — the live examples screens copy.
 * Demo data repeats web's PatternsSections on purpose: dev-gallery fixtures, not shared
 * vocabulary. NO FlatList here — the gallery scrolls in a ScrollView, and nesting
 * VirtualizedLists errors; product screens use FlatList + onEndReached={fetchNextPage}.
 */

const demoLeadSchema = z.object({
  name: z.string().min(1),
  phone: phoneE164Schema,
});

const DEMO_ROWS = Array.from({ length: 12 }, (_, i) => ({
  id: `row-${i + 1}`,
  label: `Demo lead ${i + 1}`,
}));
const DEMO_LIMIT = 5;

function fetchDemoPage(page: number) {
  const start = (page - 1) * DEMO_LIMIT;
  return new Promise<{ items: (typeof DEMO_ROWS)[number][]; totalCount: number }>((resolve) => {
    setTimeout(() => {
      resolve({ items: DEMO_ROWS.slice(start, start + DEMO_LIMIT), totalCount: DEMO_ROWS.length });
    }, 300);
  });
}

const DEMO_ERRORS = [
  new ApiError(403, 'forbidden', { code: 'FORBIDDEN', requestId: 'req_demo1' }),
  new ApiError(500, 'boom', { code: 'INTERNAL', requestId: 'req_demo2' }),
  new ApiError(409, 'Lead already won.', { code: 'LEAD_ALREADY_WON', requestId: 'req_demo3' }),
];

export function PatternsSections() {
  return (
    <>
      <FormPatternSection />
      <PaginationPatternSection />
      <ErrorCopySection />
    </>
  );
}

function FormPatternSection() {
  const form = useZodForm(demoLeadSchema);
  const [submitted, setSubmitted] = useState('');

  const submit = form.handleSubmit((values) => {
    setSubmitted(`${values.name} · ${values.phone}`);
  });

  const simulateServerReject = () => {
    applyServerErrors(form.setError, [
      { path: 'phone', issue: 'phone already exists on another lead' },
    ]);
  };

  return (
    <Section title="Pattern — useZodForm (contract schema drives validation)">
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <Input
            label="Name"
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="phone"
        render={({ field, fieldState }) => (
          <Input
            label="Phone (E.164)"
            type="tel"
            placeholder="+919876543210"
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Row>
        <Button size="md" onClick={() => void submit()}>
          Save
        </Button>
        <Button size="md" variant="secondary" onClick={simulateServerReject}>
          Simulate server reject
        </Button>
      </Row>
      {submitted !== '' && <AppText role="body-sm">submitted: {submitted}</AppText>}
    </Section>
  );
}

function PaginationPatternSection() {
  const accumulating = usePaginatedList({
    queryKey: ['gallery', 'patterns', 'accumulating'],
    fetchPage: fetchDemoPage,
  });
  const [page, setPage] = useState(1);
  const paged = usePagedList({
    queryKey: ['gallery', 'patterns', 'paged'],
    fetchPage: fetchDemoPage,
    page,
    limit: DEMO_LIMIT,
  });

  return (
    <Section title="Pattern — usePaginatedList (load more) + usePagedList (pager)">
      <AppText role="body-sm">
        load-more · {accumulating.items.length}/{accumulating.totalCount}
      </AppText>
      {accumulating.items.map((row) => (
        <AppText key={row.id}>{row.label}</AppText>
      ))}
      {accumulating.hasNextPage === true && (
        <Row>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void accumulating.fetchNextPage()}
            loading={accumulating.isFetchingNextPage}
          >
            Load more
          </Button>
        </Row>
      )}
      <AppText role="body-sm">
        pager · page {page} of {paged.pageCount} · {paged.totalCount} total
      </AppText>
      {paged.items.map((row) => (
        <AppText key={row.id}>{row.label}</AppText>
      ))}
      <Row>
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= paged.pageCount}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </Row>
    </Section>
  );
}

function ErrorCopySection() {
  return (
    <Section title="Pattern — ApiErrorText (copy from @heliogrid/i18n, never hand-written)">
      {DEMO_ERRORS.map((error) => (
        <ApiErrorText key={error.code} error={error} />
      ))}
    </Section>
  );
}
