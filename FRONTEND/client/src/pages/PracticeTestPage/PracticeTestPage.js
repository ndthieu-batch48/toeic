import { faCaretDown, faPlus, faMinus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CircularProgress from '@mui/material/CircularProgress';
import { get, set } from 'idb-keyval';
import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import CountdownTimer from '../../components/Countdown/Countdown';
import { useReduxAlert } from '../../hook/useReduxAlert';
import { TranslationPrompts } from '../../prompts/prompt';
import { sendPromptToBackend, sendPromptWithImageToBackend } from '../../service/ChatbotAI';
import { deleteData, fetchData, postData } from '../../service/UserService';
import './PracticeTestPage.css';

const PracticeTestPage = () => {
  const navigate = useNavigate();
  const { showError } = useReduxAlert();
  const { id: userId } = useSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState('');
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [selectedTest, setSelectedTest] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timePick, setTimePick] = useState(null);
  const [isCountingDown, setIsCountingDown] = useState(null);
  const [currentAudio, setCurrentAudio] = useState('');
  const [partsData, setPartsData] = useState([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [showScripts, setShowScripts] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(0);

  const { id } = useParams();
  const [questionData, setQuestionData] = useState([]);
  const [partData, setPartData] = useState([]);
  const [groupData, setGroupData] = useState([]);
  const [answerData, setAnswerData] = useState([]);
  const [testPartData, setTestPartData] = useState([]);
  const [testData, setTestData] = useState([]);

  const { role } = useSelector((state) => state.user); // Lấy role từ Redux
  const [showTranslations, setShowTranslations] = useState({}); // Trạng thái hiển thị bản dịch
  const [isEditingTranslation, setIsEditingTranslation] = useState({}); // Trạng thái chỉnh sửa
  const [editedTranslations, setEditedTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState({});

  const [showQuestionTranslations, setShowQuestionTranslations] = useState({});
  const [questionTranslations, setQuestionTranslations] = useState({});
  const [isEditingQuestionTranslation, setIsEditingQuestionTranslation] = useState({});
  const [isTranslatingQuestion, setIsTranslatingQuestion] = useState({});

  const [showImageTranslations, setShowImageTranslations] = useState({});
  const [imageTranslations, setImageTranslations] = useState({});
  const [isEditingImageTranslation, setIsEditingImageTranslation] = useState({});
  const [isTranslatingImage, setIsTranslatingImage] = useState({});
  const [imageTranslationLanguages, setImageTranslationLanguages] = useState({});

  const [selectedImage, setSelectedImage] = useState(null); // Lưu URL ảnh được chọn
  const [zoomLevel, setZoomLevel] = useState(1); // Mức độ zoom (mặc định 1x)

  const [languages, setLanguages] = useState([]);
  const [questionLanguages, setQuestionLanguages] = useState({}); // Store language_id per question
  const [selectedTestPart, setSelectedTestPart] = useState([]);
  const [currentPartQuestions, setCurrentPartQuestions] = useState([]);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const partsQuery = searchParams.getAll('part');
  const parts = partsQuery.map((value) => `Part ${value}`);
  const timeLimit = localStorage.getItem('timeLimit');

  // Khôi phục selectedAnswers ngay khi component mount
  useEffect(() => {
    const hasSubmitted = sessionStorage.getItem('hasSubmitted');

    // If test was previously submitted, we should clear the saved progress and time
    if (hasSubmitted === 'true') {
      localStorage.removeItem(`testProgress-${id}`);
      localStorage.removeItem(`testTime-${id}`);
      sessionStorage.removeItem('hasSubmitted');
    }

    const savedProgress = localStorage.getItem(`testProgress-${id}`);
    if (savedProgress) {
      try {
        const parsedProgress = JSON.parse(savedProgress);
        if (parsedProgress && Object.keys(parsedProgress).length > 0) {
          setSelectedAnswers(parsedProgress);
          console.log('Restored selectedAnswers:', parsedProgress);
        } else {
          console.log('No valid saved progress found in localStorage');
        }
      } catch (error) {
        console.error('Error parsing saved progress:', error);
      }
    } else {
      console.log('No saved progress found in localStorage');
    }
  }, [id]);

  // Tạo languageMap từ languages
  const languageMap = useMemo(() => {
    if (!Array.isArray(languages) || languages.length === 0) {
      return { 1: 'Vietnamese' }; // Giá trị mặc định nếu languages chưa tải
    }
    return languages.reduce(
      (map, lang) => ({
        ...map,
        [lang.id]: lang.language_name,
      }),
      {}
    );
  }, [languages]);

  // Hàm kiểm tra nội dung hợp lệ trước khi lưu
  const isValidTranslationContent = (content) => {
    if (!content || content === 'undefined') return false;

    // Kiểm tra Base64
    if (typeof content === 'string' && content.match(/^data:image\/[a-zA-Z]+;base64,/)) {
      return false;
    }

    // Kiểm tra các chuỗi lỗi phổ biến
    const errorPatterns = [
      /Lỗi khi dịch/i,
      /Không có nội dung để dịch/i,
      /Không có bản dịch nào/i,
      /Lỗi: Dữ liệu chứa Base64/i,
      /Lỗi khi xử lý bản dịch/i,
      /Failed to.*translation/i,
    ];

    if (typeof content === 'string') {
      return !errorPatterns.some((pattern) => pattern.test(content));
    }

    // Nếu là object (translation có script/question)
    if (typeof content === 'object') {
      const scriptValid = content.script
        ? !errorPatterns.some((pattern) => pattern.test(content.script))
        : true;
      const questionValid = content.question
        ? !errorPatterns.some((pattern) => pattern.test(content.question))
        : true;
      return (content.script || content.question) && scriptValid && questionValid;
    }

    return false;
  };

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
        const fixedTop = headerHeight + 30; // Header 80px + khoảng cách 40px

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

  // In PracticeTestPage.js
  useEffect(() => {
    const savedTime = localStorage.getItem(`testTime-${id}`);
    const sessionId = sessionStorage.getItem(`testSession-${id}`);
    if (savedTime && sessionId) {
      try {
        const { timeLeft: savedTimeLeft, testType } = JSON.parse(savedTime);
        if (testType === 'PracticeTest' && savedTimeLeft !== null && savedTimeLeft >= 0) {
          setTimeLeft(savedTimeLeft);
        }
      } catch (error) {
        console.error('Error parsing saved time:', error);
      }
    }
  }, [id]);

  useEffect(() => {
    if (timeLeft !== null) {
      localStorage.setItem(
        `testTime-${id}`,
        JSON.stringify({ timeLeft, testType: 'PracticeTest' })
      );
    }
  }, [timeLeft, id]);

  useEffect(() => {
    const fetchAPI = async () => {
      try {
        setIsLoadingAll(true);
        setLoadingProgress(0);

        const cacheKey = `test-data-${id}`;
        const cachedData = await get(cacheKey);
        const cacheTimestamp = cachedData?.timestamp;
        const cacheValid = cacheTimestamp && Date.now() - cacheTimestamp < 3600 * 1000;

        let questions, parts, groupMedia, answers, testParts, tests, languages;

        if (cacheValid) {
          ({ questions, parts, groupMedia, answers, testParts, tests, languages } = cachedData);
          setLoadingProgress(100);
          setTimeout(() => {
            setIsLoadingAll(false);
          }, 1000);
        } else {
          const fetchPromises = [
            fetchData('/tests/questions', true),
            fetchData('/tests/part', true),
            fetchData(`/tests/${id}/media`, true).then((res) => {
              const normalizedGroupMedia = Array.isArray(res) ? res : res?.res || [];
              setGroupData(normalizedGroupMedia);
              return normalizedGroupMedia;
            }),
            fetchData('/tests/answer'),
            fetchData('/tests/testpart'),
            fetchData('/tests'),
            fetchData('/languages', true),
          ];

          const totalFetches = fetchPromises.length;
          let completedFetches = 0;

          // Update progress based on completed fetches
          const updateProgress = () => {
            completedFetches += 1;
            const progress = Math.min(Math.round((completedFetches / totalFetches) * 80) + 10, 90);
            setLoadingProgress(progress);
            console.log(`Progress updated: ${progress}%`);
          };

          // Attach progress update to each promise
          const promisesWithProgress = fetchPromises.map((promise) =>
            promise
              .then((result) => {
                updateProgress();
                return result;
              })
              .catch((error) => {
                console.error('Fetch failed:', error);
                updateProgress(); // Still increase progress to avoid getting stuck
                throw error;
              })
          );

          // Start from 10%
          setLoadingProgress(10);

          [questions, parts, groupMedia, answers, testParts, tests, languages] =
            await Promise.all(promisesWithProgress);

          // Process languages to ensure it's an array
          const normalizedLanguages = Array.isArray(languages?.data)
            ? languages.data
            : Array.isArray(languages)
              ? languages
              : [];

          await set(cacheKey, {
            questions,
            parts,
            groupMedia,
            answers,
            testParts,
            tests,
            languages: normalizedLanguages,
            timestamp: Date.now(),
          });
          updateProgress(90); // Cache completed
        }

        setQuestionData(questions);
        setPartData(parts);
        setGroupData(groupMedia);
        setAnswerData(answers);
        setTestPartData(testParts);
        setTestData(tests);
        setLanguages(languages.data || languages);

        // Check if this is a fresh session (no previous time settings) or if time limit has changed
        const sessionId = sessionStorage.getItem(`testSession-${id}`);
        const currentSessionId = Date.now().toString();
        const previousTimeLimit = localStorage.getItem(`testTimeLimit-${id}`);
        const hasTimeLimitChanged = previousTimeLimit !== timeLimit;

        // If this is a new session or time limit changed, we'll reset the timer
        const isNewSession = !sessionId;
        if (isNewSession) {
          // Mark this as a new session
          sessionStorage.setItem(`testSession-${id}`, currentSessionId);
        }

        // Store the current time limit setting
        localStorage.setItem(`testTimeLimit-${id}`, timeLimit || 'none');

        const isContinuing = sessionStorage.getItem('isContinuing') === 'true';
        if (isContinuing) {
          const savedTime = localStorage.getItem(`testTime-${id}`);
          if (savedTime) {
            try {
              const {
                timeLeft: savedTimeLeft,
                timePick: savedTimePick,
                isCountingDown: savedIsCountingDown,
              } = JSON.parse(savedTime);
              if (
                savedTimeLeft !== null &&
                savedTimePick !== null &&
                savedIsCountingDown !== null
              ) {
                setTimeLeft(savedTimeLeft);
                setTimePick(savedTimePick);
                setIsCountingDown(savedIsCountingDown);
                // Clear the isContinuing flag after restoring
                sessionStorage.removeItem('isContinuing');
              }
            } catch (error) {
              console.error('Error parsing saved time from localStorage:', error);
            }
          }
        } else {
          // Try to restore timer from localStorage first (for reload cases)
          const savedTime = localStorage.getItem(`testTime-${id}`);
          if (savedTime && !isNewSession && !hasTimeLimitChanged) {
            try {
              const {
                timeLeft: savedTimeLeft,
                timePick: savedTimePick,
                isCountingDown: savedIsCountingDown,
              } = JSON.parse(savedTime);
              if (
                savedTimeLeft !== null &&
                savedTimePick !== null &&
                savedIsCountingDown !== null
              ) {
                setTimeLeft(savedTimeLeft);
                setTimePick(savedTimePick);
                setIsCountingDown(savedIsCountingDown);
              }
            } catch (error) {
              console.error('Error parsing saved time from localStorage:', error);
            }
          }

          // If no valid localStorage data or new session, try to restore from API
          if (!savedTime || isNewSession || hasTimeLimitChanged) {
            try {
              const user = JSON.parse(localStorage.getItem('user'));
              const savedProgressResponse = await fetchData(
                `/history/saved?user_id=${user.id}&test_id=${id}`,
                true
              );
              if (savedProgressResponse && savedProgressResponse.status === 'save') {
                const { time, time_left } = savedProgressResponse;
                if (time_left !== null) {
                  // Có Time Limit: đếm ngược từ time_left
                  setTimePick(time + time_left); // Tính lại timeLimit ban đầu
                  setTimeLeft(time_left);
                  setIsCountingDown(true);
                } else {
                  // No Limit: đếm lên từ time
                  setTimePick(0);
                  setTimeLeft(time);
                  setIsCountingDown(false);
                }
              } else {
                // Nếu không có dữ liệu từ API, dùng timeLimit từ localStorage
                if (timeLimit && timeLimit !== '0') {
                  setTimePick(Number(timeLimit));
                  setTimeLeft(Number(timeLimit));
                  setIsCountingDown(true);
                } else {
                  setTimePick(0);
                  setTimeLeft(0);
                  setIsCountingDown(false);
                }
              }
            } catch (error) {
              console.warn('Failed to fetch saved progress from API:', error);
              // Fallback to timeLimit if API fails
              if (timeLimit && timeLimit !== '0') {
                setTimePick(Number(timeLimit));
                setTimeLeft(Number(timeLimit));
                setIsCountingDown(true);
              } else {
                setTimePick(0);
                setTimeLeft(0);
                setIsCountingDown(false);
              }
            }
          }
        }

        const minLoadingTime = 1000;
        const startTime = Date.now();
        const elapsedTime = Date.now() - startTime;
        const remainingTime = minLoadingTime - elapsedTime;
        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        // Hoàn thành loading
        setLoadingProgress(100);
        setTimeout(() => {
          setIsLoadingAll(false);
        }, 300); // Delay nhỏ để thấy được progress hoàn thành
      } catch (error) {
        setIsLoadingAll(false);
        setLoadingProgress(0);
      }
    };
    fetchAPI();
  }, [id, timeLimit]);

  const filteredParts = Object.keys(partsData)
    .filter((part) => partsQuery.includes(part.split(' ')[1]))
    .reduce((obj, key) => {
      obj[key] = partsData[key];
      return obj;
    }, {});
  const firstPart = Object.keys(filteredParts)[0];

  useEffect(() => {
    if (!initialized && Object.keys(filteredParts).length > 0) {
      setSelectedPart(firstPart);
      loadQuestionsForPart(firstPart);
      setInitialized(true);
    } else if (!initialized && Object.keys(filteredParts).length === 0) {
      console.warn('No parts available in filteredParts:', filteredParts);
      setSelectedPart('');
      setFilteredQuestions([]);
      setInitialized(true); // Đánh dấu là đã khởi tạo để tránh lặp vô hạn
    }
  }, [initialized, filteredParts, firstPart]);

  useEffect(() => {
    if (selectedPart) loadQuestionsForPart(selectedPart);
  }, [selectedPart]);

  const calculatePartsData = (data) => {
    // Lọc bỏ các phần tử undefined, null hoặc không có part_order/questionCount
    const validData = data.filter(
      (part) => part && part.part_order && typeof part.questionCount === 'number'
    );
    if (validData.length === 0) {
      console.warn('No valid parts found in data:', data);
      return {};
    }

    let start = validData.some((part) => part.part_order === 'Part 1') ? 1 : 101;
    const partsData = {};
    validData
      .sort((a, b) => {
        const orderA = parseInt(a.part_order.split(' ')[1]);
        const orderB = parseInt(b.part_order.split(' ')[1]);
        return orderA - orderB;
      })
      .forEach((part) => {
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
      setFilteredQuestions([]);
      setCurrentAudio('');
      return;
    }
    if (!Array.isArray(testPartData) || testPartData.length === 0) {
      console.warn('testPartData is not loaded or is empty.');
      setFilteredQuestions([]);
      setCurrentAudio('');
      return;
    }

    const calculatedTestPart = testPartData
      .filter((tp) => tp.test_id === Number(id))
      .map((tp) => partData.find((p) => p.id === tp.part_id))
      .filter((part) => part) // Lọc bỏ undefined
      .sort((a, b) => {
        const orderA = parseInt(a.part_order.split(' ')[1]);
        const orderB = parseInt(b.part_order.split(' ')[1]);
        return orderA - orderB;
      });
    setSelectedTestPart(calculatedTestPart); // Lưu vào state

    setPartsData(calculatePartsData(calculatedTestPart));

    const part = calculatedTestPart.find((p) => p.part_order === partOrder);

    if (part) {
      const partQuestions = questionData.filter((q) => q.part_id === part.id);

      setFilteredQuestions(partQuestions);
      setCurrentPartQuestions(partQuestions);
      setCurrentAudio(part.audio_url || '');
    } else {
      console.warn(`No part found for partOrder: ${partOrder}`);
      setFilteredQuestions([]);
      setCurrentAudio('');
    }
  };

  const handlePartChange = (partOrder) => {
    setSelectedPart(partOrder);
    loadQuestionsForPart(partOrder);
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

    const partDetails = partData.find((p) =>
      questionData.some((q) => q.group_id === groupId && q.part_id === p.id)
    );
    const isTranslationPart = partDetails && ['Part 6', 'Part 7'].includes(partDetails.part_order);

    const isOnlyNumberOrRange = (content) => {
      if (!content) return true;
      const cleanContent = content.replace(/<\/?p>/g, '').trim();
      return /^\d+$/.test(cleanContent) || /^\d+-\d+$/.test(cleanContent);
    };

    let imageSrc = null;
    let paragraphContent = group.paragrap_main;

    if (group.paragrap_main && !isOnlyNumberOrRange(group.paragrap_main)) {
      const imgMatch = group.paragrap_main.match(/<img src="([^"]+)"[^>]*>/);
      if (imgMatch && imgMatch[1].startsWith('data:image/')) {
        imageSrc = imgMatch[1];
        paragraphContent = group.paragrap_main.replace(imgMatch[0], '');
      }
    }

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
    setSelectedAnswers((prevState) => {
      const newAnswers = { ...prevState, [questionId]: answerId };
      return newAnswers;
    });
  };

  const handleScrollToQuestion = (questionId) => {
    const targetPart = Object.entries(filteredParts).find(
      ([_, { start, end }]) => questionId >= start && questionId <= end
    );
    if (targetPart) {
      const [partName] = targetPart;
      if (selectedPart !== partName) {
        setSelectedPart(partName);
        loadQuestionsForPart(partName);
        setTimeout(() => {
          const element = document.getElementById(`question-${questionId}`);
          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 0);
      } else {
        const element = document.getElementById(`question-${questionId}`);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Hàm xử lý hiển thị/ẩn script
  const toggleScript = (questionId) => {
    setShowScripts((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const fetchTranslationFromGemini = async (
    audioScript,
    questionContent,
    answers,
    questionId,
    languageId,
    partOrder
  ) => {
    setIsTranslating((prev) => ({ ...prev, [questionId]: true }));
    const targetLanguage = languageMap[languageId] || 'Vietnamese';
    try {
      let prompt = '';
      let translation = {
        script: '',
        question: '',
      };

      const isQuestionContentValid =
        questionContent && questionContent.trim() !== '' && !/^\d+\.$/.test(questionContent.trim());
      const isAudioScriptValid = audioScript && audioScript !== 'No script available.';
      const partDetails = partData.find((p) =>
        questionData.some((q) => q.id === questionId && q.part_id === p.id)
      );
      const partOrder = partDetails?.part_order || '';

      if (['Part 1', 'Part 2'].includes(partOrder)) {
        if (isAudioScriptValid) {
          prompt = `Translate the following English audio script into a concise ${targetLanguage} sentence:\n\n${audioScript}`;
          const scriptTranslation = await sendPromptToBackend(prompt, languageId);
          translation.script = extractTranslationContent(scriptTranslation);
        }
        if (isQuestionContentValid) {
          const answerText = answers
            .map((ans, index) => `${String.fromCharCode(65 + index)}. ${ans.content}`)
            .join('\n');
          prompt = `Translate the following English question and its answer choices into ${targetLanguage} in a single block of text, maintaining the structure with the question followed by options labeled A, B, C, D:\n\nQuestion: ${questionContent}\n\nOptions:\n${answerText}`;
          const questionTranslation = await sendPromptToBackend(prompt, languageId);
          translation.question = extractTranslationContent(questionTranslation);
        }
      } else if (['Part 3', 'Part 4'].includes(partOrder)) {
        // Dịch cả script và câu hỏi cho Part 3, 4 nếu có
        if (isAudioScriptValid && isQuestionContentValid) {
          const answerText = answers
            .map((ans, index) => `${String.fromCharCode(65 + index)}. ${ans.content}`)
            .join('\n');
          prompt = `Translate the following into ${targetLanguage}, providing separate sections for the audio script and the question with its answer choices. Maintain the structure with the question followed by options labeled A, B, C, D:\n\n**Audio Script**:\n${audioScript}\n\n**Question**:\n${questionContent}\n\n**Options**:\n${answerText}`;
          const response = await sendPromptToBackend(prompt, languageId);
          const [scriptPart, questionPart] = response.split('**Bản dịch câu hỏi**:') || [
            response,
            '',
          ];
          translation = {
            script: extractTranslationContent(
              scriptPart?.replace('**Bản dịch script**:', '')?.trim() || ''
            ),
            question: extractTranslationContent(questionPart?.trim() || ''),
          };
        } else if (isQuestionContentValid) {
          // Chỉ dịch câu hỏi nếu không có script
          const answerText = answers
            .map((ans, index) => `${String.fromCharCode(65 + index)}. ${ans.content}`)
            .join('\n');
          prompt = `Translate the following English question and its answer choices into ${targetLanguage} in a single block of text, maintaining the structure with the question followed by options labeled A, B, C, D:\n\nQuestion: ${questionContent}\n\nOptions:\n${answerText}`;
          const questionTranslation = await sendPromptToBackend(prompt, languageId);
          translation = {
            script: '',
            question: extractTranslationContent(questionTranslation),
          };
        } else {
          return null;
        }
      } else if (['Part 5', 'Part 6', 'Part 7'].includes(partOrder) && isQuestionContentValid) {
        // Dịch câu hỏi cho Part 5, 6, 7
        const answerText = answers
          .map((ans, index) => `${String.fromCharCode(65 + index)}. ${ans.content}`)
          .join('\n');
        prompt = `Translate the following English question and its answer choices into ${targetLanguage} in a single block of text, maintaining the structure with the question followed by options labeled A, B, C, D:\n\nQuestion: ${questionContent}\n\nOptions:\n${answerText}`;
        const questionTranslation = await sendPromptToBackend(prompt, languageId);
        translation = {
          script: '',
          question: extractTranslationContent(questionTranslation),
        };
      } else {
        return null;
      }

      if (translation.script || translation.question) {
        setEditedTranslations((prev) => ({
          ...prev,
          [questionId]: translation,
        }));
        setIsEditingTranslation((prev) => ({
          ...prev,
          [questionId]: role === 'admin',
        }));
        return translation;
      }

      return null;
    } catch (error) {
      console.error('Error fetching translation from Gemini:', error);
      return null;
    } finally {
      setIsTranslating((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  // Hàm kích hoạt chế độ chỉnh sửa

  const toggleTranslation = async (
    questionId, //// Đây là order (41, 71, v.v.)
    audioScript,
    questionContent,
    answers,
    translateScript,
    groupId,
    languageId
  ) => {
    const isShowing = showTranslations[questionId];
    setShowTranslations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));

    if (!isShowing && groupId && !isNaN(Number(groupId))) {
      try {
        const res = await fetchData(
          `/translation/translate?media_id=${groupId}&question_id=${questionId}&language_id=${languageId}`,
          true
        );

        if (res.success && res.data) {
          let translationObj;
          const cleanContent = extractTranslationContent(res.data.translate_content);
          try {
            translationObj = JSON.parse(cleanContent);
            if (
              typeof translationObj === 'object' &&
              (translationObj.script || translationObj.question) &&
              translationObj.script !== 'Không có script để dịch.' &&
              translationObj.question !== 'Không có câu hỏi để dịch.' &&
              translationObj.script !== 'Không có nội dung để dịch.' &&
              translationObj.question !== 'Không có nội dung để dịch.'
            ) {
              setEditedTranslations((prev) => ({
                ...prev,
                [questionId]: translationObj,
              }));
              setIsEditingTranslation((prev) => ({
                ...prev,
                [questionId]: role === 'admin',
              }));
              return;
            }
          } catch (error) {
            console.warn('Invalid JSON, will fetch new translation:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching translation from database:', error);
      }
      const question = currentPartQuestions.find((q) => q.order === questionId);
      if (!question) {
        console.warn('Không tìm thấy câu hỏi trong currentPartQuestions với id =', questionId);
        return;
      }

      const partDetails = selectedTestPart.find((p) => p.id === question.part_id);

      const isAudioScriptValid = audioScript && audioScript !== 'No script available.';
      const isQuestionContentValid =
        questionContent && questionContent.trim() !== '' && !/^\d+\.$/.test(questionContent.trim());

      if (
        (['Part 1', 'Part 2'].includes(partDetails?.part_order) &&
          (isAudioScriptValid || isQuestionContentValid)) ||
        (['Part 3', 'Part 4'].includes(partDetails?.part_order) &&
          (isAudioScriptValid || isQuestionContentValid)) ||
        (['Part 5', 'Part 6', 'Part 7'].includes(partDetails?.part_order) && isQuestionContentValid)
      ) {
        const translation = await fetchTranslationFromGemini(
          audioScript,
          questionContent,
          answers,
          questionId,
          languageId
        );
        if (translation) {
          await handleSaveTranslation(questionId, groupId, translation, languageId);
        }
      }
    }
  };

  const handleEditTranslation = (questionId, currentTranslation) => {
    setIsEditingTranslation((prev) => ({
      ...prev,
      [questionId]: true,
    }));
    setEditedTranslations((prev) => ({
      ...prev,
      [questionId]: currentTranslation || '',
    }));
  };

  const handleTranslationChange = (questionId, field, value) => {
    setEditedTranslations((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  const handleSaveTranslation = async (questionId, groupId, translation, languageId) => {
    try {
      if (!translation || (!translation.script && !translation.question)) {
        return;
      }

      // Kiểm tra tính hợp lệ của translation
      if (!isValidTranslationContent(translation)) {
        console.error('Invalid translation content, not saving:', translation);
        if (role === 'admin') {
          alert('Không thể lưu: Bản dịch chứa nội dung lỗi hoặc không hợp lệ.');
        }
        return;
      }

      const payload = {
        media_id: Number(groupId),
        question_id: Number(questionId),
        translate_content: JSON.stringify({
          script: translation.script || '',
          question: translation.question || '',
        }),
        language_id: languageId,
      };
      const res = await postData('/translation/translate', payload, true);
      if (res.success) {
        alert('Translation saved successfully!');
        setIsEditingTranslation((prev) => ({
          ...prev,
          [questionId]: false,
        }));
        // Cập nhật groupData
        setGroupData((prev) =>
          prev.map((group) =>
            group.id === Number(groupId)
              ? { ...group, translate_script: JSON.stringify(translation) }
              : group
          )
        );
        // Cập nhật cache
        const cacheKey = `test-data-${id}`;
        const cachedData = await get(cacheKey);
        if (cachedData) {
          cachedData.groupMedia = cachedData.groupMedia.map((group) =>
            group.id === Number(groupId)
              ? { ...group, translate_script: JSON.stringify(translation) }
              : group
          );
          await set(cacheKey, cachedData);
        }
      }
    } catch (error) {
      console.error('Error saving translation:', error);
      alert('Failed to save translation. Please try again.');
    }
  };

  // Hàm gọi lại API Gemini để tạo bản dịch mới
  const handleRetryTranslation = async (
    questionId,
    audioScript,
    languageId,
    questionContent,
    answers,
    groupId
  ) => {
    try {
      setIsTranslating((prev) => ({ ...prev, [questionId]: true }));
      const translation = await fetchTranslationFromGemini(
        audioScript,
        questionId,
        languageId,
        questionContent,
        answers,
        groupId
      );
      setEditedTranslations((prev) => ({
        ...prev,
        [questionId]: translation,
      }));
    } catch (error) {
      console.error('Error retrying translation:', error);
      alert('Failed to retry translation. Please try again.');
    } finally {
      setIsTranslating((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  // Hàm gọi lại API Gemini để tạo lời giải thích mới
  const handleRetryExplanation = async (question, group, answers, correctAnswer) => {
    try {
      const explanation = await fetchExplanationFromGemini(question, group, answers, correctAnswer);

      // Kiểm tra tính hợp lệ của explanation
      if (!isValidTranslationContent(explanation)) {
        console.error('Invalid explanation content, not saving:', explanation);
        if (role === 'admin') {
          alert('Không thể lưu: Lời giải thích chứa nội dung lỗi hoặc không hợp lệ.');
        }
        return;
      }

      setEditedExplanations((prev) => ({
        ...prev,
        [question.order]: explanation,
      }));
    } catch (error) {
      console.error('Error retrying explanation:', error);
      alert(`Failed to retry explanation ${error.message}. Please try again.`);
    }
  };

  const parseParagraphMain = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const images = [];
    let textContent = '';

    // Lấy tất cả thẻ <img>
    const imgTags = doc.querySelectorAll('img');
    imgTags.forEach((img) => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('data:image/')) {
        images.push(src);
      }
    });

    // Lấy văn bản thuần (loại bỏ thẻ HTML)
    const stripHtml = (html) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };
    textContent = stripHtml(htmlContent).trim();

    return { images, textContent };
  };

  const fetchImageTranslation = async (mediaId, languageId = 1) => {
    setIsTranslatingImage((prev) => ({ ...prev, [mediaId]: true }));
    try {
      const prompt = `Analyze the image with the provided media_id and provide a concise ${languageMap[languageId] || 'Vietnamese'} translation of its content. If the image contains text, translate that text. If it's a non-text image (e.g., a diagram or photo), provide a brief description in ${languageMap[languageId] || 'Vietnamese'}.`;
      const translation = await sendPromptWithImageToBackend(prompt, mediaId, languageId);
      // Kiểm tra nếu translation chứa Base64
      const isBase64 = translation.match(/^data:image\/[a-zA-Z]+;base64,/);
      if (isBase64) {
        console.error('Image translation contains Base64 data, discarding...');
        return 'Lỗi: API trả về dữ liệu ảnh thay vì bản dịch.';
      }
      return translation;
    } catch (error) {
      console.error('Error fetching image translation:', error);
      return 'Lỗi khi dịch ảnh. Vui lòng thử lại.';
    } finally {
      setIsTranslatingImage((prev) => ({ ...prev, [mediaId]: false }));
    }
  };

  const fetchTextTranslation = async (text, languageId = 1) => {
    try {
      const prompt = `Translate the following text to ${languageMap[languageId] || 'Vietnamese'}:\n\n${text}`;
      const translation = await sendPromptToBackend(prompt, languageId);
      return translation;
    } catch (error) {
      console.error('Error fetching text translation:', error);
      return 'Lỗi khi dịch văn bản. Vui lòng thử lại.';
    }
  };

  const fetchParagraphTranslation = async (mediaId, paragraphMain, languageId = 1) => {
    const { images, textContent } = parseParagraphMain(paragraphMain);
    let combinedTranslation = '';
    // Dịch ảnh
    if (images.length > 0) {
      const imageTranslation = await fetchImageTranslation(mediaId, languageId);
      combinedTranslation += `**Bản dịch/mô tả ảnh**: ${imageTranslation}\n\n`;
    }
    // Dịch văn bản
    if (textContent) {
      const textTranslation = await fetchTextTranslation(textContent, languageId);
      combinedTranslation += `**Bản dịch văn bản**: ${textTranslation}`;
    }
    if (!combinedTranslation) {
      combinedTranslation = 'Không có nội dung để dịch.';
    }
    // Lưu bản dịch
    setImageTranslations((prev) => ({
      ...prev,
      [mediaId]: { content: combinedTranslation },
    }));
    setQuestionTranslations((prev) => ({
      ...prev,
      [mediaId]: { question: combinedTranslation, answers: [] },
    }));
    setIsEditingImageTranslation((prev) => ({
      ...prev,
      [mediaId]: role === 'admin',
    }));
    return combinedTranslation;
  };

  const toggleImageTranslation = async (
    mediaId,
    translateScript,
    paragraphMain,
    languageId = 1
  ) => {
    const isShowing = showImageTranslations[mediaId];
    // Lưu vị trí scroll trước khi đóng/mở dropdown
    let scrollY = window.scrollY;
    let container = document.getElementById(`translation-content-${mediaId}`);
    let containerScroll = container ? container.scrollTop : null;

    setShowImageTranslations((prev) => {
      return {
        ...prev,
        [mediaId]: !prev[mediaId],
      };
    });
    if (!isShowing && mediaId && !isNaN(Number(mediaId))) {
      try {
        const res = await fetchData(
          `/translation/translate?media_id=${mediaId}&question_id=${mediaId}&&language_id=${languageId}`,
          true
        );
        if (res.success && res.data) {
          const cleanTranslation = extractTranslationContent(res.data.translate_content);
          setImageTranslations((prev) => ({
            ...prev,
            [mediaId]: { content: cleanTranslation },
          }));
          setQuestionTranslations((prev) => ({
            ...prev,
            [mediaId]: { question: cleanTranslation, answers: [] },
          }));
          setIsEditingImageTranslation((prev) => ({
            ...prev,
            [mediaId]: role === 'admin',
          }));
          setTimeout(() => {
            if (containerScroll !== null) {
              let newContainer = document.getElementById(`translation-content-${mediaId}`);
              if (newContainer) newContainer.scrollTop = containerScroll;
            }
            window.scrollTo({ top: scrollY });
          }, 0);
          return;
        }
      } catch (error) {
        console.error('Error fetching image translation from database:', error);
      }
      console.log('No valid image translation found, fetching from API...');
      const translation = await fetchParagraphTranslation(mediaId, paragraphMain, languageId);
      if (isValidTranslationContent(translation)) {
        setImageTranslations((prev) => ({
          ...prev,
          [mediaId]: { content: translation },
        }));
        setQuestionTranslations((prev) => ({
          ...prev,
          [mediaId]: { question: translation, answers: [] },
        }));
        await handleSaveQuestionTranslation(mediaId, mediaId, translation, languageId); // Lưu với languageId đã chọn
      } else {
        // Nếu bản dịch không hợp lệ, lưu thông báo lỗi để hiển thị
        const errorMessage = translation || 'Không có nội dung để dịch.';
        setImageTranslations((prev) => ({
          ...prev,
          [mediaId]: { content: errorMessage },
        }));
        setQuestionTranslations((prev) => ({
          ...prev,
          [mediaId]: { question: errorMessage, answers: [] },
        }));
      }
    }
  };

  const fetchQuestionTranslation = async (
    questionContent,
    answers,
    questionId,
    languageId,
    groupId,
    mediaId
  ) => {
    setIsTranslatingQuestion((prev) => ({ ...prev, [questionId]: true }));
    // const languageMap = { 1: "Vietnamese", 2: "English", 3: "Japanese" };
    const targetLanguage = languageMap[languageId] || 'Vietnamese';
    try {
      const isQuestionContentValid =
        questionContent && questionContent.trim() !== '' && !/^\d+\.$/.test(questionContent.trim());

      let prompt;
      let translation;

      if (!isQuestionContentValid) {
        if (!answers || answers.length === 0) {
          return {
            question: `Không có câu hỏi hoặc đáp án để dịch sang ${targetLanguage}.`,
            answers: [],
          };
        }
        const answerText = answers.map((ans) => `${ans.content}`).join(', ');
        prompt = `Translate the following multiple-choice options ${answerText} of a TOEIC question, marked A, B, C, and D, into ${targetLanguage}. The output should be follow the TOEIC question format. Do not explain anything.`;
        translation = await sendPromptToBackend(prompt, languageId);

        setQuestionTranslations((prev) => ({
          ...prev,
          [questionId]: {
            question: translation,
            answers: [translation],
          },
        }));
      } else {
        // const answerText = answers
        //   .map((ans, index) => `${String.fromCharCode(65 + index)}. ${ans.content}`)
        //   .join('\n');
        const answerText = answers.map((ans) => `${ans.content}`).join(', ');
        // prompt = `Translate the following English question and its answer choices into ${targetLanguage} in a single block of text, maintaining the structure with the question followed by options labeled A, B, C, D. Ensure the question is translated fully and accurately:\n\nQuestion: ${questionContent}\n\nOptions:\n${answerText}`;
        prompt = TranslationPrompts.buildTranslationPrompt(
          questionContent,
          answerText,
          targetLanguage
        );
        translation = await sendPromptToBackend(prompt, languageId);

        setQuestionTranslations((prev) => ({
          ...prev,
          [questionId]: { question: translation, answers: [] },
        }));
      }

      setIsEditingQuestionTranslation((prev) => ({
        ...prev,
        [questionId]: role === 'admin',
      }));
      return { question: translation, answers: [] };
    } catch (error) {
      console.error('Error fetching question translation:', error);
      return {
        question: `Lỗi khi dịch câu hỏi hoặc đáp án sang ${targetLanguage}. Vui lòng thử lại.`,
        answers: answers.map(() => `Lỗi khi dịch đáp án sang ${targetLanguage}.`),
      };
    } finally {
      setIsTranslatingQuestion((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const extractTranslationContent = (input) => {
    if (!input || input === 'undefined') return 'Không có bản dịch nào.';

    // Kiểm tra Base64
    if (typeof input === 'string' && input.match(/^data:image\/[a-zA-Z]+;base64,/)) {
      return 'Lỗi: Dữ liệu chứa Base64 thay vì bản dịch.';
    }

    let current = input;
    try {
      // Parse JSON nếu input là chuỗi JSON
      if (
        typeof current === 'string' &&
        (current.includes('"translate_content"') || current.startsWith('[{'))
      ) {
        try {
          current = JSON.parse(current);
        } catch (e) {
          console.log('Input is not JSON, treating as plain text:', current);
        }
      }

      // Nếu là mảng, lấy translate_content từ phần tử đầu tiên
      if (Array.isArray(current)) {
        const item = current.find((item) => item && item.translate_content);
        current = item ? item.translate_content : current[0];
      }

      // Nếu là object, lấy translate_content
      if (current && typeof current === 'object' && current.translate_content) {
        current = current.translate_content;
      }

      // Nếu vẫn là chuỗi JSON, thử parse lại
      if (
        typeof current === 'string' &&
        (current.includes('"translate_content"') || current.startsWith('[{'))
      ) {
        try {
          current = JSON.parse(current);
          if (current.translate_content) {
            current = current.translate_content;
          }
        } catch (e) {
          console.log('Reached unparseable string:', current);
        }
      }

      // Lọc các dòng không mong muốn
      if (typeof current === 'string') {
        const lines = current.split('\n').filter((line) => {
          line = line.trim();
          return (
            line &&
            !line.startsWith('**') && // Loại bỏ các dòng bắt đầu bằng ** (như **Bản dịch/mô tả ảnh**)
            !line.toLowerCase().startsWith('here') && // Loại bỏ các dòng "Here are..."
            !line.toLowerCase().startsWith('translation:') && // Loại bỏ các dòng "Translation:"
            !line.match(/^\s*$/) // Loại bỏ dòng trống
          );
        });
        return lines.join('\n').trim() || 'Không có bản dịch nào.';
      }

      return typeof current === 'string' ? current : JSON.stringify(current);
    } catch (error) {
      console.error('Error extracting translation content:', error);
      return typeof input === 'string' ? input : 'Lỗi khi xử lý bản dịch.';
    }
  };

  const toggleQuestionTranslation = async (
    questionId,
    questionContent,
    answers,
    translateScript,
    groupId,
    languageId
  ) => {
    const isShowing = showQuestionTranslations[questionId];
    setShowQuestionTranslations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));

    if (!isShowing && groupId && !isNaN(Number(groupId))) {
      try {
        const res = await fetchData(
          `/translation/translate?media_id=${groupId}&question_id=${questionId}&language_id=${languageId}`,
          true
        );
        if (res.success && res.data) {
          const cleanTranslation = extractTranslationContent(res.data.translate_content);
          setQuestionTranslations((prev) => ({
            ...prev,
            [questionId]: { question: cleanTranslation, answers: [] },
          }));
          setIsEditingQuestionTranslation((prev) => ({
            ...prev,
            [questionId]: role === 'admin',
          }));
          return;
        }
      } catch (error) {
        console.error('Error fetching translation from database:', error);
      }

      const translation = await fetchQuestionTranslation(
        questionContent,
        answers,
        questionId,
        languageId
      );
      if (
        translation.question &&
        translation.question !==
        `Lỗi khi dịch câu hỏi hoặc đáp án sang ${languageMap[languageId] || 'Vietnamese'}. Vui lòng thử lại.`
      ) {
        await handleSaveQuestionTranslation(questionId, groupId, translation.question, languageId);
      }
    }
  };

  const handleEditQuestionTranslation = (questionId, currentTranslation) => {
    setIsEditingQuestionTranslation((prev) => ({
      ...prev,
      [questionId]: true,
    }));
    setIsEditingImageTranslation((prev) => ({
      ...prev,
      [questionId]: true,
    }));
    setQuestionTranslations((prev) => ({
      ...prev,
      [questionId]: currentTranslation,
    }));
    setImageTranslations((prev) => ({
      ...prev,
      [questionId]: { content: currentTranslation?.question || '' },
    }));
  };

  const handleQuestionTranslationChange = (questionId, field, value, index = null) => {
    setQuestionTranslations((prev) => {
      const updated = { ...prev[questionId] } || { question: '', answers: [] };
      if (field === 'question') {
        updated.question = value;
      } else if (field === 'answers' && index !== null) {
        updated.answers[index] = value;
      }
      return { ...prev, [questionId]: updated };
    });
    setImageTranslations((prev) => ({
      ...prev,
      [questionId]: {
        content: field === 'question' ? value : prev[questionId]?.content || '',
      },
    }));
  };

  const handleSaveQuestionTranslation = async (
    questionId,
    groupId,
    translation = null,
    languageId
  ) => {
    try {
      if (!groupId || isNaN(Number(groupId))) {
        throw new Error('Invalid groupId');
      }

      let cleanTranslation =
        translation ||
        questionTranslations[questionId]?.question ||
        imageTranslations[questionId]?.content ||
        questionTranslations[questionId]?.answers[0] ||
        '';

      cleanTranslation = extractTranslationContent(cleanTranslation);

      if (!isValidTranslationContent(cleanTranslation)) {
        console.error('Invalid translation content, not saving:', cleanTranslation);
        if (role === 'admin') {
          alert('Không thể lưu: Bản dịch chứa nội dung lỗi hoặc không hợp lệ.');
        }
        return;
      }

      const isBase64 = cleanTranslation.match(/^data:image\/[a-zA-Z]+;base64,/);
      if (isBase64) {
        console.error('Translation contains Base64 data, discarding...');
        cleanTranslation = 'Lỗi: Dữ liệu chứa Base64 thay vì bản dịch.';
      }

      if (
        !cleanTranslation ||
        cleanTranslation === 'undefined' ||
        cleanTranslation === '' ||
        cleanTranslation === 'Không có bản dịch nào.' ||
        cleanTranslation === 'Lỗi khi xử lý bản dịch.'
      ) {
        throw new Error('Invalid translation content');
      }

      const payload = {
        media_id: Number(groupId),
        question_id: Number(questionId),
        translate_content: cleanTranslation,
        language_id: languageId,
      };

      const res = await postData('/translation/translate', payload, true);

      if (res.success) {
        setQuestionTranslations((prev) => ({
          ...prev,
          [questionId]: {
            question: cleanTranslation,
            answers: questionTranslations[questionId]?.question ? [] : [cleanTranslation],
          },
        }));
        setImageTranslations((prev) => ({
          ...prev,
          [questionId]: { content: cleanTranslation },
        }));
        setIsEditingQuestionTranslation((prev) => ({
          ...prev,
          [questionId]: false,
        }));
        setIsEditingImageTranslation((prev) => ({
          ...prev,
          [questionId]: false,
        }));
        const translationRes = await fetchData(
          `/translation/translate?media_id=${groupId}&question_id=${questionId}&language_id=${languageId}`,
          true
        );
        if (translationRes.success) {
          setGroupData((prev) =>
            prev.map((group) =>
              group.id === Number(groupId)
                ? {
                  ...group,
                  translate_script: JSON.stringify(translationRes.data),
                }
                : group
            )
          );
          const cacheKey = `test-data-${id}`;
          const cachedData = await get(cacheKey);
          if (cachedData) {
            cachedData.groupMedia = cachedData.groupMedia.map((group) =>
              group.id === Number(groupId)
                ? {
                  ...group,
                  translate_script: JSON.stringify(translationRes.data),
                }
                : group
            );
            await set(cacheKey, cachedData);
          }
        }
        if (role === 'admin') {
          alert('Bản dịch đã được lưu thành công!');
        }
      }
    } catch (error) {
      console.error('Lỗi khi lưu bản dịch:', error);
      if (role === 'admin') {
        alert('Lưu bản dịch thất bại: ' + error.message);
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
      const isAudioPart =
        partDetails && ['Part 1', 'Part 2', 'Part 3', 'Part 4'].includes(partDetails.part_order);
      const isContentAnswerPart3to7 =
        partDetails &&
        ['Part 1', 'Part 2', 'Part 3', 'Part 4', 'Part 5', 'Part 6', 'Part 7'].includes(
          partDetails.part_order
        );

      const isTranslationPart =
        partDetails && ['Part 6', 'Part 7'].includes(partDetails.part_order);
      const group = groupData.find((g) => g.id === groupId);
      const translateScript = group?.translate_script || 'Không có bản dịch nào.';
      const selectedLangId = imageTranslationLanguages[groupId] || 1;

      const renderQuestionBlock = (question) => {
        const answersForQuestion = answerData.filter(
          (answer) => answer.question_id === question.id
        );
        const audioScript = group?.audio_script || 'No script available.';
        const translateScript = group?.translate_script || 'Không có bản dịch nào.';
        const partDetails = partData.find((p) => p.id === question.part_id);
        const isAudioPart =
          partDetails && ['Part 1', 'Part 2', 'Part 3', 'Part 4'].includes(partDetails.part_order);
        const isQuestionPart =
          partDetails && ['Part 5', 'Part 6', 'Part 7'].includes(partDetails.part_order);
        const isQuestionContentValid =
          question.content &&
          question.content.trim() !== '' &&
          !/^\d+\.$/.test(question.content.trim());

        return (
          <div key={question.id} id={`question-${question.order}`}>
            <p className="question-title">
              {isQuestionContentValid ? (
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
              {isQuestionContentValid
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

            {/* Phần dịch script (Part 1, 2, 3, 4) với combobox */}
            {isAudioPart && (
              <div className="script-dropdown" style={{ margin: '10px 20px', textAlign: 'left' }}>
                <div style={{ marginBottom: '8px' }}>
                  {Array.isArray(languages) && languages.length > 0 ? (
                    <select
                      value={questionLanguages[question.order] || 1}
                      onChange={(e) => {
                        const newLanguageId = Number(e.target.value);
                        setQuestionLanguages((prev) => ({
                          ...prev,
                          [question.order]: newLanguageId,
                        }));
                        if (showTranslations[question.order]) {
                          toggleTranslation(
                            question.order,
                            audioScript,
                            question.content,
                            answersForQuestion,
                            translateScript,
                            group?.id,
                            newLanguageId
                          );
                        }
                      }}
                      style={{
                        padding: '8px',
                        fontSize: '1.2rem',
                        borderRadius: '4px',
                        border: '1px solid #ced4da',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                      }}>
                      {languages.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.language_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p>Đang tải danh sách ngôn ngữ...</p>
                  )}
                </div>
                <button className="script-toggle-btn" onClick={() => toggleScript(question.order)}>
                  {showScripts[question.order] ? 'Hide script' : 'Show script'}
                  <FontAwesomeIcon
                    icon={faCaretDown}
                    className={`script-icon ${showScripts[question.order] ? 'rotate-up' : 'rotate-down'}`}
                  />
                </button>
                {showScripts[question.order] && (
                  <div className="script-content">
                    <p>{audioScript}</p>
                  </div>
                )}
                <button
                  className="script-toggle-btn"
                  onClick={() =>
                    toggleTranslation(
                      question.order,
                      audioScript,
                      question.content,
                      answersForQuestion,
                      translateScript,
                      group?.id,
                      questionLanguages[question.order] || 1
                    )
                  }
                  style={{ marginTop: '8px' }}
                  disabled={isTranslating[question.order]}>
                  {isTranslating[question.order]
                    ? 'Translating...'
                    : showTranslations[question.order]
                      ? 'Hide scripts translation'
                      : 'Show scripts translation'}
                  <FontAwesomeIcon
                    icon={faCaretDown}
                    className={`script-icon ${showTranslations[question.order] ? 'rotate-up' : 'rotate-down'}`}
                  />
                </button>
                {showTranslations[question.order] && (
                  <div className="script-content">
                    {role === 'admin' && isEditingTranslation[question.order] ? (
                      <>
                        <div>
                          <h4>Bản dịch Script</h4>
                          <textarea
                            value={
                              extractTranslationContent(
                                editedTranslations[question.order]?.script
                              ) || ''
                            }
                            onChange={(e) =>
                              handleTranslationChange(question.order, 'script', e.target.value)
                            }
                            style={{
                              width: '100%',
                              minHeight: '100px',
                              resize: 'vertical',
                              padding: '8px',
                              fontSize: '1.4rem',
                              marginBottom: '8px',
                            }}
                          />
                        </div>
                        {isQuestionContentValid && (
                          <div>
                            <h4>Bản dịch Câu hỏi</h4>
                            <textarea
                              value={
                                extractTranslationContent(
                                  editedTranslations[question.order]?.question
                                ) || ''
                              }
                              onChange={(e) =>
                                handleTranslationChange(question.order, 'question', e.target.value)
                              }
                              style={{
                                width: '100%',
                                minHeight: '100px',
                                resize: 'vertical',
                                padding: '8px',
                                fontSize: '1.4rem',
                                marginBottom: '8px',
                              }}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {editedTranslations[question.order]?.script && (
                          <div>
                            <h4>Bản dịch Script:</h4>
                            <p style={{ whiteSpace: 'pre-wrap' }}>
                              {extractTranslationContent(editedTranslations[question.order].script)}
                            </p>
                          </div>
                        )}
                        {isQuestionContentValid && editedTranslations[question.order]?.question && (
                          <div>
                            <h4>Bản dịch Câu hỏi:</h4>
                            <p style={{ whiteSpace: 'pre-wrap' }}>
                              {extractTranslationContent(
                                editedTranslations[question.order].question
                              )}
                            </p>
                          </div>
                        )}
                        {!editedTranslations[question.order]?.script &&
                          !editedTranslations[question.order]?.question && (
                            <p>Không có nội dung để dịch.</p>
                          )}
                      </>
                    )}
                    {role === 'admin' && (
                      <div style={{ marginTop: '8px' }}>
                        <button
                          className="script-toggle-btn"
                          onClick={() =>
                            handleEditTranslation(
                              question.order,
                              editedTranslations[question.order] || {
                                script: '',
                                question: '',
                              }
                            )
                          }
                          disabled={isEditingTranslation[question.order]}>
                          Update
                        </button>
                        <button
                          className="script-toggle-btn"
                          onClick={() =>
                            handleSaveTranslation(
                              question.order,
                              group.id,
                              editedTranslations[question.order],
                              questionLanguages[question.order] || 1
                            )
                          }
                          disabled={!isEditingTranslation[question.order]}
                          style={{
                            backgroundColor: isEditingTranslation[question.order]
                              ? '#2777ee'
                              : '#ccc',
                            color: isEditingTranslation[question.order] ? 'white' : 'black',
                          }}>
                          Save
                        </button>
                        <button
                          className="script-toggle-btn"
                          onClick={() =>
                            fetchTranslationFromGemini(
                              audioScript,
                              question.content,
                              answersForQuestion,
                              question.order,
                              questionLanguages[question.order] || 1
                            )
                          }
                          disabled={
                            !isEditingTranslation[question.order] || isTranslating[question.order]
                          }
                          style={{
                            backgroundColor:
                              isEditingTranslation[question.order] && !isTranslating[question.order]
                                ? '#2777ee'
                                : '#ccc',
                            color:
                              isEditingTranslation[question.order] && !isTranslating[question.order]
                                ? 'white'
                                : 'black',
                          }}>
                          {isTranslating[question.order] ? 'Retrying...' : 'Retry'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Phần dịch câu hỏi (Part 5, 6, 7) với combobox */}
            {isQuestionPart && (
              <div
                className="question-translation-dropdown"
                style={{ margin: '10px 20px', textAlign: 'left' }}>
                <div style={{ marginBottom: '8px' }}>
                  {Array.isArray(languages) && languages.length > 0 ? (
                    <select
                      value={questionLanguages[question.order] || 1}
                      onChange={(e) => {
                        const newLanguageId = Number(e.target.value);
                        setQuestionLanguages((prev) => ({
                          ...prev,
                          [question.order]: newLanguageId,
                        }));
                        if (showQuestionTranslations[question.order]) {
                          toggleQuestionTranslation(
                            question.order,
                            question.content,
                            answersForQuestion,
                            translateScript,
                            group?.id,
                            newLanguageId
                          );
                        }
                      }}
                      style={{
                        padding: '8px',
                        fontSize: '1.2rem',
                        borderRadius: '4px',
                        border: '1px solid #ced4da',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                      }}>
                      {languages.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.language_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p>Đang tải danh sách ngôn ngữ...</p>
                  )}
                </div>
                <button
                  className="translation-toggle-btn"
                  onClick={() =>
                    toggleQuestionTranslation(
                      question.order,
                      question.content,
                      answersForQuestion,
                      translateScript,
                      group?.id,
                      questionLanguages[question.order] || 1
                    )
                  }
                  disabled={isTranslatingQuestion[question.order]}>
                  {isTranslatingQuestion[question.order]
                    ? 'Translating...'
                    : showQuestionTranslations[question.order]
                      ? 'Hide translation'
                      : 'Show translation'}
                  <FontAwesomeIcon
                    icon={faCaretDown}
                    className={`translation-icon ${showQuestionTranslations[question.order] ? 'rotate-up' : 'rotate-down'
                      }`}
                  />
                </button>
                {showQuestionTranslations[question.order] && (
                  <div className="translation-content-wrapper">
                    {role === 'admin' && isEditingQuestionTranslation[question.order] ? (
                      <textarea
                        value={
                          extractTranslationContent(
                            questionTranslations[question.order]?.question
                          ) || ''
                        }
                        onChange={(e) =>
                          handleQuestionTranslationChange(
                            question.order,
                            'question',
                            e.target.value
                          )
                        }
                        style={{
                          width: '100%',
                          minHeight: '150px',
                          resize: 'vertical',
                          padding: '8px',
                          fontSize: '1.4rem',
                          marginBottom: '8px',
                        }}
                      />
                    ) : (
                      <p style={{ whiteSpace: 'pre-wrap' }}>
                        {extractTranslationContent(
                          questionTranslations[question.order]?.question
                        ) ||
                          extractTranslationContent(translateScript) ||
                          'Không có bản dịch nào.'}
                      </p>
                    )}
                    {role === 'admin' && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                          marginTop: '8px',
                        }}>
                        <button
                          className="translation-toggle-btn"
                          onClick={() =>
                            handleEditQuestionTranslation(
                              question.order,
                              questionTranslations[question.order]
                            )
                          }
                          disabled={isEditingQuestionTranslation[question.order]}>
                          Update
                        </button>
                        <button
                          className="translation-toggle-btn"
                          onClick={() =>
                            handleSaveQuestionTranslation(
                              question.order,
                              group.id,
                              questionTranslations[question.order]?.question,
                              questionLanguages[question.order] || 1
                            )
                          }
                          disabled={!isEditingQuestionTranslation[question.order]}
                          style={{
                            backgroundColor: isEditingQuestionTranslation[question.order]
                              ? '#2777ee'
                              : '#ccc',
                            color: isEditingQuestionTranslation[question.order] ? 'white' : 'black',
                          }}>
                          Save
                        </button>
                        <button
                          className="translation-toggle-btn"
                          onClick={() =>
                            fetchQuestionTranslation(
                              question.content,
                              answersForQuestion,
                              question.order,
                              questionLanguages[question.order] || 1
                            )
                          }
                          disabled={
                            !isEditingQuestionTranslation[question.order] ||
                            isTranslatingQuestion[question.order]
                          }
                          style={{
                            backgroundColor:
                              isEditingQuestionTranslation[question.order] &&
                                !isTranslatingQuestion[question.order]
                                ? '#2777ee'
                                : '#ccc',
                            color:
                              isEditingQuestionTranslation[question.order] &&
                                !isTranslatingQuestion[question.order]
                                ? 'white'
                                : 'black',
                          }}>
                          {isTranslatingQuestion[question.order] ? 'Retrying...' : 'Retry'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      };

      // Hàm render image-translation-section
      const renderImageTranslationSection = () => {
        if (!isTranslationPart) return null;
        return (
          <div
            className="image-translation-section"
            style={{ margin: '12px 20px', textAlign: 'left' }}>
            {Array.isArray(languages) && languages.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <select
                  value={selectedLangId}
                  onChange={(e) => {
                    e.preventDefault();
                    e.target.blur();
                    const newLangId = Number(e.target.value);
                    setImageTranslationLanguages((prev) => ({
                      ...prev,
                      [groupId]: newLangId,
                    }));
                    if (showImageTranslations[groupId]) {
                      toggleImageTranslation(
                        groupId,
                        translateScript,
                        group?.paragrap_main,
                        newLangId
                      );
                    }
                  }}
                  style={{
                    padding: '8px',
                    fontSize: '1.2rem',
                    borderRadius: '4px',
                    border: '1px solid #ced4da',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                  }}>
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.language_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              className="translation-toggle-btn"
              onClick={(e) => {
                e.preventDefault();
                toggleImageTranslation(
                  groupId,
                  translateScript,
                  group?.paragrap_main,
                  selectedLangId
                );
              }}
              disabled={isTranslatingImage[groupId]}>
              {isTranslatingImage[groupId]
                ? 'Translating...'
                : showImageTranslations[groupId]
                  ? 'Hide translation'
                  : 'Show translation'}
              <FontAwesomeIcon
                icon={faCaretDown}
                className={`translation-icon ${showImageTranslations[groupId] ? 'rotate-up' : 'rotate-down'
                  }`}
              />
            </button>
            {showImageTranslations[groupId] && (
              <div className="translation-content" id={`translation-content-${groupId}`}>
                {role === 'admin' && isEditingImageTranslation[groupId] ? (
                  <textarea
                    value={extractTranslationContent(imageTranslations[groupId]?.content || '')}
                    onChange={(e) =>
                      handleQuestionTranslationChange(groupId, 'question', e.target.value)
                    }
                    style={{
                      width: '100%',
                      minHeight: '150px',
                      resize: 'vertical',
                      padding: '8px',
                      fontSize: '1.4rem',
                      marginBottom: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                    }}
                  />
                ) : (
                  <p
                    style={{
                      whiteSpace: 'pre-wrap',
                      margin: '0 0 8px 0',
                      lineHeight: '1.5',
                      fontSize: '1.4rem',
                    }}>
                    {extractTranslationContent(
                      imageTranslations[groupId]?.content ||
                      translateScript ||
                      'Không có bản dịch nào.'
                    )}
                  </p>
                )}
                {role === 'admin' && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginTop: '8px',
                    }}>
                    <button
                      className="translation-toggle-btn"
                      onClick={() =>
                        handleEditQuestionTranslation(groupId, {
                          question: imageTranslations[groupId]?.content || '',
                        })
                      }
                      disabled={isEditingImageTranslation[groupId]}>
                      Update
                    </button>
                    <button
                      className="translation-toggle-btn"
                      onClick={() =>
                        handleSaveQuestionTranslation(
                          groupId,
                          groupId,
                          imageTranslations[groupId]?.content,
                          selectedLangId
                        )
                      }
                      disabled={!isEditingImageTranslation[groupId]}
                      style={{
                        backgroundColor: isEditingImageTranslation[groupId] ? '#2777ee' : '#ccc',
                        color: isEditingImageTranslation[groupId] ? 'white' : 'black',
                      }}>
                      Save
                    </button>
                    <button
                      className="translation-toggle-btn"
                      onClick={() =>
                        fetchParagraphTranslation(groupId, group?.paragrap_main, selectedLangId)
                      }
                      disabled={!isEditingImageTranslation[groupId] || isTranslatingImage[groupId]}
                      style={{
                        backgroundColor:
                          isEditingImageTranslation[groupId] && !isTranslatingImage[groupId]
                            ? '#2777ee'
                            : '#ccc',
                        color:
                          isEditingImageTranslation[groupId] && !isTranslatingImage[groupId]
                            ? 'white'
                            : 'black',
                      }}>
                      {isTranslatingImage[groupId] ? 'Retrying...' : 'Retry'}
                    </button>
                  </div>
                )}
              </div>
            )}
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
                {renderImageTranslationSection()}
              </div>
              <div className="question-details">{questions.map(renderQuestionBlock)}</div>
            </div>
          ) : (
            <div className="question-details">
              <GroupParagraph groupId={groupId} groupData={groupData} />
              {renderImageTranslationSection()}
              {questions.map(renderQuestionBlock)}
            </div>
          )}
        </div>
      );
    });
  };

  const renderAllQuestions = () => {
    return Object.entries(filteredParts).map(([part, { start, end }]) => (
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
    user_id: userId,
    test_id: id,
    dataprogress: Object.fromEntries(
      Object.entries(selectedAnswers).map(([key, value]) => [key, value.toString()])
    ),
    time: isCountingDown ? timePick - timeLeft : timeLeft,
    type: 'Practice',
    part: parts,
  };

  const handleSave = async () => {
    try {
      const confirm = window.confirm('Do you want to save your progress?');
      if (confirm) {
        const usedTime = timePick > 0 ? Number(timePick) - timeLeft : timeLeft; // Thời gian đã sử dụng
        const savePayload = {
          ...payload,
          time: usedTime, // Thời gian đã sử dụng
          time_left: timePick > 0 ? timeLeft : null, // Nếu có Time Limit thì lưu timeLeft, nếu No Limit thì null
          status: 'save',
        };
        setIsLoading(true);
        const res = await postData('/history', savePayload, true);
        if (res.success) {
          localStorage.setItem(`testProgress-${id}`, JSON.stringify(selectedAnswers));
          localStorage.setItem(`testTime-${id}`, JSON.stringify({ timeLeft, timeLimit: timePick }));
          setIsCountingDown(false);
          setTimeout(() => {
            navigate('/');
          }, 1000);
        } else {
          throw new Error(res.errorData?.detail || 'Failed to save progress');
        }
      }
    } catch (error) {
      console.log('Save fault:', error);
      alert('Failed to save progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (auto) => {
    try {
      let confirm;
      if (auto !== 'auto') {
        confirm = window.confirm('Do you sure want to submit?');
      }
      if (confirm || auto === 'auto') {
        const user = JSON.parse(localStorage.getItem('user'));
        try {
          await deleteData(`/history/saved?user_id=${user.id}&test_id=${id}`, true);
        } catch (err) {
          if (err.message.includes('404')) {
            console.log('No saved progress to delete, proceeding with submit.');
          } else {
            throw err;
          }
        }

        const usedTime = timePick > 0 ? Number(timePick) - timeLeft : timeLeft;
        const submitPayload = {
          ...payload,
          time: usedTime,
          time_left: timePick > 0 ? timeLeft : null, // Nếu có Time Limit thì lưu timeLeft, nếu No Limit thì null
          status: 'submit',
        };
        setIsLoading(true);
        const res = await postData('/history', submitPayload, true);
        if (res.success) {
          const resultId = res?.data.id;
          sessionStorage.setItem('hasSubmitted', 'true');
          setTimeout(() => {
            navigate(`/test/${id}/result/${resultId}`);
          }, 1000);
          localStorage.removeItem(`testProgress-${id}`);
          localStorage.removeItem(`testTime-${id}`);
          sessionStorage.removeItem(`testSession-${id}`);
        } else {
          throw new Error(res.errorData?.detail || 'Failed to submit');
        }
      }
    } catch (error) {
      showError('Failed to submit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExit = () => {
    const confirm = window.confirm('Are you sure exit the test!');
    if (confirm) {
      localStorage.removeItem(`testProgress-${id}`);
      localStorage.removeItem(`testTime-${id}`);
      localStorage.removeItem(`testTimeLimit-${id}`);
      sessionStorage.removeItem(`testSession-${id}`);
      navigate('/');
    }
  };

  useEffect(() => {
    localStorage.setItem(`testProgress-${id}`, JSON.stringify(selectedAnswers));
  }, [selectedAnswers, id]);

  useEffect(() => {
    if (timeLeft !== null && isCountingDown !== null && timePick !== null) {
      localStorage.setItem(
        `testTime-${id}`,
        JSON.stringify({ timeLeft, timePick, isCountingDown })
      );
    }
  }, [timeLeft, timePick, isCountingDown, id]);

  useEffect(() => {
    if (timePick == 0) {
      setIsCountingDown(false);
    } else if (timePick > 0) {
      setIsCountingDown(true);
    }
  }, [timeLeft, timePick]);

  useEffect(() => {
    if (isCountingDown) {
      if (timeLeft === 0) handleSubmit('auto');
    } else {
      if (timeLeft === 7200) {
        handleSubmit('auto');
      }
    }
  }, [timeLeft, isCountingDown]);

  useEffect(() => {
    setSelectedTest(testData.find((test) => test.id === Number(id)));
    handlePartChange(firstPart);
  }, [partData, questionData, testPartData, testData, firstPart]);

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
    <div className="practice-page">
      {/* Thêm progress bar hiển thị khi submit */}
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

        <button type="submit" disabled={isLoading} className="exit-button" onClick={handleExit}>
          {isLoading ? <CircularProgress size={24} /> : 'Exit'}
        </button>
      </div>

      <div className="content-container">
        <div className="left-section">
          <div className=".sticky-audio-tabs">
            <div className="part-tabs ">
              {Object.entries(filteredParts).map(([part]) => (
                <button
                  key={part}
                  onClick={() => handlePartChange(part)}
                  className={selectedPart === part ? 'active' : ''}>
                  {part}
                </button>
              ))}
            </div>

            <div className="audio-controls ">
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
            <CountdownTimer time={timeLeft} setTime={setTimeLeft} timeDown={isCountingDown} />
            <div className="group-btn">
              <button
                type="submit"
                disabled={isLoading}
                className="submit-button"
                onClick={handleSubmit}>
                {isLoading ? <CircularProgress size={24} /> : 'Submit'}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="save-button"
                onClick={handleSave}>
                {isLoading ? <CircularProgress size={24} /> : 'Save'}
              </button>
            </div>
          </div>
          <div className="question-nav">{renderAllQuestions()}</div>
        </div>
      </div>
    </div>
  );
};

export default PracticeTestPage;
