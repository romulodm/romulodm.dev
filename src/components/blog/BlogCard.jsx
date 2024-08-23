import { useTranslation } from "react-i18next";
import { IoMdPricetag } from "react-icons/io";
import { Link } from "react-router-dom";

export default function BlogCard({author, language, title, titleImage, smallDescription, categories, date, slug}) {
    const { t } = useTranslation('blog')
    
    return (
        <article className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-600">
            <div className="flex justify-between items-center mb-5 text-gray-500">
                <span className="bg-blue-100 dark:bg-sky-950/60 text-blue-900 dark:text-neutral-400 text-sm font-medium flex items-center gap-1 px-1.5 py-0.5 rounded">
                        <img className="w-6 h-4 rounded object-cover" src={`./${language.code}.svg`} alt={language.code} />
                        {language.name}
                </span>
                <div className="flex items-center text-sm gap-1 dark:text-neutral-500">
                        {date}
                    </div>
            </div>

            <div className="relative">
                <Link to={'/blog/post/' + slug.current} key={slug.current}>
                    <img
                        src={titleImage}
                        alt="Card image cap"
                        className="w-full h-60 object-cover rounded-lg "
                    />
                </Link>
            </div>

            <div className="flex w-full gap-x-1.5 py-2 mt-1">
                {categories.map((item, index) => (
                    <div key={index} className="bg-blue-100 dark:bg-sky-950/60 text-blue-900 dark:text-neutral-400 text-sm font-medium flex items-center gap-1 px-[2.5px] py-1 rounded">
                            <IoMdPricetag />
                            {item}
                    </div>
                ))}
            </div>

            <Link to={'/blog/post/' + slug.current} key={slug.current}>
                <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-neutral-400">
                    {title.length > 40 ? title.substr(0, 40) + '...' : title}
                </h2>
            </Link>

            <p className="mb-5 font-light text-gray-500 dark:text-neutral-400/80">{smallDescription}</p>

            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1.5">
                    <img className="w-7 h-7 rounded-full object-cover" src={author?.image} alt="Author avatar." />
                    <p className="font-medium dark:text-neutral-300">
                        {author?.name}
                    </p>
                </div>
                <Link to={'/blog/post/' + slug.current} key={slug.current}>
                    <button className="inline-flex items-center p-4 rounded font-medium bg-blue-100 hover:bg-blue-200 dark:bg-sky-950/60 hover:dark:bg-sky-950/80  text-blue-900 dark:text-neutral-400">
                        {t('card-button')}
                        <svg className="ml-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </button>
                </Link>
                
            </div>
        </article> 
    )
}