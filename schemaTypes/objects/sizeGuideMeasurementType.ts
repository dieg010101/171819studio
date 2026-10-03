import {ThListIcon} from '@sanity/icons/ThList'
import {defineArrayMember, defineField, defineType} from 'sanity'

// One row of a size guide: a measurement name and one centimetre value per size
// column, in the same order as the guide's `sizes`.
export const sizeGuideMeasurementType = defineType({
  name: 'sizeGuideMeasurement',
  title: 'Measurement',
  type: 'object',
  icon: ThListIcon,
  fields: [
    defineField({
      name: 'label',
      title: 'Measurement',
      type: 'string',
      description: 'For example Waist, Front Rise or Sleeve Length.',
      validation: (rule) =>
        rule.custom((label) => {
          if (typeof label !== 'string' || label.trim() === '') {
            return 'Name this measurement.'
          }
          if (label !== label.trim()) {
            return 'Remove the spaces at the start or end of this name.'
          }
          return true
        }),
    }),
    defineField({
      name: 'values',
      title: 'Values (cm)',
      type: 'array',
      description: 'One value per size, in the same order as Sizes.',
      of: [
        defineArrayMember({
          type: 'number',
          validation: (rule) =>
            rule.custom((value) => {
              if (typeof value !== 'number' || !Number.isFinite(value)) {
                return 'Enter a number.'
              }
              if (value <= 0) {
                return 'Measurements must be greater than 0.'
              }
              return true
            }),
        }),
      ],
      validation: (rule) =>
        rule.custom((values, context) => {
          const document = context.document as {data?: {sizes?: unknown[]}} | undefined
          const sizeCount = document?.data?.sizes?.length ?? 0
          const valueCount = Array.isArray(values) ? values.length : 0
          // A guide with no sizes is reported on Sizes itself.
          if (sizeCount === 0 || valueCount === sizeCount) {
            return true
          }

          const label = (context.parent as {label?: string} | undefined)?.label?.trim()
          const name = label ? `"${label}"` : 'This measurement'
          return `${name} has ${valueCount} ${valueCount === 1 ? 'measurement' : 'measurements'}, but this guide defines ${sizeCount} ${sizeCount === 1 ? 'size' : 'sizes'}.`
        }),
    }),
  ],
  preview: {
    select: {
      label: 'label',
      values: 'values',
    },
    prepare({label, values}) {
      const list: unknown[] = Array.isArray(values) ? values : []
      const count = `${list.length} ${list.length === 1 ? 'value' : 'values'}`
      return {
        title: label || 'Untitled measurement',
        subtitle: list.length ? `${count}: ${list.join(' / ')} cm` : 'No values',
      }
    },
  },
})
