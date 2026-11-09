import {useNavigation} from '@react-navigation/native';
import React, {useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  NativeModules,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {makeStyles} from '../theme/useTheme';
import {goBack, navigateTo} from '../utils/navigation';
import IntroStep from './room_builder/IntroStep';
import MeasurementsStep from './room_builder/MeasurementsStep';
import OpeningsStep from './room_builder/OpeningsStep';
import PreviewStep from './room_builder/PreviewStep';
import ShapeStep from './room_builder/ShapeStep';
import {
  DEFAULT_CEILING,
  Opening,
  RoomShape,
  allWallsValid,
  buildRoomSpec,
  defaultLengths,
  openingProblem,
  setWallLength,
} from './room_builder/roomGeometry';
import {
  OutlineButton,
  PrimaryButton,
  StepHeader,
  useStyles as useSharedStyles,
} from './room_builder/ui';

// Guided room builder — for phones that can't scan (no LiDAR), or anyone
// who'd rather type their room's measurements.
//
// Intro, then four steps: shape → wall lengths → doors and windows →
// preview. The preview step asks the native RoomBuilderModule to build a
// .usdz room from the measurements; "Continue to design" opens it in
// ARViewerScreen like a fresh scan, so furniture, saving and publishing
// all work the same way.
//
// All steps live in this one screen so the answers survive moving back
// and forth between them.

type Step = 0 | 1 | 2 | 3 | 4;

const STEP_TITLES: Record<Exclude<Step, 0>, string> = {
  1: 'Room Shape',
  2: 'Room Measurements',
  3: 'Openings',
  4: 'Room Preview',
};

let nextId = 1;
const newId = () => `opening-${Date.now()}-${nextId++}`;

// The user's answers about the room.
type RoomAnswers = {
  shape: RoomShape;
  lengths: number[];
  ceiling: number;
  confirmed: boolean;
  openings: Opening[];
};

type RoomAction =
  | {type: 'shapeChanged'; shape: RoomShape}
  | {type: 'wallChanged'; index: number; length: number}
  | {type: 'ceilingChanged'; ceiling: number}
  | {type: 'confirmedChanged'; confirmed: boolean}
  | {type: 'openingAdded'; opening: Omit<Opening, 'id'>}
  | {type: 'openingRemoved'; id: string}
  | {type: 'openingsReplaced'; openings: Opening[]};

const initialAnswers: RoomAnswers = {
  shape: 'rectangle',
  lengths: defaultLengths('rectangle'),
  ceiling: DEFAULT_CEILING,
  confirmed: false,
  openings: [],
};

function roomReducer(state: RoomAnswers, action: RoomAction): RoomAnswers {
  switch (action.type) {
    case 'shapeChanged':
      // A new shape starts over: its own default walls, no doors/windows,
      // and the measurements need confirming again.
      if (action.shape === state.shape) {
        return state;
      }
      return {
        ...state,
        shape: action.shape,
        lengths: defaultLengths(action.shape),
        openings: [],
        confirmed: false,
      };
    case 'wallChanged':
      return {
        ...state,
        lengths: setWallLength(
          state.shape,
          state.lengths,
          action.index,
          action.length,
        ),
      };
    case 'ceilingChanged':
      return {...state, ceiling: action.ceiling};
    case 'confirmedChanged':
      return {...state, confirmed: action.confirmed};
    case 'openingAdded':
      return {
        ...state,
        openings: [...state.openings, {...action.opening, id: newId()}],
      };
    case 'openingRemoved':
      return {
        ...state,
        openings: state.openings.filter(o => o.id !== action.id),
      };
    case 'openingsReplaced':
      return {...state, openings: action.openings};
  }
}

export default function RoomBuilderScreen() {
  const navigation = useNavigation();
  const styles = useStyles();
  const shared = useSharedStyles();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState<Step>(0);
  const [answers, dispatch] = useReducer(roomReducer, initialAnswers);
  const {shape, lengths, ceiling, confirmed, openings} = answers;

  // The 3D room built from the answers (step 4).
  const [{modelUrl, buildError}, setBuild] = useState<{
    modelUrl: string | null;
    buildError: string | null;
  }>({modelUrl: null, buildError: null});
  // Bumped by "Try again" to rebuild.
  const [buildAttempt, setBuildAttempt] = useState(0);

  const goToStep = useCallback((s: Step) => {
    setStep(s);
    scrollRef.current?.scrollTo({y: 0, animated: false});
  }, []);

  const back = useCallback(() => {
    if (step === 0) {
      goBack(navigation);
    } else {
      goToStep((step - 1) as Step);
    }
  }, [step, navigation, goToStep]);

  // Swiping back (iOS) or the Android back button steps back through the
  // flow instead of throwing all the answers away
  useEffect(() => {
    navigation.setOptions({gestureEnabled: step === 0});
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 0) {
        return false;
      }
      back();
      return true;
    });
    return () => sub.remove();
  }, [step, back, navigation]);

  const changeShape = (s: RoomShape) => dispatch({type: 'shapeChanged', shape: s});

  // Leaving the measurements step: doors/windows added earlier may no
  // longer fit if walls got shorter (after "Edit" on the preview)
  const continueFromMeasurements = () => {
    const kept: Opening[] = [];
    for (const o of openings) {
      if (!openingProblem(o, lengths, kept)) {
        kept.push(o);
      }
    }
    if (kept.length < openings.length) {
      const removed = openings.length - kept.length;
      Toast.show({
        type: 'info',
        text1: `${removed} door${removed > 1 ? 's/windows' : ' or window'} removed`,
        text2: "They didn't fit the new wall lengths",
      });
      dispatch({type: 'openingsReplaced', openings: kept});
    }
    goToStep(3);
  };

  // Build the 3D room whenever the preview is shown with new answers
  const spec = useMemo(
    () => JSON.stringify(buildRoomSpec(shape, lengths, ceiling, openings)),
    [shape, lengths, ceiling, openings],
  );
  useEffect(() => {
    if (step !== 4) {
      return;
    }
    let cancelled = false;
    setBuild({modelUrl: null, buildError: null});
    const module = NativeModules.RoomBuilderModule;
    if (!module?.buildRoom) {
      setBuild({modelUrl: null, buildError: 'not available on this device'});
      return;
    }
    module
      .buildRoom(spec)
      .then((url: string) => !cancelled && setBuild({modelUrl: url, buildError: null}))
      .catch(
        (e: any) =>
          !cancelled &&
          setBuild({modelUrl: null, buildError: e?.message ?? 'unknown error'}),
      );
    return () => {
      cancelled = true;
    };
  }, [step, spec, buildAttempt]);

  const continueToDesign = () => {
    if (!modelUrl) {
      return;
    }
    navigateTo(navigation, 'ARViewer', {modelUrl, fromScan: true, fromRoomBuilder: true});
  };

  if (step === 0) {
    return <IntroStep onBack={back} onContinue={() => goToStep(1)} />;
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={shared.title}>Select your room shape</Text>
            <Text style={shared.subtitle}>Select a shape and continue to enter your dimensions</Text>
            <ShapeStep shape={shape} onChange={changeShape} />
          </>
        );
      case 2:
        return (
          <>
            <Text style={shared.title}>Enter wall lengths</Text>
            <Text style={shared.subtitle}>Input the length of each wall</Text>
            <MeasurementsStep
              shape={shape}
              lengths={lengths}
              onWallChange={(i, v) => dispatch({type: 'wallChanged', index: i, length: v})}
              ceiling={ceiling}
              onCeilingChange={c => dispatch({type: 'ceilingChanged', ceiling: c})}
              confirmed={confirmed}
              onConfirmedChange={c => dispatch({type: 'confirmedChanged', confirmed: c})}
            />
          </>
        );
      case 3:
        return (
          <OpeningsStep
            key={shape}
            shape={shape}
            lengths={lengths}
            openings={openings}
            onAdd={o => dispatch({type: 'openingAdded', opening: o})}
            onRemove={id => dispatch({type: 'openingRemoved', id})}
          />
        );
      case 4:
        return (
          <PreviewStep
            shape={shape}
            lengths={lengths}
            openings={openings}
            modelUrl={modelUrl}
            buildError={buildError}
            onRetry={() => setBuildAttempt(n => n + 1)}
          />
        );
    }
  };

  const renderFooter = () => {
    switch (step) {
      case 1:
        return <PrimaryButton label="Continue" onPress={() => goToStep(2)} />;
      case 2:
        return (
          <PrimaryButton
            label="Continue"
            onPress={continueFromMeasurements}
            disabled={!confirmed || !allWallsValid(shape, lengths)}
          />
        );
      case 3:
        return <PrimaryButton label="Continue" onPress={() => goToStep(4)} />;
      case 4:
        return (
          <View style={{gap: 14}}>
            <OutlineButton label="Edit" onPress={() => goToStep(2)} />
            <PrimaryButton label="Continue to design" onPress={continueToDesign} disabled={!modelUrl} />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StepHeader title={STEP_TITLES[step]} step={step} onBack={back} />
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          {renderStep()}
        </ScrollView>
        <View style={styles.footer}>{renderFooter()}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(c => ({
  root: {flex: 1, backgroundColor: c.background},
  content: {paddingHorizontal: 30, paddingTop: 28, paddingBottom: 32},
  footer: {paddingHorizontal: 30, paddingTop: 12, paddingBottom: 8},
}));
