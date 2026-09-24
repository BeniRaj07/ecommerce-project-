namespace EmployeeManagerConsole;

// Derived class: Manager inherits Name and Salary from Employee
public class Manager : Employee
{
    public string Department { get; set; }

    // "base" passes name and salary to the Employee constructor
    public Manager(string name, decimal salary, string department)
        : base(name, salary)
    {
        Department = department;
    }

    // "base" reuses the Employee output and adds the Department
    public override string GetInfo()
    {
        return base.GetInfo() + $"\nDepartment: {Department}";
    }
}
