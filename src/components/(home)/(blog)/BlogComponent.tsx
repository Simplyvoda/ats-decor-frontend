import React from 'react';
import {Image, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {ArrowDown, ArrowUp, BookOpen, Search, X} from 'lucide-react-native';
import {BlogPost} from '../../../../interface/blog.interface';
import {sanityImageUrl} from '../../../utils/sanityImage';
import {makeStyles, useTheme} from '../../../theme/useTheme';

type BlogHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  sort: 'ASC' | 'DESC';
  onToggleSort: () => void;
};

// Heading + search bar + sort toggle. Rendered once, above the paginated
// list of posts (see useBlogFeed / InitialScreen).
export const BlogHeader = ({
  search,
  onSearchChange,
  sort,
  onToggleSort,
}: BlogHeaderProps) => {
  const styles = useStyles();
  const {colors} = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.heading}>
        <BookOpen size={22} color={colors.brand} />
        <Text style={styles.headingText}>Design Inspiration</Text>
      </View>

      <View style={styles.controlsRow}>
        <View style={styles.searchBar}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={onSearchChange}
            placeholder="Search posts..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={8}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.sortBtn}
          onPress={onToggleSort}
          activeOpacity={0.7}>
          {sort === 'DESC' ? (
            <ArrowDown size={14} color={colors.text} />
          ) : (
            <ArrowUp size={14} color={colors.text} />
          )}
          <Text style={styles.sortBtnText}>
            {sort === 'DESC' ? 'Newest' : 'Oldest'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// A single post row — used as the FlatList renderItem in InitialScreen.
export const BlogPostRow = ({
  post,
  onPress,
}: {
  post: BlogPost;
  onPress: () => void;
}) => {
  const styles = useStyles();
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.75} onPress={onPress}>
      {post.mainImage?.asset?.url ? (
        <Image
          // Sanity asset URLs are content-hashed (a changed image gets a new
          // URL), so it's safe to skip revalidation and paint straight from
          // cache — avoids the reload flash when this row remounts. Capping
          // width server-side avoids downloading a full-res original for an
          // 100x80 box.
          source={{
            uri: sanityImageUrl(post.mainImage.asset.url, 300),
            cache: 'force-cache',
          }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.thumbnail} />
      )}
      <View style={styles.info}>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.meta}>
          {new Date(post.datePosted).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const useStyles = makeStyles(c => ({
  header: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  headingText: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 22,
    fontWeight: '600',
    color: c.text,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: c.text,
    padding: 0,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sortBtnText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: c.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  thumbnail: {
    width: 100,
    height: 80,
    borderRadius: 10,
    backgroundColor: c.surfaceMuted,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
    lineHeight: 21,
  },
  meta: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: c.textMuted,
  },
}));
