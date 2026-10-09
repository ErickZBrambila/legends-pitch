import { defineField, defineType } from "sanity";

export default defineType({
  name: "team",
  title: "Team",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Team Name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "ageGroup",
      title: "Age Group",
      type: "string",
      options: {
        list: [
          { title: "Under 11", value: "u11" },
          { title: "Under 12", value: "u12" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: "coachName", title: "Head Coach", type: "string" }),
    defineField({ name: "season", title: "Season (e.g. Summer 2026)", type: "string" }),
  ],
  preview: {
    select: { title: "name", subtitle: "ageGroup" },
  },
});
