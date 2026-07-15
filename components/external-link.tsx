import { type ComponentProps } from 'react';
import { Linking, Pressable } from 'react-native';

type Props = Omit<ComponentProps<typeof Pressable>, 'onPress'> & { href: string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      onPress={() => {
        Linking.openURL(href);
      }}
    />
  );
}
