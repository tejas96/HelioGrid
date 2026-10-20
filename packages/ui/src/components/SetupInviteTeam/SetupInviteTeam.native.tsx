import { numberOnTeam, sendsNothing } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { BannerAction } from '../Banner/BannerAction.native';
import { Button } from '../Button/Button.native';
import { DoorFrame } from '../DoorFrame/DoorFrame.native';
import { InviteForm } from '../InviteForm/InviteForm.native';
import type { FocusHandle } from '../SearchField/SearchField.types';
import type { SetupInviteTeamProps } from './SetupInviteTeam.types';

/**
 * The invite step in the phone's one column (`SCR-M01-07` m-default): the title, the form, and
 * the acts held under the scrolling column with the expiry under them. At the cap the pressed
 * *Send invite* goes away, so the screen reader's focus moves to *Continue setup*.
 */
export function SetupInviteTeam({
  bind,
  words,
  roles,
  sending,
  leaving,
  refusal = null,
  onSend,
  onSkip,
  onOpenTeam,
  onDifferentNumber,
  phoneRef,
  onActsHeight,
}: SetupInviteTeamProps) {
  const onward = useRef<FocusHandle>(null);
  useEffect(() => {
    if (refusal === 'cap') onward.current?.focus();
  }, [refusal]);
  return (
    <DoorFrame
      onFooterHeight={onActsHeight}
      identity={
        <View style={styles.title}>
          <Text variant="h2">{words.title}</Text>
        </View>
      }
      footer={
        <View style={styles.act}>
          {refusal === 'cap' ? (
            <Button
              ref={onward}
              variant="primary"
              size="lg"
              fullWidth
              loading={leaving}
              onClick={onSkip}
            >
              {words.continueSetup}
            </Button>
          ) : (
            <View style={styles.ways}>
              <Button variant="ghost" size="lg" disabled={sending || leaving} onClick={onSkip}>
                {words.skip}
              </Button>
              <View style={styles.primary}>
                {numberOnTeam(refusal) ? (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={leaving}
                    onClick={onDifferentNumber}
                  >
                    {words.differentNumber}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={sending}
                    disabled={leaving}
                    onClick={onSend}
                  >
                    {words.send}
                  </Button>
                )}
              </View>
            </View>
          )}
          {/* The expiry only beside a send: a refused number and the cap send nothing. */}
          {sendsNothing(refusal) ? null : (
            <Text variant="caption" color="secondary" align="center">
              {words.lasts}
            </Text>
          )}
        </View>
      }
    >
      <InviteForm
        bind={bind}
        words={words}
        roles={roles}
        refusal={refusal}
        refusalAction={<BannerAction onClick={onOpenTeam}>{words.openTeam}</BannerAction>}
        phoneRef={phoneRef}
      />
    </DoorFrame>
  );
}

const styles = StyleSheet.create({
  /** The title `sp-6` under the wordmark and `sp-4` over the form (m-default). */
  title: { paddingTop: theme.spacing['sp-6'], paddingBottom: theme.spacing['sp-4'] },
  /** The acts `sp-3` over the expiry. */
  act: { gap: theme.spacing['sp-3'] },
  /** *Skip for now* at its own width, the primary taking the rest of the row, `sp-2` apart. */
  ways: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  primary: { flex: 1, minWidth: 0 },
});
