import { defineField, defineType } from "sanity";

export default defineType({
  name: "player",
  title: "Player",
  type: "document",
  fields: [
    defineField({ name: "team", title: "Team", type: "reference", to: [{ type: "team" }], validation: (r) => r.required() }),
    defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "number", title: "Jersey Number", type: "number", validation: (r) => r.required() }),
    defineField({
      name: "position",
      title: "Position",
      type: "string",
      options: {
        list: [
          { title: "Goalkeeper", value: "GK" },
          { title: "Defender", value: "DEF" },
          { title: "Midfielder", value: "MID" },
          { title: "Forward", value: "FWD" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: "photo", title: "Photo", type: "image", options: { hotspot: true } }),
  ],
  orderings: [
    { title: "Jersey Number", name: "numberAsc", by: [{ field: "number", direction: "asc" }] },
  ],
  preview: {
    select: { title: "name", number: "number", media: "photo" },
    prepare({ title, number, media }: { title: string; number: number; media: unknown }) {
      return { title, subtitle: `#${number}`, media };
    },
  },
});
