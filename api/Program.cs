using api.data;
using api.services.medication_persistence;
using api.middleware;
using api.services.notification_persistence;
using api.services.medicine_catalog_persistence;
using api.services.security;
using api.services.auth;
using api_application.medication_application;
using api_application.medicine_catalog_application;
using api_application.notification_application;
using api_application.guest_simulation_application;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var connectionString =
    Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "DB connection must be configured via DB_CONNECTION_STRING, ConnectionStrings__DefaultConnection, or ConnectionStrings:DefaultConnection.");
const string WebCorsPolicy = "web-cors";

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy(WebCorsPolicy, policy =>
    {
        policy
            .WithOrigins(
                "http://127.0.0.1:8081",
                "http://localhost:8081",
                "http://127.0.0.1:19006",
                "http://localhost:19006")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));
var jwtConfig = JwtTokenService.ReadJwtConfig(builder.Configuration);
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtConfig.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtConfig.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtConfig.SecretKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});
builder.Services.AddScoped<IAuditLogger, AuditLogger>();
builder.Services.AddScoped<IEmailDispatchService, SmtpEmailDispatchService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddHostedService<MedicineCatalogSeeder>();
builder.Services.AddScoped<IMedicationRepository, EfMedicationRepository>();
builder.Services.AddScoped<MedicationApplicationService>();
builder.Services.AddScoped<IMedicineCatalogRepository, EfMedicineCatalogRepository>();
builder.Services.AddScoped<MedicineCatalogApplicationService>();
builder.Services.AddScoped<INotificationDeliveryRepository, EfNotificationDeliveryRepository>();
builder.Services.AddScoped<INotificationActionRepository, EfNotificationActionRepository>();
builder.Services.AddScoped<NotificationDeliveryApplicationService>();
builder.Services.AddScoped<NotificationActionApplicationService>();
builder.Services.AddSingleton<GuestSimulationApplicationService>();
builder.Logging.AddJsonConsole();

var app = builder.Build();

var swaggerEnabled = app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Swagger:Enabled");
if (swaggerEnabled)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseCors(WebCorsPolicy);
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program;
