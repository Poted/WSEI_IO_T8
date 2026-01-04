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
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
    {
        try
        {
            var products = await _context.Products
                .OrderBy(p => p.ExpiryDate == null ? DateTime.MaxValue : p.ExpiryDate)
                .ToListAsync();

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
        
        try
        {

            var product = new Product
            {
                Name = dto.Name.Trim(),
                Quantity = dto.Quantity,
                Unit = dto.Unit,
                ExpiryDate = !string.IsNullOrEmpty(dto.ExpiryDate) && DateTime.TryParse(dto.ExpiryDate, out var date) 
                    ? date 
                    : null
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
            product.ExpiryDate = !string.IsNullOrEmpty(dto.ExpiryDate) && DateTime.TryParse(dto.ExpiryDate, out var date) 
                ? date 
                : null;

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

