export function businessAverageScore(business) {
  if (business.reviews.length !== 0) {
    return `${business.reviews.reduce(
      (total, review) => total + review.score,
      0
    ) / business.reviews.length}/5 - ${business.reviews.length} ${
      business.reviews.length === 1 ? 'review' : 'reviews'
    }`;
  }
  return 'No Rating';
}
