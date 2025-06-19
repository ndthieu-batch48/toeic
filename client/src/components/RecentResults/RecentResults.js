import React, { useState, useEffect } from 'react';
import './RecentResults.css';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { point_listening, point_reading } from '../../components/Data';
import { fetchData } from '../../service/UserService';
const RecentResults = () => {
  const [resultsData, setResultsData] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [points, setPoints] = useState({});
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    if (!user.isLoggedIn || !user.id) {
      navigate('/login');
      return;
    }
    const fetchResults = async () => {
      try {
        fetchData(`/get_result?user_id=${user.id}`, true)
          .then((res) => {
            setResultsData(res);
          })
          .catch((error) => {
            console.log('Fetch fault!');
          });
      } catch (error) {
        console.log(error);
      }
    };
    fetchResults();
  }, [user.isLoggedIn, user.id, navigate]);

  // Chỉ lấy 5 phần tử cuối cùng khi resultsData thay đổi
  useEffect(() => {
    if (Array.isArray(resultsData)) {
      setRecentResults(resultsData.slice(-4).reverse());
    }
  }, [resultsData]);

  const handleDetail = (id, resultId) => {
    navigate(`/test/${id}/result/${resultId}`);
  };

  // Tính điểm cho từng history_id
  useEffect(() => {
    const calculatePoints = async () => {
      const updatedPoints = {};
      for (const result of recentResults) {
        try {
          const res = await fetchData(`/generate_result?history_id=${result.history_id}`, true);
          updatedPoints[result.history_id] =
            point_listening[res.right_listening] + point_reading[res.right_reading];
        } catch (error) {
          console.log(`Error fetching points for history_id: ${result.history_id}`, error);
        }
      }
      setPoints(updatedPoints);
    };
    calculatePoints();
  }, [recentResults]);

  return (
    <div className="recent-results">
      <h2>RECENTLY RESULTS</h2>
      <div className="see-all">
        <a href="/viewallresult">All results &gt; </a>
      </div>
      <div className="result-cards">
        {recentResults.map((result, index) => (
          <div key={index} className="result-card">
            <h3>{result.testname}</h3>
            <span className={`test-type ${result.type === 'FullTest' ? 'full-test' : 'practice'}`}>
              {result.type}
            </span>
            {result.parts && (
              <div className="parts">
                {result.parts.map((part, idx) => (
                  <span key={idx} className="part">
                    {part}
                  </span>
                ))}
              </div>
            )}
            <p>Date: {result.date}</p>
            <p>Time done: {result.duration}</p>
            <p>Result: {result.score}</p>
            <p>Point: {points[result.history_id] ?? 'Loading...'}</p>
            <label
              className="detail-label"
              onClick={() => handleDetail(result.test_id, result.history_id)}>
              Details
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentResults;
