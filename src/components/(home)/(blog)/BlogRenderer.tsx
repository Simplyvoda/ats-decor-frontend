import React, {useMemo} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import {
  PortableText,
  type PortableTextComponents,
} from '@portabletext/react-native';
import imageUrlBuilder from '@sanity/image-url';
import type {SanityImageSource} from '@sanity/image-url/lib/types/types';
import {BlogPost} from '../../../../interface/blog.interface';
import {makeStyles, useTheme} from '../../../theme/useTheme';
import {ThemeColors} from '../../../theme/colors';

const builder = imageUrlBuilder({
  projectId: 'qcm46niu',
  dataset: 'production',
});

const urlFor = (source: SanityImageSource) => builder.image(source);

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

type BlogStyles = ReturnType<typeof useStyles>;

// The renderers for each kind of block in a Sanity post (headings,
// paragraphs, images, lists…), drawn with the given theme. Built once per
// theme by usePortableTextComponents rather than on every render.
const buildPortableTextComponents = (
  styles: BlogStyles,
  colors: ThemeColors,
): PortableTextComponents => {
  const components: PortableTextComponents = {
    types: {
      image: ({value}) => {
        const src = value?.asset
          ? urlFor(value).width(800).auto('format').quality(75).url()
          : '';
        const alt = value.alt || 'Image';
        const caption = value.caption || '';

        return (
          <View
            style={[
              styles.figure,
              {
                alignItems:
                  value.alignment === 'left'
                    ? 'flex-start'
                    : value.alignment === 'right'
                      ? 'flex-end'
                      : 'center',
              },
            ]}>
            <Image
              // Sanity asset URLs are content-hashed, so it's safe to skip
              // revalidation and paint straight from cache.
              source={{uri: src, cache: 'force-cache'}}
              style={styles.image}
              resizeMode="cover"
              accessibilityLabel={alt}
            />
            {caption && <Text style={styles.figcaption}>{caption}</Text>}
          </View>
        );
      },

      tableBlock: ({value}) => {
        const table = value?.table;
        if (!table?.rows?.length) return null;

        return (
          <View style={styles.tableContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={styles.table}>
                {table.rows.map((row: any, rowIndex: number) => (
                  <View key={rowIndex} style={styles.tableRow}>
                    {row.cells.map((cell: any, cellIndex: number) => (
                      <View
                        key={cellIndex}
                        style={[
                          styles.tableCell,
                          rowIndex === 0 && styles.tableHeader,
                        ]}>
                        <Text
                          style={[
                            styles.tableCellText,
                            rowIndex === 0 && styles.tableHeaderText,
                          ]}>
                          {cell}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
            {value.caption && (
              <Text style={styles.tableCaption}>{value.caption}</Text>
            )}
          </View>
        );
      },

      ctaButton: ({value}) => {
        const handlePress = () => {
          Linking.openURL(value.url);
        };

        return (
          <TouchableOpacity
            style={[
              styles.ctaButton,
              value.style === 'secondary' && styles.ctaButtonSecondary,
            ]}
            onPress={handlePress}>
            <Text
              style={[
                styles.ctaButtonText,
                value.style === 'secondary' && styles.ctaButtonTextSecondary,
              ]}>
              {value.text}
            </Text>
          </TouchableOpacity>
        );
      },

      embed: ({value}) => {
        // Note: React Native doesn't support iframes directly
        // You might want to use react-native-webview for this
        const handlePress = () => {
          Linking.openURL(value.url);
        };

        return (
          <View style={styles.embedContainer}>
            <TouchableOpacity
              style={styles.embedPlaceholder}
              onPress={handlePress}>
              <Text style={styles.embedText}>Tap to open: {value.url}</Text>
            </TouchableOpacity>
            {value.caption && (
              <Text style={styles.embedCaption}>{value.caption}</Text>
            )}
          </View>
        );
      },

      twoColumns: ({value}) => {
        return (
          <View style={styles.twoColumns}>
            <View style={styles.columnLeft}>
              <PortableText
                value={value.columnLeft || []}
                components={components}
              />
            </View>
            <View style={styles.columnRight}>
              <PortableText
                value={value.columnRight || []}
                components={components}
              />
            </View>
          </View>
        );
      },
    },

    marks: {
      link: ({children, value}) => {
        const handlePress = () => {
          Linking.openURL(value?.href);
        };

        return (
          <Text style={styles.link} onPress={handlePress}>
            {children}
          </Text>
        );
      },

      internalLink: ({children, value}) => {
        // You'll need to handle internal navigation with your navigation library
        const handlePress = () => {
          // Example with React Navigation:
          // navigation.navigate('BlogPost', { slug: value?.slug });
          console.log('Navigate to:', `/blog/${value?.slug}`);
        };

        return (
          <Text style={styles.internalLink} onPress={handlePress}>
            {children}
          </Text>
        );
      },

      highlight: ({children}) => (
        <Text style={styles.highlight}>{children}</Text>
      ),

      sup: ({children}) => <Text style={styles.superscript}>{children}</Text>,

      sub: ({children}) => <Text style={styles.subscript}>{children}</Text>,

      color: ({children, value}) => (
        <Text style={{color: value.hex || colors.text}}>{children}</Text>
      ),
    },

    block: {
      h1: ({children}) => {
        return <Text style={styles.h1}>{children}</Text>;
      },

      h2: ({children}) => {
        // Note: React Native doesn't have IDs like HTML
        return <Text style={styles.h2}>{children}</Text>;
      },

      h3: ({children}) => {
        return <Text style={styles.h3}>{children}</Text>;
      },

      h4: ({children}) => {
        return <Text style={styles.h4}>{children}</Text>;
      },

      normal: ({children}) => <Text style={styles.paragraph}>{children}</Text>,

      blockquote: ({children}) => (
        <View style={styles.blockquoteContainer}>
          <Text style={styles.blockquote}>{children}</Text>
        </View>
      ),
    },

    list: {
      bullet: ({children}) => <View style={styles.list}>{children}</View>,
      number: ({children}) => <View style={styles.list}>{children}</View>,
    },

    listItem: {
      bullet: ({children}) => (
        <View style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listItemText}>{children}</Text>
        </View>
      ),
      number: ({children, index}) => (
        <View style={styles.listItem}>
          <Text style={styles.bullet}>{(index || 0) + 1}.</Text>
          <Text style={styles.listItemText}>{children}</Text>
        </View>
      ),
    },
  };
  return components;
};

// Renderers for <PortableText components={…}> in the current theme
export const usePortableTextComponents = (): PortableTextComponents => {
  const styles = useStyles();
  const {colors} = useTheme();
  return useMemo(
    () => buildPortableTextComponents(styles, colors),
    [styles, colors],
  );
};

const useStyles = makeStyles(c => ({
  // Images
  figure: {
    marginVertical: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  figcaption: {
    fontStyle: 'italic',
    fontSize: 14,
    color: c.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // Tables
  tableContainer: {
    marginVertical: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: c.borderStrong,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: c.borderStrong,
  },
  tableCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: c.borderStrong,
    minWidth: 100,
  },
  tableHeader: {
    backgroundColor: c.surfaceMuted,
  },
  tableCellText: {
    fontSize: 14,
    color: c.text,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: c.textPrimary,
  },
  tableCaption: {
    fontStyle: 'italic',
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 4,
  },

  // CTA Button
  ctaButton: {
    backgroundColor: c.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 16,
    alignSelf: 'flex-start',
  },
  ctaButtonSecondary: {
    backgroundColor: '#6b7280',
  },
  ctaButtonText: {
    color: c.onBrand,
    fontWeight: 'bold',
    fontSize: 16,
  },
  ctaButtonTextSecondary: {
    color: 'white',
  },

  // Embed
  embedContainer: {
    marginVertical: 16,
  },
  embedPlaceholder: {
    backgroundColor: c.surfaceMuted,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  embedText: {
    color: '#3b82f6',
    fontSize: 14,
  },
  embedCaption: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 4,
  },

  // Two Columns
  twoColumns: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  columnLeft: {
    flex: 1,
    paddingRight: 8,
  },
  columnRight: {
    flex: 1,
    paddingLeft: 8,
  },

  // Links
  link: {
    color: c.brand,
    textDecorationLine: 'underline',
  },
  internalLink: {
    color: c.brand,
    textDecorationLine: 'underline',
  },

  // Text formatting
  highlight: {
    backgroundColor: c.marker,
    paddingHorizontal: 2,
  },
  superscript: {
    fontSize: 10,
    lineHeight: 10,
  },
  subscript: {
    fontSize: 10,
    lineHeight: 20,
  },

  // Headings
  h1: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 30,
    fontWeight: '600',
    color: c.text,
    marginVertical: 16,
  },
  h2: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 26,
    fontWeight: '600',
    color: c.text,
    marginVertical: 16,
  },
  h3: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 22,
    fontWeight: '600',
    color: c.text,
    marginVertical: 12,
  },
  h4: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 19,
    fontWeight: '600',
    color: c.text,
    marginVertical: 8,
  },

  // Text blocks
  paragraph: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    lineHeight: 24,
    color: c.text,
    marginVertical: 8,
  },
  blockquoteContainer: {
    borderLeftWidth: 4,
    borderLeftColor: c.brand,
    paddingLeft: 16,
    marginVertical: 16,
  },
  blockquote: {
    fontStyle: 'italic',
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    lineHeight: 24,
    color: c.textSecondary,
  },

  // Lists
  list: {
    marginVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    minWidth: 20,
    color: c.text,
  },
  listItemText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: c.text,
    flex: 1,
    lineHeight: 24,
  },
}));

// Usage in your component:
export const BlogPostRenderer = ({post}: {post: BlogPost}) => {
  const styles = useStyles();
  const portableTextComponents = usePortableTextComponents();
  return (
    <ScrollView style={{flex: 1, padding: 16}}>
      <Text style={styles.h1}>{post.title}</Text>
      <PortableText value={post.body} components={portableTextComponents} />
    </ScrollView>
  );
};
