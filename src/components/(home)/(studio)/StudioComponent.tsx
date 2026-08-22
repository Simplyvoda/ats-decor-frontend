import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Lightbulb, Trash2} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import DesignService from '../../../services/DesignService';
import {IDesign} from '../../../../interface/design.interface';

const designTips = [
  {id: 1, text: 'Use the 60-30-10 rule for colour schemes'},
  {id: 2, text: 'Layer different textures for visual interest'},
  {id: 3, text: 'Mix high and low-end pieces'},
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const StudioComponent = () => {
  const navigation = useNavigation();
  const [designs, setDesigns] = useState<IDesign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DesignService.getDesigns()
      .then(res => setDesigns(res.data))
      .catch(err => console.warn('Failed to load designs:', err?.message ?? err))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (design: IDesign) => {
    Alert.alert('Delete scan', `Remove "${design.name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await DesignService.deleteDesign(design.id);
            setDesigns(prev => prev.filter(d => d.id !== design.id));
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Failed to delete');
          }
        },
      },
    ]);
  };

  return (
    <>
      {/* Welcome Back Card */}
      <View style={styles.welcomeCard}>
        <Text style={styles.cardTitle}>Welcome Back!</Text>
        <Text style={styles.cardSubtitle}>
          Ready to design your next cozy space?
        </Text>
        <View style={styles.tipsContainer}>
          {designTips.map(tip => (
            <View style={styles.tipItem} key={tip.id}>
              <Lightbulb size={16} color="#D4A574" style={styles.tipIcon} />
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Designs */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Design</Text>

        {loading ? (
          <ActivityIndicator color="#C1A36A" style={{marginVertical: 20}} />
        ) : designs.length === 0 ? (
          <Text style={styles.emptyText}>
            No saved scans yet — scan a room to get started.
          </Text>
        ) : (
          designs.map(design => (
            <TouchableOpacity
              key={design.id}
              style={styles.designItem}
              onPress={() =>
                (navigation as any).navigate('ARViewer', {
                  modelUrl: design.file_url,
                  designId: design.id,
                  furnitureLayout: design.furniture_layout,
                })
              }
              activeOpacity={0.7}>
              <View style={styles.designIcon}>
                {design.thumbnail_url ? (
                  <Image
                    source={{uri: design.thumbnail_url}}
                    style={styles.designThumbnail}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.designIconText}>3D</Text>
                )}
              </View>
              <View style={styles.designInfo}>
                <Text style={styles.designTitle} numberOfLines={1}>
                  {design.name}
                </Text>
                <Text style={styles.designStyle}>
                  {formatDate(design.createdAt)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(design)}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Trash2 size={18} color="#ccc" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  welcomeCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 40,
    borderRadius: 16,
    borderColor: '#2C2C2C33',
    borderWidth: 1,
  },
  cardTitle: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 16,
    fontFamily: 'DMSans-Regular',
    color: '#666',
    marginBottom: 20,
  },
  tipsContainer: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  recentSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderColor: '#2C2C2C33',
    borderWidth: 1,
  },
  sectionTitle: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
    paddingVertical: 16,
  },
  designItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  designIcon: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  designThumbnail: {
    width: '100%',
    height: '100%',
  },
  designIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C1A36A',
  },
  designInfo: {
    flex: 1,
  },
  designTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  designStyle: {
    fontSize: 14,
    color: '#999',
  },
});

export default StudioComponent;
