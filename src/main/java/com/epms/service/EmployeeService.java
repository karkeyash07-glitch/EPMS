package com.epms.service;

import com.epms.Employee;
import com.epms.EmployeeRepository;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    // Add Employee
    public Employee addEmployee(Employee employee) {
        return employeeRepository.save(employee);
    }

    // View All Employees
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    // Search Employee by ID
    public Optional<Employee> getEmployeeById(Long id) {
        return employeeRepository.findById(id);
    }

    // Update Employee
    public Employee updateEmployee(Long id, Employee updatedEmployee) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        employee.setName(updatedEmployee.getName());
        employee.setDepartment(updatedEmployee.getDepartment());
        employee.setEmail(updatedEmployee.getEmail());
        employee.setDesignation(updatedEmployee.getDesignation());

        return employeeRepository.save(employee);
    }

    // Delete Employee
    public void deleteEmployee(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new RuntimeException("Employee not found with id: " + id);
        }
        employeeRepository.deleteById(id);
    }
}