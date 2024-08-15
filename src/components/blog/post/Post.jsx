

import { Avatar } from "@mui/material";
import { IoMdPricetag } from "react-icons/io";

import PostContent from "./PostContent";

import moment from "moment";
import 'moment/dist/locale/pt-br';
import Infos from "./Infos";
moment.locale('pt-br')

export default function Post(props){
    return(
        <div className="flex w-full flex-col md:border rounded border-gray-200 overflow-hidden">
            <div className="w-full">
                <div className="p-2 md:p-5 w-full bg-white">
                    <img
                        className="w-full mb-3 h-72 rounded-lg"
                        src={props.post.titleImage}
                    />

                    <p className="flex items-center justify-between lg:py-1">
                        <div className="flex items-center">
                            <Avatar
                                src={props.post.author.image}
                                className="rounded-full h-[41px] w-[41px] object-cover mr-2"
                                alt="avatar"
                                />
                            <div className="flex flex-col">
                                <div className="font-bold">{props.post.author.name}</div>
                                <div className="text-sm text-gray-600">
                                    {moment(props.post.createdAt).format('LL')}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-x-1.5">
                            {props.post.categories.map((item, index) => (
                                <div
                                key={index}
                                className="bg-blue-100 text-blue-900 text-sm font-medium flex items-center gap-1 px-[2.5px] py-1 rounded"
                                >
                                    <IoMdPricetag />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </p>

                    <hr className="mt-3 mb-3" />
                    <Infos/>
                    <hr className="mt-3 mb-3" />

                    <h1 className="text-3xl font-bold">{props.post.title}</h1>
                    <h2 className="blog-detail-header-subtitle mb-3">
                        {props.post.smallDescription}
                    </h2>
                    
                    <PostContent content={props.post.content} />
                </div>

            </div>
        </div>
    )
}