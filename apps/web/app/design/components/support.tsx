'use client';
import type { WorkflowStatus } from '@heliogrid/ui';
import type { ReactNode, SVGProps } from 'react';

/** Shared gallery scaffolding — section/demo wrappers + local Lucide-style inline icons. */

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ds-section">
      <h2 className="hg-overline">{title}</h2>
      {children}
    </section>
  );
}

export function Demo({
  label,
  hindi = false,
  children,
}: {
  label: string;
  hindi?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="ds-demo" lang={hindi ? 'hi' : undefined}>
      {children}
      <span className="ds-value">{label}</span>
    </div>
  );
}

/** Hindi labels for the 7 workflow statuses (apps pass translated labels via Lingui). */
export const HINDI_STATUS: Record<WorkflowStatus, string> = {
  lead: 'लीड',
  'survey-scheduled': 'सर्वेक्षण निर्धारित',
  'design-in-progress': 'डिज़ाइन प्रगति पर',
  approved: 'स्वीकृत',
  installing: 'इंस्टॉल हो रहा है',
  commissioned: 'चालू',
  'on-hold': 'होल्ड पर',
};

export const ALL_STATUSES: WorkflowStatus[] = [
  'lead',
  'survey-scheduled',
  'design-in-progress',
  'approved',
  'installing',
  'commissioned',
  'on-hold',
];

/* Local inline icons — Lucide geometry, 1.5px stroke, round caps (bundle-local rule). */

function Svg({ size = 20, children, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function SunIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </Svg>
  );
}

export function PlusIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M5 12h14M12 5v14" />
    </Svg>
  );
}

export function ZapIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  );
}

export function SearchIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Svg>
  );
}

export function PhoneIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  );
}

export function ChevronRightIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

export function FileTextIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8" />
    </Svg>
  );
}

export function ArrowRightIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </Svg>
  );
}

export function HomeIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </Svg>
  );
}

export function FactoryIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M17 18h1M12 18h1M7 18h1" />
    </Svg>
  );
}

export function LayersIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </Svg>
  );
}
