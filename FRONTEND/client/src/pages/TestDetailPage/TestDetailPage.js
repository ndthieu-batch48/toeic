import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import PartSelection from '../../components/TestDetail/PartSelection';
import TabNavigation from '../../components/TestDetail/TabNavigation';
import TestInfo from '../../components/TestDetail/TestInfo';
import { useReduxAlert } from '../../hook/useReduxAlert';
import { useReduxUser } from '../../hook/useReduxUser';
import { logError } from '../../log/logger';
import { fetchData, deleteData } from '../../service/UserService';
import './TestDetailPage.css';

const TestDetailPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useReduxAlert();
  const { userState } = useReduxUser();
  const [activeTab, setActiveTab] = useState('practice');
  const [timeLimit, setTimeLimit] = useState('');
  const [hasSavedProgress, setHasSavedProgress] = useState(null);
  const [initialParts, setInitialParts] = useState([]); // Lưu trạng thái ban đầu của parts
  const [hasPartsChanged, setHasPartsChanged] = useState(false); // Theo dõi thay đổi parts

  const { id } = useParams();

  // Lấy dữ liệu từ api
  const [partData, setPartData] = useState([]);
  const [testPartData, setTestPartData] = useState([]);
  const [testInfo, setTestInfo] = useState({});
  const [parts, setParts] = useState([]);

  useEffect(() => {
    const fetchAPI = async () => {
      try {
        const tests = await fetchData('/tests');
        setTestInfo(tests.find((test) => test.id === Number(id)));

        const parts = await fetchData('/tests/part', true);
        setPartData(parts);

        const testParts = await fetchData('/tests/testpart');
        setTestPartData(testParts);
      } catch (error) {
        logError('TEST DETAIL PAGE', 'LOGGGG', error);
      }
    };
    fetchAPI();
  }, [id, userState.isLoggedIn]);

  useEffect(() => {
    if (testPartData.length > 0 && partData.length > 0) {
      const newParts = testPartData
        .filter((tp) => tp.test_id === Number(id))
        .map((tp) => partData.find((p) => p.id === tp.part_id))
        .filter((part) => part)
        .map((part) => ({
          id: part.id,
          name: part.title,
          questionCount: part.questionCount,
          partOrderNum: part.partOrderNum,
          selected: false,
        }));
      setParts(newParts);
      setInitialParts(newParts); // Lưu trạng thái ban đầu
    }
  }, [testPartData, partData, id]);

  // Chọn phần để thi thử
  const handlePartSelect = (id) => {
    const updatedParts = parts.map((part) =>
      part.id === id ? { ...part, selected: !part.selected } : part
    );
    setParts(updatedParts);
    // Kiểm tra xem parts có thay đổi so với trạng thái ban đầu không
    const hasChanged = updatedParts.some(
      (part, index) => part.selected !== initialParts[index].selected
    );
    setHasPartsChanged(hasChanged);
  };

  useEffect(() => {
    const checkSavedProgress = async () => {
      try {
        if (!userState?.id) {
          setHasSavedProgress(null);
          return;
        }
        const res = await fetchData(`/history/save?test_id=${id}`, true);
        // Chỉ set hasSavedProgress nếu có bản ghi "Saved" hợp lệ
        if (res && res.status === 'save') {
          setHasSavedProgress(res);
        } else {
          setHasSavedProgress(null);
        }
      } catch (error) {
        if (error.status === 404) {
          showSuccess('No saved progress found');
          setHasSavedProgress(null);
        } else {
          showError('Failed to check saved progress.');
          setHasSavedProgress(null);
        }
      }
    };
    if (userState.isLoggedIn) checkSavedProgress();
  }, [id, userState.isLoggedIn]);

  const StartPractice = async () => {
    if (!userState.isLoggedIn) {
      showSuccess('You have no login yet!');
      navigate('/login');
      return;
    }

    const selectedPartOrders = parts
      .filter((part) => part.selected)
      .map((part) => part.partOrderNum);

    if (selectedPartOrders.length === 0) {
      showError('Please select at least one part to start the practice test.');
      return;
    }

    // const userState = JSON.parse(localStorage.getItem("userState"));
    if (hasSavedProgress && hasSavedProgress.status === 'save') {
      const confirm = window.confirm(
        'You have a saved test. Starting a new test will delete it. Are you sure?'
      );
      if (!confirm) return;

      try {
        await deleteData(`/history/save?test_id=${id}`, true);
        setHasSavedProgress(null);
      } catch (error) {
        logError('Test detail page', 'Failed to delete saved progress', error);
        showError('Failed to delete saved test progress.');
      }
    }

    // Xóa dữ liệu cũ trong localStorage và sessionStorage
    localStorage.removeItem('testProgress');
    localStorage.removeItem(`testTime-${id}`);
    localStorage.removeItem('timeLimit');
    sessionStorage.removeItem('isContinuing');
    sessionStorage.removeItem('hasSubmitted');

    // Khởi tạo trạng thái mới
    localStorage.setItem('testProgress', JSON.stringify({}));
    localStorage.setItem('timeLimit', timeLimit * 60); // Lưu timeLimit ban đầu (giây)
    sessionStorage.setItem('hasSubmitted', 'false');
    const queryParams = selectedPartOrders.map((part) => `part=${part}`).join('&');
    navigate(`/tests/${id}/practice?${queryParams}`);
    showSuccess('You are starting a new practice test!');
  };

  const handleTimeChange = (event) => {
    setTimeLimit(event.target.value);
  };

  useEffect(() => {
    if (timeLimit !== '') {
      localStorage.setItem('timeLimit', Number(timeLimit) * 60);
    } else {
      localStorage.setItem('timeLimit', '0');
    }
  }, [timeLimit]);

  // Bắt đầu bài test
  const StartTest = () => {
    if (userState.isLoggedIn) {
      localStorage.setItem('testProgress', JSON.stringify({}));
      sessionStorage.setItem('hasSubmitted', 'false');
      // Xóa testTime-${id} để FullTestPage sử dụng duration từ cơ sở dữ liệu
      localStorage.removeItem(`testTime-${id}`);
      showSuccess('You are in testing!');
      navigate(`/fulltest/${id}`);
    } else {
      showSuccess('You have no login yet!');
      navigate('/login');
    }
  };

  // Xem đáp án bài thi
  const handleAnswerClick = () => {
    navigate(`/test/viewdetailanswer/${id}`);
    showSuccess('You are viewing all answer details!');
  };

  // Kiểm tra tiến trình đã lưu khi component mount
  useEffect(() => {
    const checkSavedProgress = async () => {
      try {
        // const userState = JSON.parse(localStorage.getItem("userState"));
        if (!userState?.id) return;
        const res = await fetchData(`/history/save?test_id=${id}`, true);
        if (res) {
          setHasSavedProgress(res);
        }
      } catch (error) {
        console.log('No saved progress found', error);
        setHasSavedProgress(null);
      }
    };
    if (userState.isLoggedIn) checkSavedProgress();
  }, [id, userState.isLoggedIn]);

  const handleContinue = () => {
    if (userState.isLoggedIn) {
      if (!hasSavedProgress || !hasSavedProgress.part) return;
      const savedParts = hasSavedProgress.part.map((part) => part.split(' ')[1]);
      const queryParams = savedParts.map((part) => `part=${part}`).join('&');
      localStorage.setItem('testProgress', JSON.stringify(hasSavedProgress.dataprogress));

      // Lưu thời gian từ database
      const { time, time_left } = hasSavedProgress;
      const timePick = time_left !== null ? time + time_left : 0; // Tính timePick nếu có time_left
      const isCountingDown = time_left !== null; // Đếm ngược nếu có time_left
      localStorage.setItem(
        `testTime-${id}`,
        JSON.stringify({
          timeLeft: time_left !== null ? time_left : time,
          timePick,
          isCountingDown,
        })
      );

      // Lưu flag để nhận biết đây là trường hợp Continue
      sessionStorage.setItem('isContinuing', 'true');

      sessionStorage.setItem('hasSubmitted', 'false');
      navigate(`/tests/${id}/practice?${queryParams}`);
      showSuccess('You are continuing your saved test!');
    } else {
      showSuccess('You have no login yet!');
      navigate('/login');
    }
  };

  // Kiểm tra trạng thái để vô hiệu hóa nút
  const isStartDisabled =
    hasSavedProgress && hasSavedProgress.status === 'save' && !hasPartsChanged && timeLimit === '';
  const isContinueDisabled = hasPartsChanged || timeLimit !== '';

  return (
    <div className="test-details">
      {testInfo && <TestInfo {...testInfo} />}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'practice' && (
        <div>
          <PartSelection parts={parts} onSelect={handlePartSelect} />
          <div className="form-group">
            <label className="label" htmlFor="time_limit">
              Time Limit( Don&apos;t choose unless you want to set):{' '}
            </label>
            <select
              name="time_limit"
              id="time_limit"
              className="custom-select "
              value={timeLimit}
              onChange={handleTimeChange}>
              <option value="" disabled>
                -- Pick time --
              </option>
              <option value="0">No limit </option>
              <option value="1">1 </option>
              <option value="5">5 </option>
              <option value="10">10 </option>
              <option value="15">15 </option>
              <option value="20">20 </option>
              <option value="25">25 </option>
              <option value="30">30 </option>
              <option value="35">35 </option>
              <option value="40">40 </option>
              <option value="45">45 </option>
              <option value="50">50 </option>
              <option value="55">55 </option>
              <option value="60">60 </option>
              <option value="65">65 </option>
              <option value="70">70 </option>
              <option value="75">75 </option>
              <option value="80">80 </option>
              <option value="85">85 </option>
              <option value="90">90 </option>
              <option value="95">95 </option>
              <option value="100">100 </option>
              <option value="105">105 </option>
              <option value="110">110 </option>
              <option value="115">115 </option>
              <option value="120">120 </option>
              <option value="125">125 </option>
              <option value="130">130 </option>
              <option value="135">135 </option>
            </select>
            <span> minutes</span>
          </div>
          <button label="Start Practice" onClick={StartPractice} disabled={isStartDisabled}>
            Start Practice
          </button>
          {/* /* Chỉ hiển thị nút Continue nếu hasSavedProgress tồn tại và hợp lệ */}
          {hasSavedProgress && hasSavedProgress.status === 'save' && (
            <button label="Continue" onClick={handleContinue} disabled={isContinueDisabled}>
              Continue Saved Test
            </button>
          )}
        </div>
      )}
      {activeTab === 'fullTest' && (
        <>
          <div className="note">
            <i className="bi bi-calendar-x"></i>
            <span> Ready to start full test? It took 120 mins to take this test.</span>
          </div>
          <button label="Start Test" onClick={StartTest}>
            Start Test
          </button>
        </>
      )}
      {activeTab === 'answer' && (
        <button className="answer-section" onClick={handleAnswerClick}>
          View All Answer Details
        </button>
      )}
    </div>
  );
};

export default TestDetailPage;
