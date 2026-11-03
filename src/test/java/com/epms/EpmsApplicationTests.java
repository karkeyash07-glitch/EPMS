package com.epms;

import com.epms.service.EmployeeService;
import com.epms.service.PerformanceReviewService;
import com.epms.service.TaskService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class EpmsApplicationTests {

	@Autowired
	private EmployeeService employeeService;

	@Autowired
	private TaskService taskService;

	@Autowired
	private PerformanceReviewService reviewService;

	@Test
	void contextLoads() {
		assertNotNull(employeeService);
		assertNotNull(taskService);
		assertNotNull(reviewService);
	}

	@Test
	void testCreateAndGetEmployee() {
		Employee employee = new Employee("Test User", "QA", "test.user@example.com", "QA Engineer");
		Employee created = employeeService.addEmployee(employee);

		assertNotNull(created.getId());
		assertEquals("Test User", created.getName());
		assertEquals("QA", created.getDepartment());

		Optional<Employee> found = employeeService.getEmployeeById(created.getId());
		assertTrue(found.isPresent());
		assertEquals("QA Engineer", found.get().getDesignation());
	}

	@Test
	void testUpdateEmployee() {
		Employee employee = new Employee("Update Original", "IT", "update.orig@example.com", "IT Support");
		Employee created = employeeService.addEmployee(employee);

		Employee updatedDetails = new Employee("Update Modified", "DevOps", "update.mod@example.com", "DevOps Engineer");
		Employee updated = employeeService.updateEmployee(created.getId(), updatedDetails);

		assertEquals("Update Modified", updated.getName());
		assertEquals("DevOps", updated.getDepartment());
		assertEquals("update.mod@example.com", updated.getEmail());
		assertEquals("DevOps Engineer", updated.getDesignation());
	}

	@Test
	void testDeleteEmployee() {
		Employee employee = new Employee("Delete Target", "Finance", "delete.target@example.com", "Auditor");
		Employee created = employeeService.addEmployee(employee);

		Long id = created.getId();
		employeeService.deleteEmployee(id);

		Optional<Employee> found = employeeService.getEmployeeById(id);
		assertFalse(found.isPresent());
	}

	@Test
	void testDeleteNonExistentEmployeeThrows() {
		assertThrows(RuntimeException.class, () -> {
			employeeService.deleteEmployee(999999L);
		});
	}

	@Test
	void testTaskCrudOperations() {
		Task task = new Task("Test Task", "Task details", 1L, "Alice Johnson", "High", "Pending", "2026-12-01");
		Task created = taskService.addTask(task);

		assertNotNull(created.getId());
		assertEquals("Pending", created.getStatus());

		Task statusUpdated = taskService.updateTaskStatus(created.getId(), "Completed");
		assertEquals("Completed", statusUpdated.getStatus());

		List<Task> all = taskService.getAllTasks();
		assertFalse(all.isEmpty());

		taskService.deleteTask(created.getId());
		assertFalse(taskService.getTaskById(created.getId()).isPresent());
	}

	@Test
	void testReviewCrudOperations() {
		PerformanceReview review = new PerformanceReview(1L, "Alice Johnson", 98, 5, "Remarkable performance", "Manager", "2026-10-30");
		PerformanceReview created = reviewService.addReview(review);

		assertNotNull(created.getId());
		assertEquals(98, created.getScore());
		assertEquals(5, created.getRating());

		List<PerformanceReview> all = reviewService.getAllReviews();
		assertFalse(all.isEmpty());

		reviewService.deleteReview(created.getId());
		assertFalse(reviewService.getReviewById(created.getId()).isPresent());
	}
}
