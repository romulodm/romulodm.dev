import { Outlet } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Footer from '../components/Footer';

const DefaultLayout = () => {
    return (
    <div className="h-full min-h-screen">
        
        <Navbar/>

        <main className="w-full">
            
            <Outlet />
            
        </main>

        <Footer/>

    </div>
  );
};

export default DefaultLayout;
