# C# Exercises (Set B)

Two small .NET 10 projects (need the .NET 10 SDK).

## EmployeeManagerConsole (Question 1 – OOP + File I/O)

`Employee` base class (`Name`, `Salary`) and `Manager` derived class
(`Department`). The `base` keyword is used twice in `Manager`:

- `: base(name, salary)` calls the `Employee` constructor.
- `base.GetInfo()` reuses the `Employee` output and appends the department.

The app creates a `Manager` object, saves its info to `employee.txt`, reads the file
back and prints it.

```bash
cd EmployeeManagerConsole
dotnet run
```

Sample output:

```
Employee information saved to /.../employee.txt

Employee information read from file:
------------------------------------
Name: John Smith
Salary: 85000
Department: Sales
```

## StudentApi (ASP.NET Core Web API)

A controller-based Web API for `Student` (Id, Name, Age, Course) with
in-memory sample data. Results are returned as JSON.

| Method | Route                | Description          |
|--------|----------------------|----------------------|
| GET    | `/api/students`      | Display all students |
| GET    | `/api/students/{id}` | Display one student (404 if not found) |

```bash
cd StudentApi
dotnet run
```

Then open the URL printed in the console, e.g. `http://localhost:5000/api/students`
or `http://localhost:5000/api/students/1`.

Sample response for `/api/students/1`:

```json
{ "id": 1, "name": "Alice", "age": 20, "course": "Computer Science" }
```
