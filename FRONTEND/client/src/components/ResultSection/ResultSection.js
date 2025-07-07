import React from 'react';

import { TestPart, Part } from '../Data';
import './ResultSection.css';

const ResultSection = ({ id, resultId, selectedHistory }) => {
  console.log('selectedHistory.type', selectedHistory.type);

  const partsToDisplay =
    selectedHistory.type === 'FullTest'
      ? Part.filter((p) =>
          TestPart.some(
            (tp) => Number(tp.test_id) === selectedHistory.test_id && tp.part_id === p.id
          )
        )
      : Part.filter((p) =>
          TestPart.some((tp) => tp.test_id === selectedHistory.test_id && tp.part_id === p.id)
        );

  let totalQuestionsSoFar = 0; // Biến tích lũy để đánh số câu hỏi liên tiếp

  return (
    <div className="result-section">
      <h2>Quick View Result</h2>
      {partsToDisplay.map((part) => {
        const questionStart = totalQuestionsSoFar + 1; // Số câu bắt đầu của Part này
        totalQuestionsSoFar += part.questionCount; // Cập nhật số câu đã hiển thị

        const questionEnd = totalQuestionsSoFar; // Số câu kết thúc của Part này
        const questionCount = part.questionCount;
        const questionsPerColumn = Math.ceil(questionCount / 3);

        const columns = Array.from({ length: 3 }, (_, colIndex) =>
          Array.from(
            { length: questionsPerColumn },
            (_, rowIndex) => questionStart + rowIndex + colIndex * questionsPerColumn
          ).filter((num) => num <= questionEnd)
        );

        return (
          <div key={part.id} className="part-section">
            <h4>{part.part_order}</h4>
            <div className="columns">
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="column">
                  {column.map((questionNum) => (
                    <div>
                      <div key={questionNum} className="question number-box">
                        {questionNum}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResultSection;
