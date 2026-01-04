using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using T8.Data;

namespace T8
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddControllers()
                .ConfigureApiBehaviorOptions(options =>
                {
                    // Return validation errors in a consistent format
                    options.InvalidModelStateResponseFactory = context =>
                    {
                        var errors = context.ModelState
                            .Where(x => x.Value?.Errors.Count > 0)
                            .SelectMany(x => x.Value!.Errors)
                            .Select(x => x.ErrorMessage)
                            .ToList();
                        
                        return new BadRequestObjectResult(new { errors });
                    };
                });
            
            // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
            builder.Services.AddOpenApi();

            // Configure SQLite database
            var dbDirectory = AppContext.BaseDirectory;
            var dbPath = Path.Combine(dbDirectory, "products.db");
            
            Directory.CreateDirectory(Path.GetDirectoryName(dbPath) ?? dbDirectory);
            
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                ?? $"Data Source={dbPath}";
            
            if (connectionString.Contains("products.db") && !Path.IsPathRooted(connectionString))
            {
                connectionString = $"Data Source={dbPath}";
            }
            
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlite(connectionString));

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });

            var app = builder.Build();

            try
            {
                using (var scope = app.Services.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    dbContext.Database.EnsureCreated();
                }
            }
            catch (Exception ex)
            {
                var logger = app.Services.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "Failed to initialize database");
            }

            app.MapOpenApi();
            
            // Serve Swagger UI HTML page
            app.MapGet("/swagger", () => Results.Content(@"
<!DOCTYPE html>
<html>
<head>
    <title>Products API - Swagger UI</title>
    <link rel=""stylesheet"" type=""text/css"" href=""https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css"" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
    </style>
</head>
<body>
    <div id=""swagger-ui""></div>
    <script src=""https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js""></script>
    <script src=""https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-standalone-preset.js""></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/openapi/v1.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
                plugins: [SwaggerUIBundle.plugins.DownloadUrl],
                layout: ""StandaloneLayout""
            });
        };
    </script>
</body>
</html>
", "text/html"));

            
            app.UseCors("AllowFrontend");

            var frontendPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "frontend");
            if (Directory.Exists(frontendPath))
            {
                app.UseStaticFiles(new Microsoft.AspNetCore.Builder.StaticFileOptions
                {
                    FileProvider = new PhysicalFileProvider(frontendPath),
                    RequestPath = ""
                });
            }

            app.UseHttpsRedirection();

            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
