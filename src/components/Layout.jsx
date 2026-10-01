import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { PageSkeleton } from './Skeletons';

const Layout = () => {
    return (
        <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
                <Suspense fallback={<PageSkeleton />}>
                    <Outlet />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
