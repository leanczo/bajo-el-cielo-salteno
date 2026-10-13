import { generateSitemap } from 'pliny/utils/generate-sitemap.js'
import siteMetadata from '../data/siteMetadata.js'
import { readFileSync } from 'fs'

const allBlogs = JSON.parse(readFileSync('./.contentlayer/generated/Blog/_index.json', 'utf8'))

const sitemap = () => {
  generateSitemap(siteMetadata.siteUrl, allBlogs)
  console.log('Sitemap generated...')
}
export default sitemap
