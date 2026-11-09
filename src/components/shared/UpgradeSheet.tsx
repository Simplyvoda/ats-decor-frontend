import React from 'react';
import {Modal, Pressable, Text, TouchableOpacity, View} from 'react-native';
import {Crown} from 'lucide-react-native';
import {usePlan} from '../../context/PlanContext';
import {limitMessage} from '../../config/plans';
import {makeStyles, useTheme} from '../../theme/useTheme';
import useAfterModalClose from '../../hooks/useAfterModalClose';

// Opens whenever the user hits a plan limit: from a quick check before an
// action (usePlan().gate) or when the server refuses one. "See plans"
// goes to the plans screen.
export default function UpgradeSheet({onSeePlans}: {onSeePlans: () => void}) {
  const styles = useStyles();
  const {colors} = useTheme();
  const {upgrade, closeUpgrade} = usePlan();
  const {title, body} = limitMessage(upgrade?.feature, upgrade ?? undefined);
  const afterClose = useAfterModalClose();

  return (
    <Modal
      visible={upgrade !== null}
      transparent
      animationType="slide"
      onDismiss={afterClose.onDismiss}
      onRequestClose={closeUpgrade}>
      <Pressable style={styles.backdrop} onPress={closeUpgrade}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.iconWrap}>
            <Crown size={28} color={colors.brand} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <TouchableOpacity
            style={styles.primary}
            onPress={() => {
              closeUpgrade();
              afterClose.run(onSeePlans);
            }}>
            <Text style={styles.primaryText}>See plans</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={closeUpgrade}>
            <Text style={styles.secondaryText}>Not now</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles(c => ({
  backdrop: {flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end'},
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.borderStrong,
    marginBottom: 20,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: c.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 26,
    fontWeight: '600',
    color: c.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  primary: {
    backgroundColor: c.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    fontWeight: '600',
    color: c.onBrand,
  },
  secondary: {alignItems: 'center', paddingVertical: 14, marginTop: 4},
  secondaryText: {fontFamily: 'DM Sans', fontSize: 16, color: c.textPrimary},
}));
