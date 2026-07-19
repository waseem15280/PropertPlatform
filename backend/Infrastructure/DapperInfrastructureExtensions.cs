using Microsoft.Extensions.DependencyInjection;
using PropertyPlatform.Infrastructure.Models;

namespace PropertyPlatform.Infrastructure;

public static class DapperInfrastructureExtensions
{
    public static IServiceCollection AddDapperInfrastructure(this IServiceCollection services, string connectionString)
    {
        services.AddSingleton(new DapperDatabase(connectionString));
        services.AddSingleton(new UserRepository(connectionString));
        services.AddSingleton(new PropertyRepository(connectionString));
        services.AddSingleton(new BookingVisitRepository(connectionString));
        services.AddSingleton(new PaymentRepository(connectionString));
        return services;
    }
}
