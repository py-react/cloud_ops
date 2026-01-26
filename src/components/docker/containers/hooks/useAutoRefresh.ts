import { useState, useEffect, useRef } from 'react';

/**
 * useAutoRefresh - A custom hook to auto-refresh state at a fixed interval (1.5s)
 * @param {Function} fetchFunction The fetch function to be called
 * @param {number} interval Time interval in milliseconds (default: 1500ms)
 */
const useAutoRefresh = (fetchFunction, interval = 1500) => {
  const [data, setData] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  // Fetch the data
  const fetchData = async () => {
    if (isFetching) return; // If already fetching, don't do anything

    setIsFetching(true);
    try {
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setIsFetching(false);
    }
  };

  // Set up interval to refresh data every 1.5 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchData();
    }, interval);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [isFetching]); // Only reset interval if fetch state changes

  return { data, isFetching, error, refresh: fetchData };
};

export default useAutoRefresh;