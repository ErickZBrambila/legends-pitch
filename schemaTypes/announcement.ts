import { defineField, defineType } from "sanity";

export default defineType({
  name: "announcement",
  title: "Announcement",
  type: "document",
  fields: [
    defineField({ name: "team", title: "Team", type: "reference", to: [{ type: "team" }], validation: (r) => r.required() }),
    defineField({ name: "message", title: "Message (EN)", type: "text", rows: 4, validation: (r) => r.required() }),
    defineField({ name: "message_es", title: "Mensaje (ES)", type: "text", rows: 4 }),
    defineField({ name: "author", title: "Coach", type: "string", validation: (r) => r.required() }),
    defineField({ name: "publishedAt", title: "Posted At", type: "datetime", validation: (r) => r.required() }),
  ],
  preview: {
    select: { title: "author", subtitle: "publishedAt", message: "message" },
    prepare({ title, subtitle, message }: { title: string; subtitle: string; message: string }) {
      return {
        title: `${title} — ${subtitle?.slice(0, 10) ?? ""}`,
        subtitle: message?.slice(0, 80) ?? "",
      };
    },
  },
});
