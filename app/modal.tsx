import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  const navigation = useNavigation<any>();
  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="titleLarge">This is a modal</ThemedText>
      <Pressable onPress={() => navigation.navigate('Tabs', { screen: 'Home' })} style={styles.link}>
        <ThemedText variant="labelLarge">Go to home screen</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
