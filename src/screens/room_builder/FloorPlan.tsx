import React, {useState} from 'react';
import {LayoutChangeEvent, View} from 'react-native';
import Svg, {Circle, G, Line, Path, Polygon, Text as SvgText} from 'react-native-svg';
import {useTheme} from '../../theme/useTheme';
import {Opening, Point, formatMetres, wallLetter} from './roomGeometry';

// Door/window blue from the designs
const OPENING_BLUE = '#306CFE';

type Props = {
  points: Point[];
  height: number;
  // Wall lengths; when given, each wall's label also shows its length
  lengths?: number[];
  // false hides the letters and dimension lines (shape picker preview)
  showLabels?: boolean;
  openings?: Opening[];
  // An opening still being set up, drawn faintly so the person can see
  // where it will go before tapping "Add"
  pendingOpening?: Omit<Opening, 'id'> | null;
};

// Draws the room from above, the way the designs show it: thick double-line
// walls, white corner dots, dimension lines with wall letters outside the
// room, door swings and window panes in blue.
export default function FloorPlan({
  points,
  height,
  lengths,
  showLabels = true,
  openings = [],
  pendingOpening,
}: Props) {
  const {colors, isDark} = useTheme();
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const ink = isDark ? colors.textPrimary : '#111111';
  const paper = isDark ? colors.surfaceMuted : '#FFFFFF';

  // Fit the plan into the box, leaving room for labels around it
  const pad = showLabels ? (lengths ? 48 : 36) : 20;
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const planW = Math.max(...xs) - minX || 1;
  const planH = Math.max(...ys) - minY || 1;
  const scale = Math.max(
    0,
    Math.min((width - pad * 2) / planW, (height - pad * 2) / planH),
  );
  const offX = (width - planW * scale) / 2;
  const offY = (height - planH * scale) / 2;
  const toScreen = (p: Point) => ({
    x: offX + (p.x - minX) * scale,
    y: offY + (p.y - minY) * scale,
  });

  const screenPts = points.map(toScreen);
  const polygon = screenPts.map(p => `${p.x},${p.y}`).join(' ');

  // Wall i: start, direction along it, and the outward direction (walls
  // run clockwise on screen, so outward is to the left of travel)
  const wallInfo = (i: number) => {
    const a = screenPts[i];
    const b = screenPts[(i + 1) % screenPts.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const dir = {x: (b.x - a.x) / len, y: (b.y - a.y) / len};
    const out = {x: dir.y, y: -dir.x};
    return {a, b, len, dir, out};
  };

  const renderOpening = (o: Omit<Opening, 'id'>, key: string, faint: boolean) => {
    if (o.wall >= screenPts.length) {
      return null;
    }
    const {a, dir, out} = wallInfo(o.wall);
    const start = {x: a.x + dir.x * o.offset * scale, y: a.y + dir.y * o.offset * scale};
    const w = o.width * scale;
    const end = {x: start.x + dir.x * w, y: start.y + dir.y * w};
    const opacity = faint ? 0.45 : 1;

    if (o.type === 'window') {
      // White gap in the wall with two thin blue lines across it
      const gap = 3;
      return (
        <G key={key} opacity={opacity}>
          <Line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={paper} strokeWidth={8} />
          {[-gap, gap].map(s => (
            <Line
              key={s}
              x1={start.x + out.x * s}
              y1={start.y + out.y * s}
              x2={end.x + out.x * s}
              y2={end.y + out.y * s}
              stroke={OPENING_BLUE}
              strokeWidth={1.5}
            />
          ))}
        </G>
      );
    }

    // Door: gap in the wall, a leaf swung into the room from the near
    // edge, and the quarter-circle it sweeps
    const inward = {x: -out.x, y: -out.y};
    const leafEnd = {x: start.x + inward.x * w, y: start.y + inward.y * w};
    return (
      <G key={key} opacity={opacity}>
        <Line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={paper} strokeWidth={8} />
        <Line
          x1={start.x}
          y1={start.y}
          x2={leafEnd.x}
          y2={leafEnd.y}
          stroke={OPENING_BLUE}
          strokeWidth={1.5}
        />
        <Path
          d={`M ${leafEnd.x} ${leafEnd.y} A ${w} ${w} 0 0 0 ${end.x} ${end.y}`}
          stroke={OPENING_BLUE}
          strokeWidth={1.5}
          fill="none"
        />
      </G>
    );
  };

  return (
    <View style={{height}} onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {/* Floor, then a thick wall outline with a thin light line inside
              it so walls read as double lines */}
          <Polygon points={polygon} fill={paper} />
          <Polygon points={polygon} fill="none" stroke={ink} strokeWidth={7} strokeLinejoin="miter" />
          <Polygon points={polygon} fill="none" stroke={paper} strokeWidth={1.5} strokeLinejoin="miter" />

          {openings.map(o => renderOpening(o, o.id, false))}
          {pendingOpening && renderOpening(pendingOpening, 'pending', true)}

          {screenPts.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={6} fill={paper} stroke={ink} strokeWidth={1.5} />
          ))}

          {showLabels &&
            screenPts.map((_, i) => {
              const {a, b, dir, out, len} = wallInfo(i);
              const gap = 16;
              const tick = 5;
              const p1 = {x: a.x + out.x * gap, y: a.y + out.y * gap};
              const p2 = {x: b.x + out.x * gap, y: b.y + out.y * gap};
              const mid = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2};
              const horizontal = Math.abs(dir.x) > Math.abs(dir.y);
              // Label sits beyond the dimension line, further out
              const labelDist = horizontal ? 12 : 26;
              const label = {x: mid.x + out.x * labelDist, y: mid.y + out.y * labelDist};
              const showLine = len > 24;
              return (
                <G key={`dim-${i}`}>
                  {showLine && (
                    <>
                      <Line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={ink} strokeWidth={1} />
                      {[p1, p2].map((p, k) => (
                        <Line
                          key={k}
                          x1={p.x - out.x * tick}
                          y1={p.y - out.y * tick}
                          x2={p.x + out.x * tick}
                          y2={p.y + out.y * tick}
                          stroke={ink}
                          strokeWidth={1}
                        />
                      ))}
                    </>
                  )}
                  <SvgText
                    x={label.x}
                    y={label.y + (lengths && out.y < 0 ? -6 : 4)}
                    fill={ink}
                    fontSize={10}
                    fontWeight="700"
                    textAnchor="middle">
                    {wallLetter(i)}
                  </SvgText>
                  {lengths && (
                    <SvgText
                      x={label.x}
                      y={label.y + (out.y < 0 ? 6 : 16)}
                      fill={ink}
                      fontSize={10}
                      fontWeight="600"
                      textAnchor="middle">
                      {formatMetres(lengths[i]).replace(' ', '')}
                    </SvgText>
                  )}
                </G>
              );
            })}
        </Svg>
      )}
    </View>
  );
}
