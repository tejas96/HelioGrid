import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { Input } from '../Input/Input.native';
import { AfterHint } from '../ProposalAfterParts/ProposalAfterParts.native';
import { Select } from '../Select/Select.native';
import { Sheet } from '../Sheet/Sheet.native';
import { newLinkFormOf } from './ProposalLinks.logic';
import type { NewLinkSheetProps } from './ProposalLinks.types';

/** *New link* on the phone: who it is for, and the link's own name, which the sheet keeps above the keyboard. */
export function NewLinkSheet(props: NewLinkSheetProps) {
  const { open, words, contacts, draft, failure } = props;
  const [tried, setTried] = useState(false);
  const form = newLinkFormOf(props, tried);
  const make = () => {
    setTried(true);
    if (!form.missing) props.onMake({ ...draft, label: draft.label.trim() });
  };
  return (
    <Sheet {...form.sheet} showClose>
      {open ? (
        <View style={styles.body}>
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
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({ body: { gap: theme.spacing['sp-4'] } });
