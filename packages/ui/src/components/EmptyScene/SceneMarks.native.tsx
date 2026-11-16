import { Circle, Path, Rect } from 'react-native-svg';
import { markKey, type SceneMark } from './EmptyScene.marks';

/**
 * A scene layer's marks with no box: the `Svg` (or `G`)
 * that holds them sets the size, the stroke and the colour.
 */
export function SceneMarks({ marks }: { marks: readonly SceneMark[] }) {
  return (
    <>
      {marks.map((mark) => {
        if (mark.kind === 'path') return <Path key={markKey(mark)} d={mark.d} />;
        if (mark.kind === 'circle') {
          return <Circle key={markKey(mark)} cx={mark.cx} cy={mark.cy} r={mark.r} />;
        }
        return (
          <Rect
            key={markKey(mark)}
            x={mark.x}
            y={mark.y}
            width={mark.width}
            height={mark.height}
            rx={mark.rx}
          />
        );
      })}
    </>
  );
}
