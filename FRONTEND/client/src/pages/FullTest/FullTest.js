import { faPlus, faMinus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CircularProgress from '@mui/material/CircularProgress';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import ButtonComponent from '../../components/ButtonComponent/ButtonComponent';
import CountdownTimer from '../../components/Countdown/Countdown';
import { useReduxAlert } from '../../hook/useReduxAlert';
import { fetchData, postData } from '../../service/UserService';
import './FullTest.css';

const FullTestPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showError, showSuccess } = useReduxAlert();
  const user = useSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState('Part 1');
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [selectedTest, setSelectedTest] = useState({});
  const [fullTestTimeLeft, setFullTestTimeLeft] = useState(null); // Đổi tên biến
  const [currentAudio, setCurrentAudio] = useState('');
  const { id } = useParams();
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [partsData, setPartsData] = useState([]);
  const [questionData, setQuestionData] = useState([]);
  const [partData, setPartData] = useState([]);
  const [groupData, setGroupData] = useState([]);
  const [answerData, setAnswerData] = useState([]);
  const [testPartData, setTestPartData] = useState([]);
  const [testData, setTestData] = useState([]);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null); // Lưu URL ảnh được chọn
  const [zoomLevel, setZoomLevel] = useState(1); // Mức độ zoom (mặc định 1x)

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!user.isLoggedIn) {
      showError('Please login to take the test!');
      navigate('/login');
    }
  }, [user.isLoggedIn, navigate, dispatch]);

  // Kiểm tra trạng thái submit
  useEffect(() => {
    const hasSubmitted = sessionStorage.getItem('hasSubmitted');
    if (hasSubmitted === 'true') {
      localStorage.removeItem(`testTime-${id}`);
      sessionStorage.removeItem(`testSession-${id}`);
      navigate('/');
    }
  }, [navigate, id]);

  // Cảnh báo khi rời trang
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const confirmationMessage = '\o/';
      (e || window.event).returnValue = confirmationMessage;
      return confirmationMessage;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Khôi phục timer từ localStorage khi component mount
  useEffect(() => {
    const savedTime = localStorage.getItem(`testTime-${id}`);
    const sessionId = sessionStorage.getItem(`testSession-${id}`);
    if (savedTime && sessionId) {
      try {
        const { fullTestTimeLeft: savedTimeLeft, testType } = JSON.parse(savedTime);
        // Chỉ khôi phục nếu dữ liệu thuộc FullTest
        if (testType === 'FullTest' && savedTimeLeft !== null && savedTimeLeft >= 0) {
          console.log('Restoring timer from localStorage:', savedTimeLeft);
          setFullTestTimeLeft(savedTimeLeft);
        }
      } catch (error) {
        console.error('Error parsing saved time:', error);
      }
    }
  }, [id]);

  // Lưu timer vào localStorage khi fullTestTimeLeft thay đổi
  useEffect(() => {
    if (fullTestTimeLeft !== null) {
      localStorage.setItem(
        `testTime-${id}`,
        JSON.stringify({ fullTestTimeLeft, testType: 'FullTest' })
      );
      console.log('Saved fullTestTimeLeft to localStorage:', fullTestTimeLeft);
    }
  }, [fullTestTimeLeft, id]);

  // Khởi tạo session mới nếu chưa có
  useEffect(() => {
    const sessionId = sessionStorage.getItem(`testSession-${id}`);
    if (!sessionId) {
      const newSessionId = Date.now().toString();
      sessionStorage.setItem(`testSession-${id}`, newSessionId);
      console.log('Created new test session:', newSessionId);
    }
  }, [id]);

  // Fetch API
  useEffect(() => {
    const fetchAPI = async () => {
      if (!user.isLoggedIn) return;
      try {
        setIsLoadingAll(true);
        setLoadingProgress(0);

        const totalRequests = 6;
        let completedRequests = 0;

        const updateProgress = () => {
          completedRequests += 1;
          const progress = Math.min((completedRequests / totalRequests) * 100, 90);
          setLoadingProgress(progress);
          console.log(`Progress updated: ${progress}%`);
        };

        const fetchPromises = [
          fetchData('tests/questions', true).then((data) => {
            updateProgress();
            return data;
          }),
          fetchData('tests/part', true).then((data) => {
            updateProgress();
            return data;
          }),
          fetchData(`tests/${id}/media`, true).then((res) => {
            updateProgress();
            const normalizedGroupMedia = Array.isArray(res) ? res : res?.res || [];
            console.log('Raw /tests/${id}/media response:', res);
            setGroupData(normalizedGroupMedia);
            return normalizedGroupMedia;
          }),
          fetchData('tests/answer', true).then((data) => {
            updateProgress();
            return data;
          }),
          fetchData('tests/testpart', true).then((data) => {
            updateProgress();
            return data;
          }),
          fetchData('tests', true).then((data) => {
            updateProgress();
            return data;
          }),
        ];

        const [questions, parts, groupMedia, answers, testParts, tests] =
          await Promise.all(fetchPromises);

        setQuestionData(questions);
        setPartData(parts);
        setGroupData(groupMedia);
        setAnswerData(answers);
        setTestPartData(testParts);
        setTestData(tests);

        const minLoadingTime = 1000;
        const startTime = Date.now();
        const elapsedTime = Date.now() - startTime;
        const remainingTime = minLoadingTime - elapsedTime;
        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        setLoadingProgress(100);
        setTimeout(() => {
          setIsLoadingAll(false);
          console.log('All data loaded, page ready');
        }, 300);
      } catch (error) {
        console.error('Fetch API fault:', error);
        if (error.status === 401) {
          showError('Please login to take the test!');
          navigate('/login');
        } else {
          showError('Failed to load test data.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchAPI();
  }, [user.isLoggedIn, navigate, dispatch, id]);

  // Set selectedTest và partsData
  useEffect(() => {
    const test = testData.find((test) => test.id === Number(id));
    setSelectedTest(test);

    const filteredTestParts = testPartData.filter((part) => part.test_id === Number(id));
    const availableParts = filteredTestParts
      .map((testPart) => partData.find((part) => part.id === testPart.part_id)?.part_order)
      .filter(Boolean);
    const targetPart = availableParts.includes('Part 1') ? 'Part 1' : 'Part 5';
    handlePartChange(targetPart);

    // Thiết lập fullTestTimeLeft từ duration nếu không có dữ liệu hợp lệ trong localStorage
    if (test) {
      const savedTime = localStorage.getItem(`testTime-${id}`);
      let shouldUseDuration = true;

      if (savedTime) {
        try {
          const { fullTestTimeLeft: savedTimeLeft, testType } = JSON.parse(savedTime);
          if (testType === 'FullTest' && savedTimeLeft !== null && savedTimeLeft >= 0) {
            setFullTestTimeLeft(savedTimeLeft);
            shouldUseDuration = false;
            console.log('Restored fullTestTimeLeft from localStorage:', savedTimeLeft);
          }
        } catch (error) {
          console.error('Error parsing saved time:', error);
        }
      }

      if (shouldUseDuration) {
        const durationSeconds = Number(test.duration) * 60;
        setFullTestTimeLeft(durationSeconds);
        console.log('Set initial fullTestTimeLeft from test duration:', durationSeconds);
      }
    }
  }, [questionData, partData, groupData, answerData, testPartData, testData, id]);

  //scroll
  useEffect(() => {
    if (!isLoadingAll) {
      const handleScroll = () => {
        const header = document.querySelector('.header');
        const leftSection = document.querySelector('.left-section');
        const audioControls = document.querySelector('.audio-controls');
        const partTabs = document.querySelector('.part-tabs');

        if (!header || !leftSection || !audioControls || !partTabs) return;

        const leftSectionRect = leftSection.getBoundingClientRect();
        const headerHeight = header.offsetHeight;
        const fixedTop = headerHeight + 44; // Header 80px + khoảng cách 40px

        // Lấy khoảng cách ban đầu giữa audio-controls và part-tabs
        const initialAudioTop = audioControls.offsetTop - leftSection.offsetTop;
        const initialPartTabsTop = partTabs.offsetTop - leftSection.offsetTop;

        if (leftSectionRect.top <= fixedTop) {
          // Khi left-section đi lên quá header, giữ audio-controls & part-tabs cố định với khoảng cách ban đầu
          audioControls.classList.add('audio-fixed');
          partTabs.classList.add('audio-fixed');

          audioControls.style.top = `${fixedTop}px`;
          partTabs.style.top = `${fixedTop + (initialPartTabsTop - initialAudioTop)}px`; // Giữ đúng khoảng cách
        } else {
          // Khi left-section vẫn còn trên màn hình, reset về vị trí bình thường
          audioControls.classList.remove('audio-fixed');
          partTabs.classList.remove('audio-fixed');

          audioControls.style.top = 'auto';
          partTabs.style.top = 'auto';
        }
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isLoadingAll]);

  const calculatePartsData = (data) => {
    let start = 1;
    const partsData = {};
    const hasPart1 = data.some((part) => part.part_order === 'Part 1');
    if (!hasPart1) {
      start = 101;
    }
    data.forEach((part) => {
      const end = start + part.questionCount - 1;
      partsData[part.part_order] = { start, end };
      start = end + 1;
    });
    return partsData;
  };

  const toggleFlagQuestion = (questionId) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const loadQuestionsForPart = (partOrder) => {
    if (!Array.isArray(partData) || partData.length === 0) {
      console.warn('partData is not loaded or is empty.');
      return;
    }
    const selectedTestPart = testPartData
      .filter((tp) => tp.test_id === Number(id))
      .map((tp) => partData.find((p) => p.id === tp.part_id));
    setPartsData(calculatePartsData(selectedTestPart));
    const part = selectedTestPart.find((p) => p.part_order === partOrder);
    if (part) {
      const partQuestions = questionData.filter((q) => q.part_id === part.id);
      setFilteredQuestions(partQuestions);
    } else {
      setFilteredQuestions([]);
    }
  };

  const handlePartChange = (partOrder) => {
    if (!Array.isArray(partData) || partData.length === 0) {
      console.warn('partData is not loaded or is empty.');
      return;
    }
    setSelectedPart(partOrder);
    loadQuestionsForPart(partOrder);
    const selectedTestPart = testPartData
      .filter((tp) => tp.test_id === Number(id))
      .map((tp) => partData.find((p) => p.id === tp.part_id));
    const part = selectedTestPart.find((p) => p.part_order === partOrder);
    if (part && part.audio_url) {
      setCurrentAudio(part.audio_url);
    } else {
      setCurrentAudio('');
    }
  };

  const GroupHeading = ({ groupId, groupData, partOrder }) => {
    const group = groupData.find((g) => g.id === Number(groupId));
    if (!group) return null;

    const isValidMediaName =
      group.media_name &&
      /^\d+-\d+$/.test(group.media_name.replace(/<\/?p>/g, '')) &&
      ['Part 3', 'Part 4', 'Part 6', 'Part 7'].includes(partOrder);

    if (!isValidMediaName) return null;

    return (
      <div className="group-name">
        Questions {group.media_name.replace(/<\/?p>/g, '')} refer to the following:
      </div>
    );
  };

  const GroupParagraph = ({ groupId, groupData }) => {
    const group = groupData.find((g) => g.id === Number(groupId));
    if (!group) {
      console.warn(`No group found for groupId ${groupId}`);
      return null;
    }

    const isOnlyNumberOrRange = (content) => {
      if (!content) return true;
      const cleanContent = content.replace(/<\/?p>/g, '').trim();
      return /^\d+$/.test(cleanContent) || /^\d+-\d+$/.test(cleanContent);
    };

    // Trích xuất ảnh và văn bản từ paragrap_main
    let imageSrc = null;
    let paragraphContent = group.paragrap_main;

    if (group.paragrap_main && !isOnlyNumberOrRange(group.paragrap_main)) {
      // Tìm và trích xuất thẻ <img>
      const imgMatch = group.paragrap_main.match(/<img src="([^"]+)"[^>]*>/);
      if (imgMatch && imgMatch[1].startsWith('data:image/')) {
        imageSrc = imgMatch[1]; // Lấy chuỗi Base64
        // Loại bỏ thẻ <img> khỏi nội dung văn bản
        paragraphContent = group.paragrap_main.replace(imgMatch[0], '');
      }
    }

    // Nếu không có nội dung hợp lệ, trả về null
    if (!imageSrc && (!paragraphContent || isOnlyNumberOrRange(paragraphContent))) {
      return null;
    }

    return (
      <div className="group-paragraph">
        {imageSrc && (
          <img
            src={imageSrc}
            alt="Group Illustration"
            className="question-image"
            loading="lazy"
            onClick={() => setSelectedImage(imageSrc)}
            style={{ cursor: 'pointer' }}
          />
        )}
        {paragraphContent && !isOnlyNumberOrRange(paragraphContent) && (
          <div dangerouslySetInnerHTML={{ __html: paragraphContent }} />
        )}
      </div>
    );
  };

  const handleAnswerChange = (questionId, answerId) => {
    setSelectedAnswers((prevState) => ({
      ...prevState,
      [questionId]: answerId,
    }));
  };

  const handleScrollToQuestion = (questionId) => {
    const targetPart = Object.entries(partsData).find(
      ([_, { start, end }]) => questionId >= start && questionId <= end
    );
    if (targetPart) {
      const [partName] = targetPart;
      if (selectedPart !== partName) {
        setSelectedPart(partName);
        loadQuestionsForPart(partName);
        setTimeout(() => {
          const element = document.getElementById(`question-${questionId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 0);
      } else {
        const element = document.getElementById(`question-${questionId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  const ImageModal = ({ imageSrc, onClose, zoomLevel, setZoomLevel }) => {
    const minZoom = 0.5;
    const maxZoom = 3;
    const zoomStep = 0.2;

    // Debounce để hạn chế tần suất cập nhật zoomLevel
    const debounce = (func, wait) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    };

    const handleZoomIn = () => {
      setZoomLevel((prev) => Math.min(prev + zoomStep, maxZoom));
    };

    const handleZoomOut = () => {
      setZoomLevel((prev) => Math.max(prev - zoomStep, minZoom));
    };

    const handleWheel = debounce((e) => {
      e.preventDefault();
      const delta = e.deltaY * -0.01; // Chuẩn hóa delta
      setZoomLevel((prev) => {
        const newZoom = prev + delta * zoomStep;
        return Math.max(minZoom, Math.min(maxZoom, newZoom));
      });
    }, 50); // Debounce 50ms

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(touch1.pageX - touch2.pageX, touch1.pageY - touch2.pageY);

        if (!e.target.dataset.lastDistance) {
          e.target.dataset.lastDistance = distance;
        } else {
          const lastDistance = parseFloat(e.target.dataset.lastDistance);
          const scaleChange = (distance - lastDistance) * 0.005;
          setZoomLevel((prev) => Math.max(minZoom, Math.min(maxZoom, prev + scaleChange)));
          e.target.dataset.lastDistance = distance;
        }
      }
    };

    const handleTouchEnd = (e) => {
      delete e.target.dataset.lastDistance;
    };

    return (
      <div className="image-modal">
        <div
          className="image-modal-content"
          onWheel={handleWheel}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}>
          <img
            src={imageSrc}
            alt="Zoomed illustration"
            style={{
              transform: `scale(${zoomLevel})`,
              touchAction: 'none',
            }}
          />
          <div className="image-modal-controls">
            <button onClick={handleZoomIn} title="Zoom In">
              <FontAwesomeIcon icon={faPlus} />
            </button>
            <button onClick={handleZoomOut} title="Zoom Out">
              <FontAwesomeIcon icon={faMinus} />
            </button>
            <button onClick={onClose} className="close-btn" title="Close">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderQuestions = () => {
    if (!Array.isArray(filteredQuestions) || !Array.isArray(groupData)) {
      console.warn('filteredQuestions hoặc groupData chưa sẵn sàng:', {
        filteredQuestions,
        groupData,
      });
      return null;
    }

    const groupedQuestions = {};
    filteredQuestions.forEach((question) => {
      if (!groupedQuestions[question.group_id]) {
        groupedQuestions[question.group_id] = [];
      }
      groupedQuestions[question.group_id].push(question);
    });

    return Object.entries(groupedQuestions).map(([groupIdStr, questions]) => {
      const groupId = Number(groupIdStr);
      const partDetails = partData.find((p) => p.id === questions[0].part_id);
      const isTwoColumnPart =
        partDetails && ['Part 1', 'Part 6', 'Part 7'].includes(partDetails.part_order);
      const isContentAnswerPart3to7 =
        partDetails &&
        ['Part 1', 'Part 2', 'Part 3', 'Part 4', 'Part 5', 'Part 6', 'Part 7'].includes(
          partDetails.part_order
        );

      console.log('renderQuestions:', {
        groupId,
        groupIdStr,
        media_name: groupData.find((g) => g.id === groupId)?.media_name,
        partOrder: partDetails?.part_order,
      });

      const renderQuestionBlock = (question) => {
        const answersForQuestion = answerData.filter(
          (answer) => answer.question_id === question.id
        );

        return (
          <div key={question.id} id={`question-${question.order}`}>
            <p className="question-title">
              {isContentAnswerPart3to7 ? (
                <>
                  {question.order}. {question.content}
                </>
              ) : (
                `${question.order}.`
              )}
              <span
                className={`flag-icon ${flaggedQuestions[question.order] ? 'flagged' : ''}`}
                onClick={() => toggleFlagQuestion(question.order)}>
                {flaggedQuestions[question.order] ? '🚩' : '⚑'}
              </span>
            </p>
            <div className="choices">
              {isContentAnswerPart3to7
                ? answersForQuestion.map((answer) => (
                  <label key={answer.id} className="choice-label" style={{ marginBottom: '4px' }}>
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={selectedAnswers[question.order] === answer.id}
                      onChange={() => handleAnswerChange(question.order, answer.id)}
                    />
                    {answer.content}
                  </label>
                ))
                : ['A', 'B', 'C', 'D'].map((choice) => {
                  const answer = answersForQuestion.find((ans) => ans.content.startsWith(choice));
                  return (
                    answer && (
                      <label key={choice} className="choice-label">
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={selectedAnswers[question.order] === answer.id}
                          onChange={() => handleAnswerChange(question.order, answer.id)}
                        />
                        {choice}
                      </label>
                    )
                  );
                })}
            </div>
          </div>
        );
      };

      return (
        <div key={groupId} className={`question-item ${isTwoColumnPart ? 'two-column' : ''}`}>
          <GroupHeading
            groupId={groupId}
            groupData={groupData}
            partOrder={partDetails?.part_order || ''}
          />
          {isTwoColumnPart ? (
            <div className="two-column-container">
              <div className="group-content">
                <GroupParagraph groupId={groupId} groupData={groupData} />
              </div>
              <div className="question-details">{questions.map(renderQuestionBlock)}</div>
            </div>
          ) : (
            <div className="question-details">
              <GroupParagraph groupId={groupId} groupData={groupData} />
              {questions.map(renderQuestionBlock)}
            </div>
          )}
        </div>
      );
    });
  };

  const renderAllQuestions = () => {
    return Object.entries(partsData).map(([part, { start, end }]) => (
      <div key={part} className="part-section">
        <h3>{part}</h3>
        <div className="question-numbers">
          {[...Array(end - start + 1)].map((_, i) => {
            const questionId = start + i;
            const isFlagged = flaggedQuestions[questionId];
            const buttonClass = isFlagged ? 'flagged' : '';
            const isAnswered = Object.keys(selectedAnswers).includes(String(questionId));
            return (
              <button
                key={questionId}
                className={`question-number ${isAnswered ? 'answered' : ''} ${selectedPart === part && filteredQuestions.some((q) => q.id === questionId)
                  ? 'active'
                  : ''
                  } ${buttonClass}`}
                onClick={() => handleScrollToQuestion(questionId)}>
                {questionId}
              </button>
            );
          })}
        </div>
      </div>
    ));
  };

  const payload = {
    user_id: user.id,
    test_id: id,
    dataprogress: Object.fromEntries(
      Object.entries(selectedAnswers).map(([key, value]) => [key, value.toString()])
    ),
    time: selectedTest ? 60 * Number(selectedTest.duration) - fullTestTimeLeft : 0,
    type: 'FullTest',
    part: [],
  };

  const handleSubmit = async (auto) => {
    try {
      let confirm;
      if (auto !== 'auto') {
        confirm = window.confirm('Do you sure want to submit?');
      }
      if (confirm || auto === 'auto') {
        const submitPayload = {
          ...payload,
          status: 'submit',
        };
        const res = await postData('history', submitPayload, true);
        if (res.success) {
          const resultId = res?.data.id;
          sessionStorage.setItem('hasSubmitted', 'true');
          setIsLoading(true);
          showSuccess('Submit success');
          localStorage.removeItem(`testTime-${id}`);
          localStorage.removeItem(`testProgress-${id}`);
          sessionStorage.removeItem(`testSession-${id}`);
          setTimeout(() => {
            navigate(`/test/${id}/result/${resultId}`);
          }, 1000);
        } else {
          setIsLoading(false);
          showError(`${res?.errorData.detail}`);
        }
      }
    } catch (error) {
      setIsLoading(false);
      showError(`Failed to submit test with error: ${error}.`);
    }
  };

  const handleExit = () => {
    const confirm = window.confirm('Exit may not be saved!');
    if (confirm) {
      setIsLoading(true);
      localStorage.removeItem(`testTime-${id}`);
      localStorage.removeItem(`testProgress-${id}`);
      sessionStorage.removeItem(`testSession-${id}`);
      setTimeout(() => {
        navigate('/');
      }, 1000);
    }
  };

  // Khôi phục progress từ localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('testProgress');
    if (savedProgress) {
      const parsedProgress = JSON.parse(savedProgress);
      if (Object.keys(parsedProgress).length > 0) {
        console.log('Restored progress:', parsedProgress);
        setSelectedAnswers(parsedProgress);
      }
    }
  }, []);

  // Tự động submit khi hết thời gian
  useEffect(() => {
    if (fullTestTimeLeft === 0) {
      handleSubmit('auto');
    }
  }, [fullTestTimeLeft]);

  // Lưu progress vào localStorage
  useEffect(() => {
    const savedProgress = JSON.parse(localStorage.getItem('testProgress')) || {};
    if (JSON.stringify(savedProgress) !== JSON.stringify(selectedAnswers)) {
      localStorage.setItem('testProgress', JSON.stringify(selectedAnswers));
      console.log('Progress saved:', selectedAnswers);
    }
  }, [selectedAnswers]);

  if (isLoadingAll) {
    return (
      <div className="loading-overlay">
        <div className="progress-bar-container">
          <div className="progress-bar-custom" style={{ width: `${loadingProgress}%` }} />
        </div>
        <h3>Loading test materials... {Math.round(loadingProgress)}%</h3>
      </div>
    );
  }

  return (
    <div className="fulltest-page">
      {isLoading && (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: '100%' }} />
        </div>
      )}
      {/* Thêm ImageModal */}
      {selectedImage && (
        <ImageModal
          imageSrc={selectedImage}
          onClose={() => {
            setSelectedImage(null);
            setZoomLevel(1); // Reset zoom khi đóng
          }}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
        />
      )}
      <div className="practice-header">
        <h1>{selectedTest && selectedTest.title}</h1>
        <ButtonComponent
          label="Exit"
          type="submit"
          disabled={isLoading}
          className="exit-button"
          onClick={handleExit}>
          {isLoading ? <CircularProgress size={24} /> : 'Exit'}
        </ButtonComponent>
      </div>

      <div className="content-container">
        <div className="left-section">
          <div className="sticky-audio-tabs">
            <div className="part-tabs">
              {Object.entries(partsData).map(([part]) => (
                <button
                  key={part}
                  onClick={() => handlePartChange(part)}
                  className={selectedPart === part ? 'active' : ''}>
                  {part}
                </button>
              ))}
            </div>
            <div className="audio-controls">
              {currentAudio ? (
                <audio controls className="audio" key={currentAudio}>
                  <source src={`http://11.11.4.138:8000/media/${currentAudio}`} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              ) : (
                ''
              )}
            </div>
          </div>
          <div className="question-content">{renderQuestions()}</div>
        </div>

        <div className="right-section">
          <div className="timer">
            <CountdownTimer time={fullTestTimeLeft} setTime={setFullTestTimeLeft} />
            <ButtonComponent
              label="Submit"
              type="submit"
              disabled={isLoading}
              className="submit-button"
              onClick={handleSubmit}>
              {isLoading ? <CircularProgress size={24} /> : 'Submit'}
            </ButtonComponent>
          </div>

          <div className="question-nav">{renderAllQuestions()}</div>
        </div>
      </div>
    </div>
  );
};

export default FullTestPage;
