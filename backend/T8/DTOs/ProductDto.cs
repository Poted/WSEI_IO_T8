using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace T8.DTOs;

public class ProductDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("quantity")]
    public int Quantity { get; set; }
    
    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;
    
    [JsonPropertyName("expiry_date")]
    public string? ExpiryDate { get; set; }
}

public class CreateProductDto
{
    [Required(ErrorMessage = "Product name is required")]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Product name must be between 1 and 200 characters")]
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Quantity is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
    [JsonPropertyName("quantity")]
    public int Quantity { get; set; }
    
    [Required(ErrorMessage = "Unit is required")]
    [StringLength(20, MinimumLength = 1, ErrorMessage = "Unit must be between 1 and 20 characters")]
    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;
    
    [JsonPropertyName("expiry_date")]
    public string? ExpiryDate { get; set; }
}

public class UpdateProductDto
{
    [Required(ErrorMessage = "Product name is required")]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Product name must be between 1 and 200 characters")]
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Quantity is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
    [JsonPropertyName("quantity")]
    public int Quantity { get; set; }
    
    [Required(ErrorMessage = "Unit is required")]
    [StringLength(20, MinimumLength = 1, ErrorMessage = "Unit must be between 1 and 20 characters")]
    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;
    
    [JsonPropertyName("expiry_date")]
    public string? ExpiryDate { get; set; }
}

