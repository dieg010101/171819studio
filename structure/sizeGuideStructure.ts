import {ListItemBuilder} from 'sanity/structure'
import defineStructure from '../utils/defineStructure'

export default defineStructure<ListItemBuilder>((S) =>
  S.listItem()
    .title('Size Guides')
    .schemaType('sizeGuide')
    .child(S.documentTypeList('sizeGuide').title('Size Guides')),
)
