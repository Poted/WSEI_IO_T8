using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using T8.Data;
using T8.DTOs;
using Xunit;

namespace T8.Tests;

public class ProductsControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ProductsControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Find and remove the DbContext registration
                var dbContextDescriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));

                if (dbContextDescriptor != null)
                {
                    services.Remove(dbContextDescriptor);
                }

                // Remove the DbContext service registration as well
                var dbContextServiceDescriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(ApplicationDbContext));

                if (dbContextServiceDescriptor != null)
                {
                    services.Remove(dbContextServiceDescriptor);
                }

                // Add in-memory database for testing
                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDatabase_" + Guid.NewGuid().ToString());
                });
            });
        });

        _client = _factory.CreateClient();
        
        // Ensure database is created
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Database.EnsureCreated();
        }
    }

    [Fact]
    public async Task GetProducts_ReturnsOkResult()
    {
        // Act
        var response = await _client.GetAsync("/products");

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CreateProduct_WithValidData_ReturnsCreated()
    {
        // Arrange
        var product = new CreateProductDto
        {
            Name = "Test Product",
            Quantity = 5,
            Unit = "kg",
            ExpiryDate = "2024-12-31"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/products", product);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        
        var createdProduct = await response.Content.ReadFromJsonAsync<ProductDto>();
        Assert.NotNull(createdProduct);
        Assert.Equal(product.Name, createdProduct.Name);
        Assert.Equal(product.Quantity, createdProduct.Quantity);
        Assert.Equal(product.Unit, createdProduct.Unit);
        Assert.Equal(product.ExpiryDate, createdProduct.ExpiryDate);
    }

    [Fact]
    public async Task CreateProduct_WithInvalidDate_ReturnsBadRequest()
    {
        // Arrange
        var product = new CreateProductDto
        {
            Name = "Test Product",
            Quantity = 5,
            Unit = "kg",
            ExpiryDate = "invalid-date-format"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/products", product);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateProduct_WithValidDateFormat_ReturnsCreated()
    {
        // Arrange
        var product = new CreateProductDto
        {
            Name = "Milk",
            Quantity = 2,
            Unit = "l",
            ExpiryDate = "2024-12-31"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/products", product);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        
        var createdProduct = await response.Content.ReadFromJsonAsync<ProductDto>();
        Assert.NotNull(createdProduct);
        Assert.Equal("2024-12-31", createdProduct.ExpiryDate);
    }

    [Fact]
    public async Task CreateProduct_WithoutExpiryDate_ReturnsCreated()
    {
        // Arrange
        var product = new CreateProductDto
        {
            Name = "Sugar",
            Quantity = 1,
            Unit = "kg",
            ExpiryDate = null
        };

        // Act
        var response = await _client.PostAsJsonAsync("/products", product);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        
        var createdProduct = await response.Content.ReadFromJsonAsync<ProductDto>();
        Assert.NotNull(createdProduct);
        Assert.Null(createdProduct.ExpiryDate);
    }

    [Fact]
    public async Task CreateProduct_WithInvalidQuantity_ReturnsBadRequest()
    {
        // Arrange
        var product = new CreateProductDto
        {
            Name = "Test Product",
            Quantity = 0, // Invalid: must be > 0
            Unit = "kg",
            ExpiryDate = null
        };

        // Act
        var response = await _client.PostAsJsonAsync("/products", product);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateProduct_WithEmptyName_ReturnsBadRequest()
    {
        // Arrange
        var product = new CreateProductDto
        {
            Name = "", // Invalid: required field
            Quantity = 5,
            Unit = "kg",
            ExpiryDate = null
        };

        // Act
        var response = await _client.PostAsJsonAsync("/products", product);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetProductById_WithExistingId_ReturnsOk()
    {
        // Arrange - Create a product first
        var createDto = new CreateProductDto
        {
            Name = "Test Product",
            Quantity = 3,
            Unit = "szt",
            ExpiryDate = "2024-12-31"
        };

        var createResponse = await _client.PostAsJsonAsync("/products", createDto);
        var createdProduct = await createResponse.Content.ReadFromJsonAsync<ProductDto>();
        
        // Act
        var response = await _client.GetAsync($"/products/{createdProduct!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var product = await response.Content.ReadFromJsonAsync<ProductDto>();
        Assert.NotNull(product);
        Assert.Equal(createdProduct.Id, product.Id);
        Assert.Equal(createdProduct.Name, product.Name);
    }

    [Fact]
    public async Task GetProductById_WithNonExistingId_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync("/products/99999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateProduct_WithValidData_ReturnsNoContent()
    {
        // Arrange - Create a product first
        var createDto = new CreateProductDto
        {
            Name = "Original Name",
            Quantity = 5,
            Unit = "kg",
            ExpiryDate = null
        };

        var createResponse = await _client.PostAsJsonAsync("/products", createDto);
        var createdProduct = await createResponse.Content.ReadFromJsonAsync<ProductDto>();

        // Update the product
        var updateDto = new UpdateProductDto
        {
            Name = "Updated Name",
            Quantity = 10,
            Unit = "g",
            ExpiryDate = "2025-01-15"
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/products/{createdProduct!.Id}", updateDto);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify the update
        var getResponse = await _client.GetAsync($"/products/{createdProduct.Id}");
        var updatedProduct = await getResponse.Content.ReadFromJsonAsync<ProductDto>();
        Assert.NotNull(updatedProduct);
        Assert.Equal(updateDto.Name, updatedProduct.Name);
        Assert.Equal(updateDto.Quantity, updatedProduct.Quantity);
        Assert.Equal(updateDto.Unit, updatedProduct.Unit);
        Assert.Equal(updateDto.ExpiryDate, updatedProduct.ExpiryDate);
    }

    [Fact]
    public async Task UpdateProduct_WithInvalidDate_ReturnsBadRequest()
    {
        // Arrange - Create a product first
        var createDto = new CreateProductDto
        {
            Name = "Test Product",
            Quantity = 5,
            Unit = "kg",
            ExpiryDate = null
        };

        var createResponse = await _client.PostAsJsonAsync("/products", createDto);
        var createdProduct = await createResponse.Content.ReadFromJsonAsync<ProductDto>();

        // Update with invalid date
        var updateDto = new UpdateProductDto
        {
            Name = "Updated Name",
            Quantity = 10,
            Unit = "g",
            ExpiryDate = "not-a-date"
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/products/{createdProduct!.Id}", updateDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task DeleteProduct_WithExistingId_ReturnsNoContent()
    {
        // Arrange - Create a product first
        var createDto = new CreateProductDto
        {
            Name = "To Delete",
            Quantity = 1,
            Unit = "szt",
            ExpiryDate = null
        };

        var createResponse = await _client.PostAsJsonAsync("/products", createDto);
        var createdProduct = await createResponse.Content.ReadFromJsonAsync<ProductDto>();

        // Act
        var response = await _client.DeleteAsync($"/products/{createdProduct!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify deletion
        var getResponse = await _client.GetAsync($"/products/{createdProduct.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task DeleteProduct_WithNonExistingId_ReturnsNotFound()
    {
        // Act
        var response = await _client.DeleteAsync("/products/99999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetProducts_ReturnsProductsSortedByExpiryDate()
    {
        // Arrange - Create multiple products with different expiry dates
        var products = new[]
        {
            new CreateProductDto { Name = "Product 1", Quantity = 1, Unit = "kg", ExpiryDate = "2024-12-31" },
            new CreateProductDto { Name = "Product 2", Quantity = 2, Unit = "kg", ExpiryDate = "2024-06-15" },
            new CreateProductDto { Name = "Product 3", Quantity = 3, Unit = "kg", ExpiryDate = null },
            new CreateProductDto { Name = "Product 4", Quantity = 4, Unit = "kg", ExpiryDate = "2024-03-01" }
        };

        foreach (var product in products)
        {
            await _client.PostAsJsonAsync("/products", product);
        }

        // Act
        var response = await _client.GetAsync("/products");

        // Assert
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<List<ProductDto>>();
        Assert.NotNull(result);
        Assert.True(result.Count >= 4);

        // Verify sorting: products with dates should be sorted earliest first, null dates last
        var withDates = result.Where(p => p.ExpiryDate != null).ToList();
        for (int i = 1; i < withDates.Count; i++)
        {
            Assert.True(DateTime.Parse(withDates[i - 1].ExpiryDate!) <= DateTime.Parse(withDates[i].ExpiryDate!));
        }
    }
}
