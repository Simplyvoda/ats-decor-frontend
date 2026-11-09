import {Plus, X} from 'lucide-react-native';
import React, {useEffect, useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import Toast from 'react-native-toast-message';
import {makeStyles, useTheme} from '../../theme/useTheme';
import FloorPlan from './FloorPlan';
import {
  OPENING_LIMITS,
  Opening,
  OpeningType,
  RoomShape,
  centredOffset,
  formatShort,
  openingProblem,
  roomPoints,
  round2,
  wallLetter,
  wallSide,
} from './roomGeometry';
import {NumberStepper, PrimaryButton, SANS, Segmented, useStyles as useSharedStyles} from './ui';

export default function OpeningsStep({
  shape,
  lengths,
  openings,
  onAdd,
  onRemove,
}: {
  shape: RoomShape;
  lengths: number[];
  openings: Opening[];
  onAdd: (o: Omit<Opening, 'id'>) => void;
  onRemove: (id: string) => void;
}) {
  const styles = useStyles();
  const shared = useSharedStyles();
  const {colors} = useTheme();
  const points = roomPoints(shape, lengths);

  // The door/window being set up, before it's added.
  const [pending, setPending] = useState<{
    type: OpeningType;
    wall: number;
    width: number;
    offset: number;
  }>({
    type: 'door',
    wall: 0,
    width: OPENING_LIMITS.door.default,
    offset: centredOffset(lengths[0], OPENING_LIMITS.door.default),
  });
  const {type, wall, width, offset} = pending;
  const setType = (t: OpeningType) => setPending(p => ({...p, type: t}));
  const setWall = (w: number) => setPending(p => ({...p, wall: w}));
  const setOffset = (o: number) => setPending(p => ({...p, offset: o}));

  const wallLength = lengths[wall];
  const limits = OPENING_LIMITS[type];
  const maxWidth = Math.min(limits.max, wallLength);
  const maxOffset = Math.max(0, round2(wallLength - width));

  // Switching door/window or wall starts from a sensible size, centred
  useEffect(() => {
    const w = Math.min(OPENING_LIMITS[type].default, lengths[wall]);
    setPending(p => ({...p, width: w, offset: centredOffset(lengths[wall], w)}));
  }, [type, wall, lengths]);

  // Keep the position on the wall when the width grows
  const changeWidth = (w: number) => {
    setPending(p => ({
      ...p,
      width: w,
      offset: p.offset + w > wallLength ? Math.max(0, round2(wallLength - w)) : p.offset,
    }));
  };

  const add = () => {
    const problem = openingProblem(pending, lengths, openings);
    if (problem) {
      Toast.show({type: 'error', text1: problem});
      return;
    }
    onAdd(pending);
    Toast.show({
      type: 'success',
      text1: `${type === 'door' ? 'Door' : 'Window'} added to wall ${wallLetter(wall)}`,
    });
  };

  const noun = type === 'door' ? 'door' : 'window';

  return (
    <View>
      <View style={{marginTop: 24}}>
        <Segmented
          options={[
            {id: 'door', label: 'Doors'},
            {id: 'window', label: 'Windows'},
          ]}
          value={type}
          onChange={setType}
        />
      </View>

      <Text style={[shared.title, {marginTop: 28}]}>Add a {noun}</Text>
      <Text style={shared.subtitle}>Select a wall, then enter the {noun}'s width and position</Text>

      <View style={styles.formCard}>
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Wall</Text>
          <View style={styles.formControl}>
            <Dropdown
              data={points.map((_, i) => ({
                label: `${wallLetter(i)} (${wallSide(points, i)})`,
                value: i,
              }))}
              labelField="label"
              valueField="value"
              value={wall}
              onChange={item => setWall(item.value)}
              style={styles.dropdown}
              selectedTextStyle={styles.dropdownText}
              itemTextStyle={{color: colors.text}}
              containerStyle={{backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12}}
              activeColor={colors.highlight}
              iconColor={colors.icon}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Width</Text>
          <View style={styles.formControl}>
            <NumberStepper
              value={width}
              onChange={changeWidth}
              step={0.1}
              min={Math.min(limits.min, maxWidth)}
              max={maxWidth}
              format={formatShort}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Position</Text>
          <View style={styles.formControl}>
            <NumberStepper
              value={offset}
              onChange={setOffset}
              step={0.1}
              min={0}
              max={maxOffset}
              format={v => `${formatShort(v)} from left`}
            />
          </View>
        </View>

        <PrimaryButton
          label={`Add a ${noun}`}
          onPress={add}
          icon={<Plus size={20} color={colors.onBrand} />}
        />
      </View>

      {openings.length > 0 && (
        <View style={styles.chips}>
          {openings.map(o => (
            <View key={o.id} style={styles.chip}>
              <Text style={styles.chipText}>
                {o.type === 'door' ? 'Door' : 'Window'} · Wall {wallLetter(o.wall)} · {formatShort(o.width)}
              </Text>
              <TouchableOpacity
                onPress={() => onRemove(o.id)}
                hitSlop={8}
                accessibilityLabel={`Remove ${o.type} on wall ${wallLetter(o.wall)}`}>
                <X size={14} color={colors.icon} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.planBox}>
        <FloorPlan points={points} height={210} openings={openings} pendingOpening={pending} />
      </View>
      <Text style={styles.planHint}>
        Standing inside the room facing a wall, “from left” is measured from the corner on your left.
      </Text>
    </View>
  );
}

const useStyles = makeStyles(c => ({
  formCard: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  formRow: {flexDirection: 'row', alignItems: 'center'},
  formLabel: {width: 100, fontFamily: SANS, fontSize: 16, color: c.text},
  formControl: {flex: 1},
  dropdown: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.background,
    paddingHorizontal: 14,
  },
  dropdownText: {fontFamily: SANS, fontSize: 15, color: c.text},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: c.brandSoft,
  },
  chipText: {fontFamily: SANS, fontSize: 13, color: c.text},
  planBox: {marginTop: 24, borderRadius: 16, backgroundColor: c.surfaceMuted, paddingVertical: 4},
  planHint: {fontFamily: SANS, fontSize: 12, color: c.textMuted, marginTop: 8, lineHeight: 17},
}));
