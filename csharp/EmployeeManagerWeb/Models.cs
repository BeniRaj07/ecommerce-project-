namespace EmployeeManagerWeb;

// Base class
public class Employee
{
    public string Name { get; set; }
    public decimal Salary { get; set; }

    public Employee(string name, decimal salary)
    {
        Name = name;
        Salary = salary;
    }

    public virtual string GetInfo()
    {
        return $"Name: {Name}\nSalary: {Salary}";
    }
}

// Derived class
public class Manager : Employee
{
    public string Department { get; set; }

    public Manager(string name, decimal salary, string department)
        : base(name, salary)
    {
        Department = department;
    }

    public override string GetInfo()
    {
        return base.GetInfo() + $"\nDepartment: {Department}";
    }
}
