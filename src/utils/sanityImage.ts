// Sanity CDN image URLs (cdn.sanity.io) serve the original uploaded file by
// default — appending these query params asks Sanity to resize/compress it
// server-side, so a multi-MB original isn't downloaded just to fill a small
// thumbnail box. Client-side resizeMode="cover" still does the final crop,
// so only width needs capping here.
export const sanityImageUrl = (url: string, width: number): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=${width}&auto=format&q=75`;
};
