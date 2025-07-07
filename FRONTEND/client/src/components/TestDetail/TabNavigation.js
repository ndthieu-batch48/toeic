const TabNavigation = ({ activeTab, onTabChange }) => (
  <div className="tab-navigation">
    <button
      label="Practice"
      onClick={() => onTabChange('practice')}
      className={activeTab === 'practice' ? 'active' : ''}>
      Practice
    </button>
    <button
      label="Full test"
      onClick={() => onTabChange('fullTest')}
      className={activeTab === 'fullTest' ? 'active' : ''}>
      Full test
    </button>
    <button
      label="Answer"
      onClick={() => onTabChange('answer')}
      className={activeTab === 'answer' ? 'active' : ''}>
      Answer
    </button>
  </div>
);

export default TabNavigation;
