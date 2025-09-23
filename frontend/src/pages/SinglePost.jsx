import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaAngleDoubleUp } from "react-icons/fa";

import Title from "../components/Title";
import Post from "../components/blog/post/Post";
import Extras from "../components/blog/post/Extras";
import PostSkeleton from "../components/blog/post/PostSkeleton";
import CommentsList from "../components/blog/post/CommentsList";

import { getBlogBySlug } from "../data/sanity/api";
import Footer from "../components/Footer";

export default function SinglePost() {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [error, setError] = useState(false);

    const [showScroll, setShowScroll] = useState(false); // Estado para controlar a visibilidade do botão

    useEffect(() => {
        if (!slug) return;

        getBlogBySlug(slug)
            .then(data => {
                console.log(data[0]);
                setPost(data[0]);
            })
            .catch(error => {
                setError(error);
            });
    }, [slug]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const checkScrollTop = () => {
        if (window.scrollY > 1100) {
            setShowScroll(true);
        } else {
            setShowScroll(false);
        }
    };

    useEffect(() => {
        window.addEventListener("scroll", checkScrollTop);
        return () => {
            window.removeEventListener("scroll", checkScrollTop);
        };
    }, []);

    return (
        <>
        <Title text={`${post ? post.title : "Post"} - Romulo de Moraes`} />
            
            <div className="h-full pt-0 md:pt-16 lg:pt-10">
                <div className="flex flex-col">
                    <div className="flex flex-col lg:flex-row gap-3 w-full justify-center items-center lg:items-start">
                        <div className="flex flex-col w-full gap-3 max-w-[780px] lg:ml-3">
                            {!post ? (
                                <PostSkeleton/>
                            ) : (
                                <Post post={post}/>
                            )}

                            <hr className="block dark:border-neutral-700 md:hidden m-3" />

                            <div className="hidden lg:block">
                                <CommentsList/>
                            </div>

                            <div className="hidden lg:block w-full max-w-[780px]">
                                <Footer/>
                            </div>
                        </div>
                        
                        <div className="w-full lg:mr-3 lg:w-72 max-w-[780px] h-full">
                            <Extras/>
                            <hr className="block dark:border-neutral-700 md:hidden m-3" />
                        </div>

                        <div className="w-full block max-w-[780px] lg:hidden">
                            <CommentsList/>
                        </div>

                        <div className="px-3 sm:px-0 flex lg:hidden max-w-[780px] justify-center w-full items-center">
                            <Footer/>
                        </div>
                    </div>
                    
                    {showScroll && (
                        <div
                            className="fixed z-[100] flex bottom-[75px] md:bottom-[15px] lg:bottom-20 right-[11px] md:right-[15px] lg:right-[25.8px] w-7 h-7 rounded-full bg-gray-300 dark:bg-[#2f3031] flex justify-center items-center cursor-pointer"
                            onClick={scrollToTop}
                        >
                            <span className="text-sm text-gray-500">
                                <FaAngleDoubleUp/>    
                            </span>
                        </div>
                    )}

                </div>
            </div>

        </>
    );
}
