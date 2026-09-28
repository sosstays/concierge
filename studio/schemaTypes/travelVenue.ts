import {defineArrayMember, defineField, defineType} from 'sanity'

export const travelVenue = defineType({
  name: 'travelVenue',
  title: 'Travel Venue',
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
          {title: 'Train', value: 'train'},
          {title: 'Bus', value: 'bus'},
          {title: 'Airport', value: 'airport'},
          {title: 'Taxi', value: 'taxi'},
        ],
      },
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({name: 'distance', title: 'Distance', type: 'string'}),
    defineField({name: 'rating', title: 'Rating', type: 'number', validation: (Rule) => Rule.min(0).max(5)}),
    defineField({name: 'reviewsCount', title: 'Reviews', type: 'string'}),
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
