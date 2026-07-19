using Dapper;
using PropertyPlatform.Core;

namespace PropertyPlatform.Infrastructure.Models;

public sealed class BookingVisitRepository : BaseRepository
{
    public BookingVisitRepository(string connectionString) : base(connectionString)
    {
    }

    public async Task<IEnumerable<BookingVisit>> GetBookingVisitsAsync(long? tenantId = null, long? propertyId = null, long? dealerId = null)
    {
        var sql = @"SELECT * FROM BookingVisits WHERE 1=1";
        var parameters = new DynamicParameters();

        if (tenantId.HasValue)
        {
            sql += " AND TenantId = @TenantId";
            parameters.Add("TenantId", tenantId.Value);
        }

        if (propertyId.HasValue)
        {
            sql += " AND PropertyId = @PropertyId";
            parameters.Add("PropertyId", propertyId.Value);
        }

        if (dealerId.HasValue)
        {
            sql += " AND DealerId = @DealerId";
            parameters.Add("DealerId", dealerId.Value);
        }

        await using var connection = CreateConnection();
        await connection.OpenAsync();
        return await connection.QueryAsync<BookingVisit>(sql, parameters);
    }

    public async Task<BookingVisit?> GetBookingVisitByIdAsync(long id)
    {
        const string sql = "SELECT * FROM BookingVisits WHERE Id = @Id";
        await using var connection = CreateConnection();
        await connection.OpenAsync();
        return await connection.QuerySingleOrDefaultAsync<BookingVisit>(sql, new { Id = id });
    }

    public async Task CreateBookingVisitAsync(BookingVisit visit)
    {
        const string sql = @"INSERT INTO BookingVisits (Id, PropertyId, TenantId, DealerId, VisitFee, ScheduledVisitTime, Status, VisitChargeStatus, BrokerageStatus)
VALUES (@Id, @PropertyId, @TenantId, @DealerId, @VisitFee, @ScheduledVisitTime, @Status, @VisitChargeStatus, @BrokerageStatus);";
        await using var connection = CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(sql, visit);
    }
}
