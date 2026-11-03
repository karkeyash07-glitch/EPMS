package com.epms.service;

import com.epms.Task;
import com.epms.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public Task addTask(Task task) {
        if (task.getStatus() == null || task.getStatus().isBlank()) {
            task.setStatus("Pending");
        }
        if (task.getPriority() == null || task.getPriority().isBlank()) {
            task.setPriority("Medium");
        }
        return taskRepository.save(task);
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Optional<Task> getTaskById(Long id) {
        return taskRepository.findById(id);
    }

    public List<Task> getTasksByEmployeeId(Long employeeId) {
        return taskRepository.findByEmployeeId(employeeId);
    }

    public Task updateTask(Long id, Task updatedTask) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));

        task.setTitle(updatedTask.getTitle());
        task.setDescription(updatedTask.getDescription());
        task.setEmployeeId(updatedTask.getEmployeeId());
        task.setEmployeeName(updatedTask.getEmployeeName());
        task.setPriority(updatedTask.getPriority());
        task.setStatus(updatedTask.getStatus());
        task.setDueDate(updatedTask.getDueDate());

        return taskRepository.save(task);
    }

    public Task updateTaskStatus(Long id, String status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
        task.setStatus(status);
        return taskRepository.save(task);
    }

    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new RuntimeException("Task not found with id: " + id);
        }
        taskRepository.deleteById(id);
    }
}
