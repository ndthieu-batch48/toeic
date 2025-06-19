import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';

import './HomeSlideBanner.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import tmaImage from '../../assets/tma.png';
import toeic from '../../assets/toeic.jpg';
import ButtonComponent from '../ButtonComponent/ButtonComponent';

const slides = [
  {
    image: tmaImage,
    link: 'https://www.tmasolutions.vn/', // Đường dẫn khi nhấn button
    title: 'Best Software Company In Viet Nam, TMA Solutions',
    description: 'Explore more exciting things about company.',
  },
  {
    image: toeic,
    link: '/test', // Đường dẫn khác
    title: 'Explore Our Test Library',
    description: 'Browse through a variety of tests designed for all skill levels.',
  },
];

const Banner = () => {
  const navigate = useNavigate();

  const handleRedirect = (link) => {
    // Nếu link là URL ngoài, dùng window.location.href
    if (link.startsWith('http')) {
      window.location.href = link;
    } else {
      navigate(link); // Đường dẫn nội bộ
    }
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
  };

  return (
    <div className="container-fluid">
      <div className="home-banner">
        <Slider {...settings}>
          {slides.map((slide, index) => (
            <div key={index} className="slide">
              <div
                className="slide-image"
                style={{
                  backgroundImage: `url(${slide.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '50vh',
                }}>
                <div className="banner-content">
                  <h2>{slide.title}</h2>
                  <p>{slide.description}</p>
                  <ButtonComponent onClick={() => handleRedirect(slide.link)}>
                    Explore
                  </ButtonComponent>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default Banner;
