package com.epms;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.List;

@SpringBootApplication
public class EpmsApplication {

	public static void main(String[] args) {
		SpringApplication.run(EpmsApplication.class, args);
	}

	@Bean
	CommandLineRunner initData(
			EmployeeRepository employeeRepository,
			TaskRepository taskRepository,
			PerformanceReviewRepository reviewRepository) {
		return args -> {
			if (employeeRepository.count() == 0) {
				Employee e1 = employeeRepository.save(new Employee("Alice Johnson", "Engineering", "alice.johnson@example.com", "Senior Software Engineer"));
				Employee e2 = employeeRepository.save(new Employee("Bob Smith", "Human Resources", "bob.smith@example.com", "HR Specialist"));
				Employee e3 = employeeRepository.save(new Employee("Charlie Brown", "Finance", "charlie.brown@example.com", "Financial Analyst"));
				Employee e4 = employeeRepository.save(new Employee("Diana Prince", "Product", "diana.prince@example.com", "Lead Product Manager"));

				if (taskRepository.count() == 0) {
					taskRepository.save(new Task("Implement Auth Service", "OAuth2 and JWT token authentication integration", e1.getId(), e1.getName(), "High", "Completed", "2026-11-05"));
					taskRepository.save(new Task("Database Optimization", "Tune indexes for employee query performance", e1.getId(), e1.getName(), "Medium", "Completed", "2026-11-12"));
					taskRepository.save(new Task("Microservice CI/CD", "Automate build and deployment pipelines", e1.getId(), e1.getName(), "High", "In Progress", "2026-11-18"));

					taskRepository.save(new Task("Onboard New Hires", "Conduct orientation for Q4 engineering cohort", e2.getId(), e2.getName(), "Medium", "Completed", "2026-11-02"));
					taskRepository.save(new Task("Benefits Policy Review", "Update health insurance and wellness policy", e2.getId(), e2.getName(), "Low", "Pending", "2026-11-25"));

					taskRepository.save(new Task("Q4 Budget Forecast", "Finalize annual department expenditure projections", e3.getId(), e3.getName(), "High", "Completed", "2026-11-08"));
					taskRepository.save(new Task("Tax Compliance Audit", "Review fiscal statements with external auditors", e3.getId(), e3.getName(), "Medium", "In Progress", "2026-11-22"));

					taskRepository.save(new Task("Product Roadmap 2027", "Define key epics and feature milestones", e4.getId(), e4.getName(), "High", "Completed", "2026-11-03"));
				}

				if (reviewRepository.count() == 0) {
					reviewRepository.save(new PerformanceReview(e1.getId(), e1.getName(), 96, 5, "Outstanding architecture design and consistently delivers ahead of schedule.", "Sarah Connor (CTO)", "2026-10-15"));
					reviewRepository.save(new PerformanceReview(e4.getId(), e4.getName(), 94, 5, "Superb customer discovery and exceptional cross-functional leadership.", "Elena Rostova (VP Product)", "2026-10-19"));
					reviewRepository.save(new PerformanceReview(e3.getId(), e3.getName(), 90, 4, "Strong analytical rigor and detailed financial reporting.", "Gordon Gekko (CFO)", "2026-10-22"));
					reviewRepository.save(new PerformanceReview(e2.getId(), e2.getName(), 86, 4, "Great enthusiasm and highly effective recruitment initiatives.", "Michael Scott (HR Director)", "2026-10-25"));
				}
			} else {
				// Seed tasks and reviews if employees already exist but tasks/reviews are empty
				List<Employee> existing = employeeRepository.findAll();
				if (!existing.isEmpty() && taskRepository.count() == 0) {
					Employee e1 = existing.get(0);
					taskRepository.save(new Task("Implement Auth Service", "OAuth2 and JWT token authentication integration", e1.getId(), e1.getName(), "High", "Completed", "2026-11-05"));
					taskRepository.save(new Task("Database Optimization", "Tune indexes for employee query performance", e1.getId(), e1.getName(), "Medium", "In Progress", "2026-11-12"));
					if (existing.size() > 1) {
						Employee e2 = existing.get(1);
						taskRepository.save(new Task("Onboard New Hires", "Conduct orientation for Q4 engineering cohort", e2.getId(), e2.getName(), "Medium", "Completed", "2026-11-02"));
					}
				}
				if (!existing.isEmpty() && reviewRepository.count() == 0) {
					Employee e1 = existing.get(0);
					reviewRepository.save(new PerformanceReview(e1.getId(), e1.getName(), 95, 5, "Consistently exceeds goals and mentors team members.", "Technical Lead", "2026-10-15"));
					if (existing.size() > 1) {
						Employee e2 = existing.get(1);
						reviewRepository.save(new PerformanceReview(e2.getId(), e2.getName(), 88, 4, "Great communication and reliability across projects.", "Department Head", "2026-10-20"));
					}
				}
			}
		};
	}
}
