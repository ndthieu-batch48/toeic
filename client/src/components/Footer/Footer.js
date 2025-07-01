import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import './Footer.css';

import Logo from '../../assets/logo-removebg-preview.png';

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <div className="footer-logo-section">
        <img src={Logo} alt="Logo" className="footer-logo" />
        <p className="footer-description">
          The best platform to practice and prepare for TOEIC exams with unlimited access to
          resources.
        </p>
      </div>
      <div className="footer-social-section">
        <h3>Follow Us</h3>
        <div className="social-icons">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook">
            <FaFacebook className="social-icon" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter">
            <FaTwitter className="social-icon" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram">
            <FaInstagram className="social-icon" />
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube">
            <FaYoutube className="social-icon" />
          </a>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© 2024 TOEIC Practice. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
