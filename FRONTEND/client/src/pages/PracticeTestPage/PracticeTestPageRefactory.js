import { useState } from 'react';

const PartNavigationComponent = ({ activePart, onSelect, totalParts }) => {
  const parts = Array.from({ length: totalParts }, (_, i) => i + 1);

  return (
    <div className="d-flex flex-row justify-content-center gap-2 my-3">
      {parts.map((part) => (
        <button
          key={part}
          className={`btn rounded-oval 
          ${activePart === part ? 'bg-primary text-white' : 'bg-light text-dark'}`}
          style={{
            minWidth: '70px',
            height: '40px',
            padding: '0 12px',
            fontWeight: 'bold',
            border: '1px solid #ccc',
            borderRadius: '999px',
          }}
          onClick={() => onSelect(part)}>
          Part {part}
        </button>
      ))}
    </div>
  );
};

const QuestionNavigationComponent = ({ questionsByPart = {}, activeQuestion, onSelect }) => {
  return (
    <div className="my-4 bg-light">
      {Object.entries(questionsByPart).map(([part, questions]) => (
        <div key={part} className="mb-3">
          <div className="fw-bold mb-2">Part {part}</div>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {questions.map((qId) => (
              <button
                key={qId}
                className={`btn 
                ${activeQuestion === qId ? 'bg-primary text-white' : 'bg-light text-dark'}`}
                style={{
                  minWidth: '40px',
                  height: '40px',
                  borderRadius: '999px',
                  fontWeight: 'bold',
                  border: '1px solid #ccc',
                }}
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

const QuestionViewerComponent = () => { };

const PracticeTestPage = () => {
  const [activeQuestion, setActiveQuestion] = useState(1);
  const [activePart, setActivePart] = useState(1);

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

  return (
    <>
      <div style={{ position: 'relative', height: '100vh' }}>
        <div style={{ position: 'fixed', top: 0, left: 0, padding: '10px', zIndex: 10 }}>
          <PartNavigationComponent
            totalParts={7}
            activePart={activePart}
            onSelect={handlePartSelect}
          />
        </div>

        <QuestionNavigationComponent
          questionsByPart={questionsByPart}
          activeQuestion={activeQuestion}
          onSelect={handleQuestionSelect}
        />
        <QuestionViewerComponent questionId={activeQuestion} />
      </div>
    </>
  );
};

export default PracticeTestPage;
