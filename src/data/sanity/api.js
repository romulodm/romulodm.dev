import sanityClient from './sanityConfig';

import imageUrlBuilder from '@sanity/image-url';

const blogFields = `
  title,
  slug,
  public,
  smallDescription,
  'titleImage': titleImage.asset->url,
  'categories': categories[]->title,
  date,
  'language': language->{name, code},
  'author': author->{name, 'image': image.asset->url},
  createdAt,
  updatedAt,
  content
`;

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source) {
  return builder.image(source);
}

export async function getAllBlogs() {
  try {
    const results = await sanityClient.fetch(`*[_type == "post"] | order(date desc) {${blogFields}}`);
    return results;
  } catch (error) {
    console.error('Erro ao buscar blogs:', error.message);
    throw error;
  }
}

export async function getPaginatedBlogs({ offset = 0, date = 'desc' } = { offset: 0, date: 'desc' }) {
  const results = await sanityClient.fetch(
    `*[_type == "post"] | order(date ${date}) {${blogFields}}[${offset}...${offset + 6}]`
  );
  console.log(results)
  return results;
}

export const onBlogUpdate = (slug) => {
  return sanityClient.listen(`*[_type == "post" && slug.current == $slug] {
    ${blogFields}
    content[]{..., "asset": asset->}
  }`, {slug})
}

export async function getBlogBySlug(slug) {
  const result = await sanityClient
    .fetch(`*[_type == "post" && slug.current == $slug] {
      ${blogFields}
    }`, {slug})
  console.log("aq",result)
  return result;
}
