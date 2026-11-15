import { useState } from 'react';
import { Text } from '../../primitives/Text';
import { Button } from '../Button';
import { EditorSurface } from '../EditorSurface';
import { Input } from '../Input';
import { AfterHint } from '../ProposalAfterParts';
import { Select } from '../Select';
import { newLinkFormOf } from './ProposalLinks.logic';
import type { NewLinkSheetProps } from './ProposalLinks.types';
import './ProposalLinks.css';

/** *New link* on the web: who it is for, and the link's own name. Fields commit as typed. */
export function NewLinkSheet(props: NewLinkSheetProps) {
  const { open, words, contacts, draft, sending, failure } = props;
  const [tried, setTried] = useState(false);
  const form = newLinkFormOf(props, tried);
  const make = () => {
    setTried(true);
    if (!form.missing) props.onMake({ ...draft, label: draft.label.trim() });
  };
  return (
    <EditorSurface {...form.sheet} showClose desktop="modal">
      {open ? (
        <div className="hg-new-link" aria-busy={sending ? true : undefined}>
          {contacts.length === 0 ? null : <Select {...form.who} />}
          <Input {...form.label} />
          <AfterHint>{words.hint}</AfterHint>
          {failure === null ? null : (
            <Text variant="body-sm" color="danger" live>
              {failure}
            </Text>
          )}
          <Button {...form.make} onClick={make}>
            {words.make}
          </Button>
        </div>
      ) : null}
    </EditorSurface>
  );
}
