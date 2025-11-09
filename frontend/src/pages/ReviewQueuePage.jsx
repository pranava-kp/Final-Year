// frontend/src/pages/ReviewQueuePage.jsx
import React, { useState, useEffect } from 'react';
// Import the API functions you already have
import { reviewQueueApi, handleApiError } from '../services/adminApi'; 
import ReviewQueueItem from '../components/ReviewQueueItem';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

const ReviewQueuePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      // 1. Call your existing adminApi.js function
      const responseData = await reviewQueueApi.getItems({ status: 'pending' });
      // 2. Set the state. (Handle mock vs. real data)
      if (responseData.data) {
        setItems(responseData.data); // Real API response
      } else {
        setItems(responseData); // Mock data response
      }
    } catch (err) {
      const { error: errorMsg } = handleApiError(err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch items when the component loads
  useEffect(() => {
    fetchItems();
  }, []);

  const handleApprove = async (itemId) => {
    try {
      setError(null);
      // Optimistic update: remove from UI immediately for a snappy feel
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      
      // Make the API call in the background
      await reviewQueueApi.approveItem(itemId);
      
    } catch (err) {
      const { error: errorMsg } = handleApiError(err);
      setError(errorMsg);
      // Rollback: If the API call fails, re-fetch the list
      fetchItems();
    }
  };

  const handleReject = async (itemId) => {
    try {
      setError(null);
      // Optimistic update
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      
      // Make the API call in the background
      await reviewQueueApi.rejectItem(itemId);
      
    } catch (err) {
      const { error: errorMsg } = handleApiError(err);
      setError(errorMsg);
      // Rollback
      fetchItems();
    }
  };
  
  const handleEdit = (item) => {
    // TODO: Implement your edit logic (e.g., open a modal)
    console.log('Editing:', item);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Fallback Question Review Queue
      </h1>
      
      {error && <ErrorMessage message={error} />}
      
      <div className="space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <ReviewQueueItem
              key={item.id}
              item={item}
              onApprove={() => handleApprove(item.id)}
              onReject={() => handleReject(item.id)}
              onEdit={() => handleEdit(item)}
            />
          ))
        ) : (
          !loading && (
            <p className="text-gray-600 dark:text-gray-400">
              The review queue is empty.
            </p>
          )
        )}
      </div>
    </div>
  );
};

export default ReviewQueuePage;