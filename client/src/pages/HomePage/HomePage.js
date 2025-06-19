import React, { useState, useEffect, useRef } from 'react';

import HomeSlideBanner from '../../components/HomeSlideBanner/HomeSlideBanner';
import TestCard from '../../components/TestCard/TestCard';

import './HomePage.css';
import { useNavigate } from 'react-router-dom';

import RecentResults from '../../components/RecentResults/RecentResults';
import { fetchData } from '../../service/UserService';

import { useSelector } from 'react-redux';

const HomePage = () => {
  const [testData, setTestData] = useState([]);
  const [sortType, setSortType] = useState('newest');
  const [filterType, setFilterType] = useState('all');
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 992);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  const newTestSectionRef = useRef(null);
  const recentTestSectionRef = useRef(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetchData('/tests');
        setTestData(res);
      } catch (error) {
        console.log('Tests load fault!');
      }
    };
    fetchTests();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 992);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        } else {
          entry.target.classList.remove('is-visible');
        }
      });
    }, observerOptions);

    if (newTestSectionRef.current) observer.observe(newTestSectionRef.current);
    if (recentTestSectionRef.current) observer.observe(recentTestSectionRef.current);

    return () => observer.disconnect();
  }, [user.isLoggedIn]);

  const getSortedAndFilteredTests = () => {
    let filteredTests = [...testData];
    if (filterType !== 'all') {
      filteredTests = filteredTests.filter((test) => {
        if (!test.title) return false;
        const titleLower = test.title.toLowerCase();
        if (filterType === 'test') {
          return titleLower.includes('full test');
        }
        return titleLower.includes(filterType.toLowerCase());
      });
    }

    switch (sortType) {
      case 'alphabet':
        return filteredTests.sort((a, b) => a.title.localeCompare(b.title));
      case 'newest':
        return filteredTests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return filteredTests.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      default:
        return filteredTests;
    }
  };

  const displayedTests = getSortedAndFilteredTests();
  const maxTests = isSmallScreen ? 10 : 20; // 10 cho xs/sm, 20 cho md trở lên

  return (
    <div className="home-page">
      <HomeSlideBanner />
      <section className="new-tests-section" ref={newTestSectionRef}>
        <h2>NEW TESTS</h2>
        <div className="test-controls">
          <div className="filter__section">
            <label>Filter by type: </label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="full">Full test</option>
              <option value="reading">Reading</option>
              <option value="listening">Listening</option>
              <option value="writing">Writing</option>
              <option value="speaking">Speaking</option>
            </select>
          </div>
          <div className="sort__section">
            <label>Sort by: </label>
            <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabet">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
        <div className="see-all">
          <a href="/test">All tests &gt; </a>
        </div>
        <div className="test-list">
          {displayedTests.length > 0 ? (
            displayedTests
              .slice(0, maxTests)
              .map((test) => (
                <TestCard
                  key={test.id}
                  title={test.title}
                  duration={test.duration}
                  questions={test.questions}
                  onClick={() => navigate(`/detailtest/${test?.id}`)}
                />
              ))
          ) : (
            <p style={{ marginLeft: 20 }}>No tests found for this filter.</p>
          )}
        </div>
      </section>
      {user.isLoggedIn && (
        <section className="recently-tests-section" ref={recentTestSectionRef}>
          <RecentResults />
        </section>
      )}
    </div>
  );
};

export default HomePage;
