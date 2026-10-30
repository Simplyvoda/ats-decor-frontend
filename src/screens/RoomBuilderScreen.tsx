import {useNavigation} from '@react-navigation/native';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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

export default function RoomBuilderScreen() {
  const navigation = useNavigation();
  const styles = useStyles();
  const shared = useSharedStyles();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState<Step>(0);
  const [shape, setShape] = useState<RoomShape>('rectangle');
  const [lengths, setLengths] = useState<number[]>(defaultLengths('rectangle'));
  const [ceiling, setCeiling] = useState(DEFAULT_CEILING);
  const [confirmed, setConfirmed] = useState(false);
  const [openings, setOpenings] = useState<Opening[]>([]);

  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
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

  const changeShape = (s: RoomShape) => {
    if (s === shape) {
      return;
    }
    setShape(s);
    setLengths(defaultLengths(s));
    setOpenings([]);
    setConfirmed(false);
  };

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
      setOpenings(kept);
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
    setModelUrl(null);
    setBuildError(null);
    const module = NativeModules.RoomBuilderModule;
    if (!module?.buildRoom) {
      setBuildError('not available on this device');
      return;
    }
    module
      .buildRoom(spec)
      .then((url: string) => !cancelled && setModelUrl(url))
      .catch((e: any) => !cancelled && setBuildError(e?.message ?? 'unknown error'));
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
              onWallChange={(i, v) => setLengths(prev => setWallLength(shape, prev, i, v))}
              ceiling={ceiling}
              onCeilingChange={setCeiling}
              confirmed={confirmed}
              onConfirmedChange={setConfirmed}
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
            onAdd={o => setOpenings(prev => [...prev, {...o, id: newId()}])}
            onRemove={id => setOpenings(prev => prev.filter(o => o.id !== id))}
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
