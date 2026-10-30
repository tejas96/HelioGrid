import { billingContract } from '@heliogrid/contracts';
import { Controller, HttpStatus, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { tenantIdOf } from '../../common/auth/session-context';
import { ContractException } from '../../common/errors/contract-exception';
import { CheckoutService } from './checkout.service';
import { GatewayEventsService } from './gateway-events.service';

@Controller()
export class BillingController {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CheckoutService) private readonly checkouts: CheckoutService,
    @Inject(GatewayEventsService) private readonly events: GatewayEventsService,
  ) {}

  @TsRestHandler(billingContract)
  // Every billing act is the EPC Owner's (`M12-56`). The gateway's message carries no session:
  // its signature is its authentication, checked before a byte of it is read.
  @RouteBillingMap(billingContract, { checkout: 'billing_screens', gatewayEvents: 'ungated' })
  @RouteAccessMap(billingContract, {
    checkout: { capability: 'billing.manage_billing' },
    gatewayEvents: 'public',
  })
  handler(@Req() req: Request) {
    return tsRestHandler(billingContract, {
      checkout: async ({ body }) => ({
        status: 200,
        body: await this.checkouts.open(tenantIdOf(req), body, Date.now()),
      }),
      gatewayEvents: async () => {
        const outcome = await this.events.receive(rawBodyOf(req), headersOf(req), Date.now());
        if (outcome === 'invalid') {
          throw new ContractException(
            'SIGNATURE_INVALID',
            'The message signature does not hold.',
            HttpStatus.UNAUTHORIZED,
          );
        }
        return { status: 200, body: { received: true as const } };
      },
    });
  }
}

/** The bytes the gateway signed: `app.ts` keeps this route's body raw. */
function rawBodyOf(req: Request): Uint8Array {
  return Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
}

/** The request's headers, one value each, names lower-cased as Node gives them. */
function headersOf(req: Request): Record<string, string> {
  return Object.fromEntries(
    Object.entries(req.headers).flatMap(([name, value]) =>
      typeof value === 'string'
        ? [[name, value]]
        : Array.isArray(value)
          ? [[name, value.join(',')]]
          : [],
    ),
  );
}
