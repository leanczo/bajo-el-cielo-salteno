import { readFileSync, writeFileSync } from 'fs'
import { allCoreContent } from 'pliny/utils/contentlayer.js'
import siteMetadata from '../data/siteMetadata.js'

const allBlogs = JSON.parse(readFileSync('./.contentlayer/generated/Blog/_index.json', 'utf8'))

const search = () => {
  if (siteMetadata?.search?.kbarConfig?.searchDocumentsPath) {
    writeFileSync(
      `public/${siteMetadata.search.kbarConfig.searchDocumentsPath}`,
      JSON.stringify(allCoreContent(allBlogs))
    )
    console.log('Local search index generated...')
  }
}
export default search
