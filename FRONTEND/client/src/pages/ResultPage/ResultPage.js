import {
  faCheck,
  faCircleCheck,
  faCircleExclamation,
  faCircleXmark,
  faClock,
  faLightbulb,
  faPenToSquare,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Banner from '../../components/Banner/Banner';
import { point_listening, point_reading } from '../../components/Data';
import { useReduxAlert } from '../../hook/useReduxAlert';
import { logError } from '../../log/logger';
import { fetchData } from '../../service/UserService';
import './ResultPage.css';

const ResultPage = () => {
  const navigate = useNavigate();
  const { showError } = useReduxAlert();
  const [selectedHistory, setSelectedHistory] = useState({});

  const { id, resultId } = useParams();

  // Gọi API
  useEffect(() => {
    const fetchTests = async () => {
      try {
        fetchData(`/history/result/detail?history_id=${resultId}`, true).then((res) => {
          if (res) {
            setSelectedHistory(res); // Cập nhật trực tiếp selectedHistory
          } else {
            showError('You do not have permission to view this test!');
            navigate('/'); // Chuyển về trang chủ nếu không hợp lệ
          }
        });
      } catch (error) {
        logError('ResultPage component', `/history/result/detail?history_id=${resultId}`, error);
      }
    };
    fetchTests();
  }, [resultId]);

  const handleBackHomeClick = () => navigate('/');
  const handleViewSolution = () => navigate(`/test/${id}/result/${resultId}/details`);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="results-page">
      <div className="left-section">
        <h3>Result Of Test: {id}</h3>
        <div className="container-button">
          <button
            className="view-result"
            style={{
              marginRight: '20px',
              color: '#fff',
            }}>
            View Result
          </button>
          <button className="back-home" onClick={handleBackHomeClick}>
            Back to home
          </button>
        </div>

        <div className="result-index">
          <div className="result-summary">
            <div className="icon-summary-text">
              <span>
                <FontAwesomeIcon icon={faCheck} />
              </span>
              <span>Result: </span>
              <span>
                {selectedHistory.correct_count}/
                {selectedHistory.correct_count +
                  selectedHistory.incorrect_count +
                  selectedHistory.no_answer}
              </span>
            </div>
            <div className="icon-summary-text">
              <span>
                <FontAwesomeIcon icon={faPenToSquare} />
              </span>
              <span>Accuracy:</span>
              <span>{selectedHistory.accuracy}%</span>
            </div>
            <div className="icon-summary-text">
              <span>
                <FontAwesomeIcon icon={faClock} />
              </span>
              <span>Duration:</span>
              <span>{formatTime(selectedHistory.duration)}</span>
            </div>
          </div>

          <div className="detail-index">
            <div className="icon-stat-text">
              <span>
                <FontAwesomeIcon icon={faCircleCheck} size="2xl" style={{ color: '#3eb151' }} />
              </span>
              <span style={{ color: '#3eb151' }}>Correct answer</span>
              <span>{selectedHistory.correct_count}</span>
            </div>
            <div className="icon-stat-text">
              <span>
                <FontAwesomeIcon icon={faCircleXmark} size="2xl" style={{ color: '#ce3b3b' }} />
              </span>
              <span style={{ color: '#ce3b3b' }}>Wrong answer</span>
              <span>{selectedHistory.incorrect_count}</span>
            </div>
            <div className="icon-stat-text">
              <span>
                <FontAwesomeIcon
                  icon={faCircleExclamation}
                  size="2xl"
                  style={{ color: '#616161' }}
                />
              </span>
              <span style={{ color: '#616161' }}>No answer</span>
              <span>{selectedHistory.no_answer}</span>
            </div>
          </div>
        </div>

        <h3>Solutions</h3>
        <button
          style={{
            background: '#fff',
          }}
          onClick={handleViewSolution}
          className="view-soluton">
          Detail solutions
        </button>

        <div className="icon-tip-text">
          <span>
            <FontAwesomeIcon icon={faLightbulb} size="2xl" style={{ color: '#74C0FC' }} />
          </span>
          <span> View detailed solutions to see all questions and answers.</span>
        </div>

        {/* Box hiển thị thông tin listening và reading */}
        {selectedHistory.right_listening !== undefined &&
          selectedHistory.right_reading !== undefined && (
            <div className="summary-box">
              <h4>
                Total Point:{' '}
                {point_listening[selectedHistory.right_listening] +
                  point_reading[selectedHistory.right_reading]}
              </h4>
              <p>
                <strong>Right Listening:</strong> {selectedHistory.right_listening}
              </p>
              <p>
                <strong>Right Reading:</strong> {selectedHistory.right_reading}
              </p>
            </div>
          )}
      </div>

      <div className="right-seciton">
        <Banner />
      </div>
    </div>
  );
};

export default ResultPage;
