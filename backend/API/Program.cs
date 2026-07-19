using PropertyPlatform.Core;
using PropertyPlatform.Infrastructure;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://localhost:5000");
Console.WriteLine("Starting PropertyPlatform API...");

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["ConnectionStrings:DefaultConnection"]
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Connection string 'DefaultConnection' was not found. Set it in appsettings.json or an environment variable.");
}

builder.Services.AddDapperInfrastructure(connectionString);

builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalAngular", policy =>
    {
        policy.WithOrigins("http://localhost:5000", "http://localhost:4200", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

builder.Services.AddControllers();
//builder.Services.AddControllers()
//    .AddJsonOptions(options =>
//    {
//        options.JsonSerializerOptions.Converters.Add(
//            new JsonStringEnumConverter());
//    });

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<DapperDatabase>();
    await database.InitializeAsync();
}

app.UseCors("LocalAngular");
app.MapControllers();
app.MapGet("/", () => Results.Ok(new { message = "PropertyPlatform API is running." }));

app.Run();
