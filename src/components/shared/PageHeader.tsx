import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {ChevronLeft} from 'lucide-react-native';
import {makeStyles, useTheme} from '../../theme/useTheme';

// Plain page header from the Recent Designs / My Rooms designs: back arrow
// and serif title, an optional gold count pill on the right, and a
// subtitle underneath.
export default function PageHeader({
  title,
  subtitle,
  count,
  onBack,
}: {
  title: string;
  subtitle?: string;
  // e.g. "3 rooms"; hidden when not given
  count?: string;
  onBack: () => void;
}) {
  const styles = useStyles();
  const {colors} = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={onBack}
          accessibilityLabel="Back"
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <ChevronLeft size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {count ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{count}</Text>
          </View>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles(c => ({
  wrap: {paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20},
  row: {flexDirection: 'row', alignItems: 'center', gap: 20},
  title: {
    flex: 1,
    fontFamily: 'Cormorant Garamond',
    fontSize: 30,
    fontWeight: '600',
    color: c.textPrimary,
  },
  pill: {
    backgroundColor: c.brandSoft,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pillText: {fontFamily: 'DM Sans', fontSize: 15, color: c.brand},
  subtitle: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    color: c.textPrimary,
    marginTop: 14,
  },
}));
