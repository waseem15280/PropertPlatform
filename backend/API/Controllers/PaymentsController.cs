using Microsoft.AspNetCore.Mvc;
using PropertyPlatform.Core;
using PropertyPlatform.Infrastructure.Models;

namespace PropertyPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class PaymentsController : ControllerBase
{
    private readonly PaymentRepository _paymentRepository;
    private readonly UserRepository _userRepository;

    public PaymentsController(PaymentRepository paymentRepository, UserRepository userRepository)
    {
        _paymentRepository = paymentRepository;
        _userRepository = userRepository;
    }

    [HttpPost]
    public async Task<IActionResult> CreatePayment(CreatePaymentRequest request)
    {
        var user = await _userRepository.GetUserByIdAsync(request.UserId);
        if (user is null)
        {
            return BadRequest(new { message = "User not found." });
        }

        var payment = new Payment(0,
            request.PaymentReference,
            request.UserId,
            request.Amount,
            request.PaymentType,
            request.GatewayReference,
            request.Status
        );

        await _paymentRepository.CreatePaymentAsync(payment);
        return Created($"/api/payments/{payment.PaymentId}", payment);
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetPaymentsByUserId(long userId)
    {
        var payments = await _paymentRepository.GetPaymentsByUserIdAsync(userId);
        return Ok(payments);
    }
}
