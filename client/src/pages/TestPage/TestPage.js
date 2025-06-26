import Pagination from '@mui/material/Pagination';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import Banner from '../../components/Banner/Banner';
import SearchBar from '../../components/SearchBar/SearchBar';
import TestCard from '../../components/TestCard/TestCard';
import { setAlertBox } from '../../redux/slides/userSlide';
import { fetchData } from '../../service/UserService';
import './TestPage.css';

const TestsPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [testData, setTestData] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // 3 cột x 5 hàng = 15 items mỗi trang

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetchData('/tests');
        const reversedTests = res.reverse();
        setTestData(reversedTests);
        setFilteredTests(reversedTests);
      } catch (error) {
        console.log('Fetch tests fault!');
        dispatch(
          setAlertBox({
            open: true,
            error: true,
            msg: 'Failed to load tests.',
          })
        );
      }
    };
    fetchTests();
  }, []);

  const handleSearch = (query) => {
    const filtered = testData.filter((test) =>
      test.title.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTests(filtered);
    setCurrentPage(1);
  };

  const debounceSearch = (query) => {
    clearTimeout(window.debounceTimeout);
    window.debounceTimeout = setTimeout(() => {
      handleSearch(query);
    }, 500);
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleTestClick = (testId) => {
    if (!user.isLoggedIn) {
      dispatch(
        setAlertBox({
          open: true,
          error: true,
          msg: 'Please login to view test details!',
        })
      );
      navigate('/login');
      return;
    }
    navigate(`/detailtest/${testId}`);
  };

  // Tính toán dữ liệu hiển thị theo trang
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTests = filteredTests.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="tests-page">
      <div className="left-section">
        <SearchBar onSearch={debounceSearch} />
        <h2 className="section-title">ALL TOEIC TESTS</h2>
        <div className="test-list">
          {paginatedTests.map((test, index) => (
            <TestCard
              key={index}
              title={test.title}
              duration={test.duration}
              questions={test.questions}
              //   onClick={() => navigate(`/detailtest/${test?.id}`)}
              onClick={() => handleTestClick(test?.id)}
            />
          ))}
        </div>
        <Pagination
          count={Math.ceil(filteredTests.length / itemsPerPage)}
          page={currentPage}
          onChange={handlePageChange}
          variant="outlined"
          shape="rounded"
          className="pagination"
        />
      </div>
      <div className="right-section">
        <Banner />
      </div>
    </div>
  );
};

export default TestsPage;
