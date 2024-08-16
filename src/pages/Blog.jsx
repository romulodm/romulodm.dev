import { useState, useEffect } from 'react';
import { getAllBlogs, getBlogBySlug } from '../data/sanity/api';
import Title from '../components/Title';
import FilteringMenu from '../components/blog/FilteringMenu';
import BlogCard from '../components/blog/BlogCard';
import BlogCardSkeleton from '../components/blog/BlogCardSkeleton';
import { useTranslation } from 'react-i18next';

import moment from "moment";
import 'moment/dist/locale/pt-br'
import Carousel from '../components/blog/carousel/Carousel';
moment.locale('pt-br');

export const BlogList = ({ data = [] }) => {
  return data.map(blog =>
    <BlogCard
      key={blog.slug}
      author={blog.author}
      language={blog.language}
      title={blog.title}
      titleImage={blog.titleImage}
      smallDescription={blog.smallDescription}
      categories={blog.categories}
      date={moment(blog.createdAt).fromNow()}
      slug={blog.slug}
    />
  );
};

export default function Blog() {
  const { t } = useTranslation('blog');

  const [blogs, setBlogs] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    view: { list: 0 },
    date: { asc: 0 }
  });

  useEffect(() => {
    setLoading(true);
    getAllBlogs()
      .then(data => {
        setBlogs(data.filter(blog => blog.public === true));
      })
      .catch(error => {
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Title text={t('page-title')} />
      <div className="flex flex-col w-full items-center justify-center h-full pt-4 md:pt-7 lg:pt-5">
        <div className="responsive-content">

          <div className="mx-auto sm:mt-10 lg:mt-4 max-w-screen-lg text-center mb-4">
            <p className="font-light text-gray-500 text-sm sm:text-lg">{t('title')}</p>
          </div> 

          <hr/>

          <Carousel/>
          
          <FilteringMenu/>

          {isLoading ? (
            <div className="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 mb-4">
              {Array(2).fill().map((_, index) => (
                <BlogCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 mb-3.5">
              <BlogList data={blogs} filter={filter} />
            </div>
          )}
        

        </div>
      </div>
    </>
  );
}
