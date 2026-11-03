package com.epms.service;

import com.epms.PerformanceReview;
import com.epms.PerformanceReviewRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PerformanceReviewService {

    private final PerformanceReviewRepository reviewRepository;

    public PerformanceReviewService(PerformanceReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    public PerformanceReview addReview(PerformanceReview review) {
        if (review.getRating() == null || review.getRating() < 1) {
            review.setRating(3);
        }
        if (review.getScore() == null) {
            review.setScore(review.getRating() * 20);
        }
        return reviewRepository.save(review);
    }

    public List<PerformanceReview> getAllReviews() {
        return reviewRepository.findAll();
    }

    public Optional<PerformanceReview> getReviewById(Long id) {
        return reviewRepository.findById(id);
    }

    public List<PerformanceReview> getReviewsByEmployeeId(Long employeeId) {
        return reviewRepository.findByEmployeeId(employeeId);
    }

    public void deleteReview(Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new RuntimeException("Review not found with id: " + id);
        }
        reviewRepository.deleteById(id);
    }
}
