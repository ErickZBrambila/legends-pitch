import { defineField, defineType } from "sanity";

export default defineType({
  name: "highlightVideo",
  title: "Highlight Video",
  type: "document",
  fields: [
    defineField({ name: "team", title: "Team", type: "reference", to: [{ type: "team" }], validation: (r) => r.required() }),
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "youtubeId", title: "YouTube Video ID", type: "string", validation: (r) => r.required() }),
    defineField({ name: "event", title: "Event / Album Name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "order", title: "Sort Order", type: "number" }),
  ],
  preview: { select: { title: "title", subtitle: "event" } },
});
