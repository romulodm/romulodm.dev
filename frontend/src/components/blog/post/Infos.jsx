import { IoMdHeartEmpty } from "react-icons/io";
import { IoEyeOutline } from "react-icons/io5";
import { GoComment } from "react-icons/go";
import { CiTwitter } from "react-icons/ci";

export default function Infos() {
    return (
        <div className="flex w-full px-1 md:px-0 flex-row justify-between py-2">
            <div className="flex gap-7">
                <div className="flex items-center justify-center flex-row group">
                    <button className="flex flex-row items-center justify-center gap-1 dark:text-neutral-300 hover:text-red-500">
                        <IoMdHeartEmpty className="text-md"/>
                        <div className="text-xs">0</div>
                    </button>
                </div>

                <div className="flex items-center justify-center flex-row">
                    <button className="flex flex-row items-center justify-center gap-1 dark:text-neutral-300 hover:text-blue-400">
                        <GoComment className="text-md "/>
                        <div className="text-xs">0</div>
                    </button>
                </div>

                <div className="flex items-center justify-center flex-row">
                    <div className="flex flex-row items-center justify-center gap-1 dark:text-neutral-300 hover:text-green-500">
                        <IoEyeOutline className="text-lg"/>
                        <div className="text-xs">0</div>
                    </div>
                </div>
            </div>

            <div className="flex gap-7">
                <div className="flex items-center justify-center flex-row">
                    <div className="flex flex-row items-center justify-center gap-1 dark:text-neutral-200 hover:text-[#00acee]">
                        <CiTwitter className="text-lg"/>
                    </div>
                </div>

            </div>
            
        </div>
    );
}
