import { createImageUrlBuilder as imageUrlBuilder } from "@sanity/image-url";
import { sanityClient } from "./client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SanityImageSource = any;

const builder = imageUrlBuilder(sanityClient);

export function urlForImage(source: SanityImageSource): string {
  return builder.image(source).auto("format").url();
}
