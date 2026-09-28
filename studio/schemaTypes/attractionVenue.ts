import {defineArrayMember, defineField, defineType} from 'sanity'

export const attractionVenue = defineType({
  name: 'attractionVenue',
  title: 'Attraction Venue',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'subcategory',
      title: 'Subcategory',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {
        list: [
          {title: 'Other Attractions', value: 'otherAttractions'},
          {title: 'Walk Trails', value: 'walkTrails'},
        ],
      },
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({name: 'distance', title: 'Distance', type: 'string', description: 'e.g. "6.1 km"'}),
    defineField({name: 'rating', title: 'Rating', type: 'number', validation: (Rule) => Rule.min(0).max(5)}),
    defineField({name: 'reviewsCount', title: 'Reviews', type: 'string', description: 'e.g. "2,208" or "4 — small sample"'}),
    defineField({name: 'description', title: 'Description', type: 'text'}),
    defineField({name: 'mapsLink', title: 'Google Maps Link', type: 'url'}),
    defineField({name: 'secondaryLabel', title: 'Secondary Link Label', type: 'string'}),
    defineField({name: 'secondaryLink', title: 'Secondary Link URL', type: 'url'}),
    defineField({name: 'phone', title: 'Phone', type: 'string'}),
    defineField({name: 'photoUrl', title: 'Photo URL', type: 'url'}),
    defineField({name: 'photo', title: 'Photo', type: 'image'}),
    defineField({name: 'order', title: 'Sort Order', type: 'number'}),
  ],
  preview: {select: {title: 'name', subtitle: 'distance'}},
})
