import React, { useState, useEffect } from 'react';
import { Star, MessageCircle } from 'lucide-react';
import { reviewsApi, type Review, type PlayerProfile } from '../lib/supabase';

interface ReviewsListProps {
  pitchId: string;
}

export default function ReviewsList({ pitchId }: ReviewsListProps) {
  const [reviews, setReviews] = useState<(Review & { player_profiles: PlayerProfile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<{ average: number; count: number }>({ average: 0, count: 0 });

  useEffect(() => {
    loadReviews();
  }, [pitchId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const [reviewsData, avgData] = await Promise.all([
        reviewsApi.getByPitchId(pitchId),
        reviewsApi.getAverageRating(pitchId)
      ]);
      setReviews(reviewsData);
      setAverageRating(avgData);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Customer Reviews</h3>
            {averageRating.count > 0 && (
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(averageRating.average)
                          ? 'fill-yellow-300 text-yellow-300'
                          : 'text-white opacity-30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-white font-semibold">
                  {averageRating.average.toFixed(1)} ({averageRating.count} {averageRating.count === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No reviews yet. Be the first to review this venue!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {review.player_profiles?.full_name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
                  </div>
                  {renderStars(review.rating)}
                </div>
                {review.review_text && (
                  <p className="text-gray-700 mt-2">{review.review_text}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
