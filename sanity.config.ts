import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";

export default defineConfig({
  name: "north-legends-fc",
  title: "North Legends FC",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  plugins: [structureTool()],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: { types: schemaTypes as any },
  basePath: "/studio",
});
