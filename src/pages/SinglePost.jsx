import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Title from "../components/Title";
import Post from "../components/blog/post/Post";
import Extras from "../components/blog/post/Extras";
import PostSkeleton from "../components/blog/post/PostSkeleton";
import CommentsList from "../components/blog/post/CommentsList";

import { getBlogBySlug } from "../data/sanity/api";

export default function SinglePost() {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [error, setError] = useState(false);

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

    return (
        <>
        <Title text={`${post ? post.title : "Post"} - romulodm.dev`} />
            
            <div className="h-full pt-0 md:pt-16 lg:pt-10">
                <div className="flex flex-col lg:flex-row gap-3 w-full justify-center items-center lg:items-start">  {/* Altere items-center para items-start */}
                    
                    <div className="flex flex-col w-full gap-3 max-w-[780px] lg:ml-3">
                        {!post ? (
                            <PostSkeleton/>
                        ) : (
                            <Post post={post}/>
                        )}

                        <hr className="block md:hidden m-2" />


                        <CommentsList/>
                    </div>
                    
                    <div className="h-full">
                        <Extras/>
                    </div>
                    
                </div>
            </div>

        </>
    );
}
