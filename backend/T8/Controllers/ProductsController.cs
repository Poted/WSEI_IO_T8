using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using T8.Data;
using T8.DTOs;
using T8.Models;

namespace T8.Controllers;

[ApiController]
[Route("[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(ApplicationDbContext context, ILogger<ProductsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/products
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts(
        [FromQuery] string? filter = null,
        [FromQuery] string? sortOrder = "asc")
    {
        try
        {
            var today = DateTime.Today;
            var query = _context.Products.AsQueryable();

            // Apply filtering based on expiry date
            if (!string.IsNullOrEmpty(filter))
            {
                switch (filter.ToLower())
                {
                    case "withdate":
                        query = query.Where(p => p.ExpiryDate != null);
                        break;
                    case "withoutdate":
                        query = query.Where(p => p.ExpiryDate == null);
                        break;
                    case "expired":
                        query = query.Where(p => p.ExpiryDate != null && p.ExpiryDate < today);
                        break;
                    case "expiringsoon":
                        var nextWeek = today.AddDays(7);
                        query = query.Where(p => p.ExpiryDate != null && 
                            p.ExpiryDate >= today && p.ExpiryDate <= nextWeek);
                        break;
                    case "expiringthismonth":
                        var endOfMonth = new DateTime(today.Year, today.Month, DateTime.DaysInMonth(today.Year, today.Month));
                        query = query.Where(p => p.ExpiryDate != null && 
                            p.ExpiryDate >= today && p.ExpiryDate <= endOfMonth);
                        break;
                    case "valid":
                        query = query.Where(p => p.ExpiryDate == null || p.ExpiryDate >= today);
                        break;
                }
            }

            // Apply sorting
            if (sortOrder?.ToLower() == "desc")
            {
                query = query.OrderByDescending(p => p.ExpiryDate == null ? DateTime.MinValue : p.ExpiryDate);
            }
            else
            {
                // Default: ascending (earliest first), null dates last
                query = query.OrderBy(p => p.ExpiryDate == null ? DateTime.MaxValue : p.ExpiryDate);
            }

            var products = await query.ToListAsync();

            return Ok(products.Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Quantity = p.Quantity,
                Unit = p.Unit,
                ExpiryDate = p.ExpiryDate?.ToString("yyyy-MM-dd")
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products");
            return StatusCode(500, "An error occurred while retrieving products");
        }
    }

    // GET: api/products/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(int id)
    {
        try
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound();
            }

            return Ok(new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Quantity = product.Quantity,
                Unit = product.Unit,
                ExpiryDate = product.ExpiryDate?.ToString("yyyy-MM-dd")
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product with id {ProductId}", id);
            return StatusCode(500, "An error occurred while retrieving the product");
        }
    }

    // POST: api/products
    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        
        // Validate and parse expiry date
        DateTime? expiryDate = null;
        if (!string.IsNullOrWhiteSpace(dto.ExpiryDate))
        {
            if (!DateTime.TryParseExact(dto.ExpiryDate.Trim(), "yyyy-MM-dd", 
                System.Globalization.CultureInfo.InvariantCulture, 
                System.Globalization.DateTimeStyles.None, out var parsedDate))
            {
                ModelState.AddModelError(nameof(dto.ExpiryDate), 
                    "Expiry date must be in the format yyyy-MM-dd (e.g., 2024-12-31)");
                return BadRequest(ModelState);
            }
            expiryDate = parsedDate;
        }
        
        try
        {

            var product = new Product
            {
                Name = dto.Name.Trim(),
                Quantity = dto.Quantity,
                Unit = dto.Unit,
                ExpiryDate = expiryDate
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            var productDto = new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Quantity = product.Quantity,
                Unit = product.Unit,
                ExpiryDate = product.ExpiryDate?.ToString("yyyy-MM-dd")
            };

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, productDto);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error while creating product");
            return StatusCode(500, "An error occurred while saving the product to the database");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, "An error occurred while creating the product");
        }
    }

    // PUT: api/products/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        
        // Validate and parse expiry date
        DateTime? expiryDate = null;
        if (!string.IsNullOrWhiteSpace(dto.ExpiryDate))
        {
            if (!DateTime.TryParseExact(dto.ExpiryDate.Trim(), "yyyy-MM-dd", 
                System.Globalization.CultureInfo.InvariantCulture, 
                System.Globalization.DateTimeStyles.None, out var parsedDate))
            {
                ModelState.AddModelError(nameof(dto.ExpiryDate), 
                    "Expiry date must be in the format yyyy-MM-dd (e.g., 2024-12-31)");
                return BadRequest(ModelState);
            }
            expiryDate = parsedDate;
        }
        
        try
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound();
            }

            product.Name = dto.Name.Trim();
            product.Quantity = dto.Quantity;
            product.Unit = dto.Unit;
            product.ExpiryDate = expiryDate;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await ProductExistsAsync(id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error while updating product with id {ProductId}", id);
            return StatusCode(500, "An error occurred while updating the product in the database");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product with id {ProductId}", id);
            return StatusCode(500, "An error occurred while updating the product");
        }
    }

    // DELETE: api/products/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        try
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error while deleting product with id {ProductId}", id);
            return StatusCode(500, "An error occurred while deleting the product from the database");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product with id {ProductId}", id);
            return StatusCode(500, "An error occurred while deleting the product");
        }
    }

    private async Task<bool> ProductExistsAsync(int id)
    {
        return await _context.Products.AnyAsync(e => e.Id == id);
    }
}

