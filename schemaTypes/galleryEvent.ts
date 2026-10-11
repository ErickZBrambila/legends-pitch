import { defineField, defineType } from "sanity";

export default defineType({
  name: "galleryEvent",
  title: "Gallery Event",
  type: "document",
  fields: [
    defineField({ name: "team", title: "Team", type: "reference", to: [{ type: "team" }], validation: (r) => r.required() }),
    defineField({ name: "title", title: "Title (EN)", type: "string", validation: (r) => r.required() }),
    defineField({ name: "title_es", title: "Título (ES)", type: "string" }),
    defineField({ name: "date", title: "Date", type: "date", validation: (r) => r.required() }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "image", title: "Image", type: "image", options: { hotspot: true } }),
            defineField({ name: "alt", title: "Alt Text", type: "string" }),
          ],
          preview: { select: { media: "image", title: "alt" } },
        },
      ],
    }),
  ],
  preview: { select: { title: "title", subtitle: "date" } },
});
