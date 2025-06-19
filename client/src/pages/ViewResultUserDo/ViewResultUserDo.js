import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// Dữ liệu chi tiết Part và câu hỏi
import './ViewResultUserDo.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCaretDown } from '@fortawesome/free-solid-svg-icons';

import { setAlertBox } from '../../redux/slides/userSlide';
import { sendPromptToBackend, sendPromptWithImageToBackend } from '../../service/ChatbotAI';
import { fetchData, postData } from '../../service/UserService';

import { useDispatch, useSelector } from 'react-redux';

// Hiển thị tab Part và Navigation
const partsData = {
  'Part 1': { start: 1, end: 6 },
  'Part 2': { start: 7, end: 31 },
  'Part 3': { start: 32, end: 70 },
  'Part 4': { start: 71, end: 100 },
  'Part 5': { start: 101, end: 130 },
  'Part 6': { start: 131, end: 146 },
  'Part 7': { start: 147, end: 200 },
};

const ViewResultUserDo = () => {
  const navigate = useNavigate();
  // const context = useContext(MyContext);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [selectedPart, setSelectedPart] = useState('');
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [dataprogress, setDataprogress] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [selectedTest, setSelectedTest] = useState({});
  const [currentAudio, setCurrentAudio] = useState('');
  const [selectedHistory, setSelectedHistory] = useState({});
  const [partsData, setPartsData] = useState([]); //Để hiện thị question nav
  const [showScripts, setShowScripts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoadingAll, setIsLoadingAll] = useState(true);

  const [showTranslations, setShowTranslations] = useState({}); // Trạng thái hiển thị bản dịch
  const [isEditingTranslation, setIsEditingTranslation] = useState({}); // Trạng thái chỉnh sửa
  const [editedTranslations, setEditedTranslations] = useState({}); // Nội dung bản dịch đã chỉnh sửa
  const [isTranslating, setIsTranslating] = useState({}); // Trạng thái đang dịch
  const [showExplanations, setShowExplanations] = useState({}); // Trạng thái hiển thị lời giải thích
  const [explanations, setExplanations] = useState({}); // Nội dung lời giải thích
  const [isExplaining, setIsExplaining] = useState({}); // Trạng thái đang gọi API giải thích
  const [isEditingExplanation, setIsEditingExplanation] = useState({}); // Trạng thái chỉnh sửa lời giải thích
  const [editedExplanations, setEditedExplanations] = useState({}); // Nội dung lời giải thích đã chỉnh sửa
  const { role } = useSelector((state) => state.user);

  const [showImageTranslations, setShowImageTranslations] = useState({});
  const [imageTranslations, setImageTranslations] = useState({});
  const [isTranslatingImage, setIsTranslatingImage] = useState({});
  const [isEditingImageTranslation, setIsEditingImageTranslation] = useState({});
  const [imageTranslationLanguages, setImageTranslationLanguages] = useState({});

  const [questionTranslations, setQuestionTranslations] = useState({});
  const [scrollPositions, setScrollPositions] = useState({});

  const [languages, setLanguages] = useState([]); // Added state for languages
  const [questionLanguages, setQuestionLanguages] = useState({});

  const [selectedTestPart, setSelectedTestPart] = useState([]);
  const [currentPartQuestions, setCurrentPartQuestions] = useState([]);

  const hasSelectedInitialPart = useRef(false);
  // Lấy các tham số từ đường dẫn
  const { id, resultId } = useParams();

  // Check authentication
  useEffect(() => {
    if (!user.isLoggedIn || !user?.id) {
      dispatch(
        setAlertBox({
          open: true,
          error: true,
          msg: 'Please login to view test results!',
        })
      );
      navigate('/login');
    }
  }, [user.isLoggedIn, user.id, navigate]);

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
      /Lỗi khi giải thích/i,
      /Không có nội dung để giải thích/i,
      /Failed to.*translation/i,
      /Failed to.*explanation/i,
      /không thể dịch/i,
      /không thể giải thích/i,
      /vui lòng thử lại/i,
      /không có văn bản được cung cấp/i,
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

  //Scroll
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.header');
      const leftSection = document.querySelector('.left-section');
      const audioControls = document.querySelector('.audio-controls');
      const partTabs = document.querySelector('.part-tabs');

      if (!header || !leftSection || !audioControls || !partTabs) return;

      const leftSectionRect = leftSection.getBoundingClientRect();
      const headerHeight = header.offsetHeight;
      const fixedTop = headerHeight + 27; // Header 80px + khoảng cách 40px

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
  }, []);

  // Preserve scroll position
  const preserveScrollPosition = (callback) => {
    const scrollY = window.scrollY;
    callback();
    setTimeout(() => {
      window.scrollTo(0, scrollY);
    }, 0);
  };

  // Lấy dữ liệu từ api
  const [questionData, setQuestionData] = useState([]);
  const [partData, setPartData] = useState([]);
  const [groupData, setGroupData] = useState([]);
  const [answerData, setAnswerData] = useState([]);
  const [testPartData, setTestPartData] = useState([]);
  const [testData, setTestData] = useState([]);

  // Fetch all data
  useEffect(() => {
    let mounted = true;

    const fetchAPI = async () => {
      if (!user.isLoggedIn || !user?.id) return;
      try {
        setIsLoadingAll(true);
        setLoadingProgress(0);
        const totalRequests = 7;
        let completedRequests = 0;

        const updateProgress = () => {
          completedRequests += 1;
          const progress = Math.min((completedRequests / totalRequests) * 100, 90);
          setLoadingProgress(progress);
          console.log(`Progress updated: ${progress}%`);
        };

        const fetchPromises = [
          fetchData('/questions', true).then((data) => {
            updateProgress();
            return data;
          }),
          fetchData('/part', true).then((data) => {
            updateProgress();
            return data;
          }),
          fetchData(`/tests/${id}/media`, true).then((res) => {
            updateProgress();
            return res;
          }),
          fetchData('/answer', false).then((data) => {
            updateProgress();
            return data;
          }),
          fetchData('/testpart', false).then((data) => {
            updateProgress();
            return data;
          }),
          fetchData('/tests', false).then((data) => {
            updateProgress();
            return data;
          }),
          fetchData('/history', true).then((data) => {
            updateProgress();
            return data;
          }),
          fetchData('/languages', true).then((data) => {
            updateProgress();
            return data;
          }),
        ];

        const [questions, parts, groupMedia, answers, testParts, tests, history, languages] =
          await Promise.all(fetchPromises);

        if (mounted) {
          const updatedGroupData = groupMedia.map((group) => {
            // Find the part_id by checking questions associated with this group
            const relatedQuestion = questions.find((q) => q.group_id === group.id);
            const testPart = testParts.find(
              (tp) => tp.test_id === group.test_id && tp.part_id === relatedQuestion?.part_id
            );
            const part = parts.find((p) => p.id === testPart?.part_id);
            return {
              ...group,
              part_id: part?.id || null,
              part_order: part?.part_order || null,
            };
          });
          setGroupData(updatedGroupData || []);
          // Xử lý languages để đảm bảo là mảng
          const normalizedLanguages = Array.isArray(languages?.data)
            ? languages.data
            : Array.isArray(languages)
              ? languages
              : [];
          console.log('Fetched languages:', normalizedLanguages);
          setQuestionData(questions || []);
          setPartData(parts || []);
          setGroupData(updatedGroupData || []);
          setAnswerData(answers || []);
          setTestPartData(testParts || []);
          setTestData(tests || []);
          setLanguages(normalizedLanguages || []);

          const userHistory = history.find(
            (item) => item.id === Number(resultId) && item.user_id === user.id
          );
          if (userHistory) {
            setSelectedHistory(userHistory);
          } else {
            dispatch(
              setAlertBox({
                open: true,
                error: true,
                msg: 'You do not have permission to view this test result!',
              })
            );
            navigate('/');
          }

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
        }
      } catch (error) {
        console.error('Fetch API error:', error);
        if (mounted) {
          if (error.status === 401) {
            dispatch(
              setAlertBox({
                open: true,
                error: true,
                msg: 'Please login to view test results!',
              })
            );
            navigate('/login');
          } else {
            dispatch(
              setAlertBox({
                open: true,
                error: true,
                msg: 'Failed to load test results. Please try again.',
              })
            );
          }
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchAPI();
    return () => {
      mounted = false;
    };
  }, [id, resultId, user.isLoggedIn, user.id, navigate, dispatch]);

  useEffect(() => {
    setSelectedTest(testData.find((test) => test.id === Number(id)));
    if (selectedHistory.type === 'Practice' || selectedHistory.type === 'Fulltest') {
      if (selectedHistory.part.length > 0 && !selectedPart) {
        handlePartChange(selectedHistory.part[0]);
      }
    } else {
      handlePartChange('Part 1');
    }
  }, [testData, questionData, testPartData, languages]);

  // Gọi API
  useEffect(() => {
    const fetchTests = async () => {
      try {
        fetchData('/history', true).then((res) => {
          // Lọc bài test thuộc về user đã đăng nhập
          const userId = JSON.parse(localStorage.getItem('user'))?.id; // Lấy user ID từ localStorage
          const history = res.find(
            (item) => item.id === Number(resultId) && item.user_id === userId
          );
          console.log(history);
          if (history) {
            setSelectedHistory(history); // Cập nhật trực tiếp selectedHistory
          } else {
            dispatch(
              setAlertBox({
                open: true,
                error: true,
                msg: 'You do not have permission to view this test!',
              })
            );
            navigate('/'); // Chuyển về trang chủ nếu không hợp lệ
          }
        });
      } catch (error) {
        console.log('Fetch api result fault!');
      }
    };
    fetchTests();
  }, [resultId]);

  // Tạo PartsData
  const calculatePartsData = (data) => {
    let start = 1; // Bắt đầu từ câu đầu tiên
    const partsData = {};
    const hasPart1 = (data) => {
      return data.some((part) => part.part_order === 'Part 1');
    };
    console.log(hasPart1(data));
    if (!hasPart1(data)) {
      start = 101;
    }
    data.forEach((part) => {
      const end = start + part.questionCount - 1; // Xác định câu kết thúc
      partsData[part.part_order] = { start, end }; // Gán dữ liệu cho part
      start = end + 1; // Cập nhật câu bắt đầu cho phần tiếp theo
    });

    return partsData;
  };

  // Lọc câu hỏi từ Part
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
    console.log('selectedTestPart:', calculatedTestPart); // Debug
    setSelectedTestPart(calculatedTestPart); // Lưu vào state

    setPartsData(calculatePartsData(calculatedTestPart));

    const part = calculatedTestPart.find((p) => p.part_order === partOrder);
    console.log('part', part);

    if (part) {
      const partQuestions = questionData.filter((q) => q.part_id === part.id);
      console.log('partQuestions', partQuestions);

      setFilteredQuestions(partQuestions);
      setCurrentPartQuestions(partQuestions);
      setCurrentAudio(part.audio_url || '');
    } else {
      console.warn(`No part found for partOrder: ${partOrder}`);
      setFilteredQuestions([]);
      setCurrentAudio('');
    }
  };

  // Xử lý selectedHistory và filteredParts
  useEffect(() => {
    if (!selectedHistory || Object.keys(selectedHistory).length === 0) {
      return;
    }

    console.log(selectedHistory);
    if (selectedHistory && selectedHistory.type === 'Practice') {
      setFilteredParts(selectedHistory.part);
      setDataprogress(selectedHistory.dataprogress);
    } else {
      setFilteredParts(Object.keys(partsData));
      setDataprogress(selectedHistory.dataprogress);
    }
  }, [selectedHistory, partsData]);

  // Xử lý chọn Part đầu tiên
  useEffect(() => {
    if (
      filteredParts.length > 0 &&
      !hasSelectedInitialPart.current &&
      Array.isArray(partData) &&
      partData.length > 0 &&
      !selectedPart
    ) {
      const firstPart = filteredParts[0];
      handlePartChange(firstPart);
      hasSelectedInitialPart.current = true;
    }
  }, [filteredParts, partData]);

  // Update handlePartChange to prevent redundant calls
  const handlePartChange = (partOrder) => {
    if (selectedPart === partOrder) return;
    if (!Array.isArray(partData) || partData.length === 0) {
      console.warn('partData is not loaded or is empty.');
      return;
    }
    preserveScrollPosition(() => {
      setSelectedPart(partOrder);
      loadQuestionsForPart(partOrder);
      const selectedTestPart = testPartData
        .filter((tp) => tp.test_id === Number(id))
        .map((tp) => partData.find((p) => p.id === tp.part_id));
      const part = selectedTestPart.find((p) => p.part_order === partOrder);
      if (part && part.audio_url) {
        setCurrentAudio(`http://11.11.4.138:8000/media/${part.audio_url}`);
      } else {
        setCurrentAudio('');
      }
      if (!part) {
        console.error(`Part ${partOrder} not found in test ${id}`);
        const firstPart = selectedTestPart[0]?.part_order;
        if (firstPart) {
          setSelectedPart(firstPart);
          loadQuestionsForPart(firstPart);
        }
      }
    });
  };

  const getGroupContent = (groupId) => {
    const group = groupData.find((g) => g.id === groupId);

    if (!group) return null;

    const { images, textContent } = parseParagraphMain(group.paragrap_main || '');

    // Làm sạch media_name
    const cleanMediaName = group.media_name
      ? group.media_name.replace(/<\/?[^>]+(>|$)/g, '').trim()
      : '';

    // Xác định Part dựa trên media_name pattern
    let isPart6or7 = false;

    if (cleanMediaName) {
      const questionRange = cleanMediaName.match(/(\d+)-(\d+)/);
      if (questionRange) {
        const startQuestion = parseInt(questionRange[1]);
        const endQuestion = parseInt(questionRange[2]);
        isPart6or7 =
          (startQuestion >= 141 && startQuestion <= 146) ||
          (startQuestion >= 147 && startQuestion <= 200) ||
          (endQuestion >= 141 && endQuestion <= 200);
      }
    }

    // Đơn giản hóa logic render image
    const imageToRender = group.image_url ? (
      <div className="group-image">
        <img src={group.image_url} alt="Group Illustration" />
      </div>
    ) : images.length > 0 ? (
      <div className="group-image">
        <img src={images[0]} alt="Group Illustration 1" />
      </div>
    ) : null;

    // Hàm xử lý thay đổi nội dung textarea
    const handleImageTranslationChange = (groupId, value) => {
      console.log('Changing translation for groupId:', groupId, 'Value:', value);
      setEditedTranslations((prev) => ({
        ...prev,
        [groupId]: value,
      }));
    };

    // Hàm xử lý khi nhấn nút "Edit"
    const handleEditImageTranslation = (groupId, currentTranslation) => {
      console.log('Editing translation for groupId:', groupId, 'Current:', currentTranslation);
      if (isEditingImageTranslation[groupId]) {
        // Nếu đang chỉnh sửa, hủy chỉnh sửa
        setIsEditingImageTranslation((prev) => ({
          ...prev,
          [groupId]: false,
        }));
        // Khôi phục nội dung gốc
        setEditedTranslations((prev) => ({
          ...prev,
          [groupId]: imageTranslations[groupId]?.content || group?.translate_content || '',
        }));
      } else {
        // Bật chế độ chỉnh sửa
        setIsEditingImageTranslation((prev) => ({
          ...prev,
          [groupId]: true,
        }));
        // Khởi tạo nội dung chỉnh sửa
        setEditedTranslations((prev) => ({
          ...prev,
          [groupId]: currentTranslation || '',
        }));
      }
    };

    const toggleImageTranslation = async (
      groupId,
      translateContent,
      paragrapMain,
      group,
      languageId
    ) => {
      const isShowing = showImageTranslations[groupId];

      // Toggle trạng thái hiển thị
      setShowImageTranslations((prev) => ({
        ...prev,
        [groupId]: !prev[groupId],
      }));

      // Chỉ xử lý khi mở dropdown (không xử lý khi đóng)
      if (!isShowing) {
        // Kiểm tra database trước
        try {
          const res = await fetchData(
            `/translate?media_id=${groupId}&question_id=${groupId}&language_id=${languageId}`,
            true
          );
          if (res.success && res.data && res.data.translate_content) {
            const cleanTranslation = extractTranslationContent(res.data.translate_content);
            if (cleanTranslation && cleanTranslation !== 'Không có bản dịch nào.') {
              // Nếu có bản dịch hợp lệ, hiển thị ngay
              setImageTranslations((prev) => ({
                ...prev,
                [groupId]: { content: cleanTranslation },
              }));
              setEditedTranslations((prev) => ({
                ...prev,
                [groupId]: cleanTranslation,
              }));
              return; // Thoát hàm, không gọi API Gemini
            }
          }
        } catch (error) {
          console.error('Error fetching translation from database:', error);
        }

        // Nếu không có bản dịch trong database, gọi API Gemini
        setIsTranslatingImage((prev) => ({ ...prev, [groupId]: true }));
        try {
          const targetLanguage = languageMap[languageId] || 'Vietnamese';
          let prompt = `Translate the content of the image or related text into ${targetLanguage}. The text content (if any) is: ${paragrapMain || 'No text available.'}. If the image contains text, describe and translate it concisely.`;
          let response;

          console.log('Preparing to call Gemini API for translation:', groupId);

          if (isPart6or7 && (group?.image_url || paragrapMain?.match(/<img[^>]*>/))) {
            console.log('Sending media_id to Gemini API for translation:', groupId);
            response = await sendPromptWithImageToBackend(prompt, groupId, languageId);
            await handleSaveQuestionTranslation(groupId, groupId, response, languageId);
          } else if (isPart6or7) {
            console.log('Part 6/7 but no image, translating text only');
            const textPrompt = `Translate this text into ${targetLanguage}: ${paragrapMain || textContent || 'No content to translate'}`;
            response = await sendPromptToBackend(textPrompt, languageId);
            await handleSaveQuestionTranslation(groupId, groupId, response);
          } else {
            console.log('Not Part 6/7 or no content to translate');
            response = 'Không có nội dung để dịch.';
          }

          setImageTranslations((prev) => ({
            ...prev,
            [groupId]: { content: response },
          }));
          setEditedTranslations((prev) => ({
            ...prev,
            [groupId]: response,
          }));
        } catch (error) {
          console.error('Error fetching image translation:', error);
          setImageTranslations((prev) => ({
            ...prev,
            [groupId]: { content: 'Lỗi khi dịch ảnh. Vui lòng thử lại.' },
          }));
        } finally {
          setIsTranslatingImage((prev) => ({ ...prev, [groupId]: false }));
        }
      }
    };

    return (
      <div className="group-content">
        {imageToRender}
        {group.media_name && /^\d+-\d+$/.test(cleanMediaName) && (
          <div className="group-name">Questions {cleanMediaName} refer to the following:</div>
        )}
        {textContent && /[a-zA-Z]/.test(textContent) && (
          <div className="group-paragraph">
            <div dangerouslySetInnerHTML={{ __html: textContent }} />
          </div>
        )}
        {isPart6or7 && (
          <div className="script-dropdown">
            {Array.isArray(languages) && languages.length > 0 && (
              <div className="language-selector-container" style={{ marginBottom: '8px' }}>
                <select
                  value={imageTranslationLanguages[groupId] || 1}
                  onChange={(e) => {
                    const newLanguageId = Number(e.target.value);
                    setImageTranslationLanguages((prev) => ({
                      ...prev,
                      [groupId]: newLanguageId,
                    }));
                    if (showImageTranslations[groupId]) {
                      toggleImageTranslation(
                        groupId,
                        group?.translate_content,
                        group.paragrap_main || textContent,
                        group,
                        newLanguageId
                      );
                    }
                  }}
                  className="language-selector"
                  style={{
                    padding: '5px',
                    fontSize: '1.2rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
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
              className="script-toggle-btn"
              onClick={() =>
                toggleImageTranslation(
                  groupId,
                  group?.translate_content,
                  group.paragrap_main || textContent,
                  group,
                  imageTranslationLanguages[groupId] || 1
                )
              }
              style={{ marginTop: '8px' }}
              disabled={isTranslatingImage[groupId]}>
              {isTranslatingImage[groupId]
                ? 'Translating...'
                : showImageTranslations[groupId]
                  ? 'Hide translation'
                  : 'Show translation'}
              <FontAwesomeIcon
                icon={faCaretDown}
                className={`script-icon ${showImageTranslations[groupId] ? 'rotate-up' : 'rotate-down'}`}
              />
            </button>
            {showImageTranslations[groupId] && (
              <div className="script-content" id={`translation-content-${groupId}`}>
                {role === 'admin' && isEditingImageTranslation[groupId] ? (
                  <textarea
                    value={editedTranslations[groupId] || imageTranslations[groupId]?.content || ''}
                    onChange={(e) => handleImageTranslationChange(groupId, e.target.value)}
                    onKeyDown={(e) => console.log('Key pressed:', e.key)}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      resize: 'vertical',
                      padding: '8px',
                      fontSize: '1.4rem',
                    }}
                    placeholder="Nhập bản dịch tại đây..."
                  />
                ) : (
                  <p>
                    {imageTranslations[groupId]?.content ||
                      group?.translate_content ||
                      'Không có bản dịch nào.'}
                  </p>
                )}
                {role === 'admin' && (
                  <div style={{ marginTop: '8px' }}>
                    <button
                      className="script-toggle-btn"
                      onClick={() =>
                        handleEditImageTranslation(
                          groupId,
                          imageTranslations[groupId]?.content || group?.translate_content
                        )
                      }
                      disabled={isEditingImageTranslation[groupId]}>
                      {isEditingImageTranslation[groupId] ? 'Cancel' : 'Edit'}
                    </button>
                    <button
                      className="script-toggle-btn"
                      onClick={() =>
                        handleSaveQuestionTranslation(
                          groupId,
                          groupId,
                          editedTranslations[groupId] || imageTranslations[groupId]?.content,
                          imageTranslationLanguages[groupId] || 1
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
                      className="script-toggle-btn"
                      onClick={() =>
                        toggleImageTranslation(
                          groupId,
                          null,
                          group.paragrap_main || textContent,
                          group,
                          imageTranslationLanguages[groupId] || 1
                        )
                      }
                      disabled={isEditingImageTranslation[groupId] || isTranslatingImage[groupId]}
                      style={{
                        backgroundColor:
                          !isEditingImageTranslation[groupId] && !isTranslatingImage[groupId]
                            ? '#2777ee'
                            : '#ccc',
                        color:
                          !isEditingImageTranslation[groupId] && !isTranslatingImage[groupId]
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
        )}
      </div>
    );
  };

  // Lướt tới câu hỏi khi chọn ở thanh câu hỏi bên phải
  const handleScrollToQuestion = (questionId) => {
    // Tìm Part chứa câu hỏi
    const targetPart = Object.entries(partsData).find(
      ([_, { start, end }]) => questionId >= start && questionId <= end
    );

    if (targetPart) {
      const [partName] = targetPart;

      // Nếu Part hiện tại khác Part của câu hỏi, đổi Part
      if (selectedPart !== partName) {
        setSelectedPart(partName);
        loadQuestionsForPart(partName); // Load câu hỏi của Part mới

        // Đợi React render trước khi cuộn
        setTimeout(() => {
          const element = document.getElementById(`question-${questionId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 0);
      } else {
        // Nếu câu hỏi trong Part hiện tại, cuộn trực tiếp
        const element = document.getElementById(`question-${questionId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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

  // Fetch explanation from Gemini or database
  const fetchExplanationFromGemini = async (
    question,
    group,
    answers,
    correctAnswer,
    languageId
  ) => {
    const targetLanguage = languageMap[languageId] || 'Vietnamese';

    // Check database first
    const existingExplanation = await fetchExplanationFromDatabase(
      question.id,
      group.id,
      languageId
    );
    if (existingExplanation) {
      setExplanations((prev) => ({
        ...prev,
        [question.order]: existingExplanation,
      }));
      setEditedExplanations((prev) => ({
        ...prev,
        [question.order]: existingExplanation,
      }));
      setIsExplaining((prev) => ({ ...prev, [question.order]: false })); // Đảm bảo không explaining
      return existingExplanation;
    }
    setIsExplaining((prev) => ({ ...prev, [question.order]: true }));

    // Call Gemini if no explanation exists
    try {
      let prompt = `You are an expert TOEIC tutor. Explain why the correct answer is correct for the following TOEIC question in ${targetLanguage}:\n\n`;

      // Build prompt (unchanged from your code)
      if (!question.content && group?.paragrap_main) {
        const textOnly = group.paragrap_main.replace(/<img[^>]*>/g, '').trim();
        if (textOnly) {
          const placeholderRegex = new RegExp(`\\((${question.order})\\)`, 'g');
          const hasPlaceholder = placeholderRegex.test(textOnly);
          if (hasPlaceholder) {
            prompt += `The question is a text completion task. The passage below contains a blank marked as (${question.order}), which you need to fill with one of the answer choices.\n\n`;
            prompt += `Passage: ${textOnly}\n\n`;
          } else {
            prompt += `The question is a text completion task, but the blank is not explicitly marked. The passage below is related to question number ${question.order}, and you need to determine the correct word to fill in based on the context.\n\n`;
            prompt += `Passage: ${textOnly}\n\n`;
          }
        }
      } else if (question.content) {
        prompt += `Question: ${question.content}\n\n`;
        if (group?.paragrap_main) {
          const textOnly = group.paragrap_main.replace(/<img[^>]*>/g, '').trim();
          if (textOnly) {
            prompt += `Related Passage: ${textOnly}\n\n`;
          }
        }
      } else {
        return 'Không có nội dung câu hỏi hoặc đoạn văn liên quan để giải thích.';
      }

      prompt += `Answer Choices:\n`;
      answers.forEach((answer, index) => {
        prompt += `${String.fromCharCode(65 + index)}. ${answer.content}\n`;
      });
      prompt += `\nCorrect Answer: ${correctAnswer.content}\n\n`;
      prompt += `Please provide a concise explanation (2-3 sentences) of why the correct answer is correct, referencing the passage and the blank (if applicable).`;

      let response;
      if (group?.image_url || group?.paragrap_main?.match(/data:image\/[a-z]+;base64,/)) {
        response = await sendPromptWithImageToBackend(prompt, group.id, languageId);
      } else {
        response = await sendPromptToBackend(prompt, languageId);
      }

      // Save to database
      await handleSaveExplanation(question.order, group.id, question.id, response, languageId);

      setExplanations((prev) => ({
        ...prev,
        [question.order]: response,
      }));
      setEditedExplanations((prev) => ({
        ...prev,
        [question.order]: response,
      }));
      return response;
    } catch (error) {
      console.error('Error fetching explanation from Gemini:', error);
      return 'Lỗi khi tạo lời giải thích. Vui lòng thử lại.';
    } finally {
      setIsExplaining((prev) => ({ ...prev, [question.order]: false }));
    }
  };

  // Hàm toggle hiển thị/ẩn bản dịch

  async function fetchTranslationFromGemini(
    audioScript,
    questionContent,
    questionId,
    languageId,
    mediaId
  ) {
    const targetLanguage = languageMap[languageId] || 'Vietnamese';
    let translation = { script: '', question: '' };
    translation.script = translation.script.replace(/^.*Translation into Vietnamese:/i, '').trim();
    translation.question = translation.question
      .replace(/^.*Translation into Vietnamese:/i, '')
      .trim();
    // Kiểm tra database trước
    try {
      const response = await fetchData(
        `/translate?media_id=${mediaId}&question_id=${questionId}&language_id=${languageId}`,
        true
      );
      if (
        response.success &&
        response.data &&
        isValidTranslationContent(response.data.translate_content)
      ) {
        let parsedTranslation;
        try {
          parsedTranslation = JSON.parse(response.data.translate_content);
        } catch {
          parsedTranslation = response.data.translate_content;
        }

        if (
          typeof parsedTranslation === 'object' &&
          (parsedTranslation.script || parsedTranslation.question)
        ) {
          setEditedTranslations((prev) => ({
            ...prev,
            [questionId]: parsedTranslation,
          }));
          return parsedTranslation;
        } else if (typeof parsedTranslation === 'string') {
          translation.script = parsedTranslation;
        }
      }
    } catch (error) {
      console.error('Error fetching translation from database:', error);
    }

    // Gọi API Gemini nếu không có bản dịch hợp lệ hoặc cần dịch thêm
    setIsTranslating((prev) => ({ ...prev, [questionId]: true }));
    try {
      if (audioScript && audioScript !== 'No script available.') {
        const scriptPrompt = `Translate the following English audio script into a concise ${targetLanguage} sentence:\n\n${audioScript}`;
        translation.script = await sendPromptToBackend(scriptPrompt, languageId);
      } else {
        translation.script = 'Không có script để dịch.';
      }

      if (questionContent && questionContent !== '' && !/^\d+\.\s*$/.test(questionContent)) {
        const questionPrompt = `Translate the following English question into a concise ${targetLanguage} sentence:\n\n${questionContent}`;
        translation.question = await sendPromptToBackend(questionPrompt, languageId);
      } else {
        translation.question = '';
      }

      if (
        isValidTranslationContent({
          script: translation.script,
          question: translation.question,
        })
      ) {
        await handleSaveQuestionTranslation(
          mediaId,
          questionId,
          JSON.stringify(translation),
          languageId
        );
      } else {
        throw new Error('Invalid translation content');
      }

      setEditedTranslations((prev) => ({ ...prev, [questionId]: translation }));
      return translation;
    } catch (error) {
      console.error('Error fetching translation from Gemini:', error);
      translation.script = translation.script || 'Lỗi khi dịch script.';
      translation.question = translation.question || 'Lỗi khi dịch câu hỏi.';
      return translation;
    } finally {
      setIsTranslating((prev) => ({ ...prev, [questionId]: false }));
    }
  }

  const toggleTranslation = async (
    questionId,
    audioScript,
    questionContent,
    translateScript,
    languageId,
    mediaId
  ) => {
    const isShowing = showTranslations[questionId];
    setShowTranslations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
    if (!isShowing) {
      const translation = await fetchTranslationFromGemini(
        audioScript,
        questionContent,
        questionId,
        languageId,
        mediaId
      );
      setEditedTranslations((prev) => ({ ...prev, [questionId]: translation }));
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

  // Hàm xử lý thay đổi nội dung bản dịch
  const handleTranslationChange = (questionId, value) => {
    setEditedTranslations((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Hàm lưu bản dịch mới
  const handleSaveTranslation = async (questionId, groupId, languageId) => {
    const targetLanguage = languageMap[languageId] || 'Vietnamese';
    try {
      if (!groupId || isNaN(Number(groupId))) {
        throw new Error('Invalid groupId');
      }
      const cleanTranslation = extractTranslationContent(editedTranslations[questionId] || '');
      if (!isValidTranslationContent(cleanTranslation)) {
        dispatch(
          setAlertBox({
            open: true,
            error: true,
            msg: 'Bản dịch không hợp lệ hoặc chứa lỗi, không lưu vào cơ sở dữ liệu.',
          })
        );
        return;
      }
      const payload = {
        media_id: groupId,
        translate_script: cleanTranslation,
        language_id: languageId,
      };
      const res = await postData('/translate', payload, true);
      if (res.success) {
        dispatch(
          setAlertBox({
            open: true,
            error: false,
            msg: 'Bản dịch đã được lưu thành công!',
          })
        );
        setIsEditingTranslation((prev) => ({
          ...prev,
          [questionId]: false,
        }));
        setGroupData((prev) =>
          prev.map((group) =>
            group.id === groupId ? { ...group, translate_script: payload.translate_script } : group
          )
        );
      }
    } catch (error) {
      dispatch(
        setAlertBox({
          open: true,
          error: true,
          msg: 'Lỗi khi lưu bản dịch: ' + error.message,
        })
      );
    }
  };

  const toggleExplanation = async (question, group, answers, correctAnswer, languageId) => {
    const isShowing = showExplanations[question.order];
    setShowExplanations((prev) => ({
      ...prev,
      [question.order]: !prev[question.order],
    }));
    if (!isShowing) {
      await fetchExplanationFromGemini(question, group, answers, correctAnswer, languageId);
    }
  };

  // Fetch translation from database
  const fetchTranslationFromDatabase = async (mediaId, questionId, languageId) => {
    try {
      const response = await fetchData(
        `/translate?media_id=${mediaId}&question_id=${questionId}&language_id=${languageId}`,
        true
      );
      if (
        response.success &&
        response.data &&
        isValidTranslationContent(response.data.translate_content)
      ) {
        return response.data.translate_content;
      }
      return null;
    } catch (error) {
      console.error('Error fetching translation from database:', error);
      return null;
    }
  };

  // Hàm lấy explanation từ database
  const fetchExplanationFromDatabase = async (questionId, mediaId, languageId) => {
    try {
      const response = await fetchData(
        `/explain?media_id=${mediaId}&question_id=${questionId}&language_id=${languageId}`,
        true
      );
      if (
        response.success &&
        response.data &&
        response.data.explain_question !== 'No explanation available.'
      ) {
        return response.data.explain_question;
      }
      return null;
    } catch (error) {
      console.error('Error fetching explanation from database:', error);
      return null;
    }
  };

  // Hàm kích hoạt chế độ chỉnh sửa lời giải thích
  const handleEditExplanation = (questionId, currentExplanation) => {
    if (role !== 'admin') {
      return; // Student không được phép edit
    }
    setIsEditingExplanation((prev) => ({
      ...prev,
      [questionId]: true,
    }));
    setEditedExplanations((prev) => ({
      ...prev,
      [questionId]: currentExplanation || '',
    }));
  };

  // Hàm xử lý thay đổi nội dung lời giải thích
  const handleExplanationChange = (questionId, value) => {
    if (role !== 'admin') {
      return; // Student không được phép thay đổi
    }
    setEditedExplanations((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Update handleSaveExplanation
  const handleSaveExplanation = async (
    questionId,
    groupId,
    questionActualId,
    explanationContent = null,
    languageId
  ) => {
    try {
      const payload = {
        media_id: groupId,
        question_id: questionActualId,
        explain_question: explanationContent || editedExplanations[questionId],
        language_id: languageId,
      };
      const res = await postData('/explain', payload, true);
      if (res.success) {
        preserveScrollPosition(() => {
          setIsEditingExplanation((prev) => ({ ...prev, [questionId]: false }));
          setGroupData((prev) =>
            prev.map((group) =>
              group.id === groupId
                ? {
                    ...group,
                    explain_question: {
                      ...group.explain_question,
                      [questionActualId]: res.data.explain_question,
                    },
                  }
                : group
            )
          );
        });
        dispatch(
          setAlertBox({
            open: true,
            error: false,
            msg: 'Lưu lời giải thích thành công!',
          })
        );
      }
    } catch (error) {
      dispatch(
        setAlertBox({
          open: true,
          error: true,
          msg: 'Lỗi khi lưu lời giải thích: ' + error.message,
        })
      );
    }
  };

  // Hàm gọi lại API Gemini để tạo bản dịch mới
  const handleRetryTranslation = async (questionId, audioScript) => {
    try {
      setIsTranslating((prev) => ({ ...prev, [questionId]: true }));
      const translation = await fetchTranslationFromGemini(audioScript, questionId);
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
      setEditedExplanations((prev) => ({
        ...prev,
        [question.order]: explanation,
      }));
    } catch (error) {
      console.error('Error retrying explanation:', error);
      alert(`Failed to retry explanation ${error.message}. Please try again.`);
    }
  };

  // Hàm phân tích paragrap_main để tách ảnh và văn bản
  const parseParagraphMain = (paragraph) => {
    const images = [];
    let textContent = paragraph;

    if (paragraph) {
      // Trích xuất Base64 images
      const base64Regex = /data:image\/[a-z]+;base64,[^"]+/g;
      const matches = paragraph.match(base64Regex);
      if (matches) {
        images.push(...matches);
        textContent = paragraph.replace(base64Regex, '').trim();
      }

      // Loại bỏ thẻ HTML để lấy văn bản thuần túy
      textContent = textContent
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    return { images, textContent };
  };

  // Hàm dịch ảnh
  const fetchImageTranslation = async (mediaId, languageId) => {
    setIsTranslatingImage((prev) => ({ ...prev, [mediaId]: true }));
    try {
      const targetLanguage = languageMap[languageId] || 'Vietnamese';
      const prompt = `Analyze the image with the provided media_id and provide a concise ${targetLanguage} translation of its content. If the image contains text, translate that text. If it's a non-text image (e.g., a diagram or photo), provide a brief description in Vietnamese.`;
      const translation = await sendPromptWithImageToBackend(prompt, mediaId, languageId);

      // Kiểm tra nếu translation chứa Base64
      const isBase64 = translation.match(/^data:image\/[a-zA-Z]+;base64,/);
      if (isBase64) {
        console.error('Image translation contains Base64 data, discarding...');
        return 'Lỗi: API trả về dữ liệu ảnh thay vì bản dịch.';
      }

      if (isValidTranslationContent(translation)) {
        return translation;
      } else {
        console.error('Invalid image translation content:', translation);
        return 'Bản dịch ảnh không hợp lệ.';
      }
    } catch (error) {
      console.error('Error fetching image translation:', error);
      return 'Lỗi khi dịch ảnh. Vui lòng thử lại.';
    } finally {
      setIsTranslatingImage((prev) => ({ ...prev, [mediaId]: false }));
    }
  };

  // Hàm dịch văn bản
  const fetchTextTranslation = async (text) => {
    try {
      const targetLanguage = languageMap[languageId] || 'Vietnamese';
      const prompt = `Translate the following text to ${targetLanguage}:\n\n${text}`;
      const translation = await sendPromptToBackend(prompt);
      if (isValidTranslationContent(translation)) {
        return translation;
      } else {
        console.error('Invalid text translation content:', translation);
        return 'Bản dịch văn bản không hợp lệ.';
      }
    } catch (error) {
      console.error('Error fetching text translation:', error);
      return 'Lỗi khi dịch văn bản. Vui lòng thử lại.';
    }
  };

  // Hàm dịch cả ảnh và văn bản
  const fetchParagraphTranslation = async (mediaId, paragraphMain, group, languageId) => {
    const { images, textContent } = parseParagraphMain(paragraphMain);
    let combinedTranslation = '';

    // Dịch ảnh
    if (images.length > 0 || group?.image_url) {
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
    if (isValidTranslationContent(combinedTranslation)) {
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
    } else {
      console.error('Invalid paragraph translation content:', combinedTranslation);
      dispatch(
        setAlertBox({
          open: true,
          error: true,
          msg: 'Bản dịch đoạn văn không hợp lệ, không được lưu.',
        })
      );
      return 'Bản dịch không hợp lệ.';
    }
  };

  // Update handleSaveQuestionTranslation
  const handleSaveQuestionTranslation = async (
    mediaId,
    questionId,
    translation,
    languageId = 1
  ) => {
    try {
      if (!Number.isInteger(Number(mediaId)) || !Number.isInteger(Number(questionId))) {
        throw new Error('Invalid mediaId or questionId');
      }

      const cleanTranslation = extractTranslationContent(translation || '');
      if (!isValidTranslationContent(cleanTranslation)) {
        dispatch(
          setAlertBox({
            open: true,
            error: true,
            msg: 'Bản dịch không hợp lệ hoặc chứa lỗi, không lưu vào cơ sở dữ liệu.',
          })
        );
        return;
      }

      const payload = {
        media_id: mediaId,
        question_id: questionId,
        translate_content: cleanTranslation,
        language_id: languageId,
      };

      console.log('Saving translation payload:', payload);
      const res = await postData('/translate', payload, true);
      console.log('Save response:', res);

      if (!res.success) {
        throw new Error(res.error || 'API returned unsuccessful response');
      }

      dispatch(
        setAlertBox({
          open: true,
          error: false,
          msg: 'Bản dịch đã được lưu thành công!',
        })
      );

      preserveScrollPosition(() => {
        setGroupData((prev) =>
          prev.map((group) =>
            group.id === mediaId
              ? {
                  ...group,
                  translate_script: res.data.translate_content,
                }
              : group
          )
        );
      });
    } catch (error) {
      console.error('Error saving translation:', error);
      dispatch(
        setAlertBox({
          open: true,
          error: true,
          msg: `Lưu bản dịch thất bại: ${error.message}`,
        })
      );
    }
  };

  // Hàm toggle hiển thị/ẩn bản dịch
  const toggleImageTranslation = async (
    mediaId,
    translateScript,
    paragraphMain,
    group // Thêm tham số group
  ) => {
    const isShowing = showImageTranslations[mediaId];

    // Lưu vị trí scroll trước khi đóng
    if (isShowing) {
      const dropdown = document.querySelector(`#translation-content-${mediaId}`);
      if (dropdown) {
        setScrollPositions((prev) => ({
          ...prev,
          [mediaId]: dropdown.scrollTop,
        }));
      }
    }

    setShowImageTranslations((prev) => ({
      ...prev,
      [mediaId]: !prev[mediaId],
    }));

    if (!isShowing && mediaId && !isNaN(Number(mediaId))) {
      console.log('Checking database for image translation...');
      try {
        const res = await fetchData(`/translate?media_id=${mediaId}&question_id=${mediaId}`, true);
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
          // Khôi phục vị trí scroll
          setTimeout(() => {
            const dropdown = document.querySelector(`#translation-content-${mediaId}`);
            if (dropdown && scrollPositions[mediaId]) {
              dropdown.scrollTop = scrollPositions[mediaId];
            }
          }, 0);
          return;
        }
      } catch (error) {
        console.error('Error fetching image translation from database:', error);
      }

      console.log('No valid image translation found, fetching from API...');
      const translation = await fetchParagraphTranslation(
        mediaId,
        paragraphMain,
        group // Truyền group vào đây
      );
      if (
        translation !== 'Lỗi khi dịch ảnh. Vui lòng thử lại.' &&
        translation !== 'Không có nội dung để dịch.'
      ) {
        await handleSaveQuestionTranslation(mediaId, mediaId, translation);
      }
    }
  };

  // Hàm chỉnh sửa bản dịch
  const handleEditImageTranslation = (groupId, currentTranslation) => {
    console.log('Editing translation for groupId:', groupId, 'Current:', currentTranslation);
    if (isEditingImageTranslation[groupId]) {
      // Nếu đang chỉnh sửa, hủy chỉnh sửa
      setIsEditingImageTranslation((prev) => ({
        ...prev,
        [groupId]: false,
      }));
      // Khôi phục nội dung gốc
      setEditedTranslations((prev) => ({
        ...prev,
        [groupId]: imageTranslations[groupId]?.content || group?.translate_content || '',
      }));
    } else {
      // Bật chế độ chỉnh sửa
      setIsEditingImageTranslation((prev) => ({
        ...prev,
        [groupId]: true,
      }));
      // Khởi tạo nội dung chỉnh sửa
      setEditedTranslations((prev) => ({
        ...prev,
        [groupId]: currentTranslation || '',
      }));
    }
  };
  // Hàm xử lý thay đổi nội dung bản dịch
  const handleImageTranslationChange = (groupId, value) => {
    setEditedTranslations((prev) => ({
      ...prev,
      [groupId]: value,
    }));
  };

  const extractTranslationContent = (input) => {
    if (!input) return 'Không có bản dịch nào.';
    if (input === 'undefined') return 'Không có bản dịch nào.';

    // Kiểm tra nếu input là Base64
    if (typeof input === 'string' && input.match(/^data:image\/[a-zA-Z]+;base64,/)) {
      return 'Lỗi: Dữ liệu chứa Base64 thay vì bản dịch.';
    }

    if (
      typeof input === 'string' &&
      !input.includes('"translate_content"') &&
      !input.includes('"question_id"') &&
      !input.startsWith('[{')
    ) {
      return input;
    }

    let current = input;
    let maxIterations = 10;
    let iterationCount = 0;

    try {
      if (typeof current === 'string') {
        try {
          current = JSON.parse(current);
        } catch (e) {
          console.log('Initial parse failed, treating as plain text:', e);
          return current;
        }
      }

      while (iterationCount < maxIterations) {
        iterationCount++;
        if (Array.isArray(current)) {
          if (current.length === 0) return 'Không có bản dịch nào.';
          const item = current.find(
            (item) => item && typeof item === 'object' && item.translate_content
          );
          if (!item) return 'Không có bản dịch nào.';
          current = item.translate_content;
          if (
            typeof current === 'string' &&
            !current.includes('"translate_content"') &&
            !current.includes('"question_id"') &&
            !current.startsWith('[{')
          ) {
            return current;
          }
          if (typeof current === 'string') {
            try {
              current = JSON.parse(current);
            } catch (e) {
              return current;
            }
          }
        } else if (current && typeof current === 'object') {
          if (current.translate_content) {
            current = current.translate_content;
            if (
              typeof current === 'string' &&
              !current.includes('"translate_content"') &&
              !current.includes('"question_id"') &&
              !current.startsWith('[{')
            ) {
              return current;
            }
            if (typeof current === 'string') {
              try {
                current = JSON.parse(current);
              } catch (e) {
                return current;
              }
            }
          } else {
            const keys = Object.keys(current);
            if (keys.length === 1) {
              current = current[keys[0]];
            } else {
              return JSON.stringify(current);
            }
          }
        } else {
          return String(current);
        }
      }

      console.warn('Hit iteration limit while extracting translation');
      return typeof current === 'string' ? current : JSON.stringify(current);
    } catch (error) {
      console.error('Error extracting translation content:', error);
      return typeof input === 'string' ? input : 'Lỗi khi xử lý bản dịch.';
    }
  };

  const renderQuestions = () => {
    if (!selectedHistory || Object.keys(selectedHistory).length === 0) return null;
    let lastGroupId = null;

    return filteredQuestions.map((question) => {
      const isNewGroup = question.group_id !== lastGroupId;
      lastGroupId = question.group_id;

      const groupContent = getGroupContent(question.group_id);
      const answersForQuestion = answerData.filter((answer) => answer.question_id === question.id);
      const userAnswerId = dataprogress[question.order];
      const userAnswer = answerData.find((ans) => ans.id === Number(userAnswerId));
      const correctAnswer = answersForQuestion.find((answer) => answer.is_correct);
      const isCorrect = userAnswerId && userAnswer?.id === correctAnswer?.id;
      const isIncorrect = userAnswerId && userAnswer?.id !== correctAnswer?.id;

      const partDetails = partData.find((p) => p.id === question.part_id);
      const isAudioPart =
        partDetails && ['Part 1', 'Part 2', 'Part 3', 'Part 4'].includes(partDetails.part_order);
      const isTextPart =
        partDetails && ['Part 5', 'Part 6', 'Part 7'].includes(partDetails.part_order);

      const group = groupData.find((g) => g.id === question.group_id);
      const audioScript = group?.audio_script || 'No script available.';
      const translateScript = group?.translate_script || {
        script: 'Không có bản dịch nào.',
        question: '',
      };
      const explainQuestion = group?.explain_question?.[question.id] || 'No explanation available.';

      let questionDisplay = null;
      if (!question.content && group?.paragrap_main && partDetails?.part_order === 'Part 6') {
        const textOnly = group.paragrap_main
          .replace(/<\/?[^>]+(>|$)/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (textOnly) {
          const placeholderRegex = new RegExp(`\\((${question.order})\\)`, 'g');
          if (placeholderRegex.test(group.paragrap_main)) {
            const modifiedText = group.paragrap_main.replace(placeholderRegex, '____');
            questionDisplay = (
              <p
                className={`question-title ${isCorrect ? 'correct' : ''} ${isIncorrect ? 'incorrect' : ''}`}>
                {question.order}.
                <br />
              </p>
            );
          } else {
            questionDisplay = (
              <p
                className={`question-title ${isCorrect ? 'correct' : ''} ${isIncorrect ? 'incorrect' : ''}`}>
                {question.order}.
                <br />
              </p>
            );
          }
        } else {
          questionDisplay = (
            <p
              className={`question-title ${isCorrect ? 'correct' : ''} ${isIncorrect ? 'incorrect' : ''}`}>
              {question.order}.
              <br />
            </p>
          );
        }
      } else {
        questionDisplay = (
          <p
            className={`question-title ${isCorrect ? 'correct' : ''} ${isIncorrect ? 'incorrect' : ''}`}>
            {question.order}. {question.content}
          </p>
        );
      }

      return (
        <div key={question.id} id={`question-${question.order}`} className="question-item">
          {isNewGroup && groupContent}
          {questionDisplay}
          <div className="choices">
            {answersForQuestion.map((answer) => (
              <label key={answer.id} className="choice-label">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={answer.is_correct}
                  readOnly
                />
                <span>{answer.content}</span>
              </label>
            ))}
            <strong>Your Answer:</strong>{' '}
            {userAnswer ? (
              userAnswer.is_correct ? (
                <div className="right-answer">
                  <span>{userAnswer.content}</span>
                  <span>
                    <FontAwesomeIcon icon={faArrowRight} style={{ color: '#000000' }} />
                  </span>
                  <span> Right</span>
                </div>
              ) : (
                <div className="wrong-answer">
                  <span>{userAnswer.content}</span>
                  <span>
                    <FontAwesomeIcon icon={faArrowRight} style={{ color: '#000000' }} />
                  </span>
                  <span> Wrong</span>
                </div>
              )
            ) : (
              'No Answer'
            )}
          </div>

          {Array.isArray(languages) && languages.length > 0 && (
            <div className="language-selector-container">
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
                      translateScript,
                      newLanguageId
                    );
                  }
                  if (showExplanations[question.order]) {
                    toggleExplanation(
                      question,
                      group,
                      answersForQuestion,
                      correctAnswer,
                      newLanguageId
                    );
                  }
                }}
                className="language-selector"
                style={{
                  padding: '5px',
                  fontSize: '1.2rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.language_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isAudioPart && (
            <div className="script-dropdown">
              <button className="script-toggle-btn" onClick={() => toggleScript(question.order)}>
                {showScripts[question.order] ? 'Hide script' : 'Show script'}
                <FontAwesomeIcon
                  icon={faCaretDown}
                  className={`script-icon ${showScripts[question.order] ? 'rotate-up' : 'rotate-down'}`}
                />
              </button>
              {showScripts[question.order] && (
                <div className="script-content">
                  {audioScript ? (
                    <p>{audioScript}</p>
                  ) : (
                    <p>No script available for this question.</p>
                  )}
                </div>
              )}

              <button
                className="script-toggle-btn"
                onClick={() =>
                  toggleTranslation(
                    question.order,
                    audioScript,
                    question.content,
                    translateScript,
                    questionLanguages[question.order] || 1,
                    question.group_id
                  )
                }
                style={{ marginTop: '8px' }}
                disabled={isTranslating[question.order]}>
                {isTranslating[question.order]
                  ? 'Translating...'
                  : showTranslations[question.order]
                    ? 'Hide scripts & question translation'
                    : 'Show scripts & question translation'}
                <FontAwesomeIcon
                  icon={faCaretDown}
                  className={`script-icon ${showTranslations[question.order] ? 'rotate-up' : 'rotate-down'}`}
                />
              </button>
              {showTranslations[question.order] && (
                <div className="script-content">
                  {role === 'admin' && isEditingTranslation[question.order] ? (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>
                          Script Translation:
                        </label>
                        <textarea
                          value={editedTranslations[question.order]?.script || ''}
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
                          placeholder="Nhập bản dịch script..."
                        />
                      </div>
                      {question.content && !/^\d+\.\s*$/.test(question.content) && (
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px' }}>
                            Question Translation:
                          </label>
                          <textarea
                            value={editedTranslations[question.order]?.question || ''}
                            onChange={(e) =>
                              handleTranslationChange(question.order, 'question', e.target.value)
                            }
                            style={{
                              width: '100%',
                              minHeight: '100px',
                              resize: 'vertical',
                              padding: '8px',
                              fontSize: '1.4rem',
                            }}
                            placeholder="Nhập bản dịch câu hỏi..."
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p>
                        <strong>Script Translation:</strong>{' '}
                        {editedTranslations[question.order]?.script ||
                          translateScript.script ||
                          'Không có bản dịch nào.'}
                      </p>
                      {question.content && !/^\d+\.\s*$/.test(question.content) && (
                        <p>
                          <strong>Question Translation:</strong>{' '}
                          {editedTranslations[question.order]?.question ||
                            translateScript.question ||
                            'Không có bản dịch câu hỏi.'}
                        </p>
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
                            editedTranslations[question.order] || translateScript
                          )
                        }
                        disabled={isEditingTranslation[question.order]}>
                        {isEditingTranslation[question.order] ? 'Cancel' : 'Edit'}
                      </button>
                      <button
                        className="script-toggle-btn"
                        onClick={() =>
                          handleSaveTranslation(
                            question.order,
                            question.group_id,
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
                          handleRetryTranslation(question.order, audioScript, question.content)
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

          {isTextPart && (
            <div className="script-dropdown">
              <button
                className="script-toggle-btn"
                onClick={() =>
                  toggleExplanation(
                    question,
                    group,
                    answersForQuestion,
                    correctAnswer,
                    questionLanguages[question.order] || 1
                  )
                }
                style={{ marginTop: '8px' }}
                disabled={isExplaining[question.order]}>
                {isExplaining[question.order]
                  ? 'Explaining...'
                  : showExplanations[question.order]
                    ? 'Hide explanation'
                    : 'Explain by AI'}
                <FontAwesomeIcon
                  icon={faCaretDown}
                  className={`script-icon ${showExplanations[question.order] ? 'rotate-up' : 'rotate-down'}`}
                />
              </button>
              {showExplanations[question.order] && (
                <div className="script-content">
                  {role === 'admin' && isEditingExplanation[question.order] ? (
                    <textarea
                      value={editedExplanations[question.order] || ''}
                      onChange={(e) => handleExplanationChange(question.order, e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        resize: 'vertical',
                        padding: '8px',
                        fontSize: '1.4rem',
                      }}
                    />
                  ) : (
                    <p>{editedExplanations[question.order] || explainQuestion}</p>
                  )}
                  {role === 'admin' && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        className="script-toggle-btn"
                        onClick={() =>
                          handleEditExplanation(
                            question.order,
                            editedExplanations[question.order] || explainQuestion
                          )
                        }
                        disabled={
                          isEditingExplanation[question.order] || !explanations[question.order]
                        }>
                        Update
                      </button>
                      <button
                        className="script-toggle-btn"
                        onClick={() =>
                          handleSaveExplanation(
                            question.order,
                            question.group_id,
                            question.id,
                            null,
                            questionLanguages[question.order] || 1
                          )
                        }
                        disabled={!isEditingExplanation[question.order]}
                        style={{
                          backgroundColor: isEditingExplanation[question.order]
                            ? '#2777ee'
                            : '#ccc',
                          color: isEditingExplanation[question.order] ? 'white' : 'black',
                        }}>
                        Save
                      </button>
                      <button
                        className="script-toggle-btn"
                        onClick={() =>
                          handleRetryExplanation(question, group, answersForQuestion, correctAnswer)
                        }
                        disabled={
                          isEditingExplanation[question.order] || isExplaining[question.order]
                        }
                        style={{
                          backgroundColor:
                            !isEditingExplanation[question.order] && !isExplaining[question.order]
                              ? '#2777ee'
                              : '#ccc',
                          color:
                            !isEditingExplanation[question.order] && !isExplaining[question.order]
                              ? 'white'
                              : 'black',
                        }}>
                        {isExplaining[question.order] ? 'Retrying...' : 'Retry'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  // Hiển thị toàn bộ câu hỏi (navigation bên phải)
  const renderAllQuestions = () => {
    const filteredPartsFromPartsData = filteredParts.reduce((acc, partName) => {
      if (partsData[partName]) {
        acc[partName] = partsData[partName];
      }
      return acc;
    }, {});
    return Object.entries(filteredPartsFromPartsData).map(([part, { start, end }]) => (
      <div key={part} className="part-section">
        <h3>{part}</h3>
        <div className="question-numbers">
          {[...Array(end - start + 1)].map((_, i) => {
            const questionId = start + i;
            // Lấy part_id từ testPartData để lọc câu hỏi đúng theo test_id
            const selectedTestPart = testPartData.find(
              (tp) =>
                tp.test_id === Number(id) &&
                tp.part_id === partData.find((p) => p.part_order === part)?.id
            );
            const question = questionData.find(
              (q) => q.order === questionId && q.part_id === selectedTestPart?.part_id
            );
            const answersForQuestion = question
              ? answerData.filter((answer) => answer.question_id === question.id)
              : [];
            const correctAnswer = answersForQuestion.find((answer) => answer.is_correct);
            const userAnswerId = dataprogress[questionId];
            const userAnswer = answerData.find((ans) => ans.id === Number(userAnswerId));

            // Sử dụng userAnswer.is_correct để xác định đúng/sai nếu cần
            const isCorrect = userAnswer && userAnswer.is_correct;
            const isIncorrect = userAnswer && !userAnswer.is_correct;
            const isAnswered = Object.keys(dataprogress).includes(String(questionId));

            return (
              <button
                key={questionId}
                className={`question-number ${isAnswered ? 'answered' : ''} ${
                  isCorrect ? 'correct' : ''
                } ${isIncorrect ? 'incorrect' : ''} ${
                  selectedPart === part && filteredQuestions.some((q) => q.id === questionId)
                    ? 'active'
                    : ''
                }`}
                onClick={() => handleScrollToQuestion(questionId)}>
                {questionId}
              </button>
            );
          })}
        </div>
      </div>
    ));
  };

  const handleExit = () => {
    const confirm = window.confirm('Done your review!');
    if (confirm) {
      navigate(`/detailtest/${id}`);
    }
  };

  if (isLoadingAll) {
    return (
      <div className="loading-overlay">
        <div className="progress-bar-container">
          <div className="progress-bar-custom" style={{ width: `${loadingProgress}%` }} />
        </div>
        <h3>Loading test results... {Math.round(loadingProgress)}%</h3>
      </div>
    );
  }

  return (
    <div className="detailresult-page">
      <div className="practice-header">
        <h1>Result Of {selectedTest && selectedTest.title}</h1>
        <button onClick={handleExit} className="exit-button">
          Exit
        </button>
      </div>

      <div className="content-container">
        <div className="left-section">
          <div className="part-tabs">
            {filteredParts.map((part) => (
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
                <source src={currentAudio} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            ) : (
              ''
            )}
          </div>
          <div className="question-content">{renderQuestions()}</div>
        </div>

        <div className="right-section">
          <div className="question-nav">{renderAllQuestions()}</div>
        </div>
      </div>
    </div>
  );
};

export default ViewResultUserDo;
