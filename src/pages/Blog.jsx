import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaRegFaceGrinBeamSweat } from "react-icons/fa6";

import Title from '../components/Title';
import Carousel from '../components/blog/carousel/Carousel';
import FilteringMenu from '../components/blog/FilteringMenu';
import BlogCard from '../components/blog/BlogCard';
import BlogCardSkeleton from '../components/blog/BlogCardSkeleton';

import { getAllBlogs } from '../data/sanity/api';

import moment from 'moment';
import 'moment/dist/locale/pt-br';
import Footer from '../components/Footer';
moment.locale('pt-br');

const NoResults = () => {
  const { t } = useTranslation('blog');
  return (
    <div className="flex mb-3 w-full items-center justify-center py-5 px-2 border dark:border-neutral-700">
      <div className="w-full max-w-xl flex flex-row gap-5 items-center">
        <FaRegFaceGrinBeamSweat className="w-32 h-full text-gray-300 dark:text-neutral-800"/>
        <div className="flex flex-col">
          <p className="font-bold md:text-3xl text-xl sm:text-2xl dark:text-neutral-300">{t('not-found-title')}</p>
          <p className="text-sm md:text-md text-gray-600 dark:text-neutral-500">{t('not-found-content')}</p>
        </div>
      </div>
    </div>
  );
};

export const BlogList = ({ data = [] }) => {
  if (data.length === 0) {
    return <NoResults/>;
  }

  return(
    <div className="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 mb-3.5">
      {data.map(blog => (
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
      ))}
    </div>
  );
};

export default function Blog() {
  const { t } = useTranslation('blog');
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filter, setFilter] = useState({
    search: '',
    language: 'all',
    theme: 'all',
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

  const filteredBlogs = blogs.filter(blog => {
    const searchTerm = filter.search.toLowerCase();
    const matchesSearch = searchTerm
      ? blog.title.toLowerCase().includes(searchTerm) ||
        blog.categories.some(category => category.toLowerCase().includes(searchTerm))
      : true;

    const matchesLanguage = filter.language === 'all' || blog.language === filter.language;
    const matchesTheme = filter.theme === 'all' || blog.categories.includes(filter.theme);

    return matchesSearch && matchesLanguage && matchesTheme;
  });

  if (error) {
    return <div className="text-red-500">{t('error-message')}</div>;
  }

  return (
    <>
      <Title text={t('page-title')} />
      <div className="flex flex-col w-full items-center justify-center h-full md:pt-7 lg:pt-5">
        <div className="responsive-content">
          <div className="mx-auto mt-4 sm:mt-1 md:mt-10 lg:mt-4 max-w-screen-lg text-center mb-4">
            <p className="font-light text-gray-500 dark:text-neutral-400/80 text-sm sm:text-lg">{t('title')}</p>
          </div>

          <hr className="dark:border-[#2f3031]" />
          <Carousel />
          
          <FilteringMenu onChange={setFilter} filter={filter} blogs={blogs} />

          {isLoading ? (
            <div className="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 mb-3.5">
              <BlogCardSkeleton />
              <BlogCardSkeleton />
            </div>
          ) : (
            <BlogList data={filteredBlogs} />
          )}
          
          <Footer/>

        </div>

      </div>
    </>
  );
}
