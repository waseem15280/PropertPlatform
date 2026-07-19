using System.Data;
using Microsoft.Data.SqlClient;

namespace PropertyPlatform.Infrastructure.Models;

public abstract class BaseRepository
{
    protected readonly string ConnectionString;

    protected BaseRepository(string connectionString)
    {
        ConnectionString = connectionString;
    }

    protected SqlConnection CreateConnection() => new SqlConnection(ConnectionString);
}
