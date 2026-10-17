import { defineField, defineType } from "sanity";

export default defineType({
  name: "playerPhotoSubmission",
  title: "Player Photo Submission",
  type: "document",
  fields: [
    defineField({
      name: "player",
      title: "Player",
      type: "reference",
      to: [{ type: "player" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Approved", value: "approved" },
          { title: "Rejected", value: "rejected" },
        ],
      },
      initialValue: "pending",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "submittedAt",
      title: "Submitted At",
      type: "datetime",
    }),
  ],
  preview: {
    select: { playerName: "player.name", status: "status", media: "image" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prepare({ playerName, status, media }: any) {
      return { title: playerName ?? "Unknown", subtitle: status, media };
    },
  },
});
