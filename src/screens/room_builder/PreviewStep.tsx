import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';
import RealityKitView from '../../components/RoomScanner/RealityKitView.native';
import {makeStyles, useTheme} from '../../theme/useTheme';
import FloorPlan from './FloorPlan';
import {Opening, RoomShape, formatShort, roomPoints} from './roomGeometry';
import {SANS, Segmented, useStyles as useSharedStyles} from './ui';

// "Room preview" frames in the PlaDomus Figma file (nodes 4126:2628 and
// 4126:2725): 333 × 211 card, door/window legend in #306CFE
const OPENING_BLUE = '#306CFE';
const VIEW_HEIGHT = 211;

export default function PreviewStep({
  shape,
  lengths,
  openings,
  modelUrl,
  buildError,
  onRetry,
}: {
  shape: RoomShape;
  lengths: number[];
  openings: Opening[];
  // file:// URL of the built 3D room; null while it's being built
  modelUrl: string | null;
  buildError: string | null;
  onRetry: () => void;
}) {
  const styles = useStyles();
  const shared = useSharedStyles();
  const {colors} = useTheme();
  const [mode, setMode] = useState<'2d' | '3d'>('3d');
  // How the 3D view's load went: not finished, loaded, or failed.
  const [{roomLoaded, loadError}, setLoad] = useState<{
    roomLoaded: boolean;
    loadError: string | null;
  }>({roomLoaded: false, loadError: null});

  // A rebuilt room (after Edit) loads fresh
  useEffect(() => {
    setLoad({roomLoaded: false, loadError: null});
  }, [modelUrl]);

  const render3D = () => {
    const error = buildError ?? loadError;
    if (error) {
      return (
        <View style={styles.centre}>
          <Text style={styles.errorText}>Couldn't build the 3D room: {error}</Text>
          <TouchableOpacity onPress={onRetry} style={styles.retry}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <>
        {modelUrl && (
          <RealityKitView
            key={modelUrl}
            modelUrl={modelUrl}
            editingEnabled={false}
            startFromAbove
            style={{flex: 1}}
            onRoomLoaded={e => {
              if (e.nativeEvent.success) {
                setLoad({roomLoaded: true, loadError: null});
              } else {
                setLoad(l => ({
                  ...l,
                  loadError: e.nativeEvent.error ?? 'unknown error',
                }));
              }
            }}
          />
        )}
        {!roomLoaded && (
          <View style={[styles.centre, styles.overlay]}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.loadingText}>Building your room…</Text>
          </View>
        )}
      </>
    );
  };

  const doors = openings.filter(o => o.type === 'door');
  const windows = openings.filter(o => o.type === 'window');

  return (
    <View>
      <View style={{marginTop: 24}}>
        <Segmented
          variant="joined"
          options={[
            {id: '2d', label: '2D'},
            {id: '3d', label: '3D'},
          ]}
          value={mode}
          onChange={setMode}
        />
      </View>

      <Text style={[shared.title, {marginTop: 28}]}>Your room plan</Text>
      <Text style={shared.subtitle}>Review and adjust your layout before continuing</Text>

      <View style={styles.viewBox}>
        {mode === '3d' ? (
          render3D()
        ) : (
          <FloorPlan points={roomPoints(shape, lengths)} lengths={lengths} openings={openings} height={VIEW_HEIGHT} />
        )}
      </View>

      {openings.length === 0 ? (
        <Text style={styles.noOpenings}>No doors or windows added</Text>
      ) : (
        <View style={styles.legend}>
          <View style={styles.legendColumn}>
            {doors.map(o => (
              <LegendRow key={o.id} label="Door" kind="door" width={o.width} />
            ))}
          </View>
          <View style={styles.legendColumn}>
            {windows.map(o => (
              <LegendRow key={o.id} label="Window" kind="window" width={o.width} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function LegendRow({label, kind, width}: {label: string; kind: 'door' | 'window'; width: number}) {
  const styles = useStyles();
  return (
    <View style={styles.legendRow}>
      <Text style={styles.legendText}>{label}</Text>
      {kind === 'door' ? (
        // Quarter circle: straight top and left edges, curved swing
        <Svg width={27} height={29}>
          <Path d="M 1 1 L 26 1 A 25 27 0 0 1 1 28 Z" stroke={OPENING_BLUE} strokeWidth={1.5} fill="#FFFFFF" />
        </Svg>
      ) : (
        // Rounded pane with a thin bar through the middle
        <Svg width={51} height={9}>
          <Rect x={1} y={1} width={49} height={6.8} rx={3.4} stroke={OPENING_BLUE} strokeWidth={1} fill="#FFFFFF" />
          <Rect x={1} y={3.3} width={49} height={2.3} rx={1.15} stroke={OPENING_BLUE} strokeWidth={1} fill="#FFFFFF" />
        </Svg>
      )}
      <Text style={styles.legendText}>({formatShort(width)})</Text>
    </View>
  );
}

const useStyles = makeStyles(c => ({
  viewBox: {
    marginTop: 24,
    height: VIEW_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: c.surfaceMuted,
  },
  centre: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10},
  overlay: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.surfaceMuted},
  loadingText: {fontFamily: SANS, fontSize: 14, color: c.textSecondary},
  errorText: {fontFamily: SANS, fontSize: 14, color: c.danger, textAlign: 'center'},
  retry: {paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: c.brand},
  retryText: {fontFamily: SANS, fontSize: 14, color: c.textPrimary},
  noOpenings: {fontFamily: SANS, fontSize: 14, color: c.textMuted, marginTop: 20},
  legend: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 32},
  legendColumn: {gap: 12},
  legendRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  legendText: {fontFamily: SANS, fontSize: 16, color: c.text},
}));
