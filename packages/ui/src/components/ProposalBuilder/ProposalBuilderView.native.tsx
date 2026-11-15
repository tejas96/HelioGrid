import { Fragment } from 'react';
import { useFormat } from '../MarketProvider/market-context';
import { ProposalCheckSheet } from '../ProposalCheck/ProposalCheck.native';
import { ProposalPartAdd } from '../ProposalPartSheets/PartAdd.native';
import { ProposalPartEdit } from '../ProposalPartSheets/PartEdit.native';
import { ProposalPartPicker } from '../ProposalPartSheets/PartPicker.native';
import { ProposalPaymentPartSheet } from '../ProposalPartSheets/PaymentPartSheet.native';
import { ProposalPhaseSheet } from '../ProposalPartSheets/PhaseSheet.native';
import { ProposalReady } from '../ProposalReady/ProposalReady.native';
import { ProposalStep } from '../ProposalSteps/ProposalStep.native';
import type { ProposalStepModel } from '../ProposalSteps/step-view.types';
import { ProposalBuilder } from './ProposalBuilder.native';
import { builderViewPartsOf } from './ProposalBuilderView.logic';
import type { ProposalBuilderViewProps } from './ProposalBuilderView.types';
import { ProposalPreviewSheet } from './ProposalPreviewSheet.native';
import { ProposalStepList } from './ProposalStepList.native';

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
