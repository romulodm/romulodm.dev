import { Outlet } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';
import Mobilebar from '../components/navigation/Mobilebar';

const DefaultLayout = () => {
    return (
        <div className="h-full min-h-screen">
            <div className="flex flex-col md:flex-row mx-auto">
                <div className="hidden lg:block">
                    <Sidebar />
                </div>
                
                <div className="hidden sm:block lg:hidden">
                    <Navbar />
                </div>

                <main className="lg:ml-20 lg:mr-1.5 lg:mt-0 sm:mt-20 w-full">
                    <div className="overflow-auto">
                        <Outlet />
                    </div>
                </main>

                <div className="block sm:hidden">
                    <Mobilebar />
                </div>
            </div>
        </div>
    );
};

export default DefaultLayout;
