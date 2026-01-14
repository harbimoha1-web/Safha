// Web implementation - PagerView not supported on web
// Provides a stub so imports don't break
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';

// Stub component for web - just renders children in a ScrollView
const PagerView = React.forwardRef<any, any>(({ children, style, ...props }, ref) => {
  return (
    <ScrollView style={[styles.container, style]} {...props}>
      {children}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export { PagerView };
export default PagerView;
