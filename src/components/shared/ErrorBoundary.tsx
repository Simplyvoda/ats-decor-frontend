import React from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import * as Sentry from '@sentry/react-native';

type Props = {
  children: React.ReactNode;
  // Called by "Go back", before the screen is drawn again.
  onRecover: () => void;
};

type State = {error: Error | null; componentStack: string};

// Catches errors thrown while a screen is being drawn, which would
// otherwise close the app, and shows them instead with a way back.
//
// TEMPORARY: it shows the raw error and where it happened, to find the
// "open a design" crash. Before the App Store release, swap the details
// for a friendly message.
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = {error: null, componentStack: ''};

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {error};
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({componentStack: info.componentStack ?? ''});
    Sentry.captureException(error, {
      contexts: {react: {componentStack: info.componentStack ?? ''}},
    });
  }

  recover = () => {
    this.props.onRecover();
    this.setState({error: null, componentStack: ''});
  };

  render() {
    const {error, componentStack} = this.state;
    if (!error) {
      return this.props.children;
    }
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Something went wrong</Text>
        <ScrollView style={styles.details}>
          <Text selectable style={styles.message}>
            {String(error.message ?? error)}
          </Text>
          <Text selectable style={styles.stack}>
            {componentStack.trim().split('\n').slice(0, 12).join('\n')}
          </Text>
          <Text selectable style={styles.stack}>
            {String(error.stack ?? '').split('\n').slice(0, 8).join('\n')}
          </Text>
        </ScrollView>
        <TouchableOpacity style={styles.button} onPress={this.recover}>
          <Text style={styles.buttonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

// Fixed colours: the theme may be what broke.
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {fontSize: 22, fontWeight: '600', color: '#222222', marginBottom: 16},
  details: {flex: 1, marginBottom: 20},
  message: {fontSize: 15, color: '#B00020', marginBottom: 16},
  stack: {fontSize: 12, color: '#555555', marginBottom: 16},
  button: {
    backgroundColor: '#222222',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
});
