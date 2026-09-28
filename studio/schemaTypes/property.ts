import {defineArrayMember, defineField, defineType} from 'sanity'

export const property = defineType({
  name: 'property',
  title: 'Property',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Property Name', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {hotspot: true},
      description: 'Property/brand logo shown in the app header.',
    }),
    defineField({name: 'pageTitle', title: 'Browser Tab Title', type: 'string', description: 'e.g. "SOS Concierge — Rathescar Grove"'}),
    defineField({name: 'location', title: 'Location Line', type: 'string', description: 'Shown under the property name, e.g. "Managed by SOS Stays"'}),
    defineField({name: 'hostPhone', title: 'Host Phone', type: 'string'}),
    defineField({name: 'whatsappNumber', title: 'WhatsApp Number', type: 'string', description: 'International format, e.g. "353894801345" (no +, no spaces) — used to build the wa.me link.'}),
    defineField({
      name: 'checkinMessageTemplate',
      title: 'Check-in Message Template',
      description: 'Property-specific directions shown alongside the guest\'s room number, pulled from their Uplisting booking. Use {{1}} where the room number should be inserted, e.g. "Head up the stairs — you\'re in Room {{1}}".',
      type: 'string',
    }),
    defineField({
      name: 'essentials',
      title: 'Essentials',
      type: 'object',
      fields: [
        defineField({name: 'wifiNetwork', title: 'Wifi Network', type: 'string'}),
        defineField({name: 'wifiPassword', title: 'Wifi Password', type: 'string'}),
        defineField({name: 'address', title: 'Address', type: 'text'}),
        defineField({name: 'checkInOut', title: 'Check-in / Check-out', type: 'text'}),
        defineField({name: 'parking', title: 'Parking', type: 'text'}),
        defineField({name: 'quietHours', title: 'Quiet Hours', type: 'string'}),
        defineField({
          name: 'additionalNotes',
          title: 'Additional Notes',
          description:
            'Extra property-specific notes shown at the end of the essentials list, e.g. signal quality, food delivery instructions. Not every property needs the same notes, so add as many or as few as apply here.',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'note',
              fields: [
                defineField({name: 'label', title: 'Label', type: 'string', description: 'e.g. "Message us"'}),
                defineField({name: 'text', title: 'Note', type: 'text', validation: (Rule) => Rule.required()}),
              ],
              preview: {select: {title: 'label', subtitle: 'text'}},
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'mealIntros',
      title: 'Food & Drink Intro Lines',
      description: 'Intro line shown above each Food & Drink category\'s cards. Leave blank to fall back to "Here you go:".',
      type: 'object',
      fields: [
        defineField({name: 'sitIn', title: 'Sit-in Restaurants Intro', type: 'string'}),
        defineField({name: 'takeaway', title: 'Takeaways Intro', type: 'string'}),
        defineField({name: 'pubs', title: 'Pubs Intro', type: 'string'}),
      ],
    }),
    defineField({
      name: 'foodVenues',
      title: 'Nearby Food & Drink',
      description: 'Restaurants, takeaways, and pubs this property recommends. Shared/reusable — pick from the general directory or add new ones there.',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'foodVenue'}]})],
    }),
    defineField({
      name: 'attractionVenues',
      title: 'Nearby Attractions',
      description: 'Attractions and walk trails this property recommends. Shared/reusable.',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'attractionVenue'}]})],
    }),
    defineField({
      name: 'travelVenues',
      title: 'Travel Options',
      description: 'Train, bus, airport, and taxi options this property recommends. Shared/reusable.',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'travelVenue'}]})],
    }),
    defineField({
      name: 'faqCategories',
      title: 'FAQs',
      description: 'FAQs are specific to this property, grouped into categories.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqCategory',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string', validation: (Rule) => Rule.required()}),
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {list: ['calendar', 'house', 'rules', 'wifi', 'clock', 'compass', 'phone']},
            }),
            defineField({
              name: 'questions',
              title: 'Questions',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'faqQuestion',
                  fields: [
                    defineField({name: 'question', title: 'Question', type: 'string', validation: (Rule) => Rule.required()}),
                    defineField({name: 'answer', title: 'Answer', type: 'text', validation: (Rule) => Rule.required()}),
                  ],
                  preview: {select: {title: 'question'}},
                }),
              ],
            }),
          ],
          preview: {select: {title: 'label'}},
        }),
      ],
    }),
  ],
})
