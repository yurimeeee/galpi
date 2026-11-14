import { Alert, Platform, type AlertButton } from 'react-native';

/**
 * Drop-in replacement for `Alert.alert` that also works on web.
 *
 * `react-native-web` ships `Alert.alert` as an empty function, so every
 * confirm dialog's onPress (delete book, delete sentence, unlink account…)
 * silently never fired and every error toast was swallowed on the web build.
 *
 * Web mapping:
 *   - no buttons / one button  → `window.alert`, then that button's onPress
 *   - two or more buttons      → `window.confirm`; OK runs the last
 *     non-cancel button, Cancel runs the `style: 'cancel'` button (if any)
 *
 * Native delegates to `Alert.alert` unchanged.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  const cancel = buttons.find((b) => b.style === 'cancel');
  const confirmButtons = buttons.filter((b) => b !== cancel);
  // RN renders the last button as the primary action, so that's what "OK" means.
  const confirm = confirmButtons[confirmButtons.length - 1];

  if (window.confirm(text)) {
    confirm?.onPress?.();
  } else {
    cancel?.onPress?.();
  }
}
