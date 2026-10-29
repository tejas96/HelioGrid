import { Text } from '../../primitives/Text/Text';
import { Button } from '../Button/Button';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { RoleCard } from '../RoleCard/RoleCard';
import type { RoleExplainerProps } from './RoleExplainer.types';

/**
 * The role card at first run on the web: the onboarding frame held to the window's height, the
 * heading as its identity, and the card over its act. The act follows the card in every state, so
 * a failed read never keeps the person from their home.
 */
export function RoleExplainer({ words, read, namesPending: pending, onAct }: RoleExplainerProps) {
  return (
    <DoorFrame
      panes="onboarding"
      column="near"
      bounded
      identity={
        pending ? undefined : (
          <Text variant="h1" as="h1">
            {words.title}
          </Text>
        )
      }
    >
      <div className="hg-role-explainer">
        <RoleCard
          words={pending ? { ...words, credit: null } : words}
          layout="bounded"
          read={pending ? { kind: 'loading' } : read}
        />
        <div className="hg-role-explainer-act">
          <Button variant="primary" size="lg" fullWidth onClick={onAct}>
            {words.act}
          </Button>
          <Text variant="caption" color="secondary" align="center">
            {words.atAct}
          </Text>
        </div>
      </div>
    </DoorFrame>
  );
}
