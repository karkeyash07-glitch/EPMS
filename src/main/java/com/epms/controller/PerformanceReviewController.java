package com.epms.controller;

import com.epms.PerformanceReview;
import com.epms.service.PerformanceReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/reviews")
public class PerformanceReviewController {

    private final PerformanceReviewService reviewService;

    public PerformanceReviewController(PerformanceReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<PerformanceReview> addReview(@RequestBody PerformanceReview review) {
        PerformanceReview created = reviewService.addReview(review);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public List<PerformanceReview> getAllReviews() {
        return reviewService.getAllReviews();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PerformanceReview> getReviewById(@PathVariable Long id) {
        return reviewService.getReviewById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}")
    public List<PerformanceReview> getReviewsByEmployeeId(@PathVariable Long employeeId) {
        return reviewService.getReviewsByEmployeeId(employeeId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteReview(@PathVariable Long id) {
        try {
            reviewService.deleteReview(id);
            return ResponseEntity.ok("Review deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
