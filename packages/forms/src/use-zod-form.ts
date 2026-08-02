'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { type UseFormProps, type UseFormReturn, useForm } from 'react-hook-form';
import type { z } from 'zod';

/**
 * The one way a screen builds a form (foundation-dx spec §2): the CONTRACT's schema — or
 * a .pick()/.omit() of it — drives value types AND validation, so client and server
 * validate the same fact. `mode: 'onTouched'`: errors appear on blur, not per keystroke.
 */
export function useZodForm<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.input<TSchema>, unknown, z.output<TSchema>>, 'resolver'>,
): UseFormReturn<z.input<TSchema>, unknown, z.output<TSchema>> {
  return useForm<z.input<TSchema>, unknown, z.output<TSchema>>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    ...options,
  });
}
