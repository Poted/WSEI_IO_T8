using System.ComponentModel.DataAnnotations;

namespace T8.Models;

public class Product
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string Unit { get; set; } = string.Empty;
    
    public DateTime? ExpiryDate { get; set; }
}

