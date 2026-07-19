using PropertyPlatform.Core;

namespace PropertyPlatform.API.Controllers;

public sealed record CreatePropertyRequest(
    string Title,
    string Description,
    string? VideoUrl,
    decimal Price,
    decimal AdvancePayment,
    string Location,
    bool IsAvailable,
    PropertyStatus Status,
    long DealerId
);

public sealed record CreateBookingRequest(
    long PropertyId,
    long TenantId,
    long DealerId,
    decimal VisitFee,
    DateTimeOffset ScheduledVisitTime
);

public sealed record CreatePaymentRequest(
    string PaymentReference,
    long UserId,
    decimal Amount,
    string PaymentType,
    string GatewayReference,
    PaymentStatus Status
);

public sealed record UpdatePropertyRequest(
    string? Title,
    string? Description,
    string? VideoUrl,
    decimal? Price,
    decimal? AdvancePayment,
    string? Location,
    bool? IsAvailable,
    PropertyStatus? Status,
    long? DealerId
);

public sealed record SignUpRequest(
    string Name,
    string Email,
    string Password,
    string Role
);

public sealed record SignInRequest(
    string Email,
    string Password
);
