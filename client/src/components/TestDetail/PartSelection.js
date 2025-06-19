import './PartSelection.css';

const PartSelection = ({ parts, onSelect }) => (
  <div className="part-selection">
    {parts.map((part, index) => (
      <div key={part.id} className="part-item">
        <input
          type="checkbox"
          id={`part-${part.id}`}
          checked={part.selected}
          onChange={() => onSelect(part.id)}
        />
        <label htmlFor={`part-${part.id}`} className="part-label">
          Part {part.partOrderNum} ({part.questionCount} questions)
        </label>
      </div>
    ))}
  </div>
);

export default PartSelection;
