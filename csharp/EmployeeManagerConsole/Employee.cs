namespace EmployeeManagerConsole;

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

    // virtual so derived classes can extend the output
    public virtual string GetInfo()
    {
        return $"Name: {Name}\nSalary: {Salary}";
    }
}
