import { useState } from 'react';

const PartNavComponent = ({ activePart, onSelect, totalParts }) => {
  const parts = Array.from({ length: totalParts }, (_, i) => i + 1);

  return (
    <div className="d-flex flex-row justify-content-start gap-2">
      {parts.map((part) => {
        const isActive = activePart === part;
        const activeBackgound = isActive ? 'bg-primary text-white' : 'bg-secondary-subtle';

        return (
          <button
            key={part}
            onClick={() => onSelect(part)}
            className={`btn rounded-pill fw-medium fs-5 px-3 py-2 ${activeBackgound}`}>
            Part {part}
          </button>
        );
      })}
    </div>
  );
};

const QuestionNavComponent = ({ questionsByPart = {}, activeQuestion, onSelect }) => {
  return (
    <div className="bg-body p-2 rounded-4 overflow-y-scroll" style={{ maxHeight: '300px' }}>
      {Object.entries(questionsByPart).map(([part, questions]) => (
        <div key={part} className="mb-5">
          <div className="fw-bold fs-4">Part {part}</div>
          <div className="d-flex flex-wrap gap-2">
            {questions.map((qId) => (
              <button
                key={qId}
                className={`fw-bold border border-2 rounded-circle
                ${activeQuestion === qId ? 'bg-primary text-white' : 'bg-light text-dark'}`}
                style={{ width: '30px', height: '30px' }}
                onClick={() => onSelect(qId)}>
                {qId}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const AudioComponent = ({ isAudioPlaying, onTogglePlay }) => {
  const iconClass = isAudioPlaying ? 'bi-pause-circle-fill' : 'bi-play-circle-fill';

  return (
    <div className="d-flex align-items-center gap-3 p-2 rounded-5 bg-body-secondary">
      {/* Play/Pause button */}
      <button
        onClick={onTogglePlay}
        className="border border-0 d-flex justify-content-center align-items-center"
        style={{ width: '40px', height: '40px' }}
        aria-label="Play/Pause">
        <i className={`bi ${iconClass}`} style={{ fontSize: '3rem' }}></i>
      </button>

      {/* Progress bar */}
      <div className="flex-grow-1">
        <div className="progress bg-secondary" style={{ height: '6px' }}>
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: '30%' }}
            aria-valuenow="30"
            aria-valuemin="0"
            aria-valuemax="100"></div>
        </div>
      </div>

      {/* Duration */}
      <div className="text-muted small fw-bold">00:30 / 02:15</div>
    </div>
  );
};

const QuestionItem = () => {
  const mockQuestion = {
    title: '71. On which day does this message take place?',
    question: 'Choose the correct day.',
    optionList: ['A. Saturday.', 'B. Monday.', 'C. Friday.', 'D. Tuesday.'],
  };
  const data = mockQuestion;

  return (
    <div className="p-4 border shadow-sm bg-white max-w-2xl mx-auto">
      <div className="flex items-start justify-between">
        <strong className="text-base">{data.title}</strong>
        <button className="text-gray-400 hover:text-gray-600">
          <i className="bi bi-flag-fill"></i>
        </button>
      </div>

      <div className="mt-3 text-gray-600">{data.question}</div>

      <div className="mt-4 space-y-2">
        {data.optionList.map((option, index) => (
          <div className="flex items-center gap-2" key={index}>
            <input
              type="radio"
              id={`option${index}`}
              name="question"
              className="accent-blue-600"
              defaultChecked={option.startsWith('C')} // match với ảnh
            />
            <label htmlFor={`option${index}`} className="text-sm text-gray-800">
              {option}
            </label>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <select className="border rounded px-3 py-1 text-sm">
          <option>Vietnamese</option>
          <option>English</option>
        </select>
      </div>

      <div className="mt-4 space-y-2">
        <a href="#" className="text-blue-600 text-sm hover:underline block">
          Show script <i className="bi bi-caret-down-fill"></i>
        </a>
        <a href="#" className="text-blue-600 text-sm hover:underline block">
          Show scripts translation <i className="bi bi-caret-down-fill"></i>
        </a>
      </div>
    </div>
  );
};

const PracticeTestPage = () => {
  const [activeQuestion, setActiveQuestion] = useState(1);
  const [activePart, setActivePart] = useState(1);

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const setPart = (part) => {
    if (part < 1 || part > 7) return;
    setActivePart(part);
  };

  const getPartFromQuestion = (questionId) => {
    if (questionId < 1 || questionId > 200) return;

    const thresholds = [6, 31, 70, 100, 130, 146];

    for (let i = 0; i < thresholds.length; i++) {
      if (questionId <= thresholds[i]) return i + 1;
    }

    return 7;
  };

  const handleQuestionSelect = (questionId) => {
    setActiveQuestion(questionId);
    const part = getPartFromQuestion(questionId);
    setPart(part);
  };

  const getFirstQuestionFromPart = (part) => {
    const map = {
      1: 1,
      2: 7,
      3: 32,
      4: 71,
      5: 101,
      6: 131,
      7: 147,
    };
    return map[part] || 1;
  };

  const handlePartSelect = (part) => {
    setPart(part);
    const questionId = getFirstQuestionFromPart(part);
    setActiveQuestion(questionId);
  };

  const questionsByPart = {
    1: Array.from({ length: 6 }, (_, i) => i + 1),
    2: Array.from({ length: 25 }, (_, i) => 7 + i),
    3: Array.from({ length: 39 }, (_, i) => 32 + i),
    4: Array.from({ length: 30 }, (_, i) => 71 + i),
    5: Array.from({ length: 30 }, (_, i) => 101 + i),
    6: Array.from({ length: 16 }, (_, i) => 131 + i),
    7: Array.from({ length: 54 }, (_, i) => 147 + i),
  };

  const handleToggleAudioPlay = () => {
    setIsAudioPlaying((prev) => !prev);
  };

  return (
    <div className="d-flex flex-column">
      {/* Title */}
      <div className="d-flex justify-content-center mb-5">
        <h1>Test 1</h1>
        <button
          className="btn btn-outline-danger rounded-pill ms-3 fw-bold fs-5"
          style={{ width: '100px' }}>
          Exit
        </button>
      </div>
      <div className="container-fluid">
        <div className="row g-0 gx-2">
          {/* Header - Left column - 9/12 */}
          <div className="col-10 bg-body rounded-5 p-3">
            <div className="d-flex flex-column gap-3">
              <PartNavComponent
                totalParts={7}
                activePart={activePart}
                onSelect={handlePartSelect}
              />
              <AudioComponent
                isAudioPlaying={isAudioPlaying}
                onTogglePlay={handleToggleAudioPlay}
              />

              <div>
                <QuestionItem />
              </div>
            </div>
          </div>

          {/* Right column - 3/12 */}
          <div className="col-2">
            <QuestionNavComponent
              questionsByPart={questionsByPart}
              activeQuestion={activeQuestion}
              onSelect={handleQuestionSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeTestPage;
