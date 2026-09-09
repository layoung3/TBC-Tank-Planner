using System.Text.Json.Serialization;
using TbcTankPlanner.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSingleton<ItemDataService>();
builder.Services.AddSingleton<EnchantDataService>();
builder.Services.AddSingleton<GemDataService>();
builder.Services.AddSingleton<ItemSetDataService>();
builder.Services.AddSingleton<CalculationService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactDevClient", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseHttpsRedirection();

app.UseCors("ReactDevClient");

app.MapControllers();

app.Run();