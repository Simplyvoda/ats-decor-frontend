import {ChevronLeft} from 'lucide-react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
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

export default function ChooseModelScreen() {
  const navigation = useNavigation();

  const [templates, setTemplates] = useState<IDesignTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
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

  const handleSelectTemplate = (template: IDesignTemplate) => {
    navigateTo(navigation, 'ARViewer', {modelUrl: template.model_url});
  };

  const renderTemplate = ({item}: {item: IDesignTemplate}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSelectTemplate(item)}
      activeOpacity={0.7}>
      {item.image_url ? (
        <Image source={{uri: item.image_url}} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
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
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchTemplates}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : templates.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            No models available yet. Check back soon.
          </Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={item => item.id}
          renderItem={renderTemplate}
          numColumns={2}
          contentContainerStyle={styles.grid}
        />
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
  errorText: {color: '#b00020', textAlign: 'center', marginBottom: 16},
  emptyText: {color: '#666', textAlign: 'center'},
  retryBtn: {
    backgroundColor: '#C4A962',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {color: 'white', fontWeight: '600'},
  grid: {paddingHorizontal: 12, paddingTop: 8, paddingBottom: 24},
  card: {flex: 1, margin: 8, alignItems: 'center', maxWidth: '47%'},
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
  },
  thumbnailPlaceholder: {
    backgroundColor: '#E8E0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInitial: {fontSize: 40, fontWeight: '700', color: '#C4A962'},
  title: {marginTop: 8, fontSize: 14, color: '#1a1a1a', textAlign: 'center'},
  typeTag: {fontSize: 11, color: '#999', marginTop: 2, textTransform: 'capitalize'},
});
