namespace PropertyPlatform.Core;

public enum UserRole
{
    Dealer,
    Tenant,
    Support,
    Admin
}

public enum PropertyStatus
{
    Available,
    Reserved,
    Occupied,
    Removed
}

public enum VisitStatus
{
    Requested,
    PaymentPending,
    Scheduled,
    Completed,
    Cancelled
}

public enum VisitChargeStatus
{
    Unpaid,
    Paid
}

public enum BrokerageStatus
{
    None,
    Pending,
    Paid
}

public enum MediaType
{
    Image,
    Video
}

public enum DealStatus
{
    None,
    Pending,
    Paid
}

public enum PaymentStatus
{
    Initiated,
    Pending,
    Success,
    Failed,
    Refunded
}

public sealed record User(
    long Id,
    string Name,
    string Mobile,
    string Email,
    UserRole Role,
    bool Status
);

public sealed record Property(
    long Id,
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

public sealed record BookingVisit(
    long Id,
    long PropertyId,
    long TenantId,
    long DealerId,
    decimal VisitFee,
    DateTimeOffset ScheduledVisitTime,
    VisitStatus Status,
    VisitChargeStatus VisitChargeStatus,
    BrokerageStatus BrokerageStatus
);

public sealed record PropertyMedia(
    long MediaId,
    long PropertyId,
    MediaType MediaType,
    string Url
);

public sealed record Favorite(
    long FavoriteId,
    long TenantId,
    long PropertyId,
    DateTimeOffset CreatedDate
);

public sealed record Deal(
    long DealId,
    long TenantId,
    long DealerId,
    long PropertyId,
    decimal MonthlyRent,
    decimal BrokerageAmount,
    DealStatus Status
);

public sealed record Payment(
    long PaymentId,
    string PaymentReference,
    long UserId,
    decimal Amount,
    string PaymentType,
    string GatewayReference,
    PaymentStatus Status
);
