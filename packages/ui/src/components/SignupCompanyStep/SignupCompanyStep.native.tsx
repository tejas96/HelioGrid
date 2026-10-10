import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { DoorFrame } from '../DoorFrame/DoorFrame.native';
import { DoorTitle } from '../DoorFrame/DoorTitle.native';
import { SignupSteps } from '../SignupSteps/SignupSteps.native';
import { TintedBlock } from '../TintedBlock/TintedBlock.native';
import { SignupAccount } from './SignupAccount.native';
import type { SignupCompanyStepProps } from './SignupCompanyStep.types';
import { SignupFacts } from './SignupFacts.native';
import { SignupFields } from './SignupFields.native';

/**
 * Step 3 in the phone's one column: the step header, the title, what is known about the person,
 * then the fields, with the action held under the scrolling column. Under the steer the finding
 * and both roads are that held action.
 */
export function SignupCompanyStep({
  language,
  words,
  phoneE164,
  bind,
  facts,
  busy,
  onCreate,
  onRequestToJoin,
  onCreateAnyway,
}: SignupCompanyStepProps) {
  const { steer } = words;
  const primary = (
    <Button
      variant="primary"
      size="lg"
      fullWidth
      loading={busy}
      spokenName={words.primary.aria}
      onClick={steer === null ? onCreate : onRequestToJoin}
    >
      {words.primary.label}
    </Button>
  );
  return (
    <DoorFrame
      trailing={language}
      lead={<SignupSteps words={words.steps} current={2} />}
      identity={
        <>
          <View style={styles.title}>
            <DoorTitle title={words.title} intro={words.intro ?? undefined} />
          </View>
          {words.block === null ? null : (
            <View style={styles.block}>
              <TintedBlock {...words.block} />
            </View>
          )}
          {words.account === null ? null : (
            <SignupAccount words={words.account} phoneE164={phoneE164} />
          )}
          {words.resumeLine === null ? null : (
            <View style={styles.resumeLine}>
              <Text variant="body-sm" color="secondary">
                {words.resumeLine}
              </Text>
            </View>
          )}
        </>
      }
      footer={
        steer === null ? (
          primary
        ) : (
          <View style={styles.steer}>
            <TintedBlock tone="info" {...steer.finding} />
            <View style={styles.roads}>
              {primary}
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                disabled={busy}
                onClick={onCreateAnyway}
              >
                {steer.createAnyway}
              </Button>
            </View>
          </View>
        )
      }
    >
      {facts === null ? (
        <SignupFields
          bind={bind}
          underAccount={words.account !== null && words.resumeLine === null}
        />
      ) : (
        <SignupFacts facts={facts} />
      )}
      {words.caption === null ? null : (
        <View style={styles.caption}>
          <Text variant="caption" color="secondary">
            {words.caption}
          </Text>
        </View>
      )}
    </DoorFrame>
  );
}

const styles = StyleSheet.create({
  /** The title block `sp-6` under the step header. */
  title: { paddingTop: theme.spacing['sp-6'] },
  /** A failure block under the title, in the account's place. */
  block: { marginTop: theme.spacing['sp-5'] },
  resumeLine: { marginTop: theme.spacing['sp-4'] },
  caption: { marginTop: theme.spacing['sp-5'] },
  /** The steer under the scrolling fields: the finding, then both roads (`SCR-M01-02` decision 9). */
  steer: { gap: theme.spacing['sp-5'] },
  /** The steer's two roads, 12 apart on the board (`SCR-M01-02`, 375 vertical layout). */
  roads: { gap: theme.spacing['sp-3'] },
});
