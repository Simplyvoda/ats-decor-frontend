import {ChevronLeft} from 'lucide-react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {goBack, navigateTo} from '../utils/navigation';
import DesignTemplateService from '../services/DesignTemplateService';
import {IDesignTemplate} from '../../interface/design-template.interface';

// Explicit pixel size (not a % width) so the Image has a size to resolve
// against inside the FlatList's numColumns grid — matches the furniture
// grid's ITEM_SIZE pattern in ARViewerScreen.
const GRID_PADDING = 12;
const CARD_MARGIN = 8;
const CARD_WIDTH =
  (Dimensions.get('window').width - GRID_PADDING * 2 - CARD_MARGIN * 2 * 2) / 2;

// Remote-only: the catalogue comes entirely from the backend (design
// templates seeded to the DB), so what appears here is managed in one place.
// The previously bundled on-device models (Stylized Apartment / Empty Room)
// were removed from this picker, but their .usdz files stay in the app
// bundle — designs saved from them reference bundle:// URLs that must keep
// resolving when reopened.
type ModelCardItem = {
  id: string;
  title: string;
  type?: string;
  thumbnail: any; // {uri} object or null
  modelUrl: string;
};

export default function ChooseModelScreen() {
  const navigation = useNavigation();

  const [templates, setTemplates] = useState<IDesignTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // we needed the templates seeded to the DB not localised
      const res = await DesignTemplateService.getTemplates();
      setTemplates(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load models',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const allItems: ModelCardItem[] = templates.map(t => ({
    id: t.id,
    title: t.title,
    type: t.type,
    thumbnail: t.image_url ? {uri: t.image_url} : null,
    modelUrl: t.model_url,
  }));

  const handleSelectTemplate = (item: ModelCardItem) => {
    navigateTo(navigation, 'ARViewer', {modelUrl: item.modelUrl});
  };

  const renderTemplate = ({item}: {item: ModelCardItem}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSelectTemplate(item)}
      activeOpacity={0.7}>
      {item.thumbnail ? (
        <Image source={item.thumbnail} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnail}>
          <Text style={styles.placeholderInitial}>{item.title[0]}</Text>
        </View>
      )}
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      {item.type ? (
        <Text style={styles.typeTag}>{item.type.replace(/-/g, ' ')}</Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack(navigation)} hitSlop={12}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose a model</Text>
        <View style={{width: 24}} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C4A962" />
        </View>
      ) : (
        <>
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchTemplates}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <FlatList
            data={allItems}
            keyExtractor={item => item.id}
            renderItem={renderTemplate}
            numColumns={2}
            contentContainerStyle={styles.grid}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptyText}>
                  No models available yet — check back soon.
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#FAF9F6'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {fontSize: 17, fontWeight: '600', color: '#1a1a1a'},
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FBEAEA',
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorText: {color: '#b00020', flex: 1, marginRight: 12},
  retryText: {color: '#b00020', fontWeight: '700'},
  emptyText: {color: '#999', fontSize: 14, textAlign: 'center', paddingVertical: 40},
  grid: {paddingHorizontal: GRID_PADDING, paddingTop: 8, paddingBottom: 24},
  card: {width: CARD_WIDTH, margin: CARD_MARGIN, alignItems: 'center'},
  thumbnail: {
    // Explicit height, not aspectRatio — for a require()'d local image,
    // Fabric can let the asset's own intrinsic pixel size (e.g. 512x512)
    // override an aspectRatio-derived height, which is what was actually
    // causing the two bundled thumbnails to render oversized. A literal
    // height leaves no ambiguity, matching the furniture grid's ITEM_SIZE
    // pattern (width + height, never aspectRatio) in ARViewerScreen.
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
    overflow: 'hidden',
  },
  placeholderInitial: {fontSize: 40, fontWeight: '700', color: '#C4A962'},
  title: {marginTop: 8, fontSize: 14, color: '#1a1a1a', textAlign: 'center'},
  typeTag: {fontSize: 11, color: '#999', marginTop: 2, textTransform: 'capitalize'},
});
