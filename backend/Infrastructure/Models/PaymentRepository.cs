using Dapper;
using Dapper.Contrib.Extensions;
using PropertyPlatform.Core;

namespace PropertyPlatform.Infrastructure.Models;

public sealed class PaymentRepository : BaseRepository
{
    public PaymentRepository(string connectionString) : base(connectionString)
    {
    }

    public async Task CreatePaymentAsync(Payment payment)
    {
        await using var connection = CreateConnection();
        await connection.OpenAsync();
        await connection.InsertAsync(payment);
    }

    public async Task<IEnumerable<Payment>> GetPaymentsByUserIdAsync(long userId)
    {
        const string sql = "SELECT * FROM Payments WHERE UserId = @UserId";
        await using var connection = CreateConnection();
        await connection.OpenAsync();
        return await connection.QueryAsync<Payment>(sql, new { UserId = userId });
    }
}
