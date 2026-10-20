import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {makeStyles} from '../../theme/useTheme';

interface HeaderAction {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  action?: HeaderAction;
}

const SharedHeader = ({title, subtitle, action}: HeaderProps) => {
  const styles = useStyles();
  return (
    <View
      className="bg-brand px-5 pt-6 pb-2 h-[160px] relative flex flex-col"
      style={styles.container}>
      <Text className="font-cormorant text-[36px] text-white mb-1.5">
        {title ? title : 'PlaDomus'}
      </Text>

      {subtitle && (
        <Text className="font-dm-sans text-[15px] text-white opacity-90 mb-5">
          {subtitle}
        </Text>
      )}

      {action && (
        <View style={styles.actionCard}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={action.onPress}
            activeOpacity={0.85}>
            {action.icon}
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const useStyles = makeStyles(c => ({
  container: {
    zIndex: 1,
  },
  actionCard: {
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 16,
    position: 'absolute',
    bottom: -40,
    height: 94,
    width: '100%',
    alignSelf: 'center',
    marginTop: 20,
    shadowColor: c.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  actionBtn: {
    backgroundColor: c.brand,
    borderRadius: 10,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: '100%',
  },
  actionLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    fontWeight: '500',
    color: c.onBrand,
  },
}));

export default SharedHeader;
