import React, { useEffect } from 'react';

function CountdownTimer({ time, setTime, timeDown }) {
  useEffect(() => {
    if (timeDown && time !== null) {
      const timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (!timeDown && time !== null) {
      if (time == 0 || timeDown === false) {
        const timer = setInterval(() => {
          setTime((prevTime) => Number(prevTime) + 1);
        }, 1000);
        return () => clearInterval(timer);
      } else {
        const timer = setInterval(() => {
          setTime((prevTime) => prevTime - 1);
        }, 1000);
        return () => clearInterval(timer);
      }
    }
  }, [time, setTime, timeDown]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <p>
        Time: <span>{formatTime(time)}</span>
      </p>
    </div>
  );
}

export default CountdownTimer;
