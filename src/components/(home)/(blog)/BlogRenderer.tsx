import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {PortableText} from '@portabletext/react-native';
import imageUrlBuilder from '@sanity/image-url';

const builder = imageUrlBuilder({
  projectId: 'qcm46niu',
  dataset: 'production',
});

const urlFor = (source) => builder.image(source);

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Fixed getTextContent function
function getTextContent(children) {
  if (typeof children === 'string') return stripHtmlTags(children);

  if (Array.isArray(children)) {
    return children.map(getTextContent).join('');
  }
  if (typeof children === 'object' && children?.props?.children) {
    return getTextContent(children.props.children);
  }
  if (typeof children === 'object' && children?.text) {
    return children.text;
  }
  return '';
}

export const portableTextComponents = {
  types: {
    image: ({value}) => {
      // You'll need to implement urlFor from @sanity/image-url
      const src = value?.asset?._ref
        ? `https://your-project-id.cdn.sanity.io/images/your-dataset/${value.asset._ref
            .replace('image-', '')
            .replace('-jpg', '.jpg')
            .replace('-png', '.png')}`
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
            source={{uri: src}}
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
              {table.rows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.tableRow}>
                  {row.cells.map((cell, cellIndex) => (
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
              components={portableTextComponents}
            />
          </View>
          <View style={styles.columnRight}>
            <PortableText
              value={value.columnRight || []}
              components={portableTextComponents}
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

    highlight: ({children}) => <Text style={styles.highlight}>{children}</Text>,

    sup: ({children}) => <Text style={styles.superscript}>{children}</Text>,

    sub: ({children}) => <Text style={styles.subscript}>{children}</Text>,

    color: ({children, value}) => (
      <Text style={{color: value.hex || '#000'}}>{children}</Text>
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

const styles = StyleSheet.create({
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
    color: '#555',
    marginTop: 4,
    textAlign: 'center',
  },

  // Tables
  tableContainer: {
    marginVertical: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    minWidth: 100,
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
  },
  tableCellText: {
    fontSize: 14,
  },
  tableHeaderText: {
    fontWeight: 'bold',
  },
  tableCaption: {
    fontStyle: 'italic',
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  // CTA Button
  ctaButton: {
    backgroundColor: '#3b82f6',
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
    color: 'white',
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
    backgroundColor: '#f3f4f6',
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
    color: '#666',
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
    color: '#3b82f6',
    textDecorationLine: 'underline',
    fontStyle: 'italic',
  },
  internalLink: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
    fontStyle: 'italic',
  },

  // Text formatting
  highlight: {
    backgroundColor: '#fef3c7',
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
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  h2: {
    fontSize: 28,
    fontWeight: '600',
    marginVertical: 16,
  },
  h3: {
    fontSize: 24,
    fontWeight: '500',
    marginVertical: 12,
  },
  h4: {
    fontSize: 20,
    fontWeight: '500',
    marginVertical: 8,
  },

  // Text blocks
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginVertical: 8,
  },
  blockquoteContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#d1d5db',
    paddingLeft: 16,
    marginVertical: 16,
  },
  blockquote: {
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
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
  },
  listItemText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 24,
  },
});

// Usage in your component:
export const BlogPostRenderer = ({post}) => {
  return (
    <ScrollView style={{flex: 1, padding: 16}}>
      <Text style={styles.h1}>{post.title}</Text>
      <PortableText value={post.body} components={portableTextComponents} />
    </ScrollView>
  );
};
