import { Avatar } from "@mui/material";
import { GoComment } from "react-icons/go";
import { BsThreeDots } from "react-icons/bs";
import { IoMdHeartEmpty } from "react-icons/io";

export default function Comment(props) {
    return(
        <div className="py-6 text-base bg-white rounded-lg dark:bg-gray-900">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <p className="flex items-center text-sm text-gray-900 dark:text-white font-semibold">
                        <Avatar 
                            className="w-9.5 h-9.5 rounded-full"
                            src="https://flowbite.com/docs/images/people/profile-picture-2.jpg"
                            alt="Profile picture" 
                            />
                    </p>
                    <div className="flex flex-col justify-left">
                        <p className="text-gray-900 dark:text-gray-400">
                            Michael Blue
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Feb. 8, 2022
                        </p>

                    </div>
                </div>
                <button id="dropdownComment1Button" data-dropdown-toggle="dropdownComment1"
                    className="inline-flex items-center p-2 text-sm font-medium text-center text-gray-500 dark:text-gray-400 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                    type="button">
                    <BsThreeDots/>
                </button>
                <div id="dropdownComment1"
                    className="hidden z-10 w-36 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600">
                    <ul className="py-1 text-sm text-gray-700 dark:text-gray-200"
                        aria-labelledby="dropdownComment1Button">
                        <li>
                            <a href="#"
                                className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Edit</a>
                        </li>
                        <li>
                            <a href="#"
                                className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Remove</a>
                        </li>
                        <li>
                            <a href="#"
                                className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Report</a>
                        </li>
                    </ul>
                </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400">Very straight-to-point div. Really worth time reading. Thank you! But tools are just the
                instruments for the UX designers. The knowledge of the design tools are as important as the
                creation of the design strategy.
            </p>
            
            <div className="flex items-center mt-4 space-x-4">
                <button 
                    type="button"
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 hover:underline dark:text-gray-400 font-medium"
                >
                    <IoMdHeartEmpty/>
                    124
                </button>

                <button 
                    type="button"
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-700 hover:underline dark:text-gray-400 font-medium"
                >
                    <GoComment/>
                    4
                </button>
            </div>
        </div>
    )
}
