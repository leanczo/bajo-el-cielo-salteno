import { generateRSS } from 'pliny/utils/generate-rss.js'
import siteMetadata from '../data/siteMetadata.js'
import { readFileSync } from 'fs'

const allBlogs = JSON.parse(readFileSync('./.contentlayer/generated/Blog/_index.json', 'utf8'))

const rss = () => {
  generateRSS(siteMetadata, allBlogs)
  console.log('RSS feed generated...')
}
export default rss
