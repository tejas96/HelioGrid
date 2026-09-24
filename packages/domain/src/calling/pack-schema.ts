import { z } from 'zod';
import { minted, packClockTime, packLabel, packWhole } from '../market/stored-values';
import { clockTimeHhmm } from './clock-time';
import {
  type CallingRulesPack,
  callingWindow,
  type PlatformMessageKind,
  type TrafficClass,
} from './pack';

function floorOf<T>(value: z.ZodType<T, z.ZodTypeDef, unknown>) {
  return z.object({ enforcement: z.literal('floor'), value });
}
function tenantDefaultOf<T>(value: z.ZodType<T, z.ZodTypeDef, unknown>) {
  return z.object({ enforcement: z.literal('default'), value });
}

/** Re-minted through `callingWindow`, so "closes after it opens" is the owner's rule, not a copy. */
const window = minted(
  z.object({ opens: packClockTime, closes: packClockTime }),
  ({ opens, closes }) => callingWindow(clockTimeHhmm(opens), clockTimeHhmm(closes)),
);

const voice = z.discriminatedUnion('declared', [
  z.object({ declared: z.literal(false) }),
  z.object({
    declared: z.literal(true),
    promotionalWindow: floorOf(window),
    dndScrubMaxAgeHours: floorOf(packWhole),
    optOutHonouredWithinHours: floorOf(packWhole),
    recordingRetentionDays: floorOf(packWhole),
    proactiveAiDisclosure: floorOf(z.boolean()),
    recordingConsentCaptured: tenantDefaultOf(z.boolean()),
    callerLineSeries: floorOf(
      z.object({
        requiredByClass: z.object({
          transactional: z.string().nullable(),
          promotional: z.string().nullable(),
          inbound: z.string().nullable(),
        } satisfies Record<TrafficClass, z.ZodTypeAny>),
        forbidden: z.array(z.string()),
      }),
    ),
  }),
]);

/** `pack.calling-rules` as a row stores it, validated whole and re-minted (`T-FCORE-017`). */
export const CALLING_RULES_PACK_SCHEMA: z.ZodType<CallingRulesPack, z.ZodTypeDef, unknown> =
  z.object({
    voice,
    messaging: z.object({
      statutoryWindow: floorOf(window.nullable()),
      scheduledSendHour: tenantDefaultOf(packClockTime),
      senderRegistration: floorOf(
        z.object({ platform: z.string(), levels: z.array(z.string()) }).nullable(),
      ),
      templates: z.object({
        sign_in_code: packLabel,
        team_invite: packLabel,
      } satisfies Record<PlatformMessageKind, z.ZodTypeAny>),
    }),
  });
