import { Fragment } from 'react';
import { useFormat } from '../MarketProvider/market-context';
import { ProposalCheckSheet } from '../ProposalCheck/ProposalCheck';
import { ProposalPartAdd } from '../ProposalPartSheets/PartAdd';
import { ProposalPartEdit } from '../ProposalPartSheets/PartEdit';
import { ProposalPartPicker } from '../ProposalPartSheets/PartPicker';
import { ProposalPaymentPartSheet } from '../ProposalPartSheets/PaymentPartSheet';
import { ProposalPhaseSheet } from '../ProposalPartSheets/PhaseSheet';
import { ProposalReady } from '../ProposalReady/ProposalReady';
import { ProposalStep } from '../ProposalSteps/ProposalStep';
import type { ProposalStepModel } from '../ProposalSteps/step-view.types';
import { ProposalBuilder } from './ProposalBuilder';
import { builderViewPartsOf } from './ProposalBuilderView.logic';
import type { ProposalBuilderViewProps } from './ProposalBuilderView.types';
import { ProposalPreviewSheet } from './ProposalPreviewSheet';
import { ProposalStepList } from './ProposalStepList';

export function ProposalBuilderView<Step extends ProposalStepModel>(
  props: ProposalBuilderViewProps<Step>,
) {
  const format = useFormat();
  const parts = builderViewPartsOf(props, format.pack.areas);
  if (parts.ready !== null) return <ProposalReady {...parts.ready} />;
  const { sheets } = parts;
  return (
    <Fragment>
      <ProposalBuilder {...parts.frame}>
        <ProposalStep {...parts.step} />
      </ProposalBuilder>
      <ProposalStepList {...sheets.list} />
      <ProposalPreviewSheet {...sheets.preview} />
      <ProposalPartPicker {...sheets.picker} />
      <ProposalPartEdit {...sheets.edit} />
      {sheets.add === null ? props.catalogAdd : <ProposalPartAdd {...sheets.add} />}
      <ProposalPhaseSheet {...sheets.phase} />
      <ProposalPaymentPartSheet {...sheets.payment} />
      <ProposalCheckSheet {...sheets.check} />
    </Fragment>
  );
}
