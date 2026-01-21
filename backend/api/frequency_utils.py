from decimal import Decimal

DAYS_PER_FREQUENCY = {
    'daily': Decimal('1'),
    'weekly': Decimal('7'),
    'biweekly': Decimal('14'),
    '4-week': Decimal('28'),
    'monthly': Decimal('30'),
    'yearly': Decimal('365'),
}

FREQUENCY_CODES = {
    'daily': 'D',
    'weekly': 'W',
    'biweekly': 'B',
    '4-week': '4',
    'monthly': 'M',
    'yearly': 'Y',
}


def convert_amount(amount, from_freq, to_freq):
    """Convert amount from one frequency to another"""
    if from_freq == to_freq:
        return Decimal(str(amount))
    
    amount_decimal = Decimal(str(amount))
    from_days = DAYS_PER_FREQUENCY[from_freq]
    to_days = DAYS_PER_FREQUENCY[to_freq]
    
    daily_rate = amount_decimal / from_days
    result = daily_rate * to_days
    
    return result


def format_amount_display(amount):
    """Format amount to 2 decimals for display"""
    amount_decimal = Decimal(str(amount))
    rounded = amount_decimal.quantize(Decimal('0.01'))
    return str(rounded)


def calculate_pocket_monthly_equivalent(pocket_amount, pocket_freq, items):
    """Calculate monthly equivalent of pocket including all items"""
    monthly_total = convert_amount(pocket_amount, pocket_freq, 'monthly')
    
    for item in items:
        if not item.is_other:
            item_monthly = convert_amount(item.amount, item.frequency, 'monthly')
            monthly_total += item_monthly
    
    return monthly_total


def calculate_pocket_in_frequency(pocket_amount, pocket_freq, items, target_freq):
    """Calculate pocket amount in target frequency including all items"""
    monthly_total = calculate_pocket_monthly_equivalent(pocket_amount, pocket_freq, items)
    return convert_amount(monthly_total, 'monthly', target_freq)


def has_mixed_frequencies(pocket_freq, items):
    """Check if pocket and items have different frequencies"""
    if pocket_freq == 'monthly' and all(item.frequency == 'monthly' or item.is_other for item in items):
        return False
    
    for item in items:
        if not item.is_other and item.frequency != pocket_freq:
            return True
    
    return False