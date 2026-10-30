import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import Svg, {Line, Path} from 'react-native-svg';
import RealityKitView from '../../components/RoomScanner/RealityKitView.native';
import {makeStyles, useTheme} from '../../theme/useTheme';
import FloorPlan from './FloorPlan';
import {Opening, RoomShape, formatShort, roomPoints} from './roomGeometry';
import {SANS, Segmented, useStyles as useSharedStyles} from './ui';

const OPENING_BLUE = '#3B6FE0';
const VIEW_HEIGHT = 260;

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
  const [roomLoaded, setRoomLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // A rebuilt room (after Edit) loads fresh
  useEffect(() => {
    setRoomLoaded(false);
    setLoadError(null);
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
            style={{flex: 1}}
            onRoomLoaded={e => {
              if (e.nativeEvent.success) {
                setRoomLoaded(true);
              } else {
                setLoadError(e.nativeEvent.error ?? 'unknown error');
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
      {mode === '3d' && roomLoaded && (
        <Text style={styles.gestureHint}>Drag to look around · pinch to zoom</Text>
      )}

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
        <Svg width={26} height={26}>
          <Line x1={2} y1={2} x2={2} y2={24} stroke={OPENING_BLUE} strokeWidth={1.5} />
          <Path d="M 2 24 A 22 22 0 0 0 24 2" stroke={OPENING_BLUE} strokeWidth={1.5} fill="none" />
        </Svg>
      ) : (
        <Svg width={52} height={10}>
          <Line x1={2} y1={3} x2={50} y2={3} stroke={OPENING_BLUE} strokeWidth={1.5} />
          <Line x1={2} y1={7} x2={50} y2={7} stroke={OPENING_BLUE} strokeWidth={1.5} />
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
  gestureHint: {fontFamily: SANS, fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 8},
  noOpenings: {fontFamily: SANS, fontSize: 14, color: c.textMuted, marginTop: 20},
  legend: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 24},
  legendColumn: {gap: 12},
  legendRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  legendText: {fontFamily: SANS, fontSize: 15, color: c.text},
}));
