import { Text } from '../../primitives/Text/Text';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { DoorTitle } from '../DoorFrame/DoorTitle';
import { useFormat } from '../MarketProvider';
import type { SignupRequestSentProps } from './SignupRequestSent.types';

/**
 * The request sent in the frame's two fields: what was sent and to whom in the identity half; who
 * it was sent as and the one route back in the task column, the route held at the column's foot.
 */
export function SignupRequestSent({
  language,
  words,
  name,
  phoneE164,
  onCreateInstead,
}: SignupRequestSentProps) {
  const format = useFormat();
  return (
    <DoorFrame
      trailing={language}
      taskMeasure="steps"
      column="deep"
      identity={<DoorTitle title={words.title} intro={words.body} />}
      footer={
        <div className="hg-signup-sent-route">
          <Text variant="body-sm" color="secondary" align="center">
            {words.prompt}
          </Text>
          <Button variant="secondary" size="lg" fullWidth onClick={onCreateInstead}>
            {words.createInstead}
          </Button>
        </div>
      }
    >
      <Card className="hg-signup-sent-as">
        <Text variant="overline" color="secondary">
          {words.sentAs}
        </Text>
        <Text variant="body-sm" bold>
          {name}
        </Text>
        <Text variant="mono" bold>
          {format.phone(phoneE164)}
        </Text>
      </Card>
    </DoorFrame>
  );
}
