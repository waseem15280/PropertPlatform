using Dapper;
using Microsoft.Data.SqlClient;

namespace PropertyPlatform.Infrastructure;

public sealed class DapperDatabase
{
    private readonly string _connectionString;

    public DapperDatabase(string connectionString)
    {
        _connectionString = connectionString;
    }

    private SqlConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task InitializeAsync()
    {
        await using var connection = CreateConnection();
        await connection.OpenAsync();

        await connection.ExecuteAsync(@"
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id bigint IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Mobile NVARCHAR(50) NOT NULL,
        Email NVARCHAR(200) NOT NULL UNIQUE,
        Role NVARCHAR(50) NOT NULL,
        Status BIT NOT NULL
    );
END

IF OBJECT_ID('dbo.Properties', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Properties (
        Id bigint IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(200) NOT NULL,
        Description NVARCHAR(MAX) NOT NULL,
        VideoUrl NVARCHAR(500) NULL,
        Price DECIMAL(18,2) NOT NULL,
        AdvancePayment DECIMAL(18,2) NOT NULL,
        Location NVARCHAR(200) NOT NULL,
        IsAvailable BIT NOT NULL,
        Status NVARCHAR(50) NOT NULL,
        DealerId bigint NOT NULL,
        CONSTRAINT FK_Properties_Users FOREIGN KEY (DealerId) REFERENCES dbo.Users(Id)
    );
END

IF OBJECT_ID('dbo.BookingVisits', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.BookingVisits (
        Id bigint IDENTITY(1,1) PRIMARY KEY,
        PropertyId bigint NOT NULL,
        TenantId bigint NOT NULL,
        DealerId bigint NOT NULL,
        VisitFee DECIMAL(18,2) NOT NULL,
        ScheduledVisitTime DATETIMEOFFSET NOT NULL,
        Status NVARCHAR(50) NOT NULL,
        VisitChargeStatus NVARCHAR(50) NOT NULL,
        BrokerageStatus NVARCHAR(50) NOT NULL,
        CONSTRAINT FK_BookingVisits_Properties FOREIGN KEY (PropertyId) REFERENCES dbo.Properties(Id),
        CONSTRAINT FK_BookingVisits_TenantUsers FOREIGN KEY (TenantId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_BookingVisits_DealerUsers FOREIGN KEY (DealerId) REFERENCES dbo.Users(Id)
    );
END

IF OBJECT_ID('dbo.PropertyMedia', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PropertyMedia (
        MediaId bigint IDENTITY(1,1) PRIMARY KEY,
        PropertyId bigint NOT NULL,
        MediaType NVARCHAR(50) NOT NULL,
        Url NVARCHAR(500) NOT NULL,
        CONSTRAINT FK_PropertyMedia_Properties FOREIGN KEY (PropertyId) REFERENCES dbo.Properties(Id)
    );
END

IF OBJECT_ID('dbo.Favorites', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Favorites (
        FavoriteId bigint IDENTITY(1,1) PRIMARY KEY,
        TenantId bigint NOT NULL,
        PropertyId bigint NOT NULL,
        CreatedDate DATETIMEOFFSET NOT NULL,
        CONSTRAINT FK_Favorites_TenantUsers FOREIGN KEY (TenantId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Favorites_Properties FOREIGN KEY (PropertyId) REFERENCES dbo.Properties(Id)
    );
END

IF OBJECT_ID('dbo.Deals', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Deals (
        DealId bigint IDENTITY(1,1) PRIMARY KEY,
        TenantId bigint NOT NULL,
        DealerId bigint NOT NULL,
        PropertyId bigint NOT NULL,
        MonthlyRent DECIMAL(18,2) NOT NULL,
        BrokerageAmount DECIMAL(18,2) NOT NULL,
        Status NVARCHAR(50) NOT NULL,
        CONSTRAINT FK_Deals_TenantUsers FOREIGN KEY (TenantId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Deals_DealerUsers FOREIGN KEY (DealerId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Deals_Properties FOREIGN KEY (PropertyId) REFERENCES dbo.Properties(Id)
    );
END

IF OBJECT_ID('dbo.Payments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Payments (
        PaymentId bigint IDENTITY(1,1) PRIMARY KEY ,
        PaymentReference NVARCHAR(200) NOT NULL,
        UserId bigint NOT NULL,
        Amount DECIMAL(18,2) NOT NULL,
        PaymentType NVARCHAR(50) NOT NULL,
        GatewayReference NVARCHAR(200) NOT NULL,
        Status NVARCHAR(50) NOT NULL,
        CONSTRAINT FK_Payments_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
    );
END
");

        await connection.ExecuteAsync(@"
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Id = @DealerId)
BEGIN
    INSERT INTO dbo.Users (Id, Name, Mobile, Email, Role, Status)
    VALUES (@DealerId, @DealerName, @DealerMobile, @DealerEmail, 'Dealer', 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Id = @TenantId)
BEGIN
    INSERT INTO dbo.Users (Id, Name, Mobile, Email, Role, Status)
    VALUES (@TenantId, @TenantName, @TenantMobile, @TenantEmail, 'Tenant', 1);
END
", new
        {
            DealerId = 1,
            DealerName = "Sample Dealer",
            DealerMobile = "1234567890",
            DealerEmail = "dealer@example.com",
            TenantId = 2,
            TenantName = "Sample Tenant",
            TenantMobile = "0987654321",
            TenantEmail = "tenant@example.com"
        });

        await connection.ExecuteAsync(@"
IF NOT EXISTS (SELECT 1 FROM dbo.Properties WHERE Id = @Property1Id)
BEGIN
    INSERT INTO dbo.Properties (Id, Title, Description, VideoUrl, Price, AdvancePayment, Location, IsAvailable, Status, DealerId)
    VALUES (@Property1Id, @Property1Title, @Property1Description, @Property1VideoUrl, @Property1Price, @Property1AdvancePayment, @Property1Location, 1, 'Available', @DealerId);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Properties WHERE Id = @Property2Id)
BEGIN
    INSERT INTO dbo.Properties (Id, Title, Description, VideoUrl, Price, AdvancePayment, Location, IsAvailable, Status, DealerId)
    VALUES (@Property2Id, @Property2Title, @Property2Description, @Property2VideoUrl, @Property2Price, @Property2AdvancePayment, @Property2Location, 1, 'Available', @DealerId);
END
", new
        {
            Property1Id = 1,
            Property1Title = "40 Foota flat",
            Property1Description = "3 BHK flat with 40 foota views",
            Property1VideoUrl = "https://example.com/video/condo",
            Property1Price = 250000m,
            Property1AdvancePayment = 25000m,
            Property1Location = "Downtown",
            Property2Id = 2,
            Property2Title = "Family House",
            Property2Description = "Spacious 4BR home with backyard",
            Property2VideoUrl = "https://example.com/video/house",
            Property2Price = 450000m,
            Property2AdvancePayment = 45000m,
            Property2Location = "Suburbs",
            DealerId = 1
        });
    }
}
