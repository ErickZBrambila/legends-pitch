import { createImageUrlBuilder as imageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { sanityClient } from "./client";

const builder = imageUrlBuilder(sanityClient);

export function urlForImage(source: SanityImageSource): string {
  return builder.image(source).auto("format").url();
}
