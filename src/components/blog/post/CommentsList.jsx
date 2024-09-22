import { Avatar } from "@mui/material";
import { GoComment } from "react-icons/go";
import { BsThreeDots } from "react-icons/bs";
import { IoMdHeartEmpty } from "react-icons/io";
import Comment from "./Comment";
import { useTranslation } from "react-i18next";

export default function CommentsList({ data = [] }) {
    const { t } = useTranslation('post')
    return (
    <div className="bg-white dark:bg-neutral-900 dark:border-neutral-800 py-5 md:border rounded lg:mb-4">
        <div className="p-2 md:p-5">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white/90">{t('comment-title')}</h2>
            </div>
            
            <form className="mb-6">
                <div className="py-2 px-4 mb-4 bg-white rounded rounded-t-lg border border-gray-200 dark:bg-neutral-800 dark:border-neutral-600">
                    <textarea id="comment" rows="6"
                        className="px-0 w-full text-sm text-gray-900 border-0 focus:ring-0 focus:outline-none dark:text-white dark:placeholder-neutral-400 dark:bg-neutral-800"
                        placeholder={t('comment-placeholder')} required></textarea>
                </div>
                <button type="submit"
                    className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-primary-800">
                    {t('comment-button')}
                </button>
            </form>

            {data.length < 1 ? (
                <div className="dark:text-neutral-400">
                    {t('comments-empty')}
                </div>

            ) : (
                data.map(comment =>
                    <Comment
                        key={comment.slug}
                        author={comment.author}
                        language={comment.language}
                        title={comment.title}
                        titleImage={comment.titleImage}
                        smallDescription={comment.smallDescription}
                        categories={comment.categories}
                        date={moment(comment.createdAt).fromNow()}
                        slug={comment.slug}
                    />
                )
            )}
            
        </div>
    </div>
    )
}