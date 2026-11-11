// Pieces for the Mood Board screen: the board name dialog (new / rename),
// and a bottom sheet of tickable rows (which boards a design is on, or
// which saved designs are on a board).
import React, {useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Check, Plus} from 'lucide-react-native';
import {makeStyles, useTheme} from '../../../theme/useTheme';

export const BOARD_NAME_MAX = 60;

// Asks for a board name. `initial` is the current name when renaming.
export function BoardNameModal({
  visible,
  title,
  initial = '',
  saveLabel = 'Save',
  onClose,
  onSave,
  onDismiss,
}: {
  visible: boolean;
  title: string;
  initial?: string;
  saveLabel?: string;
  onClose: () => void;
  onSave: (name: string) => void;
  // iOS: called once the dialog has fully closed
  onDismiss?: () => void;
}) {
  const styles = useStyles();
  const {colors} = useTheme();
  const [name, setName] = useState(initial);
  const ok = !!name.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={() => setName(initial)}
      onDismiss={onDismiss}
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.dialogBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>{title}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="e.g. Cosy living room"
            placeholderTextColor={colors.textMuted}
            maxLength={BOARD_NAME_MAX}
            returnKeyType="done"
            onSubmitEditing={() => ok && onSave(name.trim())}
            autoFocus
            selectTextOnFocus
          />
          <View style={styles.dialogButtons}>
            <TouchableOpacity style={styles.secondary} onPress={onClose}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primary, !ok && styles.disabled]}
              disabled={!ok}
              onPress={() => onSave(name.trim())}>
              <Text style={styles.primaryText}>{saveLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export type ChecklistRow = {
  id: string;
  title: string;
  subtitle?: string;
  image?: React.ReactNode;
  checked: boolean;
};

// A bottom sheet of rows you tick and untick; each tap takes effect
// straight away (onToggle). `footer` is an extra action such as
// "New board".
export function ChecklistSheet({
  visible,
  title,
  subtitle,
  rows,
  loading,
  emptyText,
  footer,
  onToggle,
  onClose,
  onDismiss,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  rows: ChecklistRow[];
  loading?: boolean;
  emptyText: string;
  footer?: {label: string; onPress: () => void};
  onToggle: (row: ChecklistRow) => void;
  onClose: () => void;
  // iOS: called once the sheet has fully closed (see useAfterModalClose)
  onDismiss?: () => void;
}) {
  const styles = useStyles();
  const {colors} = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onDismiss={onDismiss}
      onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          {!!subtitle && <Text style={styles.sheetSubtitle}>{subtitle}</Text>}

          {loading ? (
            <ActivityIndicator style={styles.sheetLoader} color={colors.brand} />
          ) : (
            <ScrollView style={styles.sheetList}>
              {rows.length === 0 && (
                <Text style={styles.sheetEmpty}>{emptyText}</Text>
              )}
              {rows.map(row => (
                <TouchableOpacity
                  key={row.id}
                  style={styles.row}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: row.checked}}
                  onPress={() => onToggle(row)}>
                  {row.image}
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {row.title}
                    </Text>
                    {!!row.subtitle && (
                      <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
                    )}
                  </View>
                  <View
                    style={[styles.checkbox, row.checked && styles.checkboxOn]}>
                    {row.checked && <Check size={14} color={colors.onBrand} />}
                  </View>
                </TouchableOpacity>
              ))}
              {footer && (
                <TouchableOpacity style={styles.row} onPress={footer.onPress}>
                  <View style={styles.footerIcon}>
                    <Plus size={18} color={colors.brand} />
                  </View>
                  <Text style={[styles.rowTitle, styles.footerText]}>
                    {footer.label}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.done} onPress={onClose}>
            <Text style={styles.primaryText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const ROW_IMAGE = 48;

const useStyles = makeStyles(c => ({
  dialogBackdrop: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialog: {backgroundColor: c.surface, borderRadius: 20, padding: 24},
  dialogTitle: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 22,
    fontWeight: '600',
    color: c.textPrimary,
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'DM Sans',
    fontSize: 16,
    color: c.text,
  },
  dialogButtons: {flexDirection: 'row', gap: 12, marginTop: 20},
  secondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: {fontFamily: 'DM Sans', fontSize: 15, color: c.text},
  primary: {
    flex: 1,
    backgroundColor: c.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    fontWeight: '600',
    color: c.onBrand,
  },
  disabled: {opacity: 0.5},

  sheetBackdrop: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.border,
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 22,
    fontWeight: '600',
    color: c.textPrimary,
  },
  sheetSubtitle: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    color: c.textMuted,
    marginTop: 2,
  },
  sheetLoader: {marginVertical: 32},
  sheetList: {marginTop: 12},
  sheetEmpty: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    lineHeight: 20,
    color: c.textSecondary,
    paddingVertical: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowText: {flex: 1},
  rowTitle: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  rowSubtitle: {fontFamily: 'DM Sans', fontSize: 13, color: c.textMuted},
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: c.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {backgroundColor: c.brand, borderColor: c.brand},
  footerIcon: {
    width: ROW_IMAGE,
    height: ROW_IMAGE,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {color: c.brand},
  done: {
    backgroundColor: c.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
}));
