export const goBack = (navigation: any) => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  }
};

export const navigateTo = (navigation: any, screen: string, params?: any) => {
  navigation.navigate(screen, params);
};