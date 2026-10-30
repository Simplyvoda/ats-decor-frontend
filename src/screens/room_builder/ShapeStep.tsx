import React from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import Svg, {Polygon} from 'react-native-svg';
import {makeStyles, useTheme} from '../../theme/useTheme';
import FloorPlan from './FloorPlan';
import {RoomShape, SHAPES, defaultLengths, roomPoints} from './roomGeometry';
import {SANS} from './ui';

// Outline drawn on each shape card
const ICON_POINTS: Record<RoomShape, string> = {
  lshape: '20,12 100,12 100,46 62,46 62,84 20,84',
  rectangle: '14,24 106,24 106,76 14,76',
  square: '32,14 88,14 88,70 32,70',
};

export default function ShapeStep({
  shape,
  onChange,
}: {
  shape: RoomShape;
  onChange: (shape: RoomShape) => void;
}) {
  const styles = useStyles();
  const {colors} = useTheme();

  return (
    <View>
      <View style={styles.preview}>
        <FloorPlan points={roomPoints(shape, defaultLengths(shape))} height={210} showLabels={false} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cards}
        style={styles.cardScroller}>
        {SHAPES.map(s => {
          const selected = s.id === shape;
          return (
            <TouchableOpacity
              key={s.id}
              onPress={() => onChange(s.id)}
              accessibilityRole="radio"
              accessibilityState={{selected}}
              style={[styles.card, selected && styles.cardSelected]}>
              <Svg width={120} height={96}>
                <Polygon
                  points={ICON_POINTS[s.id]}
                  fill="none"
                  stroke={colors.textPrimary}
                  strokeWidth={1}
                />
              </Svg>
              <Text style={styles.cardLabel}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles(c => ({
  preview: {
    marginTop: 24,
    borderRadius: 18,
    backgroundColor: c.surfaceMuted,
    overflow: 'hidden',
  },
  // Cards run edge to edge, past the page padding, like the design
  cardScroller: {marginHorizontal: -30, marginTop: 48},
  cards: {paddingHorizontal: 36, gap: 10},
  card: {
    width: 136,
    height: 124,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSelected: {borderColor: c.brand, borderWidth: 2},
  cardLabel: {fontFamily: SANS, fontSize: 15, color: c.text, marginTop: -6},
}));
