import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useReduxAlert } from '../../hook/useReduxAlert';
import { useReduxUser } from '../../hook/useReduxUser';
import { sendPromptToBackend, sendPromptWithImageToBackend } from '../../service/ChatbotAI';
import { fetchData, postData } from '../../service/UserService';
import './ViewDetailResult.css';

const ViewDetailResult = () => {
  const navigate = useNavigate();
  // const context = useContext(MyContext);
  // const user = useSelector((state) => state.user);
  const { userState } = useReduxUser();
  const { showError } = useReduxAlert();
  // const dispatch = useDispatch();
  const [selectedPart, setSelectedPart] = useState('Part 1');
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [selectedTest, setSelectedTest] = useState({});
  const [currentAudio, setCurrentAudio] = useState('');
  const [partsData, setPartsData] = useState([]); //Để hiện thị question nav
  const [showScripts, setShowScripts] = useState({});
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { id } = useParams();

  const [showTranslations, setShowTranslations] = useState({}); // Trạng thái hiển thị bản dịch
  const [isEditingTranslation, setIsEditingTranslation] = useState({}); // Trạng thái chỉnh sửa bản dịch
  const [editedTranslations, setEditedTranslations] = useState({}); // Nội dung bản dịch đã chỉnh sửa
  const [isTranslating, setIsTranslating] = useState({}); // Trạng thái đang dịch
  const [showExplanations, setShowExplanations] = useState({}); // Trạng thái hiển thị lời giải thích
  const [explanations, setExplanations] = useState({}); // Nội dung lời giải thích
  const [isExplaining, setIsExplaining] = useState({}); // Trạng thái đang gọi API giải thích
  const [isEditingExplanation, setIsEditingExplanation] = useState({}); // Trạng thái chỉnh sửa lời giải thích
  const [editedExplanations, setEditedExplanations] = useState({}); // Nội dung lời giải thích đã chỉnh sửa

  // Check authentication
  useEffect(() => {
    if (!userState.isLoggedIn || !userState?.id) {
      showError('Please login to view test results!');
      navigate('/login');
    }
  }, [userState.isLoggedIn, userState.id, navigate, showError]);

  //Scoll nav
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

  // Lấy dữ liệu từ api
  const [questionData, setQuestionData] = useState([]);
  const [partData, setPartData] = useState([]);
  const [groupData, setGroupData] = useState([]);
  const [answerData, setAnswerData] = useState([]);
  const [testPartData, setTestPartData] = useState([]);
  const [testData, setTestData] = useState([]);

  useEffect(() => {
    const fetchAPI = async () => {
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
          fetchData('/tests/questions', true).then((data) => {
            updateProgress();
            return data;
          }),
          fetchData('/tests/part', true).then((data) => {
            updateProgress();
            return data;
          }),
          fetchData(`/tests/${id}/media`, true).then((res) => {
            updateProgress();
            return res;
          }),
          fetchData('/tests/answer').then((data) => {
            // ❌ Changed from '/answer' to '/tests/answer'
            updateProgress();
            return data;
          }),
          fetchData('/tests/testpart').then((data) => {
            // ❌ Changed from '/testpart' to '/tests/testpart'
            updateProgress();
            return data;
          }),
          fetchData('/tests').then((data) => {
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
          showError('Please login to view test results!');
          navigate('/login');
        } else {
          showError('Failed to load test results.');
        }
      }
    };
    fetchAPI();
  }, [navigate, showError, id]);

  useEffect(() => {
    setSelectedTest(testData.find((test) => test.id === Number(id)));
    // Lọc testPartData để lấy các phần có test_id trùng với id
    const filteredTestParts = testPartData.filter((part) => part.test_id === Number(id));

    // Lấy danh sách part_order từ partData dựa trên part_id trong filteredTestParts
    const availableParts = filteredTestParts
      .map((testPart) => partData.find((part) => part.id === testPart.part_id)?.part_order)
      .filter(Boolean); // Lọc bỏ giá trị undefined nếu có

    // Chọn "Part 1" nếu có, nếu không chọn "Part 5"
    const targetPart = availableParts.includes('Part 1') ? 'Part 1' : 'Part 5';

    handlePartChange(targetPart);
  }, [questionData, partData, groupData, answerData, testData, id, testPartData]);

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

  // Chuyển đổi giữa các Part
  const handlePartChange = (partOrder) => {
    if (!Array.isArray(partData) || partData.length === 0) {
      console.warn('partData is not loaded or is empty.');
      return;
    }
    setSelectedPart(partOrder);
    loadQuestionsForPart(partOrder);
    // Cập nhật audio nếu có
    const selectedTestPart = testPartData
      .filter((tp) => tp.test_id === Number(id))
      .map((tp) => partData.find((p) => p.id === tp.part_id));
    const part = selectedTestPart.find((p) => p.part_order === partOrder);
    if (part && part.audio_url) {
      setCurrentAudio(`http://11.11.4.138:8000/media/${part.audio_url}`);
    } else {
      setCurrentAudio(''); // Không có audio thì để trống
    }
  };

  // Hàm xử lý hiển thị/ẩn script
  const toggleScript = (questionId) => {
    setShowScripts((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Hàm gọi API để dịch audio_script
  const fetchTranslationFromGemini = async (audioScript, questionId) => {
    if (!audioScript || audioScript === 'No script available.') {
      return 'Không có script để dịch.';
    }

    setIsTranslating((prev) => ({ ...prev, [questionId]: true }));
    try {
      const prompt = `Translate the following English audio script into a concise Vietnamese sentence:\n\n${audioScript}`;
      const translation = await sendPromptToBackend(prompt);
      setEditedTranslations((prev) => ({
        ...prev,
        [questionId]: translation,
      }));
      setIsEditingTranslation((prev) => ({
        ...prev,
        [questionId]: userState.role === 'admin',
      }));
      return translation;
    } catch (error) {
      console.error('Error fetching translation from Gemini:', error);
      return 'Lỗi khi dịch script. Vui lòng thử lại.';
    } finally {
      setIsTranslating((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const fetchExplanationFromGemini = async (question, group, answers, correctAnswer) => {
    setIsExplaining((prev) => ({ ...prev, [question.order]: true }));
    try {
      let prompt = `You are an expert TOEIC tutor. Explain why the correct answer is correct for the following TOEIC question:\n\n`;

      // Kiểm tra xem question.content có trống không
      if (!question.content && group?.paragrap_main) {
        // Trường hợp câu hỏi nằm trong đoạn văn (dạng text completion)
        const textOnly = group.paragrap_main.replace(/<img[^>]*>/g, '').trim();
        if (textOnly) {
          // Tìm vị trí chỗ trống dựa trên số thứ tự (question.order)
          const placeholderRegex = new RegExp(`\\((${question.order})\\)`, 'g');
          const hasPlaceholder = placeholderRegex.test(textOnly);

          if (hasPlaceholder) {
            prompt += `The question is a text completion task. The passage below contains a blank marked as (${question.order}), which you need to fill with one of the answer choices.\n\n`;
            prompt += `Passage: ${textOnly}\n\n`;
          } else {
            // Nếu không tìm thấy placeholder, vẫn sử dụng đoạn văn nhưng báo rằng không có chỗ trống rõ ràng
            prompt += `The question is a text completion task, but the blank is not explicitly marked. The passage below is related to question number ${question.order}, and you need to determine the correct word to fill in based on the context.\n\n`;
            prompt += `Passage: ${textOnly}\n\n`;
          }
        }
      } else if (question.content) {
        // Trường hợp câu hỏi có nội dung riêng
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
      prompt += `Please provide a concise explanation (2-3 sentences) of why the correct answer is correct, referencing the passage and the blank (if applicable). If an image is involved, describe how the image content supports the correct answer.`;

      // Nếu có group.image_url hoặc base64 trong paragrap_main, gửi media_id
      if (group?.image_url || group?.paragrap_main?.match(/data:image\/[a-z]+;base64,/)) {
        console.log('Sending media_id to Gemini API:', group.id);
        const response = await sendPromptWithImageToBackend(prompt, group.id);
        setExplanations((prev) => ({
          ...prev,
          [question.order]: response,
        }));
        setEditedExplanations((prev) => ({
          ...prev,
          [question.order]: response,
        }));
        return response;
      }

      // Nếu không có ảnh, gửi prompt văn bản
      console.log('No image found, sending text prompt only');
      const response = await sendPromptToBackend(prompt);
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
  const toggleTranslation = async (questionId, audioScript, translateScript) => {
    const isShowing = showTranslations[questionId];
    setShowTranslations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));

    if (!isShowing && (!translateScript || translateScript === 'Không có bản dịch nào.')) {
      const translation = await fetchTranslationFromGemini(audioScript, questionId);
      setEditedTranslations((prev) => ({
        ...prev,
        [questionId]: translation,
      }));
    }
  };

  // Hàm toggle hiển thị/ẩn lời giải thích
  const toggleExplanation = async (question, group, answers, correctAnswer) => {
    const isShowing = showExplanations[question.order];
    setShowExplanations((prev) => ({
      ...prev,
      [question.order]: !prev[question.order],
    }));

    if (!isShowing && !explanations[question.order]) {
      try {
        if (group?.explain_question && group.explain_question !== 'No explanation available.') {
          setExplanations((prev) => ({
            ...prev,
            [question.order]: group.explain_question,
          }));
          setEditedExplanations((prev) => ({
            ...prev,
            [question.order]: group.explain_question,
          }));
          setIsEditingExplanation((prev) => ({
            ...prev,
            [question.order]: userState.role === 'admin' ? false : prev[question.order],
          }));
        } else {
          const explanation = await fetchExplanationFromGemini(
            question,
            group,
            answers,
            correctAnswer
          );
          setExplanations((prev) => ({
            ...prev,
            [question.order]: explanation,
          }));
          setEditedExplanations((prev) => ({
            ...prev,
            [question.order]: explanation,
          }));
          setIsEditingExplanation((prev) => ({
            ...prev,
            [question.order]: userState.role === 'admin' ? true : false,
          }));
        }
      } catch (error) {
        console.error('Error fetching explanation:', error);
        if (userState.role === 'admin') {
          alert(`Failed to load explanation: ${error.message}`);
        }
      }
    }
  };

  // Hàm kích hoạt chế độ chỉnh sửa bản dịch
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
  const handleSaveTranslation = async (questionId, groupId) => {
    try {
      const payload = {
        media_id: groupId,
        translate_script: editedTranslations[questionId],
      };
      console.log('Saving payload:', payload);
      const res = await postData('/translation/translate', payload, true);
      console.log('Save response:', res);
      if (res.success) {
        alert('Translation saved successfully!');
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
      console.error('Error saving translation:', error);
      alert('Failed to save translation. Please try again.');
    }
  };

  // Hàm kích hoạt chế độ chỉnh sửa lời giải thích
  const handleEditExplanation = (questionId, currentExplanation) => {
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
    setEditedExplanations((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Hàm lưu lời giải thích mới
  const handleSaveExplanation = async (questionId, groupId) => {
    try {
      if (!groupId) {
        console.error('Invalid groupId:', groupId);
        alert('Cannot save explanation: Invalid group ID.');
        return;
      }

      const payload = {
        media_id: groupId,
        explain_question: editedExplanations[questionId],
      };
      console.log('Saving explanation payload:', payload);
      const res = await postData('/translation/explain', payload, true);
      console.log('Save explanation response:', res);
      if (res.data.message === 'Explanation updated successfully') {
        alert('Explanation saved successfully!');
        setIsEditingExplanation((prev) => ({
          ...prev,
          [questionId]: false,
        }));
        setGroupData((prev) =>
          prev.map((group) =>
            group.id === groupId ? { ...group, explain_question: payload.explain_question } : group
          )
        );
      }
    } catch (error) {
      console.error('Error saving explanation:', error);
      alert('Failed to save explanation: ' + (error.response?.data?.detail || 'Unknown error'));
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

  // Lấy nội dung Group
  const getGroupContent = (groupId) => {
    // const group = groupData.find((g) => g.id === groupId);
    if (!Array.isArray(groupData)) {
      console.warn('groupData không phải là mảng:', groupData);
      return null;
    }

    const group = groupData.find((g) => g.id === groupId);
    if (!group) {
      console.warn(`Không tìm thấy group cho groupId ${groupId}`);
      return null;
    }
    if (group) {
      return (
        <div className="group-content">
          <div className="group-image">
            {group.image_url && <img src={group.image_url1} alt="Group Illustration" />}
            {/* {group.image_url2 && (
              <img src={group.image_url2} alt="Group Illustration" />
            )} */}
          </div>
          {group.media_name && /^\d+-\d+$/.test(group.media_name) && (
            <div className="group-name">Questions {group.media_name} refer to the following:</div>
          )}
          {group.paragrap_main && /[a-zA-Z]/.test(group.paragrap_main.replace(/\bp\b/g, '')) && (
            <div className="group-paragraph">
              <div dangerouslySetInnerHTML={{ __html: group.paragrap_main }} />
            </div>
          )}
        </div>
      );
    }
    return null;
  };

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

  const renderQuestions = () => {
    let lastGroupId = null;

    return filteredQuestions.map((question) => {
      const isNewGroup = question.group_id !== lastGroupId;
      lastGroupId = question.group_id;

      const groupContent = getGroupContent(question.group_id);
      const answersForQuestion = answerData.filter((answer) => answer.question_id === question.id);
      const correctAnswer = answersForQuestion.find((answer) => answer.is_correct);

      const partDetails = partData.find((p) => p.id === question.part_id);
      const isAudioPart =
        partDetails && ['Part 1', 'Part 2', 'Part 3', 'Part 4'].includes(partDetails.part_order);
      const isTextPart =
        partDetails && ['Part 5', 'Part 6', 'Part 7'].includes(partDetails.part_order);

      const group = groupData.find((g) => g.id === question.group_id);
      const audioScript = group?.audio_script || 'No script available.';
      const translateScript = group?.translate_script || 'Không có bản dịch nào.';
      const explainQuestion = group?.explain_question || 'No explanation available.';

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
              <p className="question-title">
                {question.order}.
                <br />
              </p>
            );
          } else {
            questionDisplay = (
              <p className="question-title">
                {question.order}.
                <br />
              </p>
            );
          }
        } else {
          questionDisplay = (
            <p className="question-title">
              {question.order}.
              <br />
            </p>
          );
        }
      } else {
        questionDisplay = (
          <p className="question-title">
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
          </div>

          {isAudioPart && (
            <div className="script-dropdown">
              <button className="script-toggle-btn" onClick={() => toggleScript(question.order)}>
                {showScripts[question.order] ? 'Hide script' : 'Show script'}
                <FontAwesomeIcon
                  icon={faCaretDown}
                  className={`script-icon ${showScripts[question.order] ? 'rotate-up' : 'rotate-down'
                    }`}
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
                onClick={() => toggleTranslation(question.order, audioScript, translateScript)}
                style={{ marginTop: '8px' }}
                disabled={isTranslating[question.order]}>
                {isTranslating[question.order]
                  ? 'Translating...'
                  : showTranslations[question.order]
                    ? 'Hide translation'
                    : 'Show translation'}
                <FontAwesomeIcon
                  icon={faCaretDown}
                  className={`script-icon ${showTranslations[question.order] ? 'rotate-up' : 'rotate-down'
                    }`}
                />
              </button>
              {showTranslations[question.order] && (
                <div className="script-content">
                  {userState.role === 'admin' && isEditingTranslation[question.order] ? (
                    <textarea
                      value={editedTranslations[question.order] || ''}
                      onChange={(e) => handleTranslationChange(question.order, e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        resize: 'vertical',
                        padding: '8px',
                        fontSize: '1.4rem',
                      }}
                    />
                  ) : (
                    <p>{editedTranslations[question.order] || translateScript}</p>
                  )}
                  {userState.role === 'admin' && (
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
                        Update
                      </button>
                      <button
                        className="script-toggle-btn"
                        onClick={() => handleSaveTranslation(question.order, question.group_id)}
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
                        onClick={() => handleRetryTranslation(question.order, audioScript)}
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
                  toggleExplanation(question, group, answersForQuestion, correctAnswer)
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
                  className={`script-icon ${showExplanations[question.order] ? 'rotate-up' : 'rotate-down'
                    }`}
                />
              </button>
              {showExplanations[question.order] && (
                <div className="script-content">
                  {userState.role === 'admin' && isEditingExplanation[question.order] ? (
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
                  {userState.role === 'admin' && (
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
                        onClick={() => handleSaveExplanation(question.order, question.group_id)}
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
                          !isEditingExplanation[question.order] || isExplaining[question.order]
                        }
                        style={{
                          backgroundColor:
                            isEditingExplanation[question.order] && !isExplaining[question.order]
                              ? '#2777ee'
                              : '#ccc',
                          color:
                            isEditingExplanation[question.order] && !isExplaining[question.order]
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
    return Object.entries(partsData).map(([part, { start, end }]) => (
      <div key={part} className="part-section">
        <h3>{part}</h3>
        <div className="question-numbers">
          {[...Array(end - start + 1)].map((_, i) => {
            const questionId = start + i;
            const isAnswered = Object.keys(selectedAnswers).includes(String(questionId));
            return (
              <button
                key={questionId}
                className={`question-number ${isAnswered ? 'answered' : ''} ${selectedPart === part && filteredQuestions.some((q) => q.id === questionId)
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

export default ViewDetailResult;
