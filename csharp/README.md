# C# Employee / Manager Examples

Two small .NET 8 projects that demonstrate inheritance with an `Employee`
base class (`Name`, `Salary`) and a `Manager` derived class (`Department`).

The `base` keyword is used twice in `Manager`:

- `: base(name, salary)` calls the `Employee` constructor.
- `base.GetInfo()` reuses the `Employee` output and appends the department.

## EmployeeManagerConsole

Creates a `Manager` object, saves its info to `employee.txt`, reads the file
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

## EmployeeManagerWeb (simple ASP.NET Core app)

A one-page ASP.NET Core minimal app. Fill in the form to create a `Manager`;
it is saved to `employee.txt` and the page shows the contents read back from
the file.

```bash
cd EmployeeManagerWeb
dotnet run
```

Then open the URL printed in the console (e.g. `http://localhost:5000`).
