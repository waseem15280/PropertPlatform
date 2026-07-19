using Microsoft.AspNetCore.Mvc;
using PropertyPlatform.Core;
using PropertyPlatform.Infrastructure.Models;

namespace PropertyPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class BookingsController : ControllerBase
{
    private readonly BookingVisitRepository _bookingRepository;
    private readonly PropertyRepository _propertyRepository;
    private readonly UserRepository _userRepository;

    public BookingsController(BookingVisitRepository bookingRepository, PropertyRepository propertyRepository, UserRepository userRepository)
    {
        _bookingRepository = bookingRepository;
        _propertyRepository = propertyRepository;
        _userRepository = userRepository;
    }

    [HttpPost]
    public async Task<IActionResult> CreateBooking(CreateBookingRequest request)
    {
        var property = await _propertyRepository.GetPropertyByIdAsync(request.PropertyId);
        if (property is null)
        {
            return BadRequest(new { message = "Property not found." });
        }

        var tenant = await _userRepository.GetUserByIdAsync(request.TenantId);
        if (tenant is null || tenant.Role != UserRole.Tenant)
        {
            return BadRequest(new { message = "Tenant not found or invalid user role." });
        }

        var dealer = await _userRepository.GetUserByIdAsync(request.DealerId);
        if (dealer is null || dealer.Role != UserRole.Dealer)
        {
            return BadRequest(new { message = "Dealer not found or invalid user role." });
        }

        var booking = new BookingVisit(
            0,
            request.PropertyId,
            request.TenantId,
            request.DealerId,
            request.VisitFee,
            request.ScheduledVisitTime,
            VisitStatus.Requested,
            VisitChargeStatus.Unpaid,
            BrokerageStatus.None
        );

        await _bookingRepository.CreateBookingVisitAsync(booking);
        return CreatedAtAction(nameof(GetBookingById), new { id = booking.Id }, booking);
    }

    [HttpGet]
    public async Task<IActionResult> GetBookings(long? tenantId, long? propertyId, long? dealerId)
    {
        var bookings = await _bookingRepository.GetBookingVisitsAsync(tenantId, propertyId, dealerId);
        return Ok(bookings);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetBookingById(long id)
    {
        var booking = await _bookingRepository.GetBookingVisitByIdAsync(id);
        return booking is not null ? Ok(booking) : NotFound();
    }
}
