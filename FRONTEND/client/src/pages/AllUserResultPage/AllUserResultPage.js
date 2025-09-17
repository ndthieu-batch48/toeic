import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import ReactPaginate from 'react-paginate';
import './AllUserResultPage.css';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { point_listening, point_reading } from '../../components/Data';
import { fetchData } from '../../service/UserService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AllUserResultPage = () => {
  const user = useSelector((state) => state.user);
  const [allResultsData, setAllResultsData] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [points, setPoints] = useState({});
  const [rightListening, setRightListening] = useState({});
  const [rightReading, setRightReading] = useState({});
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    if (!user.isLoggedIn || !user.id) {
      navigate('/login');
    }
  }, [user.isLoggedIn, user.id, navigate]);

  // Fetch results
  useEffect(() => {
    const fetchResults = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const res = await fetchData(`history/results?user_id=${user.id}`, true); // ❌ Changed from '/history/get_result' to '/history/results'
        const results = Array.isArray(res) ? res : [];
        setAllResultsData(results);
        setFilteredResults(results);
      } catch (error) {
        console.error('Results load fault!', error);
        if (error.status === 401) {
          navigate('/login');
        } else {
          setAllResultsData([]);
          setFilteredResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [user?.id, navigate]);

  // Tính điểm cho từng history_id
  useEffect(() => {
    const calculatePoints = async () => {
      const updatedPoints = {};
      const readingCounts = {};
      const listeningCounts = {};
      for (const result of filteredResults) {
        try {
          const res = await fetchData(
            `history/result/detail?history_id=${result.history_id}`,
            true
          ); // ❌ Changed from '/generate_result' to '/history/generate_result'
          updatedPoints[result.history_id] =
            point_listening[res.right_listening] + point_reading[res.right_reading];
          readingCounts[result.history_id] = res.right_reading;
          listeningCounts[result.history_id] = res.right_listening;
        } catch (error) {
          console.log(`Error fetching points for history_id: ${result.history_id}`, error);
        }
      }
      setPoints(updatedPoints);
      setRightListening(listeningCounts);
      setRightReading(readingCounts);
    };
    calculatePoints();
  }, [filteredResults]);

  const handleFilter = () => {
    const filtered = allResultsData.filter((result) => {
      const resultDate = new Date(result.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return resultDate >= start && resultDate <= end;
    });
    setFilteredResults(filtered);
  };

  const lineChartData = {
    labels: filteredResults.map((result) => result.date),
    datasets: [
      {
        label: 'Tests Taken',
        data: filteredResults.map((_, index) => index + 1),
        borderColor: '#a9d5e9',
        backgroundColor: 'rgba(12, 15, 13, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
    },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Tests Taken' } },
    },
  };

  const [currentPage, setCurrentPage] = useState(0);
  const resultsPerPage = 5;

  const displayedResults = filteredResults.slice(
    currentPage * resultsPerPage,
    (currentPage + 1) * resultsPerPage
  );

  const handleDetail = (id, resultId) => {
    navigate(`/test/${id}/result/${resultId}`);
  };

  return (
    <div className="all-results">
      <h2>All Test Results</h2>
      {/* Kiểm tra nếu không có dữ liệu thì hiển thị thông báo */}
      {filteredResults.length === 0 ? (
        <div className="no-results">
          <h3>There is no information to show</h3>
        </div>
      ) : (
        <>
          {/* Bộ lọc ngày */}
          <div className="filter">
            <label>
              Start Date:
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label>
              End Date:
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
            <button onClick={handleFilter}>Filter</button>
          </div>

          <Line data={lineChartData} options={lineChartOptions} className="chart" />

          <table className="results-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Type</th>
                <th>Date</th>
                <th>Duration</th>
                <th>R/L</th>
                <th>Result</th>
                <th>Point</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayedResults.map((result, index) => (
                <tr key={index}>
                  <td>{result.testname || 'N/A'}</td>
                  <td>{result.type || 'N/A'}</td>
                  <td>{result.date ? new Date(result.date).toLocaleDateString() : 'N/A'}</td>
                  <td>{result.duration || 'N/A'}</td>
                  <td>
                    {rightReading[result.history_id] ?? 'Loading...'}/
                    {rightListening[result.history_id] ?? 'Loading...'}
                  </td>
                  <td>{result.score ?? 'N/A'}</td>
                  <td>{points[result.history_id] ?? 'Loading...'}</td>
                  <td>
                    <label
                      className="detail-label"
                      onClick={() => handleDetail(result.test_id, result.history_id)}>
                      Details
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ReactPaginate
            previousLabel={'← Previous'}
            nextLabel={'Next →'}
            pageCount={Math.ceil(filteredResults.length / resultsPerPage)}
            onPageChange={(data) => setCurrentPage(data.selected)}
            containerClassName={'pagination'}
            activeClassName={'active'}
          />
        </>
      )}
    </div>
  );
};

export default AllUserResultPage;
