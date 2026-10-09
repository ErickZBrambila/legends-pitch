import { defineField, defineType } from "sanity";

export default defineType({
  name: "match",
  title: "Match",
  type: "document",
  fields: [
    defineField({ name: "team", title: "Team", type: "reference", to: [{ type: "team" }], validation: (r) => r.required() }),
    defineField({ name: "date", title: "Date & Time", type: "datetime", validation: (r) => r.required() }),
    defineField({ name: "opponent", title: "Opponent", type: "string", validation: (r) => r.required() }),
    defineField({ name: "location", title: "Location", type: "string" }),
    defineField({
      name: "homeAway",
      title: "Home / Away",
      type: "string",
      options: { list: ["home", "away"] },
      validation: (r) => r.required(),
    }),
    defineField({ name: "goalsFor", title: "Goals For", type: "number" }),
    defineField({ name: "goalsAgainst", title: "Goals Against", type: "number" }),
    defineField({
      name: "result",
      title: "Result",
      type: "string",
      options: {
        list: [
          { title: "Win", value: "W" },
          { title: "Loss", value: "L" },
          { title: "Draw", value: "D" },
        ],
      },
    }),
  ],
  preview: {
    select: { opponent: "opponent", date: "date", result: "result" },
    prepare({ opponent, date, result }: { opponent: string; date: string; result: string }) {
      return {
        title: `vs ${opponent}`,
        subtitle: `${date?.slice(0, 10) ?? ""} · ${result ?? "Upcoming"}`,
      };
    },
  },
});
