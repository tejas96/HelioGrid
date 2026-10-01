import type { ShellLoad } from '@heliogrid/data/react';
import type { ComposedHome } from '@heliogrid/domain';
import { presetName, SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Block } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../styles';

interface HomeBlocksProps {
  home: ComposedHome;
  load: ShellLoad;
  onRetry: () => void;
}

/**
 * The home's region (`M13-10`): one block for the home's own work and one per composed preset,
 * each preset named in its overline. Until each module's home lands, every block teaches — what
 * shows here and who to ask — never a blank (`M01-17`); the module replaces its block.
 */
export function HomeBlocks({ home, load, onRetry }: HomeBlocksProps) {
  const t = useTranslate();
  const state = load === 'ready' ? 'empty' : load === 'failed' ? 'error' : 'loading';
  return (
    <View style={styles.blockHeading}>
      {[home.home, ...home.composed].map((preset) => (
        <Block
          key={preset}
          overline={presetName(t, preset)}
          state={state}
          emptyTitle={t(SHELL.nothingAssigned)}
          emptyMessage={t(SHELL.workShowsHere)}
          errorTitle={t(SHELL.couldNotLoad)}
          errorMessage={t(SHELL.keepsFailing)}
          retryLabel={t(SHELL.tryAgain)}
          onRetry={onRetry}
        />
      ))}
    </View>
  );
}
