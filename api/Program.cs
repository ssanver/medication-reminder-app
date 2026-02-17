using api.data;
using api.services.medication_persistence;
using api.middleware;
using api.services.notification_persistence;
using api.services.security;
using api_application.medication_application;
using api_application.notification_application;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is not configured.");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));
builder.Services.AddScoped<IAuditLogger, AuditLogger>();
builder.Services.AddScoped<IMedicationRepository, EfMedicationRepository>();
builder.Services.AddScoped<MedicationApplicationService>();
builder.Services.AddScoped<INotificationDeliveryRepository, EfNotificationDeliveryRepository>();
builder.Services.AddScoped<INotificationActionRepository, EfNotificationActionRepository>();
builder.Services.AddScoped<NotificationDeliveryApplicationService>();
builder.Services.AddScoped<NotificationActionApplicationService>();
builder.Logging.AddJsonConsole();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program;
