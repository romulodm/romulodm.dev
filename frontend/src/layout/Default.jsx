import { Outlet } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';
import Mobilebar from '../components/navigation/Mobilebar';
import Announcement from '../components/Announcement';

const DefaultLayout = () => {
    return (
        <div className="h-full min-h-screen">
            <div className="flex flex-col md:flex-row">


                <div className="hidden lg:block">
                    <Sidebar />
                </div>

                <div className="hidden md:block lg:hidden">
                    <Navbar />
                </div>

                <main className="lg:pl-[74px] mb-16 sm:mb-0 lg:mt-[-24px] sm:mt-5 w-full">
                    <Announcement />
                    <div className="overflow-auto">
                        <Outlet />
                    </div>
                </main>

                <div className="block md:hidden">
                    <Mobilebar />
                </div>
            </div>
        </div>
    );
};

export default DefaultLayout;
