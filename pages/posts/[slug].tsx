import { GetStaticPaths, GetStaticProps, NextPage } from "next"
import path from "path"
import { listContentDirs, readContentFile } from "../../libs/content-loader"

export const getStaticPaths: GetStaticPaths<{ slug: string }> = async () => {
  const paths = listContentDirs().map((dirname) => ({
    params: {
      slug: path.parse(dirname).name,
    },
  }))
  return {
    paths,
    fallback: false,
  }
}
type SlugProps = {
  title: string
  published: string
  content: string
}

export const getStaticProps: GetStaticProps<
  SlugProps,
  { slug: string }
> = async (context) => {
  const content = await readContentFile({ slug: context.params.slug })
  return {
    props: { ...content },
  }
}

const Post: NextPage<SlugProps> = (props) => {
  return (
    <div>
      <div>{props.title} </div>
      <div>{props.published}</div>
      <div dangerouslySetInnerHTML={{ __html: props.content }}></div>
    </div>
  )
}

export default Post