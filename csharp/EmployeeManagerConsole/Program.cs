using EmployeeManagerConsole;

const string filePath = "employee.txt";

// 1. Create a Manager object
Manager manager = new Manager("John Smith", 85000m, "Sales");

// 2. Save the employee info into a text file
File.WriteAllText(filePath, manager.GetInfo());
Console.WriteLine($"Employee information saved to {Path.GetFullPath(filePath)}");
Console.WriteLine();

// 3. Read the information back from the text file
string fileContents = File.ReadAllText(filePath);

// 4. Display the info
Console.WriteLine("Employee information read from file:");
Console.WriteLine("------------------------------------");
Console.WriteLine(fileContents);
