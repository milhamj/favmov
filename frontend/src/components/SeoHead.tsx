import { Helmet } from 'react-native-helmet-async'

const TITLE_DEFAULT = "FavMov: Your Movie Companion"
const DESCRIPTION_DEFAULT = "Never forget a movie again! FavMov helps you track your favorite movies and TV shows with ease."
const IMAGE_DEFAULT = "https://gdlqv951tx.ufs.sh/f/C0k8wbELmJeDtDKSEN5lFsRoy5udbUiPOBJn3qNS1IYepDvC"
const URL_DEFAULT = "https://favmov.milhamj.com"

interface SeoHeadProps {
  title?: string
  description?: string
  image?: string
  url?: string
}

export function SeoHead({
  title = TITLE_DEFAULT,
  description = DESCRIPTION_DEFAULT,
  image = IMAGE_DEFAULT,
  url = URL_DEFAULT,
}: SeoHeadProps) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </Helmet>
  )
}
