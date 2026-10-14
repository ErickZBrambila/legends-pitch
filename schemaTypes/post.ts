import { defineField, defineType } from "sanity";

export default defineType({
  name: "post",
  title: "News Post",
  type: "document",
  fields: [
    defineField({ name: "team", title: "Team", type: "reference", to: [{ type: "team" }], validation: (r) => r.required() }),
    defineField({ name: "title", title: "Title (EN)", type: "string", validation: (r) => r.required() }),
    defineField({ name: "title_es", title: "Título (ES)", type: "string" }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "excerpt", title: "Excerpt (EN)", type: "text", rows: 2 }),
    defineField({ name: "excerpt_es", title: "Resumen (ES)", type: "text", rows: 2 }),
    defineField({ name: "body", title: "Body (EN)", type: "array", of: [{ type: "block" }] }),
    defineField({ name: "body_es", title: "Cuerpo (ES)", type: "array", of: [{ type: "block" }] }),
    defineField({ name: "publishedAt", title: "Published At", type: "datetime", validation: (r) => r.required() }),
    defineField({ name: "author", title: "Author", type: "string" }),
    defineField({ name: "coverImage", title: "Cover Image", type: "image", options: { hotspot: true } }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: { list: [{ title: "Draft", value: "draft" }, { title: "Published", value: "published" }] },
      initialValue: "published",
    }),
    defineField({ name: "sourceMatchId", title: "Source Match ID", type: "string", hidden: true }),
    defineField({ name: "sourceFreeFormContext", title: "Source Free-Form Context", type: "text", hidden: true }),
  ],
  preview: {
    select: { title: "title", subtitle: "publishedAt" },
    prepare({ title, subtitle }: { title: string; subtitle: string }) {
      return { title, subtitle: subtitle?.slice(0, 10) ?? "" };
    },
  },
});
