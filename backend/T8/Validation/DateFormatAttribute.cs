using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace T8.Validation;

public class DateFormatAttribute : ValidationAttribute
{
    private readonly string _expectedFormat = "yyyy-MM-dd";
    
    public DateFormatAttribute()
    {
        ErrorMessage = "Expiry date must be in the format yyyy-MM-dd (e.g., 2024-12-31)";
    }
    
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        // If the value is null or empty, it's valid (since ExpiryDate is optional)
        if (value == null || (value is string str && string.IsNullOrWhiteSpace(str)))
        {
            return ValidationResult.Success;
        }
        
        // If value is not a string, it's invalid
        if (value is not string dateString)
        {
            return new ValidationResult(ErrorMessage);
        }
        
        // Try to parse with the expected format
        if (DateTime.TryParseExact(dateString.Trim(), _expectedFormat, 
            CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
        {
            return ValidationResult.Success;
        }
        
        return new ValidationResult(ErrorMessage);
    }
}
