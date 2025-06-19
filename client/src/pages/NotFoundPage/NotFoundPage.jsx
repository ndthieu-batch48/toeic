import React, { useState } from 'react';

import ButtonComponent from '../../components/ButtonComponent/ButtonComponent';

const NotFoundPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [toggleState, setToggleState] = useState(false);
  return (
    <div style={{ padding: '20px' }}>
      <ButtonComponent
        variant="submit"
        onClick={() => setIsLoading(!isLoading)}
        isLoading={isLoading}>
        Submit
      </ButtonComponent>
      <ButtonComponent variant="default" onClick={() => setIsActive(!isActive)} isActive={isActive}>
        Toggle Active
      </ButtonComponent>
      <ButtonComponent
        variant="toggle"
        onClick={() => setToggleState(!toggleState)}
        toggleState={toggleState}
        showIcon>
        {toggleState ? 'Hide script' : 'Show script'}
      </ButtonComponent>
      <ButtonComponent
        variant="question"
        onClick={() => alert('Question clicked')}
        isAnswered
        isActive>
        1
      </ButtonComponent>
    </div>
  );
};

export default NotFoundPage;
