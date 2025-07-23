import { useState, useEffect } from 'react';

import { getStorageJSON, setStorageJSON, removeStorageItem } from '../utils/localStorageUtil';

export const useLocalStorage = (key, defaultValue = {}) => {
  const [value, setValue] = useState(() => getStorageJSON(key, defaultValue));

  useEffect(() => {
    setStorageJSON(key, value);
  }, [key, value]);

  const clear = () => {
    removeStorageItem(key);
    setValue(defaultValue);
  };

  return [value, setValue, clear];
};
