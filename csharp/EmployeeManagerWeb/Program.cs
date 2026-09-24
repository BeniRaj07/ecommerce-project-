using System.Net;
using EmployeeManagerWeb;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

string filePath = Path.Combine(app.Environment.ContentRootPath, "employee.txt");

// Home page: shows a form and whatever is currently stored in the text file
app.MapGet("/", () =>
{
    string saved = File.Exists(filePath)
        ? WebUtility.HtmlEncode(File.ReadAllText(filePath))
        : "No employee saved yet.";

    string html = $$"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <title>Employee Manager</title>
            <style>
                body { font-family: sans-serif; max-width: 480px; margin: 40px auto; }
                label { display: block; margin-top: 10px; }
                input { width: 100%; padding: 6px; }
                button { margin-top: 14px; padding: 8px 16px; }
                pre { background: #f2f2f2; padding: 12px; }
            </style>
        </head>
        <body>
            <h1>Employee Manager</h1>
            <form method="post" action="/save">
                <label>Name <input name="name" required /></label>
                <label>Salary <input name="salary" type="number" step="0.01" required /></label>
                <label>Department <input name="department" required /></label>
                <button type="submit">Save Manager</button>
            </form>

            <h2>Info read from employee.txt</h2>
            <pre>{{saved}}</pre>
        </body>
        </html>
        """;

    return Results.Content(html, "text/html");
});

// Create a Manager from the form, save it to the text file, then show it
app.MapPost("/save", async (HttpRequest request) =>
{
    var form = await request.ReadFormAsync();
    decimal.TryParse(form["salary"].ToString(), out decimal salary);

    Manager manager = new Manager(form["name"].ToString(), salary, form["department"].ToString());
    await File.WriteAllTextAsync(filePath, manager.GetInfo());

    return Results.Redirect("/");
});

app.Run();
