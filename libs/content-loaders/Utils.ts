import fs from "fs"
import path from "path"
import { DIR, ARTICLE_FILE_NAME } from "./Constants"
import matter from "gray-matter"

import rehypeStringify from "rehype-stringify"
import unified from "unified"
import remarkParse from "remark-parse"
import remarkToRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeHighlight from "rehype-highlight"
import {
  makeImagePathReplacer,
  htmlAmpConverter,
  headerRemover,
} from "../../libs/unified-atatcher"

import htmlToText from "html-to-text"
import { formatDate } from "../date"

export const readFile = (slug: string) => {
  return fs.readFileSync(path.join(DIR, slug, ARTICLE_FILE_NAME), "utf8")
}
export type MarkDownInfo = {
  title: string
  published: Date
  tags: string
}
export type Summary = {
  title: string
  published: string
  tags: string[]
  summaryText: string
  path: string
}
export const toMatter = async (markdown: string) => {
  const matterResult = matter(markdown)
  const mdInfo = <MarkDownInfo>matterResult.data
  return {
    ...mdInfo,
    content: matterResult.content,
  }
}

export const markdownToAmpHtml = async (slug: string, markdown: string) => {
  const processer = unified()
    .use(remarkParse)
    .use(remarkToRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(makeImagePathReplacer(slug))
    .use(headerRemover)
    .use(rehypeHighlight)
    .use(htmlAmpConverter)
    .use(rehypeStringify)
  const parsedContent = await processer.process(markdown)
  const content = parsedContent.toString()
  const decodedHtml = content.replace(/&#x3C;/g, "<")
  return decodedHtml
}
export const markdownToHtml = async (markdown: string) => {
  const processer = unified()
    .use(remarkParse)
    .use(remarkToRehype, { allowDangerousHtml: true })
    .use(rehypeStringify)
  const parsedContent = await processer.process(markdown)
  const content = parsedContent.toString()
  const decodedHtml = content.replace(/&#x3C;/g, "<")
  return decodedHtml
}

export const extractSummaryFromHtml = (html: string) => {
  const plainBody = htmlToText.fromString(html)
  const summaryText = plainBody.substr(0, 120)
  return summaryText
}

export const listContentDirs = () => {
  const dirents = fs.readdirSync(DIR, { withFileTypes: true })
  return dirents
    .filter((dirent) => !dirent.isFile())
    .map((dirent) => dirent.name)
}

export const readSummary = async (slug: string) => {
  const raw = readFile(slug)
  const mdInfo = await toMatter(raw)
  const html = await markdownToHtml(mdInfo.content)
  return {
    title: mdInfo.title,
    published: formatDate(mdInfo.published),
    tags: mdInfo.tags.split(",").map((tag) => tag.trim()),
    summaryText: extractSummaryFromHtml(html),
    path: path.join("/posts/" + slug),
  }
}

export const readSummaries = async () => {
  const slugs = listContentDirs()
  const summaries: Summary[] = []
  for (const slug of slugs) {
    const summary = await readSummary(slug)
    summaries.push(summary)
  }
  return summaries
}
