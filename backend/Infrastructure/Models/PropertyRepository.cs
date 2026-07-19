using Dapper;
using PropertyPlatform.Core;

namespace PropertyPlatform.Infrastructure.Models;

public sealed class PropertyRepository : BaseRepository
{
    public PropertyRepository(string connectionString) : base(connectionString)
    {
    }

    public async Task<IEnumerable<Property>> GetPropertiesAsync(decimal? minPrice = null, decimal? maxPrice = null, string? status = null, string? location = null)
    {
        var sql = @"SELECT * FROM Properties WHERE 1=1";
        var parameters = new DynamicParameters();

        if (minPrice.HasValue)
        {
            sql += " AND Price >= @MinPrice";
            parameters.Add("MinPrice", minPrice.Value);
        }

        if (maxPrice.HasValue)
        {
            sql += " AND Price <= @MaxPrice";
            parameters.Add("MaxPrice", maxPrice.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            sql += " AND Status = @Status";
            parameters.Add("Status", status);
        }

        if (!string.IsNullOrWhiteSpace(location))
        {
            sql += " AND Location LIKE @Location";
            parameters.Add("Location", $"%{location}%");
        }

        await using var connection = CreateConnection();
        await connection.OpenAsync();
        return await connection.QueryAsync<Property>(sql, parameters);
    }

    public async Task<Property?> GetPropertyByIdAsync(long id)
    {
        const string sql = "SELECT * FROM Properties WHERE Id = @Id";
        await using var connection = CreateConnection();
        await connection.OpenAsync();
        return await connection.QuerySingleOrDefaultAsync<Property>(sql, new { Id = id });
    }

    public async Task CreatePropertyAsync(Property property)
    {
        const string sql = @"INSERT INTO Properties (Id, Title, Description, VideoUrl, Price, AdvancePayment, Location, IsAvailable, Status, DealerId)
VALUES (@Id, @Title, @Description, @VideoUrl, @Price, @AdvancePayment, @Location, @IsAvailable, @Status, @DealerId);";

        await using var connection = CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(sql, property);
    }

    public async Task<bool> UpdatePropertyAsync(long id, Property updatedProperty)
    {
        const string sql = @"UPDATE Properties
                                SET Title = @Title,
                                    Description = @Description,
                                    VideoUrl = @VideoUrl,
                                    Price = @Price,
                                    AdvancePayment = @AdvancePayment,
                                    Location = @Location,
                                    IsAvailable = @IsAvailable,
                                    Status = @Status
                                WHERE Id = @Id";
        await using var connection = CreateConnection();
        await connection.OpenAsync();
        var rows = await connection.ExecuteAsync(sql, updatedProperty with { Id = id });
        return rows > 0;
    }

    public async Task<bool> DeletePropertyAsync(long id)
    {
        const string sql = "DELETE FROM Properties WHERE Id = @Id";
        await using var connection = CreateConnection();
        await connection.OpenAsync();
        var rows = await connection.ExecuteAsync(sql, new { Id = id });
        return rows > 0;
    }
}
