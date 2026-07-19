using Dapper;
using Dapper.Contrib.Extensions;
using PropertyPlatform.Core;

namespace PropertyPlatform.Infrastructure.Models;

public sealed class UserRepository : BaseRepository
{
    public UserRepository(string connectionString) : base(connectionString)
    {
    }

    public async Task<User?> GetUserByIdAsync(long id)
    {
        const string sql = "SELECT * FROM Users WHERE Id = @Id";
        await using var connection = CreateConnection();
        await connection.OpenAsync();
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { Id = id });
    }

    public async Task<IEnumerable<User>> GetUsersAsync()
    {
        const string sql = "SELECT * FROM Users";
        await using var connection = CreateConnection();
        await connection.OpenAsync();
        return await connection.QueryAsync<User>(sql);
    }

    public async Task CreateUserAsync(User user)
    {
        await using var connection = CreateConnection();
        await connection.OpenAsync();
        await connection.InsertAsync(user);
    }
}
