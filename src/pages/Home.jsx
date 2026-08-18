import Hero from '../components/Hero';
import AudioCategories from '../components/AudioCategories';
import TopGear from '../components/TopGear';
import RecentlyViewedRow from '../components/RecentlyViewedRow';
import Testimonials from '../components/Testimonials';

const Home = () => {
    return (
        <>
            <Hero />
            <AudioCategories />
            <TopGear />
            <RecentlyViewedRow />
            <Testimonials />
        </>
    );
};

export default Home;
