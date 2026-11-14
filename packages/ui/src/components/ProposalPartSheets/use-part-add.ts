import type { InputProps } from '../Input/Input.types';
import type { SegmentedControlProps } from '../SegmentedControl/SegmentedControl.types';
import type { ProposalPartAddProps } from './ProposalPartSheets.types';
import { useSheetDraft } from './use-sheet-draft';

/** What the add form holds while the sheet is open: a fresh one each time it opens. */
interface PartTyped {
  readonly brand: string;
  readonly specification: string;
  readonly warranty: string;
  readonly certified: boolean;
  /** *Save* was pressed once, so a missing brand now says so. */
  readonly asked: boolean;
}

const EMPTY_PART: PartTyped = {
  brand: '',
  specification: '',
  warranty: '',
  certified: true,
  asked: false,
};

/**
 * *Add a new part*'s form (`M06-28`): the three things typed, the certified choice where the
 * market has one, and the save — which asks for the brand and the specification, both required by
 * the saved part's contract, before it sends anything. A field the server refused says so there.
 */
export function usePartAdd({ open, words, saving, onSave, refused = [] }: ProposalPartAddProps) {
  const [held, setHeld] = useSheetDraft(open, EMPTY_PART);
  const typed = held ?? EMPTY_PART;
  const { brand, specification, warranty, certified, asked } = typed;
  const set = (change: Partial<PartTyped>) => setHeld({ ...typed, ...change });
  const setBrand = (value: string) => set({ brand: value });
  const setSpecification = (value: string) => set({ specification: value });
  const setWarranty = (value: string) => set({ warranty: value });
  const setCertified = (value: boolean) => set({ certified: value });
  const missing = (field: 'brand' | 'specification', value: string) =>
    (asked && value.trim() === '') || (refused.includes(field) && !saving);
  const fields: readonly (InputProps & { key: string })[] = [
    {
      key: 'brand',
      label: words.brand,
      value: brand,
      onChange: setBrand,
      disabled: saving,
      ...(missing('brand', brand) ? { error: words.brandMissing } : {}),
    },
    {
      key: 'specification',
      label: words.specification,
      value: specification,
      onChange: setSpecification,
      disabled: saving,
      ...(missing('specification', specification) ? { error: words.specificationMissing } : {}),
    },
    {
      key: 'warranty',
      label: words.warranty,
      value: warranty,
      onChange: setWarranty,
      disabled: saving,
    },
  ];
  const certifiedChoice: SegmentedControlProps | null =
    words.certified === undefined
      ? null
      : {
          ariaLabel: words.certified.title,
          value: certified ? 'yes' : 'no',
          onChange: (value) => setCertified(value === 'yes'),
          options: [
            { value: 'yes', label: words.yes },
            { value: 'no', label: words.no },
          ],
        };
  const save = () => {
    set({ asked: true });
    if (brand.trim() === '' || specification.trim() === '') return;
    onSave({
      brand: brand.trim(),
      specification: specification.trim(),
      warranty: warranty.trim(),
      certified: words.certified !== undefined && certified,
    });
  };
  return { fields, certifiedChoice, save };
}
