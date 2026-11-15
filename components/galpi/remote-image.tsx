import { Image } from 'expo-image';
import { cssInterop } from 'nativewind';

/**
 * expo-image for network images (book covers, uploaded page photos, the
 * profile photo): memory + disk cache and decoded-bitmap reuse that RN
 * Image lacks, so covers don't re-download and flash when a list remounts.
 * NativeWind doesn't know this component, so `className` is mapped to
 * `style` here — import RemoteImage from this file rather than Image from
 * expo-image so that registration has run.
 *
 * Share-card capture targets (sentence card, report card) stay on RN Image:
 * html2canvas ignores `object-fit`, so expo-image's <img> on web would come
 * out stretched in the exported PNG. Local picker previews stay too — a
 * file:// URI gains nothing from the cache.
 */
cssInterop(Image, { className: 'style' });

export { Image as RemoteImage };
