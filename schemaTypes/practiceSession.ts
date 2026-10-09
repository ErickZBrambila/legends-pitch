import { defineField, defineType } from "sanity";

export default defineType({
  name: "practiceSession",
  title: "Practice / Match Session",
  type: "document",
  fields: [
    defineField({ name: "team", title: "Team", type: "reference", to: [{ type: "team" }] }),
    defineField({ name: "sessionName", title: "Session Name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "sessionType",
      title: "Type",
      type: "string",
      options: { list: [{ title: "Practice", value: "PRACTICE" }, { title: "Game", value: "GAME" }] },
    }),
    defineField({ name: "sessionDate", title: "Date", type: "datetime" }),
    defineField({
      name: "videos",
      title: "Videos",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "fileName", title: "File Name", type: "string" }),
            defineField({ name: "r2Url", title: "Video URL (R2)", type: "url" }),
            defineField({ name: "thumbnailUrl", title: "Thumbnail URL", type: "url" }),
            defineField({ name: "durationSeconds", title: "Duration (s)", type: "number" }),
            defineField({ name: "resolution", title: "Resolution", type: "string" }),
            defineField({
              name: "markers",
              title: "Markers",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    defineField({ name: "timeSeconds", title: "Time (s)", type: "number" }),
                    defineField({ name: "label", title: "Label", type: "string" }),
                  ],
                },
              ],
            }),
            defineField({
              name: "clips",
              title: "Highlight Clips",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    defineField({ name: "r2Url", title: "Clip URL (R2)", type: "url" }),
                    defineField({ name: "startSeconds", title: "Start (s)", type: "number" }),
                    defineField({ name: "endSeconds", title: "End (s)", type: "number" }),
                    defineField({ name: "label", title: "Label", type: "string" }),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: { title: "sessionName", subtitle: "sessionDate" },
    prepare({ title, subtitle }: { title: string; subtitle: string }) {
      return { title, subtitle: subtitle?.slice(0, 10) ?? "" };
    },
  },
});
