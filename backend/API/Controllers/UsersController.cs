using Microsoft.AspNetCore.Mvc;
using PropertyPlatform.Core;
using PropertyPlatform.Infrastructure.Models;

namespace PropertyPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class UsersController : ControllerBase
{
    private readonly UserRepository _userRepository;

    public UsersController(UserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userRepository.GetUsersAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUserById(long id)
    {
        var user = await _userRepository.GetUserByIdAsync(id);
        return user is not null ? Ok(user) : NotFound();
    }

    [HttpPost("signup")]
    public async Task<IActionResult> SignUp([FromBody] SignUpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Email is required." });
        }

        var parsedRole = Enum.TryParse<UserRole>(request.Role, true, out var role)
            ? role
            : UserRole.Tenant;

        var user = new User(
            0,
            request.Name,
            "",
            request.Email,
            parsedRole,
            true
        );

        await _userRepository.CreateUserAsync(user);
        return CreatedAtAction(nameof(GetUserById), new { id = user.Id }, user);
    }

    [HttpPost("signin")]
    public async Task<IActionResult> SignIn([FromBody] SignInRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Email is required." });
        }

        var users = await _userRepository.GetUsersAsync();
        var user = users.FirstOrDefault(u => string.Equals(u.Email, request.Email, StringComparison.OrdinalIgnoreCase));

        return user is not null ? Ok(user) : NotFound(new { message = "User not found." });
    }
}
