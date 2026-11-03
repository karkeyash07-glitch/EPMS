# Employee Performance Management System (EPMS)

## About the Project

The Employee Performance Management System (EPMS) is a web-based application developed to simplify employee management, task tracking, and performance evaluation within an organization.

The system provides a centralized platform to manage employee information, assign tasks, monitor task progress, and maintain employee performance reviews.

## Features

- **Employee Management:** Add, view, search, update, and delete employee records.
- **Task Management:** Create, view, update, and delete tasks assigned to employees.
- **Task Tracking:** Monitor task status and update progress.
- **Performance Reviews:** Create, view, and manage employee performance reviews.
- **Employee-wise Records:** Retrieve tasks and performance reviews associated with individual employees.
- **Database Management:** Store application data using the H2 database.

## Technologies Used

| Technology | Purpose |
|---|---|
| Java 25 | Backend programming |
| Spring Boot | Backend framework |
| Spring Data JPA | Database operations |
| H2 Database | Database management |
| Maven | Project build and dependency management |
| HTML | Frontend structure |
| CSS | Frontend styling |
| JavaScript | Frontend functionality |
| REST API | Communication between frontend and backend |

## Project Structure

```text
EPMS/
├── .mvn/
├── src/
│   ├── main/
│   │   ├── java/com/epms/
│   │   │   ├── config/
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── Employee.java
│   │   │   ├── Task.java
│   │   │   └── PerformanceReview.java
│   │   └── resources/
│   │       ├── static/
│   │       └── application.properties
│   └── test/
├── pom.xml
├── mvnw
├── mvnw.cmd
└── README.md
```

## How to Run the Project

### Prerequisites

- Java Development Kit (JDK) 25
- Visual Studio Code or any Java-compatible IDE

### Steps

1. Clone the repository:

```bash
git clone https://github.com/karkeyash07-glitch/EPMS.git
```

2. Open the project folder in VS Code.

3. Open the terminal in the project directory.

4. Run the application on Windows:

```bash
.\mvnw.cmd spring-boot:run
```

5. Open your browser and visit:

```text
http://localhost:8080
```

## Database

The application uses the H2 database with Spring Data JPA for storing employee, task, and performance review information.

The H2 database console is available at:

```text
http://localhost:8080/h2-console
```

## API Endpoints

| Module | Endpoint | Operations |
|---|---|---|
| Employees | `/api/employees` | Add, view, update, delete |
| Tasks | `/api/tasks` | Add, view, update, delete |
| Performance Reviews | `/api/reviews` | Add, view, delete |

## Testing

The project includes automated tests for employee management, task management, performance reviews, and application context loading.

## Repository

GitHub: https://github.com/karkeyash07-glitch/EPMS

---

**Developed as a Mini Project for the PCP Course.**
