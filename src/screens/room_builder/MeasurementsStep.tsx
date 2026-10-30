import {Check} from 'lucide-react-native';
import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {makeStyles, useTheme} from '../../theme/useTheme';
import FloorPlan from './FloorPlan';
import {
  MAX_CEILING,
  MIN_CEILING,
  RoomShape,
  isWallEditable,
  roomPoints,
  wallLetter,
  wallProblem,
} from './roomGeometry';
import {LengthInput, NumberStepper, SANS, useStyles as useSharedStyles} from './ui';

export default function MeasurementsStep({
  shape,
  lengths,
  onWallChange,
  ceiling,
  onCeilingChange,
  confirmed,
  onConfirmedChange,
}: {
  shape: RoomShape;
  lengths: number[];
  onWallChange: (index: number, metres: number) => void;
  ceiling: number;
  onCeilingChange: (metres: number) => void;
  confirmed: boolean;
  onConfirmedChange: (v: boolean) => void;
}) {
  const styles = useStyles();
  const shared = useSharedStyles();
  const {colors} = useTheme();

  // Only draw the plan while every wall makes sense, otherwise keep the
  // last good outline out of the way
  const drawable = lengths.every((_, i) => wallProblem(shape, lengths, i) === null);

  const hintFor = (i: number) => {
    if (isWallEditable(shape, i)) {
      return undefined;
    }
    return i === 4 ? 'Worked out from walls A and C' : 'Worked out from walls B and D';
  };

  return (
    <View>
      <View style={styles.planBox}>
        {drawable ? (
          <FloorPlan points={roomPoints(shape, lengths)} lengths={lengths} height={230} />
        ) : (
          <View style={styles.planPlaceholder}>
            <Text style={styles.planPlaceholderText}>Fix the highlighted walls to see your room</Text>
          </View>
        )}
      </View>

      {shape !== 'square' && (
        <Text style={styles.note}>
          {shape === 'rectangle'
            ? 'Opposite walls of a rectangle are the same length, so they update together.'
            : 'Walls E and F are worked out from A–D.'}
        </Text>
      )}

      <View style={styles.fields}>
        {lengths.map((value, i) => (
          <LengthInput
            key={`${shape}-${i}`}
            label={`Wall ${wallLetter(i)} length`}
            value={value}
            onChange={v => onWallChange(i, v)}
            editable={isWallEditable(shape, i)}
            error={wallProblem(shape, lengths, i)}
            hint={hintFor(i)}
          />
        ))}

        <View style={shared.lengthCard}>
          <Text style={shared.fieldLabel}>Ceiling height</Text>
          <NumberStepper
            value={ceiling}
            onChange={onCeilingChange}
            step={0.05}
            min={MIN_CEILING}
            max={MAX_CEILING}
            format={v => `${v.toFixed(2)}m`}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.checkRow}
        onPress={() => onConfirmedChange(!confirmed)}
        accessibilityRole="checkbox"
        accessibilityState={{checked: confirmed}}>
        <View style={[styles.checkbox, confirmed && styles.checkboxOn]}>
          {confirmed && <Check size={16} color={colors.onBrand} strokeWidth={3} />}
        </View>
        <Text style={styles.checkText}>All measurements look good</Text>
      </TouchableOpacity>
    </View>
  );
}

const useStyles = makeStyles(c => ({
  // Grey band runs edge to edge, past the page padding
  planBox: {marginHorizontal: -30, marginTop: 24, backgroundColor: c.surfaceMuted, paddingVertical: 8},
  planPlaceholder: {height: 230, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40},
  planPlaceholderText: {fontFamily: SANS, fontSize: 14, color: c.textMuted, textAlign: 'center'},
  note: {fontFamily: SANS, fontSize: 13, color: c.textMuted, marginTop: 14, lineHeight: 18},
  fields: {gap: 16, marginTop: 24},
  checkRow: {flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20},
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: c.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {backgroundColor: c.brand, borderColor: c.brand},
  checkText: {fontFamily: SANS, fontSize: 14, color: c.text},
}));
