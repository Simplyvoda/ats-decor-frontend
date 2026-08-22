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
import {images} from '../../assets/constants/images';

// Explicit pixel size (not a % width) so the Image has a size to resolve
// against inside the FlatList's numColumns grid — matches the furniture
// grid's ITEM_SIZE pattern in ARViewerScreen.
const GRID_PADDING = 12;
const CARD_MARGIN = 8;
const CARD_WIDTH =
  (Dimensions.get('window').width - GRID_PADDING * 2 - CARD_MARGIN * 2 * 2) / 2;

// Card shape shared by bundled local models and backend-fetched templates,
// so both render through the same list/card UI.
type ModelCardItem = {
  id: string;
  title: string;
  type?: string;
  thumbnail: any; // require()'d local image, {uri} object, or null
  modelUrl: string;
};

// Bundled on-device models — always available even without a backend.
// Thumbnails rendered via be/scripts/thumbgen (QuickLookThumbnailing).
const LOCAL_MODELS: ModelCardItem[] = [
  {
    id: 'local-stylized-apartment',
    title: 'Stylized Apartment',
    type: 'furnished apartment',
    thumbnail: images.stylized_apartment_thumb,
    modelUrl: 'bundle://Stylized_One_Unit_Apartment.usdz',
  },
  {
    id: 'local-empty-room',
    title: 'Empty Room',
    type: 'empty room',
    thumbnail: images.empty_room_thumb,
    modelUrl: 'bundle://empty_room.usdz',
  },
];

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

  const remoteItems: ModelCardItem[] = templates.map(t => ({
    id: t.id,
    title: t.title,
    type: t.type,
    thumbnail: t.image_url ? {uri: t.image_url} : null,
    modelUrl: t.model_url,
  }));
  const allItems: ModelCardItem[] = [...LOCAL_MODELS, ...remoteItems];

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
  grid: {paddingHorizontal: GRID_PADDING, paddingTop: 8, paddingBottom: 24},
  card: {width: CARD_WIDTH, margin: CARD_MARGIN, alignItems: 'center'},
  thumbnail: {
    width: CARD_WIDTH,
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
    overflow: 'hidden',
  },
  placeholderInitial: {fontSize: 40, fontWeight: '700', color: '#C4A962'},
  title: {marginTop: 8, fontSize: 14, color: '#1a1a1a', textAlign: 'center'},
  typeTag: {fontSize: 11, color: '#999', marginTop: 2, textTransform: 'capitalize'},
});
