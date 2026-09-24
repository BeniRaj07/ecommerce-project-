using Microsoft.AspNetCore.Mvc;
using StudentApi.Models;

namespace StudentApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentsController : ControllerBase
{
    // In-memory sample data
    private static readonly List<Student> Students = new()
    {
        new Student { Id = 1, Name = "Alice", Age = 20, Course = "Computer Science" },
        new Student { Id = 2, Name = "Bob", Age = 22, Course = "Mathematics" },
        new Student { Id = 3, Name = "Charlie", Age = 21, Course = "Physics" }
    };

    // GET: api/students  -> display all students
    [HttpGet]
    public ActionResult<IEnumerable<Student>> GetAll()
    {
        return Ok(Students);
    }

    // GET: api/students/{id}  -> display one student
    [HttpGet("{id}")]
    public ActionResult<Student> GetById(int id)
    {
        Student? student = Students.FirstOrDefault(s => s.Id == id);

        if (student == null)
        {
            return NotFound(new { message = $"Student with id {id} not found." });
        }

        return Ok(student);
    }
}
