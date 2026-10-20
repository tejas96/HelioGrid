import Svg, { Path } from 'react-native-svg';

/** The tick a checked box draws, in the ink it is given — `Checkbox`'s, and a multi-select card's. */
export function CheckboxTick({ ink }: { ink: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
      <Path
        d="M2.5 6.5L5 9l4.5-5"
        stroke={ink}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
