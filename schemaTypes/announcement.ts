import { defineField, defineType } from "sanity";

export default defineType({
  name: "announcement",
  title: "Announcement",
  type: "document",
  fields: [
    defineField({ name: "team", title: "Team", type: "reference", to: [{ type: "team" }], validation: (r) => r.required() }),
    defineField({ name: "message", title: "Message (EN)", type: "text", rows: 4, validation: (r) => r.required() }),
    defineField({ name: "message_es", title: "Mensaje (ES)", type: "text", rows: 4 }),
    defineField({ name: "location", title: "Location Address", type: "string" }),
    defineField({ name: "eventTime", title: "Event Time", type: "datetime", description: "When the event happens — used for the weather forecast" }),
    defineField({ name: "locationLat", title: "Latitude", type: "number" }),
    defineField({ name: "locationLng", title: "Longitude", type: "number" }),
    defineField({ name: "author", title: "Coach", type: "string", validation: (r) => r.required() }),
    defineField({ name: "publishedAt", title: "Posted At", type: "datetime", validation: (r) => r.required() }),
    defineField({ name: "image", title: "Image (optional)", type: "image", options: { hotspot: true } }),
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
